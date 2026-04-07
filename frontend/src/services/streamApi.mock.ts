/**
 * Mock streamApi — geen backend nodig.
 * Swap terug naar ./streamApi zodra B-04 klaar is.
 */
import type { DemoSessionResponse, TokenStatusResponse } from './streamApi';
import { useMessageStore } from '../stores/messageStore';
import { useStreamStore } from '../stores/streamStore';

const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

let messageCounter = 0;

const MOCK_REPLIES = [
  'Ik ben Hermes, jouw AI-assistent binnen Arcamatrix. Wat kan ik voor je doen?',
  'Goed idee! Ik kan je helpen met planning, code reviews, en brainstormen.',
  'Laat me daar even over nadenken... Klaar! Hier is mijn analyse van je vraag.',
  'Ik heb je verzoek verwerkt. Wil je dat ik nog dieper inga op een specifiek onderdeel?',
  'Interessante vraag. In de context van dit project zou ik aanraden om stap voor stap te werken.',
];

function pickReply(userText: string): string {
  const idx = messageCounter++ % MOCK_REPLIES.length;
  return `${MOCK_REPLIES[idx]}\n\n_(Mock response to: "${userText.slice(0, 60)}")_`;
}

export async function createDemoSession(): Promise<DemoSessionResponse> {
  await delay(400);
  return {
    sessionId: `mock-session-${Date.now()}`,
    sandboxId: `mock-sandbox-${Date.now()}`,
    expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
    tokenBudget: 5000,
    tier: 'sandbox',
  };
}

export async function sendMessage(_sessionId: string, text: string): Promise<void> {
  const store = useStreamStore.getState();
  const msgStore = useMessageStore.getState();

  store.setStatus('streaming');

  // Thinking indicator
  const statusId = `ai-status-${Date.now()}`;
  msgStore.addMessage({ id: statusId, type: 'ai-status', text: 'Hermes is thinking...' });

  await delay(800 + Math.random() * 600);

  // Remove status, add real response
  const replyId = `ai-text-${Date.now()}`;
  const fullReply = pickReply(text);

  // Replace status with empty ai-text, then typewriter
  msgStore.addMessage({ id: statusId, type: 'ai-status', text: '' });
  msgStore.addMessage({ id: replyId, type: 'ai-text', text: '' });

  // Typewriter effect — chunk by chunk
  const chunkSize = 3;
  for (let i = 0; i < fullReply.length; i += chunkSize) {
    msgStore.appendToMessage(replyId, fullReply.slice(i, i + chunkSize));
    await delay(20);
  }

  // Update token usage
  const used = store.usedTokens + text.length + fullReply.length;
  store.setUsage(used, store.tokenLimit);
  store.setStatus('done');
}

export async function getTokenStatus(_query: {
  sessionId?: string;
  userId?: string;
}): Promise<TokenStatusResponse> {
  await delay(100);
  const { usedTokens, tokenLimit } = useStreamStore.getState();
  return {
    used: usedTokens,
    limit: tokenLimit,
    remaining: tokenLimit === null ? null : Math.max(tokenLimit - usedTokens, 0),
    resets_at: null,
    tier: 'sandbox',
    exhausted: false,
    upgrade_prompt: null,
  };
}
