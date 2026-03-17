// src/modules/m1-gait-fundamentals/E1_gait_cycle.tsx
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import ExperimentShell, { type StepConfig } from '../../components/ExperimentShell';
import ContextStep from '../../steps/ContextStep';
import MaterialsStep from '../../steps/MaterialsStep';
import ProtocolStep from '../../steps/ProtocolStep';
import PracticeStep from '../../steps/PracticeStep';
import ReflectionStep from '../../steps/ReflectionStep';
import SummaryStep from '../../steps/SummaryStep';
import QuizEngine, { type QuizQuestion } from '../../components/QuizEngine';
import GaitCanvas from '../../components/GaitCanvas';
import { generateGaitData, type GaitData } from '../../engine/syntheticGait';
import { GaitPhase } from '../../types/enums';
import { PHASE_LABELS, PHASE_COLORS } from '../../engine/gaitPhysics';

/* ═══════════════════════════════════════════════════════
   Experiment 1 — The Gait Cycle
   Interactive: Student clicks phase buttons in sync
   with the animation. Scored by timing accuracy.
   ═══════════════════════════════════════════════════════ */

const PHASE_ORDER: GaitPhase[] = [
  GaitPhase.HeelStrike,
  GaitPhase.FootFlat,
  GaitPhase.MidStance,
  GaitPhase.HeelOff,
  GaitPhase.ToeOff,
  GaitPhase.MidSwing,
];

interface PhaseHit {
  phase: GaitPhase;
  deltaMs: number;
  score: number;
}

/* ── Results: Phase-Click Scoring Game ── */

function GaitCycleResults({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const [gaitData, setGaitData] = useState<GaitData | null>(null);
  const [currentPhase, setCurrentPhase] = useState<GaitPhase>(GaitPhase.HeelStrike);
  const [hits, setHits] = useState<PhaseHit[]>([]);
  const [cyclePercent, setCyclePercent] = useState<number>(0);
  const phaseChangeTimeRef = useRef<number>(Date.now());
  const animSampleRef = useRef<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  useEffect(() => {
    const data = generateGaitData({
      height_cm: 170,
      weight_kg: 70,
      gender: 'male',
      age: 25,
      distance_m: 10,
      speed_ms: 1.2,
      noise: 0.15,
      seed: 42,
    });
    setGaitData(data);
  }, []);

  // Track cycle percentage
  useEffect(() => {
    if (!gaitData || !isActive) return;
    const timer = setInterval(() => {
      animSampleRef.current = (animSampleRef.current + 1) % gaitData.nSamples;
      const t = animSampleRef.current / gaitData.sampleRate;
      const f = 1 / gaitData.params.cycleTime;
      const pct = ((t * f) % 1) * 100;
      setCyclePercent(pct);
    }, 10);
    return () => clearInterval(timer);
  }, [gaitData, isActive]);

  const handlePhaseChange = useCallback((phase: GaitPhase): void => {
    phaseChangeTimeRef.current = Date.now();
    setCurrentPhase(phase);
  }, []);

  const handlePhaseClick = useCallback((clickedPhase: GaitPhase): void => {
    if (!isActive || isFinished) return;

    const deltaMs = Math.abs(Date.now() - phaseChangeTimeRef.current);
    let score = 0;
    if (clickedPhase === currentPhase) {
      if (deltaMs <= 50) score = 100;
      else if (deltaMs <= 100) score = 50;
      else if (deltaMs <= 200) score = 25;
    }

    const hit: PhaseHit = { phase: clickedPhase, deltaMs, score };
    setHits((prev) => {
      const next = [...prev, hit];
      // Check if all 6 phases attempted
      const phasesHit = new Set(next.map((h) => h.phase));
      if (phasesHit.size >= 6) {
        setIsFinished(true);
        const totalScore = Math.round(next.reduce((s, h) => s + h.score, 0) / next.length);
        setTimeout(() => onComplete?.(totalScore), 500);
      }
      return next;
    });
  }, [isActive, isFinished, currentPhase, onComplete]);

  const totalScore = useMemo(() => {
    if (hits.length === 0) return 0;
    return Math.round(hits.reduce((s, h) => s + h.score, 0) / hits.length);
  }, [hits]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Cycle % counter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 600 }}>
            Cycle Position
          </span>
          <span style={{
            fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--mono)',
            color: PHASE_COLORS[currentPhase],
          }}>
            {cyclePercent.toFixed(0)}%
          </span>
        </div>
        {!isActive && !isFinished && (
          <button className="btn-primary" onClick={() => setIsActive(true)}
            style={{ padding: '8px 20px' }}>
            ▶ Start Phase Identification
          </button>
        )}
        {isActive && (
          <span style={{
            padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
            background: PHASE_COLORS[currentPhase] + '20',
            color: PHASE_COLORS[currentPhase],
          }}>
            {PHASE_LABELS[currentPhase]}
          </span>
        )}
      </div>

      {/* Animation */}
      <GaitCanvas gaitData={gaitData} speed={1.2} onPhaseChange={handlePhaseChange} />

      {/* Phase buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {PHASE_ORDER.map((phase) => {
          const hit = hits.find((h) => h.phase === phase);
          const isCurrent = currentPhase === phase && isActive;
          const color = PHASE_COLORS[phase];

          return (
            <button
              key={phase}
              onClick={() => handlePhaseClick(phase)}
              disabled={!isActive || isFinished}
              style={{
                padding: '12px 8px',
                borderRadius: '10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: isActive && !isFinished ? 'pointer' : 'default',
                border: `2px solid ${isCurrent ? color : hit ? (hit.score > 0 ? '#52e5a0' : '#ff5252') : 'var(--border)'}`,
                background: hit
                  ? hit.score > 50 ? '#52e5a010' : hit.score > 0 ? '#ffa94010' : '#ff525210'
                  : isCurrent ? color + '15' : 'var(--card)',
                color: hit ? (hit.score > 50 ? '#52e5a0' : hit.score > 0 ? '#ffa940' : '#ff5252') : isCurrent ? color : 'var(--text2)',
                transition: 'all 0.15s',
              }}
            >
              {PHASE_LABELS[phase]}
              {hit && (
                <div style={{ fontSize: '0.5625rem', marginTop: '4px', fontFamily: 'var(--mono)' }}>
                  {hit.deltaMs}ms — {hit.score > 50 ? '✓' : hit.score > 0 ? '~' : '✗'} {hit.score}pts
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Score display */}
      {isFinished && (
        <div style={{
          padding: '16px', borderRadius: '12px', textAlign: 'center',
          background: 'var(--card)', border: `1px solid ${totalScore >= 60 ? 'var(--teal)' : 'var(--red)'}30`,
        }}>
          <div style={{
            fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--mono)',
            color: totalScore >= 60 ? 'var(--teal)' : 'var(--red)',
          }}>
            {totalScore}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>
            Phase identification score
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Practice: Random speed changes ── */

function GaitCyclePractice(): React.JSX.Element {
  const [speed, setSpeed] = useState<number>(1.2);
  const [gaitData, setGaitData] = useState<GaitData | null>(null);
  const [currentPhase, setCurrentPhase] = useState<GaitPhase>(GaitPhase.HeelStrike);

  useEffect(() => {
    const data = generateGaitData({
      height_cm: 170, weight_kg: 70, gender: 'male', age: 25,
      distance_m: 20, speed_ms: speed, noise: 0.2, seed: 99,
    });
    setGaitData(data);
  }, [speed]);

  // Random speed changes every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const newSpeed = 0.8 + Math.floor((Date.now() % 1000) / 1000 * 12 + 1) * 0.1;
      setSpeed(Math.min(2.0, Math.max(0.8, newSpeed)));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{
        padding: '8px 14px', borderRadius: '8px', fontSize: '0.75rem',
        background: 'var(--amber)15', border: '1px solid var(--amber)30', color: 'var(--amber)',
      }}>
        ⚡ Speed changes every 10s! Current: {speed.toFixed(1)} m/s
      </div>
      <GaitCanvas gaitData={gaitData} speed={speed} onPhaseChange={setCurrentPhase} />
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {PHASE_ORDER.map((phase) => (
          <span key={phase} style={{
            padding: '6px 12px', borderRadius: '8px', fontSize: '0.6875rem', fontWeight: 600,
            background: currentPhase === phase ? PHASE_COLORS[phase] + '20' : 'var(--bg2)',
            color: currentPhase === phase ? PHASE_COLORS[phase] : 'var(--text3)',
            border: `1px solid ${currentPhase === phase ? PHASE_COLORS[phase] : 'var(--border)'}`,
          }}>
            {PHASE_LABELS[phase]}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Predictions Step ── */

function GaitCyclePredictions({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const questions: QuizQuestion[] = [
    {
      type: 'fillin',
      id: 'gc-pred-1',
      question: 'What percentage of the gait cycle is the stance phase?',
      correctAnswer: 60,
      tolerance: 5,
      unit: '%',
      formula: 'Stance ≈ 60% of total gait cycle at normal walking speed',
      hint: 'Stance is the phase where the foot is on the ground — it is the majority of the cycle.',
    },
    {
      type: 'fillin',
      id: 'gc-pred-2',
      question: 'How many distinct phases are there in one complete gait cycle?',
      correctAnswer: 6,
      tolerance: 0,
      unit: 'phases',
      formula: 'HS → FF → MS → HO → TO → Sw = 6 phases',
      hint: 'Count: Heel Strike, Foot Flat, Mid Stance, Heel Off, Toe Off, Swing.',
    },
    {
      type: 'mc',
      id: 'gc-pred-3',
      question: 'Which phase has BOTH feet on the ground simultaneously?',
      options: ['Heel Strike', 'Double Support', 'Toe Off', 'Swing'],
      correctIndex: 1,
      explanation: 'Double Support is the brief period when both feet contact the ground, occurring twice per gait cycle.',
      hint: 'This phase provides maximum stability with the widest base of support.',
    },
  ];

  return (
    <div style={{ maxWidth: '640px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
        🔮 Make Your Predictions
      </h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text3)', marginBottom: '20px' }}>
        Predict the outcomes before the experiment. You will compare these later!
      </p>
      <QuizEngine questions={questions} onComplete={(_, totalScore) => onComplete?.(totalScore)} mode="prediction" />
    </div>
  );
}

/* ── Main Experiment ── */

function E1GaitCycle(): React.JSX.Element {
  const steps: StepConfig[] = [
    {
      id: 'context',
      name: 'Context',
      xpReward: 10,
      component: (
        <ContextStep
          title="The Gait Cycle"
          body={`The human gait cycle is the fundamental unit of walking, defined as the interval from one heel strike to the next heel strike of the same foot. It consists of 6 distinct phases that repeat with remarkable consistency.

The 6 phases are: (1) Heel Strike — initial contact of the heel with the ground, (2) Foot Flat — the sole makes full contact, loading the limb, (3) Mid Stance — the body passes over the supporting foot, center of mass at its highest, (4) Heel Off — the heel lifts as the body advances forward, (5) Toe Off — the toes leave the ground, propelling the body forward, and (6) Swing Phase — the limb advances through the air to the next heel strike.

The gait cycle divides into 60% stance phase (foot on ground) and 40% swing phase (foot in air). This ratio is remarkably consistent at comfortable walking speed across healthy adults. Clinical gait analysis uses deviations from this pattern to diagnose conditions including cerebral palsy, stroke, Parkinson's disease, and musculoskeletal injuries.`}
          statistic={{ value: '~10,000', label: 'steps taken per day by the average adult' }}
          clinicalNote="Gait analysis is one of the most sensitive tools for detecting neurological conditions. Changes in phase timing can appear years before other symptoms in diseases like Parkinson's."
        />
      ),
    },
    {
      id: 'predictions',
      name: 'Predictions',
      xpReward: 20,
      component: <GaitCyclePredictions />,
    },
    {
      id: 'materials',
      name: 'Materials',
      xpReward: 30,
      component: (
        <MaterialsStep
          requiredPlacements={[
            { sensorId: 'imu-foot', zone: 'LEFT_FOOT' },
          ]}
        />
      ),
    },
    {
      id: 'protocol',
      name: 'Protocol',
      xpReward: 20,
      component: (
        <ProtocolStep
          steps={[
            { id: 'p1', title: 'Watch the Animation', description: 'Observe the gait animation carefully. Notice how each phase transitions smoothly into the next. The stick figure shows the full cycle from heel-strike to heel-strike.', icon: '👁️' },
            { id: 'p2', title: 'Notice Phase Colors', description: 'Each gait phase is highlighted with a distinct color. Watch how the background color changes at each phase transition boundary.', icon: '🎨' },
            { id: 'p3', title: 'Observe the % Counter', description: 'The cycle position counter shows your current location within the gait cycle (0-100%). Stance occupies 0-60% and swing occupies 60-100%.', icon: '📊' },
            { id: 'p4', title: 'Prepare for Phase Marking', description: 'In the Results step, you will click buttons to mark each phase as it occurs. You will be scored on timing accuracy — within 50ms = full points!', icon: '🎯' },
          ]}
        />
      ),
    },
    {
      id: 'results',
      name: 'Results',
      xpReward: 100,
      minScore: 60,
      component: <GaitCycleResults />,
    },
    {
      id: 'practice',
      name: 'Practice',
      xpReward: 50,
      minScore: 40,
      component: (
        <PracticeStep
          simulationComponent={<GaitCyclePractice />}
          timeLimitSeconds={60}
          minScore={40}
        />
      ),
    },
    {
      id: 'reflection',
      name: 'Reflection',
      xpReward: 20,
      component: (
        <ReflectionStep
          questions={[
            {
              id: 'gc-ref-1',
              predictionKey: 'gc-pred-1',
              question: 'Stance phase percentage',
              actualValue: '60',
              unit: '%',
              explanation: 'The stance phase consistently occupies ~60% of the gait cycle at normal walking speed (1.2 m/s). This decreases toward 50% as speed increases toward running.',
            },
            {
              id: 'gc-ref-2',
              predictionKey: 'gc-pred-2',
              question: 'Number of gait phases',
              actualValue: '6',
              unit: 'phases',
              explanation: 'The 6 phases are: Heel Strike, Foot Flat, Mid Stance, Heel Off, Toe Off, and Swing. Some texts subdivide swing into initial, mid, and terminal swing.',
            },
            {
              id: 'gc-ref-3',
              predictionKey: 'gc-pred-3',
              question: 'Both feet on ground phase',
              actualValue: 'Double Support',
              unit: '',
              explanation: 'Double support occurs twice per gait cycle: once during loading response (after heel strike) and once during pre-swing (before toe off). Total ≈ 20% of cycle.',
            },
          ]}
        />
      ),
    },
    {
      id: 'summary',
      name: 'Summary',
      xpReward: 50,
      component: (
        <SummaryStep
          experimentTitle="The Gait Cycle"
          keyFormula="Gait Cycle = Stance (60%) + Swing (40%) → 6 Phases: HS → FF → MS → HO → TO → Sw"
          keyConcept="A complete gait cycle spans one heel-strike to the next, dividing into 6 sub-phases. Stance occupies ~60% and swing ~40% at comfortable walking speed. Phase timing deviations indicate neurological or musculoskeletal pathology."
          badgeId="gait-watcher"
          moduleId="m1"
          expId="gait-cycle"
          nextExpPath="/experiment/m1/stance-swing"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m1" expId="gait-cycle" steps={steps} />;
}

export default E1GaitCycle;
