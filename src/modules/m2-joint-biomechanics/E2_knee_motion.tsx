// src/modules/m2-joint-biomechanics/E2_knee_motion.tsx
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
   Experiment 2 — Knee Joint — The Double Peak
   Drag markers to the two flexion peaks.
   Badge: joint-explorer
   ═══════════════════════════════════════════════════════ */

/* ── Results: Double-peak marker drag game ── */

function KneeMotionResults({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const [gaitData, setGaitData] = useState<GaitData | null>(null);
  const [currentSample, setCurrentSample] = useState<number>(0);
  const [marker1, setMarker1] = useState<number>(15);  // % of cycle for peak 1
  const [marker2, setMarker2] = useState<number>(75);  // % of cycle for peak 2
  const [submitted, setSubmitted] = useState<boolean>(false);

  useEffect(() => {
    const data = generateGaitData({
      height_cm: 170, weight_kg: 70, gender: 'male', age: 25,
      distance_m: 10, speed_ms: 1.2, noise: 0.1, seed: 300,
    });
    setGaitData(data);
  }, []);

  useEffect(() => {
    if (!gaitData) return;
    const timer = setInterval(() => {
      setCurrentSample((s) => (s + 1) % gaitData.nSamples);
    }, 10);
    return () => clearInterval(timer);
  }, [gaitData]);

  // Find actual double peaks in first cycle
  const actualPeaks = useMemo(() => {
    if (!gaitData) return { peak1Pct: 15, peak1Val: 15, peak2Pct: 72, peak2Val: 60 };
    const knee = gaitData.signals.kneeAngle;
    const cycleLen = Math.round(gaitData.params.cycleTime * gaitData.sampleRate);
    const halfCycle = Math.floor(cycleLen / 2);

    // Peak 1: max in first half (loading response ~15%)
    let max1 = -Infinity, max1Idx = 0;
    for (let i = 0; i < Math.min(halfCycle, knee.length); i++) {
      if (knee[i] > max1) { max1 = knee[i]; max1Idx = i; }
    }

    // Peak 2: max in second half (swing ~72%)
    let max2 = -Infinity, max2Idx = halfCycle;
    for (let i = halfCycle; i < Math.min(cycleLen, knee.length); i++) {
      if (knee[i] > max2) { max2 = knee[i]; max2Idx = i; }
    }

    return {
      peak1Pct: Math.round((max1Idx / cycleLen) * 100),
      peak1Val: parseFloat(max1.toFixed(1)),
      peak2Pct: Math.round((max2Idx / cycleLen) * 100),
      peak2Val: parseFloat(max2.toFixed(1)),
    };
  }, [gaitData]);

  const error1 = Math.abs(marker1 - actualPeaks.peak1Pct);
  const error2 = Math.abs(marker2 - actualPeaks.peak2Pct);

  const handleSubmit = useCallback((): void => {
    setSubmitted(true);
    const avgError = (error1 + error2) / 2;
    const score = Math.max(0, Math.round(100 - avgError * 2));
    onComplete?.(score);
  }, [error1, error2, onComplete]);

  const channels: SignalChannel[] = useMemo(() => {
    if (!gaitData) return [];
    return [
      { id: 'kneeAngle', label: 'Knee Flexion (°)', data: gaitData.signals.kneeAngle, color: '#00d4aa', visible: true },
    ];
  }, [gaitData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Instruction */}
      <div style={{
        padding: '10px 16px', borderRadius: '8px', fontSize: '0.8125rem',
        background: '#00d4aa15', border: '1px solid #00d4aa30', color: '#00d4aa', fontWeight: 600,
      }}>
        🎯 Use the two sliders below to position markers at each flexion peak in the knee angle signal.
      </div>

      {/* Animation + signal */}
      <GaitCanvas gaitData={gaitData} speed={1.2} width={600} height={200} />
      <SignalPlot channels={channels} sampleRate={100} windowSeconds={3} currentSample={currentSample} height={200} />

      {/* Marker controls */}
      <div style={{
        padding: '16px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: '0.6875rem', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '14px' }}>
          📍 Position Markers at Flexion Peaks
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Marker 1 */}
          <div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', color: 'var(--text2)' }}>
              <span style={{ fontWeight: 600 }}>
                Peak 1 (Loading Response) — <span style={{ color: '#ff7a45', fontFamily: 'var(--mono)' }}>{marker1}%</span> of cycle
              </span>
              <input type="range" min={0} max={45} value={marker1}
                onChange={(e) => setMarker1(Number(e.target.value))}
                disabled={submitted}
                style={{ accentColor: '#ff7a45' }} />
              <span style={{ fontSize: '0.625rem', color: 'var(--text3)' }}>
                Expected: shock absorption flexion (~15° at ~15% of cycle)
              </span>
            </label>
            {submitted && (
              <div style={{
                fontSize: '0.6875rem', fontFamily: 'var(--mono)', marginTop: '4px',
                color: error1 <= 5 ? 'var(--teal)' : 'var(--red)',
              }}>
                Actual: {actualPeaks.peak1Pct}% ({actualPeaks.peak1Val}°) | Error: ±{error1}%
                {error1 <= 5 ? ' ✓' : ''}
              </div>
            )}
          </div>

          {/* Marker 2 */}
          <div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', color: 'var(--text2)' }}>
              <span style={{ fontWeight: 600 }}>
                Peak 2 (Swing Phase) — <span style={{ color: '#a855f7', fontFamily: 'var(--mono)' }}>{marker2}%</span> of cycle
              </span>
              <input type="range" min={50} max={95} value={marker2}
                onChange={(e) => setMarker2(Number(e.target.value))}
                disabled={submitted}
                style={{ accentColor: '#a855f7' }} />
              <span style={{ fontSize: '0.625rem', color: 'var(--text3)' }}>
                Expected: foot clearance flexion (~60° at ~72% of cycle)
              </span>
            </label>
            {submitted && (
              <div style={{
                fontSize: '0.6875rem', fontFamily: 'var(--mono)', marginTop: '4px',
                color: error2 <= 5 ? 'var(--teal)' : 'var(--red)',
              }}>
                Actual: {actualPeaks.peak2Pct}% ({actualPeaks.peak2Val}°) | Error: ±{error2}%
                {error2 <= 5 ? ' ✓' : ''}
              </div>
            )}
          </div>
        </div>

        {!submitted && (
          <button className="btn-primary" onClick={handleSubmit} style={{ marginTop: '16px', padding: '10px 24px' }}>
            Lock Markers ✓
          </button>
        )}
      </div>

      {/* Visual peak position bar */}
      <div style={{
        position: 'relative', height: '30px', borderRadius: '8px',
        background: 'var(--bg2)', border: '1px solid var(--border)', overflow: 'visible',
      }}>
        <div style={{ position: 'absolute', left: `${marker1}%`, top: '-4px', width: '2px', height: '38px', background: '#ff7a45', zIndex: 2 }}>
          <span style={{ position: 'absolute', top: '-16px', left: '-8px', fontSize: '0.5625rem', color: '#ff7a45', fontWeight: 700 }}>P1</span>
        </div>
        <div style={{ position: 'absolute', left: `${marker2}%`, top: '-4px', width: '2px', height: '38px', background: '#a855f7', zIndex: 2 }}>
          <span style={{ position: 'absolute', top: '-16px', left: '-8px', fontSize: '0.5625rem', color: '#a855f7', fontWeight: 700 }}>P2</span>
        </div>
        {submitted && (
          <>
            <div style={{ position: 'absolute', left: `${actualPeaks.peak1Pct}%`, top: '0', width: '2px', height: '30px', background: '#52e5a060', zIndex: 1 }} />
            <div style={{ position: 'absolute', left: `${actualPeaks.peak2Pct}%`, top: '0', width: '2px', height: '30px', background: '#52e5a060', zIndex: 1 }} />
          </>
        )}
        {/* Phase labels */}
        <span style={{ position: 'absolute', left: '5%', top: '50%', transform: 'translateY(-50%)', fontSize: '0.5rem', color: 'var(--text3)' }}>Stance</span>
        <span style={{ position: 'absolute', left: '65%', top: '50%', transform: 'translateY(-50%)', fontSize: '0.5rem', color: 'var(--text3)' }}>Swing</span>
      </div>

      {/* Score */}
      {submitted && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '16px', borderRadius: '12px', textAlign: 'center',
            background: 'var(--card)', border: '1px solid var(--border)',
          }}>
          <div style={{
            fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--mono)',
            color: error1 <= 5 && error2 <= 5 ? 'var(--teal)' : 'var(--amber)',
          }}>
            {Math.max(0, Math.round(100 - ((error1 + error2) / 2) * 2))}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>
            {error1 <= 5 && error2 <= 5 ? '🏆 Both peaks within 5%! Joint Explorer badge earned!' : 'Keep practicing to identify both peaks within 5%.'}
          </div>
        </motion.div>
      )}

      {/* Reference */}
      <div style={{
        padding: '12px 16px', borderRadius: '10px', fontSize: '0.8125rem', lineHeight: 1.6,
        background: '#00d4aa10', borderLeft: '3px solid #00d4aa', color: 'var(--text2)',
      }}>
        💡 <strong>The Double Peak:</strong> The knee has a unique double-flexion pattern. Peak 1 (~15°) during loading response absorbs heel-strike impact. Peak 2 (~60°) during swing provides foot clearance. Reduced Peak 2 suggests foot drop or quadriceps weakness.
      </div>
    </div>
  );
}

/* ── Practice ── */

function KneePractice(): React.JSX.Element {
  const [speed, setSpeed] = useState<number>(1.4);
  const [gaitData, setGaitData] = useState<GaitData | null>(null);
  const [currentSample, setCurrentSample] = useState<number>(0);

  useEffect(() => {
    const data = generateGaitData({
      height_cm: 170, weight_kg: 70, gender: 'male', age: 25,
      distance_m: 15, speed_ms: speed, noise: 0.25, seed: 310,
    });
    setGaitData(data);
  }, [speed]);

  useEffect(() => {
    if (!gaitData) return;
    const timer = setInterval(() => {
      setCurrentSample((s) => (s + 1) % gaitData.nSamples);
    }, 10);
    return () => clearInterval(timer);
  }, [gaitData]);

  const channels: SignalChannel[] = useMemo(() => {
    if (!gaitData) return [];
    return [
      { id: 'kneeAngle', label: 'Knee Flexion (°)', data: gaitData.signals.kneeAngle, color: '#00d4aa', visible: true },
      { id: 'hipAngle', label: 'Hip Angle (°)', data: gaitData.signals.hipAngle, color: '#4f8cff80', visible: true },
    ];
  }, [gaitData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSpeed(1.0 + ((Date.now() % 1000) / 1000) * 1.4);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{
        padding: '8px 14px', borderRadius: '8px', fontSize: '0.75rem',
        background: 'var(--amber)15', border: '1px solid var(--amber)30', color: 'var(--amber)',
      }}>
        ⚡ Speed: {speed.toFixed(1)} m/s | Noise: 25% — Identify both knee flexion peaks
      </div>
      <GaitCanvas gaitData={gaitData} speed={speed} width={600} height={200} />
      <SignalPlot channels={channels} sampleRate={100} windowSeconds={3} currentSample={currentSample} height={200} />
    </div>
  );
}

/* ── Predictions ── */

function KneePredictions({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const questions: QuizQuestion[] = [
    {
      type: 'fillin', id: 'knee-pred-1',
      question: 'How many flexion peaks does the knee have per gait cycle?',
      correctAnswer: 2, tolerance: 0, unit: 'peaks',
      formula: 'Peak 1: loading response (~15°), Peak 2: swing phase (~60°)',
      hint: 'The knee flexes twice: once at heel-strike impact and once during swing.',
    },
    {
      type: 'fillin', id: 'knee-pred-2',
      question: 'What is the peak knee flexion angle during swing phase (degrees)?',
      correctAnswer: 60, tolerance: 10, unit: '°',
      formula: 'Peak swing flexion ≈ 60° for foot clearance',
      hint: 'The knee must flex enough to lift the foot clear of the ground.',
    },
    {
      type: 'mc', id: 'knee-pred-3',
      question: 'The first flexion peak occurs during which phase?',
      options: ['Heel Strike', 'Loading Response', 'Mid Stance', 'Push Off'],
      correctIndex: 1,
      explanation: 'The first flexion peak (~15°) occurs during loading response to absorb heel-strike impact forces.',
      hint: 'This phase immediately follows heel contact and involves shock absorption.',
    },
  ];

  return (
    <div style={{ maxWidth: '640px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>🔮 Make Your Predictions</h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text3)', marginBottom: '20px' }}>Predict knee joint characteristics.</p>
      <QuizEngine questions={questions} onComplete={(_, totalScore) => onComplete?.(totalScore)} mode="prediction" />
    </div>
  );
}

/* ── Main Experiment ── */

function E2KneeMotion(): React.JSX.Element {
  const steps: StepConfig[] = [
    {
      id: 'context', name: 'Context', xpReward: 10,
      component: (
        <ContextStep
          title="Knee Joint — The Double Peak"
          body={`The knee joint produces one of the most distinctive kinematic patterns in gait analysis: TWO flexion peaks per cycle. This surprises most students who expect a single sinusoidal pattern like the hip.

The first flexion peak of approximately 15° occurs during loading response, immediately after heel strike. This controlled flexion absorbs the impact of the heel striking the ground — the knee acts as a shock absorber. The quadriceps eccentrically contract to control this flexion. Without it, the impact forces would transmit directly to the hip and spine.

The second, larger peak of approximately 60° occurs during swing phase. This flexion is essential for foot clearance — without sufficient knee flexion, the foot would drag on the ground (foot drop). The knee absorbs approximately 50% of the total impact energy at heel strike through this mechanism.`}
          statistic={{ value: '50%', label: 'of impact energy absorbed by the knee at heel strike' }}
          clinicalNote="Reduced second peak (swing flexion) is a hallmark of foot drop caused by peroneal nerve palsy or quadriceps weakness. Patients compensate with hip circumduction or vaulting over the stance leg."
        />
      ),
    },
    {
      id: 'predictions', name: 'Predictions', xpReward: 20,
      component: <KneePredictions />,
    },
    {
      id: 'materials', name: 'Materials', xpReward: 30,
      component: <MaterialsStep requiredPlacements={[{ sensorId: 'imu-shank', zone: 'LEFT_SHANK' }]} />,
    },
    {
      id: 'protocol', name: 'Protocol', xpReward: 20,
      component: (
        <ProtocolStep steps={[
          { id: 'p1', title: 'Observe the Knee', description: 'Watch the animation and notice how the knee flexes twice per cycle: once briefly at heel strike and once deeply during swing.', icon: '🦵' },
          { id: 'p2', title: 'Read the Signal', description: 'The teal line shows knee flexion angle. Look for TWO distinct peaks per gait cycle — a small one and a large one.', icon: '📊' },
          { id: 'p3', title: 'Understand the Why', description: 'Peak 1 at loading response = shock absorption. Peak 2 during swing = foot clearance. Different purposes, different magnitudes.', icon: '🧠' },
          { id: 'p4', title: 'Position the Markers', description: 'Use the two sliders to position markers at each flexion peak location (% of cycle). Lock them in when you are confident.', icon: '📍' },
        ]} />
      ),
    },
    {
      id: 'results', name: 'Results', xpReward: 100, minScore: 60,
      component: <KneeMotionResults />,
    },
    {
      id: 'practice', name: 'Practice', xpReward: 50, minScore: 40,
      component: <PracticeStep simulationComponent={<KneePractice />} timeLimitSeconds={60} minScore={40} />,
    },
    {
      id: 'reflection', name: 'Reflection', xpReward: 20,
      component: (
        <ReflectionStep questions={[
          { id: 'knee-ref-1', predictionKey: 'knee-pred-1', question: 'Number of knee flexion peaks', actualValue: '2', unit: 'peaks', explanation: 'The knee uniquely shows two flexion peaks: ~15° at loading response (shock absorption) and ~60° during swing (foot clearance).' },
          { id: 'knee-ref-2', predictionKey: 'knee-pred-2', question: 'Peak swing flexion', actualValue: '~60', unit: '°', explanation: 'Peak swing flexion ≈ 60° ensures adequate foot clearance. This is 4× larger than the first peak, reflecting its different biomechanical purpose.' },
          { id: 'knee-ref-3', predictionKey: 'knee-pred-3', question: 'First peak phase', actualValue: 'Loading Response', unit: '', explanation: 'Loading response (0–10% of cycle) is when the knee eccentrically flexes ~15° to absorb heel-strike impact energy.' },
        ]} />
      ),
    },
    {
      id: 'summary', name: 'Summary', xpReward: 50,
      component: (
        <SummaryStep
          experimentTitle="Knee Joint — The Double Peak"
          keyFormula="Knee: Peak 1 ≈ 15° (loading, shock absorb) | Peak 2 ≈ 60° (swing, foot clearance)"
          keyConcept="The knee shows a characteristic double-flexion pattern unique among lower limb joints. Peak 1 absorbs impact, Peak 2 provides clearance. Reduced Peak 2 = foot drop or quad weakness."
          badgeId="joint-explorer"
          moduleId="m2" expId="knee-motion"
          nextExpPath="/experiment/m2/ankle-motion"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m2" expId="knee-motion" steps={steps} />;
}

export default E2KneeMotion;
