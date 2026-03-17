// src/modules/m1/SpatiotemporalExperiment.tsx
import React, { useState, useMemo } from 'react';
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
import GaitCanvas from '../../components/GaitCanvas';
import { generateGaitData, type GaitData } from '../../engine/syntheticGait';

/* ═══════════════════════════════════════════════════════
   Experiment 1.4 — Spatiotemporal Parameters
   Calculate stride length, cadence, velocity and
   explore normative values. Badge: stride-calculator
   ═══════════════════════════════════════════════════════ */

function SpatiotemporalSimulation(): React.JSX.Element {
  const [height, setHeight] = useState<number>(170);
  const [weight, setWeight] = useState<number>(70);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [age, setAge] = useState<number>(25);
  const [speed, setSpeed] = useState<number>(1.2);

  const gaitData: GaitData = useMemo(() => {
    return generateGaitData({
      height_cm: height,
      weight_kg: weight,
      gender,
      age,
      distance_m: 10,
      speed_ms: speed,
      noise: 0.15,
      seed: 303,
    });
  }, [height, weight, gender, age, speed]);

  const p = gaitData.params;

  const [currentSample, setCurrentSample] = useState<number>(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSample((s) => (s + 1) % gaitData.nSamples);
    }, 10);
    return () => clearInterval(timer);
  }, [gaitData.nSamples]);

  const channels: SignalChannel[] = useMemo(() => [
    { id: 'hipAngle', label: 'Hip Angle (°)', data: gaitData.signals.hipAngle, color: '#a855f7', visible: true },
    { id: 'kneeAngle', label: 'Knee Angle (°)', data: gaitData.signals.kneeAngle, color: '#4f8cff', visible: true },
    { id: 'grfV', label: 'Vertical GRF (BW)', data: gaitData.signals.grfVertical, color: '#ff7a45', visible: true },
  ], [gaitData]);

  // Normative values for comparison
  const normatives = useMemo(() => {
    const isMale = gender === 'male';
    return {
      cadence: isMale ? '110–120' : '115–125',
      strideLength: isMale ? '1.3–1.5' : '1.1–1.3',
      speed: '1.1–1.4',
    };
  }, [gender]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.6875rem', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase' }}>
          Height: {height} cm
          <input type="range" min={140} max={200} value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            style={{ accentColor: 'var(--accent)' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.6875rem', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase' }}>
          Weight: {weight} kg
          <input type="range" min={40} max={150} value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            style={{ accentColor: 'var(--accent)' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.6875rem', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase' }}>
          Speed: {speed.toFixed(1)} m/s
          <input type="range" min={0.5} max={2.5} step={0.1} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            style={{ accentColor: 'var(--accent)' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.6875rem', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase' }}>
          Age: {age}
          <input type="range" min={15} max={80} value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            style={{ accentColor: 'var(--accent)' }} />
        </label>
      </div>

      {/* Gender selector */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {(['male', 'female', 'other'] as const).map((g) => (
          <button key={g} onClick={() => setGender(g)}
            style={{
              padding: '6px 14px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize', cursor: 'pointer',
              background: gender === g ? 'var(--accent)' : 'var(--card)',
              color: gender === g ? '#fff' : 'var(--text2)',
              border: `1px solid ${gender === g ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >{g}</button>
        ))}
      </div>

      {/* Spatiotemporal parameters dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
        {[
          { label: 'Stride Length', value: `${(p.strideLength * 100).toFixed(0)} cm`, norm: normatives.strideLength + ' m', color: '#a855f7' },
          { label: 'Step Length', value: `${(p.stepLength * 100).toFixed(0)} cm`, norm: '–', color: '#4f8cff' },
          { label: 'Cadence', value: `${p.cadence} spm`, norm: normatives.cadence + ' spm', color: '#00d4aa' },
          { label: 'Velocity', value: `${p.speed} m/s`, norm: normatives.speed + ' m/s', color: '#ffa940' },
          { label: 'Cycle Time', value: `${p.cycleTime} s`, norm: '1.0–1.2 s', color: '#ff7a45' },
          { label: 'Stance %', value: `${(p.stanceRatio * 100).toFixed(1)}%`, norm: '58–62%', color: '#6366f1' },
        ].map((s) => (
          <div key={s.label} style={{
            padding: '14px',
            borderRadius: '10px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: '0.5625rem', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--mono)', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.5625rem', color: 'var(--text3)', marginTop: '4px' }}>Norm: {s.norm}</div>
          </div>
        ))}
      </div>

      {/* Formula reference */}
      <div style={{
        padding: '14px 18px',
        borderRadius: '10px',
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        fontFamily: 'var(--mono)',
        fontSize: '0.75rem',
        color: 'var(--accent)',
        lineHeight: 2,
      }}>
        <div>Velocity = Stride Length × (Cadence / 2 / 60)</div>
        <div>Step Length = Height × 0.413 (male) | × 0.388 (female)</div>
        <div>Stride Length = 2 × Step Length</div>
      </div>

      {/* Canvas + signal */}
      <GaitCanvas gaitData={gaitData} speed={speed} width={600} height={240} />

      <SignalPlot
        channels={channels}
        sampleRate={100}
        windowSeconds={3}
        currentSample={currentSample}
        height={180}
      />
    </div>
  );
}

/* ── Main Component ── */

function SpatiotemporalExperiment(): React.JSX.Element {
  const steps: StepConfig[] = [
    {
      id: 'context',
      name: 'Context',
      xpReward: 10,
      component: (
        <ContextStep
          title="Spatiotemporal Parameters"
          body={`Spatiotemporal parameters are the foundational measurements of gait analysis. "Spatial" refers to distances (stride length, step length, step width) and "temporal" refers to timing (cadence, cycle time, stance/swing duration). Together they provide a quantitative description of walking.

The fundamental relationship is: Velocity = Stride Length × Stride Frequency. This means walking speed can increase by taking longer steps, faster steps, or both. Normative values depend on height, gender, and age: taller individuals take longer steps, females tend to have higher cadence, and aging reduces stride length.

Step length is approximately 41.3% of standing height in males and about 6% shorter in females. Normative cadence ranges from 110–125 steps/min. These normative values are essential for clinical comparison — deviations indicate pathology, pain, or neurological impairment.`}
          statistic={{ value: 'V = SL × SF', label: 'the fundamental gait equation' }}
          clinicalNote="Fall-risk screening in elderly populations often uses gait speed as the primary metric. A comfortable gait speed below 0.8 m/s is a strong predictor of mobility disability and increased fall risk."
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
              id: 'st-pred-1',
              question: 'If a 180 cm tall male walks at normal speed, approximately what is his step length?',
              options: ['45 cm', '55 cm', '65 cm', '75 cm'],
              correctIndex: 3,
              explanation: 'Step length ≈ 0.413 × height = 0.413 × 1.80 = 0.74 m ≈ 75 cm for a 180 cm tall male.',
              hint: 'Step length is roughly 41.3% of height in males.',
            },
            {
              id: 'st-pred-2',
              question: 'What happens to stride length as a person ages beyond 60?',
              options: ['It increases', 'It stays the same', 'It decreases by ~0.3%/year', 'It doubles'],
              correctIndex: 2,
              explanation: 'Stride length decreases by approximately 0.3% per year after age 60 due to muscle weakness and reduced hip ROM.',
              hint: 'Think about how elderly people typically walk — shorter or longer steps?',
            },
            {
              id: 'st-pred-3',
              question: 'Normal comfortable walking cadence for adults is approximately:',
              options: ['80 steps/min', '100 steps/min', '115 steps/min', '140 steps/min'],
              correctIndex: 2,
              explanation: 'Normal cadence ranges from 110–125 steps/min, with females typically at the higher end.',
              hint: 'Think of a comfortable, relaxed walking pace — about 2 steps per second.',
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
            { sensorId: 'imu-thigh', zone: 'LEFT_THIGH' },
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
            { id: 'p1', title: 'Configure Subject', description: 'Set the subject height, weight, gender, and age. These anthropometric parameters directly determine step length and cadence predictions.', icon: '👤' },
            { id: 'p2', title: 'Comfortable Speed', description: 'Record 10 strides at the subject\'s self-selected comfortable speed. Note all six spatiotemporal parameters.', icon: '🚶' },
            { id: 'p3', title: 'Speed Variation', description: 'Systematically vary walking speed from 0.5 to 2.5 m/s. Observe how stride length and cadence change to produce different speeds.', icon: '📏' },
            { id: 'p4', title: 'Compare to Norms', description: 'Compare each parameter against age- and gender-matched normative values. Identify any deviations from normal ranges.', icon: '📊' },
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
          simulationComponent={<SpatiotemporalSimulation />}
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
          simulationComponent={<SpatiotemporalSimulation />}
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
              id: 'st-ref-1',
              predictionKey: 'st-pred-1',
              question: 'Step length of 180cm male',
              actualValue: '~75',
              unit: 'cm',
              explanation: 'Step length = 0.413 × 1.80m = 0.74m ≈ 75cm. This empirical ratio (41.3% of height) is well-established in gait biomechanics literature.',
            },
            {
              id: 'st-ref-2',
              predictionKey: 'st-pred-2',
              question: 'Age effect on stride length',
              actualValue: '−0.3%/yr',
              unit: 'after 60',
              explanation: 'Stride length decreases ~0.3% per year after age 60. A 70-year-old walks with about 3% shorter strides than at age 60, due to reduced hip extension, muscle weakness, and decreased ankle push-off power.',
            },
            {
              id: 'st-ref-3',
              predictionKey: 'st-pred-3',
              question: 'Normal cadence',
              actualValue: '115',
              unit: 'spm',
              explanation: 'Normal cadence averages 110–120 spm for males and 115–125 spm for females. The gender difference relates to typical leg length differences.',
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
          experimentTitle="Spatiotemporal Parameters"
          keyFormula="V = SL × SF | Step Length ≈ 0.413 × Height(m) | Cadence ~ 115 spm"
          keyConcept="Gait is quantified by spatial (stride/step length) and temporal (cadence, cycle time) parameters. The fundamental equation V = SL × SF links them. Step length scales with height, cadence with gender, and both decline with age."
          badgeId="stride-calculator"
          moduleId="m1"
          expId="spatiotemporal-params"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m1" expId="spatiotemporal-params" steps={steps} />;
}

export default SpatiotemporalExperiment;
