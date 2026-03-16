// src/pages/ModulePage.tsx
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MODULES } from '../data/modules';
import { getExperimentsByModule, type ExperimentConfig } from '../data/experiments';
import { useGameState } from '../context/GameState';

/* ═══════════════════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════════════════ */

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '32px 24px 64px',
    maxWidth: '900px',
    margin: '0 auto',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.8125rem',
    color: 'var(--text2)',
    textDecoration: 'none',
    marginBottom: '24px',
    transition: 'color 0.2s',
  },
  header: {
    marginBottom: '36px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerIcon: {
    fontSize: '2.5rem',
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '14px',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: 'var(--text)',
    marginBottom: '4px',
  },
  headerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '0.8125rem',
    color: 'var(--text2)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  row: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
  },
  rowNumber: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8125rem',
    fontWeight: 700,
    fontFamily: 'var(--mono)',
    flexShrink: 0,
  },
  rowContent: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '4px',
  },
  rowMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '0.75rem',
    color: 'var(--text3)',
  },
  dots: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
    flexShrink: 0,
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    transition: 'background 0.2s',
  },
  score: {
    fontSize: '0.75rem',
    fontWeight: 600,
    fontFamily: 'var(--mono)',
    flexShrink: 0,
  },
  lockBadge: {
    fontSize: '1.125rem',
    opacity: 0.5,
  },
  empty: {
    textAlign: 'center' as const,
    padding: '64px 24px',
  },
};

/* ═══════════════════════════════════════════════════════
   Step Dots
   ═══════════════════════════════════════════════════════ */

interface StepDotsProps {
  expId: string;
  totalSteps: number;
  color: string;
}

function StepDots({ expId, totalSteps, color }: StepDotsProps): React.JSX.Element {
  const { experimentScores } = useGameState();
  const scores = experimentScores[expId] ?? {};
  const completedSteps = Object.keys(scores).length;

  return (
    <div style={styles.dots}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          style={{
            ...styles.dot,
            background: i < completedSteps ? color : 'var(--bg2)',
            border: `1px solid ${i < completedSteps ? color : 'var(--border)'}`,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Experiment Row
   ═══════════════════════════════════════════════════════ */

interface ExperimentRowProps {
  experiment: ExperimentConfig;
  index: number;
  color: string;
  moduleId: string;
  isLocked: boolean;
}

function ExperimentRow({ experiment, index, color, moduleId, isLocked }: ExperimentRowProps): React.JSX.Element {
  const navigate = useNavigate();
  const { experimentScores, completedExperiments } = useGameState();
  const isCompleted = completedExperiments.includes(experiment.id);
  const scores = experimentScores[experiment.id] ?? {};
  const scoreValues = Object.values(scores);
  const bestScore = scoreValues.length > 0 ? Math.max(...scoreValues) : null;

  const handleClick = (): void => {
    if (!isLocked) {
      navigate(`/experiment/${moduleId}/${experiment.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
    >
      <div
        style={{
          ...styles.row,
          opacity: isLocked ? 0.45 : 1,
          borderColor: isCompleted ? color + '40' : 'var(--border)',
          cursor: isLocked ? 'not-allowed' : 'pointer',
        }}
        onClick={handleClick}
        onMouseEnter={(e) => {
          if (!isLocked) {
            (e.currentTarget as HTMLDivElement).style.borderColor = color + '80';
            (e.currentTarget as HTMLDivElement).style.background = 'var(--card2)';
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor =
            isCompleted ? color + '40' : 'var(--border)';
          (e.currentTarget as HTMLDivElement).style.background = 'var(--card)';
        }}
      >
        {/* Number Badge */}
        <div
          style={{
            ...styles.rowNumber,
            background: isCompleted ? color + '20' : 'var(--bg2)',
            color: isCompleted ? color : 'var(--text3)',
            border: `1px solid ${isCompleted ? color + '40' : 'var(--border)'}`,
          }}
        >
          {isCompleted ? '✓' : index + 1}
        </div>

        {/* Content */}
        <div style={styles.rowContent}>
          <div style={styles.rowTitle}>{experiment.title}</div>
          <div style={styles.rowMeta}>
            <span>⏱ {experiment.estimatedTime}</span>
            <span style={{ color: 'var(--amber)' }}>✦ {experiment.xpReward} XP</span>
            <span
              className={
                experiment.difficulty === 'Beginner'
                  ? 'pill pill-green'
                  : experiment.difficulty === 'Intermediate'
                    ? 'pill pill-amber'
                    : 'pill pill-red'
              }
            >
              {experiment.difficulty}
            </span>
          </div>
        </div>

        {/* Step Dots */}
        <StepDots expId={experiment.id} totalSteps={8} color={color} />

        {/* Score or Lock */}
        {isLocked ? (
          <span style={styles.lockBadge}>🔒</span>
        ) : bestScore !== null ? (
          <span style={{ ...styles.score, color }}>
            {bestScore}%
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   Module Page
   ═══════════════════════════════════════════════════════ */

function ModulePage(): React.JSX.Element {
  const { moduleId } = useParams<{ moduleId: string }>();
  const { completedExperiments } = useGameState();
  const mod = MODULES.find((m) => m.id === moduleId);

  if (!mod) {
    return (
      <div style={styles.empty}>
        <h2>Module Not Found</h2>
        <p style={{ color: 'var(--text2)', marginTop: '8px' }}>
          The module &quot;{moduleId}&quot; does not exist.
        </p>
        <Link to="/" className="btn-primary" style={{ marginTop: '24px', display: 'inline-flex', padding: '10px 20px', borderRadius: '8px', color: '#fff', background: 'var(--accent)', textDecoration: 'none' }}>
          ← Back to Lab
        </Link>
      </div>
    );
  }

  const experiments = getExperimentsByModule(mod.id);

  const isExpLocked = (index: number): boolean => {
    if (index === 0) return false;
    return !completedExperiments.includes(experiments[index - 1].id);
  };

  return (
    <div style={styles.page}>
      {/* Back Link */}
      <Link to="/" style={styles.backLink}>
        ← Back to Lab
      </Link>

      {/* Header */}
      <motion.div
        style={styles.header}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div
          style={{
            ...styles.headerIcon,
            background: mod.color + '18',
            border: `1px solid ${mod.color}30`,
          }}
        >
          {mod.icon}
        </div>
        <div style={styles.headerInfo}>
          <div style={styles.headerTitle}>{mod.title}</div>
          <div style={styles.headerMeta}>
            <span className={getDifficultyPillClass(mod.difficulty)}>{mod.difficulty}</span>
            <span>⏱ {mod.timeEstimate}</span>
            <span style={{ color: 'var(--amber)' }}>✦ {mod.xpReward} XP</span>
            <span>{experiments.length} experiments</span>
          </div>
        </div>
      </motion.div>

      {/* Description */}
      <p style={{ color: 'var(--text2)', marginBottom: '28px', fontSize: '0.9375rem' }}>
        {mod.description}
      </p>

      {/* Experiment List */}
      <div style={styles.list}>
        {experiments.map((exp, i) => (
          <ExperimentRow
            key={exp.id}
            experiment={exp}
            index={i}
            color={mod.color}
            moduleId={mod.id}
            isLocked={isExpLocked(i)}
          />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Helper (shared with Home)
   ═══════════════════════════════════════════════════════ */

function getDifficultyPillClass(difficulty: string): string {
  switch (difficulty) {
    case 'UG':
      return 'pill pill-blue';
    case 'PG':
      return 'pill pill-red';
    case 'UG+PG':
      return 'pill pill-amber';
    default:
      return 'pill pill-blue';
  }
}

export default ModulePage;
