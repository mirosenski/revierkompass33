import { describe, it, expect } from 'vitest';
import { validateCoordinates } from './validation';

describe('validateCoordinates', () => {
  it('should return true for valid coordinates', () => {
    expect(validateCoordinates(48.7758, 9.1829)).toBe(true);
    expect(validateCoordinates(49.0069, 8.4037)).toBe(true);
    expect(validateCoordinates(0, 0)).toBe(true);
    expect(validateCoordinates(-90, -180)).toBe(true);
    expect(validateCoordinates(90, 180)).toBe(true);
  });

  it('should return false for out-of-range latitude', () => {
    expect(validateCoordinates(91, 0)).toBe(false);
    expect(validateCoordinates(-91, 0)).toBe(false);
    expect(validateCoordinates(100, 0)).toBe(false);
    expect(validateCoordinates(-100, 0)).toBe(false);
  });

  it('should return false for out-of-range longitude', () => {
    expect(validateCoordinates(0, 181)).toBe(false);
    expect(validateCoordinates(0, -181)).toBe(false);
    expect(validateCoordinates(0, 200)).toBe(false);
    expect(validateCoordinates(0, -200)).toBe(false);
  });

  it('should return false for non-number inputs', () => {
    expect(validateCoordinates(NaN, 0)).toBe(false);
    expect(validateCoordinates(0, NaN)).toBe(false);
    expect(validateCoordinates(Infinity, 0)).toBe(false);
    expect(validateCoordinates(0, Infinity)).toBe(false);
    expect(validateCoordinates(-Infinity, 0)).toBe(false);
    expect(validateCoordinates(0, -Infinity)).toBe(false);
  });

  it('should return false for mixed invalid inputs', () => {
    expect(validateCoordinates(91, 181)).toBe(false);
    expect(validateCoordinates(-91, -181)).toBe(false);
    expect(validateCoordinates(NaN, NaN)).toBe(false);
  });
}); 