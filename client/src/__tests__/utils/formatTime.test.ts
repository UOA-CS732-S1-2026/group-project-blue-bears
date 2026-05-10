import { describe, it, expect } from 'vitest';
import { formatTime } from '../../hooks/useGameLogic';

describe('formatTime', () => {
  it('formats 0 seconds as "0:00"', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  it('formats 59 seconds as "0:59"', () => {
    expect(formatTime(59)).toBe('0:59');
  });

  it('formats 60 seconds as "1:00"', () => {
    expect(formatTime(60)).toBe('1:00');
  });

  it('formats 65 seconds as "1:05" (zero-pads single digit seconds)', () => {
    expect(formatTime(65)).toBe('1:05');
  });

  it('formats 3600 seconds as "60:00"', () => {
    expect(formatTime(3600)).toBe('60:00');
  });
});
