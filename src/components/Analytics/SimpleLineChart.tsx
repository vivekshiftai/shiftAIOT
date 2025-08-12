import React, { useEffect, useRef } from 'react';

interface SimpleLineChartProps {
  labels: string[];
  data: number[];
  color: string;
  title?: string;
  height?: number;
}

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({ labels, data, color, title, height = 220 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const chartHeight = canvas.height - 40;

    ctx.clearRect(0, 0, width, canvas.height);

    const maxVal = Math.max(1, ...data);
    const padding = 10;
    const chartWidth = width - padding * 2;

    // grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = 10 + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((val, idx) => {
      const x = padding + (chartWidth / Math.max(1, data.length - 1)) * idx;
      const h = (val / maxVal) * (chartHeight - 20);
      const y = chartHeight - h;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // x labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    labels.forEach((label, idx) => {
      const x = padding + (chartWidth / Math.max(1, data.length - 1)) * idx;
      ctx.textAlign = 'center';
      ctx.fillText(label, x, chartHeight + 16);
    });
  }, [labels, data, color, height]);

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


