// src/engine/fsrSimulator.ts

import type { GaitInput } from './syntheticGait';

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

export interface GaitEvent {
  type: 'heel-strike' | 'foot-flat' | 'heel-off' | 'toe-off';
  sampleIndex: number;
  time: number;
  strideNumber: number;
}

/* ═══════════════════════════════════════════════════════
   Seeded PRNG
   ═══════════════════════════════════════════════════════ */

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return (): number => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededGaussian(rng: () => number): number {
  const u1 = rng();
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10))) * Math.cos(2 * Math.PI * u2);
}

/* ═══════════════════════════════════════════════════════
   simulateFSR
   Generates heel and toe FSR pressure signals
   based on weight, speed, and gait input parameters
   ═══════════════════════════════════════════════════════ */

export function simulateFSR(
  weight: number,
  speed: number,
  input: GaitInput
): { heel: number[]; toe: number[] } {
  const {
    height_cm,
    gender,
    age,
    distance_m,
    gravity = 9.81,
    noise = 0.2,
    seed = 77,
  } = input;

  const rng = mulberry32(seed);
  const randn = (): number => seededGaussian(rng);

  const heightM = height_cm / 100;
  const isMale = gender === 'male';
  let stepLength = isMale ? 0.413 * heightM : 0.413 * heightM * 0.94;
  if (age > 60) stepLength *= 1 - (age - 60) * 0.003;
  const strideLength = 2 * stepLength;
  const baseCadence = isMale ? 117 : 121;
  const cadence = baseCadence * (speed / 1.4) * Math.sqrt(9.81 / gravity);
  const cycleTime = 60 / (cadence / 2);
  const f = 1 / cycleTime;
  const sampleRate = 100;
  const totalStrides = Math.max(1, Math.ceil(distance_m / strideLength));
  const nSamples = Math.ceil(totalStrides * sampleRate * cycleTime);

  // Force scaling: heavier persons → higher FSR output
  const forceScale = (weight * gravity) / (70 * 9.81);
  // Speed scaling: faster walking → sharper peaks
  const speedScale = 1 + (speed - 1.2) * 0.2;

  const heel: number[] = new Array(nSamples);
  const toe: number[] = new Array(nSamples);

  for (let i = 0; i < nSamples; i++) {
    const t = i / sampleRate;
    const phase = (t * f) % 1;

    // Heel: sharp peak at heel-strike (~2% of cycle)
    const heelPeak = Math.exp(-Math.pow(phase - 0.02, 2) / 0.001);
    // Secondary heel loading at mid-stance (~25%)
    const heelMid = 0.3 * Math.exp(-Math.pow(phase - 0.25, 2) / 0.005);

    heel[i] = Math.max(
      0,
      (heelPeak + heelMid) * forceScale * speedScale + noise * randn() * 0.05
    );

    // Toe: broader peak at push-off (~52% of cycle)
    const toePeak = Math.exp(-Math.pow(phase - 0.52, 2) / 0.002);
    // Pre-loading at forefoot contact (~35%)
    const toePreload = 0.2 * Math.exp(-Math.pow(phase - 0.35, 2) / 0.003);

    toe[i] = Math.max(
      0,
      (toePeak + toePreload) * forceScale * speedScale + noise * randn() * 0.05
    );
  }

  return { heel, toe };
}

/* ═══════════════════════════════════════════════════════
   calibrateFSR
   Converts raw voltage readings to force values
   using the voltage divider model: Vout = Vin * R2 / (R1 + R2)
   where R1 = FSR resistance (varies with force)
   ═══════════════════════════════════════════════════════ */

export function calibrateFSR(
  rawVoltage: number[],
  vin: number = 5.0,
  r2: number = 10000
): number[] {
  const result: number[] = new Array(rawVoltage.length);

  for (let i = 0; i < rawVoltage.length; i++) {
    const vout = rawVoltage[i];

    // Avoid division by zero
    if (vout <= 0 || vout >= vin) {
      result[i] = 0;
      continue;
    }

    // From voltage divider: R1 = R2 * (Vin/Vout - 1)
    const r1 = r2 * (vin / vout - 1);

    // FSR resistance to force: F ≈ 1/R (simplified linear model)
    // Typical FSR: 100kΩ at no pressure, ~200Ω at max pressure
    // Normalize to 0-1 range
    const maxR = 100000;
    const force = Math.max(0, 1 - r1 / maxR);

    result[i] = Math.round(force * 1000) / 1000;
  }

  return result;
}

/* ═══════════════════════════════════════════════════════
   detectGaitEvents
   Detects heel-strike, foot-flat, heel-off, toe-off
   from heel and toe FSR signals
   ═══════════════════════════════════════════════════════ */

export function detectGaitEvents(
  heel: number[],
  toe: number[],
  threshold: number = 0.15,
  sampleRate: number = 100
): GaitEvent[] {
  const events: GaitEvent[] = [];
  const n = Math.min(heel.length, toe.length);
  let strideNumber = 0;
  let lastHeelStrike = -100;
  const minGap = Math.round(sampleRate * 0.3); // minimum 300ms between same events

  // State machine
  let heelWasBelow = true;
  let toeWasAbove = false;
  let heelWasAboveForOff = false;

  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const heelAbove = heel[i] > threshold;
    const toeAbove = toe[i] > threshold;

    // Heel-strike: heel FSR rises above threshold
    if (heelAbove && heelWasBelow && i - lastHeelStrike >= minGap) {
      strideNumber++;
      events.push({
        type: 'heel-strike',
        sampleIndex: i,
        time: Math.round(t * 1000) / 1000,
        strideNumber,
      });
      lastHeelStrike = i;
      heelWasBelow = false;
      heelWasAboveForOff = true;
    }

    // Foot-flat: both heel and toe above threshold
    if (heelAbove && toeAbove) {
      // Only add if last event wasn't already foot-flat
      const lastEvent = events[events.length - 1];
      if (!lastEvent || lastEvent.type !== 'foot-flat' || i - lastEvent.sampleIndex >= minGap) {
        events.push({
          type: 'foot-flat',
          sampleIndex: i,
          time: Math.round(t * 1000) / 1000,
          strideNumber,
        });
      }
    }

    // Heel-off: heel falls below while toe still above
    if (!heelAbove && heelWasAboveForOff && toeAbove) {
      events.push({
        type: 'heel-off',
        sampleIndex: i,
        time: Math.round(t * 1000) / 1000,
        strideNumber,
      });
      heelWasAboveForOff = false;
    }

    // Toe-off: toe falls below threshold
    if (!toeAbove && toeWasAbove) {
      events.push({
        type: 'toe-off',
        sampleIndex: i,
        time: Math.round(t * 1000) / 1000,
        strideNumber,
      });
    }

    // Update state
    if (!heelAbove) heelWasBelow = true;
    toeWasAbove = toeAbove;
  }

  return events;
}
