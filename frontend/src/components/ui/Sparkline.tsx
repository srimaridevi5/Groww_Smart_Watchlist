import React from 'react';

interface SparklineProps {
  data?: number[];
  isPositive?: boolean;
  width?: number;
  height?: number;
}

const DEFAULT_POSITIVE_DATA = [10, 12, 11, 14, 13, 16, 15, 18];
const DEFAULT_NEGATIVE_DATA = [18, 16, 15, 13, 14, 11, 12, 10];

export function Sparkline({
  data,
  isPositive = true,
  width = 80,
  height = 28,
}: SparklineProps) {
  const chartData = data && data.length >= 2
    ? data
    : (isPositive ? DEFAULT_POSITIVE_DATA : DEFAULT_NEGATIVE_DATA);

  let finalData = [...chartData];
  if (!isPositive && finalData[finalData.length - 1] >= finalData[0]) {
    finalData = finalData.reverse();
  } else if (isPositive && finalData[finalData.length - 1] <= finalData[0]) {
    finalData = finalData.reverse();
  }

  const min = Math.min(...finalData);
  const max = Math.max(...finalData);
  const range = max - min || 1;

  const points = finalData
    .map((val, idx) => {
      const x = (idx / (finalData.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const strokeColor = isPositive ? '#00D09C' : '#FF5252';

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

