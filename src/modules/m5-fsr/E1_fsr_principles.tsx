// src/modules/m5-fsr/E1_fsr_principles.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ExperimentShell, { StepConfig } from '../../components/ExperimentShell';
import PredictionsStep, { PredictionQuestion } from '../../steps/PredictionsStep';
import SummaryCard from '../../components/SummaryCard';
import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

/* ═══════════════════════════════════════════════════════
   Step 1: Theory
   ═══════════════════════════════════════════════════════ */
function TheoryStep(): React.JSX.Element {
  return (
    <div className="prose">
      <h2>How FSR Sensors Work</h2>
      <p>
        A <strong>Force Sensitive Resistor (FSR)</strong> is a material whose resistance changes when a force, pressure, or mechanical stress is applied. They are very thin and act as a pressure-dependent resistor.
      </p>
      <div style={{ padding: '16px', background: 'var(--bg2)', borderRadius: '8px', marginBottom: '16px' }}>
        <strong>Circuit Principle:</strong>
        <p>
          Typically setup in a voltage divider. FSR resistance drops from ~1MΩ (no force) to ~200Ω (full force).
          <br/>
          <em>V_out = Vcc × R2 / (FSR + R2)</em>
        </p>
      </div>
      <p>
        <strong>Statistics:</strong> Cost ~$5, measure 0-100N per sensor, respond in &lt;1ms.
      </p>
      <p>
        <strong>Clinical Note:</strong> Plantar pressure measurement is critical in diabetic foot care to prevent foot ulcers by identifying high-pressure areas.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Step 2: Predictions
   ═══════════════════════════════════════════════════════ */
const PREDICTIONS: PredictionQuestion[] = [
  {
    id: 'e1-p1',
    question: 'As pressure increases, FSR resistance:',
    options: ['increases', 'decreases', 'stays same', 'oscillates'],
    correctIndex: 1,
    explanation: 'FSR resistance decreases as more force is applied, allowing more current to flow.',
    hint: 'Think about the name "Force Sensitive Resistor" and the typical trend for sensing materials.',
  },
  {
    id: 'e1-p2',
    question: 'FSR output is:',
    options: ['linear', 'non-linear', 'binary', 'digital'],
    correctIndex: 1,
    explanation: 'The force vs. resistance curve is highly non-linear, usually roughly inverse or logarithmic.',
    hint: 'Resistance drops dramatically at first, then levels off.',
  },
  {
    id: 'e1-p3',
    question: 'Normal heel pressure at heel strike?',
    options: ['50N', '100N', '200N', '500N'],
    correctIndex: 3,
    explanation: 'Peak vertical force exceeds body weight. For a 70kg person, that can be 500N+ on the heel.',
    hint: 'Ground reaction forces often exceed body weight during normal walking.',
  },
];

/* ═══════════════════════════════════════════════════════
   Step 3: Interactive FSR
   ═══════════════════════════════════════════════════════ */
function InteractiveFSR({ onComplete }: { onComplete: (score: number) => void }): React.JSX.Element {
  const [force, setForce] = useState<number>(0);
  const [holding, setHolding] = useState<boolean>(false);
  
  const vcc = 5;
  const r2 = 3300; // 3.3k ohm
  const resistance = force === 0 ? 1000000 : Math.max(200, 1000000 / (1 + force * 100));
  const vout = vcc * (r2 / (resistance + r2));

  const [calPoints, setCalPoints] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    let interval: number;
    if (holding) {
      interval = window.setInterval(() => {
        setForce((f) => Math.min(100, f + 2)); // ramp up
      }, 50);
    } else {
      interval = window.setInterval(() => {
        setForce((f) => Math.max(0, f - 5)); // release quickly
      }, 50);
    }
    return () => clearInterval(interval);
  }, [holding]);

  const recordCalibrationPoint = () => {
    if (calPoints.length >= 3) return;
    setCalPoints(prev => [...prev, { x: force, y: vout }]);
    if (calPoints.length === 2) {
      setTimeout(() => onComplete(100), 1000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2>Interactive FSR Sensor</h2>
      <p>Press and hold the sensor below to apply force. Try to record 3 calibration points at different force levels.</p>
      
      <div style={{ display: 'flex', gap: '32px' }}>
        <div style={{ flex: 1 }}>
          <motion.button
            onMouseDown={() => setHolding(true)}
            onMouseUp={() => setHolding(false)}
            onMouseLeave={() => setHolding(false)}
            onTouchStart={() => setHolding(true)}
            onTouchEnd={() => setHolding(false)}
            animate={{ scale: holding ? 0.95 : 1 }}
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: `radial-gradient(circle, var(--teal) ${force}%, var(--bg2) ${force + 10}%)`,
              border: '2px solid var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              marginBottom: '16px'
            }}
          >
            PRESS ME
          </motion.button>
          
          <button className="btn-secondary" onClick={recordCalibrationPoint} disabled={calPoints.length >= 3}>
            Record Point ({calPoints.length}/3)
          </button>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label>Force (N): {force.toFixed(1)} N</label>
            <div className="progress-bar"><div className="progress-bar__fill" style={{ width: `${force}%` }} /></div>
          </div>
          <div>
            <label>Resistance (Ω): {(resistance / 1000).toFixed(1)} kΩ</label>
            <div className="progress-bar"><div className="progress-bar__fill" style={{ width: `${Math.min(100, resistance / 10000)}%`, background: 'var(--amber)' }} /></div>
          </div>
          <div>
            <label>Voltage (V): {vout.toFixed(2)} V</label>
            <div className="progress-bar"><div className="progress-bar__fill" style={{ width: `${(vout / 5) * 100}%`, background: 'var(--teal)' }} /></div>
          </div>
        </div>
      </div>

      <div style={{ height: '240px', background: 'var(--card)', padding: '16px', borderRadius: '8px' }}>
        <Scatter
          options={{
            maintainAspectRatio: false,
            scales: {
              x: { title: { display: true, text: 'Force (N)' }, min: 0, max: 100 },
              y: { title: { display: true, text: 'Voltage (V)' }, min: 0, max: 5 }
            }
          }}
          data={{
            datasets: [
              {
                label: 'Calibration Curve',
                data: calPoints,
                backgroundColor: '#52e5a0',
                pointRadius: 6,
              }
            ]
          }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Experiment Component
   ═══════════════════════════════════════════════════════ */
export default function E1FsrPrinciples(): React.JSX.Element {
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
      name: 'Interactive FSR',
      xpReward: 100,
      component: <InteractiveFSR onComplete={setInteractiveScore} />,
    },
    {
      id: 'summary',
      name: 'Summary',
      xpReward: 50,
      component: (
        <SummaryCard
          experimentTitle="FSR Principles"
          keyFormula="V_out = Vcc × R2 / (FSR + R2)"
          keyConcept="An FSR is a non-linear sensor whose resistance decreases as applied force increases, making it ideal for detecting foot pressure."
          score={Math.round((predictionsScore + interactiveScore) / 2) || 100}
          moduleId="m5"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m5" expId="fsr-principles" steps={steps} />;
}
