// src/modules/m1-gait-fundamentals/E4_spatiotemporal_params.tsx
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
import { generateGaitData, type GaitData } from '../../engine/syntheticGait';
import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════
   Experiment 4 — Spatiotemporal Parameters
   Student calculates StepLen, StrideLen, Cadence, Speed
   from displayed raw data. Scored within 5% tolerance.
   Badge: stride-calculator
   ═══════════════════════════════════════════════════════ */

interface CalcField {
  id: string;
  label: string;
  unit: string;
  formula: string;
}

const FIELDS: CalcField[] = [
  { id: 'stepLength', label: 'Step Length', unit: 'm', formula: 'StepLen = 0.413 × Height(m) [male]' },
  { id: 'strideLength', label: 'Stride Length', unit: 'm', formula: 'StrideLen = 2 × StepLen' },
  { id: 'cadence', label: 'Cadence', unit: 'spm', formula: 'Cadence = Steps ÷ Time(min)' },
  { id: 'speed', label: 'Speed', unit: 'm/s', formula: 'Speed = Cadence × StepLen ÷ 60' },
];

/* ── Results: Parameter Calculator ── */

function SpatiotemporalResults({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const [height, setHeight] = useState<number>(175);
  const [weight, setWeight] = useState<number>(72);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [age, setAge] = useState<number>(28);

  const gaitData: GaitData = useMemo(() => {
    return generateGaitData({
      height_cm: height, weight_kg: weight, gender, age,
      distance_m: 10, noise: 0.15, seed: 500,
    });
  }, [height, weight, gender, age]);

  const actual = useMemo(() => ({
    stepLength: parseFloat((gaitData.params.stepLength).toFixed(3)),
    strideLength: parseFloat((gaitData.params.strideLength).toFixed(3)),
    cadence: parseFloat(gaitData.params.cadence.toFixed(1)),
    speed: parseFloat(gaitData.params.speed.toFixed(3)),
  }), [gaitData]);

  const [answers, setAnswers] = useState<Record<string, string>>({
    stepLength: '', strideLength: '', cadence: '', speed: '',
  });
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [results, setResults] = useState<Record<string, { correct: boolean; error: number }>>({});

  const handleChange = useCallback((field: string, value: string): void => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback((): void => {
    const res: Record<string, { correct: boolean; error: number }> = {};
    let correctCount = 0;

    for (const field of FIELDS) {
      const userVal = parseFloat(answers[field.id]);
      const actualVal = actual[field.id as keyof typeof actual];
      const toleranceAbs = Math.abs(actualVal * 0.05);
      const error = isNaN(userVal) ? 100 : Math.abs(userVal - actualVal);
      const correct = error <= toleranceAbs;
      res[field.id] = { correct, error: parseFloat(error.toFixed(3)) };
      if (correct) correctCount++;
    }

    setResults(res);
    setSubmitted(true);

    const score = Math.round((correctCount / FIELDS.length) * 100);
    setTimeout(() => onComplete?.(score), 800);
  }, [answers, actual, onComplete]);

  // Raw data display
  const rawData = useMemo(() => ({
    totalStrides: Math.ceil(10 / gaitData.params.strideLength),
    totalTime: (10 / gaitData.params.speed).toFixed(1),
    totalDistance: '10',
    subjectHeight: `${height} cm`,
    subjectGender: gender,
    subjectAge: `${age} yr`,
    stepsRecorded: Math.ceil(10 / gaitData.params.stepLength),
  }), [gaitData, height, gender, age]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Subject config */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        <label style={sliderLabel}>
          Height: {height} cm
          <input type="range" min={140} max={200} value={height} onChange={(e) => setHeight(Number(e.target.value))} style={sliderStyle} />
        </label>
        <label style={sliderLabel}>
          Weight: {weight} kg
          <input type="range" min={40} max={150} value={weight} onChange={(e) => setWeight(Number(e.target.value))} style={sliderStyle} />
        </label>
        <label style={sliderLabel}>
          Age: {age}
          <input type="range" min={15} max={80} value={age} onChange={(e) => setAge(Number(e.target.value))} style={sliderStyle} />
        </label>
        <div style={sliderLabel}>
          Gender
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['male', 'female', 'other'] as const).map((g) => (
              <button key={g} onClick={() => setGender(g)} style={{
                flex: 1, padding: '4px', fontSize: '0.6875rem', borderRadius: '6px', cursor: 'pointer',
                textTransform: 'capitalize',
                background: gender === g ? 'var(--accent)' : 'var(--card)',
                color: gender === g ? '#fff' : 'var(--text2)',
                border: `1px solid ${gender === g ? 'var(--accent)' : 'var(--border)'}`,
              }}>{g}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Animation */}
      <GaitCanvas gaitData={gaitData} speed={gaitData.params.speed} width={600} height={200} />

      {/* Raw data panel */}
      <div style={{
        padding: '16px', borderRadius: '12px', background: 'var(--card)',
        border: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: '0.6875rem', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '10px' }}>
          📋 Raw Experimental Data
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          {Object.entries(rawData).map(([key, value]) => (
            <div key={key} style={{
              padding: '10px', borderRadius: '8px', background: 'var(--bg2)',
            }}>
              <div style={{ fontSize: '0.5625rem', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '4px' }}>
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--teal)' }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calculator fields */}
      <div style={{
        padding: '16px', borderRadius: '12px', background: 'var(--card)',
        border: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: '0.6875rem', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '10px' }}>
          🧮 Calculate Parameters (±5% tolerance)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {FIELDS.map((field) => {
            const result = results[field.id];
            return (
              <div key={field.id}>
                <label style={{
                  display: 'flex', flexDirection: 'column', gap: '4px',
                  fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text2)',
                }}>
                  {field.label} ({field.unit})
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="number" step="any"
                      value={answers[field.id]}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      disabled={submitted}
                      placeholder={field.formula}
                      style={{
                        flex: 1,
                        borderColor: submitted ? (result?.correct ? '#52e5a0' : '#ff5252') : undefined,
                      }}
                    />
                    {submitted && (
                      <span style={{
                        fontSize: '1rem',
                        color: result?.correct ? '#52e5a0' : '#ff5252',
                      }}>
                        {result?.correct ? '✓' : '✗'}
                      </span>
                    )}
                  </div>
                  {submitted && (
                    <div style={{
                      fontSize: '0.5625rem', fontFamily: 'var(--mono)',
                      color: result?.correct ? 'var(--teal)' : 'var(--red)',
                    }}>
                      Actual: {actual[field.id as keyof typeof actual]} {field.unit} | Error: {result?.error}
                    </div>
                  )}
                </label>
              </div>
            );
          })}
        </div>

        {!submitted && (
          <button className="btn-primary" onClick={handleSubmit}
            disabled={Object.values(answers).some((v) => v === '')}
            style={{ marginTop: '14px', padding: '10px 24px' }}>
            Submit Calculations →
          </button>
        )}
      </div>

      {/* Score */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '16px', borderRadius: '12px', textAlign: 'center',
            background: 'var(--card)', border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--mono)',
            color: Object.values(results).filter((r) => r.correct).length === 4 ? 'var(--teal)' : 'var(--amber)',
          }}>
            {Object.values(results).filter((r) => r.correct).length}/4 correct
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>
            {Object.values(results).filter((r) => r.correct).length === 4 ? '🏆 Perfect! Stride Calculator badge earned!' : 'Review formulas and try the practice round.'}
          </div>
        </motion.div>
      )}

      {/* Formula reference */}
      <div style={{
        padding: '14px 18px', borderRadius: '10px', background: 'var(--bg2)',
        border: '1px solid var(--border)', fontFamily: 'var(--mono)',
        fontSize: '0.75rem', color: 'var(--accent)', lineHeight: 2,
      }}>
        <div>Step Length = 0.413 × Height(m) [male] | × 0.388 [female]</div>
        <div>Stride Length = 2 × Step Length</div>
        <div>Speed = Cadence × Step Length ÷ 60</div>
        <div>Cadence = Total Steps ÷ Time(min)</div>
      </div>
    </div>
  );
}

/* ── Practice: Random subjects ── */

function SpatiotemporalPractice(): React.JSX.Element {
  const [round, setRound] = useState<number>(1);
  const subjects = useMemo(() => [
    { height_cm: 182, weight_kg: 80, gender: 'male' as const, age: 30 },
    { height_cm: 160, weight_kg: 55, gender: 'female' as const, age: 45 },
    { height_cm: 170, weight_kg: 68, gender: 'male' as const, age: 65 },
  ], []);

  const subject = subjects[(round - 1) % subjects.length];
  const gaitData: GaitData = useMemo(() => {
    return generateGaitData({
      ...subject, distance_m: 10, noise: 0.2, seed: 700 + round,
    });
  }, [subject, round]);

  const [answers, setAnswers] = useState<Record<string, string>>({ stepLength: '', strideLength: '', cadence: '', speed: '' });
  const [submitted, setSubmitted] = useState<boolean>(false);

  useEffect(() => {
    setAnswers({ stepLength: '', strideLength: '', cadence: '', speed: '' });
    setSubmitted(false);
  }, [round]);

  const actual = {
    stepLength: gaitData.params.stepLength,
    strideLength: gaitData.params.strideLength,
    cadence: parseFloat(gaitData.params.cadence.toFixed(1)),
    speed: parseFloat(gaitData.params.speed.toFixed(3)),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{
        padding: '10px 16px', borderRadius: '10px', fontSize: '0.8125rem',
        background: 'var(--accent)15', border: '1px solid var(--accent)30', color: 'var(--text)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span>Round {round}/3 — Subject: {subject.height_cm}cm, {subject.weight_kg}kg, {subject.gender}, {subject.age}yr</span>
        {submitted && round < 3 && (
          <button className="btn-secondary" onClick={() => setRound((r) => r + 1)} style={{ padding: '4px 12px', fontSize: '0.6875rem' }}>
            Next Subject →
          </button>
        )}
      </div>

      <GaitCanvas gaitData={gaitData} speed={gaitData.params.speed} width={600} height={180} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {FIELDS.map((field) => (
          <div key={field.id}>
            <label style={{ fontSize: '0.6875rem', color: 'var(--text2)', fontWeight: 600 }}>
              {field.label} ({field.unit})
              <input type="number" step="any" value={answers[field.id]}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))}
                disabled={submitted} placeholder={field.formula}
                style={{ width: '100%', marginTop: '4px' }} />
            </label>
            {submitted && (
              <div style={{
                fontSize: '0.5625rem', fontFamily: 'var(--mono)', marginTop: '2px',
                color: Math.abs(parseFloat(answers[field.id]) - actual[field.id as keyof typeof actual]) <= actual[field.id as keyof typeof actual] * 0.05 ? 'var(--teal)' : 'var(--red)',
              }}>
                Actual: {actual[field.id as keyof typeof actual]}
              </div>
            )}
          </div>
        ))}
      </div>

      {!submitted && (
        <button className="btn-primary" onClick={() => setSubmitted(true)}
          disabled={Object.values(answers).some((v) => v === '')}
          style={{ padding: '8px 20px', width: 'fit-content' }}>
          Submit →
        </button>
      )}
    </div>
  );
}

/* ── Predictions ── */

function SpatiotemporalPredictions({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const questions: QuizQuestion[] = [
    {
      type: 'fillin',
      id: 'st-pred-1',
      question: 'Stride length = ? × step length',
      correctAnswer: 2,
      tolerance: 0,
      unit: '×',
      formula: 'Stride = 2 × Step (one stride = two consecutive steps)',
      hint: 'A stride covers two steps: left-right or right-left.',
    },
    {
      type: 'fillin',
      id: 'st-pred-2',
      question: 'If cadence = 120 spm and step length = 0.65 m, what is the walking speed (m/s)?',
      correctAnswer: 1.3,
      tolerance: 5,
      unit: 'm/s',
      formula: 'Speed = Cadence × StepLen ÷ 60 = 120 × 0.65 ÷ 60 = 1.3',
      hint: 'Speed = Cadence × Step Length ÷ 60',
    },
    {
      type: 'mc',
      id: 'st-pred-3',
      question: 'What is the normal cadence range for healthy adults?',
      options: ['60–80 spm', '80–100 spm', '100–130 spm', '130–160 spm'],
      correctIndex: 2,
      explanation: 'Normal adult cadence ranges from 100–130 steps per minute, averaging about 115 spm.',
      hint: 'About 2 steps per second at comfortable speed.',
    },
  ];

  return (
    <div style={{ maxWidth: '640px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>🔮 Make Your Predictions</h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text3)', marginBottom: '20px' }}>
        Test your knowledge of spatiotemporal parameters and formulas.
      </p>
      <QuizEngine questions={questions} onComplete={(_, totalScore) => onComplete?.(totalScore)} mode="prediction" />
    </div>
  );
}

/* ── Shared styles ── */

const sliderLabel: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '4px',
  fontSize: '0.6875rem', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase',
};

const sliderStyle: React.CSSProperties = {
  accentColor: 'var(--accent)', width: '100%',
};

/* ── Main Experiment ── */

function E4SpatiotemporalParams(): React.JSX.Element {
  const steps: StepConfig[] = [
    {
      id: 'context',
      name: 'Context',
      xpReward: 10,
      component: (
        <ContextStep
          title="Spatiotemporal Parameters"
          body={`Spatiotemporal parameters are the four key measurable quantities that define human gait: Step Length, Stride Length, Cadence, and Walking Speed. These form the foundation of all quantitative gait analysis.

Step Length is the distance from the heel of one foot to the heel of the opposite foot during walking (typically 0.60–0.75 m for adults). Stride Length is the distance from one heel-strike to the next heel-strike of the SAME foot, equal to exactly 2× step length (1.20–1.50 m). Cadence is the number of steps per minute (100–130 spm in healthy adults). Walking Speed ties them all together: Speed = Cadence × Step Length ÷ 60.

Normal walking speed is 1.2–1.4 m/s for healthy adults and declines approximately 1% per year after age 60. Step length scales with height: ~41.3% of standing height in males and ~38.8% in females. These normative values are critical for the 10-Meter Walk Test, one of the most validated clinical gait assessments.`}
          statistic={{ value: '1.2–1.4', label: 'm/s normal walking speed — declines ~1%/year after 60' }}
          clinicalNote="The 10-Meter Walk Test (10MWT) uses spatiotemporal parameters as its primary outcome measure. A comfortable gait speed below 0.8 m/s is a strong predictor of functional decline and increased fall risk in elderly populations."
        />
      ),
    },
    {
      id: 'predictions',
      name: 'Predictions',
      xpReward: 20,
      component: <SpatiotemporalPredictions />,
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
            { id: 'p1', title: 'Configure Subject', description: 'Set subject height, weight, gender, and age using the sliders. These anthropometric parameters directly determine step length and cadence.', icon: '👤' },
            { id: 'p2', title: 'Observe Raw Data', description: 'The raw data panel shows total distance (10m), steps recorded, and total time. Distance markers appear on the animation.', icon: '📏' },
            { id: 'p3', title: 'Read the Cadence Counter', description: 'The cadence display shows steps per minute derived from the sensor data. Note this value for your calculations.', icon: '⏱️' },
            { id: 'p4', title: 'Calculate All 4', description: 'Enter your calculated values for Step Length, Stride Length, Cadence, and Speed into the calculator. Each must be within 5% of the actual value.', icon: '🧮' },
          ]}
        />
      ),
    },
    {
      id: 'results',
      name: 'Results',
      xpReward: 100,
      minScore: 60,
      component: <SpatiotemporalResults />,
    },
    {
      id: 'practice',
      name: 'Practice',
      xpReward: 50,
      minScore: 40,
      component: (
        <PracticeStep
          simulationComponent={<SpatiotemporalPractice />}
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
              question: 'Stride = ? × Step',
              actualValue: '2',
              unit: '×',
              explanation: 'Stride length is always exactly 2× step length, because one stride covers two consecutive steps (left-right or right-left).',
            },
            {
              id: 'st-ref-2',
              predictionKey: 'st-pred-2',
              question: 'Speed at cadence=120, step=0.65',
              actualValue: '1.3',
              unit: 'm/s',
              explanation: 'Speed = Cadence × StepLen ÷ 60 = 120 × 0.65 ÷ 60 = 1.30 m/s. This is within the normal walking speed range.',
            },
            {
              id: 'st-ref-3',
              predictionKey: 'st-pred-3',
              question: 'Normal cadence range',
              actualValue: '100–130',
              unit: 'spm',
              explanation: 'Normal adult cadence is 100–130 spm. Males average ~115 spm and females ~120 spm. Cadence is less affected by height than step length.',
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
          keyFormula="StepLen = 0.413 × H(m) | Stride = 2 × Step | Speed = Cadence × Step ÷ 60"
          keyConcept="Four parameters define gait: Step Length (scales with height), Stride Length (2× step), Cadence (100–130 spm), and Speed (Cadence × StepLen ÷ 60). Normal speed is 1.2–1.4 m/s, declining ~1%/year after 60."
          badgeId="stride-calculator"
          moduleId="m1"
          expId="spatiotemporal-params"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m1" expId="spatiotemporal-params" steps={steps} />;
}

export default E4SpatiotemporalParams;
