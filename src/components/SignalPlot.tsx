// src/components/SignalPlot.tsx
import React, { useRef, useMemo, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

export interface SignalChannel {
  id: string;
  label: string;
  data: number[];
  color: string;
  visible: boolean;
}

interface SignalPlotProps {
  channels: SignalChannel[];
  sampleRate: number;
  windowSeconds?: number;
  currentSample?: number;
  showPhaseMarkers?: boolean;
  phaseMarkers?: number[];
  height?: number;
  onToggleChannel?: (channelId: string) => void;
}

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */

function SignalPlot({
  channels,
  sampleRate,
  windowSeconds = 3,
  currentSample = 0,
  showPhaseMarkers = false,
  phaseMarkers = [],
  height = 260,
  onToggleChannel,
}: SignalPlotProps): React.JSX.Element {
  const chartRef = useRef<ChartJS<'line'> | null>(null);

  const windowSamples = windowSeconds * sampleRate;
  const startIdx = Math.max(0, currentSample - windowSamples);
  const endIdx = Math.min(
    channels.length > 0 ? channels[0].data.length : 0,
    startIdx + windowSamples
  );

  // Build chart data
  const chartData = useMemo(() => {
    const labels: string[] = [];
    for (let i = startIdx; i < endIdx; i++) {
      labels.push((i / sampleRate).toFixed(2));
    }

    const datasets = channels
      .filter((ch) => ch.visible)
      .map((ch) => ({
        label: ch.label,
        data: ch.data.slice(startIdx, endIdx),
        borderColor: ch.color,
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: ch.color,
        fill: false,
        tension: 0.2,
      }));

    return { labels, datasets };
  }, [channels, startIdx, endIdx, sampleRate]);

  const chartOptions: ChartOptions<'line'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a2240',
          titleColor: '#e8eaf0',
          bodyColor: '#8892b0',
          borderColor: 'rgba(100, 140, 255, 0.3)',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 10,
          callbacks: {
            title: (items) => {
              if (items.length > 0) return `t = ${items[0].label}s`;
              return '';
            },
            label: (item) => {
              return `${item.dataset.label}: ${Number(item.raw).toFixed(3)}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#4a5568',
            font: { size: 9, family: "'JetBrains Mono', monospace" },
            maxTicksLimit: 8,
          },
          grid: { color: 'rgba(100, 140, 255, 0.06)' },
          border: { display: false },
          title: { display: true, text: 'Time (s)', color: '#4a5568', font: { size: 10 } },
        },
        y: {
          ticks: {
            color: '#4a5568',
            font: { size: 9, family: "'JetBrains Mono', monospace" },
            maxTicksLimit: 6,
          },
          grid: { color: 'rgba(100, 140, 255, 0.06)' },
          border: { display: false },
        },
      },
    }),
    []
  );

  // Export PNG
  const handleExport = useCallback((): void => {
    const chart = chartRef.current;
    if (!chart) return;
    const url = chart.toBase64Image();
    const link = document.createElement('a');
    link.download = 'signal_plot.png';
    link.href = url;
    link.click();
  }, []);

  return (
    <div
      style={{
        background: 'var(--card)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        padding: '16px',
      }}
    >
      {/* Channel toggles */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
          flexWrap: 'wrap',
        }}
      >
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => onToggleChannel?.(ch.id)}
            style={{
              padding: '3px 10px',
              borderRadius: '100px',
              fontSize: '0.625rem',
              fontWeight: 600,
              border: `1px solid ${ch.color}${ch.visible ? '' : '40'}`,
              background: ch.visible ? ch.color + '20' : 'transparent',
              color: ch.visible ? ch.color : ch.color + '60',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {ch.visible ? '●' : '○'} {ch.label}
          </button>
        ))}

        <button
          onClick={handleExport}
          className="btn-ghost"
          style={{
            marginLeft: 'auto',
            padding: '3px 10px',
            fontSize: '0.625rem',
          }}
        >
          📥 Export PNG
        </button>
      </div>

      {/* Chart */}
      <div style={{ height, position: 'relative' }}>
        <Line
          ref={chartRef}
          data={chartData}
          options={chartOptions}
        />
      </div>

      {/* Phase markers */}
      {showPhaseMarkers && phaseMarkers.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '4px',
            marginTop: '8px',
            fontSize: '0.625rem',
            color: 'var(--text3)',
          }}
        >
          {phaseMarkers
            .filter((m) => m >= startIdx && m < endIdx)
            .map((m, i) => (
              <span key={i} style={{ color: 'var(--accent)' }}>
                HS@{(m / sampleRate).toFixed(2)}s
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

export default SignalPlot;
