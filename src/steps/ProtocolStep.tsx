// src/steps/ProtocolStep.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

export interface ProtocolStepItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface ProtocolStepProps {
  steps: ProtocolStepItem[];
  autoAdvanceMs?: number;
  onComplete?: (score: number) => void;
}

/* ═══════════════════════════════════════════════════════
   Component — 4 animated panels, auto-advance or manual
   +20 XP
   ═══════════════════════════════════════════════════════ */

function ProtocolStep({
  steps,
  autoAdvanceMs = 4000,
  onComplete,
}: ProtocolStepProps): React.JSX.Element {
  const [currentPanel, setCurrentPanel] = useState<number>(0);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  // Auto-advance timer
  useEffect(() => {
    if (isComplete) return;
    if (currentPanel >= steps.length) {
      setIsComplete(true);
      onComplete?.(100);
      return;
    }

    setProgress(0);
    const interval = 50; // 50ms ticks
    const ticks = autoAdvanceMs / interval;
    let tick = 0;

    const timer = setInterval(() => {
      tick++;
      setProgress((tick / ticks) * 100);
      if (tick >= ticks) {
        clearInterval(timer);
        setCurrentPanel((p) => p + 1);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [currentPanel, steps.length, autoAdvanceMs, isComplete, onComplete]);

  const handleNext = useCallback((): void => {
    if (currentPanel + 1 >= steps.length) {
      setIsComplete(true);
      onComplete?.(100);
    } else {
      setCurrentPanel((p) => p + 1);
    }
  }, [currentPanel, steps.length, onComplete]);

  const handlePrev = useCallback((): void => {
    setCurrentPanel((p) => Math.max(0, p - 1));
  }, []);

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          padding: '32px',
          textAlign: 'center',
          background: 'var(--card)',
          borderRadius: '14px',
          border: '1px solid var(--teal)30',
        }}
      >
        <span style={{ fontSize: '2rem' }}>✅</span>
        <h3 style={{ marginTop: '8px' }}>Protocol Ready!</h3>
        <p style={{ color: 'var(--text3)', fontSize: '0.8125rem' }}>
          All {steps.length} steps reviewed. +20 XP
        </p>
      </motion.div>
    );
  }

  const step = steps[currentPanel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: '640px' }}
    >
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
        📋 Experiment Protocol
      </h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text3)', marginBottom: '20px' }}>
        Step {currentPanel + 1} of {steps.length}
      </p>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {steps.map((_, i) => (
          <div
            key={i}
            style={{
              width: '32px',
              height: '4px',
              borderRadius: '2px',
              background: i < currentPanel ? 'var(--teal)' : i === currentPanel ? 'var(--accent)' : 'var(--border)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      {/* Panel */}
      <AnimatePresence mode="wait">
        {step && (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            style={{
              padding: '24px',
              borderRadius: '14px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <span style={{ fontSize: '2rem' }}>{step.icon}</span>
              <div>
                <h3 style={{ fontSize: '1.0625rem', color: 'var(--text)', marginBottom: '8px' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text2)', lineHeight: 1.7 }}>
                  {step.description}
                </p>
              </div>
            </div>

            {/* Auto-advance progress */}
            <div
              style={{
                marginTop: '16px',
                height: '3px',
                background: 'var(--bg2)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'var(--accent)',
                  transition: 'width 0.05s linear',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
        <button
          className="btn-ghost"
          onClick={handlePrev}
          disabled={currentPanel === 0}
          style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
        >
          ← Previous
        </button>
        <button
          className="btn-primary"
          onClick={handleNext}
          style={{ padding: '8px 20px', fontSize: '0.8125rem' }}
        >
          {currentPanel + 1 >= steps.length ? 'Complete ✓' : 'Next →'}
        </button>
      </div>
    </motion.div>
  );
}

export default ProtocolStep;
