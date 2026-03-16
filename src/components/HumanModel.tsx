// src/components/HumanModel.tsx
import React, { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
} from 'chart.js';
import { generateGaitData, type GaitInput, type GaitData } from '../engine/syntheticGait';
import { useGameState } from '../context/GameState';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Filler);

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

interface HumanModelProps {
  requiredSensors?: string[];
  onDataGenerated?: (data: GaitData) => void;
  compact?: boolean;
}

type DropZone = 'LEFT_FOOT' | 'LEFT_SHANK' | 'LEFT_THIGH' | 'R_HEEL' | 'R_TOE';

interface SensorChip {
  id: string;
  label: string;
  type: 'IMU' | 'FSR';
  color: string;
  validZone: DropZone;
}

const SENSORS: SensorChip[] = [
  { id: 'imu-foot', label: 'Foot IMU', type: 'IMU', color: '#4f8cff', validZone: 'LEFT_FOOT' },
  { id: 'imu-shank', label: 'Shank IMU', type: 'IMU', color: '#4f8cff', validZone: 'LEFT_SHANK' },
  { id: 'imu-thigh', label: 'Thigh IMU', type: 'IMU', color: '#4f8cff', validZone: 'LEFT_THIGH' },
  { id: 'fsr-heel', label: 'Heel FSR', type: 'FSR', color: '#ffa940', validZone: 'R_HEEL' },
  { id: 'fsr-toe', label: 'Toe FSR', type: 'FSR', color: '#ffa940', validZone: 'R_TOE' },
];

const DROP_ZONES: { id: DropZone; label: string; x: number; y: number }[] = [
  { id: 'LEFT_FOOT', label: 'Left Ankle', x: 120, y: 380 },
  { id: 'LEFT_SHANK', label: 'Left Shin', x: 120, y: 310 },
  { id: 'LEFT_THIGH', label: 'Left Thigh', x: 120, y: 230 },
  { id: 'R_HEEL', label: 'Right Heel', x: 200, y: 400 },
  { id: 'R_TOE', label: 'Right Toe', x: 220, y: 420 },
];

const ZONE_ERRORS: Record<DropZone, string> = {
  LEFT_FOOT: 'This zone needs a Foot IMU for ankle kinematics',
  LEFT_SHANK: 'This zone needs a Shank IMU for shin rotation',
  LEFT_THIGH: 'This zone needs a Thigh IMU for thigh motion',
  R_HEEL: 'This zone needs a Heel FSR for heel pressure',
  R_TOE: 'This zone needs a Toe FSR for forefoot pressure',
};

type PathologyOption = 'normal' | 'parkinsonian' | 'hemiplegic' | 'antalgic';

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */

function HumanModel({ requiredSensors, onDataGenerated, compact = false }: HumanModelProps): React.JSX.Element {
  const { setGaitData } = useGameState();

  // Form state
  const [name, setName] = useState<string>('');
  const [height, setHeight] = useState<number>(170);
  const [weight, setWeight] = useState<number>(70);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [age, setAge] = useState<number>(25);
  const [distance, setDistance] = useState<number>(10);
  const [distanceUnit, setDistanceUnit] = useState<'m' | 'km'>('m');
  const [noiseLevel, setNoiseLevel] = useState<number>(0.2);
  const [pathology, setPathology] = useState<PathologyOption>('normal');

  // Sensor placement state
  const [placements, setPlacements] = useState<Record<string, DropZone | null>>({});
  const [draggedSensor, setDraggedSensor] = useState<string | null>(null);
  const [dropError, setDropError] = useState<{ zone: DropZone; message: string } | null>(null);
  const [dropSuccess, setDropSuccess] = useState<DropZone | null>(null);

  // Generated data
  const [generatedData, setGeneratedData] = useState<GaitData | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const svgRef = useRef<SVGSVGElement>(null);

  // ── Derived values ──
  const derivedValues = useMemo(() => {
    const heightM = height / 100;
    const isMale = gender === 'male';
    let stepLen = isMale ? 0.413 * heightM : 0.413 * heightM * 0.94;
    if (age > 60) stepLen *= 1 - (age - 60) * 0.003;
    const strideLen = 2 * stepLen;
    const baseCadence = isMale ? 117 : 121;
    const cadence = baseCadence;
    const speed = (cadence * stepLen) / 60;
    const distM = distanceUnit === 'km' ? distance * 1000 : distance;
    const totalStrides = Math.ceil(distM / strideLen);
    const duration = totalStrides * (60 / (cadence / 2));
    const durMin = Math.floor(duration / 60);
    const durSec = Math.round(duration % 60);

    return {
      stepLength: (stepLen * 100).toFixed(1),
      strideLength: (strideLen * 100).toFixed(1),
      cadence: cadence.toFixed(0),
      speed: speed.toFixed(2),
      duration: `${durMin}m ${durSec}s`,
      totalStrides: totalStrides.toString(),
    };
  }, [height, weight, gender, age, distance, distanceUnit]);

  // ── Sensor drag handlers ──
  const handleDragStart = useCallback((sensorId: string): void => {
    setDraggedSensor(sensorId);
    setDropError(null);
    setDropSuccess(null);
  }, []);

  const handleDrop = useCallback(
    (zoneId: DropZone): void => {
      if (!draggedSensor) return;
      const sensor = SENSORS.find((s) => s.id === draggedSensor);
      if (!sensor) return;

      if (sensor.validZone === zoneId) {
        setPlacements((prev) => ({ ...prev, [sensor.id]: zoneId }));
        setDropSuccess(zoneId);
        setDropError(null);
        setTimeout(() => setDropSuccess(null), 1500);
      } else {
        setDropError({ zone: zoneId, message: ZONE_ERRORS[zoneId] });
        setTimeout(() => setDropError(null), 2500);
      }
      setDraggedSensor(null);
    },
    [draggedSensor]
  );

  // ── Check all required sensors placed ──
  const allPlaced = useMemo((): boolean => {
    const required = requiredSensors ?? SENSORS.map((s) => s.id);
    return required.every((id) => placements[id] !== undefined && placements[id] !== null);
  }, [placements, requiredSensors]);

  // ── Generate data ──
  const handleGenerate = useCallback((): void => {
    setIsGenerating(true);
    const distM = distanceUnit === 'km' ? distance * 1000 : distance;

    const input: GaitInput = {
      height_cm: height,
      weight_kg: weight,
      gender,
      age,
      distance_m: distM,
      noise: noiseLevel,
      pathology,
      seed: height * 100 + weight * 10 + age,
    };

    // Simulate brief generation delay
    setTimeout(() => {
      const data = generateGaitData(input);
      setGeneratedData(data);
      setGaitData({
        strideLength: data.params.strideLength,
        cadence: data.params.cadence,
        velocity: data.params.speed,
        stancePercent: data.params.stanceRatio * 100,
        swingPercent: data.params.swingRatio * 100,
        hipAngles: data.signals.hipAngle.slice(0, 200).map((v, i) => ({ time: i / 100, value: v })),
        kneeAngles: data.signals.kneeAngle.slice(0, 200).map((v, i) => ({ time: i / 100, value: v })),
        ankleAngles: data.signals.ankleAngle.slice(0, 200).map((v, i) => ({ time: i / 100, value: v })),
      });
      onDataGenerated?.(data);
      setIsGenerating(false);
    }, 600);
  }, [height, weight, gender, age, distance, distanceUnit, noiseLevel, pathology, setGaitData, onDataGenerated]);

  // ── Sparkline helper ──
  const makeSparkline = useCallback(
    (data: number[], color: string, label: string) => {
      const slice = data.slice(0, 200);
      return {
        labels: slice.map((_, i) => i.toString()),
        datasets: [
          {
            label,
            data: slice,
            borderColor: color,
            borderWidth: 1.5,
            pointRadius: 0,
            fill: true,
            backgroundColor: color + '15',
            tension: 0.3,
          },
        ],
      };
    },
    []
  );

  const sparkOpts = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: { display: false },
        y: { display: false },
      },
      animation: { duration: 0 } as const,
    }),
    []
  );

  // Body proportions scale
  const bodyScale = height / 170;

  return (
    <div
      style={{
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap',
        background: 'var(--bg2)',
        borderRadius: '14px',
        border: '1px solid var(--border)',
        padding: compact ? '16px' : '24px',
      }}
    >
      {/* ── Left: Form ── */}
      <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h4 style={{ fontSize: '0.875rem', color: 'var(--accent)' }}>Subject Parameters</h4>

        {/* Name */}
        <label style={labelStyle}>
          <span style={spanStyle}>Name (optional)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Subject ID" />
        </label>

        {/* Height */}
        <label style={labelStyle}>
          <span style={spanStyle}>Height: {height} cm</span>
          <input
            type="range" min={100} max={220} value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            style={sliderStyle}
          />
        </label>

        {/* Weight */}
        <label style={labelStyle}>
          <span style={spanStyle}>Weight: {weight} kg</span>
          <input
            type="range" min={30} max={200} value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            style={sliderStyle}
          />
        </label>

        {/* Gender */}
        <div style={labelStyle}>
          <span style={spanStyle}>Gender</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['male', 'female', 'other'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                style={{
                  flex: 1,
                  padding: '6px',
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  background: gender === g ? 'var(--accent)' : 'var(--card)',
                  color: gender === g ? '#fff' : 'var(--text2)',
                  border: `1px solid ${gender === g ? 'var(--accent)' : 'var(--border)'}`,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Age */}
        <label style={labelStyle}>
          <span style={spanStyle}>Age: {age}</span>
          <input
            type="range" min={15} max={80} value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            style={sliderStyle}
          />
        </label>

        {/* Distance */}
        <label style={labelStyle}>
          <span style={spanStyle}>Distance</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="number" min={1}
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <button
              onClick={() => setDistanceUnit((u) => (u === 'm' ? 'km' : 'm'))}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
            >
              {distanceUnit}
            </button>
          </div>
        </label>

        {/* Noise */}
        <label style={labelStyle}>
          <span style={spanStyle}>Signal Quality: {((1 - noiseLevel) * 100).toFixed(0)}%</span>
          <input
            type="range" min={0} max={1} step={0.05} value={noiseLevel}
            onChange={(e) => setNoiseLevel(Number(e.target.value))}
            style={sliderStyle}
          />
        </label>

        {/* Pathology */}
        <label style={labelStyle}>
          <span style={spanStyle}>Pathology</span>
          <select
            value={pathology}
            onChange={(e) => setPathology(e.target.value as PathologyOption)}
          >
            <option value="normal">Normal</option>
            <option value="parkinsonian">Parkinsonian</option>
            <option value="hemiplegic">Hemiplegic</option>
            <option value="antalgic">Antalgic</option>
          </select>
        </label>

        {/* Derived Preview */}
        <div
          style={{
            background: 'var(--card)',
            borderRadius: '8px',
            padding: '12px',
            border: '1px solid var(--border)',
            fontSize: '0.6875rem',
            fontFamily: 'var(--mono)',
            color: 'var(--text2)',
            lineHeight: 1.8,
          }}
        >
          <div>Step Length: <span style={{ color: 'var(--teal)' }}>{derivedValues.stepLength} cm</span></div>
          <div>Stride Length: <span style={{ color: 'var(--teal)' }}>{derivedValues.strideLength} cm</span></div>
          <div>Cadence: <span style={{ color: 'var(--accent)' }}>{derivedValues.cadence} spm</span></div>
          <div>Speed: <span style={{ color: 'var(--accent)' }}>{derivedValues.speed} m/s</span></div>
          <div>Duration: <span style={{ color: 'var(--amber)' }}>{derivedValues.duration}</span></div>
          <div>Total Strides: <span style={{ color: 'var(--amber)' }}>{derivedValues.totalStrides}</span></div>
        </div>
      </div>

      {/* ── Center: SVG Body ── */}
      <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <svg
          ref={svgRef}
          viewBox="0 0 300 460"
          width={300}
          height={compact ? 360 : 460}
          style={{ background: 'transparent' }}
        >
          {/* Body silhouette */}
          <g transform={`translate(150, 40) scale(${bodyScale})`}>
            {/* Head */}
            <circle cx={0} cy={0} r={22} fill="none" stroke="var(--text2)" strokeWidth={1.5} />
            {/* Neck */}
            <line x1={0} y1={22} x2={0} y2={35} stroke="var(--text2)" strokeWidth={1.5} />
            {/* Torso */}
            <rect x={-25} y={35} width={50} height={80} rx={8} fill="none" stroke="var(--text2)" strokeWidth={1.5} />
            {/* Shoulders */}
            <line x1={-25} y1={45} x2={-50} y2={70} stroke="var(--text2)" strokeWidth={1.5} />
            <line x1={25} y1={45} x2={50} y2={70} stroke="var(--text2)" strokeWidth={1.5} />
            {/* Arms */}
            <line x1={-50} y1={70} x2={-45} y2={120} stroke="var(--text2)" strokeWidth={1.5} />
            <line x1={50} y1={70} x2={45} y2={120} stroke="var(--text2)" strokeWidth={1.5} />
            {/* Left Leg */}
            <line x1={-12} y1={115} x2={-20} y2={195} stroke="var(--text2)" strokeWidth={1.5} />
            <line x1={-20} y1={195} x2={-25} y2={280} stroke="var(--text2)" strokeWidth={1.5} />
            <line x1={-25} y1={280} x2={-35} y2={300} stroke="var(--text2)" strokeWidth={1.5} />
            {/* Right Leg */}
            <line x1={12} y1={115} x2={20} y2={195} stroke="var(--text2)" strokeWidth={1.5} />
            <line x1={20} y1={195} x2={25} y2={280} stroke="var(--text2)" strokeWidth={1.5} />
            <line x1={25} y1={280} x2={35} y2={300} stroke="var(--text2)" strokeWidth={1.5} />
            {/* Gender indicator */}
            {gender === 'female' && (
              <ellipse cx={0} cy={80} rx={28} ry={12} fill="none" stroke="var(--text3)" strokeWidth={0.5} strokeDasharray="3,3" />
            )}
          </g>

          {/* Drop zones */}
          {DROP_ZONES.map((zone) => {
            const placed = Object.entries(placements).find(([, z]) => z === zone.id);
            const isError = dropError?.zone === zone.id;
            const isSuccess = dropSuccess === zone.id;
            const sensor = placed ? SENSORS.find((s) => s.id === placed[0]) : null;

            return (
              <g key={zone.id}>
                <circle
                  cx={zone.x}
                  cy={zone.y}
                  r={16}
                  fill={isError ? '#ff525220' : isSuccess ? '#52e5a020' : sensor ? sensor.color + '20' : 'var(--card)'}
                  stroke={isError ? '#ff5252' : isSuccess ? '#52e5a0' : sensor ? sensor.color : 'var(--border)'}
                  strokeWidth={isError || isSuccess ? 2.5 : 1.5}
                  strokeDasharray={sensor ? 'none' : '4,4'}
                  style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(zone.id)}
                />
                {sensor && (
                  <text x={zone.x} y={zone.y + 4} textAnchor="middle" fontSize={10} fill={sensor.color} fontWeight={600}>
                    ✓
                  </text>
                )}
                <text x={zone.x} y={zone.y + 28} textAnchor="middle" fontSize={8} fill="var(--text3)">
                  {zone.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Error message */}
        <AnimatePresence>
          {dropError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                padding: '8px 14px',
                background: '#ff525220',
                border: '1px solid #ff5252',
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: '#ff5252',
                textAlign: 'center',
              }}
            >
              ✗ {dropError.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success */}
        <AnimatePresence>
          {dropSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{
                padding: '6px 14px',
                background: '#52e5a020',
                border: '1px solid #52e5a0',
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: '#52e5a0',
              }}
            >
              ✓ Sensor placed correctly!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sensor tray */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {SENSORS.map((sensor) => {
            const isPlaced = placements[sensor.id] !== undefined && placements[sensor.id] !== null;
            if (requiredSensors && !requiredSensors.includes(sensor.id)) return null;

            return (
              <div
                key={sensor.id}
                draggable={!isPlaced}
                onDragStart={() => handleDragStart(sensor.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: isPlaced ? sensor.color + '20' : 'var(--card)',
                  border: `1px solid ${isPlaced ? sensor.color : 'var(--border)'}`,
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: isPlaced ? sensor.color : 'var(--text2)',
                  cursor: isPlaced ? 'default' : 'grab',
                  opacity: isPlaced ? 0.6 : 1,
                  userSelect: 'none',
                }}
              >
                {sensor.type === 'IMU' ? '📡' : '🦶'} {sensor.label}
                {isPlaced && ' ✓'}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right: Generate + Sparklines ── */}
      <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <button
          className="btn-primary"
          disabled={!allPlaced || isGenerating}
          onClick={handleGenerate}
          style={{ width: '100%', padding: '12px', fontSize: '0.875rem', borderRadius: '10px' }}
        >
          {isGenerating ? '⚙ Generating...' : 'Generate My Gait Data →'}
        </button>

        {!allPlaced && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text3)', textAlign: 'center' }}>
            Place all sensors on the body to generate data
          </p>
        )}

        {/* Sparklines */}
        <AnimatePresence>
          {generatedData && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}
            >
              {[
                { data: generatedData.signals.accZ, color: '#4f8cff', label: 'Acc Z (m/s²)' },
                { data: generatedData.signals.gyroY, color: '#00d4aa', label: 'Gyro Y (°/s)' },
                { data: generatedData.signals.fsrHeel, color: '#ffa940', label: 'FSR Heel' },
                { data: generatedData.signals.hipAngle, color: '#a855f7', label: 'Hip Angle (°)' },
              ].map((ch) => (
                <div
                  key={ch.label}
                  style={{
                    background: 'var(--card)',
                    borderRadius: '8px',
                    padding: '10px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontSize: '0.625rem', color: ch.color, fontWeight: 600, marginBottom: '4px' }}>
                    {ch.label}
                  </div>
                  <div style={{ height: '60px', position: 'relative' }}>
                    <Line data={makeSparkline(ch.data, ch.color, ch.label)} options={sparkOpts} />
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Shared inline styles ── */
const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const spanStyle: React.CSSProperties = {
  fontSize: '0.6875rem',
  fontWeight: 600,
  color: 'var(--text2)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const sliderStyle: React.CSSProperties = {
  width: '100%',
  accentColor: 'var(--accent)',
  background: 'transparent',
  border: 'none',
  padding: 0,
};

export default HumanModel;
