import React from 'react';
import { keyFingerColors } from '../../data/fingerMapping';
import type { FingerType } from '../../data/fingerMapping';

interface VirtualKeyProps {
  label: string;
  shiftLabel?: string;
  finger?: FingerType;
  widthClass?: string;
  isTarget?: boolean;
  isError?: boolean;
  isPressed?: boolean;
}

export const VirtualKey: React.FC<VirtualKeyProps> = ({
  label,
  shiftLabel,
  finger,
  widthClass = 'w-10 sm:w-12 md:w-14',
  isTarget = false,
  isError = false,
  isPressed = false,
}) => {
  let baseClass = `h-10 sm:h-12 md:h-14 flex flex-col justify-center items-center rounded-lg border text-xs sm:text-sm font-semibold transition-all duration-100 ${widthClass} select-none`;

  let fingerClass = finger ? keyFingerColors[finger] : 'border-slate-300 dark:border-slate-700';

  let stateClass = 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800';

  if (isTarget) {
    stateClass = 'bg-primary-500 dark:bg-primary-600 text-white border-primary-600 animate-pulse glow-primary scale-95';
  } else if (isError) {
    stateClass = 'bg-danger-500 text-white border-danger-600 key-error-pulse glow-danger';
  } else if (isPressed) {
    stateClass = 'bg-success-500 text-white border-success-600 key-success-pulse scale-95';
  }

  const getFingerIndicatorColor = (f?: FingerType) => {
    if (!f) return '';
    if (f === 'lp' || f === 'rp') return 'bg-pink-400';
    if (f === 'lr' || f === 'rr') return 'bg-purple-400';
    if (f === 'lm' || f === 'rm') return 'bg-indigo-400';
    if (f === 'li' || f === 'ri') return 'bg-blue-400';
    return 'bg-teal-400';
  };

  return (
    <div className={`relative ${baseClass} ${fingerClass} ${stateClass} shadow-sm`}>
      {shiftLabel && (
        <span className="absolute top-1 left-1.5 text-[9px] sm:text-[10px] opacity-60">
          {shiftLabel}
        </span>
      )}
      
      <span className={shiftLabel ? 'absolute bottom-1 right-2 sm:bottom-1.5' : 'text-center'}>
        {label}
      </span>

      {finger && !isTarget && !isError && !isPressed && (
        <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full ${getFingerIndicatorColor(finger)} opacity-60`} />
      )}
    </div>
  );
};
export default VirtualKey;
