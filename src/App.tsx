// src/App.tsx
import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Link,
  useLocation,
} from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import ModulePage from './pages/ModulePage';
import Dashboard from './pages/Dashboard';
import { useGameState } from './context/GameState';

/* ═══════════════════════════════════════════════════════
   Layout
   ═══════════════════════════════════════════════════════ */

const navLinks: { path: string; label: string; icon: string }[] = [
  { path: '/', label: 'Lab', icon: '🧪' },
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
];

function RootLayout(): React.JSX.Element {
  const location = useLocation();
  const { xp, level, levelTitle } = useGameState();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* ── Top Nav ── */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          background: 'var(--bg2)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(12px)',
        }}
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
          }}
        >
          <span
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, var(--accent), var(--teal))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: 'var(--font)',
            }}
          >
            KinetraxLearn
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--accent)' : 'var(--text2)',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: isActive ? 'rgba(79, 140, 255, 0.1)' : 'transparent',
                }}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}

          {/* XP Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '100px',
              fontSize: '0.75rem',
            }}
          >
            <span
              style={{
                fontWeight: 700,
                color: 'var(--amber)',
                fontFamily: 'var(--mono)',
              }}
            >
              Lv.{level}
            </span>
            <span style={{ color: 'var(--text2)' }}>|</span>
            <span style={{ color: 'var(--teal)', fontWeight: 600 }}>
              {xp.toLocaleString()} XP
            </span>
            <span
              style={{
                color: 'var(--text3)',
                fontSize: '0.6875rem',
                display: 'none',
              }}
              className="level-title-desktop"
            >
              {levelTitle}
            </span>
          </div>
        </div>
      </nav>

      {/* ── Page Content ── */}
      <main style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          padding: '16px 24px',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text3)',
          borderTop: '1px solid var(--border)',
        }}
      >
        KinetraxLearn © 2026 — Gait Biomechanics Virtual Laboratory
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Experiment Page — Routes to actual experiment components
   ═══════════════════════════════════════════════════════ */

import { useParams } from 'react-router-dom';
import {
  E1GaitCycle,
  E2StanceSwing,
  E3DoubleSupport,
  E4SpatiotemporalParams,
} from './modules/m1-gait-fundamentals';
import {
  E1HipMotion,
  E2KneeMotion,
  E3AnkleMotion,
  E4AngleAngleDiagrams,
} from './modules/m2-joint-biomechanics';
import {
  E1GRFCurve,
  E2BodyweightSpeed,
  E3PathologicalGRF,
} from './modules/m3-grf';
import {
  E1IMUPrinciples,
  E2FootIMU,
  E3ShankThighIMU,
  E4SensorFusion,
  E5SignalProcessing,
} from './modules/m4-imu';

const EXPERIMENT_MAP: Record<string, React.ComponentType> = {
  // M1 — Gait Fundamentals
  'gait-cycle': E1GaitCycle,
  'stance-swing': E2StanceSwing,
  'double-support': E3DoubleSupport,
  'spatiotemporal-params': E4SpatiotemporalParams,
  // M2 — Joint Biomechanics
  'hip-motion': E1HipMotion,
  'knee-motion': E2KneeMotion,
  'ankle-motion': E3AnkleMotion,
  'angle-angle-diagrams': E4AngleAngleDiagrams,
  // M3 — Ground Reaction Forces
  'grf-curve': E1GRFCurve,
  'bodyweight-speed': E2BodyweightSpeed,
  'pathological-grf': E3PathologicalGRF,
  // M4 — IMU Sensor World
  'imu-principles': E1IMUPrinciples,
  'foot-imu': E2FootIMU,
  'shank-thigh-imu': E3ShankThighIMU,
  'sensor-fusion': E4SensorFusion,
  'signal-processing': E5SignalProcessing,
};

function ExperimentPage(): React.JSX.Element {
  const { expId } = useParams<{ moduleId: string; expId: string }>();
  const Component = expId ? EXPERIMENT_MAP[expId] : undefined;

  if (!Component) {
    return (
      <div className="container" style={{ padding: '48px 24px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '16px' }}>🔬 Experiment Coming Soon</h2>
        <p style={{ color: 'var(--text2)', marginBottom: '20px' }}>
          This experiment module is under development.
        </p>
        <Link
          to="/"
          className="btn-primary"
          style={{
            display: 'inline-flex',
            marginTop: '24px',
            padding: '12px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            color: '#fff',
            background: 'var(--accent)',
          }}
        >
          ← Back to Lab
        </Link>
      </div>
    );
  }

  return <Component />;
}

/* ═══════════════════════════════════════════════════════
   Router
   ═══════════════════════════════════════════════════════ */

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'module/:moduleId', element: <ModulePage /> },
      { path: 'experiment/:moduleId/:expId', element: <ExperimentPage /> },
      { path: 'dashboard', element: <Dashboard /> },
    ],
  },
]);

function App(): React.JSX.Element {
  return <RouterProvider router={router} />;
}

export default App;
