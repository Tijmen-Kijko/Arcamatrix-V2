import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppPhase } from '../hooks/useAppPhase';
import { useMorphState, useSetMorphState } from '../hooks/useAppPhase';
import { useAuthSession } from '../hooks/useAuth';
import { useHermesStream } from '../hooks/useHermesStream';
import { useStreamError } from '../hooks/useStream';
import { createDemoSession, getTokenStatus } from '../services/streamApi';
import { useStreamStore } from '../stores/streamStore';
import { BudgetBar } from './BudgetBar';
import { ChatMessage } from './ChatMessage';
import { MorphButton } from './MorphButton';
import './DemoWorkspace.css';

const MORPH_TRIGGER_DELAY = 1400;

export function DemoWorkspace() {
  const phase = useAppPhase();
  const morphState = useMorphState();
  const setMorphState = useSetMorphState();
  const authSession = useAuthSession();
  const streamError = useStreamError();
  const chatRef = useRef<HTMLDivElement>(null);
  const morphTimerRef = useRef<number | null>(null);
  const [demoSessionId, setDemoSessionId] = useState<string | null>(null);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const isFrozen = morphState === 'morphing' || morphState === 'cta';

  const handleFirstResponse = useCallback(() => {
    if (morphTimerRef.current !== null) {
      window.clearTimeout(morphTimerRef.current);
    }

    morphTimerRef.current = window.setTimeout(() => {
      setMorphState('morphing');
    }, MORPH_TRIGGER_DELAY);
  }, [setMorphState]);

  useEffect(() => {
    let cancelled = false;

    void createDemoSession()
      .then(({ sessionId }) => {
        if (!cancelled) {
          setDemoSessionId(sessionId);
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
  }, []);

  const { messages } = useHermesStream(demoSessionId, {
    onFirstResponse: handleFirstResponse,
  });

  useEffect(() => {
    if (!authSession) {
      return;
    }

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

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const connectionError = bootstrapError ?? streamError;

  return (
    <>
      <div className={`ws-label ${phase === 'workspace' ? 'hidden' : ''}`}>
        ARCAMATRIX WORKSPACE
      </div>

      <div className={`ws-window ${phase === 'workspace' ? 'full' : ''}`}>
        <div className="ws-titlebar">
          {phase !== 'workspace' && (
            <>
              <div className="ws-dot" style={{ background: '#ff5f57' }} />
              <div className="ws-dot" style={{ background: '#ffbd2e' }} />
              <div className="ws-dot" style={{ background: '#28c840' }} />
            </>
          )}
          <div className="ws-title">
            {phase === 'workspace' ? 'Chat · Arcamatrix' : 'workspace · arcamatrix.com'}
          </div>
          {phase !== 'workspace' && <div className="ws-title-spacer" />}
        </div>

        <div className="ws-chat" ref={chatRef}>
          {authSession ? (
            <div className="ws-auth-card">
              <div className="ws-auth-eyebrow">B-01 Auth Session</div>
              <h2 className="ws-auth-title">
                Workspace ready for {authSession.user.display_name}
              </h2>
              <div className="ws-auth-grid">
                <div className="ws-auth-item">
                  <span className="ws-auth-label">Email</span>
                  <span>{authSession.user.email}</span>
                </div>
                <div className="ws-auth-item">
                  <span className="ws-auth-label">Provider</span>
                  <span>{authSession.user.auth_provider}</span>
                </div>
                <div className="ws-auth-item">
                  <span className="ws-auth-label">Workspace</span>
                  <span>{authSession.workspace_id}</span>
                </div>
                <div className="ws-auth-item">
                  <span className="ws-auth-label">New user</span>
                  <span>{authSession.is_new_user ? 'yes' : 'no'}</span>
                </div>
              </div>
              <div className="ws-auth-token">
                access_token: <code>{authSession.access_token}</code>
              </div>
            </div>
          ) : (
            <>
              {!demoSessionId && !connectionError && messages.length === 0 && (
                <div className="ws-stream-note">Connecting to the live Hermes demo stream...</div>
              )}

              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {connectionError && (
                <div className="ws-stream-note error">{connectionError}</div>
              )}
            </>
          )}
        </div>

        <BudgetBar />

        <div className={`ws-inputbar${isFrozen ? ' frozen' : ''}`}>
          <div className="ws-input">Ask anything or give a task...</div>
          <MorphButton />
        </div>
      </div>
    </>
  );
}
