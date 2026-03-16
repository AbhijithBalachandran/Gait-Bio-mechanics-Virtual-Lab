// src/components/BadgeToast.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getBadgeById } from '../data/badges';

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

interface ToastItem {
  id: string;
  badgeId: string;
  xp: number;
}

interface BadgeToastProps {
  badgeQueue: { badgeId: string; xp: number }[];
  onDismiss?: () => void;
}

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */

function BadgeToast({ badgeQueue, onDismiss }: BadgeToastProps): React.JSX.Element {
  const [visibleToasts, setVisibleToasts] = useState<ToastItem[]>([]);
  const processedRef = useRef<Set<string>>(new Set());

  // Process incoming queue
  useEffect(() => {
    for (const item of badgeQueue) {
      if (!processedRef.current.has(item.badgeId)) {
        processedRef.current.add(item.badgeId);
        const toastItem: ToastItem = {
          id: `${item.badgeId}-${Date.now()}`,
          badgeId: item.badgeId,
          xp: item.xp,
        };

        setVisibleToasts((prev) => [...prev, toastItem]);

        // Auto dismiss after 4 seconds
        setTimeout(() => {
          setVisibleToasts((prev) => prev.filter((t) => t.id !== toastItem.id));
          onDismiss?.();
        }, 4000);
      }
    }
  }, [badgeQueue, onDismiss]);

  const dismiss = useCallback((toastId: string): void => {
    setVisibleToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '10px',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {visibleToasts.map((toast) => {
          const badge = getBadgeById(toast.badgeId);
          if (!badge) return null;

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 40, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onClick={() => dismiss(toast.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 20px',
                borderRadius: '14px',
                background: 'var(--card)',
                border: '1px solid var(--border2)',
                boxShadow: '0 8px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(79, 140, 255, 0.1)',
                pointerEvents: 'auto',
                cursor: 'pointer',
                minWidth: '260px',
              }}
            >
              {/* Badge icon */}
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ delay: 0.2, duration: 0.5 }}
                style={{ fontSize: '2rem' }}
              >
                {badge.icon}
              </motion.span>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '0.625rem',
                    color: 'var(--amber)',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    marginBottom: '2px',
                  }}
                >
                  🏆 Badge Earned!
                </div>
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--text)',
                    lineHeight: 1.2,
                  }}
                >
                  {badge.name}
                </div>
              </div>

              {/* XP reward */}
              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  fontFamily: 'var(--mono)',
                  color: 'var(--green)',
                }}
              >
                +{toast.xp} XP
              </motion.span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default BadgeToast;
