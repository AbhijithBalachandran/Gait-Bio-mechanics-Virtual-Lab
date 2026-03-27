// src/modules/m4-imu/E5_signal_processing.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { applyLowPassFilter, addSensorNoise } from '../../engine/imuSimulator';

/* ═══════════════════════════════════════════════════════
   Experiment 5 — Filtering IMU Signals
   Raw noisy signal vs filtered. Butterworth / Moving Avg.
   Cutoff slider. SNR score. Badge: signal-cleaner
   ═══════════════════════════════════════════════════════ */

/* ── Moving average filter ── */

function movingAverage(signal: number[], windowSize: number): number[] {
  const half = Math.floor(windowSize / 2);
  return signal.map((_, i) => {
    const start = Math.max(0, i - half);
    const end = Math.min(signal.length, i + half + 1);
    let sum = 0;
    for (let j = start; j < end; j++) sum += signal[j];
    return sum / (end - start);
  });
}

/* ── SNR computation ── */

function computeSNR(cleanSignal: number[], noisySignal: number[]): number {
  const n = Math.min(cleanSignal.length, noisySignal.length);
  if (n === 0) return 0;
  let sigPow = 0, noisePow = 0;
  for (let i = 0; i < n; i++) {
    sigPow += cleanSignal[i] * cleanSignal[i];
    noisePow += (noisySignal[i] - cleanSignal[i]) * (noisySignal[i] - cleanSignal[i]);
  }
  sigPow /= n;
  noisePow /= n;
  if (noisePow < 1e-10) return 60;
  return 10 * Math.log10(sigPow / noisePow);
}

/* ── Signal generation ── */

type FilterType = 'butterworth' | 'moving-average';

function useFilteredSignals(cutoff: number, filterType: FilterType, noiseSeed: number) {
  return useMemo(() => {
    const base = generateGaitData({ height_cm: 170, weight_kg: 70, gender: 'male', age: 25, distance_m: 10, speed_ms: 1.2, noise: 0, seed: 900 });
    const clean = base.signals.accZ;
    // Add strong noise (SNR=5dB → very noisy raw signal)
    const raw = addSensorNoise(clean, 5, noiseSeed);

    // Apply chosen filter
    let filtered: number[];
    if (filterType === 'butterworth') {
      filtered = applyLowPassFilter(raw, cutoff, base.sampleRate);
    } else {
      // Moving average: window size = sampleRate / cutoff (roughly)
      const winSize = Math.max(2, Math.round(base.sampleRate / cutoff));
      filtered = movingAverage(raw, winSize);
    }

    const rawSNR = computeSNR(clean, raw);
    const filteredSNR = computeSNR(clean, filtered);

    return { clean, raw, filtered, rawSNR, filteredSNR, sampleRate: base.sampleRate, nSamples: base.nSamples };
  }, [cutoff, filterType, noiseSeed]);
}

/* ── Results ── */

function SignalProcessingResults({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const [cutoff, setCutoff] = useState(25);
  const [filterType, setFilterType] = useState<FilterType>('butterworth');
  const [submitted, setSubmitted] = useState(false);
  const [finalSNR, setFinalSNR] = useState<number | null>(null);
  const [currentSample, setCurrentSample] = useState(0);

  const { clean, raw, filtered, rawSNR, filteredSNR, sampleRate, nSamples } = useFilteredSignals(cutoff, filterType, 912);

  useEffect(() => {
    const t = setInterval(() => setCurrentSample((s) => (s + 1) % nSamples), 10);
    return () => clearInterval(t);
  }, [nSamples]);

  // Score based on SNR improvement and appropriate cutoff
  const getFilterScore = useCallback((snr: number, fc: number): number => {
    // SNR component: target > 20dB
    const snrScore = Math.min(60, Math.round((snr / 20) * 60));
    // Cutoff appropriateness: ideal 6-20 Hz for gait
    const cutoffScore = fc >= 6 && fc <= 20 ? 40 : fc >= 3 && fc <= 30 ? 20 : 5;
    return Math.min(100, snrScore + cutoffScore);
  }, []);

  const liveScore = getFilterScore(filteredSNR, cutoff);
  const targetMet = filteredSNR >= 20;
  const firstAttemptBadge = filteredSNR >= 25;

  const rawChannels: SignalChannel[] = useMemo(() => [
    { id: 'raw', label: `Raw AccZ (SNR: ${rawSNR.toFixed(1)} dB)`, data: raw, color: '#ff5252', visible: true },
  ], [raw, rawSNR]);

  const filteredChannels: SignalChannel[] = useMemo(() => [
    { id: 'filtered', label: `Filtered AccZ (SNR: ${filteredSNR.toFixed(1)} dB)`, data: filtered, color: '#52e5a0', visible: true },
    { id: 'clean', label: 'Clean Reference', data: clean, color: '#4f8cff44' as string, visible: true },
  ], [filtered, filteredSNR, clean]);

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    setFinalSNR(filteredSNR);
    const score = getFilterScore(filteredSNR, cutoff);
    onComplete?.(score);
  }, [filteredSNR, cutoff, getFilterScore, onComplete]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ padding: '10px 16px', borderRadius: '8px', fontSize: '0.8125rem', background: 'rgba(82,229,160,0.1)', border: '1px solid rgba(82,229,160,0.25)', color: 'var(--green)' }}>
        🔧 <strong>Configure the filter</strong> to clean the raw noisy signal. Target: SNR &gt; 20 dB with a cutoff appropriate for gait (6–20 Hz). The clean reference (blue) shows the ideal.
      </div>

      {/* Filter controls */}
      <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text2)' }}>Filter type:</span>
          {(['butterworth', 'moving-average'] as FilterType[]).map((ft) => (
            <button
              key={ft}
              onClick={() => !submitted && setFilterType(ft)}
              disabled={submitted}
              style={{
                padding: '6px 16px', borderRadius: '6px', fontSize: '0.75rem', cursor: submitted ? 'default' : 'pointer',
                background: filterType === ft ? 'rgba(79,140,255,0.2)' : 'var(--bg2)',
                border: `1px solid ${filterType === ft ? 'rgba(79,140,255,0.5)' : 'var(--border)'}`,
                color: filterType === ft ? 'var(--accent)' : 'var(--text2)',
                fontWeight: filterType === ft ? 600 : 400,
              }}
            >
              {ft === 'butterworth' ? 'Butterworth (IIR)' : 'Moving Average (FIR)'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text2)', minWidth: '80px' }}>Cutoff:</span>
          <input
            type="range" min={1} max={50} step={1} value={cutoff}
            onChange={(e) => !submitted && setCutoff(parseInt(e.target.value))}
            disabled={submitted}
            style={{ flex: 1, accentColor: targetMet ? 'var(--teal)' : 'var(--amber)' }}
          />
          <span style={{ fontSize: '0.875rem', fontFamily: 'var(--mono)', color: targetMet ? 'var(--teal)' : 'var(--amber)', minWidth: '60px' }}>
            {cutoff} Hz
          </span>
        </div>

        {/* SNR display */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          {[
            { label: 'Raw SNR', value: rawSNR, color: '#ff5252' },
            { label: 'Filtered SNR', value: filteredSNR, color: filteredSNR >= 20 ? '#52e5a0' : '#ffa940' },
            { label: 'Filter Score', value: liveScore, color: liveScore >= 80 ? '#52e5a0' : liveScore >= 50 ? '#ffa940' : '#ff5252', isPercent: true },
          ].map((item) => (
            <div key={item.label} style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg2)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.5625rem', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '4px' }}>{item.label}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--mono)', color: item.color }}>
                {item.isPercent ? `${item.value}%` : `${item.value.toFixed(1)} dB`}
              </div>
            </div>
          ))}
        </div>

        {/* SNR target indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flex: 1, height: '8px', background: 'var(--bg2)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
            {/* Target line at 20dB */}
            <div style={{ position: 'absolute', left: `${Math.min(100, (20 / 40) * 100)}%`, top: 0, width: '2px', height: '100%', background: 'var(--amber)', zIndex: 1 }} />
            <div style={{ width: `${Math.min(100, Math.max(0, (filteredSNR / 40) * 100))}%`, height: '100%', background: targetMet ? 'var(--teal)' : '#ffa940', transition: 'width 0.2s' }} />
          </div>
          <span style={{ fontSize: '0.625rem', color: 'var(--text3)', minWidth: '80px' }}>
            Target: 20 dB {targetMet ? '✓' : '↑'}
          </span>
        </div>
      </div>

      {/* Signal panels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '0.625rem', color: '#ff5252', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.05em' }}>
            🔴 Raw Signal — SNR: {rawSNR.toFixed(1)} dB (noisy)
          </div>
          <SignalPlot channels={rawChannels} sampleRate={sampleRate} windowSeconds={3} currentSample={currentSample} height={120} />
        </div>
        <div>
          <div style={{ fontSize: '0.625rem', color: '#52e5a0', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.05em' }}>
            🟢 Filtered Signal ({filterType === 'butterworth' ? 'Butterworth' : 'Moving Avg'} {cutoff} Hz) — SNR: {filteredSNR.toFixed(1)} dB
          </div>
          <SignalPlot channels={filteredChannels} sampleRate={sampleRate} windowSeconds={3} currentSample={currentSample} height={140} />
        </div>
      </div>

      {/* Cutoff guide */}
      <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--bg2)', fontSize: '0.6875rem', color: 'var(--text2)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--accent)' }}>Frequency guide:</strong> Gait signal: 0.5–5 Hz | Noise: &gt;20 Hz | Safe cutoff range: 6–20 Hz for walking.
        <br />
        Too low (&lt;4 Hz): removes real gait peaks. Too high (&gt;30 Hz): keeps noise. Optimal: 8–15 Hz.
      </div>

      {!submitted && (
        <button className="btn-primary" onClick={handleSubmit} style={{ padding: '10px 24px', alignSelf: 'flex-start' }}>
          Lock Filter & Submit ✓
        </button>
      )}

      {submitted && finalSNR !== null && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: '16px', borderRadius: '12px', background: 'var(--card)', border: `1px solid ${getFilterScore(finalSNR, cutoff) >= 80 ? 'rgba(0,212,170,0.4)' : 'var(--border)'}`, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--mono)', color: getFilterScore(finalSNR, cutoff) >= 80 ? 'var(--teal)' : 'var(--amber)' }}>
            {getFilterScore(finalSNR, cutoff)}%
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text2)', marginTop: '4px' }}>
            SNR: {finalSNR.toFixed(1)} dB | Cutoff: {cutoff} Hz
          </div>
          {firstAttemptBadge && (
            <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--teal)', fontWeight: 600 }}>
              🏆 Signal Cleaner badge earned! (SNR &gt; 25 dB)
            </div>
          )}
          {!targetMet && (
            <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text3)' }}>
              Tip: Try a Butterworth filter with cutoff 8–15 Hz for best SNR on gait signals.
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

/* ── Practice ── */

function SignalProcessingPractice(): React.JSX.Element {
  const [round, setRound] = useState(1);
  const [cutoff, setCutoff] = useState(25);
  const [filterType, setFilterType] = useState<FilterType>('butterworth');

  const seeds = [912, 1024, 2048];
  const currentSeed = seeds[(round - 1) % seeds.length];

  const { raw, filtered, filteredSNR, sampleRate, nSamples } = useFilteredSignals(cutoff, filterType, currentSeed);
  const [currentSample, setCurrentSample] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrentSample((s) => (s + 1) % nSamples), 10);
    return () => clearInterval(t);
  }, [nSamples]);

  const channels: SignalChannel[] = useMemo(() => [
    { id: 'raw', label: 'Raw', data: raw, color: '#ff525270' as string, visible: true },
    { id: 'filtered', label: 'Filtered', data: filtered, color: '#52e5a0', visible: true },
  ], [raw, filtered]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.625rem', fontWeight: 700, background: 'var(--amber)20', border: '1px solid var(--amber)40', color: 'var(--amber)' }}>
          Round {round}/3
        </span>
        {round < 3 && (
          <button onClick={() => setRound((r) => r + 1)} className="btn-ghost" style={{ padding: '4px 12px', fontSize: '0.6875rem' }}>
            Next Round →
          </button>
        )}
        <span style={{ fontSize: '0.75rem', color: filteredSNR >= 20 ? 'var(--teal)' : 'var(--text3)', fontFamily: 'var(--mono)' }}>
          SNR: {filteredSNR.toFixed(1)} dB
        </span>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as FilterType)}
          style={{ padding: '6px 10px', borderRadius: '6px', background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.75rem' }}
        >
          <option value="butterworth">Butterworth</option>
          <option value="moving-average">Moving Average</option>
        </select>
        <input type="range" min={1} max={50} step={1} value={cutoff}
          onChange={(e) => setCutoff(parseInt(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--teal)' }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--teal)', minWidth: '50px' }}>{cutoff} Hz</span>
      </div>

      <SignalPlot channels={channels} sampleRate={sampleRate} windowSeconds={3} currentSample={currentSample} height={180} />
    </div>
  );
}

/* ── Predictions ── */

function SignalProcessingPredictions({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const questions: QuizQuestion[] = [
    {
      type: 'fillin', id: 'sp-pred-1',
      question: 'What is the typical frequency range of the walking gait signal? (center Hz)',
      correctAnswer: 2, tolerance: 1, unit: 'Hz',
      formula: 'Walking cadence ~100 steps/min = ~0.8 Hz stride rate. With harmonics, gait signal spans 0.5–5 Hz.',
      hint: 'Walking cadence is about 100 steps/minute. Convert to Hz (cycles per second).',
    },
    {
      type: 'mc', id: 'sp-pred-2',
      question: 'A low-pass filter with 2 Hz cutoff frequency removes?',
      options: ['Signals below 2 Hz', 'Signals above 2 Hz', 'All signals', 'DC component only'],
      correctIndex: 1,
      explanation: 'A low-pass filter passes frequencies BELOW the cutoff and attenuates (removes) frequencies ABOVE it. At 2 Hz cutoff, everything above 2 Hz is filtered out.',
      hint: 'Low-pass = passes LOW frequencies. What happens to the higher frequencies?',
    },
    {
      type: 'fillin', id: 'sp-pred-3',
      question: 'What is the recommended low-pass cutoff frequency for gait IMU signals? (Hz)',
      correctAnswer: 10, tolerance: 5, unit: 'Hz',
      formula: 'Literature recommends 6–20 Hz for gait signals. ~10 Hz preserves all gait harmonics while removing noise.',
      hint: 'Must be above 5 Hz (gait content) but below 20 Hz (starts to keep noise). Think of a middle ground.',
    },
  ];
  return (
    <div style={{ maxWidth: '640px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>🔮 Make Your Predictions</h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text3)', marginBottom: '20px' }}>Predict optimal filtering parameters for IMU gait signals.</p>
      <QuizEngine questions={questions} onComplete={(_, totalScore) => onComplete?.(totalScore)} mode="prediction" />
    </div>
  );
}

/* ── Main Experiment ── */

function E5SignalProcessing(): React.JSX.Element {
  const steps: StepConfig[] = [
    {
      id: 'context', name: 'Context', xpReward: 10,
      component: (
        <ContextStep
          title="Filtering IMU Signals"
          body={`Raw IMU signals are rarely clean enough for direct analysis. They contain two main types of contamination: high-frequency measurement noise (random electronic noise inherent to MEMS sensors) and motion artifacts (vibrations from adjacent structures, cable flex, or skin movement).

The solution is digital signal filtering. A low-pass filter selectively removes high-frequency content above a chosen cutoff frequency, preserving the slow, smooth gait signals while eliminating noise. Walking generates biomechanical signals predominantly in the 0.5–5 Hz range (gait cycle frequency and its harmonics), while noise occupies the 20–200 Hz range.

The Butterworth filter is the gold standard in biomechanics — it has maximally flat frequency response in the passband, meaning it preserves gait signal amplitude faithfully up to the cutoff. The Moving Average filter is simpler but causes phase delay. Cutoff frequency selection is critical: too low removes real biomechanical peaks; too high passes noise.

Most published gait studies use 6–20 Hz cutoff for IMU filtering. The exact choice depends on walking speed (faster gait has higher harmonics), sensor placement (foot needs higher cutoff than thigh), and the specific analysis performed.`}
          statistic={{ value: '6–20 Hz', label: 'recommended IMU cutoff frequency range for gait analysis (literature)' }}
          clinicalNote="Signal quality directly affects gait event detection accuracy. Filtering too aggressively (low cutoff) smooths out the AccZ spike at heel strike, causing missed detections. The Kinetrax pipeline uses an 8 Hz Butterworth filter as default, with an adjustable range for research applications."
        />
      ),
    },
    { id: 'predictions', name: 'Predictions', xpReward: 20, component: <SignalProcessingPredictions /> },
    {
      id: 'materials', name: 'Materials', xpReward: 30,
      component: <MaterialsStep requiredPlacements={[{ sensorId: 'imu-foot', zone: 'LEFT_FOOT' }]} />,
    },
    {
      id: 'protocol', name: 'Protocol', xpReward: 20,
      component: (
        <ProtocolStep steps={[
          { id: 'p1', title: 'Observe Raw vs Filtered', description: 'The red panel shows the raw noisy AccZ signal. The green panel shows the filtered version. Both stream in real time. The blue trace in the filtered panel is the true clean reference.', icon: '📊' },
          { id: 'p2', title: 'Start with High Cutoff (50 Hz)', description: 'Set cutoff to 50 Hz. The filtered signal looks almost identical to the raw — most noise passes through. The SNR barely improves.', icon: '🔴' },
          { id: 'p3', title: 'Move Down to 10 Hz', description: 'Set cutoff to ~10 Hz. The filtered signal now closely tracks the clean reference while removing most noise. SNR should exceed 20 dB. The gait peaks are preserved.', icon: '🟢' },
          { id: 'p4', title: 'Try Too Low (2 Hz)', description: 'Now try 2 Hz. The signal becomes over-smoothed — the heel strike peak is rounded and reduced. This demonstrates how over-filtering removes real gait data. Find the sweet spot, then submit.', icon: '🎯' },
        ]} />
      ),
    },
    {
      id: 'results', name: 'Results', xpReward: 100, minScore: 60,
      component: <SignalProcessingResults />,
    },
    {
      id: 'practice', name: 'Practice', xpReward: 50, minScore: 40,
      component: (
        <PracticeStep
          simulationComponent={<SignalProcessingPractice />}
          timeLimitSeconds={60}
          minScore={40}
        />
      ),
    },
    {
      id: 'reflection', name: 'Reflection', xpReward: 20,
      component: (
        <ReflectionStep questions={[
          { id: 'r1', predictionKey: 'sp-pred-1', question: 'Walking signal frequency range?', actualValue: '~2', unit: 'Hz', explanation: 'Walking at ~1 step/sec generates 1 Hz stride frequency. With harmonics up to 5 Hz. Most energy is in 0.5–5 Hz — this must be preserved by the filter.' },
          { id: 'r2', predictionKey: 'sp-pred-2', question: 'Low-pass 2 Hz removes?', actualValue: 'Signals above 2 Hz', unit: '', explanation: 'Low-pass filter attenuates frequencies ABOVE the cutoff. At 2 Hz cutoff, everything above 2 Hz (including most of the gait harmonics and all noise) is removed.' },
          { id: 'r3', predictionKey: 'sp-pred-3', question: 'Best cutoff for gait IMU?', actualValue: '~10', unit: 'Hz', explanation: 'The 6–20 Hz range is recommended by gait analysis literature. ~10 Hz passes all walking harmonics (0.5–5 Hz) while effectively removing high-frequency noise (>20 Hz).' },
        ]} />
      ),
    },
    {
      id: 'summary', name: 'Summary', xpReward: 50,
      component: (
        <SummaryStep
          experimentTitle="Filtering IMU Signals"
          keyFormula="Low-pass filter: passes <cutoff, removes >cutoff | Gait: 0.5–5 Hz | Optimal cutoff: 6–20 Hz"
          keyConcept="Butterworth low-pass filter is the standard for IMU gait signals. Optimal cutoff 6–20 Hz: preserves gait peaks (0.5–5 Hz) while removing MEMS noise (>20 Hz). Too low = over-smoothing loses events. Too high = noise remains. SNR target: >20 dB."
          badgeId="signal-cleaner"
          moduleId="m4"
          expId="signal-processing"
          nextExpPath="/module/m5"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m4" expId="signal-processing" steps={steps} />;
}

export default E5SignalProcessing;
