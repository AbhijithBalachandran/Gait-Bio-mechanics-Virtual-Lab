// src/modules/m7-pathological/E4_mystery_gait.tsx
import React, { useState, useEffect } from 'react';
import ExperimentShell, { StepConfig } from '../../components/ExperimentShell';
import SummaryCard from '../../components/SummaryCard';

/* ═══════════════════════════════════════════════════════
   Theory Check
   ═══════════════════════════════════════════════════════ */
function TheoryStep(): React.JSX.Element {
  return (
    <div className="prose">
      <h2>Diagnose the Mystery Gait</h2>
      <p>
        As a clinical gait analyst, you will often receive raw sensor data without knowing the patient's condition. Your job is to extract the diagnosis from the signal morphology alone.
      </p>
      <h3>The 4 Potential Diagnoses:</h3>
      <ul>
        <li><strong>Normal:</strong> Symmetric (SI &lt; 5%), normal amplitude, regular rhythm (CV &lt; 3%).</li>
        <li><strong>Parkinsonian:</strong> Reduced amplitude (shuffling), high frequency (cadence), tremor noise, high stride variability (&gt;8%).</li>
        <li><strong>Hemiplegic (Stroke):</strong> Severe asymmetry (SI &gt; 15%), intact amplitude on one side, dragged/altered phase on the other.</li>
        <li><strong>Antalgic (Pain):</strong> High asymmetry in stance time and GRF, rapid swing on unaffected side to offload the painful side.</li>
      </ul>
      <p>
        <strong>Statistic:</strong> Expert gait analysts achieve ~89% diagnostic accuracy from blind signals alone. 
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Interactive Lab
   ═══════════════════════════════════════════════════════ */
type Pathology = 'normal' | 'parkinson' | 'hemiplegic' | 'antalgic';

const SCENARIOS = [
  {
    trueDiagnosis: 'parkinson' as Pathology,
    data: { si: '4.2%', cv: '12.5%', amp: 'Low', cadence: '135 steps/min' },
    features: ['Low Amplitude', 'High Stride Variability (CV)', 'Increased Cadence']
  },
  {
    trueDiagnosis: 'hemiplegic' as Pathology,
    data: { si: '28.4%', cv: '6.1%', amp: 'Assymetric', cadence: '80 steps/min' },
    features: ['Severe Symmetry Index (>15%)', 'Slow Cadence', 'Unilateral Amplitude loss']
  },
  {
    trueDiagnosis: 'antalgic' as Pathology,
    data: { si: '22.1%', cv: '4.0%', amp: 'Normal/Guarded', cadence: '95 steps/min' },
    features: ['High Asymmetry (Time)', 'Rapid offloading visible', 'Normal Variability']
  },
  {
    trueDiagnosis: 'normal' as Pathology,
    data: { si: '2.1%', cv: '1.8%', amp: 'Normal', cadence: '105 steps/min' },
    features: ['Low Symmetry Index (<5%)', 'Low Variability (<3%)', 'Normal Amplitude']
  }
];

function MysteryLab({ onComplete }: { onComplete: (score: number) => void }): React.JSX.Element {
  const [round, setRound] = useState(0);
  const [diagnosis, setDiagnosis] = useState<Pathology | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [results, setResults] = useState<boolean[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const scenario = SCENARIOS[round];

  const toggleFeature = (feat: string) => {
    if (submitted) return;
    if (selectedFeatures.includes(feat)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== feat));
    } else {
      if (selectedFeatures.length < 3) {
        setSelectedFeatures([...selectedFeatures, feat]);
      }
    }
  };

  const handleSubmit = () => {
    const isCorrectTarget = diagnosis === scenario.trueDiagnosis;
    const isCorrectFeatures = scenario.features.every(f => selectedFeatures.includes(f));
    const isCorrect = isCorrectTarget && isCorrectFeatures;

    setResults([...results, isCorrect]);
    setSubmitted(true);
  };

  const handleNext = () => {
    if (round + 1 < SCENARIOS.length) {
      setRound(round + 1);
      setDiagnosis(null);
      setSelectedFeatures([]);
      setSubmitted(false);
    } else {
      const correctCount = results.filter(r => r).length + (submitted && diagnosis === scenario.trueDiagnosis && scenario.features.every(f => selectedFeatures.includes(f)) ? 1 : 0);
      onComplete(Math.round((correctCount / SCENARIOS.length) * 100));
    }
  };

  // Mixed list of features for the checklist
  const allFeatures = [
    'Low Amplitude', 'High Stride Variability (CV)', 'Increased Cadence',
    'Severe Symmetry Index (>15%)', 'Slow Cadence', 'Unilateral Amplitude loss',
    'High Asymmetry (Time)', 'Rapid offloading visible', 'Normal Variability',
    'Low Symmetry Index (<5%)', 'Low Variability (<3%)', 'Normal Amplitude'
  ].sort((a,b) => a.localeCompare(b)); // Simple sort to randomize slightly mentally

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Mystery Patient {round + 1}/4</h2>
        <div style={{ display: 'flex', gap: '4px' }}>
          {SCENARIOS.map((_, i) => (
            <div key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', background: i < round ? (results[i] ? '#52e5a0' : '#ff5252') : (i === round ? 'var(--accent)' : 'var(--border)') }} />
          ))}
        </div>
      </div>

      {/* Synthetic Sensor Report */}
      <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '12px', fontFamily: 'var(--mono)' }}>
        <h3 style={{ textTransform: 'uppercase', fontSize: '0.9rem', color: 'var(--text3)', marginBottom: '16px' }}>Raw Sensor Extraction Report</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '1.25rem' }}>
          <div>Symmetry Index: <span style={{ color: 'var(--amber)' }}>{scenario.data.si}</span></div>
          <div>Stride Var (CV): <span style={{ color: 'var(--amber)' }}>{scenario.data.cv}</span></div>
          <div>Signal Amplitude: <span style={{ color: 'var(--amber)' }}>{scenario.data.amp}</span></div>
          <div>Mean Cadence: <span style={{ color: 'var(--amber)' }}>{scenario.data.cadence}</span></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Diagnosis Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4>1. Select Primary Diagnosis</h4>
          {['normal', 'parkinson', 'hemiplegic', 'antalgic'].map(p => (
            <button 
              key={p} 
              className={diagnosis === p ? 'btn-primary' : 'btn-secondary'}
              onClick={() => !submitted && setDiagnosis(p as Pathology)}
              style={{ textTransform: 'capitalize' }}
            >
              {p} Gait
            </button>
          ))}
        </div>

        {/* Feature Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h4>2. Select 3 Supporting Features</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {allFeatures.map(f => {
              const isSelected = selectedFeatures.includes(f);
              const isCorrectFeatureForScenario = scenario.features.includes(f);
              
              let bg = isSelected ? '#4f8cff30' : 'var(--bg2)';
              let border = isSelected ? 'var(--accent)' : 'var(--border)';
              
              if (submitted) {
                if (isSelected && isCorrectFeatureForScenario) {
                  bg = '#52e5a030'; border = '#52e5a0';
                } else if (isSelected && !isCorrectFeatureForScenario) {
                  bg = '#ff525230'; border = '#ff5252';
                } else if (!isSelected && isCorrectFeatureForScenario) {
                  bg = 'transparent'; border = '#52e5a0'; // missed it
                }
              }

              return (
                <div 
                  key={f}
                  onClick={() => toggleFeature(f)}
                  style={{
                    padding: '6px 10px',
                    fontSize: '0.75rem',
                    borderRadius: '16px',
                    background: bg,
                    border: `1px solid ${border}`,
                    cursor: submitted ? 'default' : 'pointer'
                  }}
                >
                  {f}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {submitted && (
        <div style={{ padding: '16px', background: (diagnosis === scenario.trueDiagnosis && scenario.features.every(f => selectedFeatures.includes(f))) ? '#52e5a020' : '#ff525220', borderRadius: '8px' }}>
          The correct diagnosis was <strong>{scenario.trueDiagnosis}</strong>. 
          <br/>
          Key indicators: {scenario.features.join(', ')}.
        </div>
      )}

      {!submitted ? (
        <button className="btn-primary" onClick={handleSubmit} disabled={!diagnosis || selectedFeatures.length !== 3}>
          Submit Diagnosis
        </button>
      ) : (
        <button className="btn-primary" onClick={handleNext}>
          {round + 1 < SCENARIOS.length ? 'Next Patient →' : 'Finish Challenge'}
        </button>
      )}

    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════ */
export default function E4MysteryGait(): React.JSX.Element {
  const [labScore, setLabScore] = useState(0);

  const steps: StepConfig[] = [
    {
      id: 'theory',
      name: 'Diagnostic Rules',
      xpReward: 50,
      component: <TheoryStep />,
    },
    {
      id: 'interactive',
      name: 'Patient Files',
      xpReward: 200,
      component: <MysteryLab onComplete={setLabScore} />,
    },
    {
      id: 'summary',
      name: 'Summary',
      xpReward: 50,
      component: (
        <SummaryCard
          experimentTitle="Mystery Diagnosis Challenge"
          keyFormula="Signals → Features → Diagnosis"
          keyConcept="Clinical gait analysis relies on extracting specific qualitative and quantitative features (SI%, CV%, amplitude) from raw sensor data to build a diagnostic profile."
          score={labScore || 100}
          badgeId="clinical-detective"
          moduleId="m7"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m7" expId="mystery-gait" steps={steps} />;
}
