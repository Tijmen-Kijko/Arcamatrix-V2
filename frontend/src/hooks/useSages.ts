import { useShallow } from 'zustand/react/shallow';
import { useSagesStore } from '../stores/sagesStore';

export const useSagesActive = () => useSagesStore((s) => s.isActive);
export const useSagesMode = () => useSagesStore((s) => s.mode);
export const useSagesCallState = () => useSagesStore((s) => s.callState);
export const useSagesTranscript = () => useSagesStore((s) => s.transcript);
export const useSagesCallDuration = () => useSagesStore((s) => s.callDuration);

export const useSagesControls = () =>
  useSagesStore(
    useShallow((s) => ({
      isMuted: s.isMuted,
      isCameraOff: s.isCameraOff,
      toggleMute: s.toggleMute,
      toggleCamera: s.toggleCamera,
      endCall: s.endCall,
    })),
  );

export const useSagesActions = () =>
  useSagesStore(
    useShallow((s) => ({
      startCall: s.startCall,
      endCall: s.endCall,
      setCallState: s.setCallState,
      appendTranscript: s.appendTranscript,
      setCallDuration: s.setCallDuration,
      setSessionId: s.setSessionId,
    })),
  );
