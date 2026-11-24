import { ENV } from '../config/env';

export interface TransactionalEmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export class EmailNotConfiguredError extends Error {
  constructor(
    message = 'Transactional email service is not configured on the server. Set RESEND_API_KEY or BREVO_API_KEY.'
  ) {
    super(message);
    this.name = 'EmailNotConfiguredError';
  }
}

export type EmailTestTransport = (payload: TransactionalEmailPayload) => Promise<void>;

let testTransport: EmailTestTransport | null = null;

/**
 * Registers an in-memory transport handler for automated unit/integration tests ONLY.
 */
export const setEmailTestTransport = (fn: EmailTestTransport | null): void => {
  testTransport = fn;
};

export const isEmailServiceConfigured = (): boolean => {
  return Boolean(testTransport || ENV.RESEND_API_KEY.trim() || ENV.BREVO_API_KEY.trim());
};

const escapeHtml = (str: string): string =>
  String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const wrapSetuEmailHtml = (opts: {
  heading: string;
  greeting: string;
  bodyHtml: string;
  securityNote: string;
}): string => {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <title>${escapeHtml(opts.heading)}</title>
  </head>
  <body style="margin:0;padding:24px 12px;background-color:#F8FCFF;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#334155;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;background-color:#FFFFFF;border:1px solid #D8ECFA;border-radius:20px;overflow:hidden;box-shadow:0 8px 24px rgba(162,210,255,0.22);">
      <tr>
        <td style="padding:24px 28px;background:linear-gradient(135deg,#EAF7FF 0%,#D6EEFF 100%);border-bottom:1px solid #D8ECFA;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td>
                <div style="display:inline-block;padding:6px 12px;border-radius:12px;background-color:#FFFFFF;border:1px solid #BDE0FE;font-weight:800;font-size:18px;letter-spacing:-0.02em;color:#1E3A5F;">
                  SETU <span style="color:#3B9EE8;">•</span>
                </div>
                <p style="margin:8px 0 0 0;font-size:11px;font-weight:600;color:#475569;">
                  Bridging Skills, Opportunities &amp; Employment
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:28px;">
          <h1 style="margin:0 0 12px 0;font-size:20px;font-weight:700;color:#1E3A5F;">
            ${escapeHtml(opts.heading)}
          </h1>
          <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#475569;">
            ${escapeHtml(opts.greeting)}
          </p>
          ${opts.bodyHtml}
          <div style="margin-top:24px;padding:14px 16px;border-radius:12px;background-color:#FFFBEB;border:1px solid #FDE68A;font-size:12px;line-height:1.55;color:#92400E;">
            <strong>Security Notice:</strong> ${escapeHtml(opts.securityNote)}
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 28px;background-color:#F8FCFF;border-top:1px solid #EAF7FF;font-size:11px;color:#64748B;text-align:center;">
          This automated message was sent by SETU Career Platform. Please do not share authentication links or codes with anyone.
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

async function sendViaResend(payload: TransactionalEmailPayload): Promise<void> {
  const from = ENV.EMAIL_FROM_NAME
    ? `${ENV.EMAIL_FROM_NAME} <${ENV.EMAIL_FROM}>`
    : ENV.EMAIL_FROM;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ENV.RESEND_API_KEY.trim()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text
    })
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Email provider (Resend) rejected delivery (${res.status}): ${errText.slice(0, 180)}`);
  }
}

async function sendViaBrevo(payload: TransactionalEmailPayload): Promise<void> {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': ENV.BREVO_API_KEY.trim(),
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      sender: {
        name: ENV.EMAIL_FROM_NAME || 'SETU Career Platform',
        email: ENV.EMAIL_FROM
      },
      to: [{ email: payload.to }],
      subject: payload.subject,
      htmlContent: payload.html,
      textContent: payload.text
    })
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Email provider (Brevo) rejected delivery (${res.status}): ${errText.slice(0, 180)}`);
  }
}

export async function sendTransactionalEmail(payload: TransactionalEmailPayload): Promise<void> {
  if (testTransport) {
    await testTransport(payload);
    return;
  }

  if (ENV.RESEND_API_KEY.trim()) {
    await sendViaResend(payload);
    return;
  }

  if (ENV.BREVO_API_KEY.trim()) {
    await sendViaBrevo(payload);
    return;
  }

  throw new EmailNotConfiguredError();
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  name?: string;
  resetUrl: string;
  expiresMinutes?: number;
}): Promise<void> {
  const minutes = opts.expiresMinutes ?? 15;
  const displayName = opts.name?.trim() || 'there';

  const html = wrapSetuEmailHtml({
    heading: 'Reset Your SETU Password',
    greeting: `Hi ${displayName}, we received a request to reset the password for your SETU account.`,
    bodyHtml: `
      <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#475569;">
        Click the button below to choose a new password. This link is valid for <strong>${minutes} minutes</strong> and can only be used once.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${escapeHtml(opts.resetUrl)}" style="display:inline-block;padding:13px 28px;border-radius:14px;background-color:#3B9EE8;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;">
          Reset Password
        </a>
      </div>
      <p style="margin:0;font-size:12px;line-height:1.5;color:#64748B;">
        If the button does not open, copy and paste this link into your browser:<br />
        <span style="word-break:break-all;color:#2589D6;">${escapeHtml(opts.resetUrl)}</span>
      </p>
    `,
    securityNote:
      'If you did not request a password reset, you can safely ignore this email. Your existing password remains unchanged.'
  });

  const text = `Hi ${displayName},\n\nWe received a request to reset your SETU account password.\nOpen this link within ${minutes} minutes (single-use):\n${opts.resetUrl}\n\nIf you did not request this, you can safely ignore this email.`;

  await sendTransactionalEmail({
    to: opts.to,
    subject: 'Reset Your SETU Password',
    html,
    text
  });
}

export async function sendPasswordChangedEmail(opts: {
  to: string;
  name?: string;
}): Promise<void> {
  const displayName = opts.name?.trim() || 'there';

  const html = wrapSetuEmailHtml({
    heading: 'Your SETU Password Was Updated',
    greeting: `Hi ${displayName}, this is a confirmation that the password on your SETU account was recently changed.`,
    bodyHtml: `
      <p style="margin:0;font-size:14px;line-height:1.6;color:#475569;">
        Other active sessions have been signed out automatically for your protection.
      </p>
    `,
    securityNote:
      'If you did not make this change, please reset your password immediately or sign out from all devices in Account Security Settings.'
  });

  const text = `Hi ${displayName},\n\nYour SETU account password was recently changed. Other active sessions were signed out for your protection.\nIf you did not make this change, reset your password immediately.`;

  await sendTransactionalEmail({
    to: opts.to,
    subject: 'Your SETU Password Was Changed',
    html,
    text
  });
}

export async function sendLoginOtpEmail(opts: {
  to: string;
  name?: string;
  otp: string;
  expiresMinutes?: number;
}): Promise<void> {
  const minutes = opts.expiresMinutes ?? 5;
  const displayName = opts.name?.trim() || 'there';

  const html = wrapSetuEmailHtml({
    heading: 'Your SETU Verification Code',
    greeting: `Hi ${displayName}, use the one-time verification code below to sign in to your SETU account.`,
    bodyHtml: `
      <div style="margin:22px 0;padding:18px;border-radius:16px;background-color:#EAF7FF;border:1px solid #BDE0FE;text-align:center;">
        <div style="font-size:32px;font-weight:800;letter-spacing:10px;color:#1E3A5F;font-family:'Courier New',monospace;">
          ${escapeHtml(opts.otp)}
        </div>
        <p style="margin:8px 0 0 0;font-size:12px;font-weight:600;color:#2589D6;">
          Expires in ${minutes} minutes • Single-use code
        </p>
      </div>
    `,
    securityNote:
      'SETU support will never ask you for this verification code. If you did not try to sign in, ignore this email.'
  });

  const text = `Hi ${displayName},\n\nYour SETU sign-in verification code is: ${opts.otp}\nThis code expires in ${minutes} minutes and can only be used once.\n\nNever share this code with anyone.`;

  await sendTransactionalEmail({
    to: opts.to,
    subject: 'Your SETU Sign-In Verification Code',
    html,
    text
  });
}

export async function sendEmailVerificationEmail(opts: {
  to: string;
  name?: string;
  verifyUrl: string;
}): Promise<void> {
  const displayName = opts.name?.trim() || 'there';

  const html = wrapSetuEmailHtml({
    heading: 'Verify Your SETU Email Address',
    greeting: `Hi ${displayName}, please confirm your email address to strengthen your SETU account security.`,
    bodyHtml: `
      <div style="text-align:center;margin:24px 0;">
        <a href="${escapeHtml(opts.verifyUrl)}" style="display:inline-block;padding:13px 28px;border-radius:14px;background-color:#3B9EE8;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;">
          Verify Email Address
        </a>
      </div>
      <p style="margin:0;font-size:12px;line-height:1.5;color:#64748B;">
        Link expires in 24 hours:<br />
        <span style="word-break:break-all;color:#2589D6;">${escapeHtml(opts.verifyUrl)}</span>
      </p>
    `,
    securityNote:
      'If you did not request email verification on SETU, you can safely ignore this message.'
  });

  const text = `Hi ${displayName},\n\nVerify your SETU email address using this link (valid for 24 hours):\n${opts.verifyUrl}`;

  await sendTransactionalEmail({
    to: opts.to,
    subject: 'Verify Your SETU Email Address',
    html,
    text
  });
}
