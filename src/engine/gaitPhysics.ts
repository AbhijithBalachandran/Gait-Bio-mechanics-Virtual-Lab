// src/engine/gaitPhysics.ts

import { GaitPhase } from '../types/enums';

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

export interface Stride {
  heelStrikeIndex: number;
  toeOffIndex: number;
  nextHeelStrikeIndex: number;
}

export interface SpatioParams {
  meanStrideTime: number;
  meanStanceTime: number;
  meanSwingTime: number;
  stancePercent: number;
  swingPercent: number;
  cadence: number;
  strideTimeVariability: number;
  numberOfStrides: number;
}

export interface PhysicsModifiers {
  amplitudeScale: number;
  frequencyScale: number;
  stepLengthScale: number;
  noiseAdd: number;
  stanceRatioLeft: number;
  stanceRatioRight: number;
}

/* ═══════════════════════════════════════════════════════
   calcSpatioParams
   Compute spatiotemporal parameters from detected strides
   ═══════════════════════════════════════════════════════ */

export function calcSpatioParams(
  strides: Stride[],
  sampleRate: number
): SpatioParams {
  if (strides.length === 0) {
    return {
      meanStrideTime: 0,
      meanStanceTime: 0,
      meanSwingTime: 0,
      stancePercent: 0,
      swingPercent: 0,
      cadence: 0,
      strideTimeVariability: 0,
      numberOfStrides: 0,
    };
  }

  const strideTimes: number[] = [];
  const stanceTimes: number[] = [];
  const swingTimes: number[] = [];

  for (const stride of strides) {
    const strideTime = (stride.nextHeelStrikeIndex - stride.heelStrikeIndex) / sampleRate;
    const stanceTime = (stride.toeOffIndex - stride.heelStrikeIndex) / sampleRate;
    const swingTime = (stride.nextHeelStrikeIndex - stride.toeOffIndex) / sampleRate;

    if (strideTime > 0 && stanceTime > 0 && swingTime > 0) {
      strideTimes.push(strideTime);
      stanceTimes.push(stanceTime);
      swingTimes.push(swingTime);
    }
  }

  const n = strideTimes.length;
  if (n === 0) {
    return {
      meanStrideTime: 0,
      meanStanceTime: 0,
      meanSwingTime: 0,
      stancePercent: 0,
      swingPercent: 0,
      cadence: 0,
      strideTimeVariability: 0,
      numberOfStrides: 0,
    };
  }

  const mean = (arr: number[]): number => arr.reduce((a, b) => a + b, 0) / arr.length;

  const meanStrideTime = mean(strideTimes);
  const meanStanceTime = mean(stanceTimes);
  const meanSwingTime = mean(swingTimes);

  // Standard deviation of stride times
  const variance =
    strideTimes.reduce((sum, t) => sum + Math.pow(t - meanStrideTime, 2), 0) / n;
  const strideTimeVariability = Math.sqrt(variance);

  const cadence = meanStrideTime > 0 ? (60 / meanStrideTime) * 2 : 0; // steps/min

  return {
    meanStrideTime: Math.round(meanStrideTime * 1000) / 1000,
    meanStanceTime: Math.round(meanStanceTime * 1000) / 1000,
    meanSwingTime: Math.round(meanSwingTime * 1000) / 1000,
    stancePercent: Math.round((meanStanceTime / meanStrideTime) * 100 * 10) / 10,
    swingPercent: Math.round((meanSwingTime / meanStrideTime) * 100 * 10) / 10,
    cadence: Math.round(cadence * 10) / 10,
    strideTimeVariability: Math.round(strideTimeVariability * 10000) / 10000,
    numberOfStrides: n,
  };
}

/* ═══════════════════════════════════════════════════════
   calcSymmetryIndex
   Robinson's Symmetry Index (SI):
   SI = |left − right| / (0.5 * (left + right)) * 100%
   Perfect symmetry = 0%
   ═══════════════════════════════════════════════════════ */

export function calcSymmetryIndex(left: number, right: number): number {
  const avg = 0.5 * (left + right);
  if (avg === 0) return 0;
  const si = (Math.abs(left - right) / avg) * 100;
  return Math.round(si * 10) / 10;
}

/* ═══════════════════════════════════════════════════════
   getPathologicalModifiers
   Returns physics modifiers for pathological gait patterns
   ═══════════════════════════════════════════════════════ */

export function getPathologicalModifiers(pathology: string): PhysicsModifiers {
  switch (pathology) {
    case 'parkinsonian':
      return {
        amplitudeScale: 0.6,
        frequencyScale: 1.3,
        stepLengthScale: 0.65,
        noiseAdd: 0.25,
        stanceRatioLeft: 0.6,
        stanceRatioRight: 0.6,
      };
    case 'hemiplegic':
      return {
        amplitudeScale: 1.0,
        frequencyScale: 1.0,
        stepLengthScale: 1.0,
        noiseAdd: 0,
        stanceRatioLeft: 0.65,
        stanceRatioRight: 0.58,
      };
    case 'antalgic':
      return {
        amplitudeScale: 1.0,
        frequencyScale: 1.0,
        stepLengthScale: 1.0,
        noiseAdd: 0,
        stanceRatioLeft: 0.6,
        stanceRatioRight: 0.45,
      };
    default:
      return {
        amplitudeScale: 1.0,
        frequencyScale: 1.0,
        stepLengthScale: 1.0,
        noiseAdd: 0,
        stanceRatioLeft: 0.6,
        stanceRatioRight: 0.6,
      };
  }
}

/* ═══════════════════════════════════════════════════════
   detectGaitPhases
   Classifies each sample into its gait phase using
   combined accelerometer, gyroscope, and FSR signals
   ═══════════════════════════════════════════════════════ */

export function detectGaitPhases(
  accZ: number[],
  gyroY: number[],
  fsrHeel: number[],
  f: number,
  sampleRate: number = 100
): GaitPhase[] {
  const n = accZ.length;
  const phases: GaitPhase[] = new Array(n);

  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const phase = (t * f) % 1;

    if (phase < 0.05) {
      phases[i] = GaitPhase.HeelStrike;
    } else if (phase < 0.15) {
      phases[i] = GaitPhase.FootFlat;
    } else if (phase < 0.35) {
      phases[i] = GaitPhase.MidStance;
    } else if (phase < 0.50) {
      phases[i] = GaitPhase.HeelOff;
    } else if (phase < 0.62) {
      phases[i] = GaitPhase.ToeOff;
    } else if (phase < 0.82) {
      phases[i] = GaitPhase.MidSwing;
    } else {
      phases[i] = GaitPhase.TerminalSwing;
    }

    // Refine with sensor data when available
    if (fsrHeel[i] > 0.5 && accZ[i] > 11) {
      phases[i] = GaitPhase.HeelStrike;
    } else if (Math.abs(gyroY[i]) > 80 && phase > 0.5) {
      phases[i] = GaitPhase.MidSwing;
    }
  }

  return phases;
}

/* ═══════════════════════════════════════════════════════
   Phase color map
   ═══════════════════════════════════════════════════════ */

export const PHASE_COLORS: Record<GaitPhase, string> = {
  [GaitPhase.HeelStrike]: '#4f8cff',
  [GaitPhase.FootFlat]: '#00d4aa',
  [GaitPhase.MidStance]: '#52e5a0',
  [GaitPhase.HeelOff]: '#ffa940',
  [GaitPhase.ToeOff]: '#ff5252',
  [GaitPhase.MidSwing]: '#a855f7',
  [GaitPhase.TerminalSwing]: '#6366f1',
};

export const PHASE_LABELS: Record<GaitPhase, string> = {
  [GaitPhase.HeelStrike]: 'Heel Strike',
  [GaitPhase.FootFlat]: 'Foot Flat',
  [GaitPhase.MidStance]: 'Mid Stance',
  [GaitPhase.HeelOff]: 'Heel Off',
  [GaitPhase.ToeOff]: 'Toe Off',
  [GaitPhase.MidSwing]: 'Mid Swing',
  [GaitPhase.TerminalSwing]: 'Terminal Swing',
};
