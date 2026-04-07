import { useCallback } from 'react';
import { useMorphState, useSetMorphState, useAppPhase } from '../hooks/useAppPhase';
import './MorphButton.css';

interface MorphButtonProps {
  onCtaClick?: () => void;
}

export function MorphButton({ onCtaClick }: MorphButtonProps) {
  const morphState = useMorphState();
  const setMorphState = useSetMorphState();
  const phase = useAppPhase();

  const isMorphed = morphState === 'morphing' || morphState === 'cta';
  const isWorkspace = phase === 'workspace';

  const handleClick = useCallback(() => {
    if (morphState === 'cta') {
      onCtaClick?.();
    }
  }, [morphState, onCtaClick]);

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (e.propertyName === 'width' && morphState === 'morphing') {
        setMorphState('cta');
      }
    },
    [morphState, setMorphState],
  );

  const className = [
    'ws-morph-btn',
    isMorphed && !isWorkspace ? 'morphed' : '',
    morphState === 'cta' ? 'active-cta' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={className}
      onClick={handleClick}
      onTransitionEnd={handleTransitionEnd}
      aria-label={isMorphed ? 'Sign up for free' : 'Send message'}
    >
      <span className="morph-icon">&#8593;</span>
      <span className="morph-text">Sign up for free &rarr;</span>
    </button>
  );
}
