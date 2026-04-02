// src/modules/m6-event-detection/E3_stride_segmentation.tsx
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
      <h2>Stride Segmentation</h2>
      <p>
        Continuous signals must be divided into individual strides for analysis. A single stride is usually defined from <strong>Heel Strike to the next ipsilateral Heel Strike</strong>.
      </p>
      <p>
        By stacking and analyzing all strides together, we can compute the mean and standard deviation (SD) of the signal trace. This reveals gait variability.
      </p>
      <p>
        <strong>Coefficient of Variation (CV%):</strong> <em>(SD / Mean) × 100</em>
        <br/>
        Higher CV indicates more variability, instability, and a higher risk of falls.
      </p>
      <ul>
        <li><strong>Healthy adults:</strong> Stride time CV &lt;3%</li>
        <li><strong>Parkinson's patients:</strong> Stride time CV &gt;8%</li>
      </ul>
      <p>
        <strong>Clinical Note:</strong> Stride variability is functionally a superior predictor of future falls compared to average stride length.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Step 2: Predictions
   ═══════════════════════════════════════════════════════ */
const PREDICTIONS: PredictionQuestion[] = [
  {
    id: 'm6-e3-p1',
    question: 'A stride is typically segmented from:',
    options: ['Heel Strike to next Toe Off', 'Heel Strike to next Heel Strike (same foot)', 'Toe Off to Heel Strike', 'Mid-stance to Mid-stance'],
    correctIndex: 1,
    explanation: 'A full stride completes an entire gait cycle, returning to the exact same event on the same foot.',
    hint: 'It’s a full 100% cycle.',
  },
  {
    id: 'm6-e3-p2',
    question: 'Stride Coefficient of Variation (CV) measures:',
    options: ['Algorithm speed', 'Signal magnitude', 'Gait variability and stability', 'Sensor noise'],
    correctIndex: 2,
    explanation: 'CV normalizes the standard deviation by the mean, giving a standardized measure of variability.',
    hint: 'SD / Mean.',
  },
  {
    id: 'm6-e3-p3',
    question: 'A CV of >8% is typical in:',
    options: ['Healthy sprinters', 'Gymnasts', 'Parkinson\'s disease patients', 'Children running'],
    correctIndex: 2,
    explanation: 'Neurological conditions severely increase step-to-step variability, leading to high CV% (>8%).',
    hint: 'Think about populations with high fall risk.',
  },
];

/* ═══════════════════════════════════════════════════════
   Step 3: Interactive Segmentation
   ═══════════════════════════════════════════════════════ */
// Synthesizing 5 continuous strides. 
// We will artificially adjust the standard deviation between strides to simulate healthy vs parkinsons.
function SegmentLab({ onComplete }: { onComplete: (score: number) => void }): React.JSX.Element {
  const [variability, setVariability] = useState<number>(2); // 1 to 15 (CV roughly)
  const STRIDES = 5;
  const POINTS_PER_STRIDE = 100;

  // Generate 5 overlaid strides dynamically based on variability slider
  const overlayData = useMemo(() => {
    const data: { label: string; data: number[]; borderColor: string }[] = [];
    
    // Average pattern 
    const baseWave = Array.from({ length: POINTS_PER_STRIDE }).map((_, i) => {
      const t = i / POINTS_PER_STRIDE;
      // Typical knee angle or accel curve shape
      return Math.sin(t * Math.PI * 2) * 20 + Math.sin(t * Math.PI * 4) * 10 + 20;
    });

    for (let s = 0; s < STRIDES; s++) {
      const strideData = baseWave.map(val => {
        // apply random var scaled by slider
        const noise = (Math.random() - 0.5) * variability * 2;
        // apply phase shift noise
        return val + noise;
      });
      data.push({
        label: `Stride ${s+1}`,
        data: strideData,
        borderColor: `rgba(79, 140, 255, ${0.4 + (s/STRIDES)*0.5})`
      });
    }

    return data;
  }, [variability]);

  const classifyCV = () => {
    if (variability < 3) return { label: 'Healthy/Stable', color: 'var(--teal)' };
    if (variability < 8) return { label: 'Mild Impairment', color: 'var(--amber)' };
    return { label: 'Pathological (High Fall Risk)', color: 'var(--red)' };
  };

  const status = classifyCV();

  const handleSubmit = () => {
    // any adjustment counts as interactive participation
    onComplete(100);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2>Stride Variability Analysis</h2>
      <p>Adjust the simulated gait variability standard deviation. Observe how higher variability creates messy overlapping profiles indicating instability.</p>

      <div style={{ background: 'var(--bg2)', padding: '16px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label>Injected Variability (CV % equiv): {variability}</label>
          <span style={{ color: status.color, fontWeight: 'bold' }}>{status.label}</span>
        </div>
        <input 
          type="range" 
          min="1" max="15" 
          value={variability} 
          onChange={(e) => setVariability(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ height: '300px', background: 'var(--card)', padding: '16px', borderRadius: '8px' }}>
        <Line 
          options={{
            maintainAspectRatio: false,
            animation: false,
            plugins: { legend: { display: false } },
            scales: { y: { min: -10, max: 60, title: { display: true, text: 'Angle / Accel' } }, x: { title: { display: true, text: '% Gait Cycle' } } }
          }}
          data={{
            labels: Array.from({ length: 100 }).map((_, i) => i + '%'),
            datasets: overlayData.map(d => ({
              ...d,
              borderWidth: 1.5,
              pointRadius: 0,
              tension: 0.3
            }))
          }}
        />
      </div>

      <button className="btn-primary" onClick={handleSubmit}>
        Complete Analysis
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════ */
export default function E3StrideSegmentation(): React.JSX.Element {
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
      name: 'Overlay Lab',
      xpReward: 100,
      component: <SegmentLab onComplete={setLabScore} />,
    },
    {
      id: 'summary',
      name: 'Summary',
      xpReward: 50,
      component: (
        <SummaryCard
          experimentTitle="Stride Segmentation"
          keyFormula="CV% = (SD / Mean) × 100"
          keyConcept="Segmenting and analyzing overlaid strides quantifies stability; high variation (>8% CV) strongly predicts fall risk in populations like Parkinson's."
          score={Math.round((predictionsScore + labScore) / 2) || 100}
          moduleId="m6"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m6" expId="stride-segmentation" steps={steps} />;
}
