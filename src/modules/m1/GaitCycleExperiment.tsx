// src/modules/m1/GaitCycleExperiment.tsx
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
import GaitCanvas from '../../components/GaitCanvas';
import SignalPlot, { type SignalChannel } from '../../components/SignalPlot';
import { generateGaitData, type GaitData } from '../../engine/syntheticGait';
import { GaitPhase } from '../../types/enums';
import { PHASE_LABELS, PHASE_COLORS } from '../../engine/gaitPhysics';

/* ═══════════════════════════════════════════════════════
   Experiment 1.1 — The Gait Cycle
   Visualize and interact with all phases from HS to HS
   Badge: gait-watcher
   ═══════════════════════════════════════════════════════ */

/* ── Results Simulation ── */

function GaitCycleSimulation(): React.JSX.Element {
  const [gaitData, setGaitData] = useState<GaitData | null>(null);
  const [currentSample, setCurrentSample] = useState<number>(0);
  const [currentPhase, setCurrentPhase] = useState<GaitPhase>(GaitPhase.HeelStrike);
  const [speed, setSpeed] = useState<number>(1.2);

  // Generate default data
  React.useEffect(() => {
    const data = generateGaitData({
      height_cm: 170,
      weight_kg: 70,
      gender: 'male',
      age: 25,
      distance_m: 10,
      noise: 0.15,
      seed: 42,
    });
    setGaitData(data);
  }, []);

  // Advance currentSample for SignalPlot
  React.useEffect(() => {
    if (!gaitData) return;
    const timer = setInterval(() => {
      setCurrentSample((s) => (s + 1) % gaitData.nSamples);
    }, 10);
    return () => clearInterval(timer);
  }, [gaitData]);

  const handlePhaseChange = useCallback((phase: GaitPhase): void => {
    setCurrentPhase(phase);
  }, []);

  const channels: SignalChannel[] = useMemo(() => {
    if (!gaitData) return [];
    return [
      { id: 'accZ', label: 'Acc Z (m/s²)', data: gaitData.signals.accZ, color: '#4f8cff', visible: true },
      { id: 'gyroY', label: 'Gyro Y (°/s)', data: gaitData.signals.gyroY, color: '#00d4aa', visible: true },
      { id: 'fsrHeel', label: 'FSR Heel', data: gaitData.signals.fsrHeel, color: '#ffa940', visible: true },
      { id: 'hipAngle', label: 'Hip Angle (°)', data: gaitData.signals.hipAngle, color: '#a855f7', visible: true },
    ];
  }, [gaitData]);

  const [visibleChannels, setVisibleChannels] = useState<Set<string>>(new Set(['accZ', 'gyroY', 'fsrHeel', 'hipAngle']));

  const toggleChannel = useCallback((id: string): void => {
    setVisibleChannels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const visibleCh = useMemo(
    () => channels.map((c) => ({ ...c, visible: visibleChannels.has(c.id) })),
    [channels, visibleChannels]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Phase indicator */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {Object.entries(PHASE_LABELS).map(([phase, label]) => (
          <span
            key={phase}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.6875rem',
              fontWeight: currentPhase === phase ? 700 : 400,
              background: currentPhase === phase ? PHASE_COLORS[phase as GaitPhase] + '20' : 'var(--bg2)',
              color: currentPhase === phase ? PHASE_COLORS[phase as GaitPhase] : 'var(--text3)',
              border: `1px solid ${currentPhase === phase ? PHASE_COLORS[phase as GaitPhase] : 'var(--border)'}`,
              transition: 'all 0.2s',
            }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Speed control */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>Walking Speed:</label>
        <input
          type="range" min={0.5} max={2.5} step={0.1} value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          style={{ width: '140px', accentColor: 'var(--accent)' }}
        />
        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--mono)', color: 'var(--accent)' }}>
          {speed.toFixed(1)} m/s
        </span>
      </div>

      {/* Animation */}
      <GaitCanvas gaitData={gaitData} speed={speed} onPhaseChange={handlePhaseChange} />

      {/* Signal plot */}
      <SignalPlot
        channels={visibleCh}
        sampleRate={100}
        windowSeconds={3}
        currentSample={currentSample}
        onToggleChannel={toggleChannel}
        height={200}
      />
    </div>
  );
}

/* ── Main Experiment Component ── */

function GaitCycleExperiment(): React.JSX.Element {
  const steps: StepConfig[] = [
    {
      id: 'context',
      name: 'Context',
      xpReward: 10,
      component: (
        <ContextStep
          title="The Gait Cycle"
          body={`The human gait cycle is one of the most studied periodic movements in biomechanics. A single gait cycle spans from one heel-strike to the next heel-strike of the same foot — approximately 1.0–1.2 seconds at comfortable walking speed.

Each cycle divides into two major phases: stance (≈60% of cycle) when the foot is in contact with the ground, and swing (≈40%) when the foot travels forward through the air. Within these, biomechanists identify 7 sub-phases: heel-strike, foot-flat, mid-stance, heel-off, toe-off, mid-swing, and terminal swing.

Understanding gait phase timing is fundamental to clinical gait analysis, prosthetic design, robotic exoskeletons, and sports biomechanics. Abnormal phase durations often indicate neurological or musculoskeletal pathology.`}
          statistic={{ value: '~1,000', label: 'steps per km at normal walking speed' }}
          clinicalNote="In neurological conditions like Parkinson's disease, the stance phase increases while swing phase decreases, producing a shuffling gait pattern with reduced stride length."
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
              id: 'gc-pred-1',
              question: 'What percentage of the gait cycle is spent in the stance phase?',
              options: ['40%', '50%', '60%', '75%'],
              correctIndex: 2,
              explanation: 'Stance phase occupies approximately 60% of the gait cycle at normal walking speed.',
              hint: 'Think about when both feet are on the ground vs. one foot in the air.',
            },
            {
              id: 'gc-pred-2',
              question: 'Which event marks the beginning of a new gait cycle?',
              options: ['Toe-off', 'Mid-stance', 'Heel-strike', 'Mid-swing'],
              correctIndex: 2,
              explanation: 'By convention, the gait cycle begins at initial contact (heel-strike) of one foot.',
              hint: 'It is the first contact event when the foot meets the ground.',
            },
            {
              id: 'gc-pred-3',
              question: 'At normal speed (~1.2 m/s), approximately how long is one complete gait cycle?',
              options: ['0.5 seconds', '1.0 seconds', '1.5 seconds', '2.5 seconds'],
              correctIndex: 1,
              explanation: 'At comfortable walking speed, one stride takes approximately 1.0–1.2 seconds.',
              hint: 'Normal cadence is about 110–120 steps/min.',
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
            { sensorId: 'imu-shank', zone: 'LEFT_SHANK' },
            { sensorId: 'fsr-heel', zone: 'R_HEEL' },
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
            { id: 'p1', title: 'Calibrate Sensors', description: 'Ensure the IMU and FSR sensors are properly zeroed. The subject should stand still for 3 seconds to establish baseline readings.', icon: '📐' },
            { id: 'p2', title: 'Start Walking', description: 'The subject walks at a comfortable self-selected speed along a 10-meter straight path. Data recording begins automatically at the first heel-strike.', icon: '🚶' },
            { id: 'p3', title: 'Observe Phases', description: 'Watch the stick figure animation and identify each of the 7 gait sub-phases. Note how sensor signals change with each phase transition.', icon: '👁️' },
            { id: 'p4', title: 'Analyze Signals', description: 'Examine the accelerometer, gyroscope, and FSR signals. Identify heel-strike peaks in AccZ and push-off events in the FSR toe signal.', icon: '📊' },
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
          simulationComponent={<GaitCycleSimulation />}
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
          simulationComponent={<GaitCycleSimulation />}
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
              id: 'gc-ref-1',
              predictionKey: 'gc-pred-1',
              question: 'Stance phase percentage',
              actualValue: '60',
              unit: '%',
              explanation: 'The stance phase consistently occupies ~60% of the gait cycle at normal walking speed (1.2 m/s). As speed increases, stance% decreases toward 50%.',
            },
            {
              id: 'gc-ref-2',
              predictionKey: 'gc-pred-2',
              question: 'Gait cycle start event',
              actualValue: 'Heel-strike',
              unit: '',
              explanation: 'Initial contact (heel-strike) is the universally accepted start of the gait cycle in clinical gait analysis.',
            },
            {
              id: 'gc-ref-3',
              predictionKey: 'gc-pred-3',
              question: 'Cycle duration',
              actualValue: '1.0',
              unit: 'seconds',
              explanation: 'At a cadence of ~120 steps/min, one full stride (2 steps) takes about 1.0 seconds.',
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
          experimentTitle="The Gait Cycle"
          keyFormula="Gait Cycle = Heel-Strike → Stance (60%) → Swing (40%) → Heel-Strike"
          keyConcept="A complete gait cycle spans from one heel-strike to the next of the same foot, dividing into 7 sub-phases. Stance occupies ~60% and swing ~40% at normal walking speed."
          badgeId="gait-watcher"
          moduleId="m1"
          expId="gait-cycle"
          nextExpPath="/experiment/m1/stance-swing"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m1" expId="gait-cycle" steps={steps} />;
}

export default GaitCycleExperiment;
