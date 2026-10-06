let audioContext: AudioContext | null = null;

export function unlockCompletionAudio(): void {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return;
  try {
    audioContext ??= new window.AudioContext();
    if (audioContext.state === 'suspended') {
      void audioContext.resume().catch(() => {
        audioContext = null;
      });
    }
  } catch {
    audioContext = null;
  }
}

export function playCompletionSignal(): void {
  if (!audioContext || audioContext.state !== 'running') return;
  try {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.setValueAtTime(660, now + 0.16);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.4);
  } catch {
    // Audio is optional and must never interfere with timer state.
  }
}
