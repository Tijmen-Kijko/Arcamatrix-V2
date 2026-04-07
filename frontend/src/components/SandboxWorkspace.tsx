import { useCallback, useEffect, useRef, useState } from 'react';
import { useSandboxPhase, useSetSandboxPhase } from '../hooks/useAppPhase';
import { useMorphState, useSetMorphState } from '../hooks/useAppPhase';
import { useAuthSession } from '../hooks/useAuth';
// MOCK MODE — swap terug naar echte imports zodra B-04 klaar is:
// import { useHermesStream } from '../hooks/useHermesStream';
// import { createDemoSession, getTokenStatus, sendMessage } from '../services/streamApi';
import { useHermesStream } from '../hooks/useHermesStream.mock';
import { useIsBudgetExhausted, useStreamError } from '../hooks/useStream';
import { createDemoSession, getTokenStatus, sendMessage } from '../services/streamApi.mock';
import { useStreamStore } from '../stores/streamStore';
import { useMessageStore } from '../stores/messageStore';
import { WorkspaceWindow } from './WorkspaceWindow';
import { ChatArea } from './ChatArea';
import { InputBar } from './InputBar';
import { BudgetBar } from './BudgetBar';
import './DemoWorkspace.css';

const MORPH_TRIGGER_DELAY = 1400;

export function SandboxWorkspace() {
  const sandboxPhase = useSandboxPhase();
  const setSandboxPhase = useSetSandboxPhase();
  const morphState = useMorphState();
  const setMorphState = useSetMorphState();
  const authSession = useAuthSession();
  const streamError = useStreamError();
  const budgetExhausted = useIsBudgetExhausted();
  const morphTimerRef = useRef<number | null>(null);
  const [demoSessionId, setDemoSessionId] = useState<string | null>(null);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  const isFrozen = morphState === 'morphing' || morphState === 'cta';

  // --- State machine transitions ---

  // Budget exhausted → budget_warning phase
  useEffect(() => {
    if (budgetExhausted && sandboxPhase === 'active') {
      setSandboxPhase('budget_warning');
    }
  }, [budgetExhausted, sandboxPhase, setSandboxPhase]);

  // MOCK MODE: auth-transitie uitgeschakeld zodat sandbox chat altijd rendert.
  // Auth session acquired → workspace phase
  // useEffect(() => {
  //   if (authSession && sandboxPhase !== 'workspace') {
  //     setSandboxPhase('workspace');
  //   }
  // }, [authSession, sandboxPhase, setSandboxPhase]);

  // MorphButton morphed to CTA → promote_prompt phase
  useEffect(() => {
    if (morphState === 'cta' && sandboxPhase === 'active') {
      setSandboxPhase('promote_prompt');
    }
  }, [morphState, sandboxPhase, setSandboxPhase]);

  // --- First AI response → trigger MorphButton morph ---
  const handleFirstResponse = useCallback(() => {
    if (morphTimerRef.current !== null) {
      window.clearTimeout(morphTimerRef.current);
    }

    morphTimerRef.current = window.setTimeout(() => {
      setMorphState('morphing');
    }, MORPH_TRIGGER_DELAY);
  }, [setMorphState]);

  // --- Bootstrap demo session ---
  useEffect(() => {
    let cancelled = false;

    void createDemoSession()
      .then(({ sessionId }) => {
        if (!cancelled) {
          setDemoSessionId(sessionId);
          setSandboxPhase('active');
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setBootstrapError(
            error instanceof Error ? error.message : 'Demo session could not start.',
          );
        }
      });

    return () => {
      cancelled = true;

      if (morphTimerRef.current !== null) {
        window.clearTimeout(morphTimerRef.current);
      }
    };
  }, [setSandboxPhase]);

  const { messages } = useHermesStream(demoSessionId, {
    onFirstResponse: handleFirstResponse,
  });

  // --- Fetch token status when authenticated ---
  useEffect(() => {
    if (!authSession) return;

    let cancelled = false;

    void getTokenStatus({ userId: authSession.user.id })
      .then((budgetStatus) => {
        if (!cancelled) {
          useStreamStore.getState().setBudgetStatus(budgetStatus);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [authSession]);

  // --- Send handler ---
  const handleSend = useCallback(
    (text: string) => {
      const sid = demoSessionId;
      if (!sid) return;

      // Optimistically add user message
      useMessageStore.getState().addMessage({
        id: `user-${Date.now()}`,
        type: 'user',
        text,
      });

      void sendMessage(sid, text).catch(() => {
        // Stream error will surface via useStreamError
      });
    },
    [demoSessionId],
  );

  const connectionError = bootstrapError ?? streamError;

  return (
    <WorkspaceWindow>
      <ChatArea
        messages={messages}
        connectionError={connectionError}
        isConnecting={sandboxPhase === 'loading'}
      />

      <BudgetBar />

      <InputBar
        onSend={handleSend}
        isFrozen={isFrozen}
      />
    </WorkspaceWindow>
  );
}
