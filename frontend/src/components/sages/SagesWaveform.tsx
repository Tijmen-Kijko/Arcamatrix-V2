import { useEffect, useRef } from 'react';
import { useSagesCallState } from '../../hooks/useSages';

interface SagesWaveformProps {
  getAmplitude: () => number;
}

const BAR_COUNT = 40;
const BAR_WIDTH = 3;
const BAR_GAP = 3;
const MAX_BAR_HEIGHT = 80;

export function SagesWaveform({ getAmplitude }: SagesWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const callState = useSagesCallState();

  // Green when user speaks (listening), teal when AI speaks (speaking)
  const isUserSpeaking = callState === 'listening';
  const barColor = isUserSpeaking ? '#4ade80' : '#2dd4bf';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-DPI support
    const dpr = window.devicePixelRatio || 1;
    const width = (BAR_COUNT * (BAR_WIDTH + BAR_GAP)) - BAR_GAP;
    const height = MAX_BAR_HEIGHT * 2;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Per-bar smoothed values for organic feel
    const barValues = new Float32Array(BAR_COUNT);

    function draw() {
      const amplitude = getAmplitude();

      ctx!.clearRect(0, 0, width, height);

      const centerY = height / 2;

      for (let i = 0; i < BAR_COUNT; i++) {
        // Each bar targets a slightly offset amplitude for wave effect
        const offset = Math.sin((i / BAR_COUNT) * Math.PI * 2 + performance.now() / 300) * 0.3;
        const target = Math.max(0, Math.min(1, amplitude + offset * amplitude));

        // Smooth towards target
        barValues[i] += (target - barValues[i]) * 0.15;

        const barHeight = Math.max(2, barValues[i] * MAX_BAR_HEIGHT);
        const x = i * (BAR_WIDTH + BAR_GAP);

        ctx!.fillStyle = barColor;
        ctx!.globalAlpha = 0.6 + barValues[i] * 0.4;
        ctx!.beginPath();
        ctx!.roundRect(x, centerY - barHeight, BAR_WIDTH, barHeight * 2, BAR_WIDTH / 2);
        ctx!.fill();
      }

      ctx!.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [getAmplitude, barColor]);

  return (
    <div className="sages-waveform">
      <canvas ref={canvasRef} />
    </div>
  );
}
