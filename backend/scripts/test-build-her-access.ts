import assert from 'node:assert/strict';
import http from 'node:http';
import mongoose from 'mongoose';
import app from '../src/app';
import { ENV } from '../src/config/env';
import { User } from '../src/models/User';
import { Employer } from '../src/models/Employer';
import { Opportunity } from '../src/models/Opportunity';
import { LearningResource } from '../src/models/LearningResource';
import { GovernmentScheme } from '../src/models/GovernmentScheme';
import { Application } from '../src/models/Application';
import { AssessmentResult } from '../src/models/AssessmentResult';
import { LearningProgress } from '../src/models/LearningProgress';
import { Portfolio } from '../src/models/Portfolio';
import { Assessment } from '../src/models/Assessment';

interface HttpResponse {
  status: number;
  body: any;
}

const request = (
  port: number,
  method: string,
  path: string,
  options: { token?: string; body?: any; headers?: Record<string, string> } = {}
): Promise<HttpResponse> => {
  return new Promise((resolve, reject) => {
    const payload = options.body !== undefined ? JSON.stringify(options.body) : undefined;
    const headers: Record<string, string> = {
      ...(payload
        ? {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload).toString()
          }
        : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {})
    };

    const req = http.request(
      { hostname: '127.0.0.1', port, path, method, headers },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let body: any = raw;
          try {
            body = JSON.parse(raw);
          } catch {
            // keep text
          }
          resolve({ status: res.statusCode || 0, body });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
};

function installInMemoryStore() {
  const users: any[] = [];
  const origReadyStateDesc = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(mongoose.connection),
    'readyState'
  );

  Object.defineProperty(mongoose.connection, 'readyState', {
    configurable: true,
    get: () => 1
  });

  const makeQuery = (result: any): any => ({
    select: () => makeQuery(result),
    populate: () => makeQuery(result),
    sort: () => makeQuery(result),
    skip: () => makeQuery(result),
    limit: () => makeQuery(result),
    lean: () => makeQuery(result),
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject)
  });

  const sampleRestartOpp = {
    _id: new mongoose.Types.ObjectId(),
    title: 'Remote Junior Data Coordinator (Career Restart Friendly)',
    organisationName: 'Shakti Tech Bharat',
    workMode: 'remote',
    opportunityType: 'full_time',
    isCareerRestart: true,
    status: 'published',
    description: 'Supportive career returnee pathway with flexible hours.'
  };

  const sampleRefresher = {
    _id: new mongoose.Types.ObjectId(),
    title: 'Async Workplace Collaboration & Confidence',
    type: 'course',
    skillTag: 'Communication',
    durationMinutes: 35,
    summary: 'Practical guide to modern remote workflows.'
  };

  const sampleWomenScheme = {
    _id: new mongoose.Types.ObjectId(),
    title: 'Mahila Udyogini & SHG Entrepreneurship Grant',
    category: 'Women Entrepreneurship',
    targetGroup: 'Women entrepreneurs across urban and rural India',
    ministry: 'Ministry of Women and Child Development',
    officialUrl: 'https://wcd.nic.in/'
  };

  const origUserSave = User.prototype.save;
  (User.prototype as any).save = async function () {
    if (!this._id) this._id = new mongoose.Types.ObjectId();
    if (!this.createdAt) this.createdAt = new Date();
    this.updatedAt = new Date();
    const idx = users.findIndex((u) => String(u._id) === String(this._id));
    if (idx >= 0) users[idx] = this;
    else users.push(this);
    return this;
  };
  (User as any).findOne = (q: any) => {
    const match = users.find((u) => (q?.email ? u.email === q.email : false));
    return makeQuery(match || null);
  };
  (User as any).findById = (id: any) => {
    const match = users.find((u) => String(u._id) === String(id));
    return makeQuery(match || null);
  };
  (Employer as any).create = async (doc: any) => ({ _id: new mongoose.Types.ObjectId(), ...doc });
  (Opportunity as any).find = () => makeQuery([sampleRestartOpp]);
  (Opportunity as any).countDocuments = async () => 1;
  (LearningResource as any).find = () => makeQuery([sampleRefresher]);
  (GovernmentScheme as any).find = () => makeQuery([sampleWomenScheme]);
  (GovernmentScheme as any).countDocuments = async () => 1;
  (Application as any).find = () => makeQuery([]);
  (AssessmentResult as any).find = () => makeQuery([]);
  (LearningProgress as any).find = () => makeQuery([]);
  (Portfolio as any).find = () => makeQuery([]);
  (Assessment as any).find = () => makeQuery([]);

  return {
    users,
    restore: () => {
      (User.prototype as any).save = origUserSave;
      if (origReadyStateDesc) {
        Object.defineProperty(mongoose.connection, 'readyState', origReadyStateDesc);
      }
    }
  };
}

async function run() {
  console.log('=== SETU Build Her Exclusivity & Gender Authorization Suite ===\n');

  let memoryStore: ReturnType<typeof installInMemoryStore> | null = null;
  let usingRealMongo = false;
  const createdEmails: string[] = [];

  try {
    await mongoose.connect(ENV.MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    usingRealMongo = true;
    console.log('  • Connected to live MongoDB instance');
  } catch {
    console.log('  • Local MongoDB unavailable — using in-memory Mongoose store for route verification');
    memoryStore = installInMemoryStore();
  }

  const server = await new Promise<http.Server>((resolve) => {
    const srv = app.listen(0, '127.0.0.1', () => resolve(srv));
  });
  const port = (server.address() as any).port;

  try {
    // 1. Unauthenticated visitor blocked from all Build Her endpoints (401)
    const unauthBh = await request(port, 'GET', '/api/build-her');
    assert.equal(unauthBh.status, 401);
    const unauthPublicBh = await request(port, 'GET', '/api/public/build-her');
    assert.equal(unauthPublicBh.status, 401);
    const unauthTicket = await request(port, 'POST', '/api/build-her/support-ticket', {
      body: { subject: 'Test', message: 'Hello' }
    });
    assert.equal(unauthTicket.status, 401);
    console.log('  ✓ 1. Unauthenticated visitors rejected on all Build Her endpoints (HTTP 401)');

    // 2. Female Job Seeker: registered with gender='Female' -> full Build Her access (200/201)
    const femaleEmail = 'ananya.buildher@example.com';
    createdEmails.push(femaleEmail);
    const femaleReg = await request(port, 'POST', '/api/auth/register', {
      body: {
        name: 'Ananya Deshmukh',
        email: femaleEmail,
        password: 'Password@123',
        role: 'seeker',
        gender: 'Female'
      }
    });
    assert.equal(femaleReg.status, 201);
    assert.equal(femaleReg.body.data.user.gender, 'Female');
    assert.equal(femaleReg.body.data.user.buildHerEligible, true);
    const femaleToken = femaleReg.body.data.token;

    const femaleBh = await request(port, 'GET', '/api/build-her', { token: femaleToken });
    assert.equal(femaleBh.status, 200);
    assert.ok(Array.isArray(femaleBh.body.data.sanctuaryGuidelines));

    const femaleTicket = await request(port, 'POST', '/api/build-her/support-ticket', {
      token: femaleToken,
      body: { subject: 'Career returnee mentorship inquiry', message: 'Looking for mentor matching.' }
    });
    assert.equal(femaleTicket.status, 201);
    console.log('  ✓ 2. Female job seeker allowed full Build Her access & support desk (200/201)');

    // 3. Male Job Seeker: blocked from Build Her (403), even with spoofed query/header, but retains general features
    const maleEmail = 'rohan.male@example.com';
    createdEmails.push(maleEmail);
    const maleReg = await request(port, 'POST', '/api/auth/register', {
      body: {
        name: 'Rohan Mehta',
        email: maleEmail,
        password: 'Password@123',
        role: 'seeker',
        gender: 'Male'
      }
    });
    assert.equal(maleReg.status, 201);
    assert.equal(maleReg.body.data.user.gender, 'Male');
    assert.equal(maleReg.body.data.user.buildHerEligible, false);
    const maleToken = maleReg.body.data.token;

    const maleBh = await request(port, 'GET', '/api/build-her?gender=Female', {
      token: maleToken,
      headers: { 'X-Gender': 'Female' }
    });
    assert.equal(maleBh.status, 403, 'Server must never trust spoofed query/header gender params');

    const malePublicBh = await request(port, 'GET', '/api/public/build-her', { token: maleToken });
    assert.equal(malePublicBh.status, 403);

    const maleTicket = await request(port, 'POST', '/api/build-her/support-ticket', {
      token: maleToken,
      body: { subject: 'Test', message: 'Should be blocked' }
    });
    assert.equal(maleTicket.status, 403);

    // General job seeker endpoints remain 200 for male seeker
    const maleOpps = await request(port, 'GET', '/api/opportunities', { token: maleToken });
    assert.equal(maleOpps.status, 200);
    const maleSchemes = await request(port, 'GET', '/api/schemes', { token: maleToken });
    assert.equal(maleSchemes.status, 200);
    console.log('  ✓ 3. Male job seeker blocked from Build Her (403, anti-spoof) while general features remain 200');

    // 4. Unspecified gender & Non-binary / Other / Prefer not to say seekers blocked (403)
    const unspecEmail = 'alex.unspec@example.com';
    createdEmails.push(unspecEmail);
    const unspecReg = await request(port, 'POST', '/api/auth/register', {
      body: {
        name: 'Alex Verma',
        email: unspecEmail,
        password: 'Password@123',
        role: 'seeker'
      }
    });
    assert.equal(unspecReg.status, 201);
    assert.equal(unspecReg.body.data.user.gender, '');
    assert.equal(unspecReg.body.data.user.buildHerEligible, false);
    const unspecToken = unspecReg.body.data.token;

    const unspecBh = await request(port, 'GET', '/api/build-her', { token: unspecToken });
    assert.equal(unspecBh.status, 403);

    for (const opt of ['Non-binary', 'Other', 'Prefer not to say'] as const) {
      const upd = await request(port, 'PUT', '/api/profile', {
        token: unspecToken,
        body: { gender: opt }
      });
      assert.equal(upd.status, 200);
      assert.equal(upd.body.data.user.gender, opt);
      assert.equal(upd.body.data.user.buildHerEligible, false);

      const denied = await request(port, 'GET', '/api/build-her', { token: unspecToken });
      assert.equal(denied.status, 403, `Option "${opt}" must be denied Build Her access`);
    }
    console.log('  ✓ 4. Unspecified, Non-binary, Other & Prefer not to say seekers blocked from Build Her (403)');

    // 5. Employer account blocked from Build Her (403)
    const empEmail = 'hr.employer@example.com';
    createdEmails.push(empEmail);
    const empReg = await request(port, 'POST', '/api/auth/register', {
      body: {
        name: 'Meera Hiring Co',
        email: empEmail,
        password: 'Password@123',
        role: 'employer',
        gender: 'Female' // Even if someone submits gender='Female' on employer signup, employer role must stay blocked!
      }
    });
    assert.equal(empReg.status, 201);
    assert.equal(empReg.body.data.user.buildHerEligible, false);
    const empBh = await request(port, 'GET', '/api/build-her', { token: empReg.body.data.token });
    assert.equal(empBh.status, 403);
    console.log('  ✓ 5. Employer account blocked from Build Her (403)');

    // 6. Real-time profile update grants immediate access & preserves Build Her data if eligibility later changes
    const enableFemale = await request(port, 'PUT', '/api/profile', {
      token: unspecToken,
      body: {
        gender: 'Female',
        seekerProfile: { isCareerRestart: true }
      }
    });
    assert.equal(enableFemale.status, 200);
    assert.equal(enableFemale.body.data.user.buildHerEligible, true);

    // Same session token (without logout/login) immediately gains Build Her access!
    const immediateAccess = await request(port, 'GET', '/api/build-her', { token: unspecToken });
    assert.equal(immediateAccess.status, 200);

    // Switching away preserves isCareerRestart data in MongoDB while revoking Build Her access
    const switchAway = await request(port, 'PUT', '/api/profile', {
      token: unspecToken,
      body: { gender: 'Prefer not to say' }
    });
    assert.equal(switchAway.status, 200);
    assert.equal(switchAway.body.data.user.buildHerEligible, false);
    assert.equal(
      switchAway.body.data.user.seekerProfile.isCareerRestart,
      true,
      'Historical Build Her data must be preserved when gender changes'
    );

    const immediateRevoke = await request(port, 'GET', '/api/build-her', { token: unspecToken });
    assert.equal(immediateRevoke.status, 403);

    // Confirm persisted gender across logout + login
    const relogin = await request(port, 'POST', '/api/auth/login', {
      body: { email: femaleEmail, password: 'Password@123' }
    });
    assert.equal(relogin.status, 200);
    assert.equal(relogin.body.data.user.gender, 'Female');
    assert.equal(relogin.body.data.user.buildHerEligible, true);
    console.log('  ✓ 6. Real-time profile eligibility updates, history preservation & login persistence verified\n');

    console.log('✅ ALL 6 BUILD HER EXCLUSIVITY & AUTHORIZATION TESTS PASSED!');
  } finally {
    if (usingRealMongo) {
      await User.deleteMany({ email: { $in: createdEmails } }).catch(() => undefined);
      await Employer.deleteMany({}).catch(() => undefined);
      await mongoose.disconnect().catch(() => undefined);
    } else if (memoryStore) {
      memoryStore.restore();
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

run().catch((err) => {
  console.error('❌ Build Her verification suite failed:', err);
  process.exit(1);
});
