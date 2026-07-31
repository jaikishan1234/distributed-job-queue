import { describe, test, expect } from 'vitest';
import { workersRequired, utilization } from '../capacity.js';

describe('Queueing Theory Math', () => {
  test('workersRequired computes correctly with safety factor', () => {
    expect(workersRequired({ arrivalRatePerSec: 100, serviceRatePerSec: 5, safetyFactor: 2 })).toBe(40);
  });

  test('utilization calculates rho correctly', () => {
    expect(utilization(50, 10, 10)).toBe(0.5);
    expect(utilization(200, 10, 10)).toBe(2);
  });
});