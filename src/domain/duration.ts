import { MAX_DURATION_SECONDS } from './timer';

export interface DurationFields {
  hours: string;
  minutes: string;
  seconds: string;
}

export type DurationValidation =
  { valid: true; seconds: number } | { valid: false; message: string };

export function validateDuration(fields: DurationFields): DurationValidation {
  const entries = [
    ['Hours', fields.hours, 99],
    ['Minutes', fields.minutes, 59],
    ['Seconds', fields.seconds, 59],
  ] as const;
  const values: number[] = [];

  for (const [label, raw, max] of entries) {
    if (!/^\d+$/.test(raw)) {
      return { valid: false, message: `${label} must be a whole number.` };
    }

    const value = Number(raw);
    if (!Number.isSafeInteger(value) || value > max) {
      return { valid: false, message: `${label} must be between 0 and ${max}.` };
    }
    values.push(value);
  }

  const [hours, minutes, seconds] = values;
  const totalSeconds = (hours ?? 0) * 3600 + (minutes ?? 0) * 60 + (seconds ?? 0);
  if (totalSeconds > MAX_DURATION_SECONDS) {
    return { valid: false, message: 'Duration cannot exceed 99 hours.' };
  }

  return { valid: true, seconds: totalSeconds };
}

export function secondsToFields(seconds: number): DurationFields {
  const safeSeconds = Math.max(0, Math.trunc(seconds));
  return {
    hours: String(Math.floor(safeSeconds / 3600)).padStart(2, '0'),
    minutes: String(Math.floor((safeSeconds % 3600) / 60)).padStart(2, '0'),
    seconds: String(safeSeconds % 60).padStart(2, '0'),
  };
}

export function formatDuration(seconds: number): string {
  const fields = secondsToFields(seconds);
  return `${fields.hours}:${fields.minutes}:${fields.seconds}`;
}

export function durationFromFields(fields: DurationFields): number | null {
  const result = validateDuration(fields);
  return result.valid ? result.seconds : null;
}
