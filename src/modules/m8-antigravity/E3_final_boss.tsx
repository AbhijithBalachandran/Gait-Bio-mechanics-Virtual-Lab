// src/modules/m8-antigravity/E3_final_boss.tsx
import React, { useState } from 'react';
import ExperimentShell, { StepConfig } from '../../components/ExperimentShell';
import SummaryCard from '../../components/SummaryCard';

/* ═══════════════════════════════════════════════════════
   Step 1: Theory Brief
   ═══════════════════════════════════════════════════════ */
function TheoryStep(): React.JSX.Element {
  return (
    <div className="prose">
      <h2>FINAL BOSS: Gait System Architect</h2>
      <p>
        You have analyzed kinematics (IMUs), kinetics (FSRs), algorithms, and clinical protocols. Now, it is time to build a real system.
      </p>
      <p>
        <strong>Your Task:</strong> A patient has been referred to your clinic. You must architect an entire wearable sensor array, choose the correct event detection algorithms, select the vital metrics to report to doctors, and prescribe an initial rehabilitation gravity environment.
      </p>
      <p>
        Your decisions will be scored against the Kinetrax Expert Benchmark. To pass, you must earn the <em>Gait System Architect</em> badge.
      </p>
      <p style={{ color: 'var(--amber)', fontWeight: 'bold' }}>Caution: Do not over-engineer. An overly complex $5000 system for a simple metric is poor engineering. An under-powered system will miss the diagnosis.</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Step 2: Interactive Design Masterclass
   ═══════════════════════════════════════════════════════ */
const SCENARIO = {
  title: "Patient Scenario: 68 y/o Parkinson's Fall Risk",
  desc: "Patient presents with shuffling gait and suspected 'Freezing of Gait' (FoG) episodes at home. The physician needs a wearable system sent home with the patient to quantify their fall risk over 24 hours.",
  
  // Expert answers
  expertSensor: 'IMU only', // FSR doesn't capture kinematics well enough for FoG. Multi-sensor is too bulky for 24h home use.
  expertPlace: 'Foot+Shank', // Shank IMU is gold standard for Parkinson's FoG freq analysis.
  expertAlgo: 'Peak Detection', // Threshold fails due to noise/tremors.
  expertEnv: 'Earth', // 24hr home monitoring = Earth.
};

function FinalBossLab({ onComplete }: { onComplete: (score: number) => void }): React.JSX.Element {
  const [answers, setAnswers] = useState({
    sensor: '',
    place: '',
    algo: '',
    env: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const updateAnswer = (key: string, val: string) => {
    if (!submitted) setAnswers({ ...answers, [key]: val });
  };

  const handleSubmit = () => {
    let s = 0;
    if (answers.sensor === SCENARIO.expertSensor) s += 25;
    if (answers.place === SCENARIO.expertPlace) s += 25;
    if (answers.algo === SCENARIO.expertAlgo) s += 25;
    if (answers.env === SCENARIO.expertEnv) s += 25;

    setScore(s);
    setSubmitted(true);
    setTimeout(() => onComplete(s), 1000);
  };

  const isComplete = answers.sensor && answers.place && answers.algo && answers.env;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ padding: '24px', background: 'var(--bg2)', borderRadius: '12px', borderLeft: '4px solid var(--accent)' }}>
        <h3 style={{ color: 'var(--accent)' }}>{SCENARIO.title}</h3>
        <p>{SCENARIO.desc}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Q1 */}
        <div className="card" style={{ padding: '16px' }}>
          <h4>1. Hardware Sensor Choice</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: '8px' }}>Must be comfortable for 24h wear.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['IMU only', 'FSR only', 'IMU+FSR', 'IMU+FSR+EMG'].map(opt => (
              <button key={opt} className={answers.sensor === opt ? 'btn-primary' : 'btn-secondary'} onClick={() => updateAnswer('sensor', opt)}>{opt}</button>
            ))}
          </div>
          {submitted && (
            <div style={{ marginTop: '12px', fontSize: '0.85rem', color: answers.sensor === SCENARIO.expertSensor ? 'var(--teal)' : 'var(--red)' }}>
              Expert: {SCENARIO.expertSensor}. (FSR insoles degrade over 24h. IMU bracelets/anklets are highest compliance).
            </div>
          )}
        </div>

        {/* Q2 */}
        <div className="card" style={{ padding: '16px' }}>
          <h4>2. Sensor Placement</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: '8px' }}>Where should the IMUs go?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['Foot only', 'Foot+Shank', 'Foot+Shank+Thigh', 'Trunk Only'].map(opt => (
              <button key={opt} className={answers.place === opt ? 'btn-primary' : 'btn-secondary'} onClick={() => updateAnswer('place', opt)}>{opt}</button>
            ))}
          </div>
          {submitted && (
            <div style={{ marginTop: '12px', fontSize: '0.85rem', color: answers.place === SCENARIO.expertPlace ? 'var(--teal)' : 'var(--red)' }}>
              Expert: {SCENARIO.expertPlace}. (Shank IMU gyroscope is the gold standard for high-frequency freeze detection).
            </div>
          )}
        </div>

        {/* Q3 */}
        <div className="card" style={{ padding: '16px' }}>
          <h4>3. Detection Algorithm</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: '8px' }}>Algorithm for parsing the data.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['Threshold detection', 'Peak Detection', 'Zero-Crossing'].map(opt => (
              <button key={opt} className={answers.algo === opt ? 'btn-primary' : 'btn-secondary'} onClick={() => updateAnswer('algo', opt)}>{opt}</button>
            ))}
          </div>
          {submitted && (
            <div style={{ marginTop: '12px', fontSize: '0.85rem', color: answers.algo === SCENARIO.expertAlgo ? 'var(--teal)' : 'var(--red)' }}>
              Expert: {SCENARIO.expertAlgo}. (Thresholding fails due to resting tremors. Peak detection handles noise well).
            </div>
          )}
        </div>

        {/* Q4 */}
        <div className="card" style={{ padding: '16px' }}>
          <h4>4. Observation Environment</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: '8px' }}>Prescribed environment for the monitoring.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['Earth', '80% BW AlterG', '50% BW AlterG', 'Zero-G'].map(opt => (
              <button key={opt} className={answers.env === opt ? 'btn-primary' : 'btn-secondary'} onClick={() => updateAnswer('env', opt)}>{opt}</button>
            ))}
          </div>
          {submitted && (
            <div style={{ marginTop: '12px', fontSize: '0.85rem', color: answers.env === SCENARIO.expertEnv ? 'var(--teal)' : 'var(--red)' }}>
              Expert: {SCENARIO.expertEnv}. (Needs to measure real-world fall risk at home. Treadmills invalidate the test).
            </div>
          )}
        </div>

      </div>

      {!submitted ? (
        <button className="btn-primary" disabled={!isComplete} onClick={handleSubmit}>Deploy System Design</button>
      ) : (
        <div style={{ padding: '16px', background: 'var(--card)', borderRadius: '8px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: score >= 75 ? 'var(--teal)' : 'var(--amber)' }}>
          Design Architect Score: {score}%
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════ */
export default function E3FinalBoss(): React.JSX.Element {
  const [labScore, setLabScore] = useState(0);

  const steps: StepConfig[] = [
    {
      id: 'theory',
      name: 'The Challenge',
      xpReward: 50,
      component: <TheoryStep />,
    },
    {
      id: 'lab',
      name: 'System Architecture',
      xpReward: 400,
      component: <FinalBossLab onComplete={setLabScore} />,
    },
    {
      id: 'summary',
      name: 'Summary',
      xpReward: 50,
      component: (
        <SummaryCard
          experimentTitle="Final Boss — Gait System Architect"
          keyFormula="Sensors + Algos + Use-Case = Impact"
          keyConcept="Real world systems require an elegant balance of sensor hardware, robust algorithms, and physiological understanding to provide clinical value without overburdening the patient."
          score={labScore || 100}
          badgeId="gait-system-architect"
          moduleId="m8"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m8" expId="final-boss" steps={steps} />;
}
