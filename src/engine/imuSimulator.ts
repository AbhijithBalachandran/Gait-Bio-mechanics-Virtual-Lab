// src/engine/imuSimulator.ts

/* ═══════════════════════════════════════════════════════
   IMU Signal Processing Utilities
   ═══════════════════════════════════════════════════════ */

/**
 * Mulberry32 seeded PRNG for deterministic noise generation.
 */
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
   addSensorNoise
   Adds Gaussian noise to a signal at a given SNR (dB)
   ═══════════════════════════════════════════════════════ */

export function addSensorNoise(
  signal: number[],
  snr: number,
  seed: number = 123
): number[] {
  const rng = mulberry32(seed);
  const randn = (): number => seededGaussian(rng);

  // Compute signal power
  let signalPower = 0;
  for (let i = 0; i < signal.length; i++) {
    signalPower += signal[i] * signal[i];
  }
  signalPower /= signal.length;

  // SNR in linear scale
  const snrLinear = Math.pow(10, snr / 10);
  const noisePower = signalPower / snrLinear;
  const noiseStd = Math.sqrt(noisePower);

  const result: number[] = new Array(signal.length);
  for (let i = 0; i < signal.length; i++) {
    result[i] = signal[i] + noiseStd * randn();
  }
  return result;
}

/* ═══════════════════════════════════════════════════════
   applyLowPassFilter
   2nd-order Butterworth IIR low-pass filter
   ═══════════════════════════════════════════════════════ */

export function applyLowPassFilter(
  signal: number[],
  cutoff: number,
  sampleRate: number
): number[] {
  if (signal.length === 0) return [];

  // Pre-warp
  const wc = Math.tan((Math.PI * cutoff) / sampleRate);
  const wc2 = wc * wc;
  const sqrt2 = Math.SQRT2;

  // Bilinear transform coefficients for 2nd-order Butterworth
  const k = 1 + sqrt2 * wc + wc2;

  const b0 = wc2 / k;
  const b1 = (2 * wc2) / k;
  const b2 = wc2 / k;
  const a1 = (2 * (wc2 - 1)) / k;
  const a2 = (1 - sqrt2 * wc + wc2) / k;

  const result: number[] = new Array(signal.length);
  result[0] = signal[0];
  result[1] = signal.length > 1 ? signal[1] : signal[0];

  // Direct Form II Transposed
  let x1 = signal[0];
  let x2 = signal[0];
  let y1 = signal[0];
  let y2 = signal[0];

  for (let i = 0; i < signal.length; i++) {
    const x0 = signal[i];
    const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    result[i] = y0;

    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }

  return result;
}

/* ═══════════════════════════════════════════════════════
   complementaryFilter
   Fuses accelerometer (tilt) and gyroscope (angular rate)
   alpha: weight for gyro (typically 0.96–0.98)
   ═══════════════════════════════════════════════════════ */

export function complementaryFilter(
  acc: number[],
  gyro: number[],
  alpha: number = 0.96,
  sampleRate: number = 100
): number[] {
  const n = Math.min(acc.length, gyro.length);
  if (n === 0) return [];

  const dt = 1 / sampleRate;
  const result: number[] = new Array(n);

  // Initial angle from accelerometer
  result[0] = acc[0];

  for (let i = 1; i < n; i++) {
    // High-pass: integrate gyro rate
    const gyroAngle = result[i - 1] + gyro[i] * dt;
    // Low-pass: accelerometer angle
    const accAngle = acc[i];
    // Fusion
    result[i] = alpha * gyroAngle + (1 - alpha) * accAngle;
  }

  return result;
}

/* ═══════════════════════════════════════════════════════
   detectHeelStrikes
   Detects heel-strike events from vertical acceleration
   Returns array of sample indices where heel strikes occur
   ═══════════════════════════════════════════════════════ */

export function detectHeelStrikes(
  accZ: number[],
  threshold: number = 11.0,
  minGap: number = 50
): number[] {
  const strikes: number[] = [];
  let lastStrike = -minGap;

  for (let i = 1; i < accZ.length - 1; i++) {
    // Peak detection: value above threshold and is a local maximum
    if (
      accZ[i] > threshold &&
      accZ[i] >= accZ[i - 1] &&
      accZ[i] >= accZ[i + 1] &&
      i - lastStrike >= minGap
    ) {
      strikes.push(i);
      lastStrike = i;
    }
  }

  return strikes;
}

/* ═══════════════════════════════════════════════════════
   detectToeOffs
   Detects toe-off events from FSR toe signal
   Returns array of sample indices where toe-off occurs
   (falling edge detection)
   ═══════════════════════════════════════════════════════ */

export function detectToeOffs(
  fsrToe: number[],
  threshold: number = 0.3
): number[] {
  const toeOffs: number[] = [];
  let wasAbove = false;

  for (let i = 0; i < fsrToe.length; i++) {
    if (fsrToe[i] > threshold) {
      wasAbove = true;
    } else if (wasAbove && fsrToe[i] <= threshold) {
      toeOffs.push(i);
      wasAbove = false;
    }
  }

  return toeOffs;
}
