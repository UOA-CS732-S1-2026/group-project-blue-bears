import { describe, it, expect } from 'vitest';
import { calcStats } from '../../hooks/useGameLogic';

describe('calcStats', () => {
  it('returns zero stats when input is empty', () => {
    const result = calcStats('hello world', '', 10);
    expect(result).toEqual({ wpm: 0, accuracy: 100, inaccuracies: 0 });
  });

  it('returns zero stats when elapsed time is zero', () => {
    const result = calcStats('hello world', 'hello', 0);
    expect(result).toEqual({ wpm: 0, accuracy: 100, inaccuracies: 0 });
  });

  it('returns 100% accuracy and correct WPM when all chars match', () => {
    const passage = 'hello world test';
    const input = 'hello world test';
    const elapsedSeconds = 60;
    const result = calcStats(passage, input, elapsedSeconds);
    expect(result.accuracy).toBe(100);
    expect(result.inaccuracies).toBe(0);
    // 16 correct chars / 5 / 1 minute = 3.2 → rounds to 3
    expect(result.wpm).toBe(Math.round(16 / 5 / 1));
  });

  it('correctly counts inaccuracies for mistyped characters', () => {
    const passage = 'hello';
    const input = 'hXllo';
    const result = calcStats(passage, input, 30);
    expect(result.inaccuracies).toBe(1);
    expect(result.accuracy).toBe(80); // 4/5 correct
  });

  it('calculates WPM using the standard 5-chars-per-word formula', () => {
    // 50 correct chars typed in 60 seconds = (50/5) / 1 min = 10 WPM
    const passage = 'a'.repeat(50);
    const input = 'a'.repeat(50);
    const result = calcStats(passage, input, 60);
    expect(result.wpm).toBe(10);
    expect(result.accuracy).toBe(100);
  });

  it('reports accuracy less than 100 when errors exist', () => {
    const passage = 'abcde';
    const input = 'aXcXe'; // 2 errors out of 5
    const result = calcStats(passage, input, 30);
    expect(result.accuracy).toBe(60);
    expect(result.inaccuracies).toBe(2);
  });
});
