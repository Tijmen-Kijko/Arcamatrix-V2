import { useEffect, useRef } from 'react';
import { useMessageStore } from '../stores/messageStore';
import { useStreamStore, type StreamStatus } from '../stores/streamStore';
import { getTokenStatus } from '../services/streamApi';
import type { Message } from '../types/messages';

const STREAM_BASE_URL = '/api/stream';

type StreamPayload =
  | { type: 'message'; message: Message }
  | { type: 'token'; messageId: string; chunk: string }
  | { type: 'usage'; used: number; limit: number | null }
  | {
      type: 'budget_exhausted';
      status_code: 429;
      tier: 'sandbox' | 'free' | 'premium';
      used: number;
      limit: number | null;
      resets_at: string | null;
      prompt: string;
    }
  | { type: 'demo_complete' }
  | { type: 'done' };

interface UseHermesStreamReturn {
  messages: Message[];
  status: StreamStatus;
}

function parseStreamPayload(data: string): StreamPayload | null {
  try {
    return JSON.parse(data) as StreamPayload;
  } catch {
    return null;
  }
}

export function useHermesStream(
  sessionId: string | null,
  options?: { onDemoComplete?: () => void; onFirstResponse?: () => void },
): UseHermesStreamReturn {
  const messages = useMessageStore((state) => state.messages);
  const addMessage = useMessageStore((state) => state.addMessage);
  const appendToMessage = useMessageStore((state) => state.appendToMessage);
  const clearMessages = useMessageStore((state) => state.clearMessages);

  const status = useStreamStore((state) => state.status);
  const setStatus = useStreamStore((state) => state.setStatus);
  const setSessionId = useStreamStore((state) => state.setSessionId);
  const setDemoComplete = useStreamStore((state) => state.setDemoComplete);
  const setFirstResponseReceived = useStreamStore((state) => state.setFirstResponseReceived);
  const setError = useStreamStore((state) => state.setError);
  const setUsage = useStreamStore((state) => state.setUsage);
  const setBudgetStatus = useStreamStore((state) => state.setBudgetStatus);
  const setBudgetExhausted = useStreamStore((state) => state.setBudgetExhausted);
  const reset = useStreamStore((state) => state.reset);

  const onDemoCompleteRef = useRef(options?.onDemoComplete);
  const onFirstResponseRef = useRef(options?.onFirstResponse);
  const firstResponseFiredRef = useRef(false);

  useEffect(() => {
    onDemoCompleteRef.current = options?.onDemoComplete;
    onFirstResponseRef.current = options?.onFirstResponse;
  }, [options?.onDemoComplete, options?.onFirstResponse]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    reset();
    clearMessages();
    firstResponseFiredRef.current = false;
    setSessionId(sessionId);
    let source: EventSource | null = null;
    let closedIntentionally = false;
    let cancelled = false;

    const appendPreflightUpgradePrompt = (prompt: string, tier: 'sandbox' | 'free' | 'premium') => {
      const label =
        tier === 'sandbox' ? 'Sandbox tokenbudget bereikt.' : 'Dagbudget bereikt.';

      addMessage({
        id: `${sessionId}-budget-status`,
        type: 'ai-status',
        text: label,
      });
      addMessage({
        id: `${sessionId}-budget-upgrade`,
        type: 'ai-text',
        text: prompt,
      });
    };

    const connect = async () => {
      try {
        const budgetStatus = await getTokenStatus({ sessionId });

        if (cancelled) {
          return;
        }

        setBudgetStatus(budgetStatus);

        if (budgetStatus.exhausted) {
          if (budgetStatus.upgrade_prompt) {
            appendPreflightUpgradePrompt(budgetStatus.upgrade_prompt, budgetStatus.tier);
          }
          setBudgetExhausted(budgetStatus.upgrade_prompt);
          return;
        }

        setStatus('streaming');
        source = new EventSource(`${STREAM_BASE_URL}/${encodeURIComponent(sessionId)}`);

        const handleStreamEvent = (event: Event) => {
          if (!(event instanceof MessageEvent)) {
            return;
          }

          const payload = parseStreamPayload(event.data);
          if (!payload) {
            return;
          }

          const fireFirstResponse = () => {
            if (!firstResponseFiredRef.current) {
              firstResponseFiredRef.current = true;
              setFirstResponseReceived();
              onFirstResponseRef.current?.();
            }
          };

          switch (payload.type) {
            case 'message':
              addMessage(payload.message);
              if (payload.message.type !== 'user') {
                fireFirstResponse();
              }
              return;
            case 'token':
              appendToMessage(payload.messageId, payload.chunk);
              fireFirstResponse();
              return;
            case 'usage':
              setUsage(payload.used, payload.limit);
              return;
            case 'budget_exhausted':
              setBudgetStatus({
                used: payload.used,
                limit: payload.limit,
                remaining: payload.limit === null ? null : Math.max(payload.limit - payload.used, 0),
                resets_at: payload.resets_at,
                tier: payload.tier,
                exhausted: true,
                upgrade_prompt: payload.prompt,
              });
              setBudgetExhausted(payload.prompt);
              closedIntentionally = true;
              source?.close();
              return;
            case 'demo_complete':
              setDemoComplete(true);
              setStatus('done');
              onDemoCompleteRef.current?.();
              return;
            case 'done':
              setStatus('done');
              closedIntentionally = true;
              source?.close();
              return;
          }
        };

        source.addEventListener('message', handleStreamEvent);
        source.addEventListener('token', handleStreamEvent);
        source.addEventListener('usage', handleStreamEvent);
        source.addEventListener('budget_exhausted', handleStreamEvent);
        source.addEventListener('demo_complete', handleStreamEvent);
        source.addEventListener('done', handleStreamEvent);
        source.onerror = () => {
          if (closedIntentionally || cancelled) {
            return;
          }

          setError('Stream connection lost.');
          source?.close();
        };
      } catch (error) {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : 'Stream connection lost.');
        }
      }
    };

    void connect();

    return () => {
      cancelled = true;
      closedIntentionally = true;
      source?.close();
    };
  }, [
    addMessage,
    appendToMessage,
    clearMessages,
    reset,
    sessionId,
    setBudgetExhausted,
    setBudgetStatus,
    setDemoComplete,
    setError,
    setFirstResponseReceived,
    setSessionId,
    setStatus,
    setUsage,
  ]);

  return { messages, status };
}
