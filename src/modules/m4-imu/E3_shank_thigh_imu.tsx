// src/modules/m4-imu/E3_shank_thigh_imu.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ExperimentShell, { type StepConfig } from '../../components/ExperimentShell';
import ContextStep from '../../steps/ContextStep';
import MaterialsStep from '../../steps/MaterialsStep';
import ProtocolStep from '../../steps/ProtocolStep';
import PracticeStep from '../../steps/PracticeStep';
import ReflectionStep from '../../steps/ReflectionStep';
import SummaryStep from '../../steps/SummaryStep';
import QuizEngine, { type QuizQuestion } from '../../components/QuizEngine';
import SignalPlot, { type SignalChannel } from '../../components/SignalPlot';
import { generateGaitData } from '../../engine/syntheticGait';
import { applyLowPassFilter, addSensorNoise } from '../../engine/imuSimulator';

/* ═══════════════════════════════════════════════════════
   Experiment 3 — IMU Placement Comparison
   Foot vs Shank vs Thigh AccZ signals shown blind.
   Student drags/assigns labels to match signal patterns.
   ═══════════════════════════════════════════════════════ */

/* ── Generate placement-specific signals ── */

function usePlacementSignals() {
  return useMemo(() => {
    const base = generateGaitData({ height_cm: 170, weight_kg: 70, gender: 'male', age: 25, distance_m: 10, speed_ms: 1.2, noise: 0, seed: 800 });
    const accZ = base.signals.accZ;

    // Foot: high noise, sharp transients (raw)
    const footAccZ = addSensorNoise(accZ, 8, 101);  // SNR=8dB → noisy

    // Shank: smoothed, moderate noise (15Hz cutoff)
    const shankSmooth = applyLowPassFilter(accZ, 15, 100);
    const shankAccZ = addSensorNoise(shankSmooth, 18, 202);  // less noisy

    // Thigh: very smooth (6Hz cutoff), minimal noise, attenuated amplitude
    const thighSmooth = applyLowPassFilter(accZ, 6, 100);
    const thighAccZ = addSensorNoise(
      thighSmooth.map((v) => v * 0.55 + (9.81 * 0.45)),  // attenuated peaks
      26, 303
    );

    return { footAccZ, shankAccZ, thighAccZ, sampleRate: base.sampleRate, nSamples: base.nSamples };
  }, []);
}

/* ── Blind matching results ── */

type PlacementLabel = 'Foot' | 'Shank' | 'Thigh';

const SIGNAL_SLOTS = [
  { id: 'A', truePlacement: 'Foot' as PlacementLabel },    // Signal A = Foot (noisy, sharp)
  { id: 'B', truePlacement: 'Shank' as PlacementLabel },   // Signal B = Shank (medium)
  { id: 'C', truePlacement: 'Thigh' as PlacementLabel },   // Signal C = Thigh (smooth)
];

const PLACEMENT_COLORS: Record<PlacementLabel, string> = {
  Foot: '#4f8cff',
  Shank: '#00d4aa',
  Thigh: '#ffa940',
};

const PLACEMENT_DESCRIPTIONS: Record<PlacementLabel, string> = {
  Foot: 'Sharp impact transients, highest noise, most detailed gait events',
  Shank: 'Smoother envelope, shows tibial rotation, reduced noise floor',
  Thigh: 'Smoothest signal, attenuated amplitude, dominated by hip kinematics',
};

function ShankThighResults({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const { footAccZ, shankAccZ, thighAccZ, sampleRate, nSamples } = usePlacementSignals();
  const [currentSample, setCurrentSample] = useState(0);
  const [assignments, setAssignments] = useState<Record<string, PlacementLabel | null>>({ A: null, B: null, C: null });
  const [selectedLabel, setSelectedLabel] = useState<PlacementLabel | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setCurrentSample((s) => (s + 1) % nSamples), 10);
    return () => clearInterval(t);
  }, [nSamples]);

  const slotSignals: Record<string, number[]> = { A: footAccZ, B: shankAccZ, C: thighAccZ };

  const channels = (data: number[], color: string): SignalChannel[] => [
    { id: 'accZ', label: 'AccZ (m/s²)', data, color, visible: true },
  ];

  const usedLabels = Object.values(assignments).filter(Boolean) as PlacementLabel[];

  const handleSelectLabel = useCallback((label: PlacementLabel) => {
    if (submitted) return;
    setSelectedLabel((prev) => (prev === label ? null : label));
  }, [submitted]);

  const handleAssignSlot = useCallback((slotId: string) => {
    if (submitted || !selectedLabel) return;
    // Unassign label from any other slot first
    setAssignments((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (next[key] === selectedLabel) next[key] = null;
      }
      next[slotId] = selectedLabel;
      return next;
    });
    setSelectedLabel(null);
  }, [submitted, selectedLabel]);

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    const correct = SIGNAL_SLOTS.filter((s) => assignments[s.id] === s.truePlacement).length;
    onComplete?.(Math.round((correct / SIGNAL_SLOTS.length) * 100));
  }, [assignments, onComplete]);

  const allAssigned = SIGNAL_SLOTS.every((s) => assignments[s.id] !== null);

  const SLOT_COLORS = ['#4f8cff', '#00d4aa', '#ffa940'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ padding: '10px 16px', borderRadius: '8px', fontSize: '0.8125rem', background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.25)', color: 'var(--teal)' }}>
        🧩 <strong>Blind matching challenge:</strong> Click a placement label below, then click on the signal column to assign it. Match all 3 signals to their correct body placement.
      </div>

      {/* Label picker */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {(['Foot', 'Shank', 'Thigh'] as PlacementLabel[]).map((label) => {
          const isUsed = usedLabels.includes(label);
          const isSelected = selectedLabel === label;
          const color = PLACEMENT_COLORS[label];
          return (
            <button
              key={label}
              onClick={() => handleSelectLabel(label)}
              disabled={submitted || isUsed}
              style={{
                padding: '8px 20px', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600,
                cursor: submitted || isUsed ? 'not-allowed' : 'pointer',
                background: isSelected ? color + '30' : isUsed ? 'var(--bg2)' : 'var(--card)',
                border: `2px solid ${isSelected ? color : isUsed ? 'var(--border)' : color + '40'}`,
                color: isUsed ? 'var(--text3)' : color,
                opacity: isUsed ? 0.5 : 1,
                transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                transition: 'all 0.15s',
              }}
            >
              {isSelected ? '→ ' : ''}{label} IMU
            </button>
          );
        })}
        {selectedLabel && (
          <div style={{ padding: '8px 14px', fontSize: '0.75rem', color: 'var(--amber)', alignSelf: 'center' }}>
            ← Click a signal column to assign "{selectedLabel}"
          </div>
        )}
      </div>

      {/* Three signal columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {SIGNAL_SLOTS.map((slot, idx) => {
          const assigned = assignments[slot.id];
          const color = SLOT_COLORS[idx];
          const isCorrect = submitted && assigned === slot.truePlacement;
          const isWrong = submitted && assigned !== slot.truePlacement;
          return (
            <div
              key={slot.id}
              onClick={() => handleAssignSlot(slot.id)}
              style={{
                padding: '12px', borderRadius: '10px', background: 'var(--card)',
                border: `2px solid ${isCorrect ? '#00d4aa60' : isWrong ? '#ff525260' : selectedLabel ? color + '60' : 'var(--border)'}`,
                cursor: selectedLabel && !submitted ? 'pointer' : 'default',
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{ fontSize: '0.625rem', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Signal {slot.id}</span>
                {assigned && (
                  <span style={{ color: PLACEMENT_COLORS[assigned], fontSize: '0.5625rem', fontWeight: 700 }}>
                    {assigned}
                  </span>
                )}
              </div>

              {assigned ? (
                <div style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.5625rem', fontWeight: 700, background: PLACEMENT_COLORS[assigned] + '20', border: `1px solid ${PLACEMENT_COLORS[assigned]}50`, color: PLACEMENT_COLORS[assigned], marginBottom: '8px', textAlign: 'center' }}>
                  {assigned} IMU {submitted && (isCorrect ? '✓' : `✗ (${slot.truePlacement})`)}
                </div>
              ) : (
                <div style={{ padding: '4px', borderRadius: '6px', fontSize: '0.5625rem', color: 'var(--text3)', textAlign: 'center', border: '1px dashed var(--border)', marginBottom: '8px' }}>
                  — unassigned —
                </div>
              )}

              <SignalPlot
                channels={channels(slotSignals[slot.id], color)}
                sampleRate={sampleRate}
                windowSeconds={3}
                currentSample={currentSample}
                height={100}
              />
            </div>
          );
        })}
      </div>

      {/* Hints row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '0.625rem', color: 'var(--text3)' }}>
        <div>🔍 Look for: sharp impact spikes and high-frequency noise</div>
        <div>🔍 Look for: moderate noise, smoother envelope</div>
        <div>🔍 Look for: smoothest waveform, reduced amplitude</div>
      </div>

      {allAssigned && !submitted && (
        <button className="btn-primary" onClick={handleSubmit} style={{ padding: '10px 24px', alignSelf: 'center' }}>
          Submit Matching ✓
        </button>
      )}

      {submitted && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: '16px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--mono)', color: SIGNAL_SLOTS.filter((s) => assignments[s.id] === s.truePlacement).length === 3 ? 'var(--teal)' : 'var(--amber)' }}>
              {SIGNAL_SLOTS.filter((s) => assignments[s.id] === s.truePlacement).length}/3
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>Correct placements matched</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {SIGNAL_SLOTS.map((slot) => (
              <div key={slot.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg2)', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text2)' }}>Signal {slot.id}</span>
                <span style={{ color: PLACEMENT_COLORS[slot.truePlacement], fontWeight: 600 }}>Correct: {slot.truePlacement}</span>
                <span style={{ color: assignments[slot.id] === slot.truePlacement ? 'var(--teal)' : 'var(--red)' }}>
                  {assignments[slot.id] === slot.truePlacement ? '✓' : `✗ (you chose: ${assignments[slot.id]})`}
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', padding: '12px', borderRadius: '8px', background: '#ffa94010', border: '1px solid #ffa94030', fontSize: '0.75rem', color: 'var(--text2)', lineHeight: 1.6 }}>
            {(['Foot', 'Shank', 'Thigh'] as PlacementLabel[]).map((p) => (
              <div key={p} style={{ marginBottom: '4px' }}>
                <span style={{ color: PLACEMENT_COLORS[p], fontWeight: 600 }}>{p}: </span>{PLACEMENT_DESCRIPTIONS[p]}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ── Practice ── */

function ShankThighPractice(): React.JSX.Element {
  const { footAccZ, shankAccZ, thighAccZ, sampleRate, nSamples } = usePlacementSignals();
  const [currentSample, setCurrentSample] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrentSample((s) => (s + 1) % nSamples), 10);
    return () => clearInterval(t);
  }, [nSamples]);

  const allChannels: SignalChannel[] = [
    { id: 'foot', label: 'Foot AccZ', data: footAccZ, color: '#4f8cff', visible: true },
    { id: 'shank', label: 'Shank AccZ', data: shankAccZ, color: '#00d4aa', visible: true },
    { id: 'thigh', label: 'Thigh AccZ', data: thighAccZ, color: '#ffa940', visible: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', background: 'rgba(255,169,64,0.15)', border: '1px solid rgba(255,169,64,0.3)', color: 'var(--amber)' }}>
        ⚡ All 3 placements overlaid — observe noise levels and signal smoothness
      </div>
      <SignalPlot channels={allChannels} sampleRate={sampleRate} windowSeconds={3} currentSample={currentSample} height={200} />
    </div>
  );
}

/* ── Predictions ── */

function ShankThighPredictions({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const questions: QuizQuestion[] = [
    {
      type: 'mc', id: 'stimu-pred-1',
      question: 'Which IMU placement has the highest signal noise?',
      options: ['Foot', 'Shank', 'Thigh', 'All equal'],
      correctIndex: 0,
      explanation: 'The foot experiences the highest impact forces at heel strike and is furthest from the center of mass, resulting in the highest acceleration amplitudes and noise.',
      hint: 'Think about which body segment has the most direct contact with impact forces.',
    },
    {
      type: 'mc', id: 'stimu-pred-2',
      question: 'A thigh-mounted IMU primarily shows movement of which joint?',
      options: ['Knee', 'Hip', 'Ankle', 'Spine'],
      correctIndex: 1,
      explanation: 'The thigh segment is directly linked to hip kinematics. Thigh IMU captures the hip flexion-extension arc and can estimate hip angle with <3° error using sensor fusion.',
      hint: 'The thigh connects to which joint at its proximal end?',
    },
    {
      type: 'mc', id: 'stimu-pred-3',
      question: 'For automatic gait event detection (heel strike, toe-off), which placement is best?',
      options: ['Foot', 'Shank', 'Thigh', 'All same'],
      correctIndex: 0,
      explanation: 'The foot-mounted IMU provides the sharpest gait event signals — AccZ spike at heel strike and GyroY peak at swing — enabling >98% detection accuracy.',
      hint: 'Which placement is closest to the ground contact events?',
    },
  ];
  return (
    <div style={{ maxWidth: '640px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>🔮 Make Your Predictions</h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text3)', marginBottom: '20px' }}>Predict how IMU placement location affects signal characteristics.</p>
      <QuizEngine questions={questions} onComplete={(_, totalScore) => onComplete?.(totalScore)} mode="prediction" />
    </div>
  );
}

/* ── Main Experiment ── */

function E3ShankThighIMU(): React.JSX.Element {
  const steps: StepConfig[] = [
    {
      id: 'context', name: 'Context', xpReward: 10,
      component: (
        <ContextStep
          title="IMU Placement Comparison — Foot vs Shank vs Thigh"
          body={`The placement of an IMU on the body dramatically changes the character of the recorded signal. Each segment acts as a mechanical filter, transforming the raw impact energy from the ground into different signal profiles.

The foot IMU sits closest to the ground contact events. It captures sharp, high-frequency transients — the sudden spike of heel impact, the rapid rotation of swing, the quiet flatness of stance. High amplitude, high noise, but rich in timing information.

The shank (tibia) acts as a spring-damper between foot and knee. Its IMU signal is smoother, with less impact transient energy but better reflection of tibial rotation and shank kinematics during stance. The shank is the gold standard for stride segmentation algorithms.

The thigh is furthest from ground impact. Its IMU signal is the smoothest — dominated by the hip flexion-extension arc, with minimal high-frequency content. This makes it ideal for hip angle estimation (with <3° error) and more robust to environment noise, which is why thigh IMU is preferred for fall detection in the elderly.`}
          statistic={{ value: '<3°', label: 'hip angle estimation error using thigh IMU with sensor fusion' }}
          clinicalNote="For fall detection algorithms, thigh IMU is preferred — it stays mechanically stable and the signal is less contaminated by external vibrations. For precise gait event timing (heel strike, toe-off), foot IMU remains the gold standard. Kinetrax uses foot IMU for event detection."
        />
      ),
    },
    { id: 'predictions', name: 'Predictions', xpReward: 20, component: <ShankThighPredictions /> },
    {
      id: 'materials', name: 'Materials', xpReward: 30,
      component: (
        <MaterialsStep requiredPlacements={[
          { sensorId: 'imu-foot', zone: 'LEFT_FOOT' },
          { sensorId: 'imu-shank', zone: 'LEFT_SHANK' },
          { sensorId: 'imu-thigh', zone: 'LEFT_THIGH' },
        ]} />
      ),
    },
    {
      id: 'protocol', name: 'Protocol', xpReward: 20,
      component: (
        <ProtocolStep steps={[
          { id: 'p1', title: 'Three Anonymous Signals', description: 'You will see three AccZ signals labeled Signal A, B, and C. The placement identities are hidden — your job is to match them to Foot, Shank, or Thigh based on signal characteristics.', icon: '🔍' },
          { id: 'p2', title: 'Identify the Noisiest', description: 'One signal has sharp impact spikes and high-frequency noise — that is the Foot. Look for the one with the most prominent transients and highest baseline variability.', icon: '🦶' },
          { id: 'p3', title: 'Identify the Smoothest', description: 'One signal is the smoothest with attenuated amplitude — that is the Thigh. The waveform peaks are lower and the signal is free of high-frequency content.', icon: '🦵' },
          { id: 'p4', title: 'Assign Labels by Clicking', description: 'Click a placement label button (Foot/Shank/Thigh) to select it, then click the signal column to assign it. Once all 3 are assigned, submit your matching.', icon: '🎯' },
        ]} />
      ),
    },
    {
      id: 'results', name: 'Results', xpReward: 100, minScore: 60,
      component: <ShankThighResults />,
    },
    {
      id: 'practice', name: 'Practice', xpReward: 50, minScore: 40,
      component: (
        <PracticeStep
          simulationComponent={<ShankThighPractice />}
          timeLimitSeconds={60}
          minScore={40}
        />
      ),
    },
    {
      id: 'reflection', name: 'Reflection', xpReward: 20,
      component: (
        <ReflectionStep questions={[
          { id: 'r1', predictionKey: 'stimu-pred-1', question: 'Highest signal noise placement?', actualValue: 'Foot', unit: '', explanation: 'The foot experiences direct ground impact. AccZ spikes at heel strike create high-amplitude transients. Noise floor is highest due to proximity to impact.' },
          { id: 'r2', predictionKey: 'stimu-pred-2', question: 'Thigh IMU primarily reflects which joint?', actualValue: 'Hip', unit: '', explanation: 'The thigh segment rotates about the hip joint during gait. Thigh IMU captures the full hip flexion-extension arc with <3° error using complementary filtering.' },
          { id: 'r3', predictionKey: 'stimu-pred-3', question: 'Best placement for gait event detection?', actualValue: 'Foot', unit: '', explanation: 'Foot IMU provides the sharpest gait event markers: AccZ spike (heel strike) and GyroY peak (swing). Shank and thigh signals are too smooth for precise event timing.' },
        ]} />
      ),
    },
    {
      id: 'summary', name: 'Summary', xpReward: 50,
      component: (
        <SummaryStep
          experimentTitle="IMU Placement Comparison — Foot vs Shank vs Thigh"
          keyFormula="Foot = high noise, sharp events | Shank = tibial rotation, moderate | Thigh = smooth, hip kinematics"
          keyConcept="IMU placement fundamentally changes signal character. Foot: sharp gait events, highest noise, best for timing. Shank: tibial kinematics, good for stride segmentation. Thigh: smoothest, best for hip angle estimation and fall detection."
          moduleId="m4"
          expId="shank-thigh-imu"
          nextExpPath="/experiment/m4/sensor-fusion"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m4" expId="shank-thigh-imu" steps={steps} />;
}

export default E3ShankThighIMU;
