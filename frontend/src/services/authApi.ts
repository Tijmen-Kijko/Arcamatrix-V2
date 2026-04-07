export type AuthProvider = 'google' | 'email';

export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  auth_provider: AuthProvider;
  created_at: string;
}

export interface GoogleAuthRequest {
  id_token: string;
}

export interface EmailStartRequest {
  email: string;
}

export interface EmailVerifyRequest {
  token: string;
}

export interface EmailStartResponse {
  sent: true;
}

export interface AuthSuccessResponse {
  access_token: string;
  user: AuthUser;
  workspace_id: string;
  is_new_user: boolean;
}

interface StoredUser {
  user: AuthUser;
  workspaceId: string;
}

const usersByEmail = new Map<string, StoredUser>();
const tokensToEmail = new Map<string, string>();
const latestMagicLinkTokenByEmail = new Map<string, string>();

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const randomId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const toDisplayName = (email: string) => {
  const [localPart] = email.split('@');
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
};

const toWorkspaceId = (email: string) => {
  const [localPart] = email.split('@');
  const slug = localPart.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
  return `ws_${slug || 'workspace'}`;
};

const issueAccessToken = (email: string) =>
  `atk_${btoa(`${email}:${Date.now()}`).replace(/=+$/g, '')}`;

const upsertUser = (email: string, provider: AuthProvider) => {
  const normalizedEmail = normalizeEmail(email);
  const existingUser = usersByEmail.get(normalizedEmail);

  if (existingUser) {
    const updatedRecord: StoredUser = {
      ...existingUser,
      user: {
        ...existingUser.user,
        auth_provider: provider,
      },
    };

    usersByEmail.set(normalizedEmail, updatedRecord);

    return {
      record: updatedRecord,
      isNewUser: false,
    };
  }

  const createdRecord: StoredUser = {
    user: {
      id: randomId('user'),
      email: normalizedEmail,
      display_name: toDisplayName(normalizedEmail) || 'Arcamatrix User',
      auth_provider: provider,
      created_at: new Date().toISOString(),
    },
    workspaceId: toWorkspaceId(normalizedEmail),
  };

  usersByEmail.set(normalizedEmail, createdRecord);

  return {
    record: createdRecord,
    isNewUser: true,
  };
};

const toAuthResponse = (record: StoredUser, isNewUser: boolean): AuthSuccessResponse => ({
  access_token: issueAccessToken(record.user.email),
  user: record.user,
  workspace_id: record.workspaceId,
  is_new_user: isNewUser,
});

const parseMockGoogleToken = (idToken: string) => {
  const normalized = normalizeEmail(idToken);

  if (!normalized) {
    throw new Error('Google sign-in kon niet starten zonder id_token.');
  }

  if (isValidEmail(normalized)) {
    return normalized;
  }

  return `${normalized}@gmail.com`;
};

// Frontend stub for B-01 until the Mastra/Node backend exists in this workspace.
export async function postAuthGoogle(
  body: GoogleAuthRequest,
): Promise<AuthSuccessResponse> {
  await wait(320);

  const email = parseMockGoogleToken(body.id_token);
  const { record, isNewUser } = upsertUser(email, 'google');

  return toAuthResponse(record, isNewUser);
}

export async function postAuthEmailStart(
  body: EmailStartRequest,
): Promise<EmailStartResponse> {
  await wait(420);

  const email = normalizeEmail(body.email);

  if (!isValidEmail(email)) {
    throw new Error('Voer een geldig emailadres in om een magic link te ontvangen.');
  }

  const token = randomId('magic');
  tokensToEmail.set(token, email);
  latestMagicLinkTokenByEmail.set(email, token);

  return { sent: true };
}

export async function postAuthEmailVerify(
  body: EmailVerifyRequest,
): Promise<AuthSuccessResponse> {
  await wait(360);

  const email = tokensToEmail.get(body.token);

  if (!email) {
    throw new Error('Deze magic link is ongeldig of verlopen.');
  }

  tokensToEmail.delete(body.token);
  const { record, isNewUser } = upsertUser(email, 'email');

  return toAuthResponse(record, isNewUser);
}

export function peekMagicLinkToken(email: string) {
  return latestMagicLinkTokenByEmail.get(normalizeEmail(email)) ?? null;
}
