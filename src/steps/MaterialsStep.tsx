// src/steps/MaterialsStep.tsx
import React, { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import HumanModel from '../components/HumanModel';
import { useGameState } from '../context/GameState';
import type { GaitData } from '../engine/syntheticGait';

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

export interface SensorPlacement {
  sensorId: string;
  zone: string;
}

interface MaterialsStepProps {
  requiredPlacements: SensorPlacement[];
  onComplete?: (score: number) => void;
}

/* ═══════════════════════════════════════════════════════
   Component — +30 XP
   Completes when all required sensors are correctly placed
   and gait data is generated
   ═══════════════════════════════════════════════════════ */

function MaterialsStep({ requiredPlacements, onComplete }: MaterialsStepProps): React.JSX.Element {
  const { setSensorPlacement } = useGameState();

  const requiredSensorIds = useMemo(
    () => requiredPlacements.map((p) => p.sensorId),
    [requiredPlacements]
  );

  const handleDataGenerated = useCallback(
    (data: GaitData): void => {
      // Save each sensor placement to GameState
      for (const placement of requiredPlacements) {
        setSensorPlacement(placement.sensorId, placement.zone);
      }
      onComplete?.(100);
    },
    [requiredPlacements, setSensorPlacement, onComplete]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
        🧪 Set Up Materials
      </h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text3)', marginBottom: '20px' }}>
        Configure your subject and place sensors on the body. All {requiredPlacements.length} sensors
        must be correctly placed before you can generate gait data.
      </p>

      <HumanModel
        requiredSensors={requiredSensorIds}
        onDataGenerated={handleDataGenerated}
      />
    </motion.div>
  );
}

export default MaterialsStep;
