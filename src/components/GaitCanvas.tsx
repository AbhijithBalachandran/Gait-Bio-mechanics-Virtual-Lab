// src/components/GaitCanvas.tsx
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GaitPhase } from '../types/enums';
import type { GaitData } from '../engine/syntheticGait';
import { PHASE_COLORS, PHASE_LABELS } from '../engine/gaitPhysics';

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

interface GaitCanvasProps {
  gaitData?: GaitData | null;
  speed?: number;
  onPhaseChange?: (phase: GaitPhase) => void;
  width?: number;
  height?: number;
}

interface Joint {
  x: number;
  y: number;
}

/* ═══════════════════════════════════════════════════════
   Forward Kinematics
   ═══════════════════════════════════════════════════════ */

function computeJoints(
  hipAngleDeg: number,
  kneeAngleDeg: number,
  ankleAngleDeg: number,
  hipX: number,
  hipY: number,
  thighLen: number,
  shankLen: number,
  footLen: number
): { knee: Joint; ankle: Joint; toe: Joint } {
  const hipRad = (hipAngleDeg * Math.PI) / 180;
  const kneeRad = (kneeAngleDeg * Math.PI) / 180;
  const ankleRad = (ankleAngleDeg * Math.PI) / 180;

  const kneeX = hipX + thighLen * Math.sin(hipRad);
  const kneeY = hipY + thighLen * Math.cos(hipRad);

  const absKnee = hipRad - kneeRad;
  const ankleX = kneeX + shankLen * Math.sin(absKnee);
  const ankleY = kneeY + shankLen * Math.cos(absKnee);

  const absFoot = absKnee + ankleRad;
  const toeX = ankleX + footLen * Math.sin(absFoot + Math.PI / 4);
  const toeY = ankleY + footLen * Math.cos(absFoot + Math.PI / 4);

  return {
    knee: { x: kneeX, y: kneeY },
    ankle: { x: ankleX, y: ankleY },
    toe: { x: toeX, y: toeY },
  };
}

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */

function GaitCanvas({
  gaitData,
  speed = 1.2,
  onPhaseChange,
  width = 600,
  height = 320,
}: GaitCanvasProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const sampleRef = useRef<number>(0);
  const lastPhaseRef = useRef<GaitPhase>(GaitPhase.HeelStrike);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [currentPhase, setCurrentPhase] = useState<GaitPhase>(GaitPhase.HeelStrike);
  const [controlSpeed, setControlSpeed] = useState<number>(speed);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number): void => {
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, w, h);

      // Ground line
      const groundY = h - 40;
      ctx.strokeStyle = 'rgba(100, 140, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(w, groundY);
      ctx.stroke();

      if (!gaitData) {
        ctx.fillStyle = '#8892b0';
        ctx.font = '14px "Space Grotesk"';
        ctx.textAlign = 'center';
        ctx.fillText('Generate gait data to see animation', w / 2, h / 2);
        return;
      }

      const { signals, sampleRate, nSamples, params } = gaitData;
      const idx = Math.floor(sampleRef.current) % nSamples;
      const f = 1 / params.cycleTime;
      const t = idx / sampleRate;
      const phase = (t * f) % 1;

      // Determine gait phase
      let gPhase: GaitPhase;
      if (phase < 0.05) gPhase = GaitPhase.HeelStrike;
      else if (phase < 0.15) gPhase = GaitPhase.FootFlat;
      else if (phase < 0.35) gPhase = GaitPhase.MidStance;
      else if (phase < 0.50) gPhase = GaitPhase.HeelOff;
      else if (phase < 0.62) gPhase = GaitPhase.ToeOff;
      else if (phase < 0.82) gPhase = GaitPhase.MidSwing;
      else gPhase = GaitPhase.TerminalSwing;

      if (gPhase !== lastPhaseRef.current) {
        lastPhaseRef.current = gPhase;
        setCurrentPhase(gPhase);
        onPhaseChange?.(gPhase);
      }

      // Phase background strip
      const phaseColor = PHASE_COLORS[gPhase];
      ctx.fillStyle = phaseColor + '10';
      ctx.fillRect(0, 0, w, h);

      // Phase label
      ctx.fillStyle = phaseColor;
      ctx.font = '600 13px "Space Grotesk"';
      ctx.textAlign = 'left';
      ctx.fillText(PHASE_LABELS[gPhase], 16, 28);

      // Phase progress bar
      ctx.fillStyle = phaseColor + '30';
      ctx.fillRect(16, 36, 120, 4);
      ctx.fillStyle = phaseColor;
      ctx.fillRect(16, 36, 120 * phase, 4);

      // Get joint angles
      const hip = signals.hipAngle[idx] ?? 5;
      const knee = signals.kneeAngle[idx] ?? 30;
      const ankle = signals.ankleAngle[idx] ?? 0;

      // Body dimensions
      const torsoLen = 80;
      const thighLen = 50;
      const shankLen = 48;
      const footLen = 20;
      const headR = 14;

      const hipX = w / 2;
      const hipY = groundY - torsoLen - thighLen * 0.9;

      // Head
      const headY = hipY - torsoLen - headR;
      ctx.beginPath();
      ctx.arc(hipX, headY, headR, 0, Math.PI * 2);
      ctx.strokeStyle = 'var(--text2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Neck + torso
      ctx.beginPath();
      ctx.moveTo(hipX, headY + headR);
      ctx.lineTo(hipX, hipY);
      ctx.strokeStyle = '#8892b0';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Arms (simple swing)
      const armSwing = 15 * Math.sin(hip * Math.PI / 180);
      const shoulderY = hipY - torsoLen + 15;
      // Left arm
      ctx.beginPath();
      ctx.moveTo(hipX - 8, shoulderY);
      ctx.lineTo(hipX - 20 - armSwing, shoulderY + 55);
      ctx.strokeStyle = '#8892b0';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Right arm
      ctx.beginPath();
      ctx.moveTo(hipX + 8, shoulderY);
      ctx.lineTo(hipX + 20 + armSwing, shoulderY + 55);
      ctx.stroke();

      // Left leg
      const leftLeg = computeJoints(hip * 0.8, knee * 0.5, ankle * 0.5, hipX - 8, hipY, thighLen, shankLen, footLen);
      drawLeg(ctx, hipX - 8, hipY, leftLeg, phaseColor);

      // Right leg (opposite phase)
      const rightLeg = computeJoints(-hip * 0.8, (60 - knee) * 0.5, -ankle * 0.5, hipX + 8, hipY, thighLen, shankLen, footLen);
      drawLeg(ctx, hipX + 8, hipY, rightLeg, phaseColor);

      // Time / sample info
      ctx.fillStyle = '#4a5568';
      ctx.font = '10px "JetBrains Mono"';
      ctx.textAlign = 'right';
      ctx.fillText(`t=${(idx / sampleRate).toFixed(2)}s  sample=${idx}`, w - 16, h - 12);
    },
    [gaitData, onPhaseChange]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const animate = (): void => {
      if (isPlaying && gaitData) {
        sampleRef.current += playbackSpeed * (controlSpeed / 1.2);
      }
      draw(ctx, width, height);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw, isPlaying, playbackSpeed, controlSpeed, width, height, gaitData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <canvas
        ref={canvasRef}
        style={{
          width,
          height,
          borderRadius: '12px',
          border: '1px solid var(--border)',
          background: '#0a0e1a',
        }}
      />

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button
          className="btn-secondary"
          onClick={() => setIsPlaying((p) => !p)}
          style={{ padding: '6px 14px', fontSize: '0.75rem' }}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>

        <button
          className={`btn-secondary ${playbackSpeed === 0.25 ? 'btn-primary' : ''}`}
          onClick={() => setPlaybackSpeed((s) => (s === 0.25 ? 1.0 : 0.25))}
          style={{ padding: '6px 14px', fontSize: '0.75rem' }}
        >
          🐢 {playbackSpeed === 0.25 ? '0.25x' : '1x'}
        </button>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text2)' }}>
          Speed: {controlSpeed.toFixed(1)} m/s
          <input
            type="range" min={0.5} max={2.5} step={0.1}
            value={controlSpeed}
            onChange={(e) => setControlSpeed(Number(e.target.value))}
            style={{ width: '100px', accentColor: 'var(--accent)' }}
          />
        </label>

        <span
          style={{
            marginLeft: 'auto',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.6875rem',
            fontWeight: 600,
            background: PHASE_COLORS[currentPhase] + '20',
            color: PHASE_COLORS[currentPhase],
          }}
        >
          {PHASE_LABELS[currentPhase]}
        </span>
      </div>
    </div>
  );
}

/* ── Draw leg helper ── */
function drawLeg(
  ctx: CanvasRenderingContext2D,
  hipX: number,
  hipY: number,
  joints: { knee: Joint; ankle: Joint; toe: Joint },
  color: string
): void {
  const lineColor = '#8892b0';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';

  // Thigh
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(joints.knee.x, joints.knee.y);
  ctx.strokeStyle = lineColor;
  ctx.stroke();

  // Shank
  ctx.beginPath();
  ctx.moveTo(joints.knee.x, joints.knee.y);
  ctx.lineTo(joints.ankle.x, joints.ankle.y);
  ctx.stroke();

  // Foot
  ctx.beginPath();
  ctx.moveTo(joints.ankle.x, joints.ankle.y);
  ctx.lineTo(joints.toe.x, joints.toe.y);
  ctx.stroke();

  // Joint circles
  const jointR = 4;
  for (const joint of [{ x: hipX, y: hipY }, joints.knee, joints.ankle, joints.toe]) {
    ctx.beginPath();
    ctx.arc(joint.x, joint.y, jointR, 0, Math.PI * 2);
    ctx.fillStyle = color + '60';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

export default GaitCanvas;
