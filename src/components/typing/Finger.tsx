import React from 'react';
import type { FingerType } from '../../data/fingerMapping';

interface FingerProps {
  fingerId: FingerType;
  x: number;
  y: number;
  isActive: boolean;
  isShift: boolean;
  isError: boolean;
  width: number;
  height: number;
}

export const Finger: React.FC<FingerProps> = ({
  fingerId,
  x,
  y,
  isActive,
  isShift,
  isError,
  width,
  height,
}) => {
  // Finger color mapping matching keyboard color codes but semi-transparent
  const getFingerBgColor = (f: FingerType): string => {
    if (isError) return 'bg-danger-500/50 border-danger-600 dark:bg-danger-600/50 dark:border-danger-400';
    if (isActive) return 'bg-primary-500/60 border-primary-600 dark:bg-primary-600/60 dark:border-primary-400';
    if (isShift) return 'bg-teal-500/60 border-teal-600 dark:bg-teal-600/60 dark:border-teal-400';

    switch (f) {
      case 'lp':
      case 'rp':
        return 'bg-pink-400/20 border-pink-400/40 dark:bg-pink-500/10 dark:border-pink-500/20';
      case 'lr':
      case 'rr':
        return 'bg-purple-400/20 border-purple-400/40 dark:bg-purple-500/10 dark:border-purple-500/20';
      case 'lm':
      case 'rm':
        return 'bg-indigo-400/20 border-indigo-400/40 dark:bg-indigo-500/10 dark:border-indigo-500/20';
      case 'li':
      case 'ri':
        return 'bg-blue-400/20 border-blue-400/40 dark:bg-blue-500/10 dark:border-blue-500/20';
      case 'lt':
      case 'rt':
        return 'bg-teal-400/20 border-teal-400/40 dark:bg-teal-500/10 dark:border-teal-500/20';
      default:
        return 'bg-slate-400/20 border-slate-400/40';
    }
  };

  const getFingerName = (f: FingerType): string => {
    switch (f) {
      case 'lp': return 'Út';
      case 'lr': return 'Áp';
      case 'lm': return 'Giữa';
      case 'li': return 'Trỏ';
      case 'lt':
      case 'rt': return 'Cái';
      case 'ri': return 'Trỏ';
      case 'rm': return 'Giữa';
      case 'rr': return 'Áp';
      case 'rp': return 'Út';
    }
  };

  // Size constraints for organic finger look
  const fingerWidth = Math.max(12, Math.round(width * 0.32));
  const fingerHeight = Math.max(38, Math.round(height * 1.1));

  // Determine pointer index display opacity
  const opacityClass = isActive || isShift || isError ? 'opacity-100 z-30 scale-105 shadow-md' : 'opacity-55 z-20 scale-100';

  return (
    <div
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${fingerWidth}px`,
        height: `${fingerHeight}px`,
        transform: 'translate(-50%, -35%)', // Offset vertically to place tip perfectly on key center
        transition: 'left 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94), width 0.22s, height 0.22s, opacity 0.22s, transform 0.22s',
      }}
      className={`absolute rounded-full border-2 flex items-center justify-center pointer-events-none select-none font-bold text-[8px] sm:text-[9px] text-slate-800 dark:text-slate-200 transition-all ${getFingerBgColor(
        fingerId
      )} ${opacityClass}`}
    >
      {/* Visual Indicator of finger label on active states */}
      {(isActive || isShift || isError) && (
        <span className="bg-white/95 dark:bg-slate-950/95 px-1 py-0.5 rounded shadow text-[7px] font-black scale-90 border border-slate-200/40 dark:border-slate-800/40">
          {getFingerName(fingerId)}
        </span>
      )}
    </div>
  );
};
export default Finger;
