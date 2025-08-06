import React, { useEffect, useRef } from 'react';
import { useIoT } from '../../contexts/IoTContext';

interface RealtimeChartProps {
  deviceId?: string;
  metric: string;
  title: string;
  color: string;
}

export const RealtimeChart: React.FC<RealtimeChartProps> = ({
  deviceId,
  metric,
  title,
  color
}) => {
  const { telemetryData } = useIoT();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get the last 20 data points for the specified metric
    const filteredData = telemetryData
      .filter(data => !deviceId || data.deviceId === deviceId)
      .slice(-20)
      .map(data => data.metrics[metric] || 0);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (filteredData.length === 0) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Find min/max for scaling
    const min = Math.min(...filteredData);
    const max = Math.max(...filteredData);
    const range = max - min || 1;

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw chart line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    filteredData.forEach((value, index) => {
      const x = padding + (chartWidth / (filteredData.length - 1)) * index;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Fill area under curve
    ctx.fillStyle = `${color}20`;
    ctx.lineTo(width - padding, padding + chartHeight);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.closePath();
    ctx.fill();

  }, [telemetryData, deviceId, metric, color]);

  const latestValue = telemetryData
    .filter(data => !deviceId || data.deviceId === deviceId)
    .slice(-1)[0]?.metrics[metric];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <div className="text-right">
          <p className="text-2xl font-bold" style={{ color }}>
            {latestValue?.toFixed(1) || '--'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Current</p>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        className="w-full h-48"
      />
    </div>
  );
};