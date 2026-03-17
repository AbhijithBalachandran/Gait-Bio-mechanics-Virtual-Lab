// src/modules/m2-joint-biomechanics/E3_ankle_motion.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ExperimentShell, { type StepConfig } from '../../components/ExperimentShell';
import ContextStep from '../../steps/ContextStep';
import MaterialsStep from '../../steps/MaterialsStep';
import ProtocolStep from '../../steps/ProtocolStep';
import PracticeStep from '../../steps/PracticeStep';
import ReflectionStep from '../../steps/ReflectionStep';
import SummaryStep from '../../steps/SummaryStep';
import QuizEngine, { type QuizQuestion } from '../../components/QuizEngine';
import GaitCanvas from '../../components/GaitCanvas';
import SignalPlot, { type SignalChannel } from '../../components/SignalPlot';
import { generateGaitData, type GaitData } from '../../engine/syntheticGait';
import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════
   Experiment 3 — Ankle — The Propulsion Spring
   Stiffness slider changes propulsion and speed.
   ═══════════════════════════════════════════════════════ */

/* ── Results: Stiffness slider experiment ── */

function AnkleResults({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const [stiffness, setStiffness] = useState<number>(1.0);
  const [recordings, setRecordings] = useState<{ stiffness: number; speed: number; propulsion: number; peakPF: number }[]>([]);
  const [currentSample, setCurrentSample] = useState<number>(0);

  const gaitData: GaitData = useMemo(() => {
    return generateGaitData({
      height_cm: 170, weight_kg: 70, gender: 'male', age: 25,
      distance_m: 10, speed_ms: 1.2, noise: 0.1, seed: 400,
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSample((s) => (s + 1) % gaitData.nSamples);
    }, 10);
    return () => clearInterval(timer);
  }, [gaitData.nSamples]);

  // Stiffness modifies ankle amplitude and derived values
  const scaledAnkle = useMemo(() => {
    return gaitData.signals.ankleAngle.map((v) => v * stiffness);
  }, [gaitData.signals.ankleAngle, stiffness]);

  const peakPF = useMemo(() => {
    let max = -Infinity;
    const cycleLen = Math.round(gaitData.params.cycleTime * gaitData.sampleRate);
    for (let i = 0; i < Math.min(cycleLen, scaledAnkle.length); i++) {
      if (Math.abs(scaledAnkle[i]) > max) max = Math.abs(scaledAnkle[i]);
    }
    return parseFloat(max.toFixed(1));
  }, [scaledAnkle, gaitData]);

  const effectiveSpeed = parseFloat((gaitData.params.speed * (0.7 + stiffness * 0.3)).toFixed(2));
  const propulsionForce = parseFloat((70 * 9.81 * 0.25 * stiffness).toFixed(0));

  const channels: SignalChannel[] = useMemo(() => [
    { id: 'ankleAngle', label: 'Ankle Angle (°)', data: scaledAnkle, color: '#ff7a45', visible: true },
    { id: 'grfV', label: 'Vertical GRF (N)', data: gaitData.signals.grfVertical, color: '#a855f7', visible: true },
  ], [scaledAnkle, gaitData]);

  const handleRecord = useCallback((): void => {
    setRecordings((prev) => [...prev, {
      stiffness: parseFloat(stiffness.toFixed(1)),
      speed: effectiveSpeed,
      propulsion: propulsionForce,
      peakPF,
    }]);
  }, [stiffness, effectiveSpeed, propulsionForce, peakPF]);

  const handleComplete = useCallback((): void => {
    const score = recordings.length >= 3 ? 100 : Math.round((recordings.length / 3) * 100);
    onComplete?.(score);
  }, [recordings, onComplete]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Stiffness control */}
      <div style={{
        padding: '14px 18px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase' }}>
            Ankle Stiffness:
          </label>
          <input type="range" min={0.5} max={2.0} step={0.1} value={stiffness}
            onChange={(e) => setStiffness(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#ff7a45' }} />
          <span style={{
            fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--mono)',
            color: '#ff7a45', minWidth: '50px',
          }}>
            {stiffness.toFixed(1)}×
          </span>
        </div>

        {/* Dynamic metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {[
            { label: 'Walking Speed', value: `${effectiveSpeed} m/s`, color: '#4f8cff' },
            { label: 'Propulsion Force', value: `${propulsionForce} N`, color: '#ff7a45' },
            { label: 'Peak Plantarflex', value: `${peakPF}°`, color: '#a855f7' },
          ].map((m) => (
            <div key={m.label} style={{
              padding: '10px', borderRadius: '8px', background: 'var(--bg2)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.5rem', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '4px' }}>{m.label}</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--mono)', color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button className="btn-secondary" onClick={handleRecord} style={{ padding: '6px 14px', fontSize: '0.75rem' }}>
            📝 Record at {stiffness.toFixed(1)}×
          </button>
          {recordings.length >= 3 && (
            <button className="btn-primary" onClick={handleComplete} style={{ padding: '6px 14px', fontSize: '0.75rem' }}>
              Submit {recordings.length} recordings ✓
            </button>
          )}
        </div>
      </div>

      {/* Animation + signal */}
      <GaitCanvas gaitData={gaitData} speed={effectiveSpeed} width={600} height={200} />
      <SignalPlot channels={channels} sampleRate={100} windowSeconds={3} currentSample={currentSample} height={180} />

      {/* Recordings table */}
      {recordings.length > 0 && (
        <div style={{
          padding: '14px', borderRadius: '10px', background: 'var(--card)', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
            📋 Recorded Data ({recordings.length}/3 minimum)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', fontSize: '0.6875rem' }}>
            <div style={{ color: 'var(--text3)', fontWeight: 600 }}>Stiffness</div>
            <div style={{ color: 'var(--text3)', fontWeight: 600 }}>Speed</div>
            <div style={{ color: 'var(--text3)', fontWeight: 600 }}>Propulsion</div>
            <div style={{ color: 'var(--text3)', fontWeight: 600 }}>Peak PF</div>
            {recordings.map((r, i) => (
              <React.Fragment key={i}>
                <div style={{ fontFamily: 'var(--mono)', color: '#ff7a45' }}>{r.stiffness}×</div>
                <div style={{ fontFamily: 'var(--mono)', color: '#4f8cff' }}>{r.speed} m/s</div>
                <div style={{ fontFamily: 'var(--mono)', color: 'var(--text2)' }}>{r.propulsion} N</div>
                <div style={{ fontFamily: 'var(--mono)', color: '#a855f7' }}>{r.peakPF}°</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Spring metaphor */}
      <div style={{
        padding: '12px 16px', borderRadius: '10px', fontSize: '0.8125rem', lineHeight: 1.6,
        background: '#ff7a4510', borderLeft: '3px solid #ff7a45', color: 'var(--text2)',
      }}>
        🔧 <strong>Spring Model:</strong> Higher stiffness → more energy stored during dorsiflexion → more explosive push-off → faster speed. But too stiff → less shock absorption → more impact on knee/hip. The ankle is a tunable biological spring.
      </div>
    </div>
  );
}

/* ── Practice ── */

function AnklePractice(): React.JSX.Element {
  const [stiffness, setStiffness] = useState<number>(1.0);
  const gaitData: GaitData = useMemo(() => {
    return generateGaitData({
      height_cm: 170, weight_kg: 70, gender: 'male', age: 25,
      distance_m: 15, speed_ms: 1.2, noise: 0.3, seed: 410,
    });
  }, []);

  const scaledAnkle = useMemo(() => gaitData.signals.ankleAngle.map((v) => v * stiffness), [gaitData, stiffness]);
  const [currentSample, setCurrentSample] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSample((s) => (s + 1) % gaitData.nSamples);
    }, 10);
    return () => clearInterval(timer);
  }, [gaitData.nSamples]);

  const channels: SignalChannel[] = useMemo(() => [
    { id: 'ankleAngle', label: 'Ankle (°)', data: scaledAnkle, color: '#ff7a45', visible: true },
  ], [scaledAnkle]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>Stiffness:</label>
        <input type="range" min={0.3} max={2.5} step={0.1} value={stiffness}
          onChange={(e) => setStiffness(Number(e.target.value))}
          style={{ flex: 1, accentColor: '#ff7a45' }} />
        <span style={{ fontFamily: 'var(--mono)', color: '#ff7a45', fontSize: '0.875rem' }}>{stiffness.toFixed(1)}×</span>
      </div>
      <GaitCanvas gaitData={gaitData} speed={1.2 * (0.7 + stiffness * 0.3)} width={600} height={200} />
      <SignalPlot channels={channels} sampleRate={100} windowSeconds={3} currentSample={currentSample} height={160} />
    </div>
  );
}

/* ── Predictions ── */

function AnklePredictions({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const questions: QuizQuestion[] = [
    {
      type: 'fillin', id: 'ank-pred-1',
      question: 'What is the peak ankle plantarflexion angle at push-off (degrees)?',
      correctAnswer: 20, tolerance: 5, unit: '°',
      formula: 'Peak plantarflexion ≈ 20° at push-off',
      hint: 'The ankle actively pushes off the ground just before toe-off.',
    },
    {
      type: 'mc', id: 'ank-pred-2',
      question: 'If ankle stiffness increases, walking speed will:',
      options: ['Increase', 'Decrease', 'No effect', 'Reduce stability'],
      correctIndex: 0,
      explanation: 'Higher ankle stiffness stores more elastic energy, producing more explosive push-off and faster speed.',
      hint: 'Think of a stiffer spring — it rebounds more powerfully.',
    },
    {
      type: 'mc', id: 'ank-pred-3',
      question: 'How much energy is stored in the ankle tendon per step?',
      options: ['< 5 J', '5–15 J', '15–30 J', '> 30 J'],
      correctIndex: 2,
      explanation: 'The Achilles tendon stores approximately 15–30 J of elastic energy per step, making it the most efficient spring in human locomotion.',
      hint: 'The Achilles tendon is the largest and strongest tendon in the body.',
    },
  ];

  return (
    <div style={{ maxWidth: '640px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>🔮 Make Your Predictions</h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text3)', marginBottom: '20px' }}>Predict ankle mechanics and energy storage.</p>
      <QuizEngine questions={questions} onComplete={(_, totalScore) => onComplete?.(totalScore)} mode="prediction" />
    </div>
  );
}

/* ── Main Experiment ── */

function E3AnkleMotion(): React.JSX.Element {
  const steps: StepConfig[] = [
    {
      id: 'context', name: 'Context', xpReward: 10,
      component: (
        <ContextStep
          title="Ankle — The Propulsion Spring"
          body={`The ankle joint is the most remarkable energy-recycling mechanism in the human body. During mid-stance, the ankle dorsiflexes approximately 10° as the body passes over the foot, stretching the Achilles tendon like loading a spring. At push-off, this stored energy is released explosively as the ankle plantarflexes approximately 20°, propelling the body forward.

The Achilles tendon stores 15–30 joules of elastic energy per step — this is why humans walk with remarkable energy efficiency. The ankle generates approximately 50% of the total positive mechanical work during walking, making it the primary propulsive joint. The plantarflexor muscles (gastrocnemius, soleus) are the largest muscle group below the knee.

Ankle stiffness is a critical parameter: too stiff and the ankle loses its shock-absorbing capacity; too compliant and push-off power is diminished. This is why ankle joint replacements and fusions have such a profound impact on walking efficiency and comfort.`}
          statistic={{ value: '50%', label: 'of walking propulsion energy generated by ankle push-off' }}
          clinicalNote="Ankle arthritis or surgical fusion (arthrodesis) dramatically reduces walking efficiency by eliminating the spring-like energy storage-release mechanism. Patients compensate with increased hip flexor work, which leads to fatigue and reduced walking distance."
        />
      ),
    },
    {
      id: 'predictions', name: 'Predictions', xpReward: 20,
      component: <AnklePredictions />,
    },
    {
      id: 'materials', name: 'Materials', xpReward: 30,
      component: <MaterialsStep requiredPlacements={[{ sensorId: 'imu-foot', zone: 'LEFT_FOOT' }]} />,
    },
    {
      id: 'protocol', name: 'Protocol', xpReward: 20,
      component: (
        <ProtocolStep steps={[
          { id: 'p1', title: 'Observe Push-Off', description: 'Watch the animation closely at the moment of toe-off. Notice the explosive ankle plantarflexion that propels the body forward.', icon: '🦶' },
          { id: 'p2', title: 'Read the Stiffness Slider', description: 'Use the ankle stiffness slider to modify the ankle spring constant from 0.5× (very compliant) to 2.0× (very stiff).', icon: '🔧' },
          { id: 'p3', title: 'Watch Speed Change', description: 'As stiffness increases, note how walking speed, propulsion force, and peak plantarflexion all change. Higher stiffness = more power.', icon: '⚡' },
          { id: 'p4', title: 'Record 3 Conditions', description: 'Record data at 3 different stiffness settings (e.g., 0.5×, 1.0×, 2.0×). You need at least 3 recordings to complete this step.', icon: '📝' },
        ]} />
      ),
    },
    {
      id: 'results', name: 'Results', xpReward: 100, minScore: 60,
      component: <AnkleResults />,
    },
    {
      id: 'practice', name: 'Practice', xpReward: 50, minScore: 40,
      component: <PracticeStep simulationComponent={<AnklePractice />} timeLimitSeconds={60} minScore={40} />,
    },
    {
      id: 'reflection', name: 'Reflection', xpReward: 20,
      component: (
        <ReflectionStep questions={[
          { id: 'ank-ref-1', predictionKey: 'ank-pred-1', question: 'Peak plantarflexion', actualValue: '~20', unit: '°', explanation: 'Peak plantarflexion of ~20° occurs at push-off, generating the explosive propulsive force that drives forward progression.' },
          { id: 'ank-ref-2', predictionKey: 'ank-pred-2', question: 'Stiffness effect on speed', actualValue: 'Increases', unit: '', explanation: 'Higher stiffness → more elastic energy stored → more forceful push-off → higher walking speed. But excessive stiffness reduces shock absorption.' },
          { id: 'ank-ref-3', predictionKey: 'ank-pred-3', question: 'Tendon energy per step', actualValue: '15–30', unit: 'J', explanation: 'The Achilles tendon stores 15–30 J per step, making walking 50% more efficient than it would be without elastic energy return.' },
        ]} />
      ),
    },
    {
      id: 'summary', name: 'Summary', xpReward: 50,
      component: (
        <SummaryStep
          experimentTitle="Ankle — The Propulsion Spring"
          keyFormula="Push-off Power = F × v | Tendon Energy ≈ 15–30 J/step | PF ≈ 20°"
          keyConcept="The ankle is a biological spring: stores energy during dorsiflexion, releases during plantarflexion. Generates 50% of walking energy. Stiffness controls the speed-absorption tradeoff."
          moduleId="m2" expId="ankle-motion"
          nextExpPath="/experiment/m2/angle-angle-diagrams"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m2" expId="ankle-motion" steps={steps} />;
}

export default E3AnkleMotion;
