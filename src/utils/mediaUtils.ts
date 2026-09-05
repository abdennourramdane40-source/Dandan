import confetti from 'canvas-confetti';

export const AVATAR_COLORS = [
  '#3b82f6', // blue
  '#ec4899', // pink
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#ef4444', // red
  '#6366f1'  // indigo
];

export const AVATAR_ICONS = [
  'cat',
  'zap',
  'smile',
  'gamepad',
  'sparkles',
  'flame',
  'rocket',
  'star'
];

export function triggerConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 }
  });
}

export function triggerWinConfetti() {
  const duration = 2.5 * 1000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
}

/**
 * Creates an audio level detector from a MediaStream to detect speaking
 */
export function createAudioLevelDetector(
  stream: MediaStream,
  onSpeakingChange: (isSpeaking: boolean) => void
): () => void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return () => {};

    const audioContext = new AudioContextClass();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let speakingTimer: number | null = null;
    let currentlySpeaking = false;
    let animationId: number;

    const checkLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;

      // Threshold for voice activity
      const isAboveThreshold = average > 22;

      if (isAboveThreshold) {
        if (!currentlySpeaking) {
          currentlySpeaking = true;
          onSpeakingChange(true);
        }
        if (speakingTimer) window.clearTimeout(speakingTimer);
        speakingTimer = window.setTimeout(() => {
          currentlySpeaking = false;
          onSpeakingChange(false);
        }, 400);
      }

      animationId = requestAnimationFrame(checkLevel);
    };

    animationId = requestAnimationFrame(checkLevel);

    return () => {
      cancelAnimationFrame(animationId);
      if (speakingTimer) clearTimeout(speakingTimer);
      try {
        source.disconnect();
        analyser.disconnect();
        audioContext.close();
      } catch (e) {
        // cleanup safe
      }
    };
  } catch (err) {
    console.warn('Audio level detector not available:', err);
    return () => {};
  }
}
