import type { Message } from '../types/messages';

export interface StreamEvent {
  event: 'message' | 'demo_complete';
  data: Message | null;
}

const DELAY_MS = [800, 1200, 2400, 1800, 600];

const DEMO_MESSAGES: StreamEvent[] = [
  {
    event: 'message',
    data: { id: 'mock-user', type: 'user', text: 'What can you help me with today?' },
  },
  {
    event: 'message',
    data: { id: 'mock-status', type: 'ai-status', text: 'Analyzing your workspace...' },
  },
  {
    event: 'message',
    data: {
      id: 'mock-pills',
      type: 'ai-pills',
      items: ['Email drafting', 'Research', 'Task planning', 'Code review', 'Data analysis'],
    },
  },
  {
    event: 'message',
    data: {
      id: 'mock-brief',
      type: 'ai-brief',
      preamble: "Here's what I found",
      content: [
        { t: 'b', v: 'Welcome to Arcamatrix.' },
        {
          t: 't',
          v: " I'm your personal AI workspace - I can manage tasks, draft emails, do research, and automate repetitive work. ",
        },
        { t: 'hr' },
        { t: 't', v: 'Right now I have access to ' },
        { t: 'b', v: '40+ tools' },
        {
          t: 't',
          v: ' including web search, file management, calendar integration, and messaging channels like WhatsApp and Telegram.',
        },
      ],
    },
  },
  {
    event: 'demo_complete',
    data: null,
  },
];

export type MockStreamDispose = () => void;

export function startMockStream(
  onEvent: (event: StreamEvent) => void,
): MockStreamDispose {
  const timers: ReturnType<typeof setTimeout>[] = [];
  let cancelled = false;

  let cumulative = 0;
  DEMO_MESSAGES.forEach((evt, i) => {
    cumulative += DELAY_MS[i] ?? 1000;
    const timer = setTimeout(() => {
      if (!cancelled) {
        onEvent(evt);
      }
    }, cumulative);
    timers.push(timer);
  });

  return () => {
    cancelled = true;
    timers.forEach(clearTimeout);
  };
}
