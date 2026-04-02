// src/modules/m6-event-detection/E2_peak_detection.tsx
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
      <h2>Peak Detection Algorithm</h2>
      <p>
        Instead of a static threshold, peak detection searches for local maxima or minima in the signal.
      </p>
      <ul>
        <li><strong>Positive Peaks:</strong> Sharp impacts like heel strike.</li>
        <li><strong>Negative Peaks (Valleys):</strong> Phenomena like mid-stance minimums.</li>
      </ul>
      <p>
        <strong>Key Parameters:</strong>
      </p>
      <ul>
        <li><code>MinPeakHeight</code>: Ignores tiny bumps that aren't actual events.</li>
        <li><code>MinPeakDistance</code>: Minimum time gap allowed between peaks (prevents double-detection on a split peak).</li>
      </ul>
      <p>
        <strong>Robustness:</strong> More robust than basic thresholding for noisy signals because it evaluates neighborhood context, not just absolute height.
      </p>
      <p>
        <strong>Statistic:</strong> With optimal parameters, peak detection reaches 98.5% accuracy on clean inertial signals in healthy populations.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Step 2: Predictions
   ═══════════════════════════════════════════════════════ */
const PREDICTIONS: PredictionQuestion[] = [
  {
    id: 'm6-e2-p1',
    question: 'MinPeakDistance is used primarily to prevent?',
    options: ['Missed events', 'Double-detection of the same event', 'Algorithm crashing', 'Baseline drift'],
    correctIndex: 1,
    explanation: 'A single heel strike might generate a noisy double-peak; a minimum distance threshold forces the algorithm to merge them into one event.',
    hint: 'What happens if a peak is jagged?',
  },
  {
    id: 'm6-e2-p2',
    question: 'MinPeakHeight helps to?',
    options: ['Ignore small noise anomalies', 'Increase processing speed', 'Detect smaller strides', 'Calibrate the sensor'],
    correctIndex: 0,
    explanation: 'It ensures that only structurally significant peaks are considered, ignoring small noise ripples.',
    hint: 'Why ignore small bumps?',
  },
  {
    id: 'm6-e2-p3',
    question: 'Can peak detection find valleys?',
    options: ['No', 'Yes, by inverting the signal (detecting local minima)', 'Only on X-axis', 'Only if above threshold'],
    correctIndex: 1,
    explanation: 'Finding minimums is mathematically identical to finding maximums of an inverted signal.',
    hint: 'Think mathematically.',
  },
];

/* ═══════════════════════════════════════════════════════
   Step 3: Interactive Peak Tuner
   ═══════════════════════════════════════════════════════ */
// Generate a somewhat irregular signal with major and minor peaks
const DATA_LEN = 150;
const SIGNAL = Array.from({ length: DATA_LEN }).map((_, i) => {
  const t = i / 20; // 20hz
  let val = Math.sin(t * 1.5 * Math.PI) * 20; // slow wave
  
  // strong peaks (stride events)
  [1.5, 3.5, 5.5].forEach(p => {
    val += 60 * Math.exp(-Math.pow(t - p, 2) / 0.05); // main peak
    val += 30 * Math.exp(-Math.pow(t - p - 0.15, 2) / 0.02); // secondary jagged bounce (should be ignored by distance)
  });
  
  // random noise bumps (should be ignored by height)
  if (i === 40) val += 25;
  if (i === 110) val += 20;
  
  return val + (Math.random() - 0.5) * 10;
});

function PeakLab({ onComplete }: { onComplete: (score: number) => void }): React.JSX.Element {
  const [minHeight, setMinHeight] = useState<number>(30);
  const [minDist, setMinDist] = useState<number>(5); // samples

  const { peaks, score, exactMatch } = useMemo(() => {
    const foundPeaks: number[] = [];
    
    // Simple naive peak detection
    for (let i = 1; i < DATA_LEN - 1; i++) {
      if (SIGNAL[i] > minHeight && SIGNAL[i] > SIGNAL[i-1] && SIGNAL[i] > SIGNAL[i+1]) {
        // Evaluate distance constraint backwards
        if (foundPeaks.length === 0 || (i - foundPeaks[foundPeaks.length - 1] >= minDist)) {
          foundPeaks.push(i);
        } else {
          // If too close, keep the higher one
          const lastPeakIdx = foundPeaks[foundPeaks.length - 1];
          if (SIGNAL[i] > SIGNAL[lastPeakIdx]) {
            foundPeaks[foundPeaks.length - 1] = i;
          }
        }
      }
    }
    
    // Goal: exactly 3 main events. 
    // If they find 3, and only 3, 100%. Otherwise penalized.
    const trueCount = 3;
    let s = 100 - Math.abs(foundPeaks.length - trueCount) * 25;
    if (s < 0) s = 0;

    return { 
      peaks: foundPeaks, 
      score: s, 
      exactMatch: foundPeaks.length === 3 
    };
  }, [minHeight, minDist]);

  const handleSubmit = () => {
    onComplete(score);
  };

  const pointColors = SIGNAL.map((_, i) => peaks.includes(i) ? '#ff5252' : 'transparent');
  const pointRadii = SIGNAL.map((_, i) => peaks.includes(i) ? 6 : 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2>Peak Detection Parameters</h2>
      <p>Adjust the parameters to detect exactly 3 true heel-strike events (the 3 main big clusters). Prevent double-detection and noise-detection.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ background: 'var(--bg2)', padding: '16px', borderRadius: '8px' }}>
          <label>MinPeakHeight: {minHeight}</label>
          <input 
            type="range" 
            min="0" max="80" 
            value={minHeight} 
            onChange={(e) => setMinHeight(Number(e.target.value))}
            style={{ width: '100%', marginTop: '8px' }}
          />
        </div>
        <div style={{ background: 'var(--bg2)', padding: '16px', borderRadius: '8px' }}>
          <label>MinPeakDistance: {minDist} samples</label>
          <input 
            type="range" 
            min="1" max="50" 
            value={minDist} 
            onChange={(e) => setMinDist(Number(e.target.value))}
            style={{ width: '100%', marginTop: '8px' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span>Peaks Detected: <strong>{peaks.length}</strong></span>
        {exactMatch ? (
          <span style={{ color: 'var(--teal)', fontWeight: 'bold' }}>✓ Perfect! Exact 3 strides.</span>
        ) : (
          <span style={{ color: 'var(--amber)' }}>Target: 3 strides</span>
        )}
      </div>

      <div style={{ height: '300px', background: 'var(--card)', padding: '16px', borderRadius: '8px' }}>
        <Line 
          options={{
            maintainAspectRatio: false,
            animation: false,
            plugins: { legend: { display: false } },
            scales: { y: { min: -20, max: 100 } }
          }}
          data={{
            labels: SIGNAL.map((_, i) => i),
            datasets: [
              {
                label: 'Signal',
                data: SIGNAL,
                borderColor: '#4f8cff',
                borderWidth: 2,
                pointBackgroundColor: pointColors,
                pointBorderColor: pointColors,
                pointRadius: pointRadii,
                pointHoverRadius: 8
              }
            ]
          }}
        />
      </div>

      <button className="btn-primary" onClick={handleSubmit}>
        Submit Peak Detector (Score: {score}%)
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════ */
export default function E2PeakDetection(): React.JSX.Element {
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
      name: 'Peak Tuning',
      xpReward: 100,
      component: <PeakLab onComplete={setLabScore} />,
    },
    {
      id: 'summary',
      name: 'Summary',
      xpReward: 50,
      component: (
        <SummaryCard
          experimentTitle="Peak Detection Algorithm"
          keyFormula="Local Max + Distance Rules"
          keyConcept="Peak detection uses local height and distance constraints to isolate genuine gait cycle events from noise artifacts."
          score={Math.round((predictionsScore + labScore) / 2) || 100}
          moduleId="m6"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m6" expId="peak-detection" steps={steps} />;
}
