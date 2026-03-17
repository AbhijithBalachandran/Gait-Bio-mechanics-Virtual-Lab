// src/modules/m2-joint-biomechanics/E4_angle_angle_diagrams.tsx
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
import { generateGaitData, type GaitData } from '../../engine/syntheticGait';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip);

/* ═══════════════════════════════════════════════════════
   Experiment 4 — Angle-Angle Diagrams (Cyclograms)
   Real-time cyclogram with pathology selector.
   ═══════════════════════════════════════════════════════ */

type JointPair = 'hip-knee' | 'knee-ankle' | 'hip-ankle';
type Pathology = 'normal' | 'parkinsonian' | 'hemiplegic' | 'antalgic';

const JOINT_LABELS: Record<JointPair, { x: string; y: string }> = {
  'hip-knee': { x: 'Hip Angle (°)', y: 'Knee Angle (°)' },
  'knee-ankle': { x: 'Knee Angle (°)', y: 'Ankle Angle (°)' },
  'hip-ankle': { x: 'Hip Angle (°)', y: 'Ankle Angle (°)' },
};

const SHAPE_OPTIONS = ['Circle', 'Figure-8', 'Straight Line', 'Irregular Blob'] as const;

function getJointData(gaitData: GaitData, pair: JointPair): { x: number[]; y: number[] } {
  const map: Record<JointPair, { x: number[]; y: number[] }> = {
    'hip-knee': { x: gaitData.signals.hipAngle, y: gaitData.signals.kneeAngle },
    'knee-ankle': { x: gaitData.signals.kneeAngle, y: gaitData.signals.ankleAngle },
    'hip-ankle': { x: gaitData.signals.hipAngle, y: gaitData.signals.ankleAngle },
  };
  return map[pair];
}

/* ── Results: Cyclogram with pathology classifier ── */

function CyclogramResults({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const [jointPair, setJointPair] = useState<JointPair>('hip-knee');
  const [pathology, setPathology] = useState<Pathology>('normal');
  const [classification, setClassification] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [trailIdx, setTrailIdx] = useState<number>(0);
  const [history, setHistory] = useState<{ pathology: Pathology; guess: string; correct: boolean }[]>([]);

  const gaitData: GaitData = useMemo(() => {
    return generateGaitData({
      height_cm: 170, weight_kg: 70, gender: 'male', age: 25,
      distance_m: 10, speed_ms: 1.2, noise: 0.1, seed: 500,
      pathology,
    });
  }, [pathology]);

  const jointData = useMemo(() => getJointData(gaitData, jointPair), [gaitData, jointPair]);
  const cycleLen = Math.round(gaitData.params.cycleTime * gaitData.sampleRate);

  // Animate trail
  useEffect(() => {
    const timer = setInterval(() => {
      setTrailIdx((i) => (i + 1) % cycleLen);
    }, 15);
    return () => clearInterval(timer);
  }, [cycleLen]);

  // Build scatter data for chart
  const chartData = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    const trail: { x: number; y: number }[] = [];
    const maxLen = Math.min(cycleLen, jointData.x.length, jointData.y.length);

    for (let i = 0; i < maxLen; i++) {
      points.push({ x: jointData.x[i], y: jointData.y[i] });
    }

    // Active trail (last 20 samples highlighted)
    const trailLen = 20;
    for (let j = 0; j < trailLen; j++) {
      const idx = (trailIdx - j + maxLen) % maxLen;
      if (idx >= 0 && idx < points.length) {
        trail.push(points[idx]);
      }
    }

    return {
      datasets: [
        {
          label: 'Cyclogram',
          data: points,
          borderColor: 'rgba(79, 140, 255, 0.2)',
          backgroundColor: 'rgba(79, 140, 255, 0.05)',
          pointRadius: 1,
          showLine: true,
          borderWidth: 1,
        },
        {
          label: 'Active',
          data: trail,
          borderColor: 'var(--accent)',
          backgroundColor: 'var(--accent)',
          pointRadius: 3,
          showLine: true,
          borderWidth: 2,
        },
      ],
    };
  }, [jointData, cycleLen, trailIdx]);

  const chartOptions: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    scales: {
      x: {
        title: { display: true, text: JOINT_LABELS[jointPair].x, color: 'rgba(255,255,255,0.5)' },
        ticks: { color: 'rgba(255,255,255,0.3)' },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
      y: {
        title: { display: true, text: JOINT_LABELS[jointPair].y, color: 'rgba(255,255,255,0.5)' },
        ticks: { color: 'rgba(255,255,255,0.3)' },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
    },
    plugins: {
      tooltip: { enabled: false },
    },
  }), [jointPair]);

  const correctShape = useMemo((): string => {
    if (pathology === 'normal') return 'Figure-8';
    if (pathology === 'parkinsonian') return 'Circle';
    if (pathology === 'hemiplegic') return 'Irregular Blob';
    return 'Straight Line';
  }, [pathology]);

  const handleSubmitClassification = useCallback((): void => {
    const correct = classification === correctShape;
    setHistory((prev) => [...prev, { pathology, guess: classification, correct }]);
    setSubmitted(true);
  }, [classification, correctShape, pathology]);

  const handleNextPathology = useCallback((): void => {
    setSubmitted(false);
    setClassification('');
    const order: Pathology[] = ['normal', 'parkinsonian', 'hemiplegic', 'antalgic'];
    const currentIdx = order.indexOf(pathology);
    if (currentIdx < order.length - 1) {
      setPathology(order[currentIdx + 1]);
    } else {
      const correctCount = history.filter((h) => h.correct).length + (classification === correctShape ? 1 : 0);
      const score = Math.round((correctCount / order.length) * 100);
      onComplete?.(score);
    }
  }, [pathology, history, classification, correctShape, onComplete]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text2)', fontWeight: 600 }}>
          Joint Pair:
          <select value={jointPair} onChange={(e) => setJointPair(e.target.value as JointPair)}
            style={{ marginLeft: '8px', background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px' }}>
            <option value="hip-knee">Hip – Knee</option>
            <option value="knee-ankle">Knee – Ankle</option>
            <option value="hip-ankle">Hip – Ankle</option>
          </select>
        </label>

        <div style={{
          padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
          background: pathology === 'normal' ? '#52e5a015' : '#ff525215',
          color: pathology === 'normal' ? 'var(--teal)' : 'var(--red)',
          border: `1px solid ${pathology === 'normal' ? '#52e5a040' : '#ff525240'}`,
          textTransform: 'capitalize',
        }}>
          Gait: {pathology}
        </div>
      </div>

      {/* Cyclogram chart */}
      <div style={{
        height: '320px', padding: '10px', borderRadius: '12px',
        background: 'var(--card)', border: '1px solid var(--border)',
      }}>
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Shape classification */}
      <div style={{
        padding: '14px 18px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: '0.6875rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
          🔍 Classify the cyclogram shape ({pathology} gait)
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {SHAPE_OPTIONS.map((shape) => (
            <button key={shape} onClick={() => setClassification(shape)}
              disabled={submitted}
              style={{
                padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600,
                cursor: submitted ? 'default' : 'pointer',
                background: classification === shape ? 'var(--accent)' : 'var(--bg2)',
                color: classification === shape ? '#fff' : 'var(--text2)',
                border: `1px solid ${classification === shape ? 'var(--accent)' : 'var(--border)'}`,
              }}>
              {shape}
              {submitted && shape === correctShape && ' ✓'}
              {submitted && shape === classification && shape !== correctShape && ' ✗'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          {!submitted && classification && (
            <button className="btn-primary" onClick={handleSubmitClassification} style={{ padding: '8px 18px' }}>
              Classify →
            </button>
          )}
          {submitted && (
            <button className="btn-secondary" onClick={handleNextPathology} style={{ padding: '8px 18px' }}>
              Next Pathology →
            </button>
          )}
        </div>

        {submitted && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              marginTop: '8px', fontSize: '0.75rem', fontWeight: 600,
              color: classification === correctShape ? 'var(--teal)' : 'var(--red)',
            }}>
            {classification === correctShape ? '✓ Correct!' : `✗ The correct shape is: ${correctShape}`}
          </motion.div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {history.map((h, i) => (
            <span key={i} style={{
              padding: '4px 10px', borderRadius: '6px', fontSize: '0.625rem', fontFamily: 'var(--mono)',
              background: h.correct ? '#52e5a015' : '#ff525215',
              color: h.correct ? 'var(--teal)' : 'var(--red)',
              border: `1px solid ${h.correct ? '#52e5a040' : '#ff525240'}`,
            }}>
              {h.pathology}: {h.guess} {h.correct ? '✓' : '✗'}
            </span>
          ))}
        </div>
      )}

      {/* Animation */}
      <GaitCanvas gaitData={gaitData} speed={1.2} width={600} height={180} />
    </div>
  );
}

/* ── Practice ── */

function CyclogramPractice(): React.JSX.Element {
  const [pathology, setPathology] = useState<Pathology>('normal');
  const [jointPair, setJointPair] = useState<JointPair>('hip-knee');
  const [trailIdx, setTrailIdx] = useState<number>(0);

  const gaitData = useMemo(() => generateGaitData({
    height_cm: 170, weight_kg: 70, gender: 'male', age: 25,
    distance_m: 10, speed_ms: 1.2, noise: 0.2, seed: 510, pathology,
  }), [pathology]);

  const jointData = useMemo(() => getJointData(gaitData, jointPair), [gaitData, jointPair]);
  const cycleLen = Math.round(gaitData.params.cycleTime * gaitData.sampleRate);

  useEffect(() => {
    const timer = setInterval(() => {
      setTrailIdx((i) => (i + 1) % cycleLen);
    }, 15);
    return () => clearInterval(timer);
  }, [cycleLen]);

  const chartData = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    const maxLen = Math.min(cycleLen, jointData.x.length, jointData.y.length);
    for (let i = 0; i < maxLen; i++) {
      points.push({ x: jointData.x[i], y: jointData.y[i] });
    }
    return {
      datasets: [{
        label: 'Cyclogram',
        data: points,
        borderColor: 'rgba(79,140,255,0.3)',
        pointRadius: 1,
        showLine: true,
        borderWidth: 1,
      }],
    };
  }, [jointData, cycleLen]);

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    scales: {
      x: { ticks: { color: 'rgba(255,255,255,0.3)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: 'rgba(255,255,255,0.3)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {(['normal', 'parkinsonian', 'hemiplegic', 'antalgic'] as const).map((p) => (
          <button key={p} onClick={() => setPathology(p)} style={{
            padding: '6px 12px', borderRadius: '8px', fontSize: '0.6875rem', fontWeight: 600,
            textTransform: 'capitalize', cursor: 'pointer',
            background: pathology === p ? 'var(--accent)' : 'var(--card)',
            color: pathology === p ? '#fff' : 'var(--text2)',
            border: `1px solid ${pathology === p ? 'var(--accent)' : 'var(--border)'}`,
          }}>{p}</button>
        ))}
        <select value={jointPair} onChange={(e) => setJointPair(e.target.value as JointPair)}
          style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.6875rem' }}>
          <option value="hip-knee">Hip–Knee</option>
          <option value="knee-ankle">Knee–Ankle</option>
          <option value="hip-ankle">Hip–Ankle</option>
        </select>
      </div>
      <div style={{ height: '260px', padding: '8px', borderRadius: '10px', background: 'var(--card)', border: '1px solid var(--border)' }}>
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}

/* ── Predictions ── */

function CyclogramPredictions({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const questions: QuizQuestion[] = [
    {
      type: 'mc', id: 'cyc-pred-1',
      question: 'What shape does the normal hip-knee cyclogram make?',
      options: ['Circle', 'Figure-8', 'Straight Line', 'Irregular Blob'],
      correctIndex: 1,
      explanation: 'The normal hip-knee cyclogram forms a figure-8 because the two joints have a complex, non-linear phase relationship.',
      hint: 'The hip and knee do not move in perfect phase — their relationship creates a distinctive loop.',
    },
    {
      type: 'mc', id: 'cyc-pred-2',
      question: 'A bigger cyclogram area means:',
      options: ['More efficient gait', 'Less efficient gait', 'Same efficiency', 'Faster walking'],
      correctIndex: 1,
      explanation: 'Larger cyclogram area indicates greater variability in inter-joint coordination, which correlates with less efficient, more energy-costly gait.',
      hint: 'A tight, repeatable loop means consistent coordination. A large, variable loop suggests inefficiency.',
    },
    {
      type: 'mc', id: 'cyc-pred-3',
      question: 'Which joint pair shows the tightest coordination?',
      options: ['Hip–Knee', 'Knee–Ankle', 'Hip–Ankle', 'All equal'],
      correctIndex: 1,
      explanation: 'Knee-ankle coordination is the tightest because these joints are both involved in the swing phase foot clearance mechanism and share direct mechanical coupling through the shank.',
      hint: 'These two joints are mechanically linked through the same segment (shank/tibia).',
    },
  ];

  return (
    <div style={{ maxWidth: '640px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>🔮 Make Your Predictions</h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text3)', marginBottom: '20px' }}>Predict cyclogram properties.</p>
      <QuizEngine questions={questions} onComplete={(_, totalScore) => onComplete?.(totalScore)} mode="prediction" />
    </div>
  );
}

/* ── Main Experiment ── */

function E4AngleAngleDiagrams(): React.JSX.Element {
  const steps: StepConfig[] = [
    {
      id: 'context', name: 'Context', xpReward: 10,
      component: (
        <ContextStep
          title="Angle-Angle Diagrams (Cyclograms)"
          body={`An angle-angle diagram (cyclogram) is created by plotting the angle of one joint against the angle of another joint throughout the gait cycle. Instead of plotting each joint angle against time, we plot them against each other, creating a 2D trajectory that forms a characteristic closed loop.

Normal gait produces a hip-knee cyclogram with a distinctive figure-8 shape. This shape arises because the hip and knee have a complex, non-linear phase relationship — they do not simply flex and extend together. The size and shape of the cyclogram loop encode information about coordination quality. Consistent, repeatable loops indicate well-coordinated gait; large, variable loops suggest pathological coordination.

Cyclograms are widely used in clinical gait laboratories to assess inter-joint coordination after stroke, cerebral palsy, or joint replacement. Pathological gait patterns create distinctively abnormal loop shapes that experienced clinicians can identify at a glance.`}
          statistic={{ value: 'Figure-8', label: 'characteristic shape of normal hip-knee cyclogram' }}
          clinicalNote="Post-stroke patients with hemiplegia show markedly asymmetric cyclograms: the affected side produces irregular, reduced-area loops while the unaffected side shows near-normal patterns. This asymmetry quantifies the coordination deficit."
        />
      ),
    },
    {
      id: 'predictions', name: 'Predictions', xpReward: 20,
      component: <CyclogramPredictions />,
    },
    {
      id: 'materials', name: 'Materials', xpReward: 30,
      component: (
        <MaterialsStep requiredPlacements={[
          { sensorId: 'imu-thigh', zone: 'LEFT_THIGH' },
          { sensorId: 'imu-shank', zone: 'LEFT_SHANK' },
        ]} />
      ),
    },
    {
      id: 'protocol', name: 'Protocol', xpReward: 20,
      component: (
        <ProtocolStep steps={[
          { id: 'p1', title: 'Select Joint Pair', description: 'Choose which two joints to plot against each other: Hip-Knee, Knee-Ankle, or Hip-Ankle. Start with Hip-Knee.', icon: '🔄' },
          { id: 'p2', title: 'Watch the Loop Form', description: 'Observe how the cyclogram traces out a closed loop as the animation plays. One complete gait cycle = one complete loop.', icon: '⭕' },
          { id: 'p3', title: 'Compare Pathologies', description: 'Switch between Normal, Parkinsonian, Hemiplegic, and Antalgic gait patterns. Notice how each produces a different loop shape.', icon: '🔍' },
          { id: 'p4', title: 'Classify Each Shape', description: 'For each pathology, select the shape that best describes the cyclogram: Circle, Figure-8, Straight Line, or Irregular Blob.', icon: '📝' },
        ]} />
      ),
    },
    {
      id: 'results', name: 'Results', xpReward: 100, minScore: 60,
      component: <CyclogramResults />,
    },
    {
      id: 'practice', name: 'Practice', xpReward: 50, minScore: 40,
      component: <PracticeStep simulationComponent={<CyclogramPractice />} timeLimitSeconds={60} minScore={40} />,
    },
    {
      id: 'reflection', name: 'Reflection', xpReward: 20,
      component: (
        <ReflectionStep questions={[
          { id: 'cyc-ref-1', predictionKey: 'cyc-pred-1', question: 'Normal hip-knee shape', actualValue: 'Figure-8', unit: '', explanation: 'The figure-8 arises from the knee\'s double-flexion pattern combined with the hip\'s single sinusoidal oscillation, creating two interconnected loops.' },
          { id: 'cyc-ref-2', predictionKey: 'cyc-pred-2', question: 'Bigger area meaning', actualValue: 'Less efficient', unit: '', explanation: 'Larger cyclogram area = more variability in coordination = less efficient gait. Compact, repeatable loops indicate well-coordinated, energy-efficient walking.' },
          { id: 'cyc-ref-3', predictionKey: 'cyc-pred-3', question: 'Tightest coordination pair', actualValue: 'Knee–Ankle', unit: '', explanation: 'Knee-ankle coordination is tightest because both joints share the shank segment and must work together for foot clearance during swing.' },
        ]} />
      ),
    },
    {
      id: 'summary', name: 'Summary', xpReward: 50,
      component: (
        <SummaryStep
          experimentTitle="Angle-Angle Diagrams (Cyclograms)"
          keyFormula="Cyclogram = Joint1 Angle vs Joint2 Angle | Normal: Figure-8 | Area ∝ Coordination Cost"
          keyConcept="Cyclograms reveal inter-joint coordination. Normal hip-knee plot = figure-8. Larger loops = less efficient gait. Pathological patterns produce characteristic abnormal shapes used in clinical diagnosis."
          moduleId="m2" expId="angle-angle-diagrams"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m2" expId="angle-angle-diagrams" steps={steps} />;
}

export default E4AngleAngleDiagrams;
