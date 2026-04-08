import type { JSX } from 'react';
import { useSagesControls, useSagesMode } from '../../hooks/useSages';

interface CallControlButton {
  icon: 'mic' | 'mic-off' | 'video' | 'video-off' | 'phone-off';
  label: string;
  active: boolean;
  variant: 'toggle' | 'end';
  onClick: () => void;
  visible: boolean;
}

/* Lucide-style SVG icon paths */
const ICONS: Record<string, JSX.Element> = {
  mic: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  ),
  'mic-off': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" x2="22" y1="2" y2="22" />
      <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
      <path d="M5 10v2a7 7 0 0 0 12 0" />
      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  ),
  video: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
      <rect x="2" y="6" width="14" height="12" rx="2" />
    </svg>
  ),
  'video-off': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.66 5H14a2 2 0 0 1 2 2v2.5l5.248-3.062A.5.5 0 0 1 22 6.87v10.058" />
      <path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  ),
  'phone-off': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
      <line x1="22" x2="2" y1="2" y2="22" />
    </svg>
  ),
};

export function CallControls() {
  const { isMuted, isCameraOff, toggleMute, toggleCamera, endCall } = useSagesControls();
  const mode = useSagesMode();

  const buttons: CallControlButton[] = [
    {
      icon: isMuted ? 'mic-off' : 'mic',
      label: isMuted ? 'Microfoon inschakelen' : 'Microfoon uitschakelen',
      active: isMuted,
      variant: 'toggle',
      onClick: toggleMute,
      visible: true,
    },
    {
      icon: isCameraOff ? 'video-off' : 'video',
      label: isCameraOff ? 'Camera inschakelen' : 'Camera uitschakelen',
      active: isCameraOff,
      variant: 'toggle',
      onClick: toggleCamera,
      visible: mode === 'video',
    },
    {
      icon: 'phone-off',
      label: 'Gesprek beëindigen',
      active: true,
      variant: 'end',
      onClick: endCall,
      visible: true,
    },
  ];

  return (
    <div className="sages-controls">
      {buttons
        .filter((b) => b.visible)
        .map((btn) => (
          <button
            key={btn.icon}
            type="button"
            className={[
              'sages-ctrl-btn',
              btn.variant === 'end' ? 'sages-ctrl-end' : '',
              btn.variant === 'toggle' && btn.active ? 'sages-ctrl-active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-label={btn.label}
            title={btn.label}
            onClick={btn.onClick}
          >
            {ICONS[btn.icon]}
          </button>
        ))}
    </div>
  );
}
