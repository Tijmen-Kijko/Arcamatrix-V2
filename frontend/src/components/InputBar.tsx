import { useCallback, useRef, useState } from 'react';
import { useAppPhase, useSandboxPhase } from '../hooks/useAppPhase';
import { useIsBudgetExhausted } from '../hooks/useStream';
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
            placeholder="Stel een vraag of geef een opdracht..."
            rows={1}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            autoFocus
          />
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
