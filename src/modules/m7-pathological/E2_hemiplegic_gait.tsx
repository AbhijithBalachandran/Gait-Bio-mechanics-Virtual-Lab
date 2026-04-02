// src/modules/m7-pathological/E2_hemiplegic_gait.tsx
import React, { useState } from 'react';
import ExperimentShell, { StepConfig } from '../../components/ExperimentShell';
import SummaryCard from '../../components/SummaryCard';

/* ═══════════════════════════════════════════════════════
   Step 1: Theory
   ═══════════════════════════════════════════════════════ */
function TheoryStep(): React.JSX.Element {
  return (
    <div className="prose">
      <h2>Hemiplegic Gait — Stroke Survivor Analysis</h2>
      <p>
        Stroke often causes unilateral (one-sided) weakness known as <strong>hemiplegia</strong> or hemiparesis.
      </p>
      <p><strong>Hallmark Signs:</strong></p>
      <ul>
        <li><strong>Circumduction:</strong> Swinging the affected leg out in a semi-circle to clear the ground due to drop-foot or stiff knee.</li>
        <li><strong>Asymmetry:</strong> Radically different stance and swing times between the affected and unaffected leg.</li>
        <li><strong>Reduced Push-off:</strong> The affected side generates much less propulsive force.</li>
      </ul>
      <div style={{ padding: '16px', background: 'var(--bg2)', borderRadius: '8px', marginBottom: '16px' }}>
        <strong>Symmetry Index (SI):</strong>
        <p>Quantifies asymmetry using a standard formula:</p>
        <p><code>SI = |(Left - Right)| / (0.5 × (Left + Right)) × 100%</code></p>
        <p><em>Interpretation:</em> Normal &lt; 10%. Clinically significant abnormality &gt; 10%.</p>
      </div>
      <p>
        <strong>Statistic:</strong> 80% of stroke survivors regain walking ability, but 50% suffer from permanent gait abnormalities.
      </p>
      <p>
        <strong>Clinical Note:</strong> Tracking the Symmetry Index over time is a primary method for measuring rehabilitation progress.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Step 2: Interactive Lab
   ═══════════════════════════════════════════════════════ */
function HemiplegicLab({ onComplete }: { onComplete: (score: number) => void }): React.JSX.Element {
  const [userSI, setUserSI] = useState<string>('');
  const [affectedSide, setAffectedSide] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Patient Data
  const tStanceLeft = 0.85; // healthy
  const tStanceRight = 0.50; // affected (shorter stance time)
  
  const trueSI = Math.abs(tStanceLeft - tStanceRight) / (0.5 * (tStanceLeft + tStanceRight)) * 100;
  // trueSI = |0.35| / (0.5 * 1.35) * 100 = 0.35 / 0.675 * 100 = 51.85%

  const handleSubmit = () => {
    let s = 0;
    if (affectedSide === 'right') s += 50;
    const numericSI = parseFloat(userSI);
    if (!isNaN(numericSI) && Math.abs(numericSI - trueSI) < 5) {
      s += 50;
    }
    setScore(s);
    setSubmitted(true);
    setTimeout(() => onComplete(s), 500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2>Symmetry Index Calculation</h2>
      <p>A stroke patient underwent sensor-based gait analysis. The system output the average ground stance time for each leg.</p>
      
      <div style={{ padding: '20px', background: 'var(--bg2)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-around' }}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--teal)' }}>LEFT LEG</h3>
          <p>Mean Stance Time: <strong>{tStanceLeft.toFixed(2)}s</strong></p>
        </div>
        <div style={{ width: '1px', background: 'var(--border)' }}></div>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--amber)' }}>RIGHT LEG</h3>
          <p>Mean Stance Time: <strong>{tStanceRight.toFixed(2)}s</strong></p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ background: 'var(--card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h4 style={{ marginBottom: '12px' }}>1. Which side is affected?</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: '16px' }}>
            Hint: The affected weak leg cannot support body weight for long.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className={affectedSide === 'left' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => !submitted && setAffectedSide('left')}
              disabled={submitted}
            >
              Left Side
            </button>
            <button 
              className={affectedSide === 'right' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => !submitted && setAffectedSide('right')}
              disabled={submitted}
            >
              Right Side
            </button>
          </div>
        </div>

        <div style={{ background: 'var(--card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h4 style={{ marginBottom: '12px' }}>2. Calculate Symmetry Index (SI%)</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: '16px' }}>
            SI = |(Left - Right)| / (0.5 × (Left + Right)) × 100
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="number" 
              value={userSI} 
              onChange={(e) => !submitted && setUserSI(e.target.value)}
              placeholder="e.g. 15.5"
              disabled={submitted}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)' }}
            />
            <span>%</span>
          </div>
        </div>
      </div>

      {submitted && (
        <div style={{ padding: '16px', background: score === 100 ? '#52e5a020' : '#ff525220', borderRadius: '8px' }}>
          <strong>Score: {score}%</strong><br/>
          {affectedSide === 'right' ? '✅ Right side is affected (shorter stance time).' : '❌ Right side is affected (it bears weight for less time).'}<br/>
          {Math.abs(parseFloat(userSI) - trueSI) < 5 ? 
            `✅ SI roughly ${trueSI.toFixed(1)}%. It is >>10%, indicating severe hemiplegia.` : 
            `❌ The correct SI is ${trueSI.toFixed(1)}%. Formula: |0.85 - 0.50| / (0.5 * 1.35) * 100.`}
        </div>
      )}

      {!submitted && (
        <button className="btn-primary" onClick={handleSubmit} disabled={!affectedSide || !userSI}>
          Submit Diagnosis
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════ */
export default function E2HemiplegicGait(): React.JSX.Element {
  const [labScore, setLabScore] = useState(0);

  const steps: StepConfig[] = [
    {
      id: 'theory',
      name: 'Theory',
      xpReward: 50,
      component: <TheoryStep />,
    },
    {
      id: 'lab',
      name: 'Symmetry Analysis',
      xpReward: 150,
      component: <HemiplegicLab onComplete={setLabScore} />,
    },
    {
      id: 'summary',
      name: 'Summary',
      xpReward: 50,
      component: (
        <SummaryCard
          experimentTitle="Hemiplegic Gait Analysis"
          keyFormula="SI = |L-R| / (0.5×(L+R)) × 100%"
          keyConcept="Hemiplegic stroke survivors exhibit high asymmetry (SI > 10%) due to unilateral weakness, manifesting as drastically reduced stance time on the affected side."
          score={labScore || 100}
          moduleId="m7"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m7" expId="hemiplegic-gait" steps={steps} />;
}
