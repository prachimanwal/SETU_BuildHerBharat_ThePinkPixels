import assert from 'node:assert/strict';
import http from 'node:http';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../src/app';
import { ENV } from '../src/config/env';
import { User } from '../src/models/User';
import { Employer } from '../src/models/Employer';
import { Application } from '../src/models/Application';
import { AssessmentResult } from '../src/models/AssessmentResult';
import { LearningProgress } from '../src/models/LearningProgress';
import { Portfolio } from '../src/models/Portfolio';
import { Opportunity } from '../src/models/Opportunity';
import { LearningResource } from '../src/models/LearningResource';

interface HttpResponse {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: any;
  cookies: Record<string, string>;
  rawSetCookies: string[];
}

const parseSetCookies = (setCookies: string[] = []): Record<string, string> => {
  const map: Record<string, string> = {};
  for (const raw of setCookies) {
    const [pair] = raw.split(';');
    const eqIdx = pair.indexOf('=');
    if (eqIdx > 0) {
      map[pair.slice(0, eqIdx).trim()] = pair.slice(eqIdx + 1).trim();
    }
  }
  return map;
};

const request = (
  port: number,
  method: string,
  path: string,
  options: {
    body?: any;
    cookie?: string;
    headers?: Record<string, string>;
  } = {}
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
      ...(options.cookie ? { Cookie: options.cookie } : {}),
      ...(options.headers || {})
    };

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let body: any = raw;
          try {
            body = JSON.parse(raw);
          } catch {
            // keep raw text
          }
          const rawSetCookies = (res.headers['set-cookie'] as string[]) || [];
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            body,
            cookies: parseSetCookies(rawSetCookies),
            rawSetCookies
          });
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
  const employers: any[] = [];
  const origReadyStateDesc = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(mongoose.connection),
    'readyState'
  );

  Object.defineProperty(mongoose.connection, 'readyState', {
    configurable: true,
    get: () => 1
  });

  const makeQuery = (result: any) => ({
    select: () => Promise.resolve(result),
    populate: () => makeQuery(result),
    sort: () => makeQuery(result),
    limit: () => Promise.resolve(result),
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject)
  });

  const origSave = User.prototype.save;
  (User.prototype as any).save = async function () {
    if (!this._id) this._id = new mongoose.Types.ObjectId();
    if (!this.createdAt) this.createdAt = new Date();
    this.updatedAt = new Date();
    if (this.name && !this.fullName) this.fullName = this.name;

    for (const existing of users) {
      if (existing._id.toString() === this._id.toString()) continue;
      if (existing.email === this.email) {
        const err: any = new Error('Duplicate email');
        err.code = 11000;
        throw err;
      }
    }

    const idx = users.findIndex((u) => u._id.toString() === this._id.toString());
    if (idx >= 0) users[idx] = this;
    else users.push(this);
    return this;
  };

  const origFindOne = User.findOne.bind(User);
  (User as any).findOne = (query: any) => {
    const match = users.find((u) => (query.email ? u.email === query.email : false));
    return makeQuery(match || null);
  };

  const origFindById = User.findById.bind(User);
  (User as any).findById = (id: any) => {
    const match = users.find((u) => u._id.toString() === String(id));
    return makeQuery(match || null);
  };

  const origEmployerCreate = Employer.create.bind(Employer);
  (Employer as any).create = async (doc: any) => {
    const created = { _id: new mongoose.Types.ObjectId(), ...doc };
    employers.push(created);
    return created;
  };

  const emptyListQuery = () => makeQuery([]);
  (Application as any).find = emptyListQuery;
  (AssessmentResult as any).find = emptyListQuery;
  (LearningProgress as any).find = emptyListQuery;
  (Portfolio as any).find = emptyListQuery;
  (Opportunity as any).find = emptyListQuery;
  (LearningResource as any).find = emptyListQuery;

  return {
    users,
    employers,
    restore: () => {
      (User.prototype as any).save = origSave;
      (User as any).findOne = origFindOne;
      (User as any).findById = origFindById;
      (Employer as any).create = origEmployerCreate;
      if (origReadyStateDesc) {
        Object.defineProperty(mongoose.connection, 'readyState', origReadyStateDesc);
      }
    }
  };
}

async function run() {
  console.log('=== SETU Email & Password Authentication Test Suite ===\n');

  let usingRealMongo = false;
  let memoryStore: ReturnType<typeof installInMemoryStore> | null = null;
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
    // 1. Google auth route is completely removed (404 JSON)
    const googleRes = await request(port, 'POST', '/api/auth/google', {
      body: { credential: 'anything' }
    });
    assert.equal(googleRes.status, 404);
    assert.equal(googleRes.body.success, false);
    assert.equal(googleRes.cookies.setu_token, undefined);
    console.log('  ✓ 1. /api/auth/google route is removed (returns HTTP 404 JSON)');

    // 2. Public Admin registration is strictly blocked
    const adminRegRes = await request(port, 'POST', '/api/auth/register', {
      body: {
        name: 'Fake Admin',
        email: 'fake.admin@example.com',
        password: 'Password@123',
        role: 'admin'
      }
    });
    assert.equal(adminRegRes.status, 403);
    assert.equal(adminRegRes.cookies.setu_token, undefined);
    console.log('  ✓ 2. Public Admin registration strictly rejected (HTTP 403)');

    // 3. Job Seeker registration works, hashes password, and blocks duplicate email
    const seekerEmail = 'ananya.seeker.test@example.com';
    createdEmails.push(seekerEmail);
    const seekerRegRes = await request(port, 'POST', '/api/auth/register', {
      body: {
        name: 'Ananya Verma',
        email: seekerEmail,
        password: 'SecurePassword@123',
        role: 'seeker'
      }
    });
    assert.equal(seekerRegRes.status, 201);
    assert.equal(seekerRegRes.body.success, true);
    assert.equal(seekerRegRes.body.data.user.role, 'seeker');
    assert.equal(seekerRegRes.body.data.user.email, seekerEmail);
    assert.equal(seekerRegRes.body.data.user.passwordHash, undefined, 'Must never return passwordHash');
    assert.ok(seekerRegRes.cookies.setu_token, 'HttpOnly cookie must be set');
    assert.ok(
      seekerRegRes.rawSetCookies.some((c) => c.includes('setu_token=') && c.includes('HttpOnly'))
    );

    const savedSeeker = await User.findOne({ email: seekerEmail });
    assert.ok(savedSeeker);
    assert.notEqual(savedSeeker.passwordHash, 'SecurePassword@123', 'Password must be bcrypt-hashed');
    assert.ok(savedSeeker.passwordHash.startsWith('$2'), 'Hash must use bcrypt format');

    const dupRegRes = await request(port, 'POST', '/api/auth/register', {
      body: {
        name: 'Duplicate User',
        email: seekerEmail,
        password: 'AnotherPassword@123',
        role: 'seeker'
      }
    });
    assert.equal(dupRegRes.status, 409);
    console.log('  ✓ 3. Job Seeker registration hashes password, saves user, and blocks duplicates (409)');

    // 4. Employer registration works and sets role='employer' with pending verification
    const employerEmail = 'hr.employer.test@example.com';
    createdEmails.push(employerEmail);
    const empRegRes = await request(port, 'POST', '/api/auth/register', {
      body: {
        name: 'Kiran Enterprises',
        email: employerEmail,
        password: 'EmployerPass@123',
        role: 'employer'
      }
    });
    assert.equal(empRegRes.status, 201);
    assert.equal(empRegRes.body.data.user.role, 'employer');
    assert.equal(empRegRes.body.data.user.employerProfile.verificationStatus, 'pending');
    console.log('  ✓ 4. Employer registration works with role=employer and pending verification');

    // 5. Login rejects wrong password & non-existent email; accepts valid credentials
    const wrongPassRes = await request(port, 'POST', '/api/auth/login', {
      body: { email: seekerEmail, password: 'WrongPassword' }
    });
    assert.equal(wrongPassRes.status, 401);
    assert.equal(wrongPassRes.cookies.setu_token, undefined);

    const unknownUserRes = await request(port, 'POST', '/api/auth/login', {
      body: { email: 'nonexistent@example.com', password: 'Password@123' }
    });
    assert.equal(unknownUserRes.status, 401);

    const seekerLoginRes = await request(port, 'POST', '/api/auth/login', {
      body: { email: seekerEmail, password: 'SecurePassword@123' }
    });
    assert.equal(seekerLoginRes.status, 200);
    assert.equal(seekerLoginRes.body.data.user.email, seekerEmail);
    assert.equal(seekerLoginRes.body.data.user.role, 'seeker');
    const seekerCookie = `setu_token=${seekerLoginRes.cookies.setu_token}`;
    console.log('  ✓ 5. Email/password login rejects invalid credentials (401) and authenticates valid users');

    // 6. Role escalation via profile update is ignored; Seeker accesses dashboard but not Admin routes
    const escalateRes = await request(port, 'PUT', '/api/users/profile', {
      cookie: seekerCookie,
      body: {
        name: 'Ananya Verma',
        role: 'admin',
        seekerProfile: { headline: 'Digital Designer', skills: ['Canva'] }
      }
    });
    assert.equal(escalateRes.status, 200);
    assert.equal(escalateRes.body.data.user.role, 'seeker', 'Role must never change to admin');

    // 6b. Stage 2 Complete Profile System (/api/profile & /api/profile/completion)
    const fullProfileRes = await request(port, 'PUT', '/api/profile', {
      cookie: seekerCookie,
      body: {
        name: 'Ananya Verma',
        seekerProfile: {
          bio: 'B.Tech CS student passionate about data analytics and visualization.',
          preferredLanguage: 'English',
          location: { city: 'Gurugram', state: 'Haryana', country: 'India' },
          education: [
            {
              level: 'Undergraduate student',
              degree: 'B.Tech',
              specialization: 'Computer Science',
              institution: 'K.R. Mangalam University',
              currentYearOrSemester: '3rd Year',
              expectedGraduationYear: '2027',
              status: 'Pursuing'
            }
          ],
          detailedSkills: [
            {
              name: 'Python',
              category: 'Technical',
              proficiency: 'Intermediate',
              verified: true, // Client attempt to spoof verified flag must be ignored!
              source: 'assessment_verified'
            },
            { name: 'SQL', category: 'Technical', proficiency: 'Beginner' }
          ],
          interests: ['Technology', 'Design'],
          careerGoalsList: ['Find an internship', 'Develop new skills'],
          employmentPreferences: {
            jobTypes: ['Internship', 'Part-time'],
            workModes: ['Remote', 'Hybrid'],
            preferredLocations: ['Gurugram', 'Remote'],
            expectedSalary: '₹15,000 / month',
            yearsOfExperience: 'Fresher / 0 years',
            availability: 'Immediate',
            willingToRelocate: true
          },
          hasExperience: false,
          onboardingCompleted: true
        }
      }
    });
    assert.equal(fullProfileRes.status, 200);
    assert.equal(fullProfileRes.body.data.profileCompletionPercentage, 100);
    assert.deepEqual(fullProfileRes.body.data.missingSections, []);
    assert.equal(fullProfileRes.body.data.user.seekerProfile.education.length, 1);
    assert.equal(fullProfileRes.body.data.user.seekerProfile.detailedSkills.length, 2);
    assert.equal(
      fullProfileRes.body.data.user.seekerProfile.detailedSkills[0].verified,
      false,
      'User-submitted skills must stay self-reported, never client-spoofed as verified'
    );
    assert.equal(
      fullProfileRes.body.data.user.seekerProfile.detailedSkills[0].source,
      'self_reported'
    );

    const getProfileRes = await request(port, 'GET', '/api/profile', { cookie: seekerCookie });
    assert.equal(getProfileRes.status, 200);
    assert.equal(getProfileRes.body.data.user.seekerProfile.location.city, 'Gurugram');

    const compRes = await request(port, 'GET', '/api/profile/completion', { cookie: seekerCookie });
    assert.equal(compRes.status, 200);
    assert.equal(compRes.body.data.completionPercentage, 100);
    console.log('  ✓ 6b. Complete Profile API (/api/profile & /api/profile/completion) saves & calculates 100% accurately');

    const dashRes = await request(port, 'GET', '/api/dashboard', { cookie: seekerCookie });
    assert.equal(dashRes.status, 200);
    assert.equal(dashRes.body.data.user.email, seekerEmail);
    assert.deepEqual(dashRes.body.data.savedSkills, ['Python', 'SQL']);

    const seekerToAdminRes = await request(port, 'GET', '/api/admin/employers', {
      cookie: seekerCookie
    });
    assert.equal(seekerToAdminRes.status, 403);
    console.log('  ✓ 6. Role-based access control & anti-escalation enforced (Seeker blocked from Admin)');

    // 7. Existing Admin account authenticates securely
    const adminEmail = 'platform.admin.test@setu.org';
    createdEmails.push(adminEmail);
    const adminHash = await bcrypt.hash('AdminStrongPass@2026', 10);
    const adminDoc = new User({
      name: 'Platform Admin',
      fullName: 'Platform Admin',
      email: adminEmail,
      passwordHash: adminHash,
      role: 'admin',
      emailVerified: true
    });
    await adminDoc.save();

    const adminLoginRes = await request(port, 'POST', '/api/auth/login', {
      body: { email: adminEmail, password: 'AdminStrongPass@2026' }
    });
    assert.equal(adminLoginRes.status, 200);
    assert.equal(adminLoginRes.body.data.user.role, 'admin');
    console.log('  ✓ 7. Existing Admin account authenticates securely via email & password');

    // 8. Logout clears session cookie & expired tokens rejected
    const logoutRes = await request(port, 'POST', '/api/auth/logout', { cookie: seekerCookie });
    assert.equal(logoutRes.status, 200);
    assert.ok(
      logoutRes.rawSetCookies.some(
        (c) => c.includes('setu_token=;') || c.includes('Expires=Thu, 01 Jan 1970')
      )
    );

    const unauthMe = await request(port, 'GET', '/api/auth/me');
    assert.equal(unauthMe.status, 401);

    const expiredJwt = jwt.sign(
      { id: seekerLoginRes.body.data.user.id, email: seekerEmail, role: 'seeker' },
      ENV.JWT_SECRET,
      { expiresIn: -5 }
    );
    const expiredMe = await request(port, 'GET', '/api/auth/me', {
      cookie: `setu_token=${expiredJwt}`
    });
    assert.equal(expiredMe.status, 401);
    console.log('  ✓ 8. Logout clears session & unauthenticated/expired sessions rejected (401)');

    // 9. Production CORS & Health Check verification
    const healthRes = await request(port, 'GET', '/api/health', {
      headers: { Origin: 'https://oursetu.netlify.app' }
    });
    assert.equal(healthRes.status, 200);
    assert.equal(healthRes.body.success, true);
    assert.equal(healthRes.headers['access-control-allow-origin'], 'https://oursetu.netlify.app');
    assert.equal(healthRes.headers['access-control-allow-credentials'], 'true');

    const blockedCorsRes = await request(port, 'GET', '/api/health', {
      headers: { Origin: 'https://untrusted-site.example' }
    });
    assert.equal(blockedCorsRes.headers['access-control-allow-origin'], undefined);
    console.log('  ✓ 9. Production CORS allows https://oursetu.netlify.app & blocks untrusted origins');

    console.log('\n✅ ALL EMAIL & PASSWORD AUTHENTICATION TESTS PASSED!');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    if (usingRealMongo) {
      if (createdEmails.length > 0) {
        await User.deleteMany({ email: { $in: createdEmails } });
      }
      await mongoose.disconnect();
    } else if (memoryStore) {
      memoryStore.restore();
    }
  }
}

run().catch((err) => {
  console.error('\n❌ Authentication test suite failed:', err);
  process.exit(1);
});
