// src/data/modules.ts

export interface ModuleConfig {
  id: string;
  title: string;
  description: string;
  color: string;
  icon: string;
  difficulty: 'UG' | 'PG' | 'UG+PG';
  timeEstimate: string;
  xpReward: number;
  experimentIds: string[];
}

export const MODULES: ModuleConfig[] = [
  {
    id: 'm1',
    title: 'Gait Fundamentals',
    description: 'Explore the gait cycle, stance/swing phases, and spatiotemporal parameters.',
    color: '#4f8cff',
    icon: '🚶',
    difficulty: 'UG',
    timeEstimate: '45 min',
    xpReward: 1200,
    experimentIds: ['gait-cycle', 'stance-swing', 'double-support', 'spatiotemporal-params'],
  },
  {
    id: 'm2',
    title: 'Joint Biomechanics',
    description: 'Analyze hip, knee, and ankle kinematics through the gait cycle.',
    color: '#00d4aa',
    icon: '🦿',
    difficulty: 'UG',
    timeEstimate: '50 min',
    xpReward: 1200,
    experimentIds: ['hip-motion', 'knee-motion', 'ankle-motion', 'angle-angle-diagrams'],
  },
  {
    id: 'm3',
    title: 'Ground Reaction Forces',
    description: 'Understand vertical and horizontal GRF patterns during walking.',
    color: '#a855f7',
    icon: '⚡',
    difficulty: 'UG',
    timeEstimate: '40 min',
    xpReward: 900,
    experimentIds: ['grf-curve', 'bodyweight-speed', 'pathological-grf'],
  },
  {
    id: 'm4',
    title: 'IMU Sensor World',
    description: 'Master inertial measurement units for gait analysis across body segments.',
    color: '#ffa940',
    icon: '📡',
    difficulty: 'UG+PG',
    timeEstimate: '75 min',
    xpReward: 1500,
    experimentIds: [
      'imu-principles',
      'foot-imu',
      'shank-thigh-imu',
      'sensor-fusion',
      'signal-processing',
    ],
  },
  {
    id: 'm5',
    title: 'FSR Foot Pressure Lab',
    description: 'Investigate force-sensitive resistors and plantar pressure mapping.',
    color: '#ff7a45',
    icon: '🦶',
    difficulty: 'UG+PG',
    timeEstimate: '60 min',
    xpReward: 1200,
    experimentIds: [
      'fsr-principles',
      'heel-toe-pressure',
      'fsr-event-detection',
      'combined-sensors',
    ],
  },
  {
    id: 'm6',
    title: 'Gait Event Detection',
    description: 'Build and compare algorithms for detecting heel-strike and toe-off events.',
    color: '#52e5a0',
    icon: '🎯',
    difficulty: 'PG',
    timeEstimate: '60 min',
    xpReward: 1200,
    experimentIds: [
      'threshold-detection',
      'peak-detection',
      'stride-segmentation',
      'algorithm-showdown',
    ],
  },
  {
    id: 'm7',
    title: 'Pathological Gait',
    description: 'Identify and analyze pathological gait patterns and their biomechanical causes.',
    color: '#ff5252',
    icon: '🩺',
    difficulty: 'PG',
    timeEstimate: '65 min',
    xpReward: 1200,
    experimentIds: [
      'parkinsonian-gait',
      'hemiplegic-gait',
      'antalgic-gait',
      'mystery-gait',
    ],
  },
  {
    id: 'm8',
    title: 'Anti-Gravity Lab',
    description: 'Simulate gait under altered gravity conditions for space and rehab scenarios.',
    color: '#6366f1',
    icon: '🚀',
    difficulty: 'PG',
    timeEstimate: '55 min',
    xpReward: 900,
    experimentIds: ['gravity-physics', 'antigravity-rehab', 'final-boss'],
  },
];
