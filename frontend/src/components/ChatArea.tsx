import { useEffect, useRef } from 'react';
import type { Message } from '../types/messages';
// MOCK MODE: useAuthSession import bewaard voor swap-back
// import { useAuthSession } from '../hooks/useAuth';
import { useSandboxPhase } from '../hooks/useAppPhase';
import { ChatMessage } from './ChatMessage';

interface ChatAreaProps {
  messages: Message[];
  connectionError: string | null;
  isConnecting: boolean;
}

export function ChatArea({ messages, connectionError, isConnecting }: ChatAreaProps) {
  const chatRef = useRef<HTMLDivElement>(null);
  const sandboxPhase = useSandboxPhase();

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // MOCK MODE: auth-card uitgeschakeld, altijd chat renderen.
  // Herstel het {authSession ? <auth-card> : <chat>} blok zodra B-04 klaar is.
  return (
    <div className="ws-chat" ref={chatRef}>
      {sandboxPhase === 'loading' && isConnecting && messages.length === 0 && (
        <div className="ws-stream-note">Connecting to the live Hermes demo stream...</div>
      )}

      {sandboxPhase === 'promote_prompt' && (
        <div className="ws-stream-note">
          Sign up for free to keep your workspace and get 25K tokens/day.
        </div>
      )}

      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {connectionError && (
        <div className="ws-stream-note error">{connectionError}</div>
      )}
    </div>
  );
}
