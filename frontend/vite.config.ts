import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const SANDBOX_TOKEN_LIMIT = 5_000;
const FREE_TOKEN_LIMIT = 25_000;
const SESSION_TTL_MS = 30 * 60 * 1000;
const STREAM_PATH = '/api/stream/';
const SESSION_PATH = '/api/demo/session';
const TOKEN_STATUS_PATH = '/api/tokens/status';

type BudgetTier = 'sandbox' | 'free' | 'premium';

type DemoMessage =
  | { id: string; type: 'user'; text: string }
  | { id: string; type: 'ai-status'; text: string }
  | { id: string; type: 'ai-pills'; items: string[] }
  | { id: string; type: 'ai-text'; text: string };

type StreamPayload =
  | { type: 'message'; message: DemoMessage }
  | { type: 'token'; messageId: string; chunk: string }
  | { type: 'usage'; used: number; limit: number | null }
  | {
      type: 'budget_exhausted';
      status_code: 429;
      tier: BudgetTier;
      used: number;
      limit: number | null;
      resets_at: string | null;
      prompt: string;
    }
  | { type: 'demo_complete' }
  | { type: 'done' };

type BudgetState = {
  tier: BudgetTier;
  used: number;
  limit: number | null;
  resetsAt: string | null;
};

type DemoSession = {
  sandboxId: string;
  expiresAt: string;
};

type BudgetSubjectResolution =
  | { tier: BudgetTier; subjectId: string; error?: undefined }
  | { error: { statusCode: number; payload: { error: string } }; tier?: undefined; subjectId?: undefined };

function json(response: ServerResponse, statusCode: number, payload: unknown) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(payload));
}

function sse(response: ServerResponse, event: StreamPayload['type'], payload: StreamPayload) {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function chunksFor(text: string) {
  return text.match(/\S+\s*/g) ?? [];
}

function getNextUtcMidnightIso(now = new Date()) {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  ).toISOString();
}

function getUpgradePrompt(tier: BudgetTier) {
  if (tier === 'sandbox') {
    return 'Je sandbox-budget is op. Maak een gratis account aan voor 25K tokens per dag.';
  }

  if (tier === 'free') {
    return 'Je gratis dagbudget is op. Upgrade naar premium voor onbeperkte runs.';
  }

  return 'Je plan heeft een upgrade nodig om verder te gaan.';
}

function estimateTokenCost(chunk: string) {
  return Math.max(1, Math.ceil(chunk.trim().length / 4));
}

function budgetKeyFor(tier: BudgetTier, subjectId: string) {
  return `${tier}:${subjectId}`;
}

function ensureBudget(
  budgets: Map<string, BudgetState>,
  tier: BudgetTier,
  subjectId: string,
) {
  const key = budgetKeyFor(tier, subjectId);
  const existing = budgets.get(key);

  if (existing) {
    return existing;
  }

  const created: BudgetState =
    tier === 'sandbox'
      ? { tier, used: 0, limit: SANDBOX_TOKEN_LIMIT, resetsAt: null }
      : tier === 'free'
        ? { tier, used: 0, limit: FREE_TOKEN_LIMIT, resetsAt: getNextUtcMidnightIso() }
        : { tier, used: 0, limit: null, resetsAt: null };

  budgets.set(key, created);
  return created;
}

function readBudgetStatus(
  budgets: Map<string, BudgetState>,
  tier: BudgetTier,
  subjectId: string,
) {
  const budget = ensureBudget(budgets, tier, subjectId);

  if (budget.tier === 'free' && budget.resetsAt) {
    const now = Date.now();
    const resetAt = new Date(budget.resetsAt).getTime();

    if (Number.isFinite(resetAt) && now >= resetAt) {
      budget.used = 0;
      budget.resetsAt = getNextUtcMidnightIso();
    }
  }

  const limit = budget.limit;
  const exhausted = limit !== null ? budget.used >= limit : false;

  return {
    used: budget.used,
    limit,
    remaining: limit === null ? null : Math.max(limit - budget.used, 0),
    resets_at: budget.resetsAt,
    tier: budget.tier,
    exhausted,
    upgrade_prompt: exhausted ? getUpgradePrompt(budget.tier) : null,
  };
}

function consumeBudget(
  budgets: Map<string, BudgetState>,
  tier: BudgetTier,
  subjectId: string,
  amount: number,
) {
  const budget = ensureBudget(budgets, tier, subjectId);

  if (budget.limit === null) {
    return readBudgetStatus(budgets, tier, subjectId);
  }

  budget.used = Math.min(budget.used + amount, budget.limit);
  return readBudgetStatus(budgets, tier, subjectId);
}

function canConsume(status: ReturnType<typeof readBudgetStatus>, amount: number) {
  return status.remaining === null || status.remaining >= amount;
}

function statusLabelFor(tier: BudgetTier) {
  return tier === 'sandbox' ? 'Sandbox tokenbudget bereikt.' : 'Dagbudget bereikt.';
}

function resolveBudgetSubject(
  request: IncomingMessage,
  sessions: Map<string, DemoSession>,
): BudgetSubjectResolution {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const sessionId = url.searchParams.get('session_id');
  const userId = url.searchParams.get('user_id');
  const requestedTier = url.searchParams.get('tier');

  if (sessionId) {
    const session = sessions.get(sessionId);

    if (!session) {
      return { error: { statusCode: 404, payload: { error: 'Unknown sandbox session.' } } };
    }

    return { tier: 'sandbox' as const, subjectId: session.sandboxId };
  }

  if (userId) {
    const tier: BudgetTier = requestedTier === 'premium' ? 'premium' : 'free';
    return { tier, subjectId: userId };
  }

  return {
    error: {
      statusCode: 400,
      payload: { error: 'Provide session_id or user_id to inspect token status.' },
    },
  };
}

function registerHermesSsePlugin(): Plugin {
  const sessions = new Map<string, DemoSession>();
  const budgets = new Map<string, BudgetState>();

  const middleware = (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ) => {
    const path = request.url?.split('?')[0] ?? '';

    if (request.method === 'POST' && path === SESSION_PATH) {
      const sessionId = randomUUID();
      const sandboxId = randomUUID();
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

      sessions.set(sessionId, { sandboxId, expiresAt });
      ensureBudget(budgets, 'sandbox', sandboxId);

      json(response, 200, {
        sessionId,
        sandboxId,
        expiresAt,
        tokenBudget: SANDBOX_TOKEN_LIMIT,
        tier: 'sandbox',
      });
      return;
    }

    if (request.method === 'GET' && path === TOKEN_STATUS_PATH) {
      const subject = resolveBudgetSubject(request, sessions);

      if (subject.error) {
        json(response, subject.error.statusCode, subject.error.payload);
        return;
      }

      json(response, 200, readBudgetStatus(budgets, subject.tier, subject.subjectId));
      return;
    }

    if (request.method !== 'GET' || !path.startsWith(STREAM_PATH)) {
      next();
      return;
    }

    const sessionId = decodeURIComponent(path.slice(STREAM_PATH.length));
    const session = sessions.get(sessionId);

    if (!sessionId || !session) {
      json(response, 404, { error: 'Unknown SSE session.' });
      return;
    }

    const initialBudgetStatus = readBudgetStatus(budgets, 'sandbox', session.sandboxId);
    if (initialBudgetStatus.exhausted) {
      json(response, 429, {
        error: 'Token budget exhausted.',
        ...initialBudgetStatus,
      });
      return;
    }

    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no');
    response.flushHeaders?.();
    response.write(': connected\n\n');

    const responseId = `${sessionId}-ai-text`;
    const responseText =
      'I can map your launch plan, break it into owners and deadlines, and keep the budget visible while the answer streams in live.';
    const chunks = chunksFor(responseText);
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let streamClosed = false;

    const cleanup = () => {
      if (streamClosed) {
        return;
      }

      streamClosed = true;
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      sessions.delete(sessionId);
      response.end();
    };

    const schedule = (delayMs: number, action: () => void) => {
      const timer = setTimeout(() => {
        timers.delete(timer);

        if (streamClosed) {
          return;
        }

        action();
      }, delayMs);

      timers.add(timer);
    };

    const emitBudgetExhausted = () => {
      const exhaustedStatus = readBudgetStatus(budgets, 'sandbox', session.sandboxId);
      const prompt = exhaustedStatus.upgrade_prompt ?? getUpgradePrompt(exhaustedStatus.tier);

      sse(response, 'message', {
        type: 'message',
        message: {
          id: `${sessionId}-budget-status`,
          type: 'ai-status',
          text: statusLabelFor(exhaustedStatus.tier),
        },
      });
      sse(response, 'message', {
        type: 'message',
        message: {
          id: `${sessionId}-budget-upgrade`,
          type: 'ai-text',
          text: prompt,
        },
      });
      sse(response, 'usage', {
        type: 'usage',
        used: exhaustedStatus.used,
        limit: exhaustedStatus.limit,
      });
      sse(response, 'budget_exhausted', {
        type: 'budget_exhausted',
        status_code: 429,
        tier: exhaustedStatus.tier,
        used: exhaustedStatus.used,
        limit: exhaustedStatus.limit,
        resets_at: exhaustedStatus.resets_at,
        prompt,
      });
      sse(response, 'done', { type: 'done' });
      cleanup();
    };

    schedule(120, () => {
      const currentStatus = readBudgetStatus(budgets, 'sandbox', session.sandboxId);

      if (!canConsume(currentStatus, 180)) {
        emitBudgetExhausted();
        return;
      }

      const budgetStatus = consumeBudget(budgets, 'sandbox', session.sandboxId, 180);

      sse(response, 'usage', {
        type: 'usage',
        used: budgetStatus.used,
        limit: budgetStatus.limit,
      });
    });

    schedule(260, () => {
      sse(response, 'message', {
        type: 'message',
        message: {
          id: `${sessionId}-user`,
          type: 'user',
          text: 'Plan our AI launch and show me the live token budget while you think.',
        },
      });
    });

    schedule(680, () => {
      sse(response, 'message', {
        type: 'message',
        message: {
          id: `${sessionId}-status`,
          type: 'ai-status',
          text: 'Hermes is streaming via Mastra SSE...',
        },
      });
    });

    schedule(980, () => {
      sse(response, 'message', {
        type: 'message',
        message: {
          id: `${sessionId}-pills`,
          type: 'ai-pills',
          items: ['Launch plan', 'Owner mapping', 'Budget watch', 'Follow-up tasks'],
        },
      });
    });

    schedule(1250, () => {
      sse(response, 'message', {
        type: 'message',
        message: {
          id: responseId,
          type: 'ai-text',
          text: '',
        },
      });
    });

    chunks.forEach((chunk, index) => {
      const delayMs = 1400 + index * 85;

      schedule(delayMs, () => {
        const tokenCost = estimateTokenCost(chunk);
        const currentStatus = readBudgetStatus(budgets, 'sandbox', session.sandboxId);

        if (!canConsume(currentStatus, tokenCost)) {
          emitBudgetExhausted();
          return;
        }

        const budgetStatus = consumeBudget(
          budgets,
          'sandbox',
          session.sandboxId,
          tokenCost,
        );

        sse(response, 'token', {
          type: 'token',
          messageId: responseId,
          chunk,
        });
        sse(response, 'usage', {
          type: 'usage',
          used: budgetStatus.used,
          limit: budgetStatus.limit,
        });
      });
    });

    schedule(1400 + chunks.length * 85 + 240, () => {
      sse(response, 'demo_complete', { type: 'demo_complete' });
    });

    schedule(1400 + chunks.length * 85 + 360, () => {
      sse(response, 'done', { type: 'done' });
      cleanup();
    });

    request.on('close', () => {
      cleanup();
    });
  };

  return {
    name: 'arcamatrix-demo-sse',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig({
  plugins: [react(), registerHermesSsePlugin()],
});
