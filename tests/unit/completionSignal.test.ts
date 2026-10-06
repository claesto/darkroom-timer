import { describe, expect, it, vi } from 'vitest';
import { playCompletionSignal, unlockCompletionAudio } from '../../src/audio/completionSignal';

describe('optional completion audio', () => {
  it('does not throw when browser audio is unavailable', () => {
    const original = window.AudioContext;
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: undefined });
    expect(() => unlockCompletionAudio()).not.toThrow();
    expect(() => playCompletionSignal()).not.toThrow();
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: original });
  });

  it('does not create audio before an explicit user gesture', () => {
    const constructor = vi.fn();
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: constructor });
    playCompletionSignal();
    expect(constructor).not.toHaveBeenCalled();
  });
});
