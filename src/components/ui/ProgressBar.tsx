import React from 'react';

interface ProgressBarProps {
  value: number; // current value
  max: number; // max target
  color?: string; // custom hex color
  heightClass?: string;
  showText?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  color = '#E8590C',
  heightClass = 'h-2',
  showText = false,
  className = '',
}) => {
  const percentage = max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0;

  return (
    <div className={`w-full ${className}`}>
      {showText && (
        <div className="flex justify-between items-center text-xs font-mono text-text-muted-dark mb-1">
          <span>
            {value} / {max}
          </span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className={`w-full rounded-full bg-surface-hover-dark overflow-hidden ${heightClass}`}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
};
