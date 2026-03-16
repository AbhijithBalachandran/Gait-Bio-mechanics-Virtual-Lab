// src/steps/SummaryStep.tsx
import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import SummaryCard from '../components/SummaryCard';
import { useGameState } from '../context/GameState';

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

interface SummaryStepProps {
  experimentTitle: string;
  keyFormula: string;
  keyConcept: string;
  badgeId?: string;
  moduleId: string;
  expId: string;
  nextExpPath?: string;
  onComplete?: (score: number) => void;
}

/* ═══════════════════════════════════════════════════════
   Component — +50 XP, badge award, download PNG
   ═══════════════════════════════════════════════════════ */

function SummaryStep({
  experimentTitle,
  keyFormula,
  keyConcept,
  badgeId,
  moduleId,
  expId,
  nextExpPath,
  onComplete,
}: SummaryStepProps): React.JSX.Element {
  const { experimentScores, earnBadge, addXP } = useGameState();

  // Calculate total experiment score
  const scores = experimentScores[expId] ?? {};
  const scoreValues = Object.values(scores);
  const avgScore = scoreValues.length > 0
    ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
    : 100;

  // Award badge if applicable
  const handleMountBadge = useCallback((): void => {
    if (badgeId) {
      earnBadge(badgeId);
    }
    addXP(50);
    onComplete?.(100);
  }, [badgeId, earnBadge, addXP, onComplete]);

  // Trigger badge and XP on mount
  React.useEffect(() => {
    const timer = setTimeout(handleMountBadge, 800);
    return () => clearTimeout(timer);
  }, [handleMountBadge]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: '600px', margin: '0 auto' }}
    >
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px', textAlign: 'center' }}>
        🎉 Experiment Complete!
      </h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text3)', marginBottom: '24px', textAlign: 'center' }}>
        Great work! Here's your experiment summary.
      </p>

      <SummaryCard
        experimentTitle={experimentTitle}
        keyFormula={keyFormula}
        keyConcept={keyConcept}
        score={avgScore}
        badgeId={badgeId}
        nextExpPath={nextExpPath}
        moduleId={moduleId}
      />

      {/* Key takeaways */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          marginTop: '20px',
          padding: '16px 20px',
          borderRadius: '12px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
        }}
      >
        <h4 style={{ fontSize: '0.8125rem', color: 'var(--accent)', marginBottom: '10px' }}>
          📝 Key Takeaways
        </h4>
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'var(--bg2)',
            fontFamily: 'var(--mono)',
            fontSize: '0.8125rem',
            color: 'var(--accent)',
            marginBottom: '10px',
          }}
        >
          {keyFormula}
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text2)', lineHeight: 1.7 }}>
          {keyConcept}
        </p>
      </motion.div>
    </motion.div>
  );
}

export default SummaryStep;
