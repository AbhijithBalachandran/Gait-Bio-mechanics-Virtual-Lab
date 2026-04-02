// src/data/experiments.ts

export interface ExperimentConfig {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  xpReward: number;
  badgeId?: string;
  estimatedTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export const EXPERIMENTS: ExperimentConfig[] = [
  /* ═══════════════════════════════════════════════════════
     Module 1 — Gait Fundamentals
     ═══════════════════════════════════════════════════════ */
  {
    id: 'gait-cycle',
    moduleId: 'm1',
    title: 'The Gait Cycle',
    description: 'Visualize and interact with all phases of a complete gait cycle from heel-strike to heel-strike.',
    xpReward: 300,
    badgeId: 'gait-watcher',
    estimatedTime: '12 min',
    difficulty: 'Beginner',
  },
  {
    id: 'stance-swing',
    moduleId: 'm1',
    title: 'Stance vs Swing',
    description: 'Explore the timing and duration of stance and swing phases and how they change with speed.',
    xpReward: 300,
    badgeId: 'phase-detective',
    estimatedTime: '10 min',
    difficulty: 'Beginner',
  },
  {
    id: 'double-support',
    moduleId: 'm1',
    title: 'Double Support Period',
    description: 'Investigate the double-support phase and its relationship to gait speed and stability.',
    xpReward: 300,
    estimatedTime: '10 min',
    difficulty: 'Beginner',
  },
  {
    id: 'spatiotemporal-params',
    moduleId: 'm1',
    title: 'Spatiotemporal Parameters',
    description: 'Calculate stride length, cadence, velocity and explore normative values.',
    xpReward: 300,
    badgeId: 'stride-calculator',
    estimatedTime: '13 min',
    difficulty: 'Beginner',
  },

  /* ═══════════════════════════════════════════════════════
     Module 2 — Joint Biomechanics
     ═══════════════════════════════════════════════════════ */
  {
    id: 'hip-motion',
    moduleId: 'm2',
    title: 'Hip Joint Kinematics',
    description: 'Analyze hip flexion/extension angles throughout the gait cycle.',
    xpReward: 300,
    estimatedTime: '12 min',
    difficulty: 'Beginner',
  },
  {
    id: 'knee-motion',
    moduleId: 'm2',
    title: 'Knee Joint Kinematics',
    description: 'Explore the characteristic double-bump knee flexion curve during walking.',
    xpReward: 300,
    estimatedTime: '12 min',
    difficulty: 'Beginner',
  },
  {
    id: 'ankle-motion',
    moduleId: 'm2',
    title: 'Ankle Joint Kinematics',
    description: 'Study ankle dorsiflexion and plantarflexion patterns during gait.',
    xpReward: 300,
    estimatedTime: '12 min',
    difficulty: 'Beginner',
  },
  {
    id: 'angle-angle-diagrams',
    moduleId: 'm2',
    title: 'Angle–Angle Diagrams',
    description: 'Create and interpret cyclographic angle-angle plots for inter-joint coordination.',
    xpReward: 300,
    estimatedTime: '14 min',
    difficulty: 'Intermediate',
  },

  /* ═══════════════════════════════════════════════════════
     Module 3 — Ground Reaction Forces
     ═══════════════════════════════════════════════════════ */
  {
    id: 'grf-curve',
    moduleId: 'm3',
    title: 'The GRF Curve',
    description: 'Understand the classic M-shaped vertical ground reaction force pattern.',
    xpReward: 300,
    estimatedTime: '12 min',
    difficulty: 'Beginner',
  },
  {
    id: 'bodyweight-speed',
    moduleId: 'm3',
    title: 'Bodyweight & Speed Effects',
    description: 'Explore how body mass and walking speed affect GRF magnitude and timing.',
    xpReward: 300,
    estimatedTime: '14 min',
    difficulty: 'Intermediate',
  },
  {
    id: 'pathological-grf',
    moduleId: 'm3',
    title: 'Pathological GRF Patterns',
    description: 'Compare normal and pathological GRF profiles to identify gait disorders.',
    xpReward: 300,
    estimatedTime: '14 min',
    difficulty: 'Intermediate',
  },

  /* ═══════════════════════════════════════════════════════
     Module 4 — IMU Sensor World
     ═══════════════════════════════════════════════════════ */
  {
    id: 'imu-principles',
    moduleId: 'm4',
    title: 'IMU Principles',
    description: 'Learn how accelerometers, gyroscopes, and magnetometers work together.',
    xpReward: 300,
    badgeId: 'sensor-novice',
    estimatedTime: '15 min',
    difficulty: 'Beginner',
  },
  {
    id: 'foot-imu',
    moduleId: 'm4',
    title: 'Foot IMU Signals',
    description: 'Analyze accelerometer and gyroscope signals from a foot-mounted IMU.',
    xpReward: 300,
    estimatedTime: '15 min',
    difficulty: 'Intermediate',
  },
  {
    id: 'shank-thigh-imu',
    moduleId: 'm4',
    title: 'Shank & Thigh IMU',
    description: 'Compare IMU signals from shank and thigh segments during walking.',
    xpReward: 300,
    estimatedTime: '15 min',
    difficulty: 'Intermediate',
  },
  {
    id: 'sensor-fusion',
    moduleId: 'm4',
    title: 'Sensor Fusion',
    description: 'Combine accelerometer and gyroscope data using complementary filtering.',
    xpReward: 300,
    badgeId: 'fusion-engineer',
    estimatedTime: '15 min',
    difficulty: 'Advanced',
  },
  {
    id: 'signal-processing',
    moduleId: 'm4',
    title: 'Signal Processing',
    description: 'Apply low-pass filters and noise reduction to raw IMU signals.',
    xpReward: 300,
    badgeId: 'signal-cleaner',
    estimatedTime: '15 min',
    difficulty: 'Advanced',
  },

  /* ═══════════════════════════════════════════════════════
     Module 5 — FSR Foot Pressure Lab
     ═══════════════════════════════════════════════════════ */
  {
    id: 'fsr-principles',
    moduleId: 'm5',
    title: 'FSR Principles',
    description: 'Understand force-sensitive resistors and how they measure plantar pressure.',
    xpReward: 300,
    estimatedTime: '14 min',
    difficulty: 'Beginner',
  },
  {
    id: 'heel-toe-pressure',
    moduleId: 'm5',
    title: 'Heel–Toe Pressure',
    description: 'Map pressure distribution from heel-strike through toe-off.',
    xpReward: 300,
    badgeId: 'pressure-detective',
    estimatedTime: '15 min',
    difficulty: 'Intermediate',
  },
  {
    id: 'fsr-event-detection',
    moduleId: 'm5',
    title: 'FSR Event Detection',
    description: 'Use FSR thresholds to detect gait events in real-time.',
    xpReward: 300,
    badgeId: 'event-hunter',
    estimatedTime: '15 min',
    difficulty: 'Intermediate',
  },
  {
    id: 'combined-sensors',
    moduleId: 'm5',
    title: 'Combined Sensor Systems',
    description: 'Integrate FSR data with IMU signals for comprehensive gait analysis.',
    xpReward: 300,
    badgeId: 'dual-sensor-master',
    estimatedTime: '16 min',
    difficulty: 'Advanced',
  },

  /* ═══════════════════════════════════════════════════════
     Module 6 — Gait Event Detection
     ═══════════════════════════════════════════════════════ */
  {
    id: 'threshold-detection',
    moduleId: 'm6',
    title: 'Threshold Detection',
    description: 'Implement a simple threshold-based gait event detector.',
    xpReward: 300,
    estimatedTime: '15 min',
    difficulty: 'Intermediate',
  },
  {
    id: 'peak-detection',
    moduleId: 'm6',
    title: 'Peak Detection',
    description: 'Build a peak-detection algorithm for identifying gait events.',
    xpReward: 300,
    estimatedTime: '15 min',
    difficulty: 'Advanced',
  },
  {
    id: 'stride-segmentation',
    moduleId: 'm6',
    title: 'Stride Segmentation',
    description: 'Segment continuous gait data into individual stride cycles.',
    xpReward: 300,
    estimatedTime: '15 min',
    difficulty: 'Advanced',
  },
  {
    id: 'algorithm-showdown',
    moduleId: 'm6',
    title: 'Algorithm Showdown',
    description: 'Compare detection algorithms head-to-head on accuracy and latency.',
    xpReward: 300,
    badgeId: 'algorithm-judge',
    estimatedTime: '15 min',
    difficulty: 'Advanced',
  },

  /* ═══════════════════════════════════════════════════════
     Module 7 — Pathological Gait
     ═══════════════════════════════════════════════════════ */
  {
    id: 'parkinsonian-gait',
    moduleId: 'm7',
    title: 'Parkinsonian Gait',
    description: 'Identify the festinating, shuffling gait pattern of Parkinson\'s disease.',
    xpReward: 300,
    badgeId: 'parkinsons-analyst',
    estimatedTime: '16 min',
    difficulty: 'Advanced',
  },
  {
    id: 'hemiplegic-gait',
    moduleId: 'm7',
    title: 'Hemiplegic Gait',
    description: 'Analyze the circumduction pattern in hemiplegia from stroke.',
    xpReward: 300,
    estimatedTime: '16 min',
    difficulty: 'Advanced',
  },
  {
    id: 'antalgic-gait',
    moduleId: 'm7',
    title: 'Antalgic Gait',
    description: 'Study the pain-avoidance gait pattern and its biomechanical consequences.',
    xpReward: 300,
    estimatedTime: '16 min',
    difficulty: 'Advanced',
  },
  {
    id: 'mystery-gait',
    moduleId: 'm7',
    title: 'Mystery Diagnosis',
    description: 'Analyze an unknown gait pattern and diagnose the underlying condition.',
    xpReward: 300,
    badgeId: 'clinical-detective',
    estimatedTime: '17 min',
    difficulty: 'Advanced',
  },

  /* ═══════════════════════════════════════════════════════
     Module 8 — Anti-Gravity Lab
     ═══════════════════════════════════════════════════════ */
  {
    id: 'gravity-physics',
    moduleId: 'm8',
    title: 'Gravity Physics',
    description: 'Explore how gravitational acceleration affects gait biomechanics.',
    xpReward: 300,
    badgeId: 'antigravity-pioneer',
    estimatedTime: '18 min',
    difficulty: 'Intermediate',
  },
  {
    id: 'antigravity-rehab',
    moduleId: 'm8',
    title: 'Anti-Gravity Rehabilitation',
    description: 'Simulate body-weight support treadmill training at different unloading levels.',
    xpReward: 300,
    estimatedTime: '18 min',
    difficulty: 'Advanced',
  },
  {
    id: 'final-boss',
    moduleId: 'm8',
    title: 'Final Boss: Full System',
    description: 'Design and validate a complete multi-sensor gait analysis system under altered gravity.',
    xpReward: 300,
    badgeId: 'gait-system-architect',
    estimatedTime: '19 min',
    difficulty: 'Advanced',
  },
];

export function getExperimentsByModule(moduleId: string): ExperimentConfig[] {
  return EXPERIMENTS.filter((e) => e.moduleId === moduleId);
}

export function getExperimentById(id: string): ExperimentConfig | undefined {
  return EXPERIMENTS.find((e) => e.id === id);
}
