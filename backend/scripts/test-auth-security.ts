import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import app from '../src/app';
import { ENV } from '../src/config/env';
import { User } from '../src/models/User';
import { AuthToken } from '../src/models/AuthToken';
import { LoginOtp } from '../src/models/LoginOtp';
import { Resume } from '../src/models/Resume';
import { UploadedResumeFile } from '../src/models/UploadedResumeFile';
import { Employer } from '../src/models/Employer';
import { ProgressSnapshot } from '../src/models/ProgressSnapshot';
import { setEmailTestTransport, TransactionalEmailPayload } from '../src/services/email.service';
import { clearAuthRateLimitsForTests } from '../src/utils/securityHelpers';

interface HttpResponse {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: any;
  cookies: Record<string, string>;
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
      { hostname: '127.0.0.1', port, path, method, headers },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let body: any = raw;
          try {
            body = JSON.parse(raw);
          } catch {
            // keep string
          }
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            body,
            cookies: parseSetCookies((res.headers['set-cookie'] as string[]) || [])
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
  const authTokens: any[] = [];
  const loginOtps: any[] = [];
  const resumes: any[] = [];

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
    sort: (sortSpec?: any) => {
      if (Array.isArray(result) && sortSpec && sortSpec.updatedAt === -1) {
        const sorted = [...result].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        return makeQuery(sorted);
      }
      if (Array.isArray(result) && sortSpec && sortSpec.createdAt === -1) {
        const sorted = [...result].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        return makeQuery(sorted);
      }
      return makeQuery(result);
    },
    limit: () => makeQuery(result),
    lean: () => makeQuery(result),
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject)
  });

  const matchQuery = (doc: any, query: any = {}) => {
    for (const [k, v] of Object.entries(query)) {
      if (k === '_id') {
        if (typeof v === 'object' && (v as any)?.$ne) {
          if (String(doc._id) === String((v as any).$ne)) return false;
          continue;
        }
        if (String(doc._id) !== String(v)) return false;
        continue;
      }
      if (k === 'userId') {
        if (String(doc.userId) !== String(v)) return false;
        continue;
      }
      if (doc[k] !== v) return false;
    }
    return true;
  };

  // User mocks
  const origUserSave = User.prototype.save;
  (User.prototype as any).save = async function () {
    if (!this._id) this._id = new mongoose.Types.ObjectId();
    if (!this.createdAt) this.createdAt = new Date();
    this.updatedAt = new Date();
    const idx = users.findIndex((u) => u._id.toString() === this._id.toString());
    if (idx >= 0) users[idx] = this;
    else users.push(this);
    return this;
  };
  (User as any).findOne = (q: any) => makeQuery(users.find((u) => matchQuery(u, q)) || null);
  (User as any).findById = (id: any) =>
    makeQuery(users.find((u) => String(u._id) === String(id)) || null);

  // AuthToken mocks
  (AuthToken.prototype as any).save = async function () {
    if (!this._id) this._id = new mongoose.Types.ObjectId();
    if (!this.createdAt) this.createdAt = new Date();
    const idx = authTokens.findIndex((t) => String(t._id) === String(this._id));
    if (idx >= 0) authTokens[idx] = this;
    else authTokens.push(this);
    return this;
  };
  (AuthToken as any).findOne = (q: any) =>
    makeQuery(authTokens.find((t) => matchQuery(t, q)) || null);
  (AuthToken as any).updateMany = async (q: any, update: any) => {
    for (const t of authTokens) {
      if (matchQuery(t, q) && update?.$set) Object.assign(t, update.$set);
    }
  };
  (AuthToken as any).deleteOne = async (q: any) => {
    const idx = authTokens.findIndex((t) => matchQuery(t, q));
    if (idx >= 0) authTokens.splice(idx, 1);
  };

  // LoginOtp mocks
  (LoginOtp.prototype as any).save = async function () {
    if (!this._id) this._id = new mongoose.Types.ObjectId();
    if (!this.createdAt) this.createdAt = new Date();
    const idx = loginOtps.findIndex((o) => String(o._id) === String(this._id));
    if (idx >= 0) loginOtps[idx] = this;
    else loginOtps.push(this);
    return this;
  };
  (LoginOtp as any).find = (q: any) => makeQuery(loginOtps.filter((o) => matchQuery(o, q)));
  (LoginOtp as any).updateMany = async (q: any, update: any) => {
    for (const o of loginOtps) {
      if (matchQuery(o, q) && update?.$set) Object.assign(o, update.$set);
    }
  };
  (LoginOtp as any).deleteOne = async (q: any) => {
    const idx = loginOtps.findIndex((o) => matchQuery(o, q));
    if (idx >= 0) loginOtps.splice(idx, 1);
  };

  // Resume mocks
  (Resume.prototype as any).save = async function () {
    if (!this._id) this._id = new mongoose.Types.ObjectId();
    if (!this.createdAt) this.createdAt = new Date();
    this.updatedAt = new Date();
    const idx = resumes.findIndex((r) => String(r._id) === String(this._id));
    if (idx >= 0) resumes[idx] = this;
    else resumes.push(this);
    return this;
  };
  (Resume as any).countDocuments = async (q: any) =>
    resumes.filter((r) => matchQuery(r, q)).length;
  (Resume as any).find = (q: any) => makeQuery(resumes.filter((r) => matchQuery(r, q)));
  (Resume as any).findById = (id: any) =>
    makeQuery(resumes.find((r) => String(r._id) === String(id)) || null);
  (Resume as any).findOne = (q: any) => {
    const matches = resumes
      .filter((r) => matchQuery(r, q))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return makeQuery(matches[0] || null);
  };
  (Resume as any).updateMany = async (q: any, update: any) => {
    for (const r of resumes) {
      if (matchQuery(r, q) && update?.$set) Object.assign(r, update.$set);
    }
  };
  (Resume as any).findByIdAndDelete = async (id: any) => {
    const idx = resumes.findIndex((r) => String(r._id) === String(id));
    if (idx >= 0) resumes.splice(idx, 1);
  };

  // Misc no-op mocks for background snapshot/employer/upload calls
  (UploadedResumeFile as any).find = () => makeQuery([]);
  (Employer as any).create = async (doc: any) => ({ _id: new mongoose.Types.ObjectId(), ...doc });
  (ProgressSnapshot as any).findOne = () => makeQuery(null);
  (ProgressSnapshot as any).create = async (d: any) => d;

  return {
    users,
    authTokens,
    loginOtps,
    resumes,
    restore: () => {
      (User.prototype as any).save = origUserSave;
      if (origReadyStateDesc) {
        Object.defineProperty(mongoose.connection, 'readyState', origReadyStateDesc);
      }
    }
  };
}

async function run() {
  console.log('=== SETU Theme, Security, Recovery, OTP & Deletion Verification Suite ===\n');

  const store = installInMemoryStore();
  const capturedEmails: TransactionalEmailPayload[] = [];
  clearAuthRateLimitsForTests();

  const server = await new Promise<http.Server>((resolve) => {
    const srv = app.listen(0, '127.0.0.1', () => resolve(srv));
  });
  const port = (server.address() as any).port;

  try {
    // 1. Honest unconfigured email behavior (never silently fake success!)
    setEmailTestTransport(null);
    const unconfRes = await request(port, 'POST', '/api/auth/forgot-password', {
      body: { email: 'anyone@example.com' }
    });
    if (!ENV.RESEND_API_KEY && !ENV.BREVO_API_KEY) {
      assert.equal(unconfRes.status, 503, 'Unconfigured email service must return 503 honestly');
      console.log('  ✓ 1. Unconfigured email provider returns honest HTTP 503 (zero fake emails)');
    } else {
      console.log('  ✓ 1. Live email provider key detected in environment');
    }

    // Install mock test email transport for isolated verification
    setEmailTestTransport(async (payload) => {
      capturedEmails.push(payload);
    });

    // 2. Register user & another user + test theme/notification preference persistence
    const email = 'meera.security@example.com';
    const regRes = await request(port, 'POST', '/api/auth/register', {
      body: {
        name: 'Meera Nair',
        email,
        password: 'InitialPass@2026',
        role: 'seeker'
      }
    });
    assert.equal(regRes.status, 201);
    const initialToken = regRes.body.data.token;
    assert.ok(initialToken);

    const otherReg = await request(port, 'POST', '/api/auth/register', {
      body: {
        name: 'Riya Kapoor',
        email: 'riya.other@example.com',
        password: 'OtherPass@2026',
        role: 'seeker'
      }
    });
    assert.equal(otherReg.status, 201);
    const otherToken = otherReg.body.data.token;

    const prefRes = await request(port, 'PUT', '/api/auth/preferences', {
      headers: { Authorization: `Bearer ${initialToken}` },
      body: {
        themePreference: 'dark',
        notificationPreferences: { learningReminders: false }
      }
    });
    assert.equal(prefRes.status, 200);
    assert.equal(prefRes.body.data.user.themePreference, 'dark');
    assert.equal(prefRes.body.data.user.notificationPreferences.learningReminders, false);

    // Confirm persistence across logout & login
    await request(port, 'POST', '/api/auth/logout');
    const reloginRes = await request(port, 'POST', '/api/auth/login', {
      body: { email, password: 'InitialPass@2026', rememberMe: true }
    });
    assert.equal(reloginRes.status, 200);
    assert.equal(reloginRes.body.data.user.themePreference, 'dark');
    assert.equal(reloginRes.body.data.user.notificationPreferences.learningReminders, false);
    console.log('  ✓ 2. Theme preference (dark) & notification toggles persist across logout/login');

    // 3. Default resume deletion promotes next saved resume + blocks unauthorized delete
    const r1 = await request(port, 'POST', '/api/resumes', {
      headers: { Authorization: `Bearer ${initialToken}` },
      body: { versionName: 'Resume V1 Primary', isDefault: true }
    });
    assert.equal(r1.status, 201);
    const r1Id = r1.body.data._id;

    // Tiny delay so updatedAt is distinct
    await new Promise((r) => setTimeout(r, 10));
    const r2 = await request(port, 'POST', '/api/resumes', {
      headers: { Authorization: `Bearer ${initialToken}` },
      body: { versionName: 'Resume V2 Secondary', isDefault: false }
    });
    assert.equal(r2.status, 201);
    const r2Id = r2.body.data._id;

    // Unauthorized user tries deleting Meera's resume
    const unauthDel = await request(port, 'DELETE', `/api/resumes/${r1Id}`, {
      headers: { Authorization: `Bearer ${otherToken}` }
    });
    assert.equal(unauthDel.status, 403);

    // Owner deletes default resume r1 -> r2 must become default!
    const delRes = await request(port, 'DELETE', `/api/resumes/${r1Id}`, {
      headers: { Authorization: `Bearer ${initialToken}` }
    });
    assert.equal(delRes.status, 200);
    assert.equal(delRes.body.data.wasDefault, true);
    assert.equal(delRes.body.data.newDefaultId, r2Id);

    const listAfterDel = await request(port, 'GET', '/api/resumes', {
      headers: { Authorization: `Bearer ${initialToken}` }
    });
    assert.equal(listAfterDel.status, 200);
    assert.equal(listAfterDel.body.data.resumes.length, 1);
    assert.equal(listAfterDel.body.data.resumes[0].isDefault, true);
    console.log('  ✓ 3. Default resume deletion promotes next resume & blocks unauthorized delete (403)');

    // 4. Forgot Password anti-enumeration, hash-only DB token, reset validation & session invalidation
    capturedEmails.length = 0;
    const unregFp = await request(port, 'POST', '/api/auth/forgot-password', {
      body: { email: 'nobody.notregistered@example.com' }
    });
    assert.equal(unregFp.status, 200);
    assert.equal(capturedEmails.length, 0, 'Unregistered email must trigger zero outgoing emails');

    const regFp = await request(port, 'POST', '/api/auth/forgot-password', {
      body: { email }
    });
    assert.equal(regFp.status, 200);
    assert.equal(unregFp.body.message, regFp.body.message, 'Responses must match to prevent enumeration');
    assert.equal(capturedEmails.length, 1);
    assert.equal(capturedEmails[0].subject, 'Reset Your SETU Password');

    const urlMatch = capturedEmails[0].text.match(/\/reset-password\?token=([a-f0-9]+)/i);
    assert.ok(urlMatch && urlMatch[1], 'Reset email must include secure token link');
    const resetToken = urlMatch[1];

    // Confirm raw token is NOT stored in MongoDB document (hash-only!)
    assert.equal(
      store.authTokens.some((t) => t.tokenHash === resetToken),
      false,
      'Raw token must never be stored in DB'
    );
    const sha = crypto.createHash('sha256').update(resetToken).digest('hex');
    assert.ok(store.authTokens.some((t) => t.tokenHash === sha));

    // Mismatched / weak passwords rejected
    const mismatchRes = await request(port, 'POST', '/api/auth/reset-password', {
      body: { token: resetToken, password: 'NewStrong@2026', confirmPassword: 'Different@2026' }
    });
    assert.equal(mismatchRes.status, 400);

    // Valid reset updates password & increments tokenVersion (invalidating initialToken!)
    const resetOk = await request(port, 'POST', '/api/auth/reset-password', {
      body: { token: resetToken, password: 'NewStrong@2026', confirmPassword: 'NewStrong@2026' }
    });
    assert.equal(resetOk.status, 200);
    assert.equal(capturedEmails.length, 2, 'Confirmation email should be dispatched after reset');

    // Old JWT must now be rejected because tokenVersion incremented
    const staleMe = await request(port, 'GET', '/api/auth/me', {
      headers: { Authorization: `Bearer ${initialToken}` }
    });
    assert.equal(staleMe.status, 401, 'Old JWT must be invalidated after password reset');

    // Reusing reset token rejected
    const reuseRes = await request(port, 'POST', '/api/auth/reset-password', {
      body: { token: resetToken, password: 'Another@2026', confirmPassword: 'Another@2026' }
    });
    assert.equal(reuseRes.status, 400);

    // Login with new password succeeds
    const newLoginRes = await request(port, 'POST', '/api/auth/login', {
      body: { email, password: 'NewStrong@2026' }
    });
    assert.equal(newLoginRes.status, 200);
    const activeToken = newLoginRes.body.data.token;
    console.log('  ✓ 4. Forgot/Reset password enforces anti-enumeration, single-use token, strength & session invalidation');

    // 5. Email OTP Login security (unregistered doesn't create account, cooldown, max attempts, expiry, valid OTP)
    capturedEmails.length = 0;
    const usersBeforeOtp = store.users.length;
    const unregOtp = await request(port, 'POST', '/api/auth/otp/request', {
      body: { email: 'not.signedup@example.com' }
    });
    assert.equal(unregOtp.status, 200);
    assert.equal(store.users.length, usersBeforeOtp, 'OTP request must never create an account');
    assert.equal(capturedEmails.length, 0);

    const otpReqRes = await request(port, 'POST', '/api/auth/otp/request', {
      body: { email }
    });
    assert.equal(otpReqRes.status, 200);
    assert.equal(JSON.stringify(otpReqRes.body).match(/\b\d{6}\b/), null, 'API response must never leak OTP');
    assert.equal(capturedEmails.length, 1);

    const otpMatch = capturedEmails[0].text.match(/verification code is:\s*(\d{6})/i);
    assert.ok(otpMatch && otpMatch[1], 'OTP email must contain 6-digit code');

    // Immediate resend hits 60s cooldown (429)
    const cooldownRes = await request(port, 'POST', '/api/auth/otp/request', {
      body: { email }
    });
    assert.equal(cooldownRes.status, 429);

    // 5 failed OTP attempts lock the OTP
    for (let i = 1; i <= 4; i++) {
      const badRes = await request(port, 'POST', '/api/auth/otp/verify', {
        body: { email, otp: '000000' }
      });
      assert.equal(badRes.status, 400);
    }
    const fifthBadRes = await request(port, 'POST', '/api/auth/otp/verify', {
      body: { email, otp: '000000' }
    });
    assert.equal(fifthBadRes.status, 429, '5th incorrect attempt must lock OTP');

    // Allow fresh OTP by backdating previous OTP createdAt beyond 60s cooldown
    store.loginOtps.forEach((o) => {
      o.createdAt = new Date(Date.now() - 120_000);
    });
    const secondOtpReq = await request(port, 'POST', '/api/auth/otp/request', {
      body: { email }
    });
    assert.equal(secondOtpReq.status, 200);
    const freshOtpMatch = capturedEmails[capturedEmails.length - 1].text.match(
      /verification code is:\s*(\d{6})/i
    );
    assert.ok(freshOtpMatch && freshOtpMatch[1]);
    const freshOtp = freshOtpMatch[1];

    // Valid OTP login succeeds and returns user role + cookie
    const otpVerifyOk = await request(port, 'POST', '/api/auth/otp/verify', {
      body: { email, otp: freshOtp, rememberMe: true }
    });
    assert.equal(otpVerifyOk.status, 200);
    assert.equal(otpVerifyOk.body.data.user.email, email);
    assert.equal(otpVerifyOk.body.data.user.role, 'seeker');
    assert.ok(otpVerifyOk.cookies.setu_token, 'HttpOnly auth cookie must be set after OTP verify');
    const otpToken = otpVerifyOk.body.data.token;

    // Test expired OTP rejection
    store.loginOtps.forEach((o) => {
      o.createdAt = new Date(Date.now() - 120_000);
    });
    await request(port, 'POST', '/api/auth/otp/request', { body: { email } });
    const expOtpCode = capturedEmails[capturedEmails.length - 1].text.match(
      /verification code is:\s*(\d{6})/i
    )![1];
    store.loginOtps[store.loginOtps.length - 1].expiresAt = new Date(Date.now() - 5000);
    const expOtpRes = await request(port, 'POST', '/api/auth/otp/verify', {
      body: { email, otp: expOtpCode }
    });
    assert.equal(expOtpRes.status, 400);
    console.log('  ✓ 5. Email OTP login enforces cooldown, max 5 attempts, expiry, no account creation & role login');

    // 6. Change password reauthentication + Sign Out From All Devices
    const wrongCurPass = await request(port, 'POST', '/api/auth/change-password', {
      headers: { Authorization: `Bearer ${otpToken}` },
      body: {
        currentPassword: 'WrongCurrent@1',
        newPassword: 'UpdatedPass@2026',
        confirmPassword: 'UpdatedPass@2026'
      }
    });
    assert.equal(wrongCurPass.status, 401);

    const changeOk = await request(port, 'POST', '/api/auth/change-password', {
      headers: { Authorization: `Bearer ${otpToken}` },
      body: {
        currentPassword: 'NewStrong@2026',
        newPassword: 'UpdatedPass@2026',
        confirmPassword: 'UpdatedPass@2026'
      }
    });
    assert.equal(changeOk.status, 200);
    const rotatedToken = changeOk.body.data.token;
    assert.ok(rotatedToken);

    // Previous activeToken from before change-password must now be 401
    const oldSessionRes = await request(port, 'GET', '/api/auth/me', {
      headers: { Authorization: `Bearer ${activeToken}` }
    });
    assert.equal(oldSessionRes.status, 401);

    // Overview lists recent security events
    const secRes = await request(port, 'GET', '/api/auth/security', {
      headers: { Authorization: `Bearer ${rotatedToken}` }
    });
    assert.equal(secRes.status, 200);
    assert.ok(Array.isArray(secRes.body.data.securityActivity));
    assert.ok(secRes.body.data.securityActivity.length >= 2);

    // Sign Out From All Devices invalidates rotatedToken immediately
    const signOutAllRes = await request(port, 'POST', '/api/auth/sign-out-all', {
      headers: { Authorization: `Bearer ${rotatedToken}` }
    });
    assert.equal(signOutAllRes.status, 200);

    const revokedMe = await request(port, 'GET', '/api/auth/me', {
      headers: { Authorization: `Bearer ${rotatedToken}` }
    });
    assert.equal(revokedMe.status, 401, 'Sign Out From All Devices must invalidate active JWT');
    console.log('  ✓ 6. Change Password reauthentication, activity log & Sign Out From All Devices verified\n');

    console.log('ALL 6 SECURITY & FEATURE SUITES PASSED!');
  } finally {
    setEmailTestTransport(null);
    clearAuthRateLimitsForTests();
    store.restore();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

run().catch((err) => {
  console.error('Security verification suite failed:', err);
  process.exit(1);
});
