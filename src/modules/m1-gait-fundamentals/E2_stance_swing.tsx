// src/modules/m1-gait-fundamentals/E2_stance_swing.tsx
import React, { useState, useCallback, useMemo } from 'react';
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
   Experiment 2 — Stance vs Swing Timing
   Interactive: Speed slider → ratio changes
   Student predicts stance% before each speed change
   ═══════════════════════════════════════════════════════ */

/* ── Results: Predict-then-reveal ratio game ── */

function StanceSwingResults({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const [speed, setSpeed] = useState<number>(1.0);
  const [prediction, setPrediction] = useState<string>('');
  const [revealed, setRevealed] = useState<boolean>(false);
  const [history, setHistory] = useState<{ speed: number; predicted: number; actual: number; error: number }[]>([]);
  const [currentSample, setCurrentSample] = useState<number>(0);

  const gaitData: GaitData = useMemo(() => {
    return generateGaitData({
      height_cm: 170, weight_kg: 70, gender: 'male', age: 25,
      distance_m: 10, speed_ms: speed, noise: 0.15, seed: 55,
    });
  }, [speed]);

  const stancePct = gaitData.params.stanceRatio * 100;
  const swingPct = gaitData.params.swingRatio * 100;
  const isRunning = speed >= 3.0;

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSample((s) => (s + 1) % gaitData.nSamples);
    }, 10);
    return () => clearInterval(timer);
  }, [gaitData.nSamples]);

  const channels: SignalChannel[] = useMemo(() => [
    { id: 'fsrHeel', label: 'FSR Heel (Stance)', data: gaitData.signals.fsrHeel, color: '#4f8cff', visible: true },
    { id: 'fsrToe', label: 'FSR Toe (Push-off)', data: gaitData.signals.fsrToe, color: '#ffa940', visible: true },
  ], [gaitData]);

  const handlePredict = useCallback((): void => {
    const predicted = parseFloat(prediction);
    if (isNaN(predicted)) return;
    const error = Math.abs(predicted - stancePct);
    setHistory((prev) => [...prev, {
      speed,
      predicted,
      actual: Math.round(stancePct * 10) / 10,
      error: Math.round(error * 10) / 10,
    }]);
    setRevealed(true);
  }, [prediction, stancePct, speed]);

  const handleNextSpeed = useCallback((): void => {
    setRevealed(false);
    setPrediction('');
    // Advance speed
    if (speed < 2.5) setSpeed((s) => Math.round((s + 0.5) * 10) / 10);
    else {
      // All done
      const avgError = history.length > 0
        ? history.reduce((s, h) => s + h.error, 0) / history.length
        : 50;
      const score = Math.max(0, Math.round(100 - avgError * 2));
      onComplete?.(score);
    }
  }, [speed, history, onComplete]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Speed slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text2)', fontWeight: 600 }}>Speed:</label>
        <input type="range" min={0.5} max={3.5} step={0.1} value={speed}
          onChange={(e) => { setSpeed(Number(e.target.value)); setRevealed(false); setPrediction(''); }}
          style={{ flex: 1, accentColor: 'var(--accent)' }} />
        <span style={{
          fontSize: '0.875rem', fontWeight: 700, fontFamily: 'var(--mono)',
          color: isRunning ? 'var(--red)' : 'var(--accent)',
        }}>
          {speed.toFixed(1)} m/s {isRunning ? '(RUNNING)' : ''}
        </span>
      </div>

      {/* Animation */}
      <GaitCanvas gaitData={gaitData} speed={speed} width={600} height={240} />

      {/* Stance/Swing bar chart */}
      <div style={{
        display: 'flex', borderRadius: '10px', overflow: 'hidden', height: '48px',
        border: '1px solid var(--border)',
      }}>
        <div style={{
          width: `${stancePct}%`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #4f8cff30, #4f8cff15)',
          fontSize: '0.8125rem', fontWeight: 700, color: '#4f8cff', fontFamily: 'var(--mono)',
          transition: 'width 0.5s ease',
        }}>
          Stance {revealed ? `${stancePct.toFixed(1)}%` : '???'}
        </div>
        <div style={{
          width: `${swingPct}%`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #00d4aa30, #00d4aa15)',
          fontSize: '0.8125rem', fontWeight: 700, color: '#00d4aa', fontFamily: 'var(--mono)',
          transition: 'width 0.5s ease',
        }}>
          Swing {revealed ? `${swingPct.toFixed(1)}%` : '???'}
        </div>
      </div>

      {/* Double support indicator */}
      {isRunning && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600,
          background: '#ff525215', border: '1px solid #ff525240', color: '#ff5252',
          textAlign: 'center',
        }}>
          🏃 RUNNING MODE — No double support phase! Both feet leave the ground simultaneously.
        </div>
      )}

      {/* Prediction input */}
      {!revealed && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text2)' }}>
            Predict stance %:
          </span>
          <input
            type="number" min={0} max={100} step={0.1}
            value={prediction}
            onChange={(e) => setPrediction(e.target.value)}
            placeholder="e.g. 60"
            style={{ width: '100px' }}
          />
          <button className="btn-primary" onClick={handlePredict}
            disabled={prediction === ''} style={{ padding: '8px 20px' }}>
            Reveal →
          </button>
        </div>
      )}

      {/* Reveal result */}
      {revealed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '14px 18px', borderRadius: '10px',
            background: 'var(--card)', border: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text3)', marginBottom: '4px' }}>Your prediction</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--accent)' }}>
              {prediction}%
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', color: 'var(--text3)' }}>vs</div>
          <div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text3)', marginBottom: '4px' }}>Actual</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--teal)' }}>
              {stancePct.toFixed(1)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text3)', marginBottom: '4px' }}>Error</div>
            <div style={{
              fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--mono)',
              color: Math.abs(parseFloat(prediction) - stancePct) <= 5 ? 'var(--teal)' : 'var(--red)',
            }}>
              ±{Math.abs(parseFloat(prediction) - stancePct).toFixed(1)}%
            </div>
          </div>
          <button className="btn-secondary" onClick={handleNextSpeed} style={{ padding: '8px 16px' }}>
            Next Speed →
          </button>
        </motion.div>
      )}

      {/* Signal plot */}
      <SignalPlot channels={channels} sampleRate={100} windowSeconds={3} currentSample={currentSample} height={160} />

      {/* History */}
      {history.length > 0 && (
        <div style={{
          background: 'var(--card)', borderRadius: '10px', border: '1px solid var(--border)', padding: '14px',
        }}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
            Prediction History
          </div>
          {history.map((h, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem',
              padding: '4px 0', borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ color: 'var(--text2)' }}>{h.speed.toFixed(1)} m/s</span>
              <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>Predicted: {h.predicted}%</span>
              <span style={{ fontFamily: 'var(--mono)', color: 'var(--teal)' }}>Actual: {h.actual}%</span>
              <span style={{
                fontFamily: 'var(--mono)', fontWeight: 600,
                color: h.error <= 5 ? 'var(--teal)' : 'var(--red)',
              }}>
                ±{h.error}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Practice: Find target stance% ── */

function StanceSwingPractice(): React.JSX.Element {
  const [targetStance, setTargetStance] = useState<number>(55);
  const [speed, setSpeed] = useState<number>(1.2);
  const [round, setRound] = useState<number>(1);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const gaitData: GaitData = useMemo(() => {
    return generateGaitData({
      height_cm: 170, weight_kg: 70, gender: 'male', age: 25,
      distance_m: 10, speed_ms: speed, noise: 0.2, seed: 77 + round,
    });
  }, [speed, round]);

  const actualStance = gaitData.params.stanceRatio * 100;

  // New target each round
  React.useEffect(() => {
    const targets = [55, 62, 50, 57, 53];
    setTargetStance(targets[(round - 1) % targets.length]);
    setSubmitted(false);
    setSpeed(1.2);
  }, [round]);

  const handleSubmit = useCallback((): void => {
    setSubmitted(true);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{
        padding: '12px 18px', borderRadius: '10px',
        background: 'var(--accent)15', border: '1px solid var(--accent)30',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text)' }}>
          Round {round}/5 — Find speed for <strong style={{ color: 'var(--accent)' }}>
          {targetStance}%</strong> stance
        </span>
        {submitted && round < 5 && (
          <button className="btn-secondary" onClick={() => setRound((r) => r + 1)}
            style={{ padding: '6px 14px', fontSize: '0.75rem' }}>
            Next Round →
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>Adjust speed:</label>
        <input type="range" min={0.5} max={3.0} step={0.05} value={speed}
          onChange={(e) => { setSpeed(Number(e.target.value)); setSubmitted(false); }}
          style={{ flex: 1, accentColor: 'var(--accent)' }} />
        <span style={{ fontSize: '0.875rem', fontFamily: 'var(--mono)', color: 'var(--accent)', minWidth: '60px' }}>
          {speed.toFixed(2)} m/s
        </span>
        {!submitted && (
          <button className="btn-primary" onClick={handleSubmit} style={{ padding: '8px 16px' }}>Lock In</button>
        )}
      </div>

      {submitted && (
        <div style={{
          padding: '12px', borderRadius: '8px', textAlign: 'center',
          background: Math.abs(actualStance - targetStance) <= 3 ? '#52e5a015' : '#ff525215',
          border: `1px solid ${Math.abs(actualStance - targetStance) <= 3 ? '#52e5a040' : '#ff525240'}`,
        }}>
          <span style={{
            fontSize: '0.875rem', fontWeight: 600,
            color: Math.abs(actualStance - targetStance) <= 3 ? 'var(--teal)' : 'var(--red)',
          }}>
            Actual stance: {actualStance.toFixed(1)}% (Target: {targetStance}%) —
            Error: ±{Math.abs(actualStance - targetStance).toFixed(1)}%
            {Math.abs(actualStance - targetStance) <= 3 ? ' ✓' : ' ✗'}
          </span>
        </div>
      )}

      <GaitCanvas gaitData={gaitData} speed={speed} width={600} height={200} />
    </div>
  );
}

/* ── Predictions ── */

function StanceSwingPredictions({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const questions: QuizQuestion[] = [
    {
      type: 'mc',
      id: 'ss-pred-1',
      question: 'If walking speed doubles, does the stance phase percentage increase or decrease?',
      options: ['Increase', 'Stay the same', 'Decrease', 'Double'],
      correctIndex: 2,
      explanation: 'As walking speed increases, stance phase percentage decreases because swing phase must be faster.',
      hint: 'At running speeds, stance drops below 50%. What does this imply about the trend?',
    },
    {
      type: 'mc',
      id: 'ss-pred-2',
      question: 'At what speed does the double support phase disappear (transition to running)?',
      options: ['2 m/s', '3 m/s', '4 m/s', '5 m/s'],
      correctIndex: 1,
      explanation: 'At approximately 3 m/s, walking transitions to running and double support disappears entirely.',
      hint: 'This is the typical walk-run transition speed for adults.',
    },
    {
      type: 'fillin',
      id: 'ss-pred-3',
      question: 'Estimate the stance time (seconds) at 1.0 m/s with a cadence of 110 steps/min.',
      correctAnswer: 0.65,
      tolerance: 5,
      unit: 'seconds',
      formula: 'Cycle time = 60/(110/2) = 1.09s → Stance = 1.09 × 0.6 = 0.65s',
      hint: 'First calculate cycle time from cadence, then multiply by stance fraction (~60%).',
    },
  ];

  return (
    <div style={{ maxWidth: '640px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>🔮 Make Your Predictions</h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text3)', marginBottom: '20px' }}>
        Predict how stance and swing timing respond to speed changes.
      </p>
      <QuizEngine questions={questions} onComplete={(_, totalScore) => onComplete?.(totalScore)} mode="prediction" />
    </div>
  );
}

/* ── Main Experiment ── */

function E2StanceSwing(): React.JSX.Element {
  const steps: StepConfig[] = [
    {
      id: 'context',
      name: 'Context',
      xpReward: 10,
      component: (
        <ContextStep
          title="Stance vs Swing Timing"
          body={`The stance phase is the weight-bearing period when the foot contacts the ground, providing body weight support and propulsive force. It consists of loading response, mid-stance, terminal stance, and pre-swing. The swing phase advances the limb forward through the air, consisting of initial, mid, and terminal swing.

The stance-to-swing ratio is speed-dependent. At comfortable walking speed (1.2 m/s), stance occupies about 60% of the gait cycle. As speed increases, stance duration shortens — at 2 m/s it is roughly 55%, and by 3 m/s (walk-run transition), it drops to about 50%. At running speeds above 3 m/s, there is NO double support phase — both feet leave the ground simultaneously during flight phases.

The clinical importance of this ratio cannot be overstated. Prolonged stance time on one side often indicates pain avoidance (antalgic gait) or muscle weakness. Asymmetric stance-swing ratios between left and right legs suggest unilateral pathology such as hemiparesis from stroke.`}
          statistic={{ value: '>3 m/s', label: 'walking speed where double support phase disappears (running)' }}
          clinicalNote="Prolonged stance time on one limb is a hallmark of antalgic gait — the body spends more time on the unaffected leg to minimize time on the painful limb. Stance asymmetry is often measured as the Stance Asymmetry Index."
        />
      ),
    },
    {
      id: 'predictions',
      name: 'Predictions',
      xpReward: 20,
      component: <StanceSwingPredictions />,
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
            { id: 'p1', title: 'Observe the Bar Chart', description: 'Watch the stance/swing ratio bar update in real-time. The blue bar shows stance percentage and the green bar shows swing percentage.', icon: '📊' },
            { id: 'p2', title: 'Change Walking Speed', description: 'Use the speed slider to vary walking speed from 0.5 to 3.0 m/s. Watch how the stance/swing ratio changes at each speed.', icon: '🎚️' },
            { id: 'p3', title: 'Watch the Ratio Change', description: 'As speed increases, notice how stance percentage decreases while swing percentage increases. At 3+ m/s, the gait transitions to running.', icon: '👁️' },
            { id: 'p4', title: 'Predict Before Revealing', description: 'In the Results step, you must predict the stance percentage at each speed BEFORE the answer is revealed. Your accuracy determines your score.', icon: '🔮' },
          ]}
        />
      ),
    },
    {
      id: 'results',
      name: 'Results',
      xpReward: 100,
      minScore: 60,
      component: <StanceSwingResults />,
    },
    {
      id: 'practice',
      name: 'Practice',
      xpReward: 50,
      minScore: 40,
      component: (
        <PracticeStep
          simulationComponent={<StanceSwingPractice />}
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
              question: 'Effect of speed on stance%',
              actualValue: 'Decreases',
              unit: '',
              explanation: 'Stance% decreases approximately 2% per 0.1 m/s increase above 1.4 m/s. This is because faster walking demands quicker limb advancement.',
            },
            {
              id: 'ss-ref-2',
              predictionKey: 'ss-pred-2',
              question: 'Walk-run transition speed',
              actualValue: '~3.0',
              unit: 'm/s',
              explanation: 'At ~3 m/s, double support disappears and flight phases appear, marking the transition from walking to running.',
            },
            {
              id: 'ss-ref-3',
              predictionKey: 'ss-pred-3',
              question: 'Stance time at 1.0 m/s',
              actualValue: '0.65',
              unit: 'seconds',
              explanation: 'At cadence 110 spm: cycle time = 60/(110/2) = 1.09s, stance time = 1.09 × 0.6 = 0.65s.',
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
          experimentTitle="Stance vs Swing Timing"
          keyFormula="Stance% ≈ 60% at 1.2m/s, decreases ~2% per 0.1 m/s above 1.4 m/s. At 3+ m/s → Running (no DS)"
          keyConcept="The stance/swing ratio is speed-dependent. Stance decreases from ~65% at slow walking to ~50% at the walk-run transition. Prolonged stance indicates pain avoidance or weakness."
          moduleId="m1"
          expId="stance-swing"
          nextExpPath="/experiment/m1/double-support"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m1" expId="stance-swing" steps={steps} />;
}

export default E2StanceSwing;
