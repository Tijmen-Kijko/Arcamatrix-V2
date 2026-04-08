import { useEffect, useRef } from 'react';
import { useSagesCallState } from '../../hooks/useSages';

interface SagesAvatarProps {
  getAmplitude: () => number;
}

export function SagesAvatar({ getAmplitude }: SagesAvatarProps) {
  const callState = useSagesCallState();
  const avatarRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // Amplitude-driven scale for speaking state
  useEffect(() => {
    if (callState !== 'speaking') {
      if (avatarRef.current) {
        avatarRef.current.style.transform = '';
      }
      cancelAnimationFrame(rafRef.current);
      return;
    }

    function animate() {
      const amplitude = getAmplitude();
      if (avatarRef.current) {
        const scale = 1 + amplitude * 0.08;
        avatarRef.current.style.transform = `scale(${scale})`;
      }
      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [callState, getAmplitude]);

  const stateClass = `sages-avatar--${callState}`;

  return (
    <div
      ref={avatarRef}
      className={`sages-avatar ${stateClass}`}
      role="img"
      aria-label="Arcamatrix avatar"
    >
      <div className="sages-avatar__ring" />
      <div className="sages-avatar__inner">
        {/* Arcamatrix logo — abstract geometric mark */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M40 8L62 24V56L40 72L18 56V24L40 8Z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M40 20L52 28V48L40 56L28 48V28L40 20Z"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.6"
            fill="none"
          />
          <circle cx="40" cy="38" r="4" fill="currentColor" opacity="0.8" />
        </svg>
      </div>
    </div>
  );
}
