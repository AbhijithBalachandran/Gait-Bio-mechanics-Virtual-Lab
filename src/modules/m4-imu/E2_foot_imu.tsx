// src/modules/m4-imu/E2_foot_imu.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
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
import { GaitPhase } from '../../types/enums';

/* ═══════════════════════════════════════════════════════
   Experiment 2 — IMU Signals at the Foot
   AccZ spike at heel strike, GyroY peak during swing,
   near-static stance. Student marks events on signal.
   ═══════════════════════════════════════════════════════ */

/* ── Event marker targets (% of gait cycle) ── */

interface EventMarker {
  id: string;
  label: string;
  description: string;
  targetPhases: GaitPhase[];
  color: string;
  userPhase: GaitPhase | null;
  correct: boolean | null;
}

const INITIAL_MARKERS: EventMarker[] = [
  { id: 'hs', label: 'Heel Strike Spike', description: 'AccZ spikes highest — mark when AccZ peaks after foot landing', targetPhases: [GaitPhase.HeelStrike, GaitPhase.FootFlat], color: '#4f8cff', userPhase: null, correct: null },
  { id: 'stance', label: 'Stance Quiet Period', description: 'AccZ near baseline — mark during quiet mid-stance', targetPhases: [GaitPhase.MidStance], color: '#00d4aa', userPhase: null, correct: null },
  { id: 'swing', label: 'Swing GyroY Peak', description: 'GyroY highest (~120°/s) — mark during peak foot rotation', targetPhases: [GaitPhase.MidSwing], color: '#ffa940', userPhase: null, correct: null },
];

/* ── Results ── */

function FootIMUResults({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const [speed, setSpeed] = useState(1.2);
  const [gaitData, setGaitData] = useState<GaitData | null>(null);
  const [currentSample, setCurrentSample] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<GaitPhase>(GaitPhase.HeelStrike);
  const [markers, setMarkers] = useState<EventMarker[]>(INITIAL_MARKERS.map((m) => ({ ...m })));
  const [activeIdx, setActiveIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const data = generateGaitData({ height_cm: 170, weight_kg: 70, gender: 'male', age: 25, distance_m: 12, speed_ms: speed, noise: 0.12, seed: 720 });
    setGaitData(data);
    setCurrentSample(0);
  }, [speed]);

  useEffect(() => {
    if (!gaitData) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentSample((s) => (s + 1) % gaitData.nSamples);
    }, 10);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gaitData]);

  const channels: SignalChannel[] = useMemo(() => {
    if (!gaitData) return [];
    return [
      { id: 'accZ', label: 'AccZ (m/s²)', data: gaitData.signals.accZ, color: '#4f8cff', visible: true },
      { id: 'accX', label: 'AccX (m/s²)', data: gaitData.signals.accX, color: '#00d4aa', visible: true },
      { id: 'gyroY', label: 'GyroY (°/s)', data: gaitData.signals.gyroY, color: '#ffa940', visible: true },
    ];
  }, [gaitData]);

  const handlePlaceMarker = useCallback(() => {
    if (submitted || activeIdx >= INITIAL_MARKERS.length) return;
    const target = markers[activeIdx];
    const isCorrect = target.targetPhases.includes(currentPhase);
    setMarkers((prev) => {
      const next = [...prev];
      next[activeIdx] = { ...next[activeIdx], userPhase: currentPhase, correct: isCorrect };
      return next;
    });
    if (activeIdx + 1 < INITIAL_MARKERS.length) {
      setActiveIdx(activeIdx + 1);
    }
  }, [submitted, activeIdx, markers, currentPhase]);

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    const correctCount = markers.filter((m) => m.correct === true || (m.userPhase !== null && m.correct !== null && m.correct)).length;
    const placed = markers.filter((m) => m.userPhase !== null).length;
    const score = placed > 0 ? Math.round((markers.filter((m) => m.correct).length / INITIAL_MARKERS.length) * 100) : 0;
    onComplete?.(score);
  }, [markers, onComplete]);

  const allPlaced = markers.every((m) => m.userPhase !== null);
  const activeMarker = activeIdx < INITIAL_MARKERS.length ? markers[activeIdx] : null;

  const phaseLabel: Record<GaitPhase, string> = {
    [GaitPhase.HeelStrike]: 'Heel Strike',
    [GaitPhase.FootFlat]: 'Foot Flat',
    [GaitPhase.MidStance]: 'Mid Stance',
    [GaitPhase.HeelOff]: 'Heel Off',
    [GaitPhase.ToeOff]: 'Toe Off',
    [GaitPhase.MidSwing]: 'Mid Swing',
    [GaitPhase.TerminalSwing]: 'Terminal Swing',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Speed control */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text2)', minWidth: '60px' }}>Speed:</span>
        <input type="range" min={0.6} max={1.8} step={0.1} value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--amber)' }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--amber)', fontFamily: 'var(--mono)', minWidth: '50px' }}>
          {speed.toFixed(1)} m/s
        </span>
      </div>

      {/* Active marker instruction */}
      {activeMarker && !submitted && (
        <div style={{ padding: '10px 16px', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600, background: activeMarker.color + '18', border: `1px solid ${activeMarker.color}40`, color: activeMarker.color, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🎯 Mark: <strong>{activeMarker.label}</strong> — {activeMarker.description}</span>
          <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--mono)', color: 'var(--text2)' }}>
            Phase: {phaseLabel[currentPhase]}
          </span>
        </div>
      )}

      {/* Phase badge */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.625rem', fontWeight: 700, background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text2)' }}>
          Current Phase: <span style={{ color: 'var(--accent)' }}>{phaseLabel[currentPhase]}</span>
        </div>
      </div>

      {/* Marker status */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {markers.map((m, i) => (
          <div key={m.id} style={{
            padding: '4px 12px', borderRadius: '20px', fontSize: '0.625rem', fontWeight: 600,
            background: m.userPhase !== null ? (m.correct ? '#00d4aa20' : '#ff525220') : i === activeIdx ? m.color + '25' : 'var(--card)',
            border: `1px solid ${m.userPhase !== null ? (m.correct ? '#00d4aa50' : '#ff525250') : i === activeIdx ? m.color + '60' : 'var(--border)'}`,
            color: m.userPhase !== null ? (m.correct ? 'var(--teal)' : 'var(--red)') : i === activeIdx ? m.color : 'var(--text3)',
          }}>
            {m.userPhase !== null ? (m.correct ? '✓' : '✗') : i === activeIdx ? '◉' : '○'} {m.label}
          </div>
        ))}
      </div>

      {/* GaitCanvas */}
      <GaitCanvas gaitData={gaitData} speed={speed} width={600} height={170} onPhaseChange={setCurrentPhase} />

      {/* Signal Plots — clickable */}
      <div
        onClick={!submitted && activeMarker ? handlePlaceMarker : undefined}
        style={{ cursor: !submitted && activeMarker ? 'crosshair' : 'default' }}
      >
        {!submitted && activeMarker && (
          <div style={{ textAlign: 'center', fontSize: '0.6875rem', color: activeMarker.color, marginBottom: '4px', fontWeight: 600 }}>
            ↓ Click the signal area to place marker: {activeMarker.label}
          </div>
        )}
        <SignalPlot channels={channels} sampleRate={100} windowSeconds={4} currentSample={currentSample} height={200} showPhaseMarkers />
      </div>

      {/* Submit */}
      {allPlaced && !submitted && (
        <button className="btn-primary" onClick={handleSubmit} style={{ padding: '10px 24px', alignSelf: 'center' }}>
          Submit All Markers ✓
        </button>
      )}

      {/* Score */}
      {submitted && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: '16px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--mono)', color: markers.filter((m) => m.correct).length === INITIAL_MARKERS.length ? 'var(--teal)' : 'var(--amber)' }}>
            {markers.filter((m) => m.correct).length}/{INITIAL_MARKERS.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text2)', marginTop: '4px' }}>Events correctly identified</div>
        </motion.div>
      )}

      <div style={{ padding: '12px 16px', borderRadius: '10px', fontSize: '0.8125rem', lineHeight: 1.6, background: '#4f8cff10', borderLeft: '3px solid #4f8cff', color: 'var(--text2)' }}>
        💡 <strong>Key signals:</strong> AccZ spikes at heel strike (impact force). GyroY peaks (~120°/s) at mid-swing as foot rotates forward. Stance phase = quiet/flat signal. These 3 features enable automatic gait event detection with &gt;98% accuracy.
      </div>
    </div>
  );
}

/* ── Practice ── */

function FootIMUPractice(): React.JSX.Element {
  const gaitData = useMemo(() => generateGaitData({
    height_cm: 168, weight_kg: 65, gender: 'female', age: 30,
    distance_m: 10, speed_ms: 0.9 + Math.random() * 0.8, noise: 0.4, seed: 730,
  }), []);
  const [currentSample, setCurrentSample] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrentSample((s) => (s + 1) % gaitData.nSamples), 10);
    return () => clearInterval(t);
  }, [gaitData.nSamples]);

  const channels: SignalChannel[] = useMemo(() => [
    { id: 'accZ', label: 'AccZ', data: gaitData.signals.accZ, color: '#4f8cff', visible: true },
    { id: 'gyroY', label: 'GyroY', data: gaitData.signals.gyroY, color: '#ffa940', visible: true },
  ], [gaitData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', background: 'rgba(255,169,64,0.15)', border: '1px solid rgba(255,169,64,0.3)', color: 'var(--amber)' }}>
        ⚡ Mystery subject — different speed + noise=0.4. Identify heel strikes and swing peaks.
      </div>
      <SignalPlot channels={channels} sampleRate={100} windowSeconds={4} currentSample={currentSample} height={180} showPhaseMarkers />
    </div>
  );
}

/* ── Predictions ── */

function FootIMUPredictions({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const questions: QuizQuestion[] = [
    {
      type: 'mc', id: 'fimu-pred-1',
      question: 'During which gait phase does AccZ spike highest on a foot-mounted IMU?',
      options: ['Heel Strike', 'Mid Stance', 'Toe Off', 'Swing'],
      correctIndex: 0,
      explanation: 'At heel strike, the foot impacts the ground creating a sudden vertical deceleration. AccZ spikes sharply — often 2-3× the gravity baseline.',
      hint: 'Think about the moment of maximum impact force — when does the foot first contact the ground?',
    },
    {
      type: 'fillin', id: 'fimu-pred-2',
      question: 'What is the approximate peak GyroY during normal walking (°/s)?',
      correctAnswer: 120, tolerance: 20, unit: '°/s',
      formula: 'Peak GyroY ≈ 120°/s at mid-swing during normal walking at ~1.2 m/s',
      hint: 'The foot swings forward rapidly during swing phase. Think about how fast a foot rotates.',
    },
    {
      type: 'mc', id: 'fimu-pred-3',
      question: 'During mid-stance, the foot IMU signal is approximately?',
      options: ['At maximum amplitude', 'Near-static / minimal motion', 'Oscillating rapidly', 'Zero in all axes'],
      correctIndex: 1,
      explanation: 'During stance, the foot is flat on the ground with minimal motion. AccZ ≈ 9.81 m/s² (gravity), gyroscopes near zero.',
      hint: 'The foot is not moving during this phase — it\'s weight-bearing.',
    },
  ];
  return (
    <div style={{ maxWidth: '640px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>🔮 Make Your Predictions</h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text3)', marginBottom: '20px' }}>Predict the foot IMU signal characteristics before running the experiment.</p>
      <QuizEngine questions={questions} onComplete={(_, totalScore) => onComplete?.(totalScore)} mode="prediction" />
    </div>
  );
}

/* ── Main Experiment ── */

function E2FootIMU(): React.JSX.Element {
  const steps: StepConfig[] = [
    {
      id: 'context', name: 'Context', xpReward: 10,
      component: (
        <ContextStep
          title="IMU Signals at the Foot"
          body={`A foot-mounted IMU captures some of the most information-rich signals in gait biomechanics. At each heel strike, the rapid foot deceleration creates a sharp spike in vertical acceleration (AccZ) — this is the sensor feeling the impact of landing. The AccZ spike is so consistent and distinctive that it can be used to detect every heel strike with over 98% accuracy.

During stance phase, the foot is flat on the ground, minimally moving. The IMU signal becomes quiet: AccZ ≈ 9.81 m/s² (just gravity), gyroscopes near zero. This "quiet window" is the hallmark of stance and distinguishes it from swing.

As the foot leaves the ground during swing, it rotates rapidly forward. The sagittal gyroscope (GyroY) peaks at approximately 120°/s during mid-swing in normal walking. This GyroY peak is used to detect toe-off and mid-swing events in the Kinetrax algorithm.`}
          statistic={{ value: '>98%', label: 'heel strike detection accuracy using foot IMU threshold method' }}
          clinicalNote="The Kinetrax device uses the BNO055 IMU on the foot to detect heel strike and toe-off in real time. This enables automatic stride segmentation without force plates. Key events detected: heel strike (AccZ spike), toe-off (GyroY onset), and mid-swing (GyroY peak)."
        />
      ),
    },
    { id: 'predictions', name: 'Predictions', xpReward: 20, component: <FootIMUPredictions /> },
    {
      id: 'materials', name: 'Materials', xpReward: 30,
      component: <MaterialsStep requiredPlacements={[{ sensorId: 'imu-foot', zone: 'LEFT_FOOT' }]} />,
    },
    {
      id: 'protocol', name: 'Protocol', xpReward: 20,
      component: (
        <ProtocolStep steps={[
          { id: 'p1', title: 'Observe Three Live Signals', description: 'Three channels are displayed: AccZ (blue, vertical acceleration), AccX (teal, forward acceleration), and GyroY (amber, sagittal rotation). Watch them scroll as the figure walks.', icon: '📡' },
          { id: 'p2', title: 'Find the Heel Strike Spike', description: 'At heel strike, AccZ spikes dramatically above baseline. The phase indicator shows "Heel Strike" or "Foot Flat" when this occurs. Watch for the sharp blue peak.', icon: '💥' },
          { id: 'p3', title: 'Find the Swing GyroY Peak', description: 'During mid-swing, GyroY (amber) peaks as the foot swings forward rapidly at ~120°/s. The phase indicator will show "Mid Swing".', icon: '🔄' },
          { id: 'p4', title: 'Mark Events by Clicking', description: 'Click the signal area when the correct phase is active to place each event marker. The current phase is shown in the badge above. Mark all 3 events, then submit.', icon: '🎯' },
        ]} />
      ),
    },
    {
      id: 'results', name: 'Results', xpReward: 100, minScore: 60,
      component: <FootIMUResults />,
    },
    {
      id: 'practice', name: 'Practice', xpReward: 50, minScore: 40,
      component: (
        <PracticeStep
          simulationComponent={<FootIMUPractice />}
          timeLimitSeconds={60}
          minScore={40}
        />
      ),
    },
    {
      id: 'reflection', name: 'Reflection', xpReward: 20,
      component: (
        <ReflectionStep questions={[
          { id: 'r1', predictionKey: 'fimu-pred-1', question: 'AccZ spikes highest during?', actualValue: 'Heel Strike', unit: '', explanation: 'The sudden foot impact at heel strike creates a large vertical deceleration. AccZ spike is the most reliable heel-strike detector in foot IMU gait analysis.' },
          { id: 'r2', predictionKey: 'fimu-pred-2', question: 'Peak GyroY during normal walking?', actualValue: '~120', unit: '°/s', explanation: 'During mid-swing, the foot rotates forward at ~120°/s in normal walking at 1.2 m/s. This increases with faster walking speed.' },
          { id: 'r3', predictionKey: 'fimu-pred-3', question: 'Signal during mid-stance?', actualValue: 'Near-static', unit: '', explanation: 'During stance, the foot is planted. AccZ ≈ 9.81 m/s² (gravity only), all gyroscope channels near zero. This quiet window is characteristic of stance.' },
        ]} />
      ),
    },
    {
      id: 'summary', name: 'Summary', xpReward: 50,
      component: (
        <SummaryStep
          experimentTitle="IMU Signals at the Foot"
          keyFormula="Heel Strike → AccZ spike | Mid-Swing → GyroY peak (~120°/s) | Stance → near-static signal"
          keyConcept="Foot IMU provides automatic gait event detection with >98% accuracy. AccZ spike detects heel strike (impact), GyroY peak detects mid-swing (foot rotation), and the quiet stance window identifies weight-bearing. Kinetrax uses these features in real time."
          moduleId="m4"
          expId="foot-imu"
          nextExpPath="/experiment/m4/shank-thigh-imu"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m4" expId="foot-imu" steps={steps} />;
}

export default E2FootIMU;
