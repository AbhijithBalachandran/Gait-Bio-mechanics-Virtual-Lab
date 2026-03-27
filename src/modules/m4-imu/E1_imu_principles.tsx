// src/modules/m4-imu/E1_imu_principles.tsx
import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import ExperimentShell, { type StepConfig } from '../../components/ExperimentShell';
import ContextStep from '../../steps/ContextStep';
import MaterialsStep from '../../steps/MaterialsStep';
import ProtocolStep from '../../steps/ProtocolStep';
import PracticeStep from '../../steps/PracticeStep';
import ReflectionStep from '../../steps/ReflectionStep';
import SummaryStep from '../../steps/SummaryStep';
import QuizEngine, { type QuizQuestion } from '../../components/QuizEngine';

/* ═══════════════════════════════════════════════════════
   Experiment 1 — How IMU Sensors Work
   Interactive 3D box with CSS 3D transforms.
   6-axis signal bars updated from rotation angles.
   Badge: sensor-novice
   ═══════════════════════════════════════════════════════ */

/* ── 3D IMU Cube ── */

function IMUBox3D({ rotX, rotY }: { rotX: number; rotY: number }): React.JSX.Element {
  const face = (transform: string, bg: string, label: string): React.JSX.Element => (
    <div style={{
      position: 'absolute', width: '80px', height: '80px',
      background: bg, border: '1px solid rgba(255,255,255,0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.5625rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)',
      transform, backfaceVisibility: 'hidden',
    }}>
      {label}
    </div>
  );

  return (
    <div style={{
      width: '80px', height: '80px', position: 'relative',
      transformStyle: 'preserve-3d',
      transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
      transition: 'transform 0.03s linear',
    }}>
      {face('translateZ(40px)',  'rgba(79,140,255,0.55)',  '+Z ↑ up')}
      {face('rotateY(180deg) translateZ(40px)', 'rgba(79,140,255,0.25)', '-Z')}
      {face('rotateY(90deg) translateZ(40px)',  'rgba(0,212,170,0.50)', '+X fwd')}
      {face('rotateY(-90deg) translateZ(40px)', 'rgba(0,212,170,0.25)', '-X')}
      {face('rotateX(-90deg) translateZ(40px)', 'rgba(255,169,64,0.50)', '+Y lat')}
      {face('rotateX(90deg) translateZ(40px)',  'rgba(255,169,64,0.25)', '-Y')}
    </div>
  );
}

/* ── Horizontal signal bar ── */

interface BarProps { label: string; value: number; max: number; color: string; unit: string }
function SignalBar({ label, value, max, color, unit }: BarProps): React.JSX.Element {
  const pct = Math.min(100, (Math.abs(value) / max) * 100);
  const isNeg = value < 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
      <div style={{ width: '50px', fontSize: '0.625rem', color: 'var(--text2)', fontFamily: 'var(--mono)', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: '14px', background: 'var(--bg2)', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, width: '1px', height: '100%', background: 'var(--border)' }} />
        <div style={{
          position: 'absolute', height: '100%', width: `${pct / 2}%`,
          background: color, transition: 'all 0.04s',
          left: isNeg ? `${50 - pct / 2}%` : '50%',
        }} />
      </div>
      <div style={{ width: '70px', fontSize: '0.5625rem', color, fontFamily: 'var(--mono)', textAlign: 'right', flexShrink: 0 }}>
        {value.toFixed(2)} {unit}
      </div>
    </div>
  );
}

/* ── Results ── */

const AXIS_QUESTIONS = [
  { id: 'q1', text: 'Tilt the sensor FORWARD (top away from you). Which accelerometer axis responds most?', correct: 'AccX', options: ['AccX', 'AccY', 'AccZ', 'GyroY'] },
  { id: 'q2', text: 'Tilt the sensor SIDEWAYS (left or right). Which accelerometer axis responds most?', correct: 'AccY', options: ['AccX', 'AccY', 'AccZ', 'GyroX'] },
  { id: 'q3', text: 'When the sensor sits flat and level (no tilt), which axis reads ~9.81 m/s²?', correct: 'AccZ', options: ['AccX', 'AccY', 'AccZ', 'GyroZ'] },
];

function IMUPrinciplesResults({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const [rotX, setRotX] = useState(18);
  const [rotY, setRotY] = useState(-28);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const toRad = (d: number) => (d * Math.PI) / 180;
  const accX = Math.sin(toRad(rotY)) * 9.81;
  const accY = -Math.sin(toRad(rotX)) * 9.81;
  const accZ = Math.cos(toRad(rotX)) * Math.cos(toRad(rotY)) * 9.81;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }, []);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setRotY((r) => r + dx * 0.55);
    setRotX((r) => r + dy * 0.55);
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);
  const handleMouseUp = useCallback(() => { isDragging.current = false; }, []);

  const handleAnswer = (qId: string, opt: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: opt }));
  };

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    const correct = AXIS_QUESTIONS.filter((q) => answers[q.id] === q.correct).length;
    onComplete?.(Math.round((correct / AXIS_QUESTIONS.length) * 100));
  }, [answers, onComplete]);

  const allAnswered = AXIS_QUESTIONS.every((q) => answers[q.id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ padding: '10px 16px', borderRadius: '8px', fontSize: '0.8125rem', background: 'rgba(79,140,255,0.1)', border: '1px solid rgba(79,140,255,0.25)', color: 'var(--accent)' }}>
        🖱️ <strong>Drag the 3D sensor box</strong> to rotate it. Watch the 6 signal bars change in real-time, then answer the axis identification questions below.
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* 3D Box */}
        <div
          style={{ perspective: '420px', cursor: 'grab', userSelect: 'none', flexShrink: 0 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div style={{ width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <IMUBox3D rotX={rotX} rotY={rotY} />
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.5625rem', color: 'var(--text3)', marginTop: '6px' }}>
            BNO055 IMU — drag to rotate
          </div>
        </div>

        {/* Signal Bars */}
        <div style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ fontSize: '0.625rem', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px', letterSpacing: '0.05em' }}>
            Accelerometer
          </div>
          <SignalBar label="AccX" value={accX} max={12} color="#4f8cff" unit="m/s²" />
          <SignalBar label="AccY" value={accY} max={12} color="#00d4aa" unit="m/s²" />
          <SignalBar label="AccZ" value={accZ} max={12} color="#ffa940" unit="m/s²" />
          <div style={{ fontSize: '0.625rem', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px', marginTop: '14px', letterSpacing: '0.05em' }}>
            Gyroscope (rotate sensor quickly)
          </div>
          <SignalBar label="GyroX" value={0} max={200} color="#a855f7" unit="°/s" />
          <SignalBar label="GyroY" value={0} max={200} color="#ff5252" unit="°/s" />
          <SignalBar label="GyroZ" value={0} max={200} color="#52e5a0" unit="°/s" />
          <div style={{ marginTop: '8px', fontSize: '0.6875rem', color: 'var(--text3)', lineHeight: 1.5 }}>
            ℹ️ Gyro shows live angular velocity — fast drags simulate rotation rate.
          </div>
        </div>
      </div>

      {/* Orientation info */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { label: 'AccX = forward/back', color: '#4f8cff' },
          { label: 'AccY = left/right', color: '#00d4aa' },
          { label: 'AccZ = vertical', color: '#ffa940' },
        ].map((t) => (
          <div key={t.label} style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.625rem', fontWeight: 600, color: t.color, background: t.color + '18', border: `1px solid ${t.color}30` }}>
            {t.label}
          </div>
        ))}
      </div>

      {/* Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {AXIS_QUESTIONS.map((q) => {
          const ans = answers[q.id];
          const isCorrect = submitted && ans === q.correct;
          const isWrong = submitted && ans !== q.correct;
          return (
            <div key={q.id} style={{
              padding: '14px 16px', borderRadius: '10px', background: 'var(--card)',
              border: `1px solid ${isCorrect ? 'rgba(0,212,170,0.4)' : isWrong ? 'rgba(255,82,82,0.4)' : 'var(--border)'}`,
            }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text)', marginBottom: '10px', fontWeight: 500 }}>{q.text}</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {q.options.map((opt) => {
                  const selected = ans === opt;
                  const showCorrect = submitted && opt === q.correct;
                  return (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(q.id, opt)}
                      style={{
                        padding: '5px 14px', borderRadius: '6px', fontSize: '0.75rem',
                        fontFamily: 'var(--mono)', cursor: submitted ? 'default' : 'pointer',
                        background: showCorrect ? '#00d4aa20' : selected ? 'rgba(79,140,255,0.2)' : 'var(--bg2)',
                        border: `1px solid ${showCorrect ? '#00d4aa60' : selected ? 'rgba(79,140,255,0.5)' : 'var(--border)'}`,
                        color: showCorrect ? 'var(--teal)' : selected ? 'var(--accent)' : 'var(--text2)',
                        fontWeight: showCorrect ? 700 : 400,
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <div style={{ marginTop: '8px', fontSize: '0.6875rem', color: isCorrect ? 'var(--teal)' : 'var(--red)' }}>
                  {isCorrect ? '✓ Correct!' : `✗ Answer: ${q.correct}`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!submitted && (
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={!allAnswered}
          style={{ padding: '10px 24px', alignSelf: 'flex-start', opacity: allAnswered ? 1 : 0.5 }}
        >
          Submit Answers ✓
        </button>
      )}

      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: '16px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)', textAlign: 'center' }}
        >
          <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--teal)' }}>
            {AXIS_QUESTIONS.filter((q) => answers[q.id] === q.correct).length}/{AXIS_QUESTIONS.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>Axis identification score</div>
        </motion.div>
      )}
    </div>
  );
}

/* ── Practice ── */

function IMUPracticeBox(): React.JSX.Element {
  const [rotX, setRotX] = useState(20);
  const [rotY, setRotY] = useState(-30);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const toRad = (d: number) => (d * Math.PI) / 180;
  const accX = Math.sin(toRad(rotY)) * 9.81;
  const accY = -Math.sin(toRad(rotX)) * 9.81;
  const accZ = Math.cos(toRad(rotX)) * Math.cos(toRad(rotY)) * 9.81;

  const handleMouseDown = (e: React.MouseEvent) => { isDragging.current = true; lastPos.current = { x: e.clientX, y: e.clientY }; e.preventDefault(); };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setRotY((r) => r + (e.clientX - lastPos.current.x) * 0.55);
    setRotX((r) => r + (e.clientY - lastPos.current.y) * 0.55);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseUp = () => { isDragging.current = false; };

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ perspective: '420px', cursor: 'grab', userSelect: 'none', flexShrink: 0 }}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        <div style={{ width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg2)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <IMUBox3D rotX={rotX} rotY={rotY} />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: '180px' }}>
        <div style={{ fontSize: '0.625rem', color: 'var(--amber)', marginBottom: '8px', fontWeight: 600 }}>🎯 Try to maximize each axis individually</div>
        <SignalBar label="AccX" value={accX} max={12} color="#4f8cff" unit="m/s²" />
        <SignalBar label="AccY" value={accY} max={12} color="#00d4aa" unit="m/s²" />
        <SignalBar label="AccZ" value={accZ} max={12} color="#ffa940" unit="m/s²" />
      </div>
    </div>
  );
}

/* ── Predictions ── */

function IMUPredictions({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const questions: QuizQuestion[] = [
    {
      type: 'mc', id: 'imu-pred-1',
      question: 'An accelerometer measures which physical quantity?',
      options: ['Velocity', 'Acceleration', 'Position', 'Angle'],
      correctIndex: 1,
      explanation: 'Accelerometers measure linear acceleration in m/s². At rest they detect 9.81 m/s² due to Earth\'s gravity.',
      hint: 'Think Newton\'s 2nd law — F = ma. This sensor detects the "a".',
    },
    {
      type: 'mc', id: 'imu-pred-2',
      question: 'A gyroscope measures which physical quantity?',
      options: ['Force', 'Linear velocity', 'Angular velocity', 'Displacement'],
      correctIndex: 2,
      explanation: 'Gyroscopes measure angular velocity — the rate of rotation around an axis — in °/s or rad/s.',
      hint: 'It\'s about how fast something spins or rotates, not linear motion.',
    },
    {
      type: 'fillin', id: 'imu-pred-3',
      question: 'How many total axes does a 6-DOF IMU measure?',
      correctAnswer: 6, tolerance: 0, unit: 'axes',
      formula: '3 accelerometer axes (AccX/Y/Z) + 3 gyroscope axes (GyroX/Y/Z) = 6 DOF',
      hint: 'Count the accelerometer axes, then add the gyroscope axes.',
    },
  ];
  return (
    <div style={{ maxWidth: '640px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>🔮 Make Your Predictions</h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text3)', marginBottom: '20px' }}>Predict the fundamental properties of IMU sensors before exploring.</p>
      <QuizEngine questions={questions} onComplete={(_, totalScore) => onComplete?.(totalScore)} mode="prediction" />
    </div>
  );
}

/* ── Main Experiment ── */

function E1IMUPrinciples(): React.JSX.Element {
  const steps: StepConfig[] = [
    {
      id: 'context', name: 'Context', xpReward: 10,
      component: (
        <ContextStep
          title="How IMU Sensors Work"
          body={`An Inertial Measurement Unit (IMU) is a miniaturized electronic device that measures motion and orientation in 3D space. The two core sensors inside every IMU are the accelerometer and gyroscope.

The accelerometer measures linear acceleration along three orthogonal axes (X, Y, Z) in m/s². When the sensor is stationary, AccZ reads approximately 9.81 m/s² — the pull of gravity. Tilt the sensor and gravity projects onto different axes, enabling you to compute tilt angles. The gyroscope measures angular velocity (rate of rotation) around each axis in °/s. It tells you how fast the sensor is spinning, but not the absolute angle.

Modern gait IMUs like the BNO055 used in Kinetrax devices combine both sensors plus a magnetometer into a single chip — 6 or 9 degrees of freedom (DOF). They use MEMS (Micro-Electro-Mechanical Systems) technology: a tiny proof mass suspended inside a silicon chip deflects when accelerated, changing capacitance. The chip converts that to a voltage, then to a digital number at 100–1000 Hz.`}
          statistic={{ value: '<$2', label: 'cost of a smartphone IMU — samples at 100–1000 Hz' }}
          clinicalNote="IMU-based gait analysis can be performed anywhere — at home, in clinics, outdoors. This is a paradigm shift from tethered lab systems costing $100,000+. Kinetrax wearables use the BNO055 IMU on the foot to detect gait events in real time."
        />
      ),
    },
    { id: 'predictions', name: 'Predictions', xpReward: 20, component: <IMUPredictions /> },
    {
      id: 'materials', name: 'Materials', xpReward: 30,
      component: <MaterialsStep requiredPlacements={[{ sensorId: 'imu-foot', zone: 'LEFT_FOOT' }]} />,
    },
    {
      id: 'protocol', name: 'Protocol', xpReward: 20,
      component: (
        <ProtocolStep steps={[
          { id: 'p1', title: 'Drag the 3D IMU Cube', description: 'Use your mouse to click and drag the 3D BNO055 cube. Rotate it in different directions. Watch how AccX, AccY, AccZ respond differently depending on which way you tilt.', icon: '🖱️' },
          { id: 'p2', title: 'Tilt Forward — Find AccX', description: 'Tilt the sensor so the top faces away from you (forward tilt). Gravity projects onto the X axis. AccX should increase toward ±9.81. This is what happens when a foot-mounted IMU tilts during heel strike.', icon: '⬆️' },
          { id: 'p3', title: 'Tilt Sideways — Find AccY', description: 'Now tilt it left or right. AccY will respond. This lateral tilt axis is important for detecting mediolateral trunk lean in pathological gait.', icon: '↔️' },
          { id: 'p4', title: 'Identify All Three — Then Answer', description: 'When flat and upright, AccZ reads ~9.81 m/s² (gravity acts straight down). Answer the 3 axis questions based on your hands-on exploration.', icon: '🎯' },
        ]} />
      ),
    },
    {
      id: 'results', name: 'Results', xpReward: 100, minScore: 60,
      component: <IMUPrinciplesResults />,
    },
    {
      id: 'practice', name: 'Practice', xpReward: 50, minScore: 40,
      component: <PracticeStep simulationComponent={<IMUPracticeBox />} timeLimitSeconds={60} minScore={40} />,
    },
    {
      id: 'reflection', name: 'Reflection', xpReward: 20,
      component: (
        <ReflectionStep questions={[
          { id: 'r1', predictionKey: 'imu-pred-1', question: 'What does an accelerometer measure?', actualValue: 'Acceleration (m/s²)', unit: '', explanation: 'Accelerometers measure linear acceleration. At rest, they detect 9.81 m/s² along the vertical axis due to gravity.' },
          { id: 'r2', predictionKey: 'imu-pred-2', question: 'What does a gyroscope measure?', actualValue: 'Angular velocity (°/s)', unit: '', explanation: 'Gyroscopes measure the rate of rotation around each axis in °/s. They do not measure absolute angle — that requires integration.' },
          { id: 'r3', predictionKey: 'imu-pred-3', question: 'How many axes in a 6-DOF IMU?', actualValue: '6', unit: 'axes', explanation: '3 accelerometer axes + 3 gyroscope axes = 6 degrees of freedom. 9-DOF IMUs add 3 magnetometer axes.' },
        ]} />
      ),
    },
    {
      id: 'summary', name: 'Summary', xpReward: 50,
      component: (
        <SummaryStep
          experimentTitle="How IMU Sensors Work"
          keyFormula="AccZ = 9.81 m/s² (vertical/gravity) | AccX = forward | AccY = lateral | Gyro = rotation rate (°/s)"
          keyConcept="A 6-DOF IMU combines a 3-axis accelerometer (measures gravity + linear acceleration in m/s²) and a 3-axis gyroscope (measures angular velocity in °/s). MEMS technology makes these sensors tiny, cheap (<$2), and fast (100–1000 Hz) — enabling wearable gait analysis anywhere."
          badgeId="sensor-novice"
          moduleId="m4"
          expId="imu-principles"
          nextExpPath="/experiment/m4/foot-imu"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m4" expId="imu-principles" steps={steps} />;
}

export default E1IMUPrinciples;
