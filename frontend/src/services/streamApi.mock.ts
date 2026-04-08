/**
 * Mock streamApi — no backend needed.
 * Swap back to ./streamApi once B-04 is complete.
 */
import type { DemoSessionResponse, TokenStatusResponse } from './streamApi';
import { useMessageStore } from '../stores/messageStore';
import { useStreamStore } from '../stores/streamStore';

const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

let messageCounter = 0;

const MOCK_REPLIES = [
  'I am Hermes, your AI assistant within Arcamatrix. What can I do for you?',
  'Good idea! I can help you with planning, code reviews, and brainstorming.',
  'Let me think about that... Done! Here is my analysis of your question.',
  'I have processed your request. Would you like me to dive deeper into a specific part?',
  'Interesting question. In the context of this project, I would recommend working step by step.',
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
