// src/engine/syntheticGait.ts

/* ═══════════════════════════════════════════════════════
   Seeded PRNG — Mulberry32
   Deterministic pseudo-random number generator
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
   Types
   ═══════════════════════════════════════════════════════ */

export type Gender = 'male' | 'female' | 'other';
export type Pathology = 'normal' | 'parkinsonian' | 'hemiplegic' | 'antalgic';

export interface GaitInput {
  height_cm: number;
  weight_kg: number;
  gender: Gender;
  age: number;
  distance_m: number;
  speed_ms?: number;
  gravity?: number;
  noise?: number;
  pathology?: Pathology;
  seed?: number;
}

export interface GaitDataPoint {
  time: number;
  value: number;
}

export interface GaitSignals {
  accX: number[];
  accY: number[];
  accZ: number[];
  gyroX: number[];
  gyroY: number[];
  gyroZ: number[];
  fsrHeel: number[];
  fsrToe: number[];
  hipAngle: number[];
  kneeAngle: number[];
  ankleAngle: number[];
  grfVertical: number[];
  grfAP: number[];
  grfML: number[];
  timeArray: number[];
}

export interface SpatiotemporalParams {
  stepLength: number;
  strideLength: number;
  cadence: number;
  speed: number;
  cycleTime: number;
  stanceRatio: number;
  swingRatio: number;
  totalStrides: number;
  duration: number;
}

export interface GaitData {
  input: GaitInput;
  params: SpatiotemporalParams;
  signals: GaitSignals;
  sampleRate: number;
  nSamples: number;
}

/* ═══════════════════════════════════════════════════════
   Pathological Modifiers
   ═══════════════════════════════════════════════════════ */

interface PathologyModifiers {
  amplitudeScale: number;
  frequencyScale: number;
  stepLengthScale: number;
  noiseAdd: number;
  leftStanceRatio: number;
  rightStanceRatio: number;
  leftGyroYScale: number;
  rightGrfScale: number;
}

function getPathologyModifiers(pathology: Pathology): PathologyModifiers {
  const defaults: PathologyModifiers = {
    amplitudeScale: 1.0,
    frequencyScale: 1.0,
    stepLengthScale: 1.0,
    noiseAdd: 0,
    leftStanceRatio: 0.6,
    rightStanceRatio: 0.6,
    leftGyroYScale: 1.0,
    rightGrfScale: 1.0,
  };

  switch (pathology) {
    case 'parkinsonian':
      return {
        ...defaults,
        amplitudeScale: 0.6,
        frequencyScale: 1.3,
        stepLengthScale: 0.65,
        noiseAdd: 0.25,
      };
    case 'hemiplegic':
      return {
        ...defaults,
        leftGyroYScale: 0.5,
        leftStanceRatio: 0.65,
        rightStanceRatio: 0.58,
      };
    case 'antalgic':
      return {
        ...defaults,
        rightStanceRatio: 0.45,
        rightGrfScale: 0.70,
      };
    default:
      return defaults;
  }
}

/* ═══════════════════════════════════════════════════════
   Main Generator
   ═══════════════════════════════════════════════════════ */

export function generateGaitData(input: GaitInput): GaitData {
  const {
    height_cm,
    weight_kg,
    gender,
    age,
    distance_m,
    gravity = 9.81,
    noise = 0.2,
    pathology = 'normal',
    seed = 42,
  } = input;

  const rng = mulberry32(seed);
  const randn = (): number => seededGaussian(rng);

  const mods = getPathologyModifiers(pathology);

  // ── Derived spatiotemporal values ──
  const heightM = height_cm / 100;
  const isMale = gender === 'male';
  let stepLength = isMale
    ? 0.413 * heightM
    : 0.413 * heightM * 0.94;

  if (age > 60) {
    stepLength *= 1 - (age - 60) * 0.003;
  }

  stepLength *= mods.stepLengthScale;
  const strideLength = 2 * stepLength;

  const baseCadence = isMale ? 117 : 121;
  const effectiveNoise = Math.min(noise + mods.noiseAdd, 1.0);

  // Compute speed and cadence (they depend on each other)
  let speed: number;
  let cadence: number;

  if (input.speed_ms !== undefined) {
    speed = input.speed_ms;
    cadence = baseCadence * (speed / 1.4) * Math.sqrt(9.81 / gravity);
  } else {
    // Default comfortable walking speed
    cadence = baseCadence * Math.sqrt(9.81 / gravity);
    speed = (cadence * stepLength) / 60;
  }

  cadence *= mods.frequencyScale;

  const cycleTime = 60 / (cadence / 2);
  const f = (1 / cycleTime) * mods.frequencyScale;
  const sampleRate = 100;
  const totalStrides = Math.max(1, Math.ceil(distance_m / strideLength));
  const nSamples = Math.ceil(totalStrides * sampleRate * cycleTime);
  const duration = nSamples / sampleRate;

  const stanceRatio = mods.leftStanceRatio;

  const params: SpatiotemporalParams = {
    stepLength: Math.round(stepLength * 100) / 100,
    strideLength: Math.round(strideLength * 100) / 100,
    cadence: Math.round(cadence * 10) / 10,
    speed: Math.round(speed * 100) / 100,
    cycleTime: Math.round(cycleTime * 1000) / 1000,
    stanceRatio: Math.round(stanceRatio * 100) / 100,
    swingRatio: Math.round((1 - stanceRatio) * 100) / 100,
    totalStrides,
    duration: Math.round(duration * 10) / 10,
  };

  // ── Signal arrays ──
  const accX: number[] = new Array(nSamples);
  const accY: number[] = new Array(nSamples);
  const accZ: number[] = new Array(nSamples);
  const gyroX: number[] = new Array(nSamples);
  const gyroY: number[] = new Array(nSamples);
  const gyroZ: number[] = new Array(nSamples);
  const fsrHeel: number[] = new Array(nSamples);
  const fsrToe: number[] = new Array(nSamples);
  const hipAngle: number[] = new Array(nSamples);
  const kneeAngle: number[] = new Array(nSamples);
  const ankleAngle: number[] = new Array(nSamples);
  const grfVertical: number[] = new Array(nSamples);
  const grfAP: number[] = new Array(nSamples);
  const grfML: number[] = new Array(nSamples);
  const timeArray: number[] = new Array(nSamples);

  const PI = Math.PI;
  const TWO_PI = 2 * PI;
  const amp = mods.amplitudeScale;

  for (let i = 0; i < nSamples; i++) {
    const t = i / sampleRate;
    const phase = (t * f) % 1;
    const sinPhase = Math.sin(TWO_PI * f * t);
    const cosPhase = Math.cos(TWO_PI * f * t);
    const sin4Phase = Math.sin(4 * PI * f * t);

    timeArray[i] = Math.round(t * 1000) / 1000;

    // Heel spike
    const heelSpike = phase < 0.05 ? 8 * Math.exp(-phase * 200) * amp : 0;

    // Swing mask
    const swingMask = phase > stanceRatio ? 1 : 0.15;

    // ── Accelerometer ──
    accZ[i] =
      9.81 * (gravity / 9.81) +
      2.5 * sinPhase * amp +
      heelSpike +
      effectiveNoise * randn() * 0.5;

    accX[i] =
      1.2 * Math.sin(TWO_PI * f * t + 0.5) * amp +
      effectiveNoise * randn() * 0.15;

    accY[i] =
      0.3 * sin4Phase * amp +
      effectiveNoise * randn() * 0.08;

    // ── Gyroscope ──
    gyroY[i] =
      120 * (gravity / 9.81) * cosPhase * swingMask * amp * mods.leftGyroYScale +
      effectiveNoise * randn() * 5;

    gyroX[i] =
      15 * Math.sin(TWO_PI * f * t + 0.8) * amp +
      effectiveNoise * randn() * 2;

    gyroZ[i] =
      8 * sin4Phase * amp +
      effectiveNoise * randn() * 1.5;

    // ── FSR ──
    fsrHeel[i] = Math.max(
      0,
      Math.exp(-Math.pow(phase - 0.02, 2) / 0.001) +
        effectiveNoise * randn() * 0.05
    );

    fsrToe[i] = Math.max(
      0,
      Math.exp(-Math.pow(phase - 0.52, 2) / 0.002) +
        effectiveNoise * randn() * 0.05
    );

    // ── Joint angles ──
    hipAngle[i] = 20 * sinPhase * amp + 5;
    kneeAngle[i] = 30 + 25 * Math.sin(TWO_PI * f * t + PI / 4) * amp;
    ankleAngle[i] = 10 * Math.sin(TWO_PI * f * t + PI / 3) * amp;

    // ── Ground reaction forces ──
    const heelImpact = phase < 0.05 ? weight_kg * gravity * 0.5 * Math.exp(-phase * 100) : 0;
    grfVertical[i] =
      weight_kg * gravity * (1 + 0.3 * sinPhase) * mods.rightGrfScale +
      heelImpact;

    grfAP[i] =
      weight_kg * gravity * 0.1 * Math.sin(TWO_PI * f * t + PI / 2) * amp;

    grfML[i] =
      weight_kg * gravity * 0.05 * sin4Phase * amp;
  }

  return {
    input,
    params,
    signals: {
      accX, accY, accZ,
      gyroX, gyroY, gyroZ,
      fsrHeel, fsrToe,
      hipAngle, kneeAngle, ankleAngle,
      grfVertical, grfAP, grfML,
      timeArray,
    },
    sampleRate,
    nSamples,
  };
}
