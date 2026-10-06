import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDefaultState } from '../../src/domain/defaultState';
import {
  loadApplicationState,
  saveApplicationState,
  STORAGE_KEY,
} from '../../src/storage/localStorageAdapter';

describe('local storage adapter', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('uses defaults for corrupt state and round-trips valid state', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json');
    expect(loadApplicationState().timers.DEVELOP.status).toBe('READY');
    expect(saveApplicationState(createDefaultState())).toBe(true);
    expect(loadApplicationState().timers.STOP.configuredSeconds).toBe(30);
  });

  it('continues with defaults when reads fail', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage denied');
    });
    expect(loadApplicationState().timers.FIX.status).toBe('READY');
  });

  it('reports write failure without throwing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded');
    });
    expect(saveApplicationState(createDefaultState())).toBe(false);
  });
});
