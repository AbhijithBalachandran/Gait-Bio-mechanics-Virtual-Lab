// src/steps/PracticeStep.tsx
import React, { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

interface LeaderboardEntry {
  name: string;
  score: number;
  time: number;
  date: string;
}

interface PracticeStepProps {
  simulationComponent: ReactNode;
  scoringFn?: () => number;
  minScore?: number;
  timeLimitSeconds?: number;
  onComplete?: (score: number) => void;
}

const LEADERBOARD_KEY = 'kinetrax_practice_leaderboard';

/* ═══════════════════════════════════════════════════════
   Component — +0−50 XP, harder mode, 60s timer
   localStorage leaderboard
   ═══════════════════════════════════════════════════════ */

function PracticeStep({
  simulationComponent,
  scoringFn,
  minScore = 40,
  timeLimitSeconds = 60,
  onComplete,
}: PracticeStepProps): React.JSX.Element {
  const [timeLeft, setTimeLeft] = useState<number>(timeLimitSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [score, setScore] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load leaderboard
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LEADERBOARD_KEY);
      if (stored) {
        setLeaderboard(JSON.parse(stored) as LeaderboardEntry[]);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Timer
  useEffect(() => {
    if (!isRunning) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  const handleStart = useCallback((): void => {
    setIsRunning(true);
    setTimeLeft(timeLimitSeconds);
    setScore(null);
  }, [timeLimitSeconds]);

  const handleSubmit = useCallback((): void => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);

    const s = scoringFn ? scoringFn() : 80;
    setScore(s);

    // Save to leaderboard
    const entry: LeaderboardEntry = {
      name: 'You',
      score: s,
      time: timeLimitSeconds - timeLeft,
      date: new Date().toLocaleDateString(),
    };

    const newBoard = [...leaderboard, entry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    setLeaderboard(newBoard);
    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(newBoard));
    } catch {
      // Storage full
    }

    if (s >= minScore) {
      const xpAward = Math.min(50, Math.round(s / 2));
      onComplete?.(xpAward);
    }
  }, [scoringFn, timeLimitSeconds, timeLeft, leaderboard, minScore, onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerColor = timeLeft <= 10 ? 'var(--red)' : timeLeft <= 20 ? 'var(--amber)' : 'var(--accent)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
        🏋️ Practice Mode
      </h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text3)', marginBottom: '20px' }}>
        Advanced challenge! Complete in {timeLimitSeconds}s. Minimum score: {minScore}%
      </p>

      {/* Timer bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            fontFamily: 'var(--mono)',
            color: timerColor,
            minWidth: '80px',
          }}
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        <div style={{ flex: 1, height: '6px', background: 'var(--bg2)', borderRadius: '3px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${(timeLeft / timeLimitSeconds) * 100}%`,
              height: '100%',
              background: timerColor,
              borderRadius: '3px',
              transition: 'width 0.5s linear, background 0.3s',
            }}
          />
        </div>
        {!isRunning && score === null && (
          <button className="btn-primary" onClick={handleStart} style={{ padding: '8px 20px' }}>
            ▶ Start
          </button>
        )}
        {isRunning && (
          <button className="btn-secondary" onClick={handleSubmit} style={{ padding: '8px 20px' }}>
            Submit →
          </button>
        )}
      </div>

      {/* Simulation */}
      <div
        style={{
          padding: '20px',
          borderRadius: '14px',
          background: 'var(--card)',
          border: `1px solid ${isRunning ? timerColor + '40' : 'var(--border)'}`,
          marginBottom: '20px',
          opacity: isRunning || score !== null ? 1 : 0.5,
          pointerEvents: isRunning ? 'auto' : 'none',
          transition: 'all 0.3s',
        }}
      >
        {simulationComponent}
      </div>

      {/* Score */}
      {score !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'var(--card)',
            border: `1px solid ${score >= minScore ? 'var(--teal)' : 'var(--red)'}30`,
            textAlign: 'center',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              fontFamily: 'var(--mono)',
              color: score >= minScore ? 'var(--teal)' : 'var(--red)',
            }}
          >
            {score}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>
            Time: {timeLimitSeconds - timeLeft}s •{' '}
            {score >= minScore ? `+${Math.min(50, Math.round(score / 2))} XP` : 'Not passed'}
          </div>
        </motion.div>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div
          style={{
            background: 'var(--card)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            padding: '16px',
          }}
        >
          <h4 style={{ fontSize: '0.8125rem', color: 'var(--amber)', marginBottom: '10px' }}>
            🏅 Leaderboard
          </h4>
          {leaderboard.slice(0, 5).map((entry, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                fontSize: '0.75rem',
              }}
            >
              <span style={{ color: 'var(--text2)' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} {entry.name}
              </span>
              <span style={{ fontFamily: 'var(--mono)', color: 'var(--teal)' }}>
                {entry.score}% ({entry.time}s)
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default PracticeStep;
