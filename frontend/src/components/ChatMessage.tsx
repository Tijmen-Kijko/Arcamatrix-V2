import { useEffect, useRef, useState } from 'react';
import type { Message } from '../types/messages';
import { useAppPhase } from '../hooks/useAppPhase';
import { BriefTypewriter } from './BriefTypewriter';
import './ChatMessage.css';

interface Props {
  message: Message;
  onBriefComplete?: () => void;
}

export function ChatMessage({ message, onBriefComplete }: Props) {
  const phase = useAppPhase();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Double rAF for reveal animation (matches prototype)
    const frame1 = requestAnimationFrame(() => {
      const frame2 = requestAnimationFrame(() => {
        setVisible(true);
      });
      return () => cancelAnimationFrame(frame2);
    });
    return () => cancelAnimationFrame(frame1);
  }, []);

  const isUser = message.type === 'user';
  const role = isUser ? 'you' : 'ai';

  return (
    <div ref={ref} className={`msg ${role}${visible ? ' show' : ''}`}>
      {/* Avatar */}
      <div className={`msg-av ${role}`}>
        {isUser ? 'Y' : 'A'}
      </div>

      {/* Body */}
      <div className="msg-body">
        {!isUser && <div className="msg-name">Arcamatrix</div>}

        {message.type === 'user' && (
          <div className="msg-bubble">{message.text}</div>
        )}

        {message.type === 'ai-text' && (
          <div className="msg-bubble">{message.text}</div>
        )}

        {message.type === 'ai-status' && (
          <div className="msg-status">
            <span className="status-pulse" />
            {message.text}
          </div>
        )}

        {message.type === 'ai-pills' && (
          <div className="pills">
            {message.items.map((item, i) => (
              <span key={i} className="pill">{item}</span>
            ))}
          </div>
        )}

        {message.type === 'ai-brief' && (
          <>
            <div className="msg-bubble" style={{ marginBottom: 2 }}>
              {message.preamble}
            </div>
            <div className={`brief${phase !== 'workspace' ? ' brief-fade' : ''}`}>
              <BriefTypewriter
                chunks={message.content}
                onComplete={onBriefComplete}
              />
              {message.more && (
                <div className="brief-more">{message.more}</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
