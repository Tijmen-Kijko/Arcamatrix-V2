export type TokenBudgetTier = 'sandbox' | 'free' | 'premium';

export interface DemoSessionResponse {
  sessionId: string;
  sandboxId: string;
  expiresAt: string;
  tokenBudget: number;
  tier: 'sandbox';
}

export interface TokenStatusResponse {
  used: number;
  limit: number | null;
  remaining: number | null;
  resets_at: string | null;
  tier: TokenBudgetTier;
  exhausted: boolean;
  upgrade_prompt: string | null;
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

export async function createDemoSession(): Promise<DemoSessionResponse> {
  const response = await fetch('/api/demo/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return readJson<DemoSessionResponse>(response);
}

export async function sendMessage(sessionId: string, text: string): Promise<void> {
  const response = await fetch(`/api/stream/${encodeURIComponent(sessionId)}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`Send failed with status ${response.status}.`);
  }
}

export async function getTokenStatus(query: {
  sessionId?: string;
  userId?: string;
}): Promise<TokenStatusResponse> {
  const params = new URLSearchParams();

  if (query.sessionId) {
    params.set('session_id', query.sessionId);
  }

  if (query.userId) {
    params.set('user_id', query.userId);
  }

  const response = await fetch(`/api/tokens/status?${params.toString()}`);
  return readJson<TokenStatusResponse>(response);
}
