// src/components/ExperimentShell.tsx
import React, { useState, useCallback, useEffect, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameState } from '../context/GameState';
import { MODULES } from '../data/modules';
import { getExperimentById } from '../data/experiments';

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

export interface StepConfig {
  id: string;
  name: string;
  component: ReactNode;
  minScore?: number;
  xpReward: number;
}

interface ExperimentShellProps {
  moduleId: string;
  expId: string;
  steps: StepConfig[];
}

type StepStatus = 'locked' | 'current' | 'completed';

/* ═══════════════════════════════════════════════════════
   Hex Step Indicator
   ═══════════════════════════════════════════════════════ */

interface HexStepProps {
  index: number;
  name: string;
  status: StepStatus;
  onClick: () => void;
}

function HexStep({ index, name, status, onClick }: HexStepProps): React.JSX.Element {
  const colors: Record<StepStatus, { bg: string; border: string; text: string }> = {
    locked: { bg: 'var(--bg2)', border: 'var(--border)', text: 'var(--text3)' },
    current: { bg: 'rgba(79, 140, 255, 0.15)', border: 'var(--accent)', text: 'var(--accent)' },
    completed: { bg: 'rgba(82, 229, 160, 0.15)', border: '#52e5a0', text: '#52e5a0' },
  };

  const c = colors[status];

  return (
    <button
      onClick={onClick}
      disabled={status === 'locked'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 12px',
        background: c.bg,
        border: `1.5px solid ${c.border}`,
        borderRadius: '10px',
        cursor: status === 'locked' ? 'not-allowed' : 'pointer',
        width: '100%',
        transition: 'all 0.2s',
        position: 'relative',
      }}
    >
      {/* Hex badge */}
      <div
        style={{
          width: '30px',
          height: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          fontSize: '0.75rem',
          fontWeight: 700,
          fontFamily: 'var(--mono)',
          background: c.bg,
          border: `1.5px solid ${c.border}`,
          color: c.text,
          flexShrink: 0,
        }}
      >
        {status === 'completed' ? '✓' : status === 'locked' ? '🔒' : index + 1}
      </div>

      <span
        style={{
          fontSize: '0.75rem',
          fontWeight: 500,
          color: c.text,
          textAlign: 'left',
        }}
      >
        {name}
      </span>

      {/* Pulse ring for current */}
      {status === 'current' && (
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            position: 'absolute',
            left: '12px',
            width: '30px',
            height: '30px',
            borderRadius: '8px',
            border: '2px solid var(--accent)',
          }}
        />
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   Experiment Shell
   ═══════════════════════════════════════════════════════ */

function ExperimentShell({ moduleId, expId, steps }: ExperimentShellProps): React.JSX.Element {
  const navigate = useNavigate();
  const { addXP, completeExperiment, saveScore, experimentScores } = useGameState();

  const mod = MODULES.find((m) => m.id === moduleId);
  const exp = getExperimentById(expId);

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [earnedXP, setEarnedXP] = useState<number>(0);
  const [toast, setToast] = useState<string | null>(null);

  // Load previously completed steps from GameState
  useEffect(() => {
    const scores = experimentScores[expId];
    if (scores) {
      const done = new Set<number>();
      steps.forEach((step, i) => {
        if (scores[step.id] !== undefined) done.add(i);
      });
      setCompletedSteps(done);
      if (done.size > 0) {
        const lastDone = Math.max(...Array.from(done));
        if (lastDone + 1 < steps.length) setCurrentStep(lastDone + 1);
      }
    }
  }, [expId, experimentScores, steps]);

  const getStepStatus = useCallback(
    (index: number): StepStatus => {
      if (completedSteps.has(index)) return 'completed';
      if (index === currentStep) return 'current';
      if (index < currentStep || completedSteps.has(index - 1)) return 'current';
      return 'locked';
    },
    [completedSteps, currentStep]
  );

  const completeStep = useCallback(
    (stepIndex: number, score: number = 100): void => {
      const step = steps[stepIndex];
      if (!step) return;

      // Check minimum score gate
      if (step.minScore && score < step.minScore) {
        setToast(`Score ${score}% below minimum ${step.minScore}%. Try again!`);
        setTimeout(() => setToast(null), 3000);
        return;
      }

      // Award XP
      const xpEarned = Math.round((step.xpReward * score) / 100);
      addXP(xpEarned);
      setEarnedXP((prev) => prev + xpEarned);
      saveScore(expId, step.id, score);

      setCompletedSteps((prev) => {
        const next = new Set(prev);
        next.add(stepIndex);
        return next;
      });

      // Toast
      setToast(`✓ ${step.name} complete! +${xpEarned} XP`);
      setTimeout(() => setToast(null), 3000);

      // Advance or complete experiment
      if (stepIndex + 1 < steps.length) {
        setTimeout(() => setCurrentStep(stepIndex + 1), 500);
      } else {
        completeExperiment(expId);
      }
    },
    [steps, addXP, saveScore, expId, completeExperiment]
  );

  if (!mod || !exp) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <h2>Experiment Not Found</h2>
        <Link to="/" className="btn-primary" style={{ marginTop: '16px', display: 'inline-flex', padding: '10px 20px', borderRadius: '8px', color: '#fff', background: 'var(--accent)', textDecoration: 'none' }}>
          ← Back to Lab
        </Link>
      </div>
    );
  }

  const allComplete = completedSteps.size === steps.length;

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 100px)' }}>
      {/* ── Left Sidebar ── */}
      <aside
        style={{
          width: '260px',
          flexShrink: 0,
          background: 'var(--bg2)',
          borderRight: '1px solid var(--border)',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          overflowY: 'auto',
        }}
      >
        {/* Module / Experiment header */}
        <Link
          to={`/module/${moduleId}`}
          style={{ fontSize: '0.6875rem', color: 'var(--text3)', textDecoration: 'none', marginBottom: '4px' }}
        >
          ← {mod.title}
        </Link>
        <h4 style={{ fontSize: '0.9375rem', color: 'var(--text)', marginBottom: '12px', lineHeight: 1.3 }}>
          {exp.title}
        </h4>

        {/* Step timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {steps.map((step, i) => (
            <React.Fragment key={step.id}>
              <HexStep
                index={i}
                name={step.name}
                status={getStepStatus(i)}
                onClick={() => {
                  if (getStepStatus(i) !== 'locked') setCurrentStep(i);
                }}
              />
              {/* Connecting line */}
              {i < steps.length - 1 && (
                <div
                  style={{
                    width: '2px',
                    height: '12px',
                    marginLeft: '26px',
                    background: completedSteps.has(i) ? '#52e5a0' : 'var(--border)',
                    transition: 'background 0.3s',
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* XP earned */}
        <div
          style={{
            padding: '12px',
            borderRadius: '10px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            textAlign: 'center',
            marginTop: 'auto',
          }}
        >
          <div style={{ fontSize: '0.625rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            XP Earned
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--teal)' }}>
            +{earnedXP}
          </div>
        </div>

        {allComplete && (
          <button
            className="btn-primary"
            onClick={() => navigate(`/module/${moduleId}`)}
            style={{ width: '100%', marginTop: '8px' }}
          >
            ✓ Back to Module
          </button>
        )}
      </aside>

      {/* ── Content Area ── */}
      <main style={{ flex: 1, padding: '24px 32px', position: 'relative', overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {steps[currentStep]?.component}

            {/* Manual complete button (for steps without embedded scoring) */}
            {!completedSteps.has(currentStep) && (
              <button
                className="btn-primary"
                onClick={() => completeStep(currentStep)}
                style={{ marginTop: '24px', padding: '10px 24px' }}
              >
                Complete Step →
              </button>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 20 }}
              style={{
                position: 'fixed',
                bottom: '24px',
                left: '50%',
                padding: '12px 24px',
                borderRadius: '12px',
                background: 'var(--card)',
                border: '1px solid var(--teal)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--teal)',
                zIndex: 1000,
                whiteSpace: 'nowrap',
              }}
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default ExperimentShell;
