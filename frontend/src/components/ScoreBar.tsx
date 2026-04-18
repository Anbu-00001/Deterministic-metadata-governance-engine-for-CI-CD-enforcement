import React from 'react';

interface ScoreBarProps {
  score: number;
  label?: string;
}

export default function ScoreBar({ score, label = "FGS Score" }: ScoreBarProps) {
  // Assuming score is between 0 and 1, clamp it just in case
  const clampedScore = Math.max(0, Math.min(1, score));
  const percentage = Math.round(clampedScore * 100);
  
  // Color logic
  let colorClass = "bg-green-500";
  if (percentage < 60) colorClass = "bg-red-500";
  else if (percentage < 80) colorClass = "bg-yellow-500";

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-gray-300">{label}</span>
        <span className="font-mono">{clampedScore.toFixed(3)}</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden border border-gray-700/50">
        <div 
          className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${colorClass}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
