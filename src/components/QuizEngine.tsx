// src/components/QuizEngine.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

export interface MCQuestion {
  type: 'mc';
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint: string;
}

export interface DragDropQuestion {
  type: 'dragdrop';
  id: string;
  question: string;
  items: { id: string; label: string }[];
  zones: { id: string; label: string; correctItemId: string }[];
}

export interface FillInQuestion {
  type: 'fillin';
  id: string;
  question: string;
  correctAnswer: number;
  tolerance: number;
  unit: string;
  formula: string;
  hint: string;
}

export type QuizQuestion = MCQuestion | DragDropQuestion | FillInQuestion;

export interface QuizResult {
  questionId: string;
  score: number;
  maxScore: number;
  attempts: number;
}

interface QuizEngineProps {
  questions: QuizQuestion[];
  onComplete?: (results: QuizResult[], totalScore: number) => void;
  mode?: 'quiz' | 'prediction';
}

/* ═══════════════════════════════════════════════════════
   Multiple Choice Component
   ═══════════════════════════════════════════════════════ */

interface MCProps {
  question: MCQuestion;
  onAnswer: (score: number) => void;
}

function MultipleChoice({ question, onAnswer }: MCProps): React.JSX.Element {
  const [selected, setSelected] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<number>(0);
  const [answered, setAnswered] = useState<boolean>(false);

  const handleSelect = useCallback(
    (idx: number): void => {
      if (answered) return;
      setSelected(idx);
      const isCorrect = idx === question.correctIndex;
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (isCorrect || newAttempts >= 2) {
        setAnswered(true);
        const score = isCorrect ? (newAttempts === 1 ? 100 : 50) : 0;
        // Force show correct on fail
        if (!isCorrect) setSelected(question.correctIndex);
        setTimeout(() => onAnswer(score), 1200);
      }
    },
    [answered, attempts, question.correctIndex, onAnswer]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.5 }}>
        {question.question}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {question.options.map((opt, idx) => {
          const isSelected = selected === idx;
          const isCorrect = idx === question.correctIndex;
          const showResult = answered || (isSelected && attempts > 0);

          let bg = 'var(--card)';
          let border = 'var(--border)';
          let textColor = 'var(--text)';

          if (showResult && isCorrect) {
            bg = '#52e5a015';
            border = '#52e5a0';
            textColor = '#52e5a0';
          } else if (showResult && isSelected && !isCorrect) {
            bg = '#ff525215';
            border = '#ff5252';
            textColor = '#ff5252';
          }

          return (
            <motion.button
              key={idx}
              whileHover={!answered ? { scale: 1.01 } : undefined}
              whileTap={!answered ? { scale: 0.99 } : undefined}
              onClick={() => handleSelect(idx)}
              disabled={answered}
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: bg,
                border: `1px solid ${border}`,
                color: textColor,
                textAlign: 'left',
                fontSize: '0.8125rem',
                cursor: answered ? 'default' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  background: isSelected ? border + '30' : 'var(--bg2)',
                  border: `1px solid ${isSelected ? border : 'var(--border)'}`,
                  fontFamily: 'var(--mono)',
                }}
              >
                {String.fromCharCode(65 + idx)}
              </span>
              {opt}
            </motion.button>
          );
        })}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: selected === question.correctIndex ? '#52e5a010' : '#ff525210',
              border: `1px solid ${selected === question.correctIndex ? '#52e5a040' : '#ff525240'}`,
              fontSize: '0.8125rem',
              color: 'var(--text2)',
              lineHeight: 1.6,
            }}
          >
            {selected === question.correctIndex
              ? `✅ ${question.explanation}`
              : `❌ ${question.hint}. Correct: ${question.options[question.correctIndex]}`}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Drag & Drop Component
   ═══════════════════════════════════════════════════════ */

interface DDProps {
  question: DragDropQuestion;
  onAnswer: (score: number) => void;
}

function DragDrop({ question, onAnswer }: DDProps): React.JSX.Element {
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [wrongZone, setWrongZone] = useState<string | null>(null);

  const handleDrop = useCallback(
    (zoneId: string): void => {
      if (!draggedItem) return;
      const zone = question.zones.find((z) => z.id === zoneId);
      if (!zone) return;

      if (zone.correctItemId === draggedItem) {
        setPlacements((prev) => ({ ...prev, [zoneId]: draggedItem }));
      } else {
        setWrongZone(zoneId);
        setTimeout(() => setWrongZone(null), 800);
      }
      setDraggedItem(null);
    },
    [draggedItem, question.zones]
  );

  const allPlaced = question.zones.every((z) => placements[z.id] !== undefined);

  // Auto-complete when all placed
  React.useEffect(() => {
    if (allPlaced) {
      const score = Math.round((Object.keys(placements).length / question.zones.length) * 100);
      setTimeout(() => onAnswer(score), 800);
    }
  }, [allPlaced, placements, question.zones.length, onAnswer]);

  const placedItemIds = new Set(Object.values(placements));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)' }}>{question.question}</p>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Items panel */}
        <div style={{ flex: '0 0 200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase' }}>
            Drag these items
          </span>
          {question.items.map((item) => {
            const isPlaced = placedItemIds.has(item.id);
            return (
              <motion.div
                key={item.id}
                draggable={!isPlaced}
                onDragStart={() => setDraggedItem(item.id)}
                animate={isPlaced ? { opacity: 0.4, scale: 0.95 } : { opacity: 1, scale: 1 }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  fontSize: '0.8125rem',
                  cursor: isPlaced ? 'default' : 'grab',
                  color: isPlaced ? 'var(--text3)' : 'var(--text)',
                }}
              >
                {item.label}
              </motion.div>
            );
          })}
        </div>

        {/* Drop zones */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase' }}>
            Drop zones
          </span>
          {question.zones.map((zone) => {
            const placedItemId = placements[zone.id];
            const item = question.items.find((it) => it.id === placedItemId);
            const isWrong = wrongZone === zone.id;

            return (
              <motion.div
                key={zone.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(zone.id)}
                animate={isWrong ? { x: [0, -8, 8, -4, 4, 0] } : {}}
                transition={{ duration: 0.4 }}
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: item ? '#52e5a010' : isWrong ? '#ff525210' : 'var(--bg2)',
                  border: `2px dashed ${item ? '#52e5a0' : isWrong ? '#ff5252' : 'var(--border)'}`,
                  fontSize: '0.8125rem',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.3s',
                }}
              >
                <span style={{ color: 'var(--text2)' }}>{zone.label}</span>
                {item && <span style={{ color: '#52e5a0', fontWeight: 600 }}>✓ {item.label}</span>}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Fill-In Component
   ═══════════════════════════════════════════════════════ */

interface FIProps {
  question: FillInQuestion;
  onAnswer: (score: number) => void;
}

function FillIn({ question, onAnswer }: FIProps): React.JSX.Element {
  const [value, setValue] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [usedHint, setUsedHint] = useState<boolean>(false);

  const handleSubmit = useCallback((): void => {
    const numVal = parseFloat(value);
    if (isNaN(numVal)) return;

    setSubmitted(true);
    const diff = Math.abs(numVal - question.correctAnswer);
    const toleranceAbs = question.correctAnswer * (question.tolerance / 100);
    const isCorrect = diff <= toleranceAbs;

    let score = isCorrect ? 100 : 0;
    if (usedHint) score = Math.round(score * 0.8);

    setTimeout(() => onAnswer(score), 1200);
  }, [value, question.correctAnswer, question.tolerance, usedHint, onAnswer]);

  const isCorrect = useMemo((): boolean | null => {
    if (!submitted) return null;
    const numVal = parseFloat(value);
    if (isNaN(numVal)) return false;
    const diff = Math.abs(numVal - question.correctAnswer);
    return diff <= question.correctAnswer * (question.tolerance / 100);
  }, [submitted, value, question.correctAnswer, question.tolerance]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)' }}>{question.question}</p>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={submitted}
          placeholder="Your answer"
          style={{ flex: 1, maxWidth: '200px' }}
        />
        <span style={{ fontSize: '0.8125rem', color: 'var(--text2)' }}>{question.unit}</span>
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={submitted || value === ''}
          style={{ padding: '8px 20px' }}
        >
          Submit
        </button>
      </div>

      {!submitted && !usedHint && (
        <button
          className="btn-ghost"
          onClick={() => setUsedHint(true)}
          style={{ fontSize: '0.75rem', width: 'fit-content' }}
        >
          💡 Use Hint (−20% points)
        </button>
      )}

      {usedHint && !submitted && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: '#ffa94010',
            border: '1px solid #ffa94040',
            fontSize: '0.8125rem',
            fontFamily: 'var(--mono)',
            color: 'var(--amber)',
          }}
        >
          {question.hint}
        </div>
      )}

      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: isCorrect ? '#52e5a010' : '#ff525210',
              border: `1px solid ${isCorrect ? '#52e5a040' : '#ff525240'}`,
              fontSize: '0.8125rem',
              color: 'var(--text2)',
            }}
          >
            {isCorrect ? '✅' : '❌'} Correct answer: {question.correctAnswer} {question.unit}
            {!isCorrect && ` (tolerance: ±${question.tolerance}%)`}
            <div
              style={{
                marginTop: '8px',
                fontFamily: 'var(--mono)',
                fontSize: '0.75rem',
                color: 'var(--accent)',
              }}
            >
              Formula: {question.formula}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Quiz Engine Main
   ═══════════════════════════════════════════════════════ */

function QuizEngine({ questions, onComplete, mode = 'quiz' }: QuizEngineProps): React.JSX.Element {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  const handleAnswer = useCallback(
    (score: number): void => {
      const q = questions[currentIdx];
      const result: QuizResult = {
        questionId: q.id,
        score,
        maxScore: 100,
        attempts: 1,
      };

      const newResults = [...results, result];
      setResults(newResults);

      if (currentIdx + 1 < questions.length) {
        setTimeout(() => setCurrentIdx((i) => i + 1), 400);
      } else {
        setIsComplete(true);
        const totalScore = Math.round(
          newResults.reduce((sum, r) => sum + r.score, 0) / newResults.length
        );
        onComplete?.(newResults, totalScore);
      }
    },
    [currentIdx, questions, results, onComplete]
  );

  if (isComplete) {
    const totalScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: 'var(--card)',
          borderRadius: '14px',
          border: '1px solid var(--border)',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <h3 style={{ marginBottom: '12px' }}>
          {mode === 'prediction' ? '🔮 Predictions Locked In!' : '🎯 Quiz Complete!'}
        </h3>
        <div
          style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            fontFamily: 'var(--mono)',
            color: totalScore >= 70 ? 'var(--teal)' : totalScore >= 40 ? 'var(--amber)' : 'var(--red)',
            marginBottom: '16px',
          }}
        >
          {totalScore}%
        </div>

        {/* Score breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '300px', margin: '0 auto' }}>
          {results.map((r, i) => (
            <div
              key={r.questionId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                padding: '4px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span style={{ color: 'var(--text2)' }}>Q{i + 1}</span>
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontWeight: 600,
                  color: r.score >= 70 ? 'var(--teal)' : r.score >= 40 ? 'var(--amber)' : 'var(--red)',
                }}
              >
                {r.score}/{r.maxScore}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  const currentQ = questions[currentIdx];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '0.6875rem', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
          {currentIdx + 1}/{questions.length}
        </span>
        <div className="progress-bar" style={{ flex: 1 }}>
          <div
            className="progress-bar__fill"
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          {currentQ.type === 'mc' && <MultipleChoice question={currentQ} onAnswer={handleAnswer} />}
          {currentQ.type === 'dragdrop' && <DragDrop question={currentQ} onAnswer={handleAnswer} />}
          {currentQ.type === 'fillin' && <FillIn question={currentQ} onAnswer={handleAnswer} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default QuizEngine;
