// src/modules/m5-fsr/E3_fsr_event_detection.tsx
import React, { useState, useEffect, useMemo } from 'react';
import ExperimentShell, { StepConfig } from '../../components/ExperimentShell';
import PredictionsStep, { PredictionQuestion } from '../../steps/PredictionsStep';
import QuizEngine, { type QuizQuestion } from '../../components/QuizEngine';
import SummaryCard from '../../components/SummaryCard';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

/* ═══════════════════════════════════════════════════════
   Step 1: Theory
   ═══════════════════════════════════════════════════════ */
function TheoryStep(): React.JSX.Element {
  return (
    <div className="prose">
      <h2>Detecting Gait Events with FSR</h2>
      <p>
        A simple threshold applied to an FSR signal can reliably detect <strong>Heel Strike (HS)</strong> and <strong>Toe Off (TO)</strong>.
      </p>
      <ul>
        <li><strong>Heel Strike:</strong> Detected when Heel FSR rises ABOVE the threshold.</li>
        <li><strong>Toe Off:</strong> Detected when Toe FSR drops BELOW the threshold.</li>
      </ul>
      <p>
        <strong>The Threshold Challenge:</strong>
        <br/>
        Too high = missed events (false negatives).
        <br/>
        Too low = false positives (noise triggering events).
        <br/>
        Optimal threshold is typically around 10-15% of the maximum FSR value.
      </p>
      <p>
        <strong>Statistic:</strong> FSR-based heel strike detection accuracy is ~97% compared to the force plate gold standard.
      </p>
      <p><strong>Clinical Note:</strong> This exact threshold logic is fundamental to the Kinetrax wearable device.</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Step 2: Interactive Threshold Adjustment
   ═══════════════════════════════════════════════════════ */

// Dummy gait data for threshold lab
const FSR_DATA = Array.from({ length: 150 }).map((_, i) => {
  const t = i / 20; // 20hz
  let val = 0;
  // create peaks at t=1, 3, 5, 7
  [1, 3, 5, 7].forEach(p => {
    if (t > p && t < p + 1.2) {
      val += Math.max(0, Math.sin((t - p) * Math.PI / 1.2) * (100 + (Math.random() * 20 - 10)));
    }
  });
  // add noise
  val += Math.random() * 8;
  return val;
});

function ThresholdLab({ onComplete }: { onComplete: (score: number) => void }): React.JSX.Element {
  const [threshold, setThreshold] = useState<number>(50);
  
  // Calculate metrics based on threshold
  const metrics = useMemo(() => {
    let detected = 0;
    let falsePositives = 0;
    const trueEvents = 4; // We know there are 4 main peaks
    
    let isHigh = false;
    FSR_DATA.forEach((val) => {
      if (val > threshold && !isHigh) {
        isHigh = true;
        // if val is clearly a peak
        if (val > 40) detected++;
        else falsePositives++;
      } else if (val < threshold && isHigh) {
        isHigh = false;
      }
    });

    // Limit max detected to true events, extras are false pos
    if (detected > trueEvents) {
      falsePositives += (detected - trueEvents);
      detected = trueEvents;
    }

    const detectionRate = (detected / trueEvents) * 100;
    const falsePositiveRate = Math.min(100, (falsePositives / trueEvents) * 100);

    return { detectionRate, falsePositiveRate };
  }, [threshold]);

  const { detectionRate, falsePositiveRate } = metrics;
  
  const isOptimal = detectionRate === 100 && falsePositiveRate === 0;

  const handleSubmit = () => {
    const score = Math.max(0, detectionRate - falsePositiveRate);
    onComplete(score);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2>Set the Optimal Detection Threshold</h2>
      <p>Drag the threshold line to maximize Detection Rate while minimizing False Positive Rate. (Goal: 10-15% of max value).</p>
      
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <input 
          type="range" 
          min="0" max="150" 
          value={threshold} 
          onChange={(e) => setThreshold(Number(e.target.value))}
          style={{ flex: 1 }}
        />
        <span style={{ fontFamily: 'var(--mono)' }}>Thresh: {threshold}</span>
      </div>

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, padding: '16px', background: 'var(--bg2)', borderRadius: '8px' }}>
          <h4>Detection Rate</h4>
          <span style={{ color: detectionRate === 100 ? 'var(--teal)' : 'var(--amber)', fontSize: '1.5rem', fontWeight: 700 }}>{detectionRate.toFixed(0)}%</span>
        </div>
        <div style={{ flex: 1, padding: '16px', background: 'var(--bg2)', borderRadius: '8px' }}>
          <h4>False Positive Rate</h4>
          <span style={{ color: falsePositiveRate === 0 ? 'var(--teal)' : 'var(--red)', fontSize: '1.5rem', fontWeight: 700 }}>{falsePositiveRate.toFixed(0)}%</span>
        </div>
      </div>

      <div style={{ height: '240px', background: 'var(--card)', padding: '16px', borderRadius: '8px', position: 'relative' }}>
        <Line 
          options={{
            maintainAspectRatio: false,
            animation: false,
            scales: { y: { min: 0, max: 150 } },
            plugins: {
              annotation: {
                annotations: {
                  line1: {
                    type: 'line',
                    yMin: threshold,
                    yMax: threshold,
                    borderColor: '#ff5252',
                    borderWidth: 2,
                    borderDash: [5, 5],
                  }
                }
              }
            } as any // Ignoring ts error for annotation plugin simplicity in raw ChartJS without explicit plugin import
          }}
          data={{
            labels: FSR_DATA.map((_, i) => i),
            datasets: [
              {
                label: 'FSR Signal',
                data: FSR_DATA,
                borderColor: '#4f8cff',
                borderWidth: 1.5,
                pointRadius: 0
              },
              {
                label: 'Threshold',
                data: Array(FSR_DATA.length).fill(threshold),
                borderColor: '#ff5252',
                borderDash: [5, 5],
                borderWidth: 1,
                pointRadius: 0
              }
            ]
          }}
        />
      </div>

      {isOptimal && (
        <div style={{ padding: '12px', background: '#52e5a020', border: '1px solid #52e5a0', borderRadius: '8px', color: '#52e5a0', textAlign: 'center' }}>
          Optimal Zone Reached!
        </div>
      )}

      <button className="btn-primary" onClick={handleSubmit}>
        Submit Threshold Evaluation
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Experiment Component
   ═══════════════════════════════════════════════════════ */
export default function E3FsrEventDetection(): React.JSX.Element {
  const [interactiveScore, setInteractiveScore] = useState<number>(0);
  const [quizScore, setQuizScore] = useState<number>(0);

  const QUIZ: QuizQuestion[] = [
    {
      type: 'mc',
      id: 'e3-q1',
      question: 'If threshold too LOW, result is?',
      options: ['missed events', 'false positives', 'no change', 'better accuracy'],
      correctIndex: 1,
      explanation: 'A low threshold will trigger on noise, creating false positive events.',
      hint: 'What happens when you are too sensitive to any slight change?'
    },
    {
      type: 'fillin',
      id: 'e3-q2',
      question: 'Optimal threshold ≈ what % of max FSR?',
      correctAnswer: 12,
      tolerance: 5,
      unit: '%',
      formula: '10-15%',
      hint: 'Between 10 and 15 percent.'
    },
    {
      type: 'fillin',
      id: 'e3-q3',
      question: 'How many events per stride detectable with heel+toe FSR?',
      correctAnswer: 4,
      tolerance: 0,
      unit: 'events',
      formula: 'HS_R, TO_R, HS_L, TO_L',
      hint: 'Heel strike and toe off for both feet (if wearing both) or per leg.'
    } // Assuming question meant per leg (HS, TO) + other leg? 'events per stride detectable'. Usually HS, FF, HO, TO (4 for one foot). The prompt says FillIn answer=4 tolerance=0 (HS, TO, HS, TO).
  ];

  const steps: StepConfig[] = [
    {
      id: 'theory',
      name: 'Theory',
      xpReward: 50,
      component: <TheoryStep />,
    },
    {
      id: 'interactive',
      name: 'Threshold Lab',
      xpReward: 100,
      component: <ThresholdLab onComplete={setInteractiveScore} />,
    },
    {
      id: 'knowledge-check',
      name: 'Knowledge Check',
      xpReward: 50,
      component: <QuizEngine questions={QUIZ} onComplete={(res, s) => setQuizScore(s)} />,
    },
    {
      id: 'summary',
      name: 'Summary',
      xpReward: 50,
      component: (
        <SummaryCard
          experimentTitle="FSR Event Detection"
          keyFormula="Threshold = 10-15% of Peak FSR"
          keyConcept="Accurate gait event detection requires balancing sensitivity (avoiding missed events) and specificity (avoiding false positives) through optimal thresholding."
          score={Math.round((quizScore + interactiveScore) / 2) || 100}
          badgeId="event-hunter"
          moduleId="m5"
        />
      ),
    },
  ];

  return <ExperimentShell moduleId="m5" expId="fsr-event-detection" steps={steps} />;
}
