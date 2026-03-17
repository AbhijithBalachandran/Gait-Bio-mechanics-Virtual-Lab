// src/modules/m1/DoubleSupportExperiment.tsx
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
import { generateGaitData, type GaitData } from '../../engine/syntheticGait';

/* ═══════════════════════════════════════════════════════
   Experiment 1.3 — Double Support Period
   Investigates the double-limb support phase
   ═══════════════════════════════════════════════════════ */

function DoubleSupportSimulation(): React.JSX.Element {
  const [speed, setSpeed] = useState<number>(1.2);

  const gaitData: GaitData = useMemo(() => {
    return generateGaitData({
      height_cm: 170,
      weight_kg: 70,
      gender: 'male',
      age: 25,
      distance_m: 10,
      speed_ms: speed,
      noise: 0.15,
      seed: 202,
    });
  }, [speed]);

  const stancePct = gaitData.params.stanceRatio * 100;
  const doubleSupportPct = Math.max(0, (stancePct - 50) * 2);
  const singleSupportPct = 100 - doubleSupportPct;

  const [currentSample, setCurrentSample] = useState<number>(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSample((s) => (s + 1) % gaitData.nSamples);
    }, 10);
    return () => clearInterval(timer);
  }, [gaitData.nSamples]);

  const channels: SignalChannel[] = useMemo(() => [
    { id: 'fsrHeel', label: 'Left FSR Heel', data: gaitData.signals.fsrHeel, color: '#4f8cff', visible: true },
    { id: 'fsrToe', label: 'Left FSR Toe', data: gaitData.signals.fsrToe, color: '#00d4aa', visible: true },
    { id: 'grfV', label: 'Vertical GRF (N)', data: gaitData.signals.grfVertical, color: '#a855f7', visible: true },
  ], [gaitData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Speed slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>Speed:</label>
        <input type="range" min={0.5} max={2.5} step={0.1} value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          style={{ width: '160px', accentColor: 'var(--accent)' }} />
        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--mono)', color: 'var(--accent)' }}>
          {speed.toFixed(1)} m/s
        </span>
      </div>

      {/* Support phase breakdown */}
      <div style={{
        display: 'flex',
        borderRadius: '10px',
        overflow: 'hidden',
        height: '48px',
        border: '1px solid var(--border)',
      }}>
        {/* Double support 1 */}
        <div style={{
          width: `${doubleSupportPct / 2}%`,
          background: 'linear-gradient(135deg, #ff7a4540, #ff7a4520)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.5625rem', fontWeight: 700, color: '#ff7a45',
          fontFamily: 'var(--mono)',
          borderRight: '1px dashed var(--border)',
        }}>
          DS1
        </div>
        {/* Single support */}
        <div style={{
          width: `${singleSupportPct / 2}%`,
          background: 'linear-gradient(135deg, #4f8cff20, #4f8cff10)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.6875rem', fontWeight: 700, color: '#4f8cff',
          fontFamily: 'var(--mono)',
        }}>
          Single Support {(singleSupportPct / 2).toFixed(0)}%
        </div>
        {/* Double support 2 */}
        <div style={{
          width: `${doubleSupportPct / 2}%`,
          background: 'linear-gradient(135deg, #ff7a4540, #ff7a4520)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.5625rem', fontWeight: 700, color: '#ff7a45',
          fontFamily: 'var(--mono)',
          borderLeft: '1px dashed var(--border)',
        }}>
          DS2
        </div>
        {/* Swing */}
        <div style={{
          width: `${100 - stancePct}%`,
          background: 'linear-gradient(135deg, #00d4aa20, #00d4aa10)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.6875rem', fontWeight: 700, color: '#00d4aa',
          fontFamily: 'var(--mono)',
        }}>
          Swing {(100 - stancePct).toFixed(0)}%
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {[
          { label: 'Double Support %', value: `${doubleSupportPct.toFixed(1)}%`, color: '#ff7a45' },
          { label: 'Single Support %', value: `${singleSupportPct.toFixed(1)}%`, color: '#4f8cff' },
          { label: 'Total Stance %', value: `${stancePct.toFixed(1)}%`, color: '#a855f7' },
        ].map((s) => (
          <div key={s.label} style={{
            padding: '14px',
            borderRadius: '10px',
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.5625rem', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--mono)', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Signals */}
      <SignalPlot
        channels={channels}
        sampleRate={100}
        windowSeconds={3}
        currentSample={currentSample}
        height={200}
      />

      {/* Key insight */}
      <div style={{
        padding: '12px 16px',
        borderRadius: '10px',
        background: '#ffa94010',
        borderLeft: '3px solid var(--amber)',
        fontSize: '0.8125rem',
        color: 'var(--text2)',
        lineHeight: 1.6,
      }}>
        💡 <strong>Key:</strong> Double support = both feet simultaneously on the ground. It occurs twice per gait cycle: at initial contact and pre-swing. At {speed.toFixed(1)} m/s, double support ≈ {doubleSupportPct.toFixed(1)}% of the cycle.
      </div>
    </div>
  );
}

/* ── Main Component ── */

function DoubleSupportExperiment(): React.JSX.Element {
  const steps: StepConfig[] = [
    {
      id: 'context',
      name: 'Context',
      xpReward: 10,
      component: (
        <ContextStep
          title="Double Support Period"
          body={`The double support period is the interval during walking when both feet are simultaneously in contact with the ground. It occurs twice per gait cycle: once during loading response (initial double support) and once during pre-swing (terminal double support).

At comfortable walking speed, double support occupies approximately 20% of the total gait cycle (~10% for each double support period). This is a critical stability parameter — longer double support means more time with a wide base of support.

Double support duration changes inversely with walking speed. At slow speeds, it increases significantly (up to 30-40% of the cycle), providing more stability. At the walk-run transition (~2.0 m/s), double support approaches zero, then disappears entirely during running, replaced by a flight phase.`}
          statistic={{ value: '~20%', label: 'of gait cycle in double support at normal speed' }}
          clinicalNote="Elderly adults and patients with balance disorders often show increased double support time as a compensatory strategy to improve stability. This is one of the earliest detectable gait changes with aging."
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
              id: 'ds-pred-1',
              question: 'What happens to double support duration when a person walks faster?',
              options: ['It increases', 'It stays the same', 'It decreases', 'It disappears immediately'],
              correctIndex: 2,
              explanation: 'Double support decreases with increasing speed. At the walk-run transition, it reaches zero.',
              hint: 'Think about what happens during running — is there ever a time when both feet are on the ground?',
            },
            {
              id: 'ds-pred-2',
              question: 'How many double support periods occur in one complete gait cycle?',
              options: ['One', 'Two', 'Three', 'Four'],
              correctIndex: 1,
              explanation: 'Two double support periods occur per gait cycle: initial (loading response) and terminal (pre-swing).',
              hint: 'Consider what happens at the beginning and end of stance phase.',
            },
            {
              id: 'ds-pred-3',
              question: 'Why do elderly adults typically have longer double support times?',
              options: ['Stronger muscles', 'Better balance', 'Increased stability need', 'Faster reflexes'],
              correctIndex: 2,
              explanation: 'Longer double support provides a wider, more stable base of support, compensating for reduced balance control.',
              hint: 'Think about what having both feet on the ground provides vs. standing on one foot.',
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
            { sensorId: 'fsr-heel', zone: 'R_HEEL' },
            { sensorId: 'fsr-toe', zone: 'R_TOE' },
            { sensorId: 'imu-foot', zone: 'LEFT_FOOT' },
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
            { id: 'p1', title: 'Normal Speed Trial', description: 'Walk at self-selected comfortable speed (1.0–1.4 m/s). Record FSR data from both heel sensors and note when both show simultaneous contact.', icon: '🚶' },
            { id: 'p2', title: 'Slow Speed Trial', description: 'Walk at 0.6 m/s. Observe how double support duration increases significantly — both feet spend more time in contact with the ground.', icon: '🐌' },
            { id: 'p3', title: 'Fast Speed Trial', description: 'Walk at 2.0 m/s. Note how double support nearly vanishes — the brief overlap between heel-strike and contralateral toe-off becomes minimal.', icon: '⚡' },
            { id: 'p4', title: 'Quantify Changes', description: 'Use the phase breakdown bar to compare double support percentages across the three speed conditions.', icon: '📈' },
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
          simulationComponent={<DoubleSupportSimulation />}
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
          simulationComponent={<DoubleSupportSimulation />}
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
              id: 'ds-ref-1',
              predictionKey: 'ds-pred-1',
              question: 'Speed effect on double support',
              actualValue: 'Decreases',
              unit: '',
              explanation: 'Double support decreases from ~30% at 0.6 m/s to ~0% at 2.0 m/s. This is because faster walking reduces the overlap time between contralateral foot contacts.',
            },
            {
              id: 'ds-ref-2',
              predictionKey: 'ds-pred-2',
              question: 'Number of DS periods per cycle',
              actualValue: '2',
              unit: 'periods',
              explanation: 'Two double support periods per cycle: one at loading response (0–10% of cycle) and one at pre-swing (50–60% of cycle).',
            },
            {
              id: 'ds-ref-3',
              predictionKey: 'ds-pred-3',
              question: 'Elderly double support reason',
              actualValue: 'Stability',
              unit: '',
              explanation: 'Increased double support provides greater stability through a wider base of support, compensating for age-related decline in balance, proprioception, and muscle strength.',
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
          experimentTitle="Double Support Period"
          keyFormula="DS% ≈ 2 × (Stance% − 50%) | DS → 0 at walk-run transition"
          keyConcept="Double support occurs twice per gait cycle and decreases with walking speed. It reaches zero at the walk-run transition (~2.0 m/s). Increased double support is a stability strategy used by elderly and balance-impaired individuals."
          moduleId="m1"
          expId="double-support"
          nextExpPath="/experiment/m1/spatiotemporal-params"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m1" expId="double-support" steps={steps} />;
}

export default DoubleSupportExperiment;
