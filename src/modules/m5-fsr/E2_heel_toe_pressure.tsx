// src/modules/m5-fsr/E2_heel_toe_pressure.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ExperimentShell, { StepConfig } from '../../components/ExperimentShell';
import PredictionsStep, { PredictionQuestion } from '../../steps/PredictionsStep';
import SummaryCard from '../../components/SummaryCard';
import SignalPlot, { SignalChannel } from '../../components/SignalPlot';

/* ═══════════════════════════════════════════════════════
   Step 1: Theory
   ═══════════════════════════════════════════════════════ */
function TheoryStep(): React.JSX.Element {
  return (
    <div className="prose">
      <h2>Heel to Toe Pressure Sequence</h2>
      <p>
        During normal walking, pressure travels from the heel to the toe in a predictable sequence:
        <strong> Heel contact → lateral midfoot → metatarsal heads → hallux (big toe) push-off.</strong>
      </p>
      <p>
        This medial-lateral-distal progression is called the <strong>Center of Pressure (CoP) trajectory</strong>.
      </p>
      <p>
        <strong>Statistic:</strong> Peak plantar pressure under the first metatarsal is ~300 kPa during normal walking.
      </p>
      <p>
        <strong>Clinical Note:</strong> Abnormal CoP trajectory can indicate conditions like flatfoot (pes planus), high arch (pes cavus), or neurological dysfunction.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Step 2: Predictions
   ═══════════════════════════════════════════════════════ */
const PREDICTIONS: PredictionQuestion[] = [
  {
    id: 'e2-p1',
    question: 'Pressure first appears at?',
    options: ['Toe', 'Heel', 'Midfoot', 'Lateral'],
    correctIndex: 1,
    explanation: 'Initial contact in normal gait occurs at the heel.',
    hint: 'Think about "heel strike".',
  },
  {
    id: 'e2-p2',
    question: 'Push-off pressure is highest under?',
    options: ['Heel', 'Midfoot', 'Big Toe', 'Little Toe'],
    correctIndex: 2,
    explanation: 'The hallux (big toe) bears significant load during terminal stance for push-off.',
    hint: 'Which toe is largest and does the most work pushing you forward?',
  },
  {
    id: 'e2-p3',
    question: 'Heel and toe FSR reach peak simultaneously?',
    options: ['Yes', 'No', 'Sometimes', 'Only at slow speed'],
    correctIndex: 1,
    explanation: 'The peaks are sequential. Heel peaks early in stance, toe peaks late in stance.',
    hint: 'Think about how your foot rolls from back to front.',
  },
];

/* ═══════════════════════════════════════════════════════
   Step 3: Interactive Heatmap
   ═══════════════════════════════════════════════════════ */
function InteractiveHeatmap({ onComplete }: { onComplete: (score: number) => void }): React.JSX.Element {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  
  // Sequence drawing game
  const [drawnSequence, setDrawnSequence] = useState<number[]>([]);
  const correctSequence = [1, 2, 3, 4]; // Heel -> Lateral Midfoot -> Metatarsals -> Hallux
  const targetCompleted = drawnSequence.length === correctSequence.length;

  useEffect(() => {
    let t: number;
    if (playing) {
      t = window.setInterval(() => {
        setTime((prev) => (prev + 0.05) % 2); // 2 second cycle
      }, 50);
    }
    return () => clearInterval(t);
  }, [playing]);

  const generateFSRSignals = (): SignalChannel[] => {
    const sr = 20; // 20hz for simulation
    const totalSamples = 40; // 2 seconds
    const dataH = [];
    const dataT = [];
    
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sr;
      // Heel peaks around 0.2s, lasts until 0.8s
      let h = Math.max(0, Math.sin(t * Math.PI) * 100);
      if (t > 1) h = 0;
      
      // Toe starts around 0.6s, peaks at 1.0s, ends at 1.2s
      let toe = 0;
      if (t > 0.5 && t < 1.3) {
        toe = Math.max(0, Math.sin((t - 0.5) * Math.PI * 1.25) * 120);
      }
      dataH.push(h);
      dataT.push(toe);
    }

    return [
      { id: 'fsrHeel', label: 'Heel FSR', data: dataH, color: '#ffa940', visible: true },
      { id: 'fsrToe', label: 'Toe FSR', data: dataT, color: '#52e5a0', visible: true }
    ];
  };

  const currentSample = Math.floor(time * 20);

  const handleZoneClick = (zoneId: number) => {
    if (targetCompleted) return;
    setDrawnSequence(prev => [...prev, zoneId]);
  };

  const checkSequence = () => {
    if (!targetCompleted) return;
    const isCorrect = drawnSequence.every((val, index) => val === correctSequence[index]);
    onComplete(isCorrect ? 100 : 0);
  };

  useEffect(() => {
    if (targetCompleted) checkSequence();
  }, [targetCompleted]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Center of Pressure Trajectory</h2>
        <button className="btn-primary" onClick={() => setPlaying(!playing)}>
          {playing ? '⏸ Pause' : '▶️ Play Animation'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Foot SVG with Zones */}
        <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg2)', padding: '16px', borderRadius: '12px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: '8px' }}>
            Click zones in the correct CoP sequence
          </p>
          <div style={{ position: 'relative', width: '120px', height: '280px', border: '1px solid var(--border)', borderRadius: '60px', overflow: 'hidden' }}>
            {/* Foot outline approximation */}
            <div onClick={() => handleZoneClick(1)} style={{ position: 'absolute', bottom: '10px', left: '30px', width: '60px', height: '60px', borderRadius: '50%', background: drawnSequence.includes(1) ? '#ffa940' : (time > 0.1 && time < 0.6 ? '#ffa94080' : 'rgba(255,255,255,0.1)'), cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>Heel</div>
            <div onClick={() => handleZoneClick(2)} style={{ position: 'absolute', bottom: '80px', left: '15px', width: '40px', height: '70px', borderRadius: '20px', background: drawnSequence.includes(2) ? '#52e5a0' : (time > 0.4 && time < 0.8 ? '#52e5a080' : 'rgba(255,255,255,0.1)'), cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>Lat</div>
            <div onClick={() => handleZoneClick(3)} style={{ position: 'absolute', top: '70px', left: '20px', width: '80px', height: '50px', borderRadius: '25px', background: drawnSequence.includes(3) ? '#4f8cff' : (time > 0.6 && time < 1.0 ? '#4f8cff80' : 'rgba(255,255,255,0.1)'), cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>Meta</div>
            <div onClick={() => handleZoneClick(4)} style={{ position: 'absolute', top: '10px', right: '20px', width: '40px', height: '50px', borderRadius: '50%', background: drawnSequence.includes(4) ? '#ff5252' : (time > 0.8 && time < 1.2 ? '#ff525280' : 'rgba(255,255,255,0.1)'), cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>Toe</div>
          </div>
          <button className="btn-ghost" onClick={() => setDrawnSequence([])} style={{ marginTop: '12px' }}>
            Reset Pattern
          </button>
        </div>

        {/* Signals */}
        <div style={{ flex: 1 }}>
          <SignalPlot
            channels={generateFSRSignals()}
            sampleRate={20}
            windowSeconds={2}
            currentSample={currentSample}
            height={260}
          />
        </div>
      </div>
      
      {targetCompleted && (
        <div style={{ padding: '16px', background: 'var(--bg2)', borderRadius: '8px' }}>
          {drawnSequence.every((v, i) => v === correctSequence[i]) 
            ? '✅ Correct Sequence! Heel → Lateral → Metatarsals → Hallux.' 
            : '❌ Incorrect Sequence. Try again.'}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Experiment Component
   ═══════════════════════════════════════════════════════ */
export default function E2HeelToePressure(): React.JSX.Element {
  const [interactiveScore, setInteractiveScore] = useState<number>(0);
  const [predictionsScore, setPredictionsScore] = useState<number>(0);

  const steps: StepConfig[] = [
    {
      id: 'theory',
      name: 'Theory',
      xpReward: 50,
      component: <TheoryStep />,
    },
    {
      id: 'predictions',
      name: 'Predictions',
      xpReward: 50,
      component: <PredictionsStep questions={PREDICTIONS} onComplete={setPredictionsScore} />,
    },
    {
      id: 'interactive',
      name: 'Pressure Maps',
      xpReward: 100,
      component: <InteractiveHeatmap onComplete={setInteractiveScore} />,
    },
    {
      id: 'summary',
      name: 'Summary',
      xpReward: 50,
      component: (
        <SummaryCard
          experimentTitle="Heel-Toe Pressure Sequence"
          keyFormula="CoP = Medial-Lateral progression over Time"
          keyConcept="The typical path of pressure moves from the heel, along the lateral midfoot, across the metatarsals, and finally off the big toe."
          score={Math.round((predictionsScore + interactiveScore) / 2) || 100}
          badgeId="pressure-detective"
          moduleId="m5"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m5" expId="heel-toe-pressure" steps={steps} />;
}
