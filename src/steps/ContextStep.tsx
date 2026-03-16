// src/steps/ContextStep.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

interface Statistic {
  value: string;
  label: string;
}

interface ContextStepProps {
  title: string;
  body: string;
  statistic?: Statistic;
  clinicalNote?: string;
  onComplete?: (score: number) => void;
}

/* ═══════════════════════════════════════════════════════
   Component — Auto-completes after 10s countdown
   +10 XP on completion
   ═══════════════════════════════════════════════════════ */

function ContextStep({
  title,
  body,
  statistic,
  clinicalNote,
  onComplete,
}: ContextStepProps): React.JSX.Element {
  const [countdown, setCountdown] = useState<number>(10);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  useEffect(() => {
    if (isComplete) return;
    if (countdown <= 0) {
      setIsComplete(true);
      onComplete?.(100);
      return;
    }

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, isComplete, onComplete]);

  const handleSkip = useCallback((): void => {
    setIsComplete(true);
    setCountdown(0);
    onComplete?.(100);
  }, [onComplete]);

  // Parse body into paragraphs
  const paragraphs = body.split('\n').filter((p) => p.trim().length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: '720px' }}
    >
      {/* Title */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
        📖 {title}
      </h2>

      {/* Countdown */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
          fontSize: '0.75rem',
          color: 'var(--text3)',
        }}
      >
        {!isComplete ? (
          <>
            <span>Auto-advancing in</span>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'var(--accent)20',
                color: 'var(--accent)',
                fontFamily: 'var(--mono)',
                fontWeight: 600,
              }}
            >
              {countdown}s
            </span>
            <button
              className="btn-ghost"
              onClick={handleSkip}
              style={{ fontSize: '0.6875rem', padding: '2px 10px' }}
            >
              Skip →
            </button>
          </>
        ) : (
          <span style={{ color: 'var(--teal)' }}>✓ Reading complete • +10 XP</span>
        )}
      </div>

      {/* Statistic highlight */}
      {statistic && (
        <div
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '16px 28px',
            borderRadius: '12px',
            background: 'var(--card)',
            border: '1px solid var(--accent)30',
            marginBottom: '20px',
          }}
        >
          <span
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              fontFamily: 'var(--mono)',
              color: 'var(--accent)',
            }}
          >
            {statistic.value}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text2)', marginTop: '4px' }}>
            {statistic.label}
          </span>
        </div>
      )}

      {/* Body content */}
      <div style={{ lineHeight: 1.8, color: 'var(--text2)', fontSize: '0.9375rem' }}>
        {paragraphs.map((para, i) => (
          <p key={i} style={{ marginBottom: '14px' }}>
            {para}
          </p>
        ))}
      </div>

      {/* Clinical note */}
      {clinicalNote && (
        <div
          style={{
            marginTop: '16px',
            padding: '14px 18px',
            borderRadius: '10px',
            background: '#ffa94010',
            borderLeft: '3px solid var(--amber)',
            fontSize: '0.8125rem',
            color: 'var(--text2)',
            lineHeight: 1.7,
          }}
        >
          <strong style={{ color: 'var(--amber)' }}>🏥 Clinical Note: </strong>
          {clinicalNote}
        </div>
      )}
    </motion.div>
  );
}

export default ContextStep;
