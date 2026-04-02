// src/modules/m7-pathological/E3_antalgic_gait.tsx
import React, { useState } from 'react';
import ExperimentShell, { StepConfig } from '../../components/ExperimentShell';
import SummaryCard from '../../components/SummaryCard';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

/* ═══════════════════════════════════════════════════════
   Step 1: Theory
   ═══════════════════════════════════════════════════════ */
function TheoryStep(): React.JSX.Element {
  return (
    <div className="prose">
      <h2>Antalgic Gait — Pain Avoidance Pattern</h2>
      <p>
        An <strong>antalgic gait</strong> develops to avoid pain while walking ("anti" = against, "algic" = pain).
      </p>
      <ul>
        <li><strong>Shorter stance time:</strong> The patient spends as little time as possible bearing weight on the painful limb.</li>
        <li><strong>Rapid offloading:</strong> The healthy leg swings through quickly to take the weight off the painful leg.</li>
        <li><strong>Reduced peak GRF:</strong> The patient avoids slamming the foot into the ground.</li>
        <li><strong>Trunk lean:</strong> The patient leans <em>away</em> or <em>towards</em> the pain depending on the joint (e.g. leaning towards an arthritic hip to reduce abductor muscle torque).</li>
      </ul>
      <p>
        <strong>Common Causes:</strong> Osteoarthritis (hip/knee), acute trauma, plantar fasciitis (foot pain).
      </p>
      <p>
        <strong>Statistic:</strong> Antalgic gait stance asymmetry typically exceeds a 20% difference between left and right sides.
      </p>
      <p>
        <strong>Clinical Note:</strong> Identifying an antalgic pattern helps clinicians localize the source of pain even before radiography.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Step 2: Interactive Lab
   ═══════════════════════════════════════════════════════ */
function AntalgicLab({ onComplete }: { onComplete: (score: number) => void }): React.JSX.Element {
  const [answers, setAnswers] = useState({ side: '', asymmetry: '', cause: '' });
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const dataStance = [600, 380]; // ms, Left vs Right
  const dataGRF = [110, 75]; // % Body Weight, Left vs Right
  // Right side is painful (shorter stance, lower GRF)
  // Asymmetry % = |600-380| / 600 approx 36%
  
  const handleSelect = (key: string, val: string) => {
    if (!submitted) setAnswers(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = () => {
    let s = 0;
    if (answers.side === 'right') s += 34;
    if (answers.asymmetry === '>20%') s += 33;
    if (answers.cause === 'hip_knee') s += 33;
    
    setScore(s);
    setSubmitted(true);
    setTimeout(() => onComplete(s), 500);
  };

  const isReady = answers.side && answers.asymmetry && answers.cause;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2>Antalgic Diagnostic Challenge</h2>
      <p>Analyze the <strong>Ground Reaction Force (Peak)</strong> and <strong>Stance Duration</strong> bar charts to answer the clinical questions.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ height: '250px', background: 'var(--bg2)', padding: '16px', borderRadius: '8px' }}>
          <Bar 
            options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { title: { display: true, text: 'Stance Duration (ms)' } } } }}
            data={{
              labels: ['Left Leg', 'Right Leg'],
              datasets: [{ data: dataStance, backgroundColor: ['#4f8cff', '#ff5252'] }]
            }}
          />
        </div>
        <div style={{ height: '250px', background: 'var(--bg2)', padding: '16px', borderRadius: '8px' }}>
          <Bar 
            options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { title: { display: true, text: 'Peak GRF (% BW)' } } } }}
            data={{
              labels: ['Left Leg', 'Right Leg'],
              datasets: [{ data: dataGRF, backgroundColor: ['#4f8cff', '#ff5252'] }]
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--card)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <div>
          <h4>1. Which side is painful?</h4>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button className={answers.side === 'left' ? 'btn-primary' : 'btn-ghost'} onClick={() => handleSelect('side', 'left')}>Left Side</button>
            <button className={answers.side === 'right' ? 'btn-primary' : 'btn-ghost'} onClick={() => handleSelect('side', 'right')}>Right Side</button>
          </div>
        </div>

        <div>
          <h4>2. What is the approximate stance asymmetry magnitude?</h4>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button className={answers.asymmetry === '<10%' ? 'btn-primary' : 'btn-ghost'} onClick={() => handleSelect('asymmetry', '<10%')}>&lt;10% (Normal)</button>
            <button className={answers.asymmetry === '>20%' ? 'btn-primary' : 'btn-ghost'} onClick={() => handleSelect('asymmetry', '>20%')}>&gt;20% (Antalgic)</button>
          </div>
        </div>

        <div>
          <h4>3. Which joint is MOST likely affected reducing GRF so heavily?</h4>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button className={answers.cause === 'toe' ? 'btn-primary' : 'btn-ghost'} onClick={() => handleSelect('cause', 'toe')}>Big Toe Blister</button>
            <button className={answers.cause === 'hip_knee' ? 'btn-primary' : 'btn-ghost'} onClick={() => handleSelect('cause', 'hip_knee')}>Hip/Knee Osteoarthritis</button>
          </div>
        </div>
      </div>

      {submitted && (
        <div style={{ padding: '16px', background: score > 90 ? '#52e5a020' : '#ff525220', borderRadius: '8px' }}>
          <strong>Score: {score}%</strong><br/>
          The right side is clearly affected (shorter stance, lower force). The asymmetry is massive (~36%), indicating a major weight-bearing joint like the hip or knee is affected to cause such drastic offloading.
        </div>
      )}

      {!submitted && <button className="btn-primary" disabled={!isReady} onClick={handleSubmit}>Submit Clinical Diagnosis</button>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════ */
export default function E3AntalgicGait(): React.JSX.Element {
  const [labScore, setLabScore] = useState(0);

  const steps: StepConfig[] = [
    {
      id: 'theory',
      name: 'Theory',
      xpReward: 50,
      component: <TheoryStep />,
    },
    {
      id: 'interactive',
      name: 'Diagnostic Challenge',
      xpReward: 150,
      component: <AntalgicLab onComplete={setLabScore} />,
    },
    {
      id: 'summary',
      name: 'Summary',
      xpReward: 50,
      component: (
        <SummaryCard
          experimentTitle="Antalgic Gait Analysis"
          keyFormula="Avoidance = ↓ Stance Time + ↓ GRF"
          keyConcept="An antalgic gait is a compensatory pattern designed to reduce time and force on a painful limb, leading to severe temporal and kinetic asymmetry."
          score={labScore || 100}
          moduleId="m7"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m7" expId="antalgic-gait" steps={steps} />;
}
