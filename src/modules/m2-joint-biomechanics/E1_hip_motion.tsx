// src/modules/m2-joint-biomechanics/E1_hip_motion.tsx
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
import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════
   Experiment 1 — Hip Joint Motion During Gait
   Click on signal to mark peak flexion/extension.
   ═══════════════════════════════════════════════════════ */

interface PeakMark {
  label: string;
  sampleIdx: number;
  value: number;
  actualIdx: number;
  actualValue: number;
  errorDeg: number;
}

/* ── Results: Click-to-mark peak flex/ext ── */

function HipMotionResults({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const [gaitData, setGaitData] = useState<GaitData | null>(null);
  const [currentSample, setCurrentSample] = useState<number>(0);
  const [marks, setMarks] = useState<PeakMark[]>([]);
  const [markMode, setMarkMode] = useState<'flexion' | 'extension' | null>('flexion');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = generateGaitData({
      height_cm: 170, weight_kg: 70, gender: 'male', age: 25,
      distance_m: 10, speed_ms: 1.2, noise: 0.1, seed: 200,
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

  // Find actual peak positions in first cycle
  const actualPeaks = useMemo(() => {
    if (!gaitData) return { flexIdx: 0, flexVal: 0, extIdx: 0, extVal: 0 };
    const hip = gaitData.signals.hipAngle;
    const cycleLen = Math.round(gaitData.params.cycleTime * gaitData.sampleRate);
    let maxVal = -Infinity, maxIdx = 0;
    let minVal = Infinity, minIdx = 0;
    for (let i = 0; i < Math.min(cycleLen, hip.length); i++) {
      if (hip[i] > maxVal) { maxVal = hip[i]; maxIdx = i; }
      if (hip[i] < minVal) { minVal = hip[i]; minIdx = i; }
    }
    return { flexIdx: maxIdx, flexVal: maxVal, extIdx: minIdx, extVal: minVal };
  }, [gaitData]);

  const handleMarkOnSignal = useCallback((): void => {
    if (!gaitData || !markMode || submitted) return;
    const hip = gaitData.signals.hipAngle;
    const val = hip[currentSample] ?? 0;
    const actual = markMode === 'flexion'
      ? { idx: actualPeaks.flexIdx, val: actualPeaks.flexVal }
      : { idx: actualPeaks.extIdx, val: actualPeaks.extVal };
    const errorDeg = Math.abs(val - actual.val);

    const mark: PeakMark = {
      label: markMode === 'flexion' ? 'Peak Flexion' : 'Peak Extension',
      sampleIdx: currentSample,
      value: parseFloat(val.toFixed(1)),
      actualIdx: actual.idx,
      actualValue: parseFloat(actual.val.toFixed(1)),
      errorDeg: parseFloat(errorDeg.toFixed(1)),
    };

    setMarks((prev) => [...prev, mark]);
    if (markMode === 'flexion') setMarkMode('extension');
    else setMarkMode(null);
  }, [gaitData, markMode, currentSample, actualPeaks, submitted]);

  const handleSubmit = useCallback((): void => {
    setSubmitted(true);
    const avgError = marks.length > 0
      ? marks.reduce((s, m) => s + m.errorDeg, 0) / marks.length
      : 40;
    const score = Math.max(0, Math.round(100 - avgError * 3));
    onComplete?.(score);
  }, [marks, onComplete]);

  const channels: SignalChannel[] = useMemo(() => {
    if (!gaitData) return [];
    return [
      { id: 'hipAngle', label: 'Hip Angle (°)', data: gaitData.signals.hipAngle, color: '#4f8cff', visible: true },
    ];
  }, [gaitData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Mode indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {markMode && (
          <div style={{
            padding: '8px 16px', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 700,
            background: markMode === 'flexion' ? '#4f8cff15' : '#ff7a4515',
            border: `1px solid ${markMode === 'flexion' ? '#4f8cff40' : '#ff7a4540'}`,
            color: markMode === 'flexion' ? '#4f8cff' : '#ff7a45',
          }}>
            🎯 Click signal to mark: {markMode === 'flexion' ? 'PEAK FLEXION (highest point)' : 'PEAK EXTENSION (lowest point)'}
          </div>
        )}
        {markMode === null && !submitted && (
          <button className="btn-primary" onClick={handleSubmit} style={{ padding: '8px 20px' }}>
            Submit Marks ✓
          </button>
        )}
      </div>

      {/* Live hip angle value */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{
          padding: '10px 16px', borderRadius: '8px', background: 'var(--card)', border: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: '0.5625rem', color: 'var(--text3)', textTransform: 'uppercase' }}>Current Hip Angle</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--mono)', color: '#4f8cff' }}>
            {gaitData ? gaitData.signals.hipAngle[currentSample]?.toFixed(1) ?? '0' : '—'}°
          </div>
        </div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--text3)' }}>
          + = Flexion | − = Extension
        </div>
      </div>

      {/* Animation */}
      <GaitCanvas gaitData={gaitData} speed={1.2} width={600} height={220} />

      {/* Signal — clickable */}
      <div ref={canvasRef} onClick={handleMarkOnSignal} style={{ cursor: markMode ? 'crosshair' : 'default' }}>
        <SignalPlot
          channels={channels}
          sampleRate={100}
          windowSeconds={3}
          currentSample={currentSample}
          height={200}
        />
      </div>

      {/* Marks display */}
      {marks.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {marks.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: '12px', borderRadius: '10px',
                background: 'var(--card)', border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: '0.6875rem', color: 'var(--accent)', fontWeight: 700, marginBottom: '6px' }}>
                {m.label}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text2)' }}>Your mark: <strong style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>{m.value}°</strong></span>
                {submitted && (
                  <span style={{ color: 'var(--teal)' }}>Actual: <strong style={{ fontFamily: 'var(--mono)' }}>{m.actualValue}°</strong></span>
                )}
              </div>
              {submitted && (
                <div style={{
                  fontSize: '0.6875rem', fontFamily: 'var(--mono)', marginTop: '4px',
                  color: m.errorDeg <= 5 ? 'var(--teal)' : m.errorDeg <= 10 ? 'var(--amber)' : 'var(--red)',
                }}>
                  Error: ±{m.errorDeg}° {m.errorDeg <= 5 ? '✓ Excellent' : m.errorDeg <= 10 ? '~ Good' : '✗ Review'}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Score */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '16px', borderRadius: '12px', textAlign: 'center',
            background: 'var(--card)', border: '1px solid var(--border)',
          }}
        >
          <div style={{
            fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--mono)',
            color: marks.every((m) => m.errorDeg <= 10) ? 'var(--teal)' : 'var(--amber)',
          }}>
            {Math.max(0, Math.round(100 - (marks.reduce((s, m) => s + m.errorDeg, 0) / marks.length) * 3))}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>
            Hip peak identification accuracy
          </div>
        </motion.div>
      )}

      {/* Reference */}
      <div style={{
        padding: '12px 16px', borderRadius: '10px', fontSize: '0.8125rem', lineHeight: 1.6,
        background: '#4f8cff10', borderLeft: '3px solid #4f8cff', color: 'var(--text2)',
      }}>
        💡 <strong>Reference:</strong> Hip angle follows a roughly sinusoidal pattern. Peak flexion (~30°) occurs near toe-off as the limb swings forward. Peak extension (~−10°) occurs during terminal stance as the body passes over the supporting foot.
      </div>
    </div>
  );
}

/* ── Practice: Faster animation ── */

function HipMotionPractice(): React.JSX.Element {
  const [speed, setSpeed] = useState<number>(1.6);
  const [gaitData, setGaitData] = useState<GaitData | null>(null);
  const [currentSample, setCurrentSample] = useState<number>(0);

  useEffect(() => {
    const data = generateGaitData({
      height_cm: 170, weight_kg: 70, gender: 'male', age: 25,
      distance_m: 15, speed_ms: speed, noise: 0.25, seed: 210,
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
      { id: 'hipAngle', label: 'Hip Angle (°)', data: gaitData.signals.hipAngle, color: '#4f8cff', visible: true },
    ];
  }, [gaitData]);

  // Random speed changes
  useEffect(() => {
    const timer = setInterval(() => {
      setSpeed(1.0 + ((Date.now() % 1000) / 1000) * 1.5);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{
        padding: '8px 14px', borderRadius: '8px', fontSize: '0.75rem', background: 'var(--amber)15',
        border: '1px solid var(--amber)30', color: 'var(--amber)',
      }}>
        ⚡ Speed: {speed.toFixed(1)} m/s (changes every 8s) — noise level 25%
      </div>
      <GaitCanvas gaitData={gaitData} speed={speed} width={600} height={200} />
      <SignalPlot channels={channels} sampleRate={100} windowSeconds={3} currentSample={currentSample} height={180} />
      <div style={{ fontSize: '0.75rem', color: 'var(--text3)', textAlign: 'center' }}>
        Current hip angle: <strong style={{ color: '#4f8cff', fontFamily: 'var(--mono)' }}>
          {gaitData ? (gaitData.signals.hipAngle[currentSample]?.toFixed(1) ?? '0') : '—'}°
        </strong>
      </div>
    </div>
  );
}

/* ── Predictions ── */

function HipPredictions({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const questions: QuizQuestion[] = [
    {
      type: 'fillin', id: 'hip-pred-1',
      question: 'What is the peak hip flexion angle (degrees) during normal gait?',
      correctAnswer: 30, tolerance: 5, unit: '°',
      formula: 'Peak hip flexion ≈ 30° occurs near toe-off/initial swing',
      hint: 'The hip reaches its maximum flexion as it swings the limb forward.',
    },
    {
      type: 'mc', id: 'hip-pred-2',
      question: 'At heel strike, is the hip in flexion, extension, neutral, or rotation?',
      options: ['Flexion', 'Extension', 'Neutral (transitioning to extension)', 'Rotation'],
      correctIndex: 2,
      explanation: 'At heel strike the hip is near neutral (~0°) and begins extending as the body advances over the stance limb.',
      hint: 'The hip has just finished its forward swing and is about to support body weight.',
    },
    {
      type: 'fillin', id: 'hip-pred-3',
      question: 'Total hip range of motion during normal walking (degrees)?',
      correctAnswer: 40, tolerance: 5, unit: '°',
      formula: 'Hip ROM ≈ 40° (from ~30° flexion to ~10° extension)',
      hint: 'ROM = peak flexion − peak extension = 30° − (−10°) = 40°.',
    },
  ];

  return (
    <div style={{ maxWidth: '640px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>🔮 Make Your Predictions</h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text3)', marginBottom: '20px' }}>
        Predict hip joint kinematics before observing the data.
      </p>
      <QuizEngine questions={questions} onComplete={(_, totalScore) => onComplete?.(totalScore)} mode="prediction" />
    </div>
  );
}

/* ── Main Experiment ── */

function E1HipMotion(): React.JSX.Element {
  const steps: StepConfig[] = [
    {
      id: 'context', name: 'Context', xpReward: 10,
      component: (
        <ContextStep
          title="Hip Joint Motion During Gait"
          body={`The hip joint is the powerhouse of human gait. Hip flexion and extension drive forward progression by controlling the pendulum-like swing of the lower limb. During walking, the hip oscillates through approximately 40° of sagittal plane motion.

Peak hip flexion of about 30° occurs near toe-off and initial swing phase, as the limb swings forward. The hip then extends through mid-stance and terminal stance, reaching approximately 10° of extension as the body passes over the supporting foot. The hip extensors (gluteus maximus, hamstrings) are the largest muscles in the body and generate approximately 40% of the total mechanical energy during gait.

The hip abductor muscles (gluteus medius) are critical for frontal plane stability — they prevent the pelvis from dropping on the swing side. This is why hip abductor weakness produces a characteristic Trendelenburg gait pattern with lateral trunk lean.`}
          statistic={{ value: '40%', label: 'of total gait energy generated by hip extensors' }}
          clinicalNote="Hip flexor weakness causes a compensatory posterior trunk lean at heel strike. Patients lean backward to passively extend the hip using gravity, a pattern called 'gluteus maximus gait.' Hip abductor weakness produces Trendelenburg sign — pelvic drop on the swing side."
        />
      ),
    },
    {
      id: 'predictions', name: 'Predictions', xpReward: 20,
      component: <HipPredictions />,
    },
    {
      id: 'materials', name: 'Materials', xpReward: 30,
      component: <MaterialsStep requiredPlacements={[{ sensorId: 'imu-thigh', zone: 'LEFT_THIGH' }]} />,
    },
    {
      id: 'protocol', name: 'Protocol', xpReward: 20,
      component: (
        <ProtocolStep steps={[
          { id: 'p1', title: 'Observe Hip Motion', description: 'Watch the stick figure animation. Focus on the thigh segment — see how it swings forward (flexion) and backward (extension) each cycle.', icon: '👁️' },
          { id: 'p2', title: 'Read the Signal', description: 'The blue line shows hip angle in degrees. Positive values = flexion, negative = extension. Identify the highest and lowest points.', icon: '📊' },
          { id: 'p3', title: 'Note the Pattern', description: 'The hip angle follows a sinusoidal pattern. One full oscillation equals one gait cycle. Peak flexion occurs near swing initiation.', icon: '🔄' },
          { id: 'p4', title: 'Mark the Peaks', description: 'In Results, click on the signal to mark peak flexion (highest point) first, then peak extension (lowest point). Accuracy determines your score.', icon: '🎯' },
        ]} />
      ),
    },
    {
      id: 'results', name: 'Results', xpReward: 100, minScore: 60,
      component: <HipMotionResults />,
    },
    {
      id: 'practice', name: 'Practice', xpReward: 50, minScore: 40,
      component: <PracticeStep simulationComponent={<HipMotionPractice />} timeLimitSeconds={60} minScore={40} />,
    },
    {
      id: 'reflection', name: 'Reflection', xpReward: 20,
      component: (
        <ReflectionStep questions={[
          { id: 'hip-ref-1', predictionKey: 'hip-pred-1', question: 'Peak hip flexion angle', actualValue: '~30', unit: '°', explanation: 'Peak hip flexion is approximately 30° and occurs during initial swing phase as the limb accelerates forward.' },
          { id: 'hip-ref-2', predictionKey: 'hip-pred-2', question: 'Hip position at heel strike', actualValue: 'Neutral→Ext', unit: '', explanation: 'At heel strike the hip is near neutral (0°) and immediately begins extending as the body advances over the stance limb.' },
          { id: 'hip-ref-3', predictionKey: 'hip-pred-3', question: 'Hip ROM during gait', actualValue: '~40', unit: '°', explanation: 'Hip ROM = peak flexion − peak extension = 30° − (−10°) = 40°. This is fairly consistent across healthy adults.' },
        ]} />
      ),
    },
    {
      id: 'summary', name: 'Summary', xpReward: 50,
      component: (
        <SummaryStep
          experimentTitle="Hip Joint Motion During Gait"
          keyFormula="Hip ROM ≈ 40° | Peak Flex ≈ 30° (swing) | Peak Ext ≈ −10° (terminal stance)"
          keyConcept="The hip oscillates sinusoidally through ~40° during gait. Hip extensors generate 40% of walking energy. Flexor weakness causes posterior trunk lean; abductor weakness causes Trendelenburg gait."
          moduleId="m2" expId="hip-motion"
          nextExpPath="/experiment/m2/knee-motion"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m2" expId="hip-motion" steps={steps} />;
}

export default E1HipMotion;
