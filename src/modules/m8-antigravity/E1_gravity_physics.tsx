// src/modules/m8-antigravity/E1_gravity_physics.tsx
import React, { useState } from 'react';
import ExperimentShell, { StepConfig } from '../../components/ExperimentShell';
import PredictionsStep, { PredictionQuestion } from '../../steps/PredictionsStep';
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
      <h2>Gravity and the Gait Cycle</h2>
      <p>
        Human walking is essentially an <strong>inverted pendulum</strong> mechanism. We are constantly in a state of controlled falling forward. Gravity provides the driving force that propels us down and forward after the highest point of the gait cycle (mid-stance).
      </p>
      <ul>
        <li><strong>Lower Gravity:</strong> Results in longer step lengths (the body flies further before hitting the ground) but slower cadence (the fall takes longer). This produces a characteristic "Astronaut Gait" or bounding.</li>
        <li><strong>Higher Gravity:</strong> Results in shorter, rapid steps to maintain stability and deal with increased weight.</li>
        <li><strong>Froude Number:</strong> A dimensionless number comparing inertial forces to gravitational forces, used to compare gait across species and planets. <code>Fr = v² / (g × L)</code> where v=velocity, g=gravity, L=leg length. Walking transitions to running when Fr ~ 0.5.</li>
      </ul>
      <p>
        <strong>Statistic:</strong> Apollo astronauts walked with 40% longer strides on the Moon (g=1.62m/s²) despite wearing space suits that weighed 80kg on Earth.
      </p>
      <p>
        <strong>Clinical Note:</strong> We use Anti-Gravity Treadmills (like the AlterG) to create localized lower-gravity environments. This reduces the effective body weight, diminishing ground reaction forces (GRF) and pain for rehabilitation patients.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Step 2: Predictions
   ═══════════════════════════════════════════════════════ */
const PREDICTIONS: PredictionQuestion[] = [
  {
    id: 'm8-e1-p1',
    question: 'On the Moon (g=1.62), how does step length compare to Earth?',
    options: ['Longer', 'Shorter', 'Same', 'Unpredictable'],
    correctIndex: 0,
    explanation: 'Less gravity means you fall slower after push-off, allowing you to float further and take longer strides.',
    hint: 'Think about footage of astronauts bounding on the lunar surface.',
  },
  {
    id: 'm8-e1-p2',
    question: 'On the Moon, how does cadence (steps per minute) compare to Earth?',
    options: ['Higher', 'Lower', 'Same', 'Requires running'],
    correctIndex: 1,
    explanation: 'Because each step takes longer to hit the ground (slower fall rate), cadence drops drastically.',
    hint: 'If you spend more time in the air, what happens to step frequency?',
  },
  {
    id: 'm8-e1-p3',
    question: 'If you try walking in a pure Zero-G environment, your speed is?',
    options: ['Faster', 'Slower (You can\'t walk)', 'Same as Earth', 'Dependent on Froude number'],
    correctIndex: 1,
    explanation: 'Without gravity, there is no ground reaction force to push against. You cannot execute normal walking mechanics in Zero-G.',
    hint: 'No gravity = no friction = no push-off.',
  },
];

/* ═══════════════════════════════════════════════════════
   Step 3: Interactive Gravity Lab
   ═══════════════════════════════════════════════════════ */
type Environment = { id: string; name: string; g: number; expectedLength: number; expectedCadence: number };

const ENVIRONMENTS: Environment[] = [
  { id: 'earth', name: 'Earth', g: 9.81, expectedLength: 0.72, expectedCadence: 105 },
  { id: 'mars', name: 'Mars', g: 3.71, expectedLength: 0.88, expectedCadence: 82 },
  { id: 'moon', name: 'Moon', g: 1.62, expectedLength: 1.05, expectedCadence: 65 },
  { id: 'alterg', name: '50% AlterG Treadmill', g: 4.90, expectedLength: 0.82, expectedCadence: 90 },
];

function GravityLab({ onComplete }: { onComplete: (score: number) => void }): React.JSX.Element {
  const [selectedEnvId, setSelectedEnvId] = useState<string>('earth');
  
  const env = ENVIRONMENTS.find(e => e.id === selectedEnvId) || ENVIRONMENTS[0];

  const handleSubmit = () => {
    onComplete(100);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2>Planetary Gait Simulator</h2>
      <p>Select different gravity environments to see how physics alters the fundamental parameters of human gait.</p>

      <div style={{ display: 'flex', gap: '8px' }}>
        {ENVIRONMENTS.map(e => (
          <button 
            key={e.id} 
            className={selectedEnvId === e.id ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setSelectedEnvId(e.id)}
          >
            {e.name} (g={e.g})
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '12px' }}>
          <h4>Current Environment: {env.name}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px', fontFamily: 'var(--mono)' }}>
            <div>
              <div style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>Gravity (m/s²)</div>
              <div style={{ fontSize: '1.5rem', color: 'var(--teal)' }}>{env.g.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>Step Length (m)</div>
              <div style={{ fontSize: '1.5rem', color: 'var(--accent)' }}>{env.expectedLength.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>Cadence (steps/min)</div>
              <div style={{ fontSize: '1.5rem', color: 'var(--amber)' }}>{env.expectedCadence}</div>
            </div>
          </div>
        </div>

        <div style={{ height: '250px', background: 'var(--card)', padding: '16px', borderRadius: '8px' }}>
          <Bar 
            options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, animation: { duration: 400 } }}
            data={{
              labels: ['Step Length (x100)', 'Cadence'],
              datasets: [{ 
                data: [env.expectedLength * 100, env.expectedCadence], 
                backgroundColor: ['#4f8cff', '#ff5252'] 
              }]
            }}
          />
        </div>
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
export default function E1GravityPhysics(): React.JSX.Element {
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
      name: 'Planetary Simulator',
      xpReward: 100,
      component: <GravityLab onComplete={setLabScore} />,
    },
    {
      id: 'summary',
      name: 'Summary',
      xpReward: 50,
      component: (
        <SummaryCard
          experimentTitle="Gravity and the Gait Cycle"
          keyFormula="Fr = v² / (g × L)"
          keyConcept="Gravity controls our falling mechanics. Lower gravity yields longer, slower steps—a fundamental principle used in space exploration and terrestrial rehabilitation treadmills."
          score={Math.round((predictionsScore + labScore) / 2) || 100}
          moduleId="m8"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m8" expId="gravity-physics" steps={steps} />;
}
