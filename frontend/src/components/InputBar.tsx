import { useCallback, useRef, useState } from 'react';
import { useAppPhase, useSandboxPhase } from '../hooks/useAppPhase';
import { useIsBudgetExhausted } from '../hooks/useStream';
import { useSagesActive } from '../hooks/useSages';
import { useSagesStore } from '../stores/sagesStore';
import { MorphButton } from './MorphButton';

interface InputBarProps {
  onSend: (text: string) => void;
  isFrozen?: boolean;
  onCtaClick?: () => void;
}

export function InputBar({ onSend, isFrozen = false, onCtaClick }: InputBarProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const phase = useAppPhase();
  const sandboxPhase = useSandboxPhase();
  const budgetExhausted = useIsBudgetExhausted();
  const isWorkspace = phase === 'workspace';

  const isCallActive = useSagesActive();
  const startCall = useSagesStore((s) => s.startCall);

  const isDisabled = budgetExhausted || sandboxPhase === 'loading';

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isDisabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    textareaRef.current?.focus();
  }, [value, isDisabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    },
    [submit],
  );

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, []);

  // Post-login: new textarea style
  if (isWorkspace) {
    return (
      <div className="ws-inputbar">
        <div className="ws-input-wrap">
          <textarea
            ref={textareaRef}
            className="ws-input"
            placeholder="Ask a question or give a task..."
            rows={1}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            autoFocus
          />
          <div className="ws-input-actions">
            <button
              type="button"
              className="sages-call-btn"
              onClick={() => startCall('voice')}
              disabled={isCallActive || isDisabled}
              aria-label="Spraakgesprek"
              title="Spraakgesprek"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </button>
            <button
              type="button"
              className="sages-call-btn"
              onClick={() => startCall('video')}
              disabled={isCallActive || isDisabled}
              aria-label="Videogesprek"
              title="Videogesprek"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                <rect x="2" y="6" width="14" height="12" rx="2" />
              </svg>
            </button>
            <button
              type="button"
              className="send-btn"
              onClick={submit}
              disabled={isDisabled}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pre-login: original input + morph button style
  return (
    <form
      className={`ws-inputbar-legacy${isFrozen ? ' frozen' : ''}`}
      onSubmit={(e) => { e.preventDefault(); submit(); }}
    >
      <input
        className="ws-input-legacy"
        type="text"
        placeholder="Ask anything or give a task..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        autoFocus
      />
      <MorphButton onCtaClick={onCtaClick} />
    </form>
  );
}
