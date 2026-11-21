import assert from 'node:assert/strict';
import http from 'node:http';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../src/app';
import { ENV } from '../src/config/env';
import { User } from '../src/models/User';
import { Application } from '../src/models/Application';
import { AssessmentResult } from '../src/models/AssessmentResult';
import { LearningProgress } from '../src/models/LearningProgress';
import { Portfolio } from '../src/models/Portfolio';
import { Opportunity } from '../src/models/Opportunity';
import { LearningResource } from '../src/models/LearningResource';
import {
  verifyGoogleIdToken,
  setGoogleVerifierForTesting,
  GoogleAuthError,
  VerifiedGoogleProfile
} from '../src/services/googleAuth.service';

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
      const k = pair.slice(0, eqIdx).trim();
      const v = pair.slice(eqIdx + 1).trim();
      map[k] = v;
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
      ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload).toString() } : {}),
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
            // non-JSON body
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

// Lightweight in-memory fallback when MongoDB daemon is not running locally in sandbox
function installInMemoryUserStore() {
  const users: any[] = [];
  const origReadyStateDesc = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(mongoose.connection),
    'readyState'
  );
  let readyStateValue = 1;

  Object.defineProperty(mongoose.connection, 'readyState', {
    configurable: true,
    get: () => readyStateValue
  });

  const makeQuery = (result: any) => ({
    select: () => Promise.resolve(result),
    populate: () => makeQuery(result),
    sort: () => makeQuery(result),
    limit: () => Promise.resolve(result),
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject)
  });

  const wrapUserDoc = (doc: any) => {
    doc.save = async function () {
      if (!this._id) this._id = new mongoose.Types.ObjectId();
      if (!this.createdAt) this.createdAt = new Date();
      this.updatedAt = new Date();
      if (this.name && !this.fullName) this.fullName = this.name;
      if (this.avatar && !this.profilePicture) this.profilePicture = this.avatar;
      if (this.profilePicture && !this.avatar) this.avatar = this.profilePicture;

      // Enforce unique email & unique googleId
      for (const existing of users) {
        if (existing._id.toString() === this._id.toString()) continue;
        if (existing.email === this.email) {
          const err: any = new Error('Duplicate email');
          err.code = 11000;
          throw err;
        }
        if (this.googleId && existing.googleId === this.googleId) {
          const err: any = new Error('Duplicate googleId');
          err.code = 11000;
          throw err;
        }
      }

      const idx = users.findIndex((u) => u._id.toString() === this._id.toString());
      if (idx >= 0) users[idx] = this;
      else users.push(this);
      return this;
    };
    return doc;
  };

  const origSave = User.prototype.save;
  (User.prototype as any).save = function () {
    return wrapUserDoc(this).save();
  };

  const origFindOne = User.findOne.bind(User);
  (User as any).findOne = (query: any) => {
    const match = users.find((u) => {
      if (query.googleId && u.googleId === query.googleId) return true;
      if (query.email && u.email === query.email) return true;
      if (Array.isArray(query.$or)) {
        return query.$or.some(
          (q: any) => (q.googleId && u.googleId === q.googleId) || (q.email && u.email === q.email)
        );
      }
      return false;
    });
    return makeQuery(match || null);
  };

  const origFindById = User.findById.bind(User);
  (User as any).findById = (id: any) => {
    const match = users.find((u) => u._id.toString() === String(id));
    return makeQuery(match || null);
  };

  // Empty dashboard collections for isolated test verification
  const emptyListQuery = () => makeQuery([]);
  (Application as any).find = emptyListQuery;
  (AssessmentResult as any).find = emptyListQuery;
  (LearningProgress as any).find = emptyListQuery;
  (Portfolio as any).find = emptyListQuery;
  (Opportunity as any).find = emptyListQuery;
  (LearningResource as any).find = emptyListQuery;

  return {
    users,
    setReadyState: (val: number) => {
      readyStateValue = val;
    },
    restore: () => {
      (User.prototype as any).save = origSave;
      (User as any).findOne = origFindOne;
      (User as any).findById = origFindById;
      if (origReadyStateDesc) {
        Object.defineProperty(mongoose.connection, 'readyState', origReadyStateDesc);
      }
    }
  };
}

async function run() {
  console.log('=== SETU Google OAuth 2.0 Authentication Test Suite ===\n');

  // ---------------------------------------------------------
  // PART 1: Google ID Token Verifier Security Unit Tests
  // ---------------------------------------------------------
  console.log('[Part 1] Verifying Google Token Security Checks...');

  // 1a. Reject placeholder / missing GOOGLE_CLIENT_ID
  await assert.rejects(
    () => verifyGoogleIdToken('a.b.c', 'your_google_client_id.apps.googleusercontent.com'),
    (err: any) => err instanceof GoogleAuthError && err.code === 'GOOGLE_NOT_CONFIGURED' && err.statusCode === 503
  );
  await assert.rejects(
    () => verifyGoogleIdToken('a.b.c', 'setu-demo-client-id.apps.googleusercontent.com'),
    (err: any) => err instanceof GoogleAuthError && err.code === 'GOOGLE_NOT_CONFIGURED' && err.statusCode === 503
  );
  console.log('  ✓ Rejects missing or placeholder GOOGLE_CLIENT_ID (HTTP 503)');

  // 1b. Reject malformed credential
  await assert.rejects(
    () => verifyGoogleIdToken('not-a-jwt', '1234567890-abcdefg.apps.googleusercontent.com'),
    (err: any) => err instanceof GoogleAuthError && err.code === 'INVALID_CREDENTIAL' && err.statusCode === 401
  );
  console.log('  ✓ Rejects malformed credentials (HTTP 401)');

  // 1c. Reject unsigned / forged JWT (previously accepted by naive base64 decode!)
  const forgedHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const forgedPayload = Buffer.from(
    JSON.stringify({
      sub: 'fake-sub-123',
      email: 'priya.sharma.google@setu.demo',
      email_verified: true,
      name: 'Priya Sharma (Google)',
      iss: 'https://accounts.google.com',
      aud: '1234567890-abcdefg.apps.googleusercontent.com',
      exp: Math.floor(Date.now() / 1000) + 3600
    })
  ).toString('base64url');
  const forgedToken = `${forgedHeader}.${forgedPayload}.fake_signature`;

  await assert.rejects(
    () => verifyGoogleIdToken(forgedToken, '1234567890-abcdefg.apps.googleusercontent.com'),
    (err: any) =>
      err instanceof GoogleAuthError &&
      (err.code === 'INVALID_CREDENTIAL' || err.code === 'GOOGLE_UNAVAILABLE')
  );
  console.log('  ✓ Rejects unsigned/forged JWT tokens (no naive base64 trust)');

  // ---------------------------------------------------------
  // PART 2: End-to-End HTTP Authentication Flow Tests (1 - 7)
  // ---------------------------------------------------------
  console.log('\n[Part 2] Running End-to-End HTTP Authentication Flows...');

  let usingRealMongo = false;
  let memoryStore: ReturnType<typeof installInMemoryUserStore> | null = null;
  const createdEmails: string[] = [];

  try {
    await mongoose.connect(ENV.MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    usingRealMongo = true;
    console.log('  • Connected to live MongoDB instance');
  } catch {
    console.log('  • Local MongoDB unavailable in sandbox — using in-memory Mongoose store for HTTP route tests');
    memoryStore = installInMemoryUserStore();
  }

  // Seed isolated demo accounts if not present
  const salt = await bcrypt.genSalt(10);
  const demoPassHash = await bcrypt.hash('SetuDemo@2026', salt);
  const demoAdminHash = await bcrypt.hash('SetuAdmin@2026', salt);

  const ensureDemoUser = async (email: string, name: string, role: 'seeker' | 'employer' | 'admin', hash: string) => {
    const existing = await User.findOne({ email });
    if (!existing) {
      const u = new User({
        name,
        fullName: name,
        email,
        passwordHash: hash,
        role,
        authProvider: 'demo',
        isDemoAccount: true,
        emailVerified: true
      });
      await u.save();
    }
  };

  await ensureDemoUser('seeker@setu.demo', 'Priya Sharma', 'seeker', demoPassHash);
  await ensureDemoUser('employer@techcorp.demo', 'Gramin Digital Services Pvt Ltd', 'employer', demoPassHash);
  await ensureDemoUser('admin@setu.gov.in', 'SETU Platform Admin', 'admin', demoAdminHash);

  // Mock verified Google token responses keyed by test token
  const tokenDirectory: Record<string, VerifiedGoogleProfile | GoogleAuthError> = {
    'valid.google.userA': {
      googleId: 'google-sub-100001',
      fullName: 'Ananya Verma',
      email: 'ananya.verma.test@gmail.com',
      profilePicture: 'https://lh3.googleusercontent.com/a/ananya-photo',
      emailVerified: true
    },
    'valid.google.userB': {
      googleId: 'google-sub-100002',
      fullName: 'Meera Nair',
      email: 'meera.nair.test@gmail.com',
      profilePicture: '', // Tests initials fallback when Google photo absent
      emailVerified: true
    },
    'valid.google.demoEmail': {
      googleId: 'google-sub-999999',
      fullName: 'Demo Spoof',
      email: 'priya.sharma.google@setu.demo',
      profilePicture: '',
      emailVerified: true
    },
    'valid.google.existingLocal': {
      googleId: 'google-sub-100003',
      fullName: 'Kavita Joshi (Google)',
      email: 'kavita.local.test@gmail.com',
      profilePicture: 'https://lh3.googleusercontent.com/a/kavita-photo',
      emailVerified: true
    },
    'valid.google.differentSubSameEmail': {
      googleId: 'google-sub-DIFFERENT',
      fullName: 'Impersonator',
      email: 'kavita.local.test@gmail.com',
      profilePicture: '',
      emailVerified: true
    },
    'expired.google.token': new GoogleAuthError(
      'TOKEN_EXPIRED',
      401,
      'Your Google authentication session has expired. Please try signing in again.'
    ),
    'unverified.google.token': new GoogleAuthError(
      'EMAIL_NOT_VERIFIED',
      403,
      'Your Google account email is not verified. Please verify your email with Google before signing in.'
    )
  };

  setGoogleVerifierForTesting(async (idToken: string) => {
    const entry = tokenDirectory[idToken];
    if (!entry) {
      throw new GoogleAuthError(
        'INVALID_CREDENTIAL',
        401,
        'Invalid Google credential. Authentication could not be verified.'
      );
    }
    if (entry instanceof GoogleAuthError) {
      throw entry;
    }
    return entry;
  });

  const server = await new Promise<http.Server>((resolve) => {
    const srv = app.listen(0, '127.0.0.1', () => resolve(srv));
  });
  const port = (server.address() as any).port;

  try {
    // -------------------------------------------------------
    // Security Test: Reject client-supplied identity without credential
    // -------------------------------------------------------
    const fakeBodyRes = await request(port, 'POST', '/api/auth/google', {
      body: {
        email: 'priya.sharma.google@setu.demo',
        name: 'Priya Sharma (Google)',
        role: 'admin'
      }
    });
    assert.equal(fakeBodyRes.status, 400);
    assert.equal(fakeBodyRes.body.success, false);
    assert.equal(fakeBodyRes.cookies.setu_token, undefined);
    console.log('  ✓ Security: Rejects client-submitted email/name/role payload without Google credential');

    // -------------------------------------------------------
    // Security Test: Reject demo domain via Google Auth
    // -------------------------------------------------------
    const demoViaGoogleRes = await request(port, 'POST', '/api/auth/google', {
      body: { credential: 'valid.google.demoEmail' }
    });
    assert.equal(demoViaGoogleRes.status, 403);
    assert.equal(demoViaGoogleRes.cookies.setu_token, undefined);
    console.log('  ✓ Security: Blocks Google authentication from accessing or creating @setu.demo accounts');

    // -------------------------------------------------------
    // Security Test: Reject invalid, expired, and unverified Google tokens
    // -------------------------------------------------------
    const invalidTokRes = await request(port, 'POST', '/api/auth/google', {
      body: { credential: 'tampered.token.value' }
    });
    assert.equal(invalidTokRes.status, 401);
    assert.equal(invalidTokRes.cookies.setu_token, undefined);

    const expiredTokRes = await request(port, 'POST', '/api/auth/google', {
      body: { credential: 'expired.google.token' }
    });
    assert.equal(expiredTokRes.status, 401);

    const unverifiedRes = await request(port, 'POST', '/api/auth/google', {
      body: { credential: 'unverified.google.token' }
    });
    assert.equal(unverifiedRes.status, 403);
    console.log('  ✓ Security: Rejects invalid (401), expired (401), and unverified-email (403) Google tokens');

    // -------------------------------------------------------
    // TEST 1: New user signs in with Google
    // -------------------------------------------------------
    createdEmails.push('ananya.verma.test@gmail.com');
    const loginARes = await request(port, 'POST', '/api/auth/google', {
      body: { credential: 'valid.google.userA', role: 'admin' } // Even if attacker adds role:'admin', must assign 'seeker'!
    });
    assert.equal(loginARes.status, 200);
    assert.equal(loginARes.body.success, true);
    assert.equal(loginARes.body.data.isNewUser, true);
    assert.equal(loginARes.body.data.user.name, 'Ananya Verma');
    assert.equal(loginARes.body.data.user.fullName, 'Ananya Verma');
    assert.equal(loginARes.body.data.user.email, 'ananya.verma.test@gmail.com');
    assert.equal(loginARes.body.data.user.profilePicture, 'https://lh3.googleusercontent.com/a/ananya-photo');
    assert.equal(loginARes.body.data.user.authProvider, 'google');
    assert.equal(loginARes.body.data.user.emailVerified, true);
    assert.equal(loginARes.body.data.user.role, 'seeker');
    assert.equal(loginARes.body.data.user.isDemoAccount, false);
    assert.ok(loginARes.cookies.setu_token, 'HttpOnly setu_token cookie must be set');
    assert.ok(
      loginARes.rawSetCookies.some((c) => c.includes('setu_token=') && c.includes('HttpOnly')),
      'Cookie must have HttpOnly flag'
    );
    const cookieA = `setu_token=${loginARes.cookies.setu_token}`;
    const userAId = loginARes.body.data.user.id;
    console.log('  ✓ Test 1: New Google user created with real Google details, role=seeker, and HttpOnly cookie');

    // Verify new user dashboard starts empty (not Priya Sharma's data!)
    const dashARes = await request(port, 'GET', '/api/dashboard', { cookie: cookieA });
    assert.equal(dashARes.status, 200);
    assert.equal(dashARes.body.data.user.name, 'Ananya Verma');
    assert.deepEqual(dashARes.body.data.savedSkills, []);
    assert.equal(dashARes.body.data.skillsVerifiedCount, 0);
    assert.equal(dashARes.body.data.learningCompletedCount, 0);
    assert.equal(dashARes.body.data.portfolioProjectsCount, 0);
    assert.equal(dashARes.body.data.activeApplicationsCount, 0);
    assert.ok(dashARes.body.data.profileCompletionPercentage < 30, 'New user profile completion starts low');
    console.log('  ✓ Test 1b: New Google user dashboard initialized cleanly with empty stats & real user identity');

    // -------------------------------------------------------
    // TEST 2: Existing user updates profile & signs in again with Google
    // -------------------------------------------------------
    const updateARes = await request(port, 'PUT', '/api/users/profile', {
      cookie: cookieA,
      body: {
        name: 'Ananya Verma (Designer)',
        seekerProfile: {
          headline: 'UI & Graphic Designer',
          location: { city: 'Jaipur', state: 'Rajasthan', isRural: false },
          skills: ['Figma', 'Canva'],
          educationLevel: 'Graduate'
        }
      }
    });
    assert.equal(updateARes.status, 200);

    const reloginARes = await request(port, 'POST', '/api/auth/google', {
      body: { credential: 'valid.google.userA' }
    });
    assert.equal(reloginARes.status, 200);
    assert.equal(reloginARes.body.data.isNewUser, false);
    assert.equal(reloginARes.body.data.user.id, userAId, 'Must reuse existing account without duplicates');
    assert.equal(reloginARes.body.data.user.name, 'Ananya Verma (Designer)', 'Must preserve edited profile name');
    assert.equal(reloginARes.body.data.user.seekerProfile.headline, 'UI & Graphic Designer');
    assert.deepEqual(reloginARes.body.data.user.seekerProfile.skills, ['Figma', 'Canva']);
    assert.ok(reloginARes.body.data.user.lastLogin, 'Must update lastLogin');
    console.log('  ✓ Test 2: Existing Google user re-login preserves completed profile and prevents duplicates');

    // -------------------------------------------------------
    // TEST 3: Two different Google accounts sign in -> isolated dashboards
    // -------------------------------------------------------
    createdEmails.push('meera.nair.test@gmail.com');
    const loginBRes = await request(port, 'POST', '/api/auth/google', {
      body: { credential: 'valid.google.userB' }
    });
    assert.equal(loginBRes.status, 200);
    assert.equal(loginBRes.body.data.user.name, 'Meera Nair');
    assert.equal(loginBRes.body.data.user.email, 'meera.nair.test@gmail.com');
    assert.equal(loginBRes.body.data.user.profilePicture, '');
    assert.notEqual(loginBRes.body.data.user.id, userAId);
    const cookieB = `setu_token=${loginBRes.cookies.setu_token}`;

    const [dashA2, dashB] = await Promise.all([
      request(port, 'GET', '/api/dashboard', { cookie: cookieA }),
      request(port, 'GET', '/api/dashboard', { cookie: cookieB })
    ]);
    assert.equal(dashA2.body.data.user.email, 'ananya.verma.test@gmail.com');
    assert.deepEqual(dashA2.body.data.savedSkills, ['Figma', 'Canva']);
    assert.equal(dashB.body.data.user.email, 'meera.nair.test@gmail.com');
    assert.deepEqual(dashB.body.data.savedSkills, []);
    console.log('  ✓ Test 3: Two distinct Google accounts receive completely isolated sessions & dashboards');

    // -------------------------------------------------------
    // TEST 4: User signs out -> session ends & protected routes return 401
    // -------------------------------------------------------
    const logoutRes = await request(port, 'POST', '/api/auth/logout', { cookie: cookieA });
    assert.equal(logoutRes.status, 200);
    assert.ok(
      logoutRes.rawSetCookies.some((c) => c.includes('setu_token=;') || c.includes('Expires=Thu, 01 Jan 1970')),
      'Logout must clear setu_token cookie'
    );
    const meAfterLogout = await request(port, 'GET', '/api/auth/me');
    assert.equal(meAfterLogout.status, 401);
    console.log('  ✓ Test 4: Logout clears HttpOnly session cookie and blocks unauthenticated access (401)');

    // -------------------------------------------------------
    // TEST 5: Refresh dashboard maintains valid session; expired JWT rejected
    // -------------------------------------------------------
    const meRefresh = await request(port, 'GET', '/api/auth/me', { cookie: cookieB });
    assert.equal(meRefresh.status, 200);
    assert.equal(meRefresh.body.data.user.email, 'meera.nair.test@gmail.com');

    const expiredJwt = jwt.sign(
      { id: loginBRes.body.data.user.id, email: 'meera.nair.test@gmail.com', role: 'seeker' },
      ENV.JWT_SECRET,
      { expiresIn: -10 }
    );
    const expiredSessionRes = await request(port, 'GET', '/api/auth/me', {
      cookie: `setu_token=${expiredJwt}`
    });
    assert.equal(expiredSessionRes.status, 401);
    assert.match(expiredSessionRes.body.message, /expired/i);
    console.log('  ✓ Test 5: Valid session persists on refresh; expired session rejected cleanly (401)');

    // -------------------------------------------------------
    // TEST 6: User cancels Google login (empty credential) -> no session created
    // -------------------------------------------------------
    const cancelledRes = await request(port, 'POST', '/api/auth/google', {
      body: { credential: '' }
    });
    assert.equal(cancelledRes.status, 400);
    assert.equal(cancelledRes.cookies.setu_token, undefined);
    console.log('  ✓ Test 6: Cancelled Google login creates no session and never falls back to demo');

    // -------------------------------------------------------
    // TEST 7: Existing Demo logins still work independently
    // -------------------------------------------------------
    const demoSeekerLogin = await request(port, 'POST', '/api/auth/login', {
      body: { email: 'seeker@setu.demo', password: 'SetuDemo@2026' }
    });
    assert.equal(demoSeekerLogin.status, 200);
    assert.equal(demoSeekerLogin.body.data.user.email, 'seeker@setu.demo');
    assert.equal(demoSeekerLogin.body.data.user.isDemoAccount, true);

    const demoEmployerLogin = await request(port, 'POST', '/api/auth/login', {
      body: { email: 'employer@techcorp.demo', password: 'SetuDemo@2026' }
    });
    assert.equal(demoEmployerLogin.status, 200);
    assert.equal(demoEmployerLogin.body.data.user.role, 'employer');

    const demoAdminLogin = await request(port, 'POST', '/api/auth/login', {
      body: { email: 'admin@setu.gov.in', password: 'SetuAdmin@2026' }
    });
    assert.equal(demoAdminLogin.status, 200);
    assert.equal(demoAdminLogin.body.data.user.role, 'admin');
    console.log('  ✓ Test 7: Demo Seeker, Employer, and Admin logins work independently');

    // -------------------------------------------------------
    // Bonus Test 8: Existing email account safely links after verified Google ownership
    // -------------------------------------------------------
    createdEmails.push('kavita.local.test@gmail.com');
    const localReg = await request(port, 'POST', '/api/auth/register', {
      body: {
        name: 'Kavita Joshi',
        email: 'kavita.local.test@gmail.com',
        password: 'StrongPassword@123',
        role: 'seeker'
      }
    });
    assert.equal(localReg.status, 201);
    const localUserId = localReg.body.data.user.id;

    const linkedRes = await request(port, 'POST', '/api/auth/google', {
      body: { credential: 'valid.google.existingLocal' }
    });
    assert.equal(linkedRes.status, 200);
    assert.equal(linkedRes.body.data.user.id, localUserId, 'Must link existing account, not create duplicate');
    assert.equal(linkedRes.body.data.user.name, 'Kavita Joshi', 'Must preserve existing user name');
    assert.equal(linkedRes.body.data.user.profilePicture, 'https://lh3.googleusercontent.com/a/kavita-photo');

    // Different googleId with same email must be rejected (409)
    const conflictRes = await request(port, 'POST', '/api/auth/google', {
      body: { credential: 'valid.google.differentSubSameEmail' }
    });
    assert.equal(conflictRes.status, 409);
    console.log('  ✓ Bonus Test 8: Verified email linking preserves profile & blocks hijacking (409)');

    // -------------------------------------------------------
    // Bonus Test 9: Database unavailable -> 503 user-friendly error
    // -------------------------------------------------------
    if (memoryStore) {
      memoryStore.setReadyState(0);
      const dbDownRes = await request(port, 'POST', '/api/auth/google', {
        body: { credential: 'valid.google.userA' }
      });
      assert.equal(dbDownRes.status, 503);
      assert.match(dbDownRes.body.message, /database/i);
      memoryStore.setReadyState(1);
      console.log('  ✓ Bonus Test 9: Database connection failure returns clear HTTP 503 error');
    }

    // -------------------------------------------------------
    // Bonus Test 10: CORS rejects untrusted origins
    // -------------------------------------------------------
    const evilOriginRes = await request(port, 'GET', '/api/health', {
      headers: { Origin: 'https://evil-phishing-site.example' }
    });
    assert.equal(evilOriginRes.headers['access-control-allow-origin'], undefined);
    console.log('  ✓ Bonus Test 10: Untrusted CORS origins are blocked');

    console.log('\n✅ ALL GOOGLE OAUTH 2.0 AUTHENTICATION TESTS PASSED!');
  } finally {
    setGoogleVerifierForTesting(null);
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
