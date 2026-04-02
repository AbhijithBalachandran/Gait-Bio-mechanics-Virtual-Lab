// src/modules/m5-fsr/E4_combined_sensors.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ExperimentShell, { StepConfig } from '../../components/ExperimentShell';
import PredictionsStep, { PredictionQuestion } from '../../steps/PredictionsStep';
import SummaryCard from '../../components/SummaryCard';

/* ═══════════════════════════════════════════════════════
   Step 1: Theory
   ═══════════════════════════════════════════════════════ */
function TheoryStep(): React.JSX.Element {
  return (
    <div className="prose">
      <h2>IMU + FSR — The Complete Picture</h2>
      <p>
        <strong>IMU (Inertial Measurement Unit)</strong> detects the swing phase excellently through gyroscope rotation. However, it cannot reliably pinpoint the exact moment of heel strike or toe-off due to impact noise and signal drift.
      </p>
      <p>
        <strong>FSR (Force Sensitive Resistor)</strong> gives definitive ground contact timing (Heel Strike and Toe Off) but provides zero information about what happens during the swing phase.
      </p>
      <div style={{ padding: '16px', background: 'var(--bg2)', borderRadius: '8px', marginBottom: '16px' }}>
        <strong>Sensor Fusion:</strong>
        <p>
          Combined, they provide 100% gait cycle coverage with no ambiguity. This is the ultimate "ground truth" reference system for mobile gait analysis.
        </p>
      </div>
      <p>
        <strong>Statistic:</strong> Combined IMU+FSR accuracy is 99.2% for all gait events, significantly more robust than either alone (especially in pathological gaits).
      </p>
      <p>
        <strong>Clinical Note:</strong> This exact hybrid sensor combination is used in the Kinetrax wearable device to capture both kinematic and kinetic-proxy data.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Step 2: Predictions
   ═══════════════════════════════════════════════════════ */
const PREDICTIONS: PredictionQuestion[] = [
  {
    id: 'e4-p1',
    question: 'IMU alone can detect stance vs swing?',
    options: ['yes always', 'no', 'only with fusion', 'only at slow speeds'],
    correctIndex: 2,
    explanation: 'While IMU can estimate it, accurate and reliable delineation requires fusion or algorithms (it struggles in pathological gaits without fusion).',
    hint: 'Think about reliability in all conditions.',
  },
  {
    id: 'e4-p2',
    question: 'FSR detects swing phase?',
    options: ['yes', 'no', 'sometimes', 'only at fast speeds'],
    correctIndex: 1,
    explanation: 'FSR only detects when there is force applied (stance phase). Swing phase = 0 force, so it provides no data on leg position.',
    hint: 'Does air apply pressure to the bottom of the foot?',
  },
  {
    id: 'e4-p3',
    question: 'Combined system improves accuracy over single sensor by?',
    options: ['<1%', '5-10%', '10-20%', '>20%'],
    correctIndex: 0,
    explanation: 'Accuracy improves by <1% in normal gait, but crucially it eliminates edge cases and failures in pathological gaits.',
    hint: 'Single sensors are already very good in healthy gait (98-99%).',
  },
];

/* ═══════════════════════════════════════════════════════
   Step 3: Interactive Identification
   ═══════════════════════════════════════════════════════ */
// Simplified identification game
function EventIdentification({ onComplete }: { onComplete: (score: number) => void }): React.JSX.Element {
  const [identified, setIdentified] = useState<Record<string, boolean>>({});
  
  const events = [
    { id: 'hs_r', label: 'Heel Strike (R)' },
    { id: 'to_r', label: 'Toe Off (R)' },
    { id: 'swing_start', label: 'Swing Start' },
    { id: 'swing_end', label: 'Swing End' },
    { id: 'hs_l', label: 'Heel Strike (L)' },
    { id: 'to_l', label: 'Toe Off (L)' },
  ];

  const handleIdentify = (id: string) => {
    const newIdentified = { ...identified, [id]: true };
    setIdentified(newIdentified);
    if (Object.keys(newIdentified).length === events.length) {
      onComplete(100);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2>Identify Gait Events in Combined Data</h2>
      <p>In a real combined system (IMU + FSR), identify which sensor primarily provides each event. (Click to acknowledge the source of the event detection).</p>
      
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Venn Diagram concept */}
        <div style={{ position: 'relative', width: '300px', height: '200px', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: '20px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(79, 140, 255, 0.2)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', paddingLeft: '20px' }}>
            <strong>IMU</strong>
          </div>
          <div style={{ position: 'absolute', right: '20px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255, 169, 64, 0.2)', border: '2px solid var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '20px' }}>
            <strong>FSR</strong>
          </div>
          <div style={{ zIndex: 10, textAlign: 'center', fontWeight: 'bold' }}>Fusion</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {events.map((evt) => (
          <button
            key={evt.id}
            className={identified[evt.id] ? 'btn-primary' : 'btn-secondary'}
            onClick={() => handleIdentify(evt.id)}
            style={{ padding: '16px' }}
          >
            {identified[evt.id] ? '✅ ' : ''}{evt.label}
          </button>
        ))}
      </div>
      
      {Object.keys(identified).length === events.length && (
        <div style={{ padding: '16px', background: '#52e5a020', color: '#52e5a0', borderRadius: '8px', textAlign: 'center' }}>
          All events identified correctly based on hybrid data!
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Experiment Component
   ═══════════════════════════════════════════════════════ */
export default function E4CombinedSensors(): React.JSX.Element {
  const [interactiveScore, setInteractiveScore] = useState<number>(0);
  const [predictionsScore, setPredictionsScore] = useState<number>(0);

  const steps: StepConfig[] = [
    {
      id: 'theory',
      name: 'Theory',
      xpReward: 50,
      component: <TheoryStep />,
    },
    {
      id: 'predictions',
      name: 'Predictions',
      xpReward: 50,
      component: <PredictionsStep questions={PREDICTIONS} onComplete={setPredictionsScore} />,
    },
    {
      id: 'interactive',
      name: 'Event Identification',
      xpReward: 100,
      component: <EventIdentification onComplete={setInteractiveScore} />,
    },
    {
      id: 'summary',
      name: 'Summary',
      xpReward: 50,
      component: (
        <SummaryCard
          experimentTitle="Combined Sensor Systems"
          keyFormula="IMU (Swing) + FSR (Stance) = 100% Coverage"
          keyConcept="Combining sensors eliminates the weaknesses of each individual sensor, providing gold-standard accuracy for both stance transitions and swing kinematics."
          score={Math.round((predictionsScore + interactiveScore) / 2) || 100}
          badgeId="dual-sensor-master"
          moduleId="m5"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m5" expId="combined-sensors" steps={steps} />;
}
