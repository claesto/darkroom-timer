import { createDefaultState } from '../domain/defaultState';
import { parsePersistedState, restorePersistedState, serializeState } from '../domain/persistence';
import type { TimerApplicationState } from '../domain/timer';

export const STORAGE_KEY = 'darkroom-timer-state';

function getStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadApplicationState(
  epochMs = Date.now(),
  monotonicMs = performance.now(),
): TimerApplicationState {
  const storage = getStorage();
  if (!storage) return createDefaultState(epochMs);
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return createDefaultState(epochMs);
    return restorePersistedState(parsePersistedState(raw), { epochMs, monotonicMs });
  } catch {
    return createDefaultState(epochMs);
  }
}

export function saveApplicationState(state: TimerApplicationState): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, serializeState(state));
    return true;
  } catch {
    return false;
  }
}
