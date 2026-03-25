// src/modules/m3-grf/E1_grf_curve.tsx
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
   Experiment 1 — The Ground Reaction Force Curve
   Label first peak, valley, second peak on vertical GRF,
   then braking/propulsion on AP curve.
   Badge: force-analyst
   ═══════════════════════════════════════════════════════ */

interface LabelMark {
  id: string;
  name: string;
  targetPct: number;      // expected % of cycle
  userPct: number | null;
  tolerance: number;       // % tolerance
  color: string;
}

const VERTICAL_LABELS: LabelMark[] = [
  { id: 'peak1', name: 'First Peak (~120% BW)', targetPct: 15, userPct: null, tolerance: 8, color: '#4f8cff' },
  { id: 'valley', name: 'Mid-Stance Valley (~80% BW)', targetPct: 30, userPct: null, tolerance: 8, color: '#ffa940' },
  { id: 'peak2', name: 'Second Peak (~110% BW)', targetPct: 48, userPct: null, tolerance: 8, color: '#a855f7' },
];

const AP_LABELS: LabelMark[] = [
  { id: 'braking', name: 'Peak Braking Force', targetPct: 12, userPct: null, tolerance: 10, color: '#ff5252' },
  { id: 'propulsion', name: 'Peak Propulsion Force', targetPct: 45, userPct: null, tolerance: 10, color: '#52e5a0' },
];

/* ── Results: Label 5 points on GRF curves ── */

function GRFCurveResults({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const [gaitData, setGaitData] = useState<GaitData | null>(null);
  const [currentSample, setCurrentSample] = useState<number>(0);
  const [verticals, setVerticals] = useState<LabelMark[]>(VERTICAL_LABELS.map((l) => ({ ...l })));
  const [aps, setAps] = useState<LabelMark[]>(AP_LABELS.map((l) => ({ ...l })));
  const [activeLabel, setActiveLabel] = useState<string>('peak1');
  const [phase, setPhase] = useState<'vertical' | 'ap' | 'done'>('vertical');
  const [submitted, setSubmitted] = useState<boolean>(false);

  useEffect(() => {
    const data = generateGaitData({
      height_cm: 170, weight_kg: 70, gender: 'male', age: 25,
      distance_m: 10, speed_ms: 1.2, noise: 0.1, seed: 600,
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

  const cycleLen = gaitData ? Math.round(gaitData.params.cycleTime * gaitData.sampleRate) : 100;
  const currentPct = cycleLen > 0 ? Math.round((currentSample % cycleLen) / cycleLen * 100) : 0;

  const handlePlaceMarker = useCallback((): void => {
    if (phase === 'vertical') {
      setVerticals((prev) => {
        const next = prev.map((l) => l.id === activeLabel ? { ...l, userPct: currentPct } : l);
        const idx = prev.findIndex((l) => l.id === activeLabel);
        if (idx < prev.length - 1) {
          setActiveLabel(prev[idx + 1].id);
        } else {
          setPhase('ap');
          setActiveLabel('braking');
        }
        return next;
      });
    } else if (phase === 'ap') {
      setAps((prev) => {
        const next = prev.map((l) => l.id === activeLabel ? { ...l, userPct: currentPct } : l);
        const idx = prev.findIndex((l) => l.id === activeLabel);
        if (idx < prev.length - 1) {
          setActiveLabel(prev[idx + 1].id);
        } else {
          setPhase('done');
        }
        return next;
      });
    }
  }, [phase, activeLabel, currentPct]);

  const handleSubmit = useCallback((): void => {
    setSubmitted(true);
    const allMarks = [...verticals, ...aps];
    const correctCount = allMarks.filter((m) =>
      m.userPct !== null && Math.abs(m.userPct - m.targetPct) <= m.tolerance
    ).length;
    const score = Math.round((correctCount / allMarks.length) * 100);
    onComplete?.(score);
  }, [verticals, aps, onComplete]);

  const channelsV: SignalChannel[] = useMemo(() => {
    if (!gaitData) return [];
    return [
      { id: 'grfV', label: 'Vertical GRF (N)', data: gaitData.signals.grfVertical, color: '#4f8cff', visible: true },
    ];
  }, [gaitData]);

  const channelsAP: SignalChannel[] = useMemo(() => {
    if (!gaitData) return [];
    return [
      { id: 'grfAP', label: 'A-P GRF (N)', data: gaitData.signals.grfAP, color: '#ffa940', visible: true },
    ];
  }, [gaitData]);

  const channelsML: SignalChannel[] = useMemo(() => {
    if (!gaitData) return [];
    return [
      { id: 'grfML', label: 'M-L GRF (N)', data: gaitData.signals.grfML, color: '#00d4aa', visible: true },
    ];
  }, [gaitData]);

  const currentLabel = phase === 'vertical'
    ? verticals.find((l) => l.id === activeLabel)
    : phase === 'ap'
      ? aps.find((l) => l.id === activeLabel)
      : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Instruction */}
      {currentLabel && (
        <div style={{
          padding: '10px 16px', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600,
          background: currentLabel.color + '15', border: `1px solid ${currentLabel.color}40`,
          color: currentLabel.color,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>🎯 Place marker: <strong>{currentLabel.name}</strong></span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem' }}>
            Cycle: {currentPct}%
          </span>
        </div>
      )}

      {phase === 'done' && !submitted && (
        <button className="btn-primary" onClick={handleSubmit} style={{ padding: '10px 24px', alignSelf: 'center' }}>
          Submit All 5 Markers ✓
        </button>
      )}

      {/* Animation */}
      <GaitCanvas gaitData={gaitData} speed={1.2} width={600} height={180} />

      {/* Vertical GRF — clickable */}
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: '0.5625rem', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
          Vertical GRF {phase === 'vertical' && '← Click below to place marker'}
        </div>
        <div onClick={phase === 'vertical' ? handlePlaceMarker : undefined}
          style={{ cursor: phase === 'vertical' ? 'crosshair' : 'default' }}>
          <SignalPlot channels={channelsV} sampleRate={100} windowSeconds={3} currentSample={currentSample} height={140} />
        </div>
        {/* Placed markers overlay */}
        {verticals.filter((v) => v.userPct !== null).map((v) => (
          <div key={v.id} style={{
            position: 'absolute', top: '20px', left: `${(v.userPct ?? 0) * 0.8 + 10}%`,
            fontSize: '0.5rem', color: v.color, fontWeight: 700, textAlign: 'center',
          }}>
            ▼ {v.name.split(' ')[0]}
            {submitted && (
              <div style={{ color: Math.abs((v.userPct ?? 0) - v.targetPct) <= v.tolerance ? 'var(--teal)' : 'var(--red)', fontSize: '0.5rem' }}>
                {Math.abs((v.userPct ?? 0) - v.targetPct) <= v.tolerance ? '✓' : `✗ (${v.targetPct}%)`}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* AP GRF — clickable */}
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: '0.5625rem', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
          Anterior-Posterior GRF {phase === 'ap' && '← Click below to place marker'}
        </div>
        <div onClick={phase === 'ap' ? handlePlaceMarker : undefined}
          style={{ cursor: phase === 'ap' ? 'crosshair' : 'default' }}>
          <SignalPlot channels={channelsAP} sampleRate={100} windowSeconds={3} currentSample={currentSample} height={120} />
        </div>
        {aps.filter((a) => a.userPct !== null).map((a) => (
          <div key={a.id} style={{
            position: 'absolute', top: '20px', left: `${(a.userPct ?? 0) * 0.8 + 10}%`,
            fontSize: '0.5rem', color: a.color, fontWeight: 700,
          }}>
            ▼ {a.name.split(' ')[1]}
            {submitted && (
              <div style={{ color: Math.abs((a.userPct ?? 0) - a.targetPct) <= a.tolerance ? 'var(--teal)' : 'var(--red)', fontSize: '0.5rem' }}>
                {Math.abs((a.userPct ?? 0) - a.targetPct) <= a.tolerance ? '✓' : `✗ (${a.targetPct}%)`}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ML GRF — display only */}
      <div>
        <div style={{ fontSize: '0.5625rem', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
          Mediolateral GRF
        </div>
        <SignalPlot channels={channelsML} sampleRate={100} windowSeconds={3} currentSample={currentSample} height={100} />
      </div>

      {/* Score */}
      {submitted && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: '16px', borderRadius: '12px', textAlign: 'center', background: 'var(--card)', border: '1px solid var(--border)' }}>
          {(() => {
            const allMarks = [...verticals, ...aps];
            const correctCount = allMarks.filter((m) =>
              m.userPct !== null && Math.abs(m.userPct - m.targetPct) <= m.tolerance
            ).length;
            return (
              <>
                <div style={{
                  fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--mono)',
                  color: correctCount === 5 ? 'var(--teal)' : 'var(--amber)',
                }}>
                  {correctCount}/5
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>
                  {correctCount === 5 ? '🏆 Force Analyst badge earned!' : `${5 - correctCount} marker(s) outside tolerance`}
                </div>
              </>
            );
          })()}
        </motion.div>
      )}

      {/* Reference */}
      <div style={{
        padding: '12px 16px', borderRadius: '10px', fontSize: '0.8125rem', lineHeight: 1.6,
        background: '#4f8cff10', borderLeft: '3px solid #4f8cff', color: 'var(--text2)',
      }}>
        💡 <strong>Key features:</strong> Vertical GRF double-peak: P1 ≈ 120% BW (loading), Valley ≈ 80% BW (mid-stance), P2 ≈ 110% BW (push-off). AP GRF: negative = braking, positive = propulsion. ML: smallest component, medial thrust during stance.
      </div>
    </div>
  );
}

/* ── Practice ── */

function GRFPractice(): React.JSX.Element {
  const [speed, setSpeed] = useState<number>(1.2);
  const gaitData = useMemo(() => generateGaitData({
    height_cm: 170, weight_kg: 70, gender: 'male', age: 25,
    distance_m: 10, speed_ms: speed, noise: 0.25, seed: 610,
  }), [speed]);
  const [currentSample, setCurrentSample] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSample((s) => (s + 1) % gaitData.nSamples);
    }, 10);
    return () => clearInterval(timer);
  }, [gaitData.nSamples]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSpeed(0.8 + ((Date.now() % 1000) / 1000) * 1.2);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const channels: SignalChannel[] = useMemo(() => [
    { id: 'grfV', label: 'Vertical GRF', data: gaitData.signals.grfVertical, color: '#4f8cff', visible: true },
    { id: 'grfAP', label: 'A-P GRF', data: gaitData.signals.grfAP, color: '#ffa940', visible: true },
  ], [gaitData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '0.75rem', background: 'var(--amber)15', border: '1px solid var(--amber)30', color: 'var(--amber)' }}>
        ⚡ Speed: {speed.toFixed(1)} m/s | Noise: 25% — Identify peaks and valleys
      </div>
      <GaitCanvas gaitData={gaitData} speed={speed} width={600} height={180} />
      <SignalPlot channels={channels} sampleRate={100} windowSeconds={3} currentSample={currentSample} height={200} />
    </div>
  );
}

/* ── Predictions ── */

function GRFPredictions({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const questions: QuizQuestion[] = [
    {
      type: 'mc', id: 'grf-pred-1',
      question: 'The first GRF peak occurs at which phase?',
      options: ['Heel Strike', 'Loading Response', 'Mid Stance', 'Push Off'],
      correctIndex: 1,
      explanation: 'The first peak (~120% BW) occurs during loading response as body weight is rapidly transferred onto the stance foot.',
      hint: 'This is the phase immediately after heel contact when impact forces peak.',
    },
    {
      type: 'fillin', id: 'grf-pred-2',
      question: 'The valley between the two vertical GRF peaks equals approximately what % of body weight?',
      correctAnswer: 80, tolerance: 10, unit: '% BW',
      formula: 'Mid-stance valley ≈ 80% BW as the body vaults over the stance foot',
      hint: 'At mid-stance, the center of mass is at its highest point, reducing ground contact force.',
    },
    {
      type: 'mc', id: 'grf-pred-3',
      question: 'Which GRF component has the largest magnitude during walking?',
      options: ['Vertical', 'Anterior-Posterior', 'Mediolateral'],
      correctIndex: 0,
      explanation: 'The vertical component is by far the largest (100–120% BW), as it supports body weight against gravity. AP is ~20% BW and ML is ~5% BW.',
      hint: 'This component opposes gravity.',
    },
  ];

  return (
    <div style={{ maxWidth: '640px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>🔮 Make Your Predictions</h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text3)', marginBottom: '20px' }}>Predict the characteristics of ground reaction forces.</p>
      <QuizEngine questions={questions} onComplete={(_, totalScore) => onComplete?.(totalScore)} mode="prediction" />
    </div>
  );
}

/* ── Main Experiment ── */

function E1GRFCurve(): React.JSX.Element {
  const steps: StepConfig[] = [
    {
      id: 'context', name: 'Context', xpReward: 10,
      component: (
        <ContextStep
          title="The Ground Reaction Force Curve"
          body={`When your foot contacts the ground, Newton's Third Law tells us the ground pushes back with an equal and opposite force — this is the Ground Reaction Force (GRF). During walking, the vertical GRF shows a characteristic double-peak pattern that is one of the most recognizable signatures in biomechanics.

The first peak occurs during loading response at approximately 120% of body weight — the impact of heel strike creates forces exceeding body weight. The curve then dips to about 80% BW at mid-stance as the body vaults over the stance foot (center of mass at its highest). The second peak at push-off reaches approximately 110% BW as the ankle plantarflexors propel the body forward.

GRF has three orthogonal components: Vertical (largest, supports body weight), Anterior-Posterior (braking then propulsion), and Mediolateral (smallest, lateral stability). Force plates embedded in gait lab floors measure all three components simultaneously at 1000+ Hz.`}
          statistic={{ value: '250%', label: 'body weight — peak GRF during running' }}
          clinicalNote="Force plates are the gold standard for measuring GRF in clinical gait laboratories. The double-peak pattern is so consistent that deviations from it are reliable indicators of pathology, including joint pain, neurological conditions, and prosthetic alignment issues."
        />
      ),
    },
    {
      id: 'predictions', name: 'Predictions', xpReward: 20,
      component: <GRFPredictions />,
    },
    {
      id: 'materials', name: 'Materials', xpReward: 30,
      component: (
        <MaterialsStep requiredPlacements={[
          { sensorId: 'fsr-heel', zone: 'R_HEEL' },
          { sensorId: 'fsr-toe', zone: 'R_TOE' },
        ]} />
      ),
    },
    {
      id: 'protocol', name: 'Protocol', xpReward: 20,
      component: (
        <ProtocolStep steps={[
          { id: 'p1', title: 'Observe Three Curves', description: 'The stacked signal plots show Vertical (blue), A-P (amber), and M-L (teal) GRF components simultaneously. Focus on the vertical first.', icon: '📊' },
          { id: 'p2', title: 'Identify the Double Peak', description: 'The vertical GRF has two peaks (loading and push-off) separated by a valley at mid-stance. Note the timing of each.', icon: '⛰️' },
          { id: 'p3', title: 'Read the A-P Curve', description: 'A-P GRF is negative during braking (heel strike decelerates the body) and positive during propulsion (push-off accelerates forward).', icon: '↔️' },
          { id: 'p4', title: 'Place 5 Markers', description: 'Click on the signal at the correct time to label: First Peak, Valley, Second Peak on vertical, then Braking Peak and Propulsion Peak on the A-P curve.', icon: '🎯' },
        ]} />
      ),
    },
    {
      id: 'results', name: 'Results', xpReward: 100, minScore: 60,
      component: <GRFCurveResults />,
    },
    {
      id: 'practice', name: 'Practice', xpReward: 50, minScore: 40,
      component: <PracticeStep simulationComponent={<GRFPractice />} timeLimitSeconds={60} minScore={40} />,
    },
    {
      id: 'reflection', name: 'Reflection', xpReward: 20,
      component: (
        <ReflectionStep questions={[
          { id: 'grf-ref-1', predictionKey: 'grf-pred-1', question: 'First peak phase', actualValue: 'Loading Response', unit: '', explanation: 'Loading response (~5–15% of cycle) is when the body rapidly loads onto the stance limb, creating the first GRF peak.' },
          { id: 'grf-ref-2', predictionKey: 'grf-pred-2', question: 'Valley % BW', actualValue: '~80', unit: '% BW', explanation: 'At mid-stance the COM is at its highest point (inverted pendulum), reducing ground contact force to ~80% BW.' },
          { id: 'grf-ref-3', predictionKey: 'grf-pred-3', question: 'Largest component', actualValue: 'Vertical', unit: '', explanation: 'Vertical GRF is largest because it must support the body against gravity (100–120% BW vs 20% AP and 5% ML).' },
        ]} />
      ),
    },
    {
      id: 'summary', name: 'Summary', xpReward: 50,
      component: (
        <SummaryStep
          experimentTitle="The Ground Reaction Force Curve"
          keyFormula="GRF Double-Peak: P1 ≈ 120% BW (loading) | Valley ≈ 80% BW | P2 ≈ 110% BW (push-off)"
          keyConcept="The vertical GRF double-peak is the hallmark of normal walking. AP GRF shows braking→propulsion transition. Three components measured by force plates at 1000+ Hz."
          badgeId="force-analyst"
          moduleId="m3" expId="grf-curve"
          nextExpPath="/experiment/m3/bodyweight-speed"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m3" expId="grf-curve" steps={steps} />;
}

export default E1GRFCurve;
