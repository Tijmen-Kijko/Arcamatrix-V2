/**
 * Mock useHermesStream — stuurt een welkomstbericht en simuleert stream lifecycle.
 * Swap terug naar ./useHermesStream zodra B-04 klaar is.
 */
import { useEffect, useRef } from 'react';
import { useMessageStore } from '../stores/messageStore';
import { useStreamStore, type StreamStatus } from '../stores/streamStore';
import type { Message } from '../types/messages';

const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

interface UseHermesStreamReturn {
  messages: Message[];
  status: StreamStatus;
}

const WELCOME_MESSAGES: Message[] = [
  {
    id: 'mock-welcome-status',
    type: 'ai-status',
    text: 'Hermes verbonden (mock)',
  },
  {
    id: 'mock-welcome-text',
    type: 'ai-text',
    text: 'Welkom bij de Arcamatrix sandbox! Ik ben Hermes, je AI-assistent. Stel me een vraag of geef een opdracht.',
  },
];

export function useHermesStream(
  sessionId: string | null,
  options?: { onDemoComplete?: () => void; onFirstResponse?: () => void },
): UseHermesStreamReturn {
  const messages = useMessageStore((s) => s.messages);
  const addMessage = useMessageStore((s) => s.addMessage);
  const clearMessages = useMessageStore((s) => s.clearMessages);

  const status = useStreamStore((s) => s.status);
  const setStatus = useStreamStore((s) => s.setStatus);
  const setSessionId = useStreamStore((s) => s.setSessionId);
  const setFirstResponseReceived = useStreamStore((s) => s.setFirstResponseReceived);
  const setUsage = useStreamStore((s) => s.setUsage);
  const reset = useStreamStore((s) => s.reset);

  const onFirstResponseRef = useRef(options?.onFirstResponse);

  useEffect(() => {
    onFirstResponseRef.current = options?.onFirstResponse;
  }, [options?.onFirstResponse]);

  useEffect(() => {
    if (!sessionId) return;

    reset();
    clearMessages();
    setSessionId(sessionId);
    let cancelled = false;

    const bootstrap = async () => {
      setStatus('streaming');
      await delay(500);

      if (cancelled) return;

      for (const msg of WELCOME_MESSAGES) {
        addMessage(msg);
        await delay(300);
        if (cancelled) return;
      }

      setFirstResponseReceived();
      onFirstResponseRef.current?.();
      setUsage(42, 5000);
      setStatus('done');
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [addMessage, clearMessages, reset, sessionId, setFirstResponseReceived, setSessionId, setStatus, setUsage]);

  return { messages, status };
}
