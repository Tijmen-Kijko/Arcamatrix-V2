import { useEffect, useRef, useState } from 'react';
import type { BriefChunk } from '../types/messages';

interface Props {
  chunks: BriefChunk[];
  onComplete?: () => void;
}

interface TypedChunk {
  t: 'b' | 't' | 'hr';
  v: string;
  typed: string;
}

export function BriefTypewriter({ chunks, onComplete }: Props) {
  const [typedChunks, setTypedChunks] = useState<TypedChunk[]>(() =>
    chunks.map((c) => ({
      t: c.t,
      v: c.t === 'hr' ? '' : c.v,
      typed: c.t === 'hr' ? '' : '',
    }))
  );
  const [done, setDone] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const totalTyped = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTime = useRef(0);

  useEffect(() => {
    let ci = 0;
    let charIdx = 0;

    // Skip leading hr chunks
    while (ci < chunks.length && chunks[ci].t === 'hr') ci++;

    function tick(time: number) {
      if (ci >= chunks.length) {
        setShowCursor(false);
        setDone(true);
        onComplete?.();
        return;
      }

      const chunk = chunks[ci];

      if (chunk.t === 'hr') {
        ci++;
        charIdx = 0;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const speed = totalTyped.current < 20 ? 18 : totalTyped.current < 80 ? 12 : 8;
      if (time - lastTime.current < speed) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      lastTime.current = time;

      if (charIdx < chunk.v.length) {
        charIdx++;
        totalTyped.current++;

        setTypedChunks((prev) => {
          const next = [...prev];
          next[ci] = { ...next[ci], typed: chunk.v.slice(0, charIdx) };
          return next;
        });

        rafRef.current = requestAnimationFrame(tick);
      } else {
        ci++;
        charIdx = 0;
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    const startDelay = setTimeout(() => {
      rafRef.current = requestAnimationFrame(tick);
    }, 200);

    return () => {
      clearTimeout(startDelay);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {typedChunks.map((chunk, i) => {
        if (chunk.t === 'hr') {
          // Only show hr if previous chunks are fully typed
          const prevDone = typedChunks
            .slice(0, i)
            .every((c) => c.t === 'hr' || c.typed === c.v);
          if (!prevDone && !done) return null;
          return <hr key={i} />;
        }
        if (!chunk.typed) return null;
        const Tag = chunk.t === 'b' ? 'strong' : 'span';
        return (
          <Tag key={i} className={chunk.t === 't' ? 'dim' : undefined} style={{ whiteSpace: 'pre-line' }}>
            {chunk.typed}
          </Tag>
        );
      })}
      {showCursor && <span className="cursor" />}
    </>
  );
}
