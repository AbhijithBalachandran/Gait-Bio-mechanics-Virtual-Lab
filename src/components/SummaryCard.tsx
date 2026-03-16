// src/components/SummaryCard.tsx
import React, { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../context/GameState';
import { getBadgeById } from '../data/badges';

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

interface SummaryCardProps {
  experimentTitle: string;
  keyFormula: string;
  keyConcept: string;
  score: number;
  badgeId?: string;
  nextExpPath?: string;
  moduleId: string;
}

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */

function SummaryCard({
  experimentTitle,
  keyFormula,
  keyConcept,
  score,
  badgeId,
  nextExpPath,
  moduleId,
}: SummaryCardProps): React.JSX.Element {
  const navigate = useNavigate();
  const { earnedBadges } = useGameState();
  const cardRef = useRef<HTMLDivElement>(null);

  const badge = badgeId ? getBadgeById(badgeId) : null;
  const isBadgeEarned = badgeId ? earnedBadges.includes(badgeId) : false;

  const scoreColor = score >= 80 ? 'var(--teal)' : score >= 50 ? 'var(--amber)' : 'var(--red)';

  // Download as PNG using canvas
  const handleDownload = useCallback((): void => {
    const el = cardRef.current;
    if (!el) return;

    // Create a canvas and draw text content
    const canvas = document.createElement('canvas');
    const dpr = 2;
    canvas.width = 600 * dpr;
    canvas.height = 400 * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#1a2240';
    ctx.roundRect(0, 0, 600, 400, 16);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(100, 140, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.roundRect(0, 0, 600, 400, 16);
    ctx.stroke();

    // Title
    ctx.fillStyle = '#e8eaf0';
    ctx.font = '600 20px "Space Grotesk", sans-serif';
    ctx.fillText(experimentTitle, 32, 48);

    // Score
    ctx.fillStyle = score >= 80 ? '#52e5a0' : score >= 50 ? '#ffa940' : '#ff5252';
    ctx.font = '700 48px "JetBrains Mono", monospace';
    ctx.fillText(`${score}%`, 32, 110);

    // Formula
    ctx.fillStyle = '#4f8cff';
    ctx.font = '500 16px "JetBrains Mono", monospace';
    ctx.fillText(keyFormula, 32, 160);

    // Concept
    ctx.fillStyle = '#8892b0';
    ctx.font = '400 14px "Space Grotesk", sans-serif';
    const words = keyConcept.split(' ');
    let line = '';
    let y = 200;
    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > 536) {
        ctx.fillText(line.trim(), 32, y);
        line = word + ' ';
        y += 22;
      } else {
        line = test;
      }
    }
    ctx.fillText(line.trim(), 32, y);

    // Badge
    if (badge && isBadgeEarned) {
      ctx.fillStyle = '#ffa940';
      ctx.font = '600 14px "Space Grotesk", sans-serif';
      ctx.fillText(`🏆 ${badge.name}`, 32, 340);
    }

    // Branding
    ctx.fillStyle = '#4a5568';
    ctx.font = '400 11px "Space Grotesk", sans-serif';
    ctx.fillText('KinetraxLearn — Virtual Gait Lab', 32, 380);

    // Download
    const link = document.createElement('a');
    link.download = `${experimentTitle.replace(/\s+/g, '_')}_summary.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [experimentTitle, keyFormula, keyConcept, score, badge, isBadgeEarned]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        background: 'var(--card)',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        padding: '28px',
        maxWidth: '560px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            fontSize: '0.625rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text3)',
            fontWeight: 600,
            marginBottom: '6px',
          }}
        >
          Experiment Complete
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>
          {experimentTitle}
        </h3>
      </div>

      {/* Score */}
      <div
        style={{
          fontSize: '3rem',
          fontWeight: 700,
          fontFamily: 'var(--mono)',
          color: scoreColor,
          marginBottom: '20px',
        }}
      >
        {score}%
      </div>

      {/* Key Formula */}
      <div
        style={{
          padding: '14px 18px',
          borderRadius: '10px',
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          fontFamily: 'var(--mono)',
          fontSize: '1rem',
          fontWeight: 500,
          color: 'var(--accent)',
          marginBottom: '16px',
          overflowX: 'auto',
        }}
      >
        {keyFormula}
      </div>

      {/* Key Insight */}
      <p style={{ fontSize: '0.875rem', color: 'var(--text2)', lineHeight: 1.7, marginBottom: '20px' }}>
        💡 {keyConcept}
      </p>

      {/* Badge */}
      {badge && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: isBadgeEarned ? 'rgba(255, 169, 64, 0.1)' : 'var(--bg2)',
            border: `1px solid ${isBadgeEarned ? '#ffa94040' : 'var(--border)'}`,
            marginBottom: '20px',
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>{isBadgeEarned ? badge.icon : '🔒'}</span>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: isBadgeEarned ? 'var(--amber)' : 'var(--text3)' }}>
              {badge.name}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text3)' }}>
              {isBadgeEarned ? badge.description : badge.criteria}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button className="btn-secondary" onClick={handleDownload} style={{ flex: 1 }}>
          📥 Download PNG
        </button>
        <button
          className="btn-primary"
          onClick={() => navigate(nextExpPath ?? `/module/${moduleId}`)}
          style={{ flex: 1 }}
        >
          {nextExpPath ? 'Next Experiment →' : 'Back to Module →'}
        </button>
      </div>
    </motion.div>
  );
}

export default SummaryCard;
