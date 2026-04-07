import { create } from 'zustand';
import type { Message } from '../types/messages';

interface MessageState {
  messages: Message[];
  addMessage: (message: Message) => void;
  appendToMessage: (id: string, chunk: string) => void;
  clearMessages: () => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  messages: [],
  addMessage: (message) =>
    set((state) => {
      const existingIndex = state.messages.findIndex((item) => item.id === message.id);

      if (existingIndex === -1) {
        return { messages: [...state.messages, message] };
      }

      const messages = [...state.messages];
      messages[existingIndex] = message;

      return { messages };
    }),
  appendToMessage: (id, chunk) =>
    set((state) => ({
      messages: state.messages.map((message) => {
        if (message.id !== id || message.type !== 'ai-text') {
          return message;
        }

        return {
          ...message,
          text: message.text + chunk,
        };
      }),
    })),
  clearMessages: () => set({ messages: [] }),
}));
