// src/modules/m7-pathological/E1_parkinsonian_gait.tsx
import React, { useState } from 'react';
import ExperimentShell, { StepConfig } from '../../components/ExperimentShell';
import SummaryCard from '../../components/SummaryCard';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

/* ═══════════════════════════════════════════════════════
   Step 1: Theory
   ═══════════════════════════════════════════════════════ */
function TheoryStep(): React.JSX.Element {
  return (
    <div className="prose">
      <h2>Parkinsonian Gait Analysis</h2>
      <p>
        Parkinson's disease (PD) affects the basal ganglia, leading to characteristic motor deficits.
      </p>
      <ul>
        <li><strong>Shuffling Steps:</strong> Significantly reduced stride length (often -35% vs normative).</li>
        <li><strong>Festination:</strong> Involuntarily increased cadence (faster, smaller steps to avoid falling forward).</li>
        <li><strong>Reduced Arm Swing:</strong> Often asymmetric early in the disease.</li>
        <li><strong>Forward Trunk Lean:</strong> Altered center of mass position.</li>
        <li><strong>Freezing of Gait (FoG):</strong> Sudden inability to step forward, often triggered by doorways or turning.</li>
      </ul>
      <p>
        <strong>Sensor Indicators:</strong> IMU on the foot shows reduced GyroY (pitch) amplitude, higher frequency oscillations, and asymmetric/flat foot strikes rather than clear heel-to-toe rolls.
      </p>
      <p>
        <strong>Statistic:</strong> Over 10 million people worldwide have PD. Quantitative gait analysis can detect subtly altered kinematics up to 5 years before a clinical diagnosis.
      </p>
      <p>
        <strong>Clinical Note:</strong> Step length and cadence are primary outcome measures in PD pharmacological and rehabilitation clinical trials.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Step 2: Interactive Identification
   ═══════════════════════════════════════════════════════ */

// Simulate data for healthy vs parkinson
const healthyData = Array.from({ length: 150 }).map((_, i) => {
  const t = i / 20; // 20hz
  // Healthy: clear strong peaks, low freq ( ~1Hz = 1 stride/sec )
  return Math.sin(t * Math.PI * 2) * 200 + Math.random() * 10;
});

const parkinsonData = Array.from({ length: 150 }).map((_, i) => {
  const t = i / 20; 
  // Parkinson: faster freq (~1.5Hz), much lower amplitude (shuffling), more noise/tremor
  return Math.sin(t * Math.PI * 3) * 60 + Math.random() * 25 + Math.sin(t*Math.PI*20)*10;
});

function ParkinsonLab({ onComplete }: { onComplete: (score: number) => void }): React.JSX.Element {
  const [identifiedFeatures, setIdentifiedFeatures] = useState<Record<string, boolean>>({});
  
  const features = [
    { id: 'stride', label: 'Reduced Stride Length (Lower Peak Amplitude)' },
    { id: 'cadence', label: 'Increased Cadence (More Peaks/Sec)' },
    { id: 'armswing', label: 'Reduced Arm Swing' },
    { id: 'shuffling', label: 'Shuffling Pattern (Flat Ground Contact)' },
    { id: 'asymmetry', label: 'Asymmetry / Tremor' }
  ];

  const toggleFeature = (id: string) => {
    const next = { ...identifiedFeatures, [id]: !identifiedFeatures[id] };
    setIdentifiedFeatures(next);
    
    // Automatically complete when all 5 are checked
    if (Object.keys(next).filter(k => next[k]).length === 5) {
      setTimeout(() => onComplete(100), 500);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2>Identify Parkinsonian Features</h2>
      <p>Compare the simulated healthy foot gyroscope signal (pitch) with the Parkinsonian signal. Check off all the hallmark features you observe or infer.</p>

      <div style={{ display: 'flex', gap: '16px' }}>
        {/* Signal plot */}
        <div style={{ flex: 2, height: '350px', background: 'var(--card)', padding: '16px', borderRadius: '8px' }}>
          <Line 
            options={{
              maintainAspectRatio: false,
              animation: false,
              scales: { y: { title: { display: true, text: 'Angular Velocity (°/s)' } } }
            }}
            data={{
              labels: Array.from({ length: 150 }).map((_, i) => (i/20).toFixed(1)),
              datasets: [
                {
                  label: 'Healthy Normal Gait',
                  data: healthyData,
                  borderColor: '#52e5a0',
                  borderWidth: 2,
                  pointRadius: 0
                },
                {
                  label: 'Parkinsonian Gait',
                  data: parkinsonData,
                  borderColor: '#ff5252',
                  borderWidth: 2,
                  pointRadius: 0
                }
              ]
            }}
          />
        </div>

        {/* Checklist */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4>Hallmark Features Checklist</h4>
          {features.map((f) => (
            <label 
              key={f.id} 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: identifiedFeatures[f.id] ? '#52e5a020' : 'var(--bg2)',
                border: `1px solid ${identifiedFeatures[f.id] ? '#52e5a0' : 'var(--border)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <input 
                type="checkbox" 
                checked={!!identifiedFeatures[f.id]}
                onChange={() => toggleFeature(f.id)}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '0.875rem', fontWeight: identifiedFeatures[f.id] ? 600 : 400 }}>
                {f.label}
              </span>
            </label>
          ))}
          <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text3)' }}>
            Must identify all 5 to proceed.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════ */
export default function E1ParkinsonianGait(): React.JSX.Element {
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
      name: 'Signal Analysis',
      xpReward: 150,
      component: <ParkinsonLab onComplete={setLabScore} />,
    },
    {
      id: 'summary',
      name: 'Summary',
      xpReward: 50,
      component: (
        <SummaryCard
          experimentTitle="Parkinsonian Gait Analysis"
          keyFormula="Amplitude ↓, Frequency ↑, Noise ↑"
          keyConcept="Parkinson's Disease is characterized by festination, shuffling, freezing of gait, and reduced kinematics, visible as low-amplitude high-frequency IMU signals."
          score={labScore || 100}
          badgeId="parkinsons-analyst"
          moduleId="m7"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m7" expId="parkinsonian-gait" steps={steps} />;
}
