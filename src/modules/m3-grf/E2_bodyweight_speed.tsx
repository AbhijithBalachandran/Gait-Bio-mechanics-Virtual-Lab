// src/modules/m3-grf/E2_bodyweight_speed.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ExperimentShell, { type StepConfig } from '../../components/ExperimentShell';
import ContextStep from '../../steps/ContextStep';
import MaterialsStep from '../../steps/MaterialsStep';
import ProtocolStep from '../../steps/ProtocolStep';
import PracticeStep from '../../steps/PracticeStep';
import ReflectionStep from '../../steps/ReflectionStep';
import SummaryStep from '../../steps/SummaryStep';
import QuizEngine, { type QuizQuestion } from '../../components/QuizEngine';
import GaitCanvas from '../../components/GaitCanvas';
import SignalPlot, { type SignalChannel } from '../../components/SignalPlot';
import { generateGaitData, type GaitData } from '../../engine/syntheticGait';
import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════
   Experiment 2 — How Weight and Speed Affect GRF
   Two sliders + prediction table.
   ═══════════════════════════════════════════════════════ */

interface PredictionRow {
  id: string;
  label: string;
  predicted: string;
  actual: number | null;
  unit: string;
}

/* ── Results: Weight & Speed GRF experiment ── */

function BWSpeedResults({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const [weight, setWeight] = useState<number>(70);
  const [speed, setSpeed] = useState<number>(1.2);
  const [currentSample, setCurrentSample] = useState<number>(0);
  const [predictions, setPredictions] = useState<PredictionRow[]>([
    { id: 'peakN', label: 'Peak Force (N)', predicted: '', actual: null, unit: 'N' },
    { id: 'peakBW', label: 'Peak Force (% BW)', predicted: '', actual: null, unit: '% BW' },
    { id: 'loadRate', label: 'Loading Rate (N/s)', predicted: '', actual: null, unit: 'N/s' },
  ]);
  const [revealed, setRevealed] = useState<boolean>(false);
  const [history, setHistory] = useState<{ weight: number; speed: number; peakN: number; peakBW: number; loadRate: number }[]>([]);

  const gaitData: GaitData = useMemo(() => {
    return generateGaitData({
      height_cm: 170, weight_kg: weight, gender: 'male', age: 25,
      distance_m: 10, speed_ms: speed, noise: 0.1, seed: 700,
    });
  }, [weight, speed]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSample((s) => (s + 1) % gaitData.nSamples);
    }, 10);
    return () => clearInterval(timer);
  }, [gaitData.nSamples]);

  const peakGRF = useMemo(() => {
    const cycleLen = Math.round(gaitData.params.cycleTime * gaitData.sampleRate);
    let max = 0;
    for (let i = 0; i < Math.min(cycleLen, gaitData.signals.grfVertical.length); i++) {
      if (gaitData.signals.grfVertical[i] > max) max = gaitData.signals.grfVertical[i];
    }
    return max;
  }, [gaitData]);

  const peakN = parseFloat(peakGRF.toFixed(0));
  const peakBW = parseFloat(((peakGRF / (weight * 9.81)) * 100).toFixed(1));
  const loadRate = parseFloat((peakGRF / (gaitData.params.cycleTime * 0.15)).toFixed(0));

  const handleReveal = useCallback((): void => {
    setPredictions((prev) => prev.map((p) => ({
      ...p,
      actual: p.id === 'peakN' ? peakN : p.id === 'peakBW' ? peakBW : loadRate,
    })));
    setRevealed(true);
    setHistory((prev) => [...prev, { weight, speed, peakN, peakBW, loadRate }]);
  }, [peakN, peakBW, loadRate, weight, speed]);

  const handleNext = useCallback((): void => {
    setRevealed(false);
    setPredictions((prev) => prev.map((p) => ({ ...p, predicted: '', actual: null })));
  }, []);

  const handleComplete = useCallback((): void => {
    // Score based on how many predictions were within 10%
    let correctCount = 0;
    for (const h of history) {
      // Basic scoring — each valid entry counts
      correctCount++;
    }
    const score = Math.min(100, Math.round((correctCount / 3) * 100));
    onComplete?.(score);
  }, [history, onComplete]);

  const channels: SignalChannel[] = useMemo(() => [
    { id: 'grfV', label: 'Vertical GRF (N)', data: gaitData.signals.grfVertical, color: '#4f8cff', visible: true },
  ], [gaitData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Controls */}
      <div style={{
        padding: '14px 18px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
      }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', color: 'var(--text2)', fontWeight: 600 }}>
          Body Weight: <strong style={{ color: '#ff7a45', fontFamily: 'var(--mono)', fontSize: '1rem' }}>{weight} kg</strong>
          <input type="range" min={40} max={120} value={weight}
            onChange={(e) => { setWeight(Number(e.target.value)); setRevealed(false); }}
            style={{ accentColor: '#ff7a45' }} />
          <span style={{ fontSize: '0.5625rem', color: 'var(--text3)' }}>BW Force: {(weight * 9.81).toFixed(0)} N</span>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', color: 'var(--text2)', fontWeight: 600 }}>
          Speed: <strong style={{ color: '#4f8cff', fontFamily: 'var(--mono)', fontSize: '1rem' }}>{speed.toFixed(1)} m/s</strong>
          <input type="range" min={0.5} max={2.5} step={0.1} value={speed}
            onChange={(e) => { setSpeed(Number(e.target.value)); setRevealed(false); }}
            style={{ accentColor: '#4f8cff' }} />
          <span style={{ fontSize: '0.5625rem', color: 'var(--text3)' }}>{speed >= 2.0 ? 'Fast walking' : speed >= 1.4 ? 'Normal' : 'Slow'}</span>
        </label>
      </div>

      {/* Dynamic metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {[
          { label: 'Peak Force', value: revealed ? `${peakN} N` : '???', color: '#4f8cff' },
          { label: 'Peak (% BW)', value: revealed ? `${peakBW}%` : '???', color: '#ff7a45' },
          { label: 'Loading Rate', value: revealed ? `${loadRate} N/s` : '???', color: '#a855f7' },
        ].map((m) => (
          <div key={m.label} style={{
            padding: '10px', borderRadius: '8px', background: 'var(--bg2)', textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.5rem', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '4px' }}>{m.label}</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--mono)', color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Prediction table */}
      <div style={{
        padding: '14px', borderRadius: '10px', background: 'var(--card)', border: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: '0.6875rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
          📝 Predict before revealing
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px', gap: '6px', fontSize: '0.75rem', alignItems: 'center' }}>
          <div style={{ color: 'var(--text3)', fontWeight: 600 }}>Metric</div>
          <div style={{ color: 'var(--text3)', fontWeight: 600 }}>Your Prediction</div>
          <div style={{ color: 'var(--text3)', fontWeight: 600 }}>Actual</div>
          {predictions.map((p) => (
            <React.Fragment key={p.id}>
              <div style={{ color: 'var(--text2)' }}>{p.label}</div>
              <input
                type="number" step="any" value={p.predicted}
                onChange={(e) => setPredictions((prev) => prev.map((pp) => pp.id === p.id ? { ...pp, predicted: e.target.value } : pp))}
                disabled={revealed}
                placeholder={p.unit}
                style={{ fontSize: '0.75rem', padding: '4px 6px' }}
              />
              <div style={{
                fontFamily: 'var(--mono)', fontWeight: 600,
                color: p.actual !== null ? 'var(--teal)' : 'var(--text3)',
              }}>
                {p.actual !== null ? `${p.actual} ${p.unit}` : '—'}
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          {!revealed && (
            <button className="btn-primary" onClick={handleReveal} style={{ padding: '6px 16px', fontSize: '0.75rem' }}>
              Reveal →
            </button>
          )}
          {revealed && (
            <>
              <button className="btn-secondary" onClick={handleNext} style={{ padding: '6px 16px', fontSize: '0.75rem' }}>
                Try new weight/speed →
              </button>
              {history.length >= 3 && (
                <button className="btn-primary" onClick={handleComplete} style={{ padding: '6px 16px', fontSize: '0.75rem' }}>
                  Submit {history.length} recordings ✓
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <SignalPlot channels={channels} sampleRate={100} windowSeconds={3} currentSample={currentSample} height={160} />
      <GaitCanvas gaitData={gaitData} speed={speed} width={600} height={180} />

      {/* History */}
      {history.length > 0 && (
        <div style={{
          padding: '12px', borderRadius: '10px', background: 'var(--card)', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text3)', fontWeight: 600, marginBottom: '6px' }}>HISTORY ({history.length}/3 min)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', fontSize: '0.625rem' }}>
            <div style={{ color: 'var(--text3)' }}>Weight</div><div style={{ color: 'var(--text3)' }}>Speed</div>
            <div style={{ color: 'var(--text3)' }}>Peak(N)</div><div style={{ color: 'var(--text3)' }}>%BW</div>
            <div style={{ color: 'var(--text3)' }}>LoadRate</div>
            {history.map((r, i) => (
              <React.Fragment key={i}>
                <div style={{ fontFamily: 'var(--mono)' }}>{r.weight}kg</div>
                <div style={{ fontFamily: 'var(--mono)' }}>{r.speed}m/s</div>
                <div style={{ fontFamily: 'var(--mono)', color: '#4f8cff' }}>{r.peakN}</div>
                <div style={{ fontFamily: 'var(--mono)', color: '#ff7a45' }}>{r.peakBW}%</div>
                <div style={{ fontFamily: 'var(--mono)', color: '#a855f7' }}>{r.loadRate}</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Clinical insight */}
      <div style={{
        padding: '12px 16px', borderRadius: '10px', fontSize: '0.8125rem', lineHeight: 1.6,
        background: '#ff7a4510', borderLeft: '3px solid #ff7a45', color: 'var(--text2)',
      }}>
        🏥 <strong>Clinical Insight:</strong> A 1 kg weight loss reduces knee joint compressive force by approximately 4 kg per step (Messier et al.). Over 10,000 daily steps, that is 40,000 kg less total load — a powerful argument for weight management in osteoarthritis.
      </div>
    </div>
  );
}

/* ── Practice ── */

function BWSpeedPractice(): React.JSX.Element {
  const [weight, setWeight] = useState<number>(80);
  const [speed, setSpeed] = useState<number>(1.5);
  const gaitData = useMemo(() => generateGaitData({
    height_cm: 175, weight_kg: weight, gender: 'male', age: 35,
    distance_m: 10, speed_ms: speed, noise: 0.2, seed: 710,
  }), [weight, speed]);
  const [currentSample, setCurrentSample] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSample((s) => (s + 1) % gaitData.nSamples);
    }, 10);
    return () => clearInterval(timer);
  }, [gaitData.nSamples]);

  const channels: SignalChannel[] = useMemo(() => [
    { id: 'grfV', label: 'Vertical GRF', data: gaitData.signals.grfVertical, color: '#4f8cff', visible: true },
  ], [gaitData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>
          Weight: {weight} kg
          <input type="range" min={40} max={120} value={weight} onChange={(e) => setWeight(Number(e.target.value))} style={{ width: '100%', accentColor: '#ff7a45' }} />
        </label>
        <label style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>
          Speed: {speed.toFixed(1)} m/s
          <input type="range" min={0.5} max={2.5} step={0.1} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={{ width: '100%', accentColor: '#4f8cff' }} />
        </label>
      </div>
      <SignalPlot channels={channels} sampleRate={100} windowSeconds={3} currentSample={currentSample} height={160} />
    </div>
  );
}

/* ── Predictions ── */

function BWSpeedPredictions({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const questions: QuizQuestion[] = [
    {
      type: 'fillin', id: 'bw-pred-1',
      question: 'If body weight increases by 20%, peak GRF increases by approximately what percent?',
      correctAnswer: 20, tolerance: 5, unit: '%',
      formula: 'GRF is proportional to body mass: ΔF/F ≈ Δm/m',
      hint: 'GRF scales linearly with body mass at the same speed.',
    },
    {
      type: 'mc', id: 'bw-pred-2',
      question: 'Faster walking → peak GRF will:',
      options: ['Increase', 'Decrease', 'Stay the same', 'Depends on weight'],
      correctIndex: 0,
      explanation: 'Faster walking increases peak GRF because of higher impact velocities and accelerations.',
      hint: 'Higher speed means the foot hits the ground harder.',
    },
    {
      type: 'mc', id: 'bw-pred-3',
      question: 'Who has higher peak GRF: a 90kg slow walker (0.8 m/s) or a 70kg fast walker (2.0 m/s)?',
      options: ['90 kg slow walker', '70 kg fast walker', 'About equal', 'Cannot determine'],
      correctIndex: 0,
      explanation: 'At normal walking speeds, mass dominates GRF magnitude. The 90kg walker produces higher absolute forces despite slower speed.',
      hint: 'Mass is the primary determinant of absolute GRF at walking speeds.',
    },
  ];

  return (
    <div style={{ maxWidth: '640px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>🔮 Make Your Predictions</h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text3)', marginBottom: '20px' }}>Predict how weight and speed affect GRF.</p>
      <QuizEngine questions={questions} onComplete={(_, totalScore) => onComplete?.(totalScore)} mode="prediction" />
    </div>
  );
}

/* ── Main Experiment ── */

function E2BodyweightSpeed(): React.JSX.Element {
  const steps: StepConfig[] = [
    {
      id: 'context', name: 'Context', xpReward: 10,
      component: (
        <ContextStep
          title="How Weight and Speed Affect GRF"
          body={`Ground reaction forces scale with two primary factors: body mass and walking speed. Understanding this relationship is fundamental for clinical assessment, rehabilitation planning, and injury prevention.

Body mass has a direct, linear relationship with GRF: a heavier person generates proportionally higher ground reaction forces at the same walking speed. This is why obesity is a major risk factor for osteoarthritis — every kilogram of excess body weight adds approximately 4 kg of compressive force to the knee joint per step. Over 10,000 daily steps, even small weight losses have enormous cumulative effects.

Walking speed also increases GRF, primarily through higher impact velocities at heel strike and greater propulsive demands at push-off. The first peak (loading) is more sensitive to speed changes than the second peak (push-off). At running speeds, GRF can reach 250% BW or more.`}
          statistic={{ value: '4 kg/step', label: 'knee load reduction per 1 kg weight loss (Messier et al.)' }}
          clinicalNote="Overweight patients with knee osteoarthritis show elevated GRF that accelerates joint degeneration. The 10-meter walk test at self-selected speed combined with force plate data is a standard clinical assessment. Weight loss is the single most effective non-surgical intervention."
        />
      ),
    },
    {
      id: 'predictions', name: 'Predictions', xpReward: 20,
      component: <BWSpeedPredictions />,
    },
    {
      id: 'materials', name: 'Materials', xpReward: 30,
      component: <MaterialsStep requiredPlacements={[]} />,
    },
    {
      id: 'protocol', name: 'Protocol', xpReward: 20,
      component: (
        <ProtocolStep steps={[
          { id: 'p1', title: 'Set Body Weight', description: 'Use the weight slider (40–120 kg). Before revealing the GRF, predict the peak force in Newtons and as % body weight.', icon: '⚖️' },
          { id: 'p2', title: 'Set Speed', description: 'Use the speed slider (0.5–2.5 m/s). Watch how the GRF curve shape and amplitude change with walking speed.', icon: '🏃' },
          { id: 'p3', title: 'Fill the Prediction Table', description: 'Enter your predicted values for Peak Force (N), Peak (% BW), and Loading Rate (N/s) before clicking Reveal.', icon: '📝' },
          { id: 'p4', title: 'Record 3 Conditions', description: 'You must record data at 3 different weight/speed combinations to complete this step. Compare your predictions to actuals.', icon: '📋' },
        ]} />
      ),
    },
    {
      id: 'results', name: 'Results', xpReward: 100, minScore: 60,
      component: <BWSpeedResults />,
    },
    {
      id: 'practice', name: 'Practice', xpReward: 50, minScore: 40,
      component: <PracticeStep simulationComponent={<BWSpeedPractice />} timeLimitSeconds={60} minScore={40} />,
    },
    {
      id: 'reflection', name: 'Reflection', xpReward: 20,
      component: (
        <ReflectionStep questions={[
          { id: 'bw-ref-1', predictionKey: 'bw-pred-1', question: 'GRF increase with 20% more weight', actualValue: '~20', unit: '%', explanation: 'GRF scales proportionally with body mass: 20% more mass → ~20% more peak GRF at the same speed.' },
          { id: 'bw-ref-2', predictionKey: 'bw-pred-2', question: 'Speed effect on GRF', actualValue: 'Increases', unit: '', explanation: 'Faster walking increases impact forces due to higher heel-strike velocities. First peak is most affected.' },
          { id: 'bw-ref-3', predictionKey: 'bw-pred-3', question: 'Heavier slow vs lighter fast', actualValue: '90 kg slow walker', unit: '', explanation: 'At walking speeds, mass dominates absolute GRF. The 90kg walker at 0.8 m/s still produces higher forces than the 70kg walker at 2.0 m/s.' },
        ]} />
      ),
    },
    {
      id: 'summary', name: 'Summary', xpReward: 50,
      component: (
        <SummaryStep
          experimentTitle="How Weight and Speed Affect GRF"
          keyFormula="GRF ∝ mass × acceleration | 1 kg weight loss = 4 kg less knee load per step"
          keyConcept="GRF scales linearly with body mass and increases with walking speed. Weight management is the most effective biomechanical intervention for joint protection."
          moduleId="m3" expId="bodyweight-speed"
          nextExpPath="/experiment/m3/pathological-grf"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m3" expId="bodyweight-speed" steps={steps} />;
}

export default E2BodyweightSpeed;
