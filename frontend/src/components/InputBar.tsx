import { useCallback, useRef, useState } from 'react';
import { useSandboxPhase } from '../hooks/useAppPhase';
import { useIsBudgetExhausted } from '../hooks/useStream';
import { MorphButton } from './MorphButton';

interface InputBarProps {
  onSend: (text: string) => void;
  isFrozen?: boolean;
  onCtaClick?: () => void;
}

export function InputBar({ onSend, isFrozen = false, onCtaClick }: InputBarProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const sandboxPhase = useSandboxPhase();
  const budgetExhausted = useIsBudgetExhausted();

  const isDisabled = budgetExhausted || sandboxPhase === 'loading';

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed || isDisabled) return;

      onSend(trimmed);
      setValue('');
      inputRef.current?.focus();
    },
    [value, isDisabled, onSend],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const trimmed = value.trim();
        if (!trimmed || isDisabled) return;

        onSend(trimmed);
        setValue('');
      }
    },
    [value, isDisabled, onSend],
  );

  return (
    <form
      className={`ws-inputbar${isFrozen ? ' frozen' : ''}`}
      onSubmit={handleSubmit}
    >
      <input
        ref={inputRef}
        className="ws-input"
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
