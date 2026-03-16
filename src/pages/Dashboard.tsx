// src/pages/Dashboard.tsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useGameState, LEVEL_THRESHOLDS } from '../context/GameState';
import { MODULES } from '../data/modules';
import { EXPERIMENTS } from '../data/experiments';
import { BADGES, type BadgeConfig } from '../data/badges';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/* ═══════════════════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════════════════ */

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '32px 24px 64px',
    maxWidth: '1100px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '40px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    marginBottom: '8px',
  },
  sectionTitle: {
    fontSize: '1.125rem',
    fontWeight: 600,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  grid: {
    display: 'grid',
    gap: '20px',
    marginBottom: '32px',
  },
  statCard: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '6px',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 700,
    fontFamily: 'var(--mono)',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: 'var(--text2)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  levelSection: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '28px',
    marginBottom: '32px',
  },
  levelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  levelTitle: {
    fontSize: '1.375rem',
    fontWeight: 700,
  },
  levelProgress: {
    width: '100%',
    height: '10px',
    background: 'var(--bg2)',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  levelFill: {
    height: '100%',
    borderRadius: '10px',
    background: 'linear-gradient(90deg, var(--accent), var(--teal))',
    transition: 'width 0.6s ease',
  },
  levelMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: 'var(--text3)',
    fontFamily: 'var(--mono)',
  },
  badgeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '14px',
    marginBottom: '32px',
  },
  badgeCard: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '18px 14px',
    textAlign: 'center' as const,
    transition: 'all 0.25s ease',
  },
  badgeIcon: {
    fontSize: '2rem',
    marginBottom: '8px',
    display: 'block',
  },
  badgeName: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    marginBottom: '4px',
  },
  badgeDesc: {
    fontSize: '0.6875rem',
    color: 'var(--text3)',
    lineHeight: 1.4,
  },
  chartWrapper: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '24px',
    marginBottom: '32px',
  },
  chartContainer: {
    position: 'relative' as const,
    height: '260px',
  },
};

/* ═══════════════════════════════════════════════════════
   Badge Card
   ═══════════════════════════════════════════════════════ */

interface BadgeCardProps {
  badge: BadgeConfig;
  isEarned: boolean;
  index: number;
}

function BadgeCard({ badge, isEarned, index }: BadgeCardProps): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <div
        style={{
          ...styles.badgeCard,
          opacity: isEarned ? 1 : 0.35,
          borderColor: isEarned ? 'var(--border2)' : 'var(--border)',
        }}
      >
        <span style={styles.badgeIcon}>
          {isEarned ? badge.icon : '🔒'}
        </span>
        <div style={{
          ...styles.badgeName,
          color: isEarned ? 'var(--text)' : 'var(--text3)',
        }}>
          {badge.name}
        </div>
        <div style={styles.badgeDesc}>
          {isEarned ? badge.description : badge.criteria}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   Dashboard Page
   ═══════════════════════════════════════════════════════ */

function Dashboard(): React.JSX.Element {
  const { xp, level, levelTitle, completedExperiments, earnedBadges } = useGameState();

  // Level progress
  const currentThreshold = LEVEL_THRESHOLDS[Math.min(level - 1, LEVEL_THRESHOLDS.length - 1)];
  const nextThreshold = level < LEVEL_THRESHOLDS.length
    ? LEVEL_THRESHOLDS[level]
    : LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 2000;
  const xpInLevel = xp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  const progressPercent = Math.min(Math.round((xpInLevel / xpNeeded) * 100), 100);

  // Stats
  const totalExperiments = EXPERIMENTS.length;
  const completedCount = completedExperiments.length;
  const badgesEarned = earnedBadges.length;
  const estimatedHours = Math.round(completedCount * 14 / 60 * 10) / 10;

  // Module completion data for Chart.js
  const moduleCompletionData = useMemo(() => {
    const labels = MODULES.map((m) => m.title.replace(/ /g, '\n'));
    const data = MODULES.map((m) => {
      const modExps = EXPERIMENTS.filter((e) => e.moduleId === m.id);
      if (modExps.length === 0) return 0;
      const done = modExps.filter((e) => completedExperiments.includes(e.id)).length;
      return Math.round((done / modExps.length) * 100);
    });
    const colors = MODULES.map((m) => m.color + 'CC');
    const borderColors = MODULES.map((m) => m.color);

    return {
      labels,
      datasets: [
        {
          label: 'Completion %',
          data,
          backgroundColor: colors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 6,
          maxBarThickness: 48,
        },
      ],
    };
  }, [completedExperiments]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: false },
        tooltip: {
          backgroundColor: '#1a2240',
          titleColor: '#e8eaf0',
          bodyColor: '#8892b0',
          borderColor: 'rgba(100, 140, 255, 0.3)',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#8892b0',
            font: { size: 10, family: "'Space Grotesk', sans-serif" },
            maxRotation: 0,
          },
          grid: { display: false },
          border: { display: false },
        },
        y: {
          min: 0,
          max: 100,
          ticks: {
            color: '#4a5568',
            font: { size: 10, family: "'JetBrains Mono', monospace" },
            callback: (value: string | number) => `${value}%`,
            stepSize: 25,
          },
          grid: {
            color: 'rgba(100, 140, 255, 0.08)',
          },
          border: { display: false },
        },
      },
    }),
    []
  );

  return (
    <div style={styles.page}>
      {/* Header */}
      <motion.div
        style={styles.header}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 style={styles.title}>📊 Dashboard</h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.9375rem' }}>
          Track your progress through the Virtual Gait Lab
        </p>
      </motion.div>

      {/* Level Section */}
      <motion.div
        style={styles.levelSection}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div style={styles.levelRow}>
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--mono)',
                color: 'var(--amber)',
                marginBottom: '4px',
              }}
            >
              LEVEL {level}
            </div>
            <motion.div
              style={styles.levelTitle}
              key={levelTitle}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {levelTitle}
            </motion.div>
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              fontFamily: 'var(--mono)',
              color: 'var(--teal)',
            }}
          >
            {xp.toLocaleString()} XP
          </div>
        </div>

        <div style={styles.levelProgress}>
          <motion.div
            style={styles.levelFill}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>

        <div style={styles.levelMeta}>
          <span>{currentThreshold.toLocaleString()} XP</span>
          <span>{progressPercent}%</span>
          <span>{nextThreshold.toLocaleString()} XP</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div style={{ ...styles.grid, gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '32px' }}>
        <motion.div
          style={styles.statCard}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <span style={{ ...styles.statValue, color: 'var(--accent)' }}>
            {completedCount}
          </span>
          <span style={styles.statLabel}>Experiments</span>
        </motion.div>

        <motion.div
          style={styles.statCard}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <span style={{ ...styles.statValue, color: 'var(--teal)' }}>
            {xp.toLocaleString()}
          </span>
          <span style={styles.statLabel}>Total XP</span>
        </motion.div>

        <motion.div
          style={styles.statCard}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <span style={{ ...styles.statValue, color: 'var(--amber)' }}>
            {badgesEarned}
          </span>
          <span style={styles.statLabel}>Badges</span>
        </motion.div>

        <motion.div
          style={styles.statCard}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <span style={{ ...styles.statValue, color: 'var(--green)' }}>
            {estimatedHours}h
          </span>
          <span style={styles.statLabel}>Hours Spent</span>
        </motion.div>
      </div>

      {/* Module Completion Chart */}
      <div style={styles.chartWrapper}>
        <h3 style={styles.sectionTitle}>
          📈 Module Progress
        </h3>
        <div style={styles.chartContainer}>
          <Bar data={moduleCompletionData} options={chartOptions} />
        </div>
      </div>

      {/* Badges */}
      <h3 style={styles.sectionTitle}>
        🏆 Badges ({badgesEarned}/{BADGES.length})
      </h3>
      <div style={styles.badgeGrid}>
        {BADGES.map((badge, i) => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            isEarned={earnedBadges.includes(badge.id)}
            index={i}
          />
        ))}
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
