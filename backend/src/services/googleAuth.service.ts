import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { ENV, isGoogleClientIdValid } from '../config/env';

export interface VerifiedGoogleProfile {
  googleId: string;
  fullName: string;
  email: string;
  profilePicture: string;
  emailVerified: boolean;
}

export type GoogleAuthErrorCode =
  | 'GOOGLE_NOT_CONFIGURED'
  | 'INVALID_CREDENTIAL'
  | 'TOKEN_EXPIRED'
  | 'AUDIENCE_MISMATCH'
  | 'EMAIL_NOT_VERIFIED'
  | 'GOOGLE_UNAVAILABLE';

export class GoogleAuthError extends Error {
  public readonly code: GoogleAuthErrorCode;
  public readonly statusCode: number;

  constructor(code: GoogleAuthErrorCode, statusCode: number, message: string) {
    super(message);
    this.name = 'GoogleAuthError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

const VALID_GOOGLE_ISSUERS = new Set([
  'accounts.google.com',
  'https://accounts.google.com'
]);

let cachedClient: OAuth2Client | null = null;
let cachedClientId = '';

const getOAuthClient = (clientId: string): OAuth2Client => {
  if (!cachedClient || cachedClientId !== clientId) {
    cachedClient = new OAuth2Client(clientId);
    cachedClientId = clientId;
  }
  return cachedClient;
};

export interface GoogleTokenVerifier {
  verifyIdToken: (idToken: string) => Promise<VerifiedGoogleProfile>;
}

/**
 * Verifies a Google Identity Services ID Token (JWT) using Google's official google-auth-library.
 * Validates cryptographic signature, issuer, audience, expiration, and email verification status.
 */
export const verifyGoogleIdToken = async (
  idToken: string,
  clientIdOverride?: string
): Promise<VerifiedGoogleProfile> => {
  const clientId = (clientIdOverride ?? ENV.GOOGLE_CLIENT_ID).trim();

  if (!isGoogleClientIdValid(clientId)) {
    throw new GoogleAuthError(
      'GOOGLE_NOT_CONFIGURED',
      503,
      'Google Sign-In is not configured on the server. Please configure a valid GOOGLE_CLIENT_ID.'
    );
  }

  if (!idToken || typeof idToken !== 'string' || idToken.split('.').length !== 3) {
    throw new GoogleAuthError(
      'INVALID_CREDENTIAL',
      401,
      'Invalid Google credential. Please sign in with Google again.'
    );
  }

  let payload: TokenPayload | undefined;

  try {
    const client = getOAuthClient(clientId);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId
    });
    payload = ticket.getPayload();
  } catch (err: any) {
    const msg = String(err?.message || '').toLowerCase();

    if (msg.includes('token used too late') || msg.includes('expired')) {
      throw new GoogleAuthError(
        'TOKEN_EXPIRED',
        401,
        'Your Google authentication session has expired. Please try signing in again.'
      );
    }

    if (msg.includes('wrong recipient') || msg.includes('audience')) {
      throw new GoogleAuthError(
        'AUDIENCE_MISMATCH',
        401,
        'Google authentication configuration mismatch. Please contact support.'
      );
    }

    if (
      msg.includes('enotfound') ||
      msg.includes('econnrefused') ||
      msg.includes('etimedout') ||
      msg.includes('network') ||
      msg.includes('fetch')
    ) {
      throw new GoogleAuthError(
        'GOOGLE_UNAVAILABLE',
        503,
        'Unable to verify Google credentials right now due to a network issue. Please try again.'
      );
    }

    throw new GoogleAuthError(
      'INVALID_CREDENTIAL',
      401,
      'Invalid Google credential. Authentication could not be verified.'
    );
  }

  if (!payload) {
    throw new GoogleAuthError(
      'INVALID_CREDENTIAL',
      401,
      'Unable to extract verified profile from Google credential.'
    );
  }

  // Defense-in-depth validation of issuer, audience, expiration, subject, and verified email
  if (!payload.iss || !VALID_GOOGLE_ISSUERS.has(payload.iss)) {
    throw new GoogleAuthError(
      'INVALID_CREDENTIAL',
      401,
      'Google token issuer could not be verified.'
    );
  }

  if (payload.aud !== clientId) {
    throw new GoogleAuthError(
      'AUDIENCE_MISMATCH',
      401,
      'Google authentication token audience mismatch.'
    );
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp <= nowSec) {
    throw new GoogleAuthError(
      'TOKEN_EXPIRED',
      401,
      'Your Google authentication token has expired. Please try signing in again.'
    );
  }

  if (!payload.sub || !payload.email) {
    throw new GoogleAuthError(
      'INVALID_CREDENTIAL',
      401,
      'Google credential is missing required account identity information.'
    );
  }

  if (payload.email_verified !== true) {
    throw new GoogleAuthError(
      'EMAIL_NOT_VERIFIED',
      403,
      'Your Google account email is not verified. Please verify your email with Google before signing in.'
    );
  }

  const derivedName =
    (payload.name || '').trim() ||
    [payload.given_name, payload.family_name].filter(Boolean).join(' ').trim() ||
    payload.email.split('@')[0];

  return {
    googleId: payload.sub,
    fullName: derivedName,
    email: payload.email.toLowerCase().trim(),
    profilePicture: (payload.picture || '').trim(),
    emailVerified: true
  };
};

// Allow injecting a custom verifier in automated tests without changing production behavior
let activeVerifier: (idToken: string) => Promise<VerifiedGoogleProfile> = verifyGoogleIdToken;

export const getActiveGoogleVerifier = () => activeVerifier;

export const setGoogleVerifierForTesting = (
  verifier: ((idToken: string) => Promise<VerifiedGoogleProfile>) | null
): void => {
  activeVerifier = verifier ?? verifyGoogleIdToken;
};
