// src/components/XPBar.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { useGameState, LEVEL_THRESHOLDS } from '../context/GameState';

/* ═══════════════════════════════════════════════════════
   XP Bar — fixed top-right progress indicator
   ═══════════════════════════════════════════════════════ */

interface XPBarProps {
  compact?: boolean;
}

function XPBar({ compact = false }: XPBarProps): React.JSX.Element {
  const { xp, level, levelTitle } = useGameState();

  const currentThreshold = LEVEL_THRESHOLDS[Math.min(level - 1, LEVEL_THRESHOLDS.length - 1)];
  const nextThreshold = level < LEVEL_THRESHOLDS.length
    ? LEVEL_THRESHOLDS[level]
    : LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 2000;
  const xpInLevel = xp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  const pct = Math.min(Math.round((xpInLevel / xpNeeded) * 100), 100);

  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 12px',
          borderRadius: '100px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          fontSize: '0.6875rem',
        }}
      >
        <span style={{ fontWeight: 700, color: 'var(--amber)', fontFamily: 'var(--mono)' }}>
          Lv.{level}
        </span>
        <span style={{ color: 'var(--teal)', fontWeight: 600 }}>{xp.toLocaleString()} XP</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 18px',
        borderRadius: '14px',
        background: 'var(--card)',
        border: '1px solid var(--accent)22',
        boxShadow: '0 0 20px rgba(79, 140, 255, 0.08)',
      }}
    >
      {/* Level badge */}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(79, 140, 255, 0.15)',
          border: '1.5px solid var(--accent)',
          fontSize: '0.8125rem',
          fontWeight: 700,
          fontFamily: 'var(--mono)',
          color: 'var(--accent)',
        }}
      >
        {level}
      </div>

      <div style={{ flex: 1, minWidth: '120px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.6875rem',
            marginBottom: '4px',
          }}
        >
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{levelTitle}</span>
          <motion.span
            key={xp}
            initial={{ scale: 1.3, color: '#52e5a0' }}
            animate={{ scale: 1, color: '#00d4aa' }}
            style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}
          >
            {xp.toLocaleString()} XP
          </motion.span>
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: '100%',
            height: '6px',
            background: 'var(--bg2)',
            borderRadius: '6px',
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              height: '100%',
              borderRadius: '6px',
              background: 'linear-gradient(90deg, var(--accent), var(--teal))',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.5625rem',
            color: 'var(--text3)',
            fontFamily: 'var(--mono)',
            marginTop: '2px',
          }}
        >
          <span>{currentThreshold}</span>
          <span>{pct}%</span>
          <span>{nextThreshold}</span>
        </div>
      </div>
    </div>
  );
}

export default XPBar;
