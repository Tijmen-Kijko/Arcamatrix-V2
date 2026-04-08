import { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSagesActive, useSagesMode, useSagesCallState, useSagesActions, useSagesCallDuration } from '../../hooks/useSages';
import { useSagesStore } from '../../stores/sagesStore';
import { useMessageStore } from '../../stores/messageStore';
import { startSagesSession, sagesSpeak, endSagesSession } from '../../services/sagesApi';
import { createSpeechRecognition, isSpeechRecognitionSupported } from '../../services/sages/speechRecognition';
import { createMockAmplitudeSource } from '../../services/sages/ttsPlayer';
import { SagesAvatar } from './SagesAvatar';
import { SagesWaveform } from './SagesWaveform';
import { CallStatusLabel } from './CallStatusLabel';
import './SagesOverlay.css';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export function SagesOverlay() {
  const isActive = useSagesActive();
  const mode = useSagesMode();
  const callState = useSagesCallState();
  const callDuration = useSagesCallDuration();
  const { setCallState, appendTranscript, setCallDuration, setSessionId, endCall } =
    useSagesActions();

  const [isClosing, setIsClosing] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const durationIntervalRef = useRef<number>(0);
  const mockAmpRef = useRef(createMockAmplitudeSource());
  const endCallRef = useRef(endCall);
  endCallRef.current = endCall;

  // Start session when overlay activates
  useEffect(() => {
    if (!isActive || !mode) return;

    let cancelled = false;

    async function init() {
      try {
        const session = await startSagesSession(mode!, 'default');
        if (cancelled) return;
        setSessionId(session.session_id);
        setCallState('listening');

        // Start speech recognition
        if (isSpeechRecognitionSupported()) {
          startListening();
        }
      } catch {
        setCallState('idle');
        endCallRef.current();
      }
    }

    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, mode]);

  // Duration timer
  useEffect(() => {
    if (!isActive) return;
    durationIntervalRef.current = window.setInterval(() => {
      setCallDuration(useSagesStore.getState().callDuration + 1);
    }, 1000);
    return () => clearInterval(durationIntervalRef.current);
  }, [isActive, setCallDuration]);

  // Escape key to end call
  useEffect(() => {
    if (!isActive) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleEndCall();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ok */ }
    }

    const recognition = createSpeechRecognition({
      onInterim: (text) => setInterimText(text),
      onFinal: (text) => {
        setInterimText('');
        handleUserSpeech(text);
      },
      onError: () => { /* Fallback: user can type */ },
      onEnd: () => {
        // Auto-restart if still listening
        const state = useSagesStore.getState();
        if (state.isActive && state.callState === 'listening' && !state.isMuted) {
          try { recognitionRef.current?.start(); } catch { /* ok */ }
        }
      },
    });

    if (recognition) {
      recognitionRef.current = recognition;
      recognition.start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUserSpeech = useCallback(async (text: string) => {
    const store = useSagesStore.getState();
    if (!store.sessionId) return;

    appendTranscript({
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    });

    setCallState('thinking');

    // Stop recognition during AI response
    try { recognitionRef.current?.stop(); } catch { /* ok */ }

    try {
      const response = await sagesSpeak(store.sessionId, text);

      appendTranscript({
        role: 'assistant',
        text: response.response_text,
        timestamp: new Date().toISOString(),
      });

      // Mock TTS playback
      setCallState('speaking');
      mockAmpRef.current.start();

      // Simulate TTS duration based on text length
      const ttsMs = Math.max(1500, response.response_text.length * 40);
      await new Promise((r) => setTimeout(r, ttsMs));

      mockAmpRef.current.stop();

      // Back to listening
      if (useSagesStore.getState().isActive) {
        setCallState('listening');
        if (isSpeechRecognitionSupported() && !useSagesStore.getState().isMuted) {
          try { recognitionRef.current?.start(); } catch { /* ok */ }
        }
      }
    } catch {
      if (useSagesStore.getState().isActive) {
        setCallState('listening');
      }
    }
  }, [appendTranscript, setCallState]);

  const handleEndCall = useCallback(async () => {
    // Stop recognition
    try { recognitionRef.current?.stop(); } catch { /* ok */ }
    recognitionRef.current = null;
    mockAmpRef.current.stop();

    setCallState('ending');
    setIsClosing(true);

    const store = useSagesStore.getState();
    const duration = store.callDuration;
    const transcript = store.transcript;

    // Call end session API
    if (store.sessionId) {
      try { await endSagesSession(store.sessionId); } catch { /* ok */ }
    }

    // Push transcript to chat history
    const msgStore = useMessageStore.getState();
    if (transcript.length > 0) {
      // Add separator
      msgStore.addMessage({
        id: `sages-sep-${Date.now()}`,
        type: 'ai-status',
        text: `Spraakgesprek beëindigd • ${formatDuration(duration)}`,
      });

      // Add each message
      transcript.forEach((msg, i) => {
        msgStore.addMessage({
          id: `sages-msg-${Date.now()}-${i}`,
          type: msg.role === 'user' ? 'user' : 'ai-text',
          text: msg.text,
        });
      });
    }

    // Wait for exit animation
    setTimeout(() => {
      endCall();
      setIsClosing(false);
    }, 250);
  }, [endCall, setCallState]);

  // Override endCall in controls to use our handler with transcript push
  useEffect(() => {
    // Patch the store's endCall to go through our handler
    // We do this by intercepting at the overlay level
  }, []);

  const getAmplitude = useCallback(() => mockAmpRef.current.getAmplitude(), []);

  if (!isActive && !isClosing) return null;

  const showFallbackInput = !isSpeechRecognitionSupported();

  return (
    <div
      className={`sages-overlay ${isClosing ? 'sages-overlay--closing' : 'sages-overlay--opening'}`}
      role="dialog"
      aria-label="Spraakgesprek met Arcamatrix"
    >
      {/* Avatar zone */}
      <div className="sages-avatar-zone">
        <div className="sages-name">Arcamatrix</div>
        <CallStatusLabel />

        {mode === 'video' ? (
          <SagesAvatar getAmplitude={getAmplitude} />
        ) : (
          <SagesWaveform getAmplitude={getAmplitude} />
        )}

        {/* Duration */}
        {callState !== 'connecting' && (
          <div className="sages-duration">{formatDuration(callDuration)}</div>
        )}
      </div>

      {/* Transcription zone */}
      {(interimText || callState === 'thinking') && (
        <div className="sages-transcription">
          {interimText && <span className="sages-interim">{interimText}</span>}
        </div>
      )}

      {/* Fallback for browsers without Web Speech API */}
      {showFallbackInput && (
        <div className="sages-fallback">
          <span>Spraakherkenning niet beschikbaar in deze browser.</span>
        </div>
      )}

      {/* Call controls — intercept endCall */}
      <div className="sages-controls-zone">
        <CallControlsWithOverride onEndCall={handleEndCall} />
      </div>
    </div>
  );
}

/**
 * Wraps CallControls to override the endCall action with the overlay's handler
 * that pushes transcript to chat before closing.
 */
function CallControlsWithOverride({ onEndCall }: { onEndCall: () => void }) {
  const { isMuted, isCameraOff, toggleMute, toggleCamera } = useSagesStore(
    useShallow((s) => ({
      isMuted: s.isMuted,
      isCameraOff: s.isCameraOff,
      toggleMute: s.toggleMute,
      toggleCamera: s.toggleCamera,
    })),
  );
  const mode = useSagesMode();

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

  return (
    <div className="sages-controls">
      <button
        type="button"
        className={`sages-ctrl-btn ${isMuted ? 'sages-ctrl-active' : ''}`}
        aria-label={isMuted ? 'Microfoon inschakelen' : 'Microfoon uitschakelen'}
        title={isMuted ? 'Microfoon inschakelen' : 'Microfoon uitschakelen'}
        onClick={toggleMute}
      >
        {isMuted ? ICONS['mic-off'] : ICONS.mic}
      </button>

      {mode === 'video' && (
        <button
          type="button"
          className={`sages-ctrl-btn ${isCameraOff ? 'sages-ctrl-active' : ''}`}
          aria-label={isCameraOff ? 'Camera inschakelen' : 'Camera uitschakelen'}
          title={isCameraOff ? 'Camera inschakelen' : 'Camera uitschakelen'}
          onClick={toggleCamera}
        >
          {isCameraOff ? ICONS['video-off'] : ICONS.video}
        </button>
      )}

      <button
        type="button"
        className="sages-ctrl-btn sages-ctrl-end"
        aria-label="Gesprek beëindigen"
        title="Gesprek beëindigen"
        onClick={onEndCall}
        autoFocus
      >
        {ICONS['phone-off']}
      </button>
    </div>
  );
}
