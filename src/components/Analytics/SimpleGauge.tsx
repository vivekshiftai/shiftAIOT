import React, { useEffect, useRef } from 'react';

interface SimpleGaugeProps {
  value: number; // 0..100
  title?: string;
  color?: string; // CSS color for arc
  height?: number;
}

export const SimpleGauge: React.FC<SimpleGaugeProps> = ({ value, title, color = '#10b981', height = 180 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const h = canvas.height;
    const radius = Math.min(width, h * 2) / 2 - 10;
    const centerX = width / 2;
    const centerY = h - 10;

    ctx.clearRect(0, 0, width, h);

    // background arc
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
    ctx.stroke();

    // value arc
    const angle = Math.PI + (Math.PI * Math.max(0, Math.min(100, value))) / 100;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, angle);
    ctx.stroke();

    // text
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(value)}%`, centerX, centerY - radius / 2);
  }, [value, color, height]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      {title && (
        <div className="mb-2">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</h4>
        </div>
      )}
      <canvas ref={canvasRef} width={520} height={height} className="w-full h-44" />
    </div>
  );
};


