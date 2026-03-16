// src/steps/PredictionsStep.tsx
import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import QuizEngine, { type QuizQuestion, type QuizResult } from '../components/QuizEngine';
import { useGameState } from '../context/GameState';

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

export interface PredictionQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint: string;
}

interface PredictionsStepProps {
  questions: PredictionQuestion[];
  onComplete?: (score: number) => void;
}

/* ═══════════════════════════════════════════════════════
   Component — +20 XP
   ═══════════════════════════════════════════════════════ */

function PredictionsStep({ questions, onComplete }: PredictionsStepProps): React.JSX.Element {
  const { savePrediction } = useGameState();

  // Convert PredictionQuestions to QuizQuestions
  const quizQuestions: QuizQuestion[] = questions.map((q) => ({
    type: 'mc' as const,
    id: q.id,
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
    hint: q.hint,
  }));

  const handleComplete = useCallback(
    (results: QuizResult[], totalScore: number): void => {
      // Save each prediction to GameState
      for (const result of results) {
        savePrediction('predictions', result.questionId, String(result.score));
      }
      onComplete?.(totalScore);
    },
    [savePrediction, onComplete]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: '640px' }}
    >
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
        🔮 Make Your Predictions
      </h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text3)', marginBottom: '20px' }}>
        Predict the outcomes before the experiment. You'll compare these later!
      </p>

      <QuizEngine
        questions={quizQuestions}
        onComplete={handleComplete}
        mode="prediction"
      />
    </motion.div>
  );
}

export default PredictionsStep;
