// src/modules/m1/StanceSwingExperiment.tsx
import React, { useState, useCallback, useMemo } from 'react';
import ExperimentShell, { type StepConfig } from '../../components/ExperimentShell';
import ContextStep from '../../steps/ContextStep';
import PredictionsStep from '../../steps/PredictionsStep';
import MaterialsStep from '../../steps/MaterialsStep';
import ProtocolStep from '../../steps/ProtocolStep';
import ResultsStep from '../../steps/ResultsStep';
import PracticeStep from '../../steps/PracticeStep';
import ReflectionStep from '../../steps/ReflectionStep';
import SummaryStep from '../../steps/SummaryStep';
import SignalPlot, { type SignalChannel } from '../../components/SignalPlot';
import { generateGaitData, type GaitData } from '../../engine/syntheticGait';

/* ═══════════════════════════════════════════════════════
   Experiment 1.2 — Stance vs Swing
   Explore timing of stance/swing and how they change
   with speed. Badge: phase-detective
   ═══════════════════════════════════════════════════════ */

function StanceSwingSimulation(): React.JSX.Element {
  const [speed, setSpeed] = useState<number>(1.2);
  const [height, setHeight] = useState<number>(170);

  const gaitData: GaitData = useMemo(() => {
    return generateGaitData({
      height_cm: height,
      weight_kg: 70,
      gender: 'male',
      age: 25,
      distance_m: 10,
      speed_ms: speed,
      noise: 0.15,
      seed: 101,
    });
  }, [speed, height]);

  const stancePct = (gaitData.params.stanceRatio * 100).toFixed(1);
  const swingPct = (gaitData.params.swingRatio * 100).toFixed(1);

  const channels: SignalChannel[] = useMemo(() => [
    { id: 'fsrHeel', label: 'FSR Heel (stance indicator)', data: gaitData.signals.fsrHeel, color: '#4f8cff', visible: true },
    { id: 'fsrToe', label: 'FSR Toe (push-off)', data: gaitData.signals.fsrToe, color: '#ffa940', visible: true },
    { id: 'gyroY', label: 'Gyro Y (swing indicator)', data: gaitData.signals.gyroY, color: '#00d4aa', visible: true },
  ], [gaitData]);

  const [currentSample, setCurrentSample] = useState<number>(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSample((s) => (s + 1) % gaitData.nSamples);
    }, 10);
    return () => clearInterval(timer);
  }, [gaitData.nSamples]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', color: 'var(--text2)' }}>
          Speed: {speed.toFixed(1)} m/s
          <input type="range" min={0.5} max={2.5} step={0.1} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            style={{ width: '160px', accentColor: 'var(--accent)' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', color: 'var(--text2)' }}>
          Height: {height} cm
          <input type="range" min={140} max={200} value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            style={{ width: '160px', accentColor: 'var(--accent)' }} />
        </label>
      </div>

      {/* Phase bar */}
      <div style={{
        display: 'flex',
        borderRadius: '10px',
        overflow: 'hidden',
        height: '40px',
        border: '1px solid var(--border)',
      }}>
        <div style={{
          width: `${stancePct}%`,
          background: 'linear-gradient(135deg, #4f8cff40, #4f8cff20)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 700, color: '#4f8cff',
          fontFamily: 'var(--mono)',
        }}>
          Stance {stancePct}%
        </div>
        <div style={{
          width: `${swingPct}%`,
          background: 'linear-gradient(135deg, #00d4aa40, #00d4aa20)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 700, color: '#00d4aa',
          fontFamily: 'var(--mono)',
        }}>
          Swing {swingPct}%
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {[
          { label: 'Cadence', value: `${gaitData.params.cadence} spm`, color: '#4f8cff' },
          { label: 'Cycle Time', value: `${gaitData.params.cycleTime}s`, color: '#00d4aa' },
          { label: 'Step Length', value: `${(gaitData.params.stepLength * 100).toFixed(0)} cm`, color: '#a855f7' },
          { label: 'Speed', value: `${gaitData.params.speed} m/s`, color: '#ffa940' },
        ].map((s) => (
          <div key={s.label} style={{
            padding: '12px',
            borderRadius: '10px',
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.5625rem', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--mono)', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Signal plot */}
      <SignalPlot
        channels={channels}
        sampleRate={100}
        windowSeconds={3}
        currentSample={currentSample}
        height={200}
      />
    </div>
  );
}

/* ── Main Experiment Component ── */

function StanceSwingExperiment(): React.JSX.Element {
  const steps: StepConfig[] = [
    {
      id: 'context',
      name: 'Context',
      xpReward: 10,
      component: (
        <ContextStep
          title="Stance vs Swing Phases"
          body={`Every gait cycle divides into two fundamental phases: stance (foot on ground) and swing (foot in air). At comfortable walking speed (~1.2 m/s), stance accounts for approximately 60% and swing 40% of the total cycle.

This ratio is not fixed — it changes dramatically with speed. During slow walking, stance can exceed 65%. As walking speed increases toward running, stance decreases until at running speeds it drops below 50%, meaning there are brief periods of flight when neither foot contacts the ground.

The stance-swing ratio is a key clinical indicator. A prolonged stance phase on one side (asymmetric gait) may indicate pain, weakness, or neurological impairment. The double-support period — when both feet are on the ground simultaneously — exists only during walking and disappears during running.`}
          statistic={{ value: '60/40', label: 'stance/swing ratio at normal speed' }}
          clinicalNote="Patients with hip osteoarthritis often show increased stance time on the unaffected side as a compensatory strategy to reduce loading on the painful joint."
        />
      ),
    },
    {
      id: 'predictions',
      name: 'Predictions',
      xpReward: 20,
      component: (
        <PredictionsStep
          questions={[
            {
              id: 'ss-pred-1',
              question: 'What happens to the stance phase percentage as walking speed increases?',
              options: ['It increases', 'It stays the same', 'It decreases', 'It doubles'],
              correctIndex: 2,
              explanation: 'As walking speed increases, stance time decreases proportionally. At running speeds, stance% drops below 50%.',
              hint: 'Think about what happens as you transition from walking slowly to fast walking.',
            },
            {
              id: 'ss-pred-2',
              question: 'At what speed does stance and swing become approximately equal (50/50)?',
              options: ['0.5 m/s', '1.0 m/s', '2.0 m/s (walk-run transition)', '3.0 m/s'],
              correctIndex: 2,
              explanation: 'The walk-run transition occurs around 2.0 m/s, where stance and swing become approximately equal.',
              hint: 'This is the speed at which walking transitions to running.',
            },
            {
              id: 'ss-pred-3',
              question: 'Which sensor best distinguishes stance from swing phase?',
              options: ['Accelerometer (X-axis)', 'FSR under heel', 'Temperature sensor', 'Barometer'],
              correctIndex: 1,
              explanation: 'An FSR (force-sensitive resistor) under the heel provides a clear binary signal: high during stance, zero during swing.',
              hint: 'This sensor directly measures foot-ground contact force.',
            },
          ]}
        />
      ),
    },
    {
      id: 'materials',
      name: 'Materials',
      xpReward: 30,
      component: (
        <MaterialsStep
          requiredPlacements={[
            { sensorId: 'imu-foot', zone: 'LEFT_FOOT' },
            { sensorId: 'fsr-heel', zone: 'R_HEEL' },
            { sensorId: 'fsr-toe', zone: 'R_TOE' },
          ]}
        />
      ),
    },
    {
      id: 'protocol',
      name: 'Protocol',
      xpReward: 20,
      component: (
        <ProtocolStep
          steps={[
            { id: 'p1', title: 'Baseline Speed', description: 'Record 10 strides at comfortable walking speed (1.0–1.4 m/s). Note the stance/swing ratio from the FSR signals.', icon: '🚶' },
            { id: 'p2', title: 'Slow Walk', description: 'Reduce speed to 0.6 m/s. Observe how stance percentage increases and swing percentage decreases.', icon: '🐢' },
            { id: 'p3', title: 'Fast Walk', description: 'Increase speed to 2.0 m/s. Watch the stance/swing ratio approach 50/50 as you near the walk-run transition.', icon: '🏃' },
            { id: 'p4', title: 'Compare Results', description: 'Use the speed slider to compare all three conditions side-by-side. Note the cadence and step length changes.', icon: '📊' },
          ]}
        />
      ),
    },
    {
      id: 'results',
      name: 'Results',
      xpReward: 100,
      minScore: 60,
      component: (
        <ResultsStep
          simulationComponent={<StanceSwingSimulation />}
          minScore={60}
        />
      ),
    },
    {
      id: 'practice',
      name: 'Practice',
      xpReward: 50,
      minScore: 40,
      component: (
        <PracticeStep
          simulationComponent={<StanceSwingSimulation />}
          timeLimitSeconds={60}
          minScore={40}
        />
      ),
    },
    {
      id: 'reflection',
      name: 'Reflection',
      xpReward: 20,
      component: (
        <ReflectionStep
          questions={[
            {
              id: 'ss-ref-1',
              predictionKey: 'ss-pred-1',
              question: 'Speed effect on stance%',
              actualValue: 'Decreases',
              unit: '',
              explanation: 'Stance percentage decreases linearly from ~65% at 0.6 m/s to ~50% at 2.0 m/s. This is because faster walking requires quicker swing phases and reduced ground contact time.',
            },
            {
              id: 'ss-ref-2',
              predictionKey: 'ss-pred-2',
              question: 'Speed at 50/50 split',
              actualValue: '~2.0',
              unit: 'm/s',
              explanation: 'The walk-run transition at ~2.0 m/s marks where stance and swing durations equalize. Beyond this, running introduces a flight phase.',
            },
            {
              id: 'ss-ref-3',
              predictionKey: 'ss-pred-3',
              question: 'Best stance/swing sensor',
              actualValue: 'FSR',
              unit: '',
              explanation: 'The heel FSR provides the most direct measurement of stance phase: signal > threshold = stance, signal ≈ 0 = swing.',
            },
          ]}
        />
      ),
    },
    {
      id: 'summary',
      name: 'Summary',
      xpReward: 50,
      component: (
        <SummaryStep
          experimentTitle="Stance vs Swing"
          keyFormula="Stance% ≈ 60% (1.2 m/s) → 50% (2.0 m/s) | Swing% = 100% − Stance%"
          keyConcept="The stance/swing ratio is speed-dependent. As speed increases, stance phase shortens proportionally. At the walk-run transition (~2.0 m/s), both phases equalize at ~50%."
          badgeId="phase-detective"
          moduleId="m1"
          expId="stance-swing"
          nextExpPath="/experiment/m1/double-support"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m1" expId="stance-swing" steps={steps} />;
}

export default StanceSwingExperiment;
