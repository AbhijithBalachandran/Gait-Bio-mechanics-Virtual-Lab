// src/modules/m4-imu/E4_sensor_fusion.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import ExperimentShell, { type StepConfig } from '../../components/ExperimentShell';
import ContextStep from '../../steps/ContextStep';
import MaterialsStep from '../../steps/MaterialsStep';
import ProtocolStep from '../../steps/ProtocolStep';
import PracticeStep from '../../steps/PracticeStep';
import ReflectionStep from '../../steps/ReflectionStep';
import SummaryStep from '../../steps/SummaryStep';
import QuizEngine, { type QuizQuestion } from '../../components/QuizEngine';
import SignalPlot, { type SignalChannel } from '../../components/SignalPlot';
import { generateGaitData } from '../../engine/syntheticGait';
import { complementaryFilter, addSensorNoise } from '../../engine/imuSimulator';

/* ═══════════════════════════════════════════════════════
   Experiment 4 — Sensor Fusion
   Raw gyro (drifting), raw accel (noisy), fused output.
   Alpha slider shows drift-noise tradeoff.
   Badge: fusion-engineer (if alpha within 0.03 of 0.96)
   ═══════════════════════════════════════════════════════ */

/* ── Signal generation ── */

function useFusionSignals(alpha: number) {
  return useMemo(() => {
    const base = generateGaitData({ height_cm: 170, weight_kg: 70, gender: 'male', age: 25, distance_m: 12, speed_ms: 1.2, noise: 0, seed: 840 });
    const sr = base.sampleRate;
    const dt = 1 / sr;
    const n = base.nSamples;

    // Derive tilt angle reference from hip angle (proxy for shank orientation)
    const rawAngle = base.signals.hipAngle.map((a) => a * 0.8);  // scale to shank-like range

    // Accel angle: noisy estimate (low-freq but noisy)
    const accelAngle = addSensorNoise(rawAngle, 7, 444);  // SNR=7dB → noisy

    // Gyro rate: angular velocity = derivative of angle
    const gyroRate: number[] = new Array(n).fill(0);
    for (let i = 1; i < n; i++) {
      gyroRate[i] = (rawAngle[i] - rawAngle[i - 1]) / dt;
    }
    // Add gyro noise
    const noisyGyroRate = addSensorNoise(gyroRate, 18, 555);

    // Gyro-only (integrates — drifts linearly over time)
    const gyroOnly: number[] = new Array(n).fill(0);
    let angle = accelAngle[0];
    const driftRate = 0.12;  // °/s of artificial drift
    for (let i = 1; i < n; i++) {
      angle += noisyGyroRate[i] * dt + driftRate * dt;
      gyroOnly[i] = angle;
    }
    gyroOnly[0] = accelAngle[0];

    // Fused output using complementary filter
    const fused = complementaryFilter(accelAngle, noisyGyroRate, alpha, sr);

    return { accelAngle, gyroOnly, fused, sampleRate: sr, nSamples: n };
  }, [alpha]);
}

/* ── Fusion quality score ── */

function getFusionScore(alpha: number): number {
  // Optimal alpha: 0.95-0.98. Score 100 at 0.96, falls off around it.
  const optimal = 0.96;
  const diff = Math.abs(alpha - optimal);
  if (diff <= 0.03) return 100;
  if (diff <= 0.08) return Math.round(100 - (diff - 0.03) / 0.05 * 40);
  if (diff <= 0.15) return Math.round(60 - (diff - 0.08) / 0.07 * 30);
  return Math.max(0, Math.round(30 - diff * 50));
}

/* ── Results ── */

function SensorFusionResults({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const [alpha, setAlpha] = useState(0.5);
  const [submitted, setSubmitted] = useState(false);
  const [finalAlpha, setFinalAlpha] = useState(0.5);

  const { accelAngle, gyroOnly, fused, sampleRate, nSamples } = useFusionSignals(alpha);

  const score = getFusionScore(alpha);
  const isOptimal = Math.abs(alpha - 0.96) <= 0.03;

  const gyroChannels: SignalChannel[] = useMemo(() => [
    { id: 'gyro', label: 'Gyro Only (drifting)', data: gyroOnly, color: '#ff5252', visible: true },
  ], [gyroOnly]);

  const accelChannels: SignalChannel[] = useMemo(() => [
    { id: 'accel', label: 'Accel Only (noisy)', data: accelAngle, color: '#ffa940', visible: true },
  ], [accelAngle]);

  const fusedChannels: SignalChannel[] = useMemo(() => [
    { id: 'fused', label: 'Fused Output', data: fused, color: '#52e5a0', visible: true },
  ], [fused]);

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    setFinalAlpha(alpha);
    onComplete?.(score);
  }, [alpha, score, onComplete]);

  // Quality indicators
  const driftLevel = Math.min(100, Math.round(alpha * 100));       // higher alpha = more gyro = more drift
  const noiseLevel = Math.min(100, Math.round((1 - alpha) * 100)); // lower alpha = more accel = more noise

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ padding: '10px 16px', borderRadius: '8px', fontSize: '0.8125rem', background: 'rgba(82,229,160,0.1)', border: '1px solid rgba(82,229,160,0.25)', color: 'var(--green)' }}>
        🎛️ <strong>Adjust the alpha slider</strong> to tune the complementary filter. Find the optimal alpha that minimizes both drift (red panel) and noise (amber panel) in the fused output (green).
      </div>

      {/* Alpha Slider */}
      <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)' }}>
            Alpha (α) Slider — Complementary Filter
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--mono)', color: isOptimal ? 'var(--teal)' : 'var(--amber)' }}>
            α = {alpha.toFixed(2)}
          </div>
        </div>

        <input
          type="range" min={0.1} max={0.99} step={0.01} value={alpha}
          onChange={(e) => setAlpha(parseFloat(e.target.value))}
          disabled={submitted}
          style={{ width: '100%', accentColor: isOptimal ? 'var(--teal)' : 'var(--amber)', marginBottom: '12px' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text3)', marginBottom: '10px' }}>
          <span>0.1 — More accel (noisy)</span>
          <span>0.99 — More gyro (drifts)</span>
        </div>

        {/* Tradeoff bars */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '0.625rem', color: '#ff5252', marginBottom: '4px', fontWeight: 600 }}>Drift Risk (gyro weight)</div>
            <div style={{ height: '8px', background: 'var(--bg2)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${driftLevel}%`, height: '100%', background: '#ff5252', transition: 'width 0.2s' }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.625rem', color: '#ffa940', marginBottom: '4px', fontWeight: 600 }}>Noise Risk (accel weight)</div>
            <div style={{ height: '8px', background: 'var(--bg2)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${noiseLevel}%`, height: '100%', background: '#ffa940', transition: 'width 0.2s' }} />
            </div>
          </div>
        </div>

        {/* Quality score preview */}
        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>Fusion quality:</div>
          <div style={{ flex: 1, height: '8px', background: 'var(--bg2)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${score}%`, height: '100%', background: score >= 90 ? 'var(--teal)' : score >= 60 ? 'var(--amber)' : 'var(--red)', transition: 'width 0.2s' }} />
          </div>
          <div style={{ fontSize: '0.75rem', fontFamily: 'var(--mono)', color: score >= 90 ? 'var(--teal)' : score >= 60 ? 'var(--amber)' : 'var(--red)', minWidth: '32px' }}>
            {score}%
          </div>
          {isOptimal && <span style={{ fontSize: '0.625rem', color: 'var(--teal)', fontWeight: 700 }}>OPTIMAL ✓</span>}
        </div>
      </div>

      {/* Three signal panels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '0.625rem', color: '#ff5252', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.05em' }}>
            🔴 Raw Gyro Only — Integrates drift over time (α = 1.0)
          </div>
          <SignalPlot channels={gyroChannels} sampleRate={sampleRate} windowSeconds={4} height={110} />
        </div>
        <div>
          <div style={{ fontSize: '0.625rem', color: '#ffa940', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.05em' }}>
            🟡 Raw Accel Only — Noisy angle estimate (α = 0)
          </div>
          <SignalPlot channels={accelChannels} sampleRate={sampleRate} windowSeconds={4} height={110} />
        </div>
        <div>
          <div style={{ fontSize: '0.625rem', color: '#52e5a0', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.05em' }}>
            🟢 Fused Output — Complementary filter at α = {alpha.toFixed(2)}
          </div>
          <SignalPlot channels={fusedChannels} sampleRate={sampleRate} windowSeconds={4} height={110} />
        </div>
      </div>

      {/* Formula box */}
      <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'var(--bg2)', fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--accent)', border: '1px solid var(--border)' }}>
        angle = α × (angle + gyro × dt) + (1-α) × accel_angle
        <br />
        <span style={{ color: 'var(--text3)' }}>At α={alpha.toFixed(2)}: gyro weight = {(alpha * 100).toFixed(0)}%, accel weight = {((1 - alpha) * 100).toFixed(0)}%</span>
      </div>

      {!submitted && (
        <button className="btn-primary" onClick={handleSubmit} style={{ padding: '10px 24px', alignSelf: 'flex-start' }}>
          Lock Alpha & Submit ✓
        </button>
      )}

      {submitted && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: '16px', borderRadius: '12px', background: 'var(--card)', border: `1px solid ${getFusionScore(finalAlpha) >= 90 ? 'rgba(0,212,170,0.4)' : 'var(--border)'}`, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--mono)', color: getFusionScore(finalAlpha) >= 90 ? 'var(--teal)' : 'var(--amber)' }}>
            {getFusionScore(finalAlpha)}%
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text2)', marginTop: '4px' }}>
            α = {finalAlpha.toFixed(2)} — {getFusionScore(finalAlpha) >= 90 ? '🏆 Fusion Engineer badge earned!' : 'Optimal range: 0.93–0.99'}
          </div>
          {getFusionScore(finalAlpha) < 90 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: '8px' }}>
              Tip: α = 0.96 is the textbook optimal. At this value, gyro drift is corrected by accel at a rate of {((1 - 0.96) * 100).toFixed(0)}%/sample.
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

/* ── Practice ── */

function FusionPractice(): React.JSX.Element {
  const [alpha, setAlpha] = useState(0.5);
  const { accelAngle, gyroOnly, fused, sampleRate } = useFusionSignals(alpha);

  const allChannels: SignalChannel[] = useMemo(() => [
    { id: 'gyro', label: 'Gyro Only', data: gyroOnly, color: '#ff5252', visible: true },
    { id: 'accel', label: 'Accel Only', data: accelAngle, color: '#ffa940', visible: true },
    { id: 'fused', label: 'Fused', data: fused, color: '#52e5a0', visible: true },
  ], [gyroOnly, accelAngle, fused]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text2)', minWidth: '32px' }}>α:</span>
        <input type="range" min={0.1} max={0.99} step={0.01} value={alpha}
          onChange={(e) => setAlpha(parseFloat(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--teal)' }} />
        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--mono)', color: 'var(--teal)', minWidth: '36px' }}>{alpha.toFixed(2)}</span>
      </div>
      <SignalPlot channels={allChannels} sampleRate={sampleRate} windowSeconds={4} height={200} />
    </div>
  );
}

/* ── Predictions ── */

function FusionPredictions({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const questions: QuizQuestion[] = [
    {
      type: 'mc', id: 'fuse-pred-1',
      question: 'Gyroscope drift over time is primarily caused by?',
      options: ['Measurement noise', 'Integration error', 'Temperature changes', 'Battery drain'],
      correctIndex: 1,
      explanation: 'Integrating angular velocity to get angle accumulates small errors with every sample. Even tiny noise in the gyro rate adds up over time, causing the angle estimate to drift away from reality.',
      hint: 'When you add up (integrate) small errors repeatedly, what happens to the total error?',
    },
    {
      type: 'fillin', id: 'fuse-pred-2',
      question: 'If alpha = 0.98, what percentage does the gyroscope contribute to the fused angle? (enter as %)',
      correctAnswer: 98, tolerance: 2, unit: '%',
      formula: 'angle = α × gyro_angle + (1-α) × accel_angle → α = 0.98 → 98% gyro',
      hint: 'Alpha directly defines the gyro weight in the complementary filter formula.',
    },
    {
      type: 'mc', id: 'fuse-pred-3',
      question: 'A higher alpha (closer to 1.0) leads to greater reliance on which sensor?',
      options: ['Accelerometer', 'Gyroscope', 'Magnetometer', 'All equally'],
      correctIndex: 1,
      explanation: 'α is the gyroscope weight. At α=0.99, 99% of the output comes from gyroscope integration. This gives smooth but eventually drifting angles.',
      hint: 'Look at the formula: angle = α × (gyro_contribution) + (1-α) × (accel_contribution)',
    },
  ];
  return (
    <div style={{ maxWidth: '640px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>🔮 Make Your Predictions</h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text3)', marginBottom: '20px' }}>Predict the behavior of complementary filter sensor fusion.</p>
      <QuizEngine questions={questions} onComplete={(_, totalScore) => onComplete?.(totalScore)} mode="prediction" />
    </div>
  );
}

/* ── Main Experiment ── */

function E4SensorFusion(): React.JSX.Element {
  const steps: StepConfig[] = [
    {
      id: 'context', name: 'Context', xpReward: 10,
      component: (
        <ContextStep
          title="Sensor Fusion — Combining Accelerometer and Gyroscope"
          body={`A gyroscope alone cannot maintain accurate orientation over time. Integrating angular velocity to compute angle accumulates small errors at every sample — over just one minute, orientation can drift by ~10°. This integration error is inherent to all MEMS gyroscopes and cannot be eliminated through calibration alone.

The accelerometer, on the other hand, can always compute absolute tilt angle from gravity direction — but its signal is noisy and sensitive to motion artifacts. A walking subject's accelerometer is contaminated by locomotion dynamics, making it unreliable alone.

Sensor fusion solves both problems simultaneously. The complementary filter formula is: angle = α × (angle + gyro × dt) + (1-α) × accel_angle. The gyroscope contributes high-frequency, accurate short-term changes (weight α ≈ 0.96–0.98). The accelerometer provides long-term stability via the gravity reference (weight 1-α ≈ 0.02–0.04). Together they produce a stable, accurate orientation estimate.

The Kalman filter is the more advanced alternative — it uses a full probability model to optimally weight sensors based on their noise characteristics. However, the complementary filter performs nearly as well with far less computational cost, making it the preferred choice for embedded IMU systems.`}
          statistic={{ value: '~10°/min', label: 'gyroscope drift without fusion → <0.5°/min with complementary filter' }}
          clinicalNote="All modern IMU-based gait analysis systems, including Kinetrax, use sensor fusion. Without it, joint angle estimation degrades rapidly over a walking trial. The BNO055 has an onboard Kalman filter (NDOF mode) that fuses acc+gyro+mag at 100 Hz."
        />
      ),
    },
    { id: 'predictions', name: 'Predictions', xpReward: 20, component: <FusionPredictions /> },
    {
      id: 'materials', name: 'Materials', xpReward: 30,
      component: <MaterialsStep requiredPlacements={[{ sensorId: 'imu-shank', zone: 'LEFT_SHANK' }]} />,
    },
    {
      id: 'protocol', name: 'Protocol', xpReward: 20,
      component: (
        <ProtocolStep steps={[
          { id: 'p1', title: 'Observe Three Signal Panels', description: 'Three orientation estimate panels are shown: Red = gyro-only (watch it drift!), Amber = accel-only (noisy), Green = fused output (clean and stable).', icon: '📊' },
          { id: 'p2', title: 'Start with Alpha = 0.1', description: 'Move slider to 0.1. The fused output now looks very noisy (like the accel signal). Low alpha means the filter trusts the accelerometer too much.', icon: '🔴' },
          { id: 'p3', title: 'Move Alpha to 0.99', description: 'Now move to 0.99. The fused output looks smooth but starts to drift (like the gyro signal). High alpha trusts the gyroscope too much.', icon: '🟡' },
          { id: 'p4', title: 'Find the Optimal Alpha', description: 'Adjust alpha until the fused output (green) is smooth AND stable — not drifting. The quality bar guides you. The ideal range is 0.93–0.99. Submit your best alpha.', icon: '🎯' },
        ]} />
      ),
    },
    {
      id: 'results', name: 'Results', xpReward: 100, minScore: 60,
      component: <SensorFusionResults />,
    },
    {
      id: 'practice', name: 'Practice', xpReward: 50, minScore: 40,
      component: (
        <PracticeStep
          simulationComponent={<FusionPractice />}
          timeLimitSeconds={60}
          minScore={40}
        />
      ),
    },
    {
      id: 'reflection', name: 'Reflection', xpReward: 20,
      component: (
        <ReflectionStep questions={[
          { id: 'r1', predictionKey: 'fuse-pred-1', question: 'Gyroscope drift is caused by?', actualValue: 'Integration error', unit: '', explanation: 'Integrating (summing) tiny gyro noise over thousands of samples causes the computed angle to drift linearly. This is unavoidable without a correction source like the accelerometer.' },
          { id: 'r2', predictionKey: 'fuse-pred-2', question: 'Alpha=0.98 → gyro contribution?', actualValue: '98', unit: '%', explanation: 'In the complementary filter, alpha directly sets gyro weight. At α=0.98: 98% from gyroscope (smooth short-term) + 2% from accelerometer (slow drift correction).' },
          { id: 'r3', predictionKey: 'fuse-pred-3', question: 'Higher alpha → more reliance on?', actualValue: 'Gyroscope', unit: '', explanation: 'Alpha is the gyroscope weight in the formula. α=0.99 means 99% gyro. Reduces noise but increases drift risk. Optimal is 0.95–0.98 for walking.' },
        ]} />
      ),
    },
    {
      id: 'summary', name: 'Summary', xpReward: 50,
      component: (
        <SummaryStep
          experimentTitle="Sensor Fusion — Complementary Filter"
          keyFormula="angle = α×(angle + gyro×dt) + (1-α)×accel_angle | Optimal α ≈ 0.96"
          keyConcept="Gyroscope alone drifts (~10°/min) due to integration error. Accelerometer alone is noisy. Complementary filter fuses both: gyro for smooth short-term accuracy (α≈0.96), accelerometer for long-term gravity reference (1-α≈0.04). Result: <0.5°/min drift."
          badgeId="fusion-engineer"
          moduleId="m4"
          expId="sensor-fusion"
          nextExpPath="/experiment/m4/signal-processing"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m4" expId="sensor-fusion" steps={steps} />;
}

export default E4SensorFusion;
