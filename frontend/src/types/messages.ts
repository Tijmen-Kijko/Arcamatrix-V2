export type BriefChunk =
  | { t: 'b'; v: string }
  | { t: 't'; v: string }
  | { t: 'hr' };

type MessageBase = {
  id: string;
};

export type Message =
  | (MessageBase & { type: 'user'; text: string })
  | (MessageBase & { type: 'ai-status'; text: string })
  | (MessageBase & { type: 'ai-pills'; items: string[] })
  | (MessageBase & {
      type: 'ai-brief';
      preamble: string;
      content: BriefChunk[];
      more?: string;
    })
  | (MessageBase & { type: 'ai-text'; text: string });
