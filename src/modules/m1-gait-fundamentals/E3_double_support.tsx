// src/modules/m1-gait-fundamentals/E3_double_support.tsx
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
import { GaitPhase } from '../../types/enums';
import { motion, AnimatePresence } from 'framer-motion';

/* ═══════════════════════════════════════════════════════
   Experiment 3 — Double Support Phase
   Mark DS start/end by clicking when both feet are down.
   Ground turns yellow during DS.
   ═══════════════════════════════════════════════════════ */

/* ── Results: DS marking game ── */

function DoubleSupportResults({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const [gaitData, setGaitData] = useState<GaitData | null>(null);
  const [currentPhase, setCurrentPhase] = useState<GaitPhase>(GaitPhase.HeelStrike);
  const [dsCount, setDsCount] = useState<number>(0);
  const [dsPct, setDsPct] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [marks, setMarks] = useState<{ time: number; type: 'start' | 'end' }[]>([]);
  const [showDS, setShowDS] = useState<boolean>(false);
  const [score, setScore] = useState<number | null>(null);
  const [currentSample, setCurrentSample] = useState<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const data = generateGaitData({
      height_cm: 170, weight_kg: 70, gender: 'male', age: 25,
      distance_m: 10, speed_ms: 1.2, noise: 0.15, seed: 303,
    });
    setGaitData(data);
  }, []);

  useEffect(() => {
    if (!gaitData || !isActive) return;
    const interval = setInterval(() => {
      setCurrentSample((s) => (s + 1) % gaitData.nSamples);
    }, 10);
    return () => clearInterval(interval);
  }, [gaitData, isActive]);

  // Detect DS based on FSR signals
  useEffect(() => {
    if (!gaitData) return;
    const heel = gaitData.signals.fsrHeel[currentSample] ?? 0;
    const toe = gaitData.signals.fsrToe[currentSample] ?? 0;
    const isDS = heel > 0.3 && toe > 0.3;
    setShowDS(isDS);
  }, [gaitData, currentSample]);

  const handlePhaseChange = useCallback((phase: GaitPhase): void => {
    setCurrentPhase(phase);
    // Count DS transitions
    if (phase === GaitPhase.HeelStrike || phase === GaitPhase.HeelOff) {
      setDsCount((c) => c + 1);
    }
  }, []);

  const handleMarkDS = useCallback((type: 'start' | 'end'): void => {
    if (!isActive) return;
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    setMarks((prev) => [...prev, { time: elapsed, type }]);
  }, [isActive]);

  const handleStart = useCallback((): void => {
    setIsActive(true);
    startTimeRef.current = Date.now();
    setMarks([]);
    setDsCount(0);
    setScore(null);
  }, []);

  const handleSubmit = useCallback((): void => {
    setIsActive(false);
    // Score based on: did they get ~2 DS marks per cycle?
    const startMarks = marks.filter((m) => m.type === 'start').length;
    const endMarks = marks.filter((m) => m.type === 'end').length;
    const pairs = Math.min(startMarks, endMarks);
    // Expect roughly 2 pairs per second of animation (at 1.2 m/s)
    const expected = Math.max(2, dsCount);
    const accuracy = expected > 0 ? Math.min(100, Math.round((pairs / expected) * 200)) : 0;
    setScore(accuracy);
    onComplete?.(accuracy);
  }, [marks, dsCount, onComplete]);

  const stancePct = gaitData ? gaitData.params.stanceRatio * 100 : 60;
  const doubleSupportPctCalc = Math.max(0, (stancePct - 50) * 2);

  const channels: SignalChannel[] = useMemo(() => {
    if (!gaitData) return [];
    return [
      { id: 'fsrHeel', label: 'Left Heel FSR', data: gaitData.signals.fsrHeel, color: '#4f8cff', visible: true },
      { id: 'fsrToe', label: 'Left Toe FSR', data: gaitData.signals.fsrToe, color: '#ffa940', visible: true },
      { id: 'grfV', label: 'Vertical GRF', data: gaitData.signals.grfVertical, color: '#a855f7', visible: true },
    ];
  }, [gaitData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* DS indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{
          padding: '8px 16px', borderRadius: '8px',
          background: showDS ? '#ffa94030' : 'var(--card)',
          border: `2px solid ${showDS ? '#ffa940' : 'var(--border)'}`,
          fontSize: '0.875rem', fontWeight: 700,
          color: showDS ? '#ffa940' : 'var(--text3)',
          transition: 'all 0.15s',
        }}>
          {showDS ? '⚡ DOUBLE SUPPORT' : '○ Single Support'}
        </div>

        <div style={{ fontSize: '0.75rem', fontFamily: 'var(--mono)', color: 'var(--text2)' }}>
          DS% ≈ {doubleSupportPctCalc.toFixed(1)}% | DS events: {dsCount}
        </div>

        {!isActive && score === null && (
          <button className="btn-primary" onClick={handleStart}
            style={{ marginLeft: 'auto', padding: '8px 20px' }}>
            ▶ Start DS Marking
          </button>
        )}
      </div>

      {/* Animation with ground highlight */}
      <div style={{ position: 'relative' }}>
        <GaitCanvas gaitData={gaitData} speed={1.2} onPhaseChange={handlePhaseChange} />
        {/* Yellow ground overlay during DS */}
        {showDS && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '40px',
              background: 'linear-gradient(transparent, rgba(255, 169, 64, 0.2))',
              borderRadius: '0 0 12px 12px',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {/* Mark buttons */}
      {isActive && (
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => handleMarkDS('start')}
            style={{
              padding: '12px 24px', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 700,
              background: '#ffa94020', border: '2px solid #ffa940', color: '#ffa940', cursor: 'pointer',
            }}
          >
            🟡 Mark DS Start
          </button>
          <button
            onClick={() => handleMarkDS('end')}
            style={{
              padding: '12px 24px', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 700,
              background: '#4f8cff20', border: '2px solid #4f8cff', color: '#4f8cff', cursor: 'pointer',
            }}
          >
            🔵 Mark DS End
          </button>
          <button className="btn-primary" onClick={handleSubmit} style={{ padding: '12px 24px' }}>
            ✓ Submit
          </button>
        </div>
      )}

      {/* Marks log */}
      {marks.length > 0 && (
        <div style={{
          display: 'flex', gap: '4px', flexWrap: 'wrap', fontSize: '0.625rem',
          fontFamily: 'var(--mono)', color: 'var(--text3)',
        }}>
          {marks.map((m, i) => (
            <span key={i} style={{
              padding: '2px 6px', borderRadius: '4px',
              background: m.type === 'start' ? '#ffa94015' : '#4f8cff15',
              color: m.type === 'start' ? '#ffa940' : '#4f8cff',
            }}>
              {m.type === 'start' ? '▶' : '■'} {m.time.toFixed(1)}s
            </span>
          ))}
        </div>
      )}

      {/* Score */}
      {score !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            padding: '16px', borderRadius: '12px', textAlign: 'center',
            background: 'var(--card)', border: `1px solid ${score >= 60 ? 'var(--teal)' : 'var(--red)'}30`,
          }}
        >
          <div style={{
            fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--mono)',
            color: score >= 60 ? 'var(--teal)' : 'var(--red)',
          }}>
            {score}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>
            You marked {marks.filter((m) => m.type === 'start').length} DS starts and {marks.filter((m) => m.type === 'end').length} DS ends
          </div>
        </motion.div>
      )}

      {/* FSR signals */}
      <SignalPlot
        channels={channels}
        sampleRate={100}
        windowSeconds={3}
        currentSample={currentSample}
        height={180}
      />

      {/* Key */}
      <div style={{
        padding: '12px 16px', borderRadius: '10px', fontSize: '0.8125rem', lineHeight: 1.6,
        background: '#ffa94010', borderLeft: '3px solid var(--amber)', color: 'var(--text2)',
      }}>
        💡 <strong>Key:</strong> Double support = both FSR signals (heel + toe) above threshold simultaneously.
        It occurs at loading response (initial contact) and pre-swing (terminal stance).
        Total DS ≈ {doubleSupportPctCalc.toFixed(0)}% of cycle.
      </div>
    </div>
  );
}

/* ── Practice: Variable speed DS marking ── */

function DoubleSupportPractice(): React.JSX.Element {
  const [speed, setSpeed] = useState<number>(1.2);
  const [gaitData, setGaitData] = useState<GaitData | null>(null);
  const [showDS, setShowDS] = useState<boolean>(false);
  const [currentSample, setCurrentSample] = useState<number>(0);

  useEffect(() => {
    const data = generateGaitData({
      height_cm: 170, weight_kg: 70, gender: 'male', age: 25,
      distance_m: 20, speed_ms: speed, noise: 0.25, seed: 404,
    });
    setGaitData(data);
  }, [speed]);

  useEffect(() => {
    if (!gaitData) return;
    const timer = setInterval(() => {
      setCurrentSample((s) => {
        const next = (s + 1) % gaitData.nSamples;
        const heel = gaitData.signals.fsrHeel[next] ?? 0;
        const toe = gaitData.signals.fsrToe[next] ?? 0;
        setShowDS(heel > 0.3 && toe > 0.3);
        return next;
      });
    }, 10);
    return () => clearInterval(timer);
  }, [gaitData]);

  // Random speed changes
  useEffect(() => {
    const timer = setInterval(() => {
      setSpeed(0.8 + Math.floor(((Date.now() * 7) % 1000) / 100) * 0.15);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{
        padding: '8px 14px', borderRadius: '8px',
        background: showDS ? '#ffa94030' : 'var(--bg2)',
        border: `1px solid ${showDS ? '#ffa940' : 'var(--border)'}`,
        fontSize: '0.875rem', fontWeight: 700,
        color: showDS ? '#ffa940' : 'var(--text3)',
        textAlign: 'center', transition: 'all 0.1s',
      }}>
        {showDS ? '⚡ DOUBLE SUPPORT — CLICK NOW!' : '○ Waiting for double support...'}
        <div style={{ fontSize: '0.6875rem', fontWeight: 400, marginTop: '2px' }}>
          Speed: {speed.toFixed(1)} m/s (changes every 8s)
        </div>
      </div>
      <GaitCanvas gaitData={gaitData} speed={speed} width={600} height={220} />
    </div>
  );
}

/* ── Predictions ── */

function DoubleSupportPredictions({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const questions: QuizQuestion[] = [
    {
      type: 'fillin',
      id: 'ds-pred-1',
      question: 'Double support occurs how many times per gait cycle?',
      correctAnswer: 2,
      tolerance: 0,
      unit: 'times',
      formula: 'DS occurs at: (1) loading response and (2) pre-swing = 2 times per cycle',
      hint: 'It happens once at the beginning of stance and once at the end.',
    },
    {
      type: 'fillin',
      id: 'ds-pred-2',
      question: 'What percentage of the gait cycle is spent in double support?',
      correctAnswer: 20,
      tolerance: 5,
      unit: '%',
      formula: 'DS% = 2 × (Stance% − 50%) ≈ 2 × 10% = 20%',
      hint: 'Each double support period is about 10% of the cycle, and there are two.',
    },
    {
      type: 'mc',
      id: 'ds-pred-3',
      question: 'Does double support time increase or decrease with age?',
      options: ['Decrease', 'Stay the same', 'Increase', 'Disappear'],
      correctIndex: 2,
      explanation: 'Elderly adults increase double support time as a compensatory strategy for reduced balance.',
      hint: 'Older adults prioritize stability over speed.',
    },
  ];

  return (
    <div style={{ maxWidth: '640px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>🔮 Make Your Predictions</h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text3)', marginBottom: '20px' }}>
        Predict the characteristics of the double support phase.
      </p>
      <QuizEngine questions={questions} onComplete={(_, totalScore) => onComplete?.(totalScore)} mode="prediction" />
    </div>
  );
}

/* ── Main Experiment ── */

function E3DoubleSupport(): React.JSX.Element {
  const steps: StepConfig[] = [
    {
      id: 'context',
      name: 'Context',
      xpReward: 10,
      component: (
        <ContextStep
          title="Double Support Phase"
          body={`Double support is the period during walking when both feet are simultaneously in contact with the ground. It is the defining characteristic that distinguishes walking from running — running has flight phases where neither foot touches the ground.

Double support occurs TWICE per gait cycle: first during initial contact (loading response, when the leading foot strikes while the trailing foot is still on the ground) and second during pre-swing (terminal stance, when the trailing foot pushes off while the leading foot has already made contact). Each period lasts approximately 10% of the gait cycle, totaling about 20% in double support.

This parameter is exquisitely sensitive to speed: at slow walking it can exceed 30%, while at the walk-run transition (~3 m/s) it approaches zero. It completely disappears during running, replaced by flight phases. Double support is also one of the most clinically relevant gait parameters for assessing fall risk and balance.`}
          statistic={{ value: '~20%', label: 'of gait cycle in double support — disappears during running' }}
          clinicalNote="Elderly adults spend significantly more time in double support (up to 30%) compared to young adults (~20%). This compensatory increase in base-of-support time is a reliable predictor of fall risk and is used in clinical gait assessments."
        />
      ),
    },
    {
      id: 'predictions',
      name: 'Predictions',
      xpReward: 20,
      component: <DoubleSupportPredictions />,
    },
    {
      id: 'materials',
      name: 'Materials',
      xpReward: 30,
      component: (
        <MaterialsStep
          requiredPlacements={[
            { sensorId: 'imu-foot', zone: 'LEFT_FOOT' },
            { sensorId: 'fsr-heel', zone: 'R_HEEL' },
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
            { id: 'p1', title: 'Watch Both Feet', description: 'Observe the animation carefully. Focus on the moments when BOTH feet are touching the ground simultaneously.', icon: '👣' },
            { id: 'p2', title: 'Notice Yellow Ground', description: 'The ground indicator turns yellow during double support periods. Count how many times it flashes yellow per gait cycle.', icon: '🟡' },
            { id: 'p3', title: 'Watch the FSR Signals', description: 'Both heel and toe FSR signals should show positive values during double support. The overlap zone is the DS period.', icon: '📊' },
            { id: 'p4', title: 'Mark DS Phases', description: 'Click "Mark DS Start" when you see double support begin and "Mark DS End" when it finishes. Your timing determines your score.', icon: '🎯' },
          ]}
        />
      ),
    },
    {
      id: 'results',
      name: 'Results',
      xpReward: 100,
      minScore: 60,
      component: <DoubleSupportResults />,
    },
    {
      id: 'practice',
      name: 'Practice',
      xpReward: 50,
      minScore: 40,
      component: (
        <PracticeStep
          simulationComponent={<DoubleSupportPractice />}
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
              id: 'ds-ref-1',
              predictionKey: 'ds-pred-1',
              question: 'DS occurrences per cycle',
              actualValue: '2',
              unit: 'times',
              explanation: 'Double support occurs twice per cycle: at loading response (initial contact) and at pre-swing (terminal stance). This is consistent across all walking speeds.',
            },
            {
              id: 'ds-ref-2',
              predictionKey: 'ds-pred-2',
              question: 'DS percentage of cycle',
              actualValue: '20',
              unit: '%',
              explanation: 'At 1.2 m/s, each DS period ≈ 10% of cycle. Two periods = 20% total. Formula: DS% = 2 × (Stance% − 50%) ≈ 2 × 10% = 20%.',
            },
            {
              id: 'ds-ref-3',
              predictionKey: 'ds-pred-3',
              question: 'DS change with age',
              actualValue: 'Increases',
              unit: '',
              explanation: 'DS time increases with age from ~20% to ~30%. This is a balance compensation — more time with both feet on the ground provides greater stability.',
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
          experimentTitle="Double Support Phase"
          keyFormula="DS occurs 2× per cycle | DS% = 2 × (Stance% − 50%) ≈ 20% | DS → 0 at running"
          keyConcept="Double support is the hallmark of walking vs running. It occurs twice per cycle (~10% each), totaling ~20%. It increases with age for stability and disappears during running."
          moduleId="m1"
          expId="double-support"
          nextExpPath="/experiment/m1/spatiotemporal-params"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m1" expId="double-support" steps={steps} />;
}

export default E3DoubleSupport;
