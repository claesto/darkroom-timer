import { describe, expect, it } from 'vitest';
import { formatDuration, secondsToFields, validateDuration } from '../../src/domain/duration';

describe('duration utilities', () => {
  it('validates integer clock fields and converts them to seconds', () => {
    expect(validateDuration({ hours: '1', minutes: '2', seconds: '3' })).toEqual({
      valid: true,
      seconds: 3723,
    });
  });

  it.each([
    [{ hours: '', minutes: '0', seconds: '0' }, 'Hours must be a whole number.'],
    [{ hours: '1.5', minutes: '0', seconds: '0' }, 'Hours must be a whole number.'],
    [{ hours: '-1', minutes: '0', seconds: '0' }, 'Hours must be a whole number.'],
    [{ hours: '0', minutes: '60', seconds: '0' }, 'Minutes must be between 0 and 59.'],
    [{ hours: '0', minutes: '0', seconds: '60' }, 'Seconds must be between 0 and 59.'],
    [{ hours: '100', minutes: '0', seconds: '0' }, 'Hours must be between 0 and 99.'],
  ])('rejects invalid fields %#', (fields, message) => {
    expect(validateDuration(fields)).toEqual({ valid: false, message });
  });

  it('formats long durations and clamps negative values to zero', () => {
    expect(formatDuration(90 * 60)).toBe('01:30:00');
    expect(formatDuration(99 * 3600 + 59 * 60 + 59)).toBe('99:59:59');
    expect(formatDuration(-1)).toBe('00:00:00');
  });

  it('splits seconds into padded editor fields', () => {
    expect(secondsToFields(3661)).toEqual({ hours: '01', minutes: '01', seconds: '01' });
  });
});
