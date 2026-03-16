// src/context/GameState.tsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

export interface GaitDataPoint {
  time: number;
  value: number;
}

export interface GaitData {
  strideLength: number;
  cadence: number;
  velocity: number;
  stancePercent: number;
  swingPercent: number;
  hipAngles: GaitDataPoint[];
  kneeAngles: GaitDataPoint[];
  ankleAngles: GaitDataPoint[];
}

export interface GameState {
  xp: number;
  level: number;
  levelTitle: string;
  completedExperiments: string[];
  earnedBadges: string[];
  experimentScores: Record<string, Record<string, number>>;
  predictions: Record<string, Record<string, string>>;
  sensorPlacements: Record<string, string>;
  myGaitData: GaitData | null;
}

export interface GameActions {
  addXP: (amount: number) => void;
  earnBadge: (id: string) => void;
  completeExperiment: (expId: string) => void;
  saveScore: (expId: string, step: string, score: number) => void;
  savePrediction: (expId: string, question: string, answer: string) => void;
  setSensorPlacement: (sensorId: string, location: string) => void;
  setGaitData: (data: GaitData) => void;
  resetProgress: () => void;
}

export interface GameContextValue extends GameState, GameActions {}

/* ═══════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════ */

const LEVEL_THRESHOLDS: number[] = [
  0, 500, 1200, 2200, 3500, 5000, 7000, 9500, 12500, 16000,
];

const LEVEL_TITLES: string[] = [
  'Gait Novice',
  'Phase Learner',
  'Stride Analyst',
  'Signal Reader',
  'Sensor Technician',
  'Biomechanist',
  'Detection Expert',
  'Clinical Analyst',
  'Gait Scientist',
  'Biomechanics Master',
];

const STORAGE_KEY = 'kinetraxlearn_state';

/* ═══════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════ */

function computeLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

function computeLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}

function getDefaultState(): GameState {
  return {
    xp: 0,
    level: 1,
    levelTitle: LEVEL_TITLES[0],
    completedExperiments: [],
    earnedBadges: [],
    experimentScores: {},
    predictions: {},
    sensorPlacements: {},
    myGaitData: null,
  };
}

function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw) as Partial<GameState>;
    const defaults = getDefaultState();
    return {
      xp: parsed.xp ?? defaults.xp,
      level: parsed.level ?? defaults.level,
      levelTitle: parsed.levelTitle ?? defaults.levelTitle,
      completedExperiments: parsed.completedExperiments ?? defaults.completedExperiments,
      earnedBadges: parsed.earnedBadges ?? defaults.earnedBadges,
      experimentScores: parsed.experimentScores ?? defaults.experimentScores,
      predictions: parsed.predictions ?? defaults.predictions,
      sensorPlacements: parsed.sensorPlacements ?? defaults.sensorPlacements,
      myGaitData: parsed.myGaitData ?? defaults.myGaitData,
    };
  } catch {
    return getDefaultState();
  }
}

function persistState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

/* ═══════════════════════════════════════════════════════
   Context
   ═══════════════════════════════════════════════════════ */

const GameContext = createContext<GameContextValue | null>(null);

interface GameStateProviderProps {
  children: ReactNode;
}

export function GameStateProvider({ children }: GameStateProviderProps): React.JSX.Element {
  const [state, setState] = useState<GameState>(loadState);

  // Persist whenever state changes
  useEffect(() => {
    persistState(state);
  }, [state]);

  const addXP = useCallback((amount: number): void => {
    setState((prev) => {
      const newXP = prev.xp + amount;
      const newLevel = computeLevel(newXP);
      return {
        ...prev,
        xp: newXP,
        level: newLevel,
        levelTitle: computeLevelTitle(newLevel),
      };
    });
  }, []);

  const earnBadge = useCallback((id: string): void => {
    setState((prev) => {
      if (prev.earnedBadges.includes(id)) return prev;
      return { ...prev, earnedBadges: [...prev.earnedBadges, id] };
    });
  }, []);

  const completeExperiment = useCallback((expId: string): void => {
    setState((prev) => {
      if (prev.completedExperiments.includes(expId)) return prev;
      return { ...prev, completedExperiments: [...prev.completedExperiments, expId] };
    });
  }, []);

  const saveScore = useCallback((expId: string, step: string, score: number): void => {
    setState((prev) => ({
      ...prev,
      experimentScores: {
        ...prev.experimentScores,
        [expId]: {
          ...(prev.experimentScores[expId] ?? {}),
          [step]: score,
        },
      },
    }));
  }, []);

  const savePrediction = useCallback(
    (expId: string, question: string, answer: string): void => {
      setState((prev) => ({
        ...prev,
        predictions: {
          ...prev.predictions,
          [expId]: {
            ...(prev.predictions[expId] ?? {}),
            [question]: answer,
          },
        },
      }));
    },
    []
  );

  const setSensorPlacement = useCallback((sensorId: string, location: string): void => {
    setState((prev) => ({
      ...prev,
      sensorPlacements: {
        ...prev.sensorPlacements,
        [sensorId]: location,
      },
    }));
  }, []);

  const setGaitData = useCallback((data: GaitData): void => {
    setState((prev) => ({ ...prev, myGaitData: data }));
  }, []);

  const resetProgress = useCallback((): void => {
    setState(getDefaultState());
  }, []);

  const contextValue: GameContextValue = {
    ...state,
    addXP,
    earnBadge,
    completeExperiment,
    saveScore,
    savePrediction,
    setSensorPlacement,
    setGaitData,
    resetProgress,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameState(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}

export { LEVEL_THRESHOLDS, LEVEL_TITLES };
