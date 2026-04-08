import { useSagesCallState, useSagesControls } from '../../hooks/useSages';

const STATE_LABELS: Record<string, string> = {
  connecting: 'Verbinden…',
  listening: 'Luistert…',
  thinking: 'Nadenken…',
  speaking: 'Spreekt',
  ending: 'Beëindigen…',
  idle: '',
};

export function CallStatusLabel() {
  const callState = useSagesCallState();
  const { isMuted } = useSagesControls();

  const label =
    isMuted && callState === 'listening'
      ? 'Gemuted — spreek om te hervatten'
      : STATE_LABELS[callState] || '';

  if (!label) return null;

  return (
    <div className="sages-status-label" aria-live="polite">
      {label}
    </div>
  );
}
