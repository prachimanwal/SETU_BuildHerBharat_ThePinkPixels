import assert from 'node:assert/strict';
import http from 'node:http';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from '../src/app';
import { ENV } from '../src/config/env';
import { User } from '../src/models/User';
import { Employer } from '../src/models/Employer';
import { CompanyVerificationDocument } from '../src/models/CompanyVerificationDocument';
import { HiringPreference } from '../src/models/HiringPreference';
import { Opportunity } from '../src/models/Opportunity';
import { Application } from '../src/models/Application';
import { Interview } from '../src/models/Interview';
import { RecruitmentNotification } from '../src/models/RecruitmentNotification';
import { Portfolio } from '../src/models/Portfolio';
import { Resume } from '../src/models/Resume';
import { UploadedResumeFile } from '../src/models/UploadedResumeFile';

function matchesFilter(doc: any, filter: any = {}): boolean {
  if (!filter || Object.keys(filter).length === 0) return true;
  for (const [k, v] of Object.entries(filter)) {
    if (k === '$or' && Array.isArray(v)) {
      if (!v.some((sub) => matchesFilter(doc, sub))) return false;
      continue;
    }
    const actual = k.split('.').reduce((acc: any, part) => (acc == null ? undefined : acc[part]), doc);
    if (v && typeof v === 'object' && !(v instanceof mongoose.Types.ObjectId) && !(v instanceof RegExp)) {
      if ('$in' in v && Array.isArray((v as any).$in)) {
        const list = (v as any).$in.map((x: any) => String(x));
        if (!list.includes(String(actual))) return false;
      } else if ('$ne' in v) {
        if (actual === (v as any).$ne) return false;
      } else if ('$regex' in v) {
        const rx = new RegExp((v as any).$regex, (v as any).$options || '');
        if (!rx.test(String(actual || ''))) return false;
      }
      continue;
    }
    if (String(actual ?? '') !== String(v ?? '')) return false;
  }
  return true;
}

function attachInMemoryModel(Model: any, store: any[], populateResolvers: Record<string, () => any[]> = {}) {
  const wrapDoc = (doc: any) => {
    if (!doc._id) doc._id = new mongoose.Types.ObjectId();
    if (!doc.createdAt) doc.createdAt = new Date();
    doc.updatedAt = new Date();
    if (typeof doc.save !== 'function') {
      doc.save = async function () {
        this.updatedAt = new Date();
        const idx = store.findIndex((x) => String(x._id) === String(this._id));
        if (idx >= 0) store[idx] = this;
        else store.push(this);
        return this;
      };
    }
    if (typeof doc.toObject !== 'function') {
      doc.toObject = function () {
        const copy: any = {};
        for (const [key, val] of Object.entries(this)) {
          if (typeof val !== 'function') copy[key] = val;
        }
        return copy;
      };
    }
    return doc;
  };

  const makeQuery = (items: any, isSingle = false): any => {
    let selectedFields = '';
    const populates: string[] = [];

    const resolvePop = (item: any) => {
      if (!item) return item;
      const clone: any = typeof item.toObject === 'function' ? { ...item.toObject(), save: item.save, toObject: item.toObject, comparePassword: item.comparePassword } : { ...item };
      for (const field of populates) {
        const resolver = populateResolvers[field];
        if (resolver && clone[field]) {
          const idStr = String(clone[field]._id || clone[field]);
          const found = resolver().find((r) => String(r._id) === idStr);
          if (found) clone[field] = found;
        }
      }
      if (selectedFields.includes('-recruiterNotes')) {
        delete clone.recruiterNotes;
      }
      if (selectedFields.includes('-passwordHash')) {
        delete clone.passwordHash;
      }
      return clone;
    };

    const q: any = {
      select(f: string) {
        selectedFields += ` ${f}`;
        return q;
      },
      populate(field: string) {
        populates.push(field);
        return q;
      },
      sort() {
        return q;
      },
      limit(n: number) {
        if (Array.isArray(items)) items = items.slice(0, n);
        return q;
      },
      lean() {
        return q;
      },
      then(resolve: any, reject: any) {
        const out = isSingle ? resolvePop(items) : items.map(resolvePop);
        return Promise.resolve(out).then(resolve, reject);
      }
    };
    return q;
  };

  Model.prototype.save = async function () {
    const plain: any = this.toObject ? this.toObject() : { ...this };
    if (!plain._id) plain._id = new mongoose.Types.ObjectId();
    if (!plain.createdAt) plain.createdAt = new Date();
    plain.updatedAt = new Date();
    if (this.comparePassword) plain.comparePassword = this.comparePassword.bind(plain);
    wrapDoc(plain);
    const idx = store.findIndex((x) => String(x._id) === String(plain._id));
    if (idx >= 0) store[idx] = plain;
    else store.push(plain);
    return plain;
  };

  Model.create = async (data: any) => {
    const inst = new Model(data);
    return inst.save();
  };
  Model.find = (filter?: any) => makeQuery(store.filter((d) => matchesFilter(d, filter)), false);
  Model.findOne = (filter?: any) => makeQuery(store.find((d) => matchesFilter(d, filter)) || null, true);
  Model.findById = (id: any) => makeQuery(store.find((d) => String(d._id) === String(id)) || null, true);
  Model.countDocuments = async (filter?: any) => store.filter((d) => matchesFilter(d, filter)).length;
  Model.findByIdAndDelete = async (id: any) => {
    const idx = store.findIndex((d) => String(d._id) === String(id));
    if (idx >= 0) return store.splice(idx, 1)[0];
    return null;
  };
  Model.findByIdAndUpdate = async (id: any, update: any) => {
    const doc = store.find((d) => String(d._id) === String(id));
    if (!doc) return null;
    applyUpdate(doc, update);
    return doc;
  };
  Model.findOneAndUpdate = async (filter: any, update: any, opts?: any) => {
    let doc = store.find((d) => matchesFilter(d, filter));
    if (!doc && opts?.upsert) {
      doc = wrapDoc({ ...filter });
      store.push(doc);
    }
    if (!doc) return null;
    applyUpdate(doc, update);
    return doc;
  };
  Model.updateMany = async (filter: any, update: any) => {
    store.filter((d) => matchesFilter(d, filter)).forEach((d) => applyUpdate(d, update));
    return { modifiedCount: 1 };
  };
  Model.deleteMany = async (filter: any) => {
    for (let i = store.length - 1; i >= 0; i--) {
      if (matchesFilter(store[i], filter)) store.splice(i, 1);
    }
    return { deletedCount: 1 };
  };
}

function applyUpdate(doc: any, update: any) {
  if (!update) return;
  const setObj = update.$set || (!update.$push ? update : {});
  for (const [k, v] of Object.entries(setObj)) {
    if (k.startsWith('$')) continue;
    const parts = k.split('.');
    let cur = doc;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = v;
  }
  if (update.$push) {
    for (const [k, v] of Object.entries(update.$push)) {
      if (!Array.isArray(doc[k])) doc[k] = [];
      doc[k].push(v);
    }
  }
  doc.updatedAt = new Date();
}

function installInMemoryEmployerStores() {
  const users: any[] = [];
  const employers: any[] = [];
  const docs: any[] = [];
  const prefs: any[] = [];
  const opps: any[] = [];
  const apps: any[] = [];
  const interviews: any[] = [];
  const notifs: any[] = [];
  const portfolios: any[] = [];
  const resumes: any[] = [];
  const uploadedResumes: any[] = [];

  Object.defineProperty(mongoose.connection, 'readyState', {
    configurable: true,
    get: () => 1
  });

  attachInMemoryModel(User, users);
  attachInMemoryModel(Employer, employers, { userId: () => users });
  attachInMemoryModel(CompanyVerificationDocument, docs);
  attachInMemoryModel(HiringPreference, prefs);
  attachInMemoryModel(Opportunity, opps, { employerId: () => users });
  attachInMemoryModel(Application, apps, {
    opportunityId: () => opps,
    seekerId: () => users,
    employerId: () => users
  });
  attachInMemoryModel(Interview, interviews, {
    opportunityId: () => opps,
    candidateId: () => users,
    applicationId: () => apps
  });
  attachInMemoryModel(RecruitmentNotification, notifs);
  attachInMemoryModel(Portfolio, portfolios);
  attachInMemoryModel(Resume, resumes);
  attachInMemoryModel(UploadedResumeFile, uploadedResumes);
}

async function run() {
  console.log('=== SETU Employer Portal End-to-End Verification ===\n');

  let usingRealMongo = false;
  try {
    await mongoose.connect(ENV.MONGODB_URI, { serverSelectionTimeoutMS: 2500 });
    usingRealMongo = true;
    console.log('  • Connected to live MongoDB for full Employer Portal verification');
  } catch {
    console.log('  • Local MongoDB unavailable — using in-memory Mongoose store for end-to-end route verification');
    installInMemoryEmployerStores();
  }

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const addr = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  const suffix = `test_emp_${Date.now()}`;
  const empEmail = `${suffix}@company.test`;
  const emp2Email = `${suffix}_other@company.test`;
  const seekerEmail = `${suffix}_seeker@user.test`;
  const adminEmail = `${suffix}_admin@setu.test`;

  const createdUserIds: mongoose.Types.ObjectId[] = [];
  let createdJobId = '';
  let createdDocId = '';
  let createdPrefId = '';
  let createdAppId = '';
  let createdInterviewId = '';

  const jsonReq = async (path: string, opts: { method?: string; token?: string; body?: any } = {}) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method: opts.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {})
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
    return { status: res.status, json };
  };

  try {
    // 1. Register Employer 1, Employer 2 (for cross-company isolation), and Seeker
    const empReg = await jsonReq('/api/auth/register', {
      method: 'POST',
      body: { name: 'Shakti Innovations', email: empEmail, password: 'Password123!', role: 'employer' }
    });
    assert.equal(empReg.status, 201);
    const empToken = empReg.json.data.token;
    const empId = empReg.json.data.user._id || empReg.json.data.user.id;
    createdUserIds.push(new mongoose.Types.ObjectId(empId));

    const emp2Reg = await jsonReq('/api/auth/register', {
      method: 'POST',
      body: { name: 'Other Corp', email: emp2Email, password: 'Password123!', role: 'employer' }
    });
    assert.equal(emp2Reg.status, 201);
    const emp2Token = emp2Reg.json.data.token;
    createdUserIds.push(new mongoose.Types.ObjectId(emp2Reg.json.data.user._id || emp2Reg.json.data.user.id));

    const seekerReg = await jsonReq('/api/auth/register', {
      method: 'POST',
      body: { name: 'Asha Kumari', email: seekerEmail, password: 'Password123!', role: 'seeker' }
    });
    assert.equal(seekerReg.status, 201);
    const seekerToken = seekerReg.json.data.token;
    const seekerId = seekerReg.json.data.user._id || seekerReg.json.data.user.id;
    createdUserIds.push(new mongoose.Types.ObjectId(seekerId));

    const adminPassHash = await bcrypt.hash('AdminPass123!', 10);
    const adminUser = await User.create({
      name: 'SETU Test Admin',
      email: adminEmail,
      passwordHash: adminPassHash,
      role: 'admin'
    });
    createdUserIds.push(adminUser._id);
    const adminLogin = await jsonReq('/api/auth/login', {
      method: 'POST',
      body: { email: adminEmail, password: 'AdminPass123!' }
    });
    assert.equal(adminLogin.status, 200);
    const adminToken = adminLogin.json.data.token;

    await jsonReq('/api/profile', {
      method: 'PUT',
      token: seekerToken,
      body: {
        seekerProfile: {
          headline: 'Aspiring Data Analyst',
          phone: '+91-9999988888',
          skills: ['SQL', 'Excel', 'Python'],
          educationLevel: 'B.Tech',
          location: { city: 'Bengaluru', state: 'Karnataka' },
          profileVisibility: { discoverableByEmployers: true, showResumeToEmployers: false }
        }
      }
    });
    console.log('  ✓ 1. Accounts registered & baseline profiles initialized');

    // 2. Role separation: Seeker MUST be blocked from Employer Portal routes
    const seekerBlocked = await jsonReq('/api/employer/company', { token: seekerToken });
    assert.equal(seekerBlocked.status, 403);
    console.log('  ✓ 2. Role separation verified (job seeker blocked from /api/employer/* with 403)');

    // 3. Company Onboarding: Step 1 & Step 2
    const compUpdate = await jsonReq('/api/employer/company', {
      method: 'PUT',
      token: empToken,
      body: {
        registeredName: 'Shakti Innovations Pvt Ltd',
        publicName: 'Shakti Innovations',
        industry: 'Information Technology',
        businessCategory: 'SaaS',
        description: 'Building inclusive digital solutions across Bharat with flexible hybrid roles.',
        yearEstablished: 2021,
        companySize: '11-50',
        officialEmail: 'hr@shakti.test',
        contactNumber: '+91 9811122233',
        headquartersLocation: { city: 'Bengaluru', state: 'Karnataka', address: 'HSR Layout' },
        benefits: ['Flexible Hours', 'Health Insurance'],
        representative: {
          fullName: 'Meera Nair',
          designation: 'HR Lead',
          workEmail: 'meera@shakti.test',
          contactNumber: '+91 9811122233',
          department: 'Human Resources',
          relationshipToCompany: 'HR / Talent Acquisition Lead',
          authorizedToRecruit: true
        }
      }
    });
    assert.equal(compUpdate.status, 200);
    const companyRecordId = compUpdate.json.data.company._id;

    // Step 4: Hiring Preference
    const prefRes = await jsonReq('/api/employer/hiring-preferences', {
      method: 'POST',
      token: empToken,
      body: {
        jobTitle: 'Junior Data Analyst',
        department: 'Analytics',
        vacancies: 2,
        requiredSkills: ['SQL', 'Excel'],
        employmentType: 'Full-time',
        workArrangement: 'Hybrid',
        minSalary: 350000,
        maxSalary: 550000
      }
    });
    assert.equal(prefRes.status, 201);
    createdPrefId = prefRes.json.data._id;

    // Step 3: Secure Verification Document Upload (PDF) — must NOT auto-verify!
    const formData = new FormData();
    const pdfBlob = new Blob([Buffer.from('%PDF-1.4\n%SETU test verification document')], {
      type: 'application/pdf'
    });
    formData.append('document', pdfBlob, 'gst-certificate.pdf');
    formData.append('documentType', 'GST Registration Certificate');
    formData.append('documentNumber', '29ABCDE1234F1Z5');

    const uploadResRaw = await fetch(`${baseUrl}/api/employer/verification/documents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
      body: formData
    });
    const uploadJson: any = await uploadResRaw.json();
    assert.equal(uploadResRaw.status, 201);
    assert.equal(uploadJson.data.verificationStatus, 'under_review', 'Uploading docs must NEVER auto-verify');
    createdDocId = uploadJson.data.document._id;

    // Verify RBAC on uploaded verification file
    const otherEmpDocRes = await fetch(
      `${baseUrl}/api/employer/verification/documents/${createdDocId}/file`,
      { headers: { Authorization: `Bearer ${emp2Token}` } }
    );
    assert.equal(otherEmpDocRes.status, 403, 'Another employer must not access private docs');

    const seekerDocRes = await fetch(
      `${baseUrl}/api/employer/verification/documents/${createdDocId}/file`,
      { headers: { Authorization: `Bearer ${seekerToken}` } }
    );
    assert.equal(seekerDocRes.status, 403, 'Job seeker must not access private verification docs');

    const ownerDocRes = await fetch(
      `${baseUrl}/api/employer/verification/documents/${createdDocId}/file`,
      { headers: { Authorization: `Bearer ${empToken}` } }
    );
    assert.equal(ownerDocRes.status, 200);
    console.log('  ✓ 3. Company onboarding, secure PDF upload, non-auto-verify & RBAC file isolation verified');

    // 4. Verification Restriction: Unverified employer CANNOT publish live job, CAN save draft
    const blockedPublish = await jsonReq('/api/employer/opportunities', {
      method: 'POST',
      token: empToken,
      body: {
        title: 'Junior Data Analyst',
        department: 'Analytics',
        description: 'Analyze operational metrics and create clear weekly dashboards for stakeholders.',
        requiredSkills: ['SQL', 'Excel'],
        location: { city: 'Bengaluru', state: 'Karnataka', isRuralFocus: false },
        workMode: 'hybrid',
        opportunityType: 'full_time',
        vacancies: 2,
        status: 'published'
      }
    });
    assert.equal(blockedPublish.status, 403, 'Unverified employer must be blocked from publishing');

    const draftJob = await jsonReq('/api/employer/opportunities', {
      method: 'POST',
      token: empToken,
      body: {
        title: 'Junior Data Analyst',
        department: 'Analytics',
        description: 'Analyze operational metrics and create clear weekly dashboards for stakeholders.',
        requiredSkills: ['SQL', 'Excel'],
        location: { city: 'Bengaluru', state: 'Karnataka', isRuralFocus: false },
        workMode: 'hybrid',
        opportunityType: 'full_time',
        vacancies: 2,
        status: 'draft'
      }
    });
    assert.equal(draftJob.status, 201);
    assert.equal(draftJob.json.data.status, 'draft');
    createdJobId = draftJob.json.data._id;

    const dupJob = await jsonReq('/api/employer/opportunities', {
      method: 'POST',
      token: empToken,
      body: {
        title: 'Junior Data Analyst',
        description: 'Duplicate submission test description with enough characters.',
        requiredSkills: ['SQL'],
        location: { city: 'Bengaluru', state: 'Karnataka', isRuralFocus: false },
        status: 'draft'
      }
    });
    assert.equal(dupJob.status, 409, 'Duplicate active job posting should return 409');
    console.log('  ✓ 4. Unverified publish restriction (403), draft creation (201) & duplicate prevention (409) verified');

    // 5. Admin Approves Verification -> Employer can now Publish Job
    const adminApprove = await jsonReq(`/api/admin/employers/${empId}/verify`, {
      method: 'PUT',
      token: adminToken,
      body: { status: 'approved', notes: 'GST verified against official registry.' }
    });
    assert.equal(adminApprove.status, 200);

    const publishNow = await jsonReq(`/api/employer/opportunities/${createdJobId}`, {
      method: 'PUT',
      token: empToken,
      body: { status: 'published' }
    });
    assert.equal(publishNow.status, 200);
    assert.equal(publishNow.json.data.status, 'published');

    const pubComp = await jsonReq(`/api/companies/${companyRecordId}/public`, { token: seekerToken });
    assert.equal(pubComp.status, 200);
    assert.equal(pubComp.json.data.company.isVerified, true);
    assert.equal(pubComp.json.data.company.verificationDocs, undefined);
    assert.equal(pubComp.json.data.openJobs.length, 1);
    console.log('  ✓ 5. Admin verification approval unlocks live publishing & public company profile stays privacy-safe');

    // 6. Candidate Search Privacy Check (no phone/email exposed) + Invite to Apply
    const candSearch = await jsonReq('/api/employer/candidates?skills=SQL', { token: empToken });
    assert.equal(candSearch.status, 200);
    const foundSeeker = candSearch.json.data.find((c: any) => String(c._id) === String(seekerId));
    assert.ok(foundSeeker, 'Consenting candidate should appear in search');
    assert.equal(foundSeeker.email, undefined, 'Candidate email must NEVER be exposed in search');
    assert.equal(foundSeeker.phone, undefined, 'Candidate phone must NEVER be exposed in search');

    const inviteRes = await jsonReq(`/api/employer/candidates/${seekerId}/invite`, {
      method: 'POST',
      token: empToken,
      body: { opportunityId: createdJobId, message: 'We would love your application!' }
    });
    assert.equal(inviteRes.status, 200);
    console.log('  ✓ 6. Candidate search privacy & invite-to-apply verified');

    // 7. Seeker Applies -> Employer Updates Status + Private Note -> Seeker Cannot See Private Note
    const applyRes = await jsonReq('/api/applications', {
      method: 'POST',
      token: seekerToken,
      body: { opportunityId: createdJobId, coverNote: 'Excited about analytics!' }
    });
    assert.equal(applyRes.status, 201);
    createdAppId = applyRes.json.data._id;

    const updateAppRes = await jsonReq(`/api/employer/applicants/${createdAppId}/status`, {
      method: 'PUT',
      token: empToken,
      body: {
        status: 'Shortlisted',
        recruiterNote: 'INTERNAL_SECRET_NOTE_ONLY_FOR_HR',
        candidateMessage: 'Congratulations! You have been shortlisted for the next round.'
      }
    });
    assert.equal(updateAppRes.status, 200);

    const seekerAppsRes = await jsonReq('/api/applications', { token: seekerToken });
    assert.equal(seekerAppsRes.status, 200);
    const seekerApp = seekerAppsRes.json.data.find((a: any) => String(a._id) === String(createdAppId));
    assert.equal(seekerApp.status, 'Shortlisted');
    assert.equal(seekerApp.recruiterNotes, undefined, 'Private recruiter notes must NEVER leak to seeker');
    console.log('  ✓ 7. Application pipeline, candidate updates & private recruiter note isolation verified');

    // 8. Interview Scheduling + Notification + Real Analytics
    const ivRes = await jsonReq('/api/employer/interviews', {
      method: 'POST',
      token: empToken,
      body: {
        applicationId: createdAppId,
        opportunityId: createdJobId,
        candidateId: seekerId,
        scheduledDate: '2026-12-01',
        scheduledTime: '14:30',
        mode: 'Online',
        meetingLinkOrLocation: 'https://meet.google.com/setu-test',
        interviewerName: 'Meera Nair',
        notes: 'SQL + dashboard review'
      }
    });
    assert.equal(ivRes.status, 201);
    createdInterviewId = ivRes.json.data._id;

    const analyticsRes = await jsonReq('/api/employer/analytics?range=30d', { token: empToken });
    assert.equal(analyticsRes.status, 200);
    assert.equal(analyticsRes.json.data.kpis.publishedJobs, 1);
    assert.equal(analyticsRes.json.data.kpis.totalApplications, 1);
    assert.equal(analyticsRes.json.data.kpis.interviewsScheduled, 1);
    assert.ok(analyticsRes.json.data.graphs.candidateSkillDistribution.length >= 1);

    const notifRes = await jsonReq('/api/employer/notifications', { token: empToken });
    assert.equal(notifRes.status, 200);
    assert.ok(notifRes.json.data.notifications.length >= 2);
    console.log('  ✓ 8. Interview scheduling, real recruitment analytics & employer notifications verified');

    // 9. Role-Based Authorization: CANE AI completely blocked for employers & unauthenticated requests; allowed for seekers
    const unauthCaneStatus = await jsonReq('/api/cane/status');
    assert.equal(unauthCaneStatus.status, 401, 'Unauthenticated access to /api/cane/status must return 401');

    const empCaneStatus = await jsonReq('/api/cane/status', { token: empToken });
    assert.equal(empCaneStatus.status, 403, 'Employer must receive 403 on GET /api/cane/status');

    const empCaneList = await jsonReq('/api/cane/conversations', { token: empToken });
    assert.equal(empCaneList.status, 403, 'Employer must receive 403 on GET /api/cane/conversations');

    const empCaneCreate = await jsonReq('/api/cane/conversations', {
      method: 'POST',
      token: empToken,
      body: { title: 'Blocked Recruiter Chat', mode: 'general' }
    });
    assert.equal(empCaneCreate.status, 403, 'Employer must receive 403 on POST /api/cane/conversations');

    const empCaneRoadmaps = await jsonReq('/api/cane/roadmaps', { token: empToken });
    assert.equal(empCaneRoadmaps.status, 403, 'Employer must receive 403 on GET /api/cane/roadmaps');

    const empImproveResume = await jsonReq('/api/resumes/improve-resume', {
      method: 'POST',
      token: empToken,
      body: { draftResume: {} }
    });
    assert.equal(empImproveResume.status, 403, 'Employer must receive 403 on POST /api/resumes/improve-resume');

    const seekerCaneStatus = await jsonReq('/api/cane/status', { token: seekerToken });
    assert.equal(seekerCaneStatus.status, 200, 'Job seeker CANE AI /api/cane/status must remain accessible');
    console.log('  ✓ 9. CANE AI backend authorization verified (403 for employer, 401 unauth, 200 for job seeker)');

    console.log('\n✅ ALL 9 EMPLOYER PORTAL & CANE ACCESS ISOLATION VERIFICATION SUITES PASSED!');
  } finally {
    if (usingRealMongo) {
      if (createdInterviewId) await Interview.findByIdAndDelete(createdInterviewId).catch(() => {});
      if (createdAppId) await Application.findByIdAndDelete(createdAppId).catch(() => {});
      if (createdJobId) await Opportunity.findByIdAndDelete(createdJobId).catch(() => {});
      if (createdPrefId) await HiringPreference.findByIdAndDelete(createdPrefId).catch(() => {});
      if (createdDocId) await CompanyVerificationDocument.findByIdAndDelete(createdDocId).catch(() => {});
      if (createdUserIds.length > 0) {
        await RecruitmentNotification.deleteMany({ recipientId: { $in: createdUserIds } }).catch(() => {});
        await Employer.deleteMany({ userId: { $in: createdUserIds } }).catch(() => {});
        await User.deleteMany({ _id: { $in: createdUserIds } }).catch(() => {});
      }
      await mongoose.disconnect().catch(() => {});
    }
    server.close();
  }
}

run().catch((err) => {
  console.error('\n❌ Employer Portal test failed:', err);
  process.exit(1);
});
