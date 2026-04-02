// src/modules/m8-antigravity/E2_antigravity_rehab.tsx
import React, { useState } from 'react';
import ExperimentShell, { StepConfig } from '../../components/ExperimentShell';
import SummaryCard from '../../components/SummaryCard';

/* ═══════════════════════════════════════════════════════
   Step 1: Theory
   ═══════════════════════════════════════════════════════ */
function TheoryStep(): React.JSX.Element {
  return (
    <div className="prose">
      <h2>Anti-Gravity Treadmill in Rehabilitation</h2>
      <p>
        The AlterG Anti-Gravity Treadmill uses differential air pressure technology (developed by NASA) to comfortably reduce a patient's effective body weight down to as low as 20% of their actual weight.
      </p>
      <ul>
        <li><strong>Reduced Body Weight (BW):</strong> Leads to proportionally reduced Ground Reaction Forces (GRF).</li>
        <li><strong>Pain Mitigation:</strong> Lower GRF means severely reduced impact on damaged joints (hips, knees, ankles).</li>
        <li><strong>Earlier Ambulation:</strong> Patients can safely begin walking practice much sooner after surgery without compromising healing structures.</li>
      </ul>
      <p>
        <strong>Common Uses:</strong> Post-knee replacement, ACL reconstruction, stroke recovery, Parkinson's rehabilitation, and elite athlete active recovery.
      </p>
      <p>
        <strong>Statistic:</strong> Implementing anti-gravity training reduces overall rehabilitation time by 30-40% after major joint surgeries.
      </p>
      <p>
        <strong>Clinical Note:</strong> A standard protocol begins at roughly 50% BW and increases by 10% each week as pain thresholds improve.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Step 2: Interactive Lab
   ═══════════════════════════════════════════════════════ */
function RehabDesignLab({ onComplete }: { onComplete: (score: number) => void }): React.JSX.Element {
  const [weeks, setWeeks] = useState<{ week: number; bwLimit: number }[]>([
    { week: 1, bwLimit: 50 },
    { week: 2, bwLimit: 50 },
    { week: 3, bwLimit: 50 },
    { week: 4, bwLimit: 50 },
    { week: 5, bwLimit: 50 },
    { week: 6, bwLimit: 50 },
  ]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const updateWeek = (weekIndex: number, val: number) => {
    if (submitted) return;
    const next = [...weeks];
    next[weekIndex].bwLimit = val;
    setWeeks(next);
  };

  const handleSubmit = () => {
    // Ideal protocol: Progressive loading. e.g. 50, 60, 70, 80, 90, 100
    // Rough check for ascending progression ending at 90 or 100.
    let s = 100;
    
    // Check if it's strictly mostly ascending
    let isAscending = true;
    for (let i = 1; i < 6; i++) {
      if (weeks[i].bwLimit < weeks[i-1].bwLimit) {
        isAscending = false;
        s -= 20;
      }
    }

    if (weeks[0].bwLimit > 60) s -= 20; // started too hard
    if (weeks[5].bwLimit < 80) s -= 20; // didn't progress enough

    if (!isAscending) s -= 20;
    if (s < 0) s = 0;

    setScore(s);
    setSubmitted(true);
    setTimeout(() => onComplete(s), 500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2>Design a 6-Week Rehab Protocol</h2>
      <p>Post-ACL Reconstruction Patient. Pain threshold maxes out if Ground Reaction Force exceeds 65% BW in week 1. Progress the patient back to 100% BW over 6 weeks.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {weeks.map((w, index) => (
          <div key={w.week} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg2)', padding: '16px', borderRadius: '8px' }}>
            <div style={{ minWidth: '80px', fontWeight: 'bold' }}>Week {w.week}</div>
            <input 
              type="range" 
              min="20" max="100" step="5"
              value={w.bwLimit} 
              onChange={(e) => updateWeek(index, Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <div style={{ minWidth: '60px', textAlign: 'right', fontFamily: 'var(--mono)' }}>{w.bwLimit}% BW</div>
            
            {/* Visual Pain indicator demo */}
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: (index === 0 && w.bwLimit > 65) ? 'var(--red)' : 'var(--teal)' }} title="Pain Indicator" />
          </div>
        ))}
      </div>

      {submitted && (
        <div style={{ padding: '16px', background: score >= 80 ? '#52e5a020' : '#ff525220', borderRadius: '8px' }}>
          <strong>Protocol Score: {score}/100</strong><br/>
          {score >= 80 ? 
            '✅ Excellent! Gradual progressive load protocol designed. The patient successfully rehabilitates without exceeding their healing threshold early on.' : 
            '❌ Protocol needs refinement. Ensure you start low (≤60%) to protect the graft, and steadily progress towards 100% by week 6 without decreasing.'}
        </div>
      )}

      {!submitted && (
        <button className="btn-primary" onClick={handleSubmit}>
          Submit Clinical Protocol
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════ */
export default function E2AntigravityRehab(): React.JSX.Element {
  const [labScore, setLabScore] = useState(0);

  const steps: StepConfig[] = [
    {
      id: 'theory',
      name: 'Anti-Gravity Protocol',
      xpReward: 50,
      component: <TheoryStep />,
    },
    {
      id: 'interactive',
      name: 'Protocol Design',
      xpReward: 150,
      component: <RehabDesignLab onComplete={setLabScore} />,
    },
    {
      id: 'summary',
      name: 'Summary',
      xpReward: 50,
      component: (
        <SummaryCard
          experimentTitle="Anti-Gravity Treadmill in Rehabilitation"
          keyFormula="↓ BW = ↓ GRF = ↓ Pain"
          keyConcept="Anti-gravity systems allow for early mobilization protocols by safely reducing load during the most vulnerable post-operative healing phases."
          score={labScore || 100}
          badgeId="rehab-designer"
          moduleId="m8"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m8" expId="antigravity-rehab" steps={steps} />;
}
