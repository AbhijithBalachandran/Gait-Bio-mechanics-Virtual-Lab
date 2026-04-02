// src/modules/m6-event-detection/E4_algorithm_showdown.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ExperimentShell, { StepConfig } from '../../components/ExperimentShell';
import SummaryCard from '../../components/SummaryCard';

/* ═══════════════════════════════════════════════════════
   Step 1: Theory
   ═══════════════════════════════════════════════════════ */
function TheoryStep(): React.JSX.Element {
  return (
    <div className="prose">
      <h2>Algorithm Comparison Showdown</h2>
      <p>
        Three distinct gait event detection algorithms compared:
      </p>
      <ul>
        <li><strong>1. Threshold:</strong> Fastest (O(1)). Worst with noise + baseline drift.</li>
        <li><strong>2. Peak Detection:</strong> Most robust to noise and pathological irregularities. O(N).</li>
        <li><strong>3. Zero-Crossing:</strong> Best for highly symmetric oscillatory signals (like certain gyro axes).</li>
      </ul>
      <p>
        <strong>The Golden Rule:</strong> No single algorithm wins in all data sets. Choosing the proper algorithm depends entirely on signal quality and hardware compute constraints.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Step 2: Interactive Ranking
   ═══════════════════════════════════════════════════════ */
type Scenario = 'normal' | 'noisy' | 'fast';
const ALGORITHMS = [
  { id: 'thresh', name: 'Thresholding', desc: 'Fast, fragile to noise' },
  { id: 'peak', name: 'Peak Detection', desc: 'Robust, ignores minor ripples' },
  { id: 'zero', name: 'Zero-Crossing', desc: 'Needs zero-mean oscillatory curve' },
];

function ShowdownLab({ onComplete }: { onComplete: (score: number) => void }): React.JSX.Element {
  const [answers, setAnswers] = useState<Record<Scenario, string>>({
    normal: '', 
    noisy: '', 
    fast: ''
  });

  const [submitted, setSubmitted] = useState(false);

  // Correct mappings
  // normal gyro -> Zero-Crossing (symmetric)
  // noisy/parkinson -> Peak Detection
  // fast/realtime -> Thresholding
  const correct = {
    normal: 'zero',
    noisy: 'peak',
    fast: 'thresh'
  };

  const handleSelect = (scenario: Scenario, algoId: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [scenario]: algoId }));
  };

  const handleSubmit = () => {
    let correctCount = 0;
    if (answers.normal === correct.normal) correctCount++;
    if (answers.noisy === correct.noisy) correctCount++;
    if (answers.fast === correct.fast) correctCount++;
    
    setSubmitted(true);
    onComplete(Math.round((correctCount / 3) * 100));
  };

  const allAnswered = answers.normal && answers.noisy && answers.fast;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2>Match Algorithm to Scenario</h2>
      <p>Select the optimal algorithm for each specific context based on their mathematical strengths.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Scenario 1 */}
        <div style={{ background: 'var(--bg2)', padding: '16px', borderRadius: '8px', border: submitted && answers.normal !== correct.normal ? '1px solid var(--red)' : '1px solid var(--border)' }}>
          <h4>Scenario 1: Symmetrical Gyroscope Signal</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>Clean, oscillating around zero, predictable wave.</p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            {ALGORITHMS.map(a => (
              <button 
                key={a.id} 
                className={answers.normal === a.id ? 'btn-primary' : 'btn-ghost'}
                onClick={() => handleSelect('normal', a.id)}
                style={{ fontSize: '0.8rem', padding: '8px' }}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>

        {/* Scenario 2 */}
        <div style={{ background: 'var(--bg2)', padding: '16px', borderRadius: '8px', border: submitted && answers.noisy !== correct.noisy ? '1px solid var(--red)' : '1px solid var(--border)' }}>
          <h4>Scenario 2: Noisy Parkinsonian Gait</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>Irregular, contains tremors and false-impact spikes.</p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            {ALGORITHMS.map(a => (
              <button 
                key={a.id} 
                className={answers.noisy === a.id ? 'btn-primary' : 'btn-ghost'}
                onClick={() => handleSelect('noisy', a.id)}
                style={{ fontSize: '0.8rem', padding: '8px' }}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>

        {/* Scenario 3 */}
        <div style={{ background: 'var(--bg2)', padding: '16px', borderRadius: '8px', border: submitted && answers.fast !== correct.fast ? '1px solid var(--red)' : '1px solid var(--border)' }}>
          <h4>Scenario 3: Ultra-Low Power Wearable Device</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>Extreme battery constraints, microcontroller limits, need O(1) ops.</p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            {ALGORITHMS.map(a => (
              <button 
                key={a.id} 
                className={answers.fast === a.id ? 'btn-primary' : 'btn-ghost'}
                onClick={() => handleSelect('fast', a.id)}
                style={{ fontSize: '0.8rem', padding: '8px' }}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {submitted && (
        <div style={{ padding: '16px', background: 'var(--bg2)', borderRadius: '8px' }}>
          <strong>Feedback:</strong><br/>
          Symmetrical Gyro = Zero-Crossing.<br/>
          Tremor/Noise = Peak Detection (min dist/height saves it).<br/>
          Low Power Edge = Thresholding!
        </div>
      )}

      {!submitted && <button className="btn-primary" onClick={handleSubmit} disabled={!allAnswered}>
        Judge Algorithms
      </button>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════ */
export default function E4AlgorithmShowdown(): React.JSX.Element {
  const [labScore, setLabScore] = useState(0);

  const steps: StepConfig[] = [
    {
      id: 'theory',
      name: 'Algorithm Overviews',
      xpReward: 50,
      component: <TheoryStep />,
    },
    {
      id: 'interactive',
      name: 'Scenario Judge',
      xpReward: 100,
      component: <ShowdownLab onComplete={setLabScore} />,
    },
    {
      id: 'summary',
      name: 'Summary',
      xpReward: 50,
      component: (
        <SummaryCard
          experimentTitle="Algorithm Showdown"
          keyFormula="Context > Algorithm"
          keyConcept="Choosing the correct event detection algorithm requires balancing signal volatility, available computational bandwidth, and required latency."
          score={labScore || 100}
          badgeId="algorithm-judge"
          moduleId="m6"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m6" expId="algorithm-showdown" steps={steps} />;
}
