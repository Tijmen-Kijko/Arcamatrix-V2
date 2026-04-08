/**
 * TTS audio player with Web Audio API analyser for amplitude-driven animations.
 */

export interface TtsPlayer {
  /** Play audio from an ArrayBuffer. Returns a promise that resolves when playback ends. */
  play: (audioData: ArrayBuffer) => Promise<void>;
  /** Stop current playback. */
  stop: () => void;
  /** Get current amplitude (0–1) for animation. */
  getAmplitude: () => number;
  /** Clean up resources. */
  dispose: () => void;
}

export function createTtsPlayer(): TtsPlayer {
  let audioContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let sourceNode: AudioBufferSourceNode | null = null;
  let dataArray: Uint8Array<ArrayBuffer> | null = null;
  let isPlaying = false;

  function ensureContext() {
    if (!audioContext) {
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      dataArray = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
      analyser.connect(audioContext.destination);
    }
    return { audioContext, analyser: analyser!, dataArray: dataArray! };
  }

  return {
    async play(audioData: ArrayBuffer) {
      const { audioContext: ctx, analyser: a } = ensureContext();

      // Resume context if suspended (autoplay policy)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Stop any current playback
      if (sourceNode) {
        sourceNode.stop();
        sourceNode.disconnect();
      }

      const audioBuffer = await ctx.decodeAudioData(audioData);
      sourceNode = ctx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(a);
      isPlaying = true;

      return new Promise<void>((resolve) => {
        sourceNode!.onended = () => {
          isPlaying = false;
          resolve();
        };
        sourceNode!.start(0);
      });
    },

    stop() {
      if (sourceNode && isPlaying) {
        sourceNode.stop();
        sourceNode.disconnect();
        isPlaying = false;
      }
    },

    getAmplitude(): number {
      if (!analyser || !dataArray || !isPlaying) return 0;
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      return sum / (dataArray.length * 255);
    },

    dispose() {
      if (sourceNode) {
        try { sourceNode.stop(); } catch { /* already stopped */ }
        sourceNode.disconnect();
      }
      if (audioContext) {
        audioContext.close();
      }
      audioContext = null;
      analyser = null;
      sourceNode = null;
      dataArray = null;
      isPlaying = false;
    },
  };
}

/**
 * Mock amplitude generator for testing without real TTS audio.
 * Produces a smooth sine-wave amplitude (0–1).
 */
export function createMockAmplitudeSource(): {
  getAmplitude: () => number;
  start: () => void;
  stop: () => void;
} {
  let active = false;
  let startTime = 0;

  return {
    getAmplitude() {
      if (!active) return 0;
      const t = (performance.now() - startTime) / 1000;
      // Combine two sine waves for organic feel
      return Math.abs(Math.sin(t * 3.5) * 0.6 + Math.sin(t * 7.1) * 0.3);
    },
    start() {
      active = true;
      startTime = performance.now();
    },
    stop() {
      active = false;
    },
  };
}
