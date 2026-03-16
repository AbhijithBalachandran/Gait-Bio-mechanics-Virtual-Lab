// src/pages/Home.tsx
import React, { useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MODULES, type ModuleConfig } from '../data/modules';
import { useGameState } from '../context/GameState';
import { EXPERIMENTS } from '../data/experiments';

/* ═══════════════════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════════════════ */

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '32px 24px 64px',
    maxWidth: '1280px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '48px',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 700,
    marginBottom: '12px',
    background: 'linear-gradient(135deg, #4f8cff 0%, #00d4aa 50%, #ffa940 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: 'var(--text2)',
    fontSize: '1.05rem',
    maxWidth: '540px',
    margin: '0 auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
  },
  card: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'relative' as const,
  },
  banner: {
    height: '100px',
    position: 'relative' as const,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCanvas: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  bannerIcon: {
    position: 'relative' as const,
    zIndex: 2,
    fontSize: '2.25rem',
    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))',
  },
  body: {
    padding: '16px 18px 18px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    flex: 1,
  },
  moduleNumber: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    fontFamily: 'var(--mono)',
  },
  moduleTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text)',
    lineHeight: 1.3,
  },
  moduleDesc: {
    fontSize: '0.8rem',
    color: 'var(--text2)',
    lineHeight: 1.5,
    flex: 1,
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  metaItem: {
    fontSize: '0.6875rem',
    color: 'var(--text3)',
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
  },
  lockOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(10, 14, 26, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '14px',
    zIndex: 10,
    backdropFilter: 'blur(2px)',
  },
  lockIcon: {
    fontSize: '2rem',
    opacity: 0.7,
  },
};

/* ═══════════════════════════════════════════════════════
   Canvas Mini-Animation
   ═══════════════════════════════════════════════════════ */

interface CanvasBannerProps {
  color: string;
  moduleIndex: number;
}

function CanvasBanner({ color, moduleIndex }: CanvasBannerProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, time: number): void => {
      ctx.clearRect(0, 0, width, height);

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, color + '30');
      grad.addColorStop(1, color + '08');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Deterministic particles based on moduleIndex seed
      const particleCount = 12;
      for (let i = 0; i < particleCount; i++) {
        const seed = (moduleIndex * 7 + i * 13) % 100;
        const baseX = (seed / 100) * width;
        const baseY = ((seed * 3) % 100 / 100) * height;
        const radius = 1.5 + (seed % 3);
        const offsetX = Math.sin(time * 0.001 + seed) * 15;
        const offsetY = Math.cos(time * 0.0015 + seed * 0.5) * 10;
        const alpha = 0.15 + (Math.sin(time * 0.002 + seed) + 1) * 0.15;

        ctx.beginPath();
        ctx.arc(baseX + offsetX, baseY + offsetY, radius, 0, Math.PI * 2);
        ctx.fillStyle = color + Math.round(alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
      }

      // Waveform line
      ctx.beginPath();
      ctx.strokeStyle = color + '40';
      ctx.lineWidth = 1.5;
      for (let x = 0; x <= width; x += 2) {
        const seedOffset = moduleIndex * 0.5;
        const y =
          height * 0.5 +
          Math.sin(x * 0.02 + time * 0.002 + seedOffset) * 12 +
          Math.sin(x * 0.005 + time * 0.001) * 8;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    },
    [color, moduleIndex]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = (): void => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();

    const animate = (time: number): void => {
      const rect = canvas.getBoundingClientRect();
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      draw(ctx, rect.width, rect.height, time);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw]);

  return <canvas ref={canvasRef} style={styles.bannerCanvas} />;
}

/* ═══════════════════════════════════════════════════════
   Difficulty Pill
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

/* ═══════════════════════════════════════════════════════
   Module Card
   ═══════════════════════════════════════════════════════ */

interface ModuleCardProps {
  module: ModuleConfig;
  index: number;
  isLocked: boolean;
  completionPercent: number;
}

function ModuleCard({ module, index, isLocked, completionPercent }: ModuleCardProps): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
    >
      <Link
        to={isLocked ? '#' : `/module/${module.id}`}
        style={{ textDecoration: 'none', color: 'inherit' }}
        onClick={(e) => {
          if (isLocked) e.preventDefault();
        }}
      >
        <div
          style={{
            ...styles.card,
            borderColor: completionPercent === 100 ? module.color + '60' : 'var(--border)',
          }}
          onMouseEnter={(e) => {
            if (!isLocked) {
              (e.currentTarget as HTMLDivElement).style.borderColor = module.color + '80';
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${module.color}20`;
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor =
              completionPercent === 100 ? module.color + '60' : 'var(--border)';
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
          }}
        >
          {/* Banner */}
          <div style={styles.banner}>
            <CanvasBanner color={module.color} moduleIndex={index} />
            <span style={styles.bannerIcon}>{module.icon}</span>
          </div>

          {/* Body */}
          <div style={styles.body}>
            <span style={{ ...styles.moduleNumber, color: module.color }}>
              Module {module.id.replace('m', '')}
            </span>
            <span style={styles.moduleTitle}>{module.title}</span>
            <span style={styles.moduleDesc}>{module.description}</span>

            {/* Meta Row */}
            <div style={styles.metaRow}>
              <span className={getDifficultyPillClass(module.difficulty)}>
                {module.difficulty}
              </span>
              <span style={styles.metaItem}>⏱ {module.timeEstimate}</span>
              <span style={{ ...styles.metaItem, color: 'var(--amber)' }}>
                ✦ {module.xpReward} XP
              </span>
            </div>

            {/* Progress Bar */}
            <div className="progress-bar" style={{ marginTop: '4px' }}>
              <div
                className="progress-bar__fill"
                style={{
                  width: `${completionPercent}%`,
                  background: completionPercent === 100
                    ? `linear-gradient(90deg, ${module.color}, var(--teal))`
                    : `linear-gradient(90deg, ${module.color}, ${module.color}99)`,
                }}
              />
            </div>
          </div>

          {/* Lock Overlay */}
          {isLocked && (
            <div style={styles.lockOverlay}>
              <span style={styles.lockIcon}>🔒</span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   Home Page
   ═══════════════════════════════════════════════════════ */

function Home(): React.JSX.Element {
  const { completedExperiments } = useGameState();

  const getCompletionPercent = (mod: ModuleConfig): number => {
    const modExps = EXPERIMENTS.filter((e) => e.moduleId === mod.id);
    if (modExps.length === 0) return 0;
    const completed = modExps.filter((e) => completedExperiments.includes(e.id)).length;
    return Math.round((completed / modExps.length) * 100);
  };

  const isModuleLocked = (index: number): boolean => {
    if (index === 0) return false;
    const prevModule = MODULES[index - 1];
    return getCompletionPercent(prevModule) < 100;
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <motion.div
        style={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 style={styles.title}>Virtual Gait Lab</h1>
        <p style={styles.subtitle}>
          Master gait biomechanics through 32 interactive experiments across 8 progressive modules.
        </p>
      </motion.div>

      {/* Module Grid */}
      <div style={styles.grid}>
        {MODULES.map((mod, i) => (
          <ModuleCard
            key={mod.id}
            module={mod}
            index={i}
            isLocked={isModuleLocked(i)}
            completionPercent={getCompletionPercent(mod)}
          />
        ))}
      </div>

      {/* Responsive override */}
      <style>{`
        @media (max-width: 1024px) {
          div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 600px) {
          div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Home;
