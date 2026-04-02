// src/data/badges.ts

export interface BadgeConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
}

export const BADGES: BadgeConfig[] = [
  {
    id: 'gait-watcher',
    name: 'Gait Watcher',
    description: 'Completed the gait cycle experiment and identified all phases.',
    icon: '👁️',
    criteria: 'Complete experiment: The Gait Cycle',
  },
  {
    id: 'phase-detective',
    name: 'Phase Detective',
    description: 'Mastered stance and swing phase analysis with timing accuracy.',
    icon: '🔍',
    criteria: 'Complete experiment: Stance vs Swing',
  },
  {
    id: 'stride-calculator',
    name: 'Stride Calculator',
    description: 'Calculated all spatiotemporal parameters within 5% accuracy.',
    icon: '📐',
    criteria: 'Complete experiment: Spatiotemporal Parameters',
  },
  {
    id: 'joint-explorer',
    name: 'Joint Explorer',
    description: 'Identified both knee flexion peaks within 5° of their actual positions.',
    icon: '🦵',
    criteria: 'Complete experiment: Knee Joint — The Double Peak',
  },
  {
    id: 'force-analyst',
    name: 'Force Analyst',
    description: 'Correctly identified all 5 key points on the GRF curve.',
    icon: '📈',
    criteria: 'Complete experiment: The Ground Reaction Force Curve',
  },
  {
    id: 'sensor-novice',
    name: 'Sensor Novice',
    description: 'Understood the fundamental principles of IMU sensors.',
    icon: '📡',
    criteria: 'Complete experiment: IMU Principles',
  },
  {
    id: 'fusion-engineer',
    name: 'Fusion Engineer',
    description: 'Successfully fused accelerometer and gyroscope data.',
    icon: '⚙️',
    criteria: 'Complete experiment: Sensor Fusion',
  },
  {
    id: 'signal-cleaner',
    name: 'Signal Cleaner',
    description: 'Applied digital filters to clean raw IMU signals.',
    icon: '🧹',
    criteria: 'Complete experiment: Signal Processing',
  },
  {
    id: 'pressure-detective',
    name: 'Pressure Detective',
    description: 'Mapped heel-to-toe pressure distribution accurately.',
    icon: '🦶',
    criteria: 'Complete experiment: Heel–Toe Pressure',
  },
  {
    id: 'event-hunter',
    name: 'Event Hunter',
    description: 'Detected gait events using FSR-based threshold logic.',
    icon: '🎯',
    criteria: 'Complete experiment: FSR Event Detection',
  },
  {
    id: 'clinical-detective',
    name: 'Clinical Detective',
    description: 'Identified pathological gait patterns with clinical reasoning.',
    icon: '🩺',
    criteria: 'Complete experiment: Mystery Diagnosis',
  },
  {
    id: 'parkinsons-analyst',
    name: 'Parkinson\'s Analyst',
    description: 'Identified all hallmark sensor features of Parkinsonian gait.',
    icon: '🧠',
    criteria: 'Complete experiment: Parkinsonian Gait',
  },
  {
    id: 'rehab-designer',
    name: 'Rehab Designer',
    description: 'Successfully designed a progressive anti-gravity rehab protocol.',
    icon: '🩺',
    criteria: 'Complete experiment: Anti-Gravity Treadmill',
  },
  {
    id: 'antigravity-pioneer',
    name: 'Anti-Gravity Pioneer',
    description: 'Explored gait biomechanics under altered gravitational conditions.',
    icon: '🚀',
    criteria: 'Complete experiment: Gravity Physics',
  },
  {
    id: 'gait-system-architect',
    name: 'Gait System Architect',
    description: 'Designed and validated a complete multi-sensor gait analysis system.',
    icon: '🏗️',
    criteria: 'Complete experiment: Final Boss: Full System',
  },
  {
    id: 'dual-sensor-master',
    name: 'Dual Sensor Master',
    description: 'Mastered the integration and complementary benefits of IMU and FSR sensors.',
    icon: '🔗',
    criteria: 'Complete experiment: Combined Sensor Systems',
  },
  {
    id: 'algorithm-judge',
    name: 'Algorithm Judge',
    description: 'Successfully matched gait event detection algorithms to their optimal scenarios.',
    icon: '⚖️',
    criteria: 'Complete experiment: Algorithm Showdown',
  },
];

export function getBadgeById(id: string): BadgeConfig | undefined {
  return BADGES.find((b) => b.id === id);
}
