import { create } from 'zustand';

export interface SagesMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

type CallState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'ending';

interface SagesStore {
  isActive: boolean;
  mode: 'voice' | 'video' | null;
  callState: CallState;
  isMuted: boolean;
  isCameraOff: boolean;
  sessionId: string | null;
  transcript: SagesMessage[];
  callDuration: number;
  startCall: (mode: 'voice' | 'video') => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  setCallState: (state: CallState) => void;
  appendTranscript: (msg: SagesMessage) => void;
  setCallDuration: (seconds: number) => void;
  setSessionId: (id: string | null) => void;
}

export const useSagesStore = create<SagesStore>((set) => ({
  isActive: false,
  mode: null,
  callState: 'idle',
  isMuted: false,
  isCameraOff: false,
  sessionId: null,
  transcript: [],
  callDuration: 0,

  startCall: (mode) =>
    set({
      isActive: true,
      mode,
      callState: 'connecting',
      isMuted: false,
      isCameraOff: false,
      transcript: [],
      callDuration: 0,
    }),

  endCall: () =>
    set({
      isActive: false,
      mode: null,
      callState: 'idle',
      isMuted: false,
      isCameraOff: false,
      sessionId: null,
      callDuration: 0,
    }),

  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  toggleCamera: () => set((s) => ({ isCameraOff: !s.isCameraOff })),
  setCallState: (callState) => set({ callState }),
  appendTranscript: (msg) =>
    set((s) => ({ transcript: [...s.transcript, msg] })),
  setCallDuration: (callDuration) => set({ callDuration }),
  setSessionId: (sessionId) => set({ sessionId }),
}));
