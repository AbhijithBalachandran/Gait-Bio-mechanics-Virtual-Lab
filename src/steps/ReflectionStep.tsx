// src/steps/ReflectionStep.tsx
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameState } from '../context/GameState';

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

export interface ReflectionQuestion {
  id: string;
  predictionKey: string;
  question: string;
  actualValue: string;
  unit: string;
  explanation: string;
}

interface ReflectionStepProps {
  questions: ReflectionQuestion[];
  onComplete?: (score: number) => void;
}

/* ═══════════════════════════════════════════════════════
   Component — Shows predictions vs actuals
   +20 XP on completion
   ═══════════════════════════════════════════════════════ */

function ReflectionStep({ questions, onComplete }: ReflectionStepProps): React.JSX.Element {
  const { predictions } = useGameState();
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  const matchResults = useMemo(() => {
    return questions.map((q) => {
      const predRecord = predictions['predictions'] ?? {};
      const predValue = predRecord[q.predictionKey];
      const predScore = predValue !== undefined ? parseInt(predValue, 10) : undefined;
      const matched = predScore !== undefined && predScore >= 50;
      return {
        ...q,
        predicted: predScore !== undefined ? `${predScore}% correct` : 'No prediction',
        wasCorrect: matched,
      };
    });
  }, [questions, predictions]);

  const handleNext = (): void => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1);
    } else {
      setIsComplete(true);
      const correctCount = matchResults.filter((r) => r.wasCorrect).length;
      const score = Math.round((correctCount / questions.length) * 100);
      onComplete?.(score);
    }
  };

  if (isComplete) {
    const correctCount = matchResults.filter((r) => r.wasCorrect).length;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          maxWidth: '640px',
          padding: '28px',
          borderRadius: '14px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
        }}
      >
        <h3 style={{ marginBottom: '16px' }}>🔍 Reflection Complete</h3>
        <div
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            fontFamily: 'var(--mono)',
            color: correctCount >= questions.length / 2 ? 'var(--teal)' : 'var(--amber)',
            marginBottom: '12px',
          }}
        >
          {correctCount}/{questions.length} predictions correct
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text2)', marginBottom: '16px', lineHeight: 1.7 }}>
          {correctCount >= questions.length / 2
            ? 'Great scientific intuition! Your predictions aligned well with the experimental data.'
            : 'Science is about learning from surprises! The discrepancies between prediction and observation are where the deepest learning happens.'}
        </p>

        {/* Summary table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {matchResults.map((r) => (
            <div
              key={r.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'var(--bg2)',
                fontSize: '0.75rem',
              }}
            >
              <span style={{ color: 'var(--text2)', flex: 1 }}>{r.question}</span>
              <span
                style={{
                  fontWeight: 600,
                  fontFamily: 'var(--mono)',
                  color: r.wasCorrect ? 'var(--teal)' : 'var(--red)',
                  marginLeft: '12px',
                }}
              >
                {r.wasCorrect ? '✓' : '✗'} {r.predicted}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  const current = matchResults[currentIdx];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: '640px' }}
    >
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
        🔍 Reflect & Compare
      </h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text3)', marginBottom: '20px' }}>
        Compare your predictions with actual results ({currentIdx + 1}/{questions.length})
      </p>

      {current && (
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            padding: '24px',
            borderRadius: '14px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            marginBottom: '16px',
          }}
        >
          <h3 style={{ fontSize: '1rem', color: 'var(--text)', marginBottom: '16px' }}>
            {current.question}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* Prediction */}
            <div
              style={{
                padding: '14px',
                borderRadius: '10px',
                background: 'var(--bg2)',
                border: `1px solid ${current.wasCorrect ? 'var(--teal)' : 'var(--red)'}30`,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.625rem', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Your Prediction
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--accent)' }}>
                {current.predicted}
              </div>
            </div>

            {/* Actual */}
            <div
              style={{
                padding: '14px',
                borderRadius: '10px',
                background: 'var(--bg2)',
                border: '1px solid var(--teal)30',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.625rem', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Actual Result
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--teal)' }}>
                {current.actualValue} {current.unit}
              </div>
            </div>
          </div>

          {/* Match indicator */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: current.wasCorrect ? '#52e5a010' : '#ff525210',
              border: `1px solid ${current.wasCorrect ? '#52e5a040' : '#ff525240'}`,
              fontSize: '0.8125rem',
              color: 'var(--text2)',
              lineHeight: 1.7,
            }}
          >
            {current.wasCorrect ? '✅' : '💡'} {current.explanation}
          </div>
        </motion.div>
      )}

      <button
        className="btn-primary"
        onClick={handleNext}
        style={{ padding: '10px 24px' }}
      >
        {currentIdx + 1 >= questions.length ? 'Complete Reflection ✓' : 'Next →'}
      </button>
    </motion.div>
  );
}

export default ReflectionStep;
