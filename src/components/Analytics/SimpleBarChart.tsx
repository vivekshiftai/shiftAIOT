import React, { useEffect, useRef } from 'react';

export interface BarSeries {
  label: string;
  data: number[];
  color: string; // CSS color
}

interface SimpleBarChartProps {
  labels: string[];
  series: BarSeries[];
  title?: string;
  height?: number;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ labels, series, title, height = 220 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const chartHeight = canvas.height - 40; // leave space for labels

    ctx.clearRect(0, 0, width, canvas.height);

    const maxVal = Math.max(1, ...series.flatMap(s => s.data));
    const groupWidth = width / labels.length;
    const barWidth = (groupWidth * 0.7) / series.length;
    const leftPadding = (groupWidth - barWidth * series.length) / 2;

    // grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = 10 + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // bars
    series.forEach((s, sIdx) => {
      ctx.fillStyle = s.color;
      s.data.forEach((val, idx) => {
        const x = idx * groupWidth + leftPadding + sIdx * barWidth;
        const h = (val / maxVal) * (chartHeight - 20);
        const y = chartHeight - h;
        ctx.fillRect(x, y, barWidth, h);
      });
    });

    // x labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    labels.forEach((label, idx) => {
      const x = idx * groupWidth + groupWidth / 2;
      ctx.textAlign = 'center';
      ctx.fillText(label, x, chartHeight + 16);
    });
  }, [labels, series, height]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      {title && (
        <div className="mb-2">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</h4>
        </div>
      )}
      <canvas ref={canvasRef} width={520} height={height} className="w-full h-56" />
    </div>
  );
};


