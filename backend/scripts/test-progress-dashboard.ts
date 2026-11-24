import assert from 'node:assert/strict';
import http from 'node:http';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/User';
import { Assessment } from '../src/models/Assessment';
import { AssessmentResult } from '../src/models/AssessmentResult';
import { LearningResource } from '../src/models/LearningResource';
import { LearningProgress } from '../src/models/LearningProgress';
import { Portfolio } from '../src/models/Portfolio';
import { Resume } from '../src/models/Resume';
import { UploadedResumeFile } from '../src/models/UploadedResumeFile';
import { Opportunity } from '../src/models/Opportunity';
import { Application } from '../src/models/Application';
import { ProgressSnapshot } from '../src/models/ProgressSnapshot';
import { RecruitmentNotification } from '../src/models/RecruitmentNotification';

function matches(doc: any, filter: any = {}): boolean {
  if (!filter || Object.keys(filter).length === 0) return true;
  for (const [k, v] of Object.entries(filter)) {
    if (k === '$or' && Array.isArray(v)) {
      if (!v.some((s) => matches(doc, s))) return false;
      continue;
    }
    const actual = k.split('.').reduce((acc: any, p) => (acc == null ? undefined : acc[p]), doc);
    if (v && typeof v === 'object' && !(v instanceof mongoose.Types.ObjectId) && !(v instanceof RegExp)) {
      if ('$in' in v && Array.isArray((v as any).$in)) {
        const list = (v as any).$in;
        const ok = list.some((item: any) =>
          item instanceof RegExp ? item.test(String(actual || '')) : String(item) === String(actual)
        );
        if (!ok) return false;
        continue;
      }
      if ('$ne' in v) {
        if (actual === (v as any).$ne) return false;
        continue;
      }
    }
    if (String(actual ?? '') !== String(v ?? '')) return false;
  }
  return true;
}

function attachStore(Model: any, store: any[], popResolvers: Record<string, () => any[]> = {}) {
  const wrap = (doc: any) => {
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
        const out: any = {};
        for (const [k, v] of Object.entries(this)) {
          if (typeof v !== 'function') out[k] = v;
        }
        return out;
      };
    }
    return doc;
  };

  const makeQ = (items: any, single = false): any => {
    const pops: string[] = [];
    const resolvePop = (item: any) => {
      if (!item) return item;
      const clone: any = { ...item };
      for (const f of pops) {
        const fn = popResolvers[f];
        if (fn && clone[f]) {
          const found = fn().find((r) => String(r._id) === String(clone[f]._id || clone[f]));
          if (found) clone[f] = found;
        }
      }
      return clone;
    };
    const q: any = {
      select: () => q,
      populate(f: string) {
        pops.push(f);
        return q;
      },
      sort: () => q,
      limit: () => q,
      lean: () => q,
      then(resolve: any, reject: any) {
        return Promise.resolve(single ? resolvePop(items) : items.map(resolvePop)).then(resolve, reject);
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
    wrap(plain);
    const idx = store.findIndex((x) => String(x._id) === String(plain._id));
    if (idx >= 0) store[idx] = plain;
    else store.push(plain);
    return plain;
  };
  Model.create = async (d: any) => new Model(d).save();
  Model.find = (f?: any) => makeQ(store.filter((d) => matches(d, f)), false);
  Model.findOne = (f?: any) => makeQ(store.find((d) => matches(d, f)) || null, true);
  Model.findById = (id: any) => makeQ(store.find((d) => String(d._id) === String(id)) || null, true);
  Model.countDocuments = async (f?: any) => store.filter((d) => matches(d, f)).length;
  Model.findOneAndUpdate = async (filter: any, update: any, opts?: any) => {
    let doc = store.find((d) => matches(d, filter));
    if (!doc && opts?.upsert) {
      doc = wrap({ ...filter });
      store.push(doc);
    }
    if (!doc) return null;
    Object.assign(doc, update.$set || update);
    doc.updatedAt = new Date();
    return doc;
  };
}

async function run() {
  console.log('=== SETU Interactive Progress Analytics Dashboard Test Suite ===\n');

  const users: any[] = [];
  const assessments: any[] = [];
  const results: any[] = [];
  const resources: any[] = [];
  const learningProgress: any[] = [];
  const portfolios: any[] = [];
  const resumes: any[] = [];
  const uploadedResumes: any[] = [];
  const opps: any[] = [];
  const apps: any[] = [];
  const snapshots: any[] = [];
  const notifs: any[] = [];

  Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, get: () => 1 });

  attachStore(User, users);
  attachStore(Assessment, assessments);
  attachStore(AssessmentResult, results, { assessmentId: () => assessments });
  attachStore(LearningResource, resources);
  attachStore(LearningProgress, learningProgress, { resourceId: () => resources });
  attachStore(Portfolio, portfolios);
  attachStore(Resume, resumes);
  attachStore(UploadedResumeFile, uploadedResumes);
  attachStore(Opportunity, opps);
  attachStore(Application, apps, { opportunityId: () => opps, seekerId: () => users });
  attachStore(ProgressSnapshot, snapshots);
  attachStore(RecruitmentNotification, notifs);

  // Seed 1 assessment, 1 learning resource, and 1 employer opportunity
  const empId = new mongoose.Types.ObjectId();
  const assessId = new mongoose.Types.ObjectId();
  assessments.push({
    _id: assessId,
    title: 'SQL & Data Fundamentals',
    domain: 'SQL',
    category: 'Technical',
    difficulty: 'Beginner',
    passingScore: 60,
    skillsEvaluated: ['SQL'],
    questions: [
      { id: 'q1', question: 'SELECT retrieves data?', options: ['Yes', 'No'], correctAnswerIndex: 0, skillTested: 'SQL' },
      { id: 'q2', question: 'WHERE filters rows?', options: ['Yes', 'No'], correctAnswerIndex: 0, skillTested: 'SQL' }
    ]
  });

  const resourceId = new mongoose.Types.ObjectId();
  resources.push({
    _id: resourceId,
    title: 'Business Communication Essentials',
    type: 'course',
    category: 'Communication',
    skillTag: 'Communication',
    duration: '2 hours',
    description: 'Practical workplace communication course.'
  });

  const oppId = new mongoose.Types.ObjectId();
  opps.push({
    _id: oppId,
    employerId: empId,
    title: 'Junior SQL Analyst',
    organisationName: 'Bharat Data Co',
    description: 'Entry level analytics role.',
    requiredSkills: ['SQL'],
    location: { city: 'Pune', state: 'Maharashtra', isRuralFocus: false },
    workMode: 'hybrid',
    opportunityType: 'full_time',
    status: 'published',
    moderationStatus: 'clean'
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const { port } = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${port}`;

  const req = async (path: string, opts: { method?: string; token?: string; body?: any } = {}) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method: opts.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {})
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    return { status: res.status, json: (await res.json()) as any };
  };

  try {
    // 1. New user with no activity
    const reg = await req('/api/auth/register', {
      method: 'POST',
      body: { name: 'Kavya Nair', email: 'kavya@progress.test', password: 'Password123!', role: 'seeker' }
    });
    assert.equal(reg.status, 201);
    let token = reg.json.data.token;

    const fresh = await req('/api/analytics/progress?range=monthly', { token });
    assert.equal(fresh.status, 200);
    assert.equal(fresh.json.data.isFreshAccount, true);
    assert.equal(fresh.json.data.growthTimeline.length, 0, 'New user must have empty timeline');
    assert.equal(fresh.json.data.learningDonut.totalLearningHours, 0);
    assert.equal(fresh.json.data.applications.total, 0);
    assert.ok(
      fresh.json.data.skillDevelopment.coreCategories.every((c: any) => c.score === 0 && !c.hasActivity),
      'New user must have 0% across all 6 skill categories (zero fake scores!)'
    );
    const pct0 = fresh.json.data.summary.overallCareerProgressPct;
    console.log(`  ✓ 1. New user has empty timeline, 0 fake skill scores, 0 learning hours (${pct0}% baseline)`);

    // 2. User completes an assessment
    const submitAss = await req(`/api/assessments/${assessId}/submit`, {
      method: 'POST',
      token,
      body: { answers: { q1: 0, q2: 0 } }
    });
    assert.equal(submitAss.status, 200);
    const afterAss = await req('/api/analytics/progress?range=weekly', { token });
    const pctAfterAss = afterAss.json.data.summary.overallCareerProgressPct;
    assert.ok(pctAfterAss > pct0, 'Career progress must increase after assessment');
    const techCat = afterAss.json.data.skillDevelopment.coreCategories.find(
      (c: any) => c.category === 'Technical skills'
    );
    assert.equal(techCat.score, 100);
    assert.equal(techCat.hasActivity, true);
    console.log(`  ✓ 2. Assessment completion raised Career Progress (${pct0}% -> ${pctAfterAss}%) & Technical skills = 100%`);

    // 3. User completes a course (2 hours)
    const compCourse = await req(`/api/learning/${resourceId}/progress`, {
      method: 'PUT',
      token,
      body: { status: 'completed' }
    });
    assert.equal(compCourse.status, 200);
    const afterCourse = await req('/api/analytics/progress?range=monthly', { token });
    const pctAfterCourse = afterCourse.json.data.summary.overallCareerProgressPct;
    assert.ok(pctAfterCourse > pctAfterAss);
    assert.equal(afterCourse.json.data.learningDonut.completed, 1);
    assert.equal(afterCourse.json.data.learningDonut.totalLearningHours, 2);
    assert.ok(afterCourse.json.data.learningDonut.weeklyActivity.length >= 1);
    const commCat = afterCourse.json.data.skillDevelopment.coreCategories.find(
      (c: any) => c.category === 'Communication skills'
    );
    assert.ok(commCat.score > 0 && commCat.hasActivity);
    console.log(`  ✓ 3. Course completion logged 2.0 learning hours, weekly activity & raised progress to ${pctAfterCourse}%`);

    // 4. User adds a portfolio project
    const addProj = await req('/api/portfolio', {
      method: 'POST',
      token,
      body: {
        title: 'Sales Insights SQL Project',
        description: 'Analyzed regional sales datasets using PostgreSQL queries.',
        skills: ['SQL']
      }
    });
    assert.equal(addProj.status, 201);
    const afterProj = await req('/api/analytics/progress?range=monthly', { token });
    const pctAfterProj = afterProj.json.data.summary.overallCareerProgressPct;
    assert.ok(pctAfterProj > pctAfterCourse);
    const projAch = afterProj.json.data.achievements.find((a: any) => a.id === 'projects');
    assert.equal(projAch.count, 1);
    console.log(`  ✓ 4. Portfolio project unlocked Completed Projects achievement & raised progress to ${pctAfterProj}%`);

    // 5. User applies for a job
    const applyRes = await req('/api/applications', {
      method: 'POST',
      token,
      body: { opportunityId: String(oppId), coverNote: 'Passionate about SQL analytics!' }
    });
    assert.equal(applyRes.status, 201);
    const appId = applyRes.json.data._id;
    const afterApp = await req('/api/analytics/progress?range=monthly', { token });
    const pctAfterApp = afterApp.json.data.summary.overallCareerProgressPct;
    assert.ok(pctAfterApp > pctAfterProj);
    assert.equal(afterApp.json.data.applications.funnel[0].count, 1);
    assert.equal(afterApp.json.data.applications.overTime.length, 1);
    console.log(`  ✓ 5. Job application populated 6-stage funnel & trend graph (progress: ${pctAfterApp}%)`);

    // 6. User receives interview invitation
    apps[0].status = 'Interview Scheduled';
    const afterInterview = await req('/api/analytics/progress?range=yearly', { token });
    const pctAfterIv = afterInterview.json.data.summary.overallCareerProgressPct;
    assert.ok(pctAfterIv > pctAfterApp);
    const ivFunnel = afterInterview.json.data.applications.funnel.find((f: any) => f.stage === 'Interviews');
    assert.equal(ivFunnel.count, 1);
    const earnStage = afterInterview.json.data.journeyStages.find((s: any) => s.id === 'earn');
    assert.equal(earnStage.completed, true);
    console.log(`  ✓ 6. Interview invitation updated funnel, unlocked Stage 7 (Earn) & raised progress to ${pctAfterIv}%`);

    // 7 & 8. Logout, Sign in again & verify full persistence across refresh + weekly/monthly/yearly views
    await req('/api/auth/logout', { method: 'POST', token });
    const relogin = await req('/api/auth/login', {
      method: 'POST',
      body: { email: 'kavya@progress.test', password: 'Password123!' }
    });
    assert.equal(relogin.status, 200);
    token = relogin.json.data.token;

    for (const view of ['weekly', 'monthly', 'yearly']) {
      const persisted = await req(`/api/analytics/progress?range=${view}`, { token });
      assert.equal(persisted.status, 200);
      assert.equal(persisted.json.data.summary.overallCareerProgressPct, pctAfterIv);
      assert.equal(persisted.json.data.learningDonut.totalLearningHours, 2);
      assert.ok(persisted.json.data.growthTimeline.length >= 1);
    }
    assert.ok(snapshots.length >= 1, 'Timestamped ProgressSnapshot must be persisted in MongoDB');
    console.log('  ✓ 7 & 8. Logout/login & refresh persistence verified across Weekly, Monthly & Yearly views');

    console.log('\n✅ ALL 8 INTERACTIVE PROGRESS ANALYTICS DASHBOARD TESTS PASSED!');
  } finally {
    server.close();
  }
}

run().catch((err) => {
  console.error('\n❌ Progress Dashboard test failed:', err);
  process.exit(1);
});
