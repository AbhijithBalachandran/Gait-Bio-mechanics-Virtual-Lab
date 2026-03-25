// src/modules/m3-grf/E3_pathological_grf.tsx
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
   Experiment 3 — Pathological GRF Patterns
   Side-by-side normal vs pathological + mystery classifier
   ═══════════════════════════════════════════════════════ */

type Pathology = 'normal' | 'parkinsonian' | 'hemiplegic' | 'antalgic';

const PATHOLOGY_DESCRIPTIONS: Record<Pathology, string> = {
  normal: 'Clear double-peak pattern with distinct valley',
  parkinsonian: 'Reduced amplitude, flattened peaks, shuffling pattern',
  hemiplegic: 'Asymmetric, reduced push-off peak on affected side',
  antalgic: 'Rapid offloading, reduced first peak, shortened stance',
};

const PATHOLOGY_COLORS: Record<Pathology, string> = {
  normal: '#52e5a0',
  parkinsonian: '#a855f7',
  hemiplegic: '#ff5252',
  antalgic: '#ffa940',
};

/* ── Results: Mystery GRF classifier ── */

function PathologicalResults({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const [viewMode, setViewMode] = useState<'explore' | 'mystery'>('explore');
  const [selectedPathology, setSelectedPathology] = useState<Pathology>('normal');
  const [currentSample, setCurrentSample] = useState<number>(0);
  const [mysteryRound, setMysteryRound] = useState<number>(0);
  const [mysteryGuess, setMysteryGuess] = useState<string>('');
  const [mysterySubmitted, setMysterySubmitted] = useState<boolean>(false);
  const [mysteryHistory, setMysteryHistory] = useState<{ answer: Pathology; guess: string; correct: boolean }[]>([]);

  // Deterministic mystery sequence
  const mysterySequence: Pathology[] = useMemo(() => ['antalgic', 'parkinsonian', 'hemiplegic'], []);
  const currentMystery = mysterySequence[mysteryRound] ?? 'normal';

  // Normal reference
  const normalData = useMemo(() => generateGaitData({
    height_cm: 170, weight_kg: 70, gender: 'male', age: 25,
    distance_m: 10, speed_ms: 1.2, noise: 0.1, seed: 800, pathology: 'normal',
  }), []);

  // Explore/Mystery data
  const pathData = useMemo(() => generateGaitData({
    height_cm: 170, weight_kg: 70, gender: 'male', age: 25,
    distance_m: 10, speed_ms: 1.2, noise: 0.1, seed: 810 + mysteryRound,
    pathology: viewMode === 'explore' ? selectedPathology : currentMystery,
  }), [viewMode, selectedPathology, currentMystery, mysteryRound]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSample((s) => (s + 1) % normalData.nSamples);
    }, 10);
    return () => clearInterval(timer);
  }, [normalData.nSamples]);

  const normalChannels: SignalChannel[] = useMemo(() => [
    { id: 'grfV_norm', label: 'Normal GRF (N)', data: normalData.signals.grfVertical, color: '#ffffff40', visible: true },
  ], [normalData]);

  const pathChannels: SignalChannel[] = useMemo(() => {
    const color = viewMode === 'explore' ? PATHOLOGY_COLORS[selectedPathology] : 'var(--accent)';
    return [
      { id: 'grfV_path', label: `${viewMode === 'explore' ? selectedPathology : 'Mystery'} GRF`, data: pathData.signals.grfVertical, color, visible: true },
    ];
  }, [pathData, viewMode, selectedPathology]);

  // Symmetry index
  const symmetryIndex = useMemo(() => {
    const grfV = pathData.signals.grfVertical;
    const cycleLen = Math.round(pathData.params.cycleTime * pathData.sampleRate);
    if (cycleLen === 0 || grfV.length < cycleLen * 2) return 0;
    let sumL = 0, sumR = 0;
    for (let i = 0; i < cycleLen; i++) sumL += grfV[i];
    for (let i = cycleLen; i < cycleLen * 2 && i < grfV.length; i++) sumR += grfV[i];
    const mean = (sumL + sumR) / 2;
    return mean > 0 ? parseFloat((((sumL - sumR) / mean) * 100).toFixed(1)) : 0;
  }, [pathData]);

  const handleMysterySubmit = useCallback((): void => {
    const correct = mysteryGuess.toLowerCase() === currentMystery.toLowerCase();
    setMysteryHistory((prev) => [...prev, { answer: currentMystery, guess: mysteryGuess, correct }]);
    setMysterySubmitted(true);
  }, [mysteryGuess, currentMystery]);

  const handleNextMystery = useCallback((): void => {
    if (mysteryRound < mysterySequence.length - 1) {
      setMysteryRound((r) => r + 1);
      setMysteryGuess('');
      setMysterySubmitted(false);
    } else {
      const correctCount = mysteryHistory.filter((h) => h.correct).length + (mysteryGuess.toLowerCase() === currentMystery ? 1 : 0);
      const score = Math.round((correctCount / mysterySequence.length) * 100);
      onComplete?.(score);
    }
  }, [mysteryRound, mysterySequence, mysteryHistory, mysteryGuess, currentMystery, onComplete]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => setViewMode('explore')} style={{
          padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
          background: viewMode === 'explore' ? 'var(--accent)' : 'var(--card)',
          color: viewMode === 'explore' ? '#fff' : 'var(--text2)',
          border: `1px solid ${viewMode === 'explore' ? 'var(--accent)' : 'var(--border)'}`,
        }}>
          📚 Explore Patterns
        </button>
        <button onClick={() => { setViewMode('mystery'); setMysteryRound(0); setMysteryHistory([]); setMysteryGuess(''); setMysterySubmitted(false); }} style={{
          padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
          background: viewMode === 'mystery' ? 'var(--accent)' : 'var(--card)',
          color: viewMode === 'mystery' ? '#fff' : 'var(--text2)',
          border: `1px solid ${viewMode === 'mystery' ? 'var(--accent)' : 'var(--border)'}`,
        }}>
          🔍 Mystery Classifier (3 rounds)
        </button>
      </div>

      {/* Explore: pathology selector */}
      {viewMode === 'explore' && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {(['normal', 'parkinsonian', 'hemiplegic', 'antalgic'] as const).map((p) => (
            <button key={p} onClick={() => setSelectedPathology(p)} style={{
              padding: '6px 14px', borderRadius: '8px', fontSize: '0.6875rem', fontWeight: 600,
              textTransform: 'capitalize', cursor: 'pointer',
              background: selectedPathology === p ? PATHOLOGY_COLORS[p] + '20' : 'var(--card)',
              color: selectedPathology === p ? PATHOLOGY_COLORS[p] : 'var(--text2)',
              border: `1px solid ${selectedPathology === p ? PATHOLOGY_COLORS[p] : 'var(--border)'}`,
            }}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Side-by-side signals */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '0.5625rem', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
            Normal Reference
          </div>
          <SignalPlot channels={normalChannels} sampleRate={100} windowSeconds={3} currentSample={currentSample} height={180} />
        </div>
        <div>
          <div style={{ fontSize: '0.5625rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px',
            color: viewMode === 'explore' ? PATHOLOGY_COLORS[selectedPathology] : 'var(--accent)',
          }}>
            {viewMode === 'explore' ? selectedPathology : `Mystery #${mysteryRound + 1}`}
          </div>
          <SignalPlot channels={pathChannels} sampleRate={100} windowSeconds={3} currentSample={currentSample} height={180} />
        </div>
      </div>

      {/* Animation */}
      <GaitCanvas gaitData={pathData} speed={1.2} width={600} height={160} />

      {/* Symmetry index */}
      <div style={{
        display: 'flex', gap: '16px', padding: '10px 16px', borderRadius: '8px',
        background: 'var(--bg2)', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '0.5rem', color: 'var(--text3)', textTransform: 'uppercase' }}>Symmetry Index</div>
          <div style={{
            fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--mono)',
            color: Math.abs(symmetryIndex) > 10 ? 'var(--red)' : 'var(--teal)',
          }}>
            {symmetryIndex}%
          </div>
        </div>
        <div style={{ fontSize: '0.625rem', color: 'var(--text3)' }}>
          SI = (L − R) / mean × 100 | {'>'} 10% = clinically significant asymmetry
        </div>
      </div>

      {/* Explore: description */}
      {viewMode === 'explore' && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px', fontSize: '0.8125rem',
          background: PATHOLOGY_COLORS[selectedPathology] + '10',
          borderLeft: `3px solid ${PATHOLOGY_COLORS[selectedPathology]}`,
          color: 'var(--text2)',
        }}>
          <strong style={{ textTransform: 'capitalize' }}>{selectedPathology}:</strong> {PATHOLOGY_DESCRIPTIONS[selectedPathology]}
        </div>
      )}

      {/* Mystery: classifier */}
      {viewMode === 'mystery' && (
        <div style={{
          padding: '14px 18px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
            🔍 Round {mysteryRound + 1}/3 — Identify the pathology
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(['parkinsonian', 'hemiplegic', 'antalgic'] as const).map((p) => (
              <button key={p} onClick={() => setMysteryGuess(p)} disabled={mysterySubmitted}
                style={{
                  padding: '8px 14px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600,
                  textTransform: 'capitalize', cursor: mysterySubmitted ? 'default' : 'pointer',
                  background: mysteryGuess === p ? 'var(--accent)' : 'var(--bg2)',
                  color: mysteryGuess === p ? '#fff' : 'var(--text2)',
                  border: `1px solid ${mysteryGuess === p ? 'var(--accent)' : 'var(--border)'}`,
                }}>
                {p}
                {mysterySubmitted && p === currentMystery && ' ✓'}
                {mysterySubmitted && p === mysteryGuess && p !== currentMystery && ' ✗'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            {!mysterySubmitted && mysteryGuess && (
              <button className="btn-primary" onClick={handleMysterySubmit} style={{ padding: '6px 16px', fontSize: '0.75rem' }}>
                Classify →
              </button>
            )}
            {mysterySubmitted && (
              <>
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ fontSize: '0.75rem', fontWeight: 600, color: mysteryGuess === currentMystery ? 'var(--teal)' : 'var(--red)' }}>
                  {mysteryGuess === currentMystery ? '✓ Correct!' : `✗ It was: ${currentMystery}`}
                </motion.span>
                <button className="btn-secondary" onClick={handleNextMystery} style={{ padding: '6px 16px', fontSize: '0.75rem', marginLeft: 'auto' }}>
                  {mysteryRound < 2 ? 'Next →' : 'Finish ✓'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mystery history */}
      {mysteryHistory.length > 0 && (
        <div style={{ display: 'flex', gap: '6px' }}>
          {mysteryHistory.map((h, i) => (
            <span key={i} style={{
              padding: '4px 10px', borderRadius: '6px', fontSize: '0.625rem', fontFamily: 'var(--mono)',
              background: h.correct ? '#52e5a015' : '#ff525215',
              color: h.correct ? 'var(--teal)' : 'var(--red)',
              border: `1px solid ${h.correct ? '#52e5a040' : '#ff525240'}`,
              textTransform: 'capitalize',
            }}>
              {h.answer}: {h.guess} {h.correct ? '✓' : '✗'}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Practice ── */

function PathologicalPractice(): React.JSX.Element {
  const [pathology, setPathology] = useState<Pathology>('parkinsonian');
  const gaitData = useMemo(() => generateGaitData({
    height_cm: 170, weight_kg: 70, gender: 'male', age: 25,
    distance_m: 10, speed_ms: 1.2, noise: 0.2, seed: 820, pathology,
  }), [pathology]);
  const normalData = useMemo(() => generateGaitData({
    height_cm: 170, weight_kg: 70, gender: 'male', age: 25,
    distance_m: 10, speed_ms: 1.2, noise: 0.1, seed: 830, pathology: 'normal',
  }), []);
  const [currentSample, setCurrentSample] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSample((s) => (s + 1) % normalData.nSamples);
    }, 10);
    return () => clearInterval(timer);
  }, [normalData.nSamples]);

  const channels: SignalChannel[] = useMemo(() => [
    { id: 'norm', label: 'Normal', data: normalData.signals.grfVertical, color: '#ffffff30', visible: true },
    { id: 'path', label: pathology, data: gaitData.signals.grfVertical, color: PATHOLOGY_COLORS[pathology], visible: true },
  ], [normalData, gaitData, pathology]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '6px' }}>
        {(['parkinsonian', 'hemiplegic', 'antalgic'] as const).map((p) => (
          <button key={p} onClick={() => setPathology(p)} style={{
            padding: '6px 12px', borderRadius: '8px', fontSize: '0.6875rem', fontWeight: 600,
            textTransform: 'capitalize', cursor: 'pointer',
            background: pathology === p ? PATHOLOGY_COLORS[p] + '20' : 'var(--card)',
            color: pathology === p ? PATHOLOGY_COLORS[p] : 'var(--text2)',
            border: `1px solid ${pathology === p ? PATHOLOGY_COLORS[p] : 'var(--border)'}`,
          }}>{p}</button>
        ))}
      </div>
      <SignalPlot channels={channels} sampleRate={100} windowSeconds={3} currentSample={currentSample} height={200} />
      <GaitCanvas gaitData={gaitData} speed={1.2} width={600} height={160} />
    </div>
  );
}

/* ── Predictions ── */

function PathologicalPredictions({ onComplete }: { onComplete?: (score: number) => void }): React.JSX.Element {
  const questions: QuizQuestion[] = [
    {
      type: 'mc', id: 'path-pred-1',
      question: 'Antalgic gait affects the GRF by:',
      options: ['Reducing first peak on painful side', 'Reducing second peak only', 'Increasing all peaks', 'No change'],
      correctIndex: 0,
      explanation: 'Antalgic gait rapidly offloads the painful limb, reducing the first GRF peak and shortening stance time on the affected side.',
      hint: 'Antalgic = pain-avoiding. The patient minimizes time and force on the painful limb.',
    },
    {
      type: 'mc', id: 'path-pred-2',
      question: 'Parkinsonian gait GRF differs from normal by showing:',
      options: ['Higher peaks', 'Lower, flattened peaks', 'Reversed peak order', 'Mirror image'],
      correctIndex: 1,
      explanation: 'Parkinsonian gait has reduced amplitude and flattened peaks due to shuffling, reduced step length, and loss of push-off power.',
      hint: 'Think about the shuffling, small-step pattern of Parkinson\'s disease.',
    },
    {
      type: 'mc', id: 'path-pred-3',
      question: 'The Symmetry Index formula is:',
      options: ['SI = (L−R)/mean × 100', 'SI = (L+R)/2', 'SI = L/R × 100', 'SI = (L−R)/(L+R)'],
      correctIndex: 0,
      explanation: 'SI = (L−R)/mean × 100 quantifies asymmetry as a percentage. Values > 10% are clinically significant.',
      hint: 'The formula normalizes the difference by the average of both sides.',
    },
  ];

  return (
    <div style={{ maxWidth: '640px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>🔮 Make Your Predictions</h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text3)', marginBottom: '20px' }}>Predict how pathology alters the GRF pattern.</p>
      <QuizEngine questions={questions} onComplete={(_, totalScore) => onComplete?.(totalScore)} mode="prediction" />
    </div>
  );
}

/* ── Main Experiment ── */

function E3PathologicalGRF(): React.JSX.Element {
  const steps: StepConfig[] = [
    {
      id: 'context', name: 'Context', xpReward: 10,
      component: (
        <ContextStep
          title="Pathological GRF Patterns"
          body={`Disease and injury alter the characteristic double-peak GRF pattern in distinctive ways that enable clinical diagnosis. Understanding these patterns is essential for gait analysis in rehabilitation settings.

Parkinsonian gait produces reduced-amplitude, flattened GRF peaks. The shuffling, short-step pattern eliminates the sharp heel-strike impact, and the reduced push-off diminishes the second peak. The overall GRF envelope becomes nearly flat.

Antalgic (pain-avoiding) gait shows asymmetric patterns: the painful limb has a reduced first peak (rapid offloading) and shortened stance time. The patient "guards" the painful side by spending less time on it. The contralateral limb shows compensatory increased loading.

Hemiplegic gait (as seen after stroke) shows reduced push-off on the affected side with a diminished second peak. The affected limb often shows a single peak rather than the normal double-peak pattern.`}
          statistic={{ value: '>10%', label: 'GRF asymmetry index threshold for clinical significance' }}
          clinicalNote="Force plate analysis can detect gait pathology before it becomes visually apparent. Symmetry index (SI) values greater than 10% are considered clinically significant and warrant further investigation."
        />
      ),
    },
    {
      id: 'predictions', name: 'Predictions', xpReward: 20,
      component: <PathologicalPredictions />,
    },
    {
      id: 'materials', name: 'Materials', xpReward: 30,
      component: (
        <MaterialsStep requiredPlacements={[
          { sensorId: 'fsr-heel', zone: 'R_HEEL' },
          { sensorId: 'fsr-toe', zone: 'R_TOE' },
        ]} />
      ),
    },
    {
      id: 'protocol', name: 'Protocol', xpReward: 20,
      component: (
        <ProtocolStep steps={[
          { id: 'p1', title: 'Explore Patterns', description: 'Switch between Normal, Parkinsonian, Hemiplegic, and Antalgic gait modes. Compare each pathological pattern against the normal reference (grey).', icon: '📚' },
          { id: 'p2', title: 'Note Key Differences', description: 'Observe peak height, peak timing, overall shape, and symmetry for each pathology. These are your diagnostic clues.', icon: '🔍' },
          { id: 'p3', title: 'Check Symmetry Index', description: 'The SI display shows inter-limb asymmetry. Note which pathologies produce SI > 10%.', icon: '⚖️' },
          { id: 'p4', title: 'Mystery Classifier', description: 'Switch to Mystery mode. You will see 3 unlabeled GRF curves and must identify the pathology from the pattern alone.', icon: '🎯' },
        ]} />
      ),
    },
    {
      id: 'results', name: 'Results', xpReward: 100, minScore: 60,
      component: <PathologicalResults />,
    },
    {
      id: 'practice', name: 'Practice', xpReward: 50, minScore: 40,
      component: <PracticeStep simulationComponent={<PathologicalPractice />} timeLimitSeconds={60} minScore={40} />,
    },
    {
      id: 'reflection', name: 'Reflection', xpReward: 20,
      component: (
        <ReflectionStep questions={[
          { id: 'path-ref-1', predictionKey: 'path-pred-1', question: 'Antalgic GRF effect', actualValue: 'Reduced 1st peak', unit: '', explanation: 'Antalgic gait rapidly offloads the painful limb, reducing the first GRF peak (loading response) and shortening stance time. This is the body\'s protective mechanism.' },
          { id: 'path-ref-2', predictionKey: 'path-pred-2', question: 'Parkinsonian GRF', actualValue: 'Lower, flattened', unit: '', explanation: 'The shuffling pattern eliminates sharp heel-strike impacts. Combined with reduced push-off, the entire GRF envelope becomes flattened and reduced in amplitude.' },
          { id: 'path-ref-3', predictionKey: 'path-pred-3', question: 'Symmetry Index formula', actualValue: 'SI=(L−R)/mean×100', unit: '', explanation: 'SI normalizes the left-right difference by the mean. Values > 10% indicate clinically significant asymmetry warranting investigation.' },
        ]} />
      ),
    },
    {
      id: 'summary', name: 'Summary', xpReward: 50,
      component: (
        <SummaryStep
          experimentTitle="Pathological GRF Patterns"
          keyFormula="SI = (L−R) / mean × 100 | >10% = clinically significant"
          keyConcept="Each gait pathology produces a distinctive GRF pattern: Parkinson's (flattened), Antalgic (reduced loading on painful side), Hemiplegic (reduced push-off). Pattern recognition is a core clinical skill."
          moduleId="m3" expId="pathological-grf"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m3" expId="pathological-grf" steps={steps} />;
}

export default E3PathologicalGRF;
