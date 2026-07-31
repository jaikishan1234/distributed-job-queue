export interface CapacityInput {
  arrivalRatePerSec: number;
  serviceRatePerSec: number;
  safetyFactor: number;
}

export function workersRequired(input: CapacityInput): number {
  const { arrivalRatePerSec, serviceRatePerSec, safetyFactor } = input;
  if (serviceRatePerSec <= 0) {
    throw new Error('serviceRate must be > 0');
  }
  const raw = (arrivalRatePerSec / serviceRatePerSec) * safetyFactor;
  return Math.ceil(raw);
}

export function utilization(arrivalRate: number, workers: number, serviceRate: number): number {
  return arrivalRate / (workers * serviceRate);
}

export function averageJobsInSystem(arrivalRatePerSec: number, avgTimeInSystemSec: number): number {
  return arrivalRatePerSec * avgTimeInSystemSec;
}