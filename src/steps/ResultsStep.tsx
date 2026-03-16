// src/steps/ResultsStep.tsx
import React, { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

interface ResultsStepProps {
  simulationComponent: ReactNode;
  scoringFn?: () => number;
  minScore?: number;
  onComplete?: (score: number) => void;
}

/* ═══════════════════════════════════════════════════════
   Component — +0−100 XP based on score
   min score gate: 60% default
   ═══════════════════════════════════════════════════════ */

function ResultsStep({
  simulationComponent,
  scoringFn,
  minScore = 60,
  onComplete,
}: ResultsStepProps): React.JSX.Element {
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const handleSubmit = (): void => {
    const s = scoringFn ? scoringFn() : 100;
    setScore(s);
    setIsSubmitted(true);

    if (s >= minScore) {
      onComplete?.(s);
    } else {
      setError(`Score ${s}% is below the minimum ${minScore}%. Try again!`);
    }
  };

  const handleRetry = (): void => {
    setScore(null);
    setError(null);
    setIsSubmitted(false);
  };

  const scoreColor = score !== null
    ? score >= 80 ? 'var(--teal)' : score >= minScore ? 'var(--amber)' : 'var(--red)'
    : 'var(--text)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
        📊 Results & Analysis
      </h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text3)', marginBottom: '20px' }}>
        Interact with the simulation and analyze the results. Minimum score: {minScore}%
      </p>

      {/* Simulation area */}
      <div
        style={{
          padding: '20px',
          borderRadius: '14px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          marginBottom: '20px',
        }}
      >
        {simulationComponent}
      </div>

      {/* Score display */}
      {score !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            padding: '20px',
            borderRadius: '14px',
            background: 'var(--card)',
            border: `1px solid ${scoreColor}30`,
            textAlign: 'center',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              fontFamily: 'var(--mono)',
              color: scoreColor,
            }}
          >
            {score}%
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text2)', marginTop: '4px' }}>
            {score >= minScore ? `✓ Passed! +${score} XP` : `Below minimum ${minScore}%`}
          </div>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            background: '#ff525210',
            border: '1px solid #ff525240',
            fontSize: '0.8125rem',
            color: '#ff5252',
            marginBottom: '12px',
          }}
        >
          {error}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {!isSubmitted && (
          <button
            className="btn-primary"
            onClick={handleSubmit}
            style={{ padding: '10px 24px' }}
          >
            Submit Results →
          </button>
        )}
        {isSubmitted && score !== null && score < minScore && (
          <button
            className="btn-secondary"
            onClick={handleRetry}
            style={{ padding: '10px 24px' }}
          >
            🔄 Try Again
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default ResultsStep;
