// src/modules/m6-event-detection/E1_threshold_detection.tsx
import React, { useState, useMemo } from 'react';
import ExperimentShell, { StepConfig } from '../../components/ExperimentShell';
import PredictionsStep, { PredictionQuestion } from '../../steps/PredictionsStep';
import SummaryCard from '../../components/SummaryCard';
import { Line } from 'react-chartjs-2';

/* ═══════════════════════════════════════════════════════
   Step 1: Theory
   ═══════════════════════════════════════════════════════ */
function TheoryStep(): React.JSX.Element {
  return (
    <div className="prose">
      <h2>Threshold-Based Detection</h2>
      <p>
        The simplest algorithm for gait event detection: an event is triggered when the signal crosses a predefined value.
      </p>
      <ul>
        <li><strong>Heel strike:</strong> AccZ spike going above a threshold.</li>
        <li><strong>Toe off:</strong> FSR dropping below a threshold.</li>
      </ul>
      <p>
        <strong>Pros:</strong> Extremely fast to compute, works seamlessly in real-time.
      </p>
      <p>
        <strong>Weakness:</strong> Highly sensitive to noise. Requires manual threshold tuning which may not generalize across different walking speeds or subjects.
      </p>
      <p>
        <strong>Statistic:</strong> Computational cost is &lt;1ms per sample on a standard microcontroller.
      </p>
      <p>
        <strong>Clinical Note:</strong> Used in the Kinetrax ESP32 firmware for edge-computing real-time detection due to its O(1) computational complexity.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Step 2: Predictions
   ═══════════════════════════════════════════════════════ */
const PREDICTIONS: PredictionQuestion[] = [
  {
    id: 'm6-e1-p1',
    question: 'The main weakness of threshold-based detection is?',
    options: ['Computational cost', 'Sensitivity to noise', 'Latency', 'Implementation difficulty'],
    correctIndex: 1,
    explanation: 'Thresholds are easily fooled by noise spikes, causing false positives.',
    hint: 'What happens if a random anomaly crosses the line?',
  },
  {
    id: 'm6-e1-p2',
    question: 'Threshold algorithms require:',
    options: ['Machine learning', 'Manual tuning', 'Fourier transforms', 'Integration'],
    correctIndex: 1,
    explanation: 'A threshold must be explicitly set (manually tuned) for the specific signal characteristics.',
    hint: 'How does the algorithm know what value to look for?',
  },
  {
    id: 'm6-e1-p3',
    question: 'In real-time microcontrollers, thresholding is preferred because:',
    options: ['It is most accurate', 'It requires O(1) computation', 'It predicts the future', 'It is the only option'],
    correctIndex: 1,
    explanation: 'Checking if value > X takes a single clock cycle, making it ideal for low-power edge devices.',
    hint: 'Think about processing power constraints.',
  },
];

/* ═══════════════════════════════════════════════════════
   Step 3: Interactive Threshold Tuner
   ═══════════════════════════════════════════════════════ */
// Generate typical noisy z-accel data with spikes
const ACCEL_DATA = Array.from({ length: 100 }).map((_, i) => {
  const t = i / 20; // 20hz
  let baseLine = Math.sin(t * Math.PI) * 10;
  // spikes at t=1, t=3
  if ((t > 0.9 && t < 1.1) || (t > 2.9 && t < 3.1)) {
    baseLine += 80 * Math.exp(-Math.pow(t - Math.round(t), 2) / 0.01);
  }
  // add noise
  return baseLine + (Math.random() - 0.5) * 40;
});

function InteractiveLab({ onComplete }: { onComplete: (score: number) => void }): React.JSX.Element {
  const [threshold, setThreshold] = useState<number>(60);

  const { detectedEvents, falsePositives, trueEvents, score } = useMemo(() => {
    let detected = 0;
    let falsePositives = 0;
    const trueEvents = 2; // We injected exactly 2 real spikes

    let isHigh = false;
    ACCEL_DATA.forEach((val) => {
      if (val > threshold && !isHigh) {
        isHigh = true;
        if (val > 60) detected++;
        else falsePositives++;
      } else if (val < threshold && isHigh) {
        isHigh = false;
      }
    });

    if (detected > trueEvents) {
      falsePositives += (detected - trueEvents);
      detected = trueEvents;
    }

    const precision = detected === 0 && falsePositives === 0 ? 0 : detected / (detected + falsePositives);
    const recall = detected / trueEvents;
    // F1 score roughly
    const f1 = (precision + recall) === 0 ? 0 : 2 * (precision * recall) / (precision + recall);
    
    return { detectedEvents: detected, falsePositives, trueEvents, score: Math.round(f1 * 100) };
  }, [threshold]);

  const handleSubmit = () => {
    onComplete(score);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2>Threshold Tuning</h2>
      <p>Adjust the threshold on the Z-axis accelerometer signal to hit exactly {trueEvents} Heel Strikes while avoiding noise spikes.</p>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <input 
          type="range" 
          min="-20" max="120" 
          value={threshold} 
          onChange={(e) => setThreshold(Number(e.target.value))}
          style={{ flex: 1 }}
        />
        <span style={{ fontFamily: 'var(--mono)' }}>Threshold: {threshold}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ padding: '16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <h4>Detected Events</h4>
          <div style={{ fontSize: '1.25rem', color: detectedEvents === trueEvents ? 'var(--teal)' : 'var(--amber)' }}>
            {detectedEvents} / {trueEvents}
          </div>
        </div>
        <div style={{ padding: '16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <h4>False Positives</h4>
          <div style={{ fontSize: '1.25rem', color: falsePositives === 0 ? 'var(--teal)' : 'var(--red)' }}>
            {falsePositives}
          </div>
        </div>
      </div>

      <div style={{ height: '300px', background: 'var(--card)', padding: '16px', borderRadius: '8px' }}>
        <Line 
          options={{
            maintainAspectRatio: false,
            animation: false,
            scales: { y: { min: -40, max: 120 } },
            plugins: {
              annotation: {
                annotations: {
                  threshLine: {
                    type: 'line',
                    yMin: threshold,
                    yMax: threshold,
                    borderColor: '#ff5252',
                    borderWidth: 2,
                    borderDash: [5, 5],
                  }
                }
              }
            } as any
          }}
          data={{
            labels: ACCEL_DATA.map((_, i) => i),
            datasets: [
              {
                label: 'AccZ with Noise',
                data: ACCEL_DATA,
                borderColor: '#4f8cff',
                borderWidth: 1.5,
                pointRadius: 0
              },
              {
                label: 'Threshold',
                data: Array(ACCEL_DATA.length).fill(threshold),
                borderColor: '#ff5252',
                borderWidth: 1,
                borderDash: [5, 5],
                pointRadius: 0
              }
            ]
          }}
        />
      </div>

      <button className="btn-primary" onClick={handleSubmit}>
        Submit Setting (Score: {score}%)
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════ */
export default function E1ThresholdDetection(): React.JSX.Element {
  const [labScore, setLabScore] = useState(0);
  const [predictionsScore, setPredictionsScore] = useState(0);

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
      name: 'Lab',
      xpReward: 100,
      component: <InteractiveLab onComplete={setLabScore} />,
    },
    {
      id: 'summary',
      name: 'Summary',
      xpReward: 50,
      component: (
        <SummaryCard
          experimentTitle="Threshold-Based Detection"
          keyFormula="Event Trigger = Signal[t] > Threshold"
          keyConcept="Fast and simple, but highly vulnerable to false positives from noise if the threshold isn't perfectly tuned."
          score={Math.round((predictionsScore + labScore) / 2) || 100}
          moduleId="m6"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m6" expId="threshold-detection" steps={steps} />;
}
