import React, { useEffect, useRef } from 'react';

interface PieSlice {
  label: string;
  value: number;
  color: string;
}

interface SimplePieChartProps {
  data: PieSlice[];
  title?: string;
  height?: number;
}

export const SimplePieChart: React.FC<SimplePieChartProps> = ({ data, title, height = 220 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const chartHeight = canvas.height;
    const radius = Math.min(width, chartHeight) / 2 - 10;
    const centerX = width / 2;
    const centerY = chartHeight / 2;

    ctx.clearRect(0, 0, width, chartHeight);

    const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
    let startAngle = -Math.PI / 2;

    data.forEach(slice => {
      const angle = (slice.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();
      startAngle += angle;
    });
  }, [data, height]);

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


