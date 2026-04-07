import { useMessageStore } from '../stores/messageStore';

export const useMessages = () => useMessageStore((s) => s.messages);
export const useAddMessage = () => useMessageStore((s) => s.addMessage);
export const useAppendToMessage = () => useMessageStore((s) => s.appendToMessage);
export const useClearMessages = () => useMessageStore((s) => s.clearMessages);
