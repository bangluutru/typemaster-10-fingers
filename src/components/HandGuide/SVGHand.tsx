import React from 'react';
import type { FingerType } from '../../data/fingerMapping';

interface SVGHandProps {
  hand: 'left' | 'right';
  activeFinger: FingerType | null;
  shiftFinger: FingerType | null;
}

export const SVGHand: React.FC<SVGHandProps> = ({
  hand,
  activeFinger,
  shiftFinger,
}) => {
  const isLeft = hand === 'left';

  // Base colors for fingers
  const getFingerClass = (finger: FingerType): string => {
    const isActive = activeFinger === finger;
    const isShift = shiftFinger === finger;

    if (isActive) {
      return 'fill-primary-500 stroke-primary-600 dark:fill-primary-600 dark:stroke-primary-500 animate-bounce-light drop-shadow-md';
    }
    if (isShift) {
      return 'fill-teal-500 stroke-teal-600 dark:fill-teal-600 dark:stroke-teal-500 animate-pulse';
    }

    switch (finger) {
      case 'lp':
      case 'rp':
        return 'fill-pink-100 stroke-pink-300 dark:fill-pink-950/20 dark:stroke-pink-900/40';
      case 'lr':
      case 'rr':
        return 'fill-purple-100 stroke-purple-300 dark:fill-purple-950/20 dark:stroke-purple-900/40';
      case 'lm':
      case 'rm':
        return 'fill-indigo-100 stroke-indigo-300 dark:fill-indigo-950/20 dark:stroke-indigo-900/40';
      case 'li':
      case 'ri':
        return 'fill-blue-100 stroke-blue-300 dark:fill-blue-950/20 dark:stroke-blue-900/40';
      case 'lt':
      case 'rt':
        return 'fill-teal-100 stroke-teal-300 dark:fill-teal-950/20 dark:stroke-teal-900/40';
      default:
        return 'fill-slate-100 stroke-slate-300 dark:fill-slate-900 dark:stroke-slate-800';
    }
  };

  return (
    <svg
      viewBox="0 0 200 220"
      className="w-32 sm:w-40 md:w-44 h-auto transition-all duration-300 select-none filter drop-shadow-sm"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Palm Base */}
      <path
        d={
          isLeft
            ? 'M 25,160 C 25,195 65,210 100,210 C 135,210 155,190 155,160 C 155,130 145,115 135,110 C 120,95 110,95 100,95 C 75,95 65,95 45,110 C 30,120 25,135 25,160 Z'
            : 'M 175,160 C 175,195 135,210 100,210 C 65,210 45,190 45,160 C 45,130 55,115 65,110 C 80,95 90,95 100,95 C 125,95 135,95 155,110 C 170,120 175,135 175,160 Z'
        }
        className="fill-slate-200/60 stroke-slate-300/80 dark:fill-slate-900/40 dark:stroke-slate-800/80"
        strokeWidth="2.5"
      />

      {/* LEFT HAND FINGERS */}
      {isLeft && (
        <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path
            id="left-pinky"
            d="M 33,122 C 22,112 18,75 28,68 C 36,63 42,95 42,108"
            className={`${getFingerClass('lp')} transition-all duration-250`}
          />
          <path
            id="left-ring"
            d="M 52,108 C 45,85 45,45 56,40 C 66,35 68,75 66,100"
            className={`${getFingerClass('lr')} transition-all duration-250`}
          />
          <path
            id="left-middle"
            d="M 76,100 C 72,75 75,32 86,30 C 96,28 98,68 94,98"
            className={`${getFingerClass('lm')} transition-all duration-250`}
          />
          <path
            id="left-index"
            d="M 102,102 C 102,78 108,40 118,42 C 126,43 124,78 118,105"
            className={`${getFingerClass('li')} transition-all duration-250`}
          />
          <path
            id="left-thumb"
            d="M 132,122 C 145,128 175,135 178,148 C 180,158 152,168 136,152"
            className={`${getFingerClass('lt')} transition-all duration-250`}
          />
        </g>
      )}

      {/* RIGHT HAND FINGERS */}
      {!isLeft && (
        <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path
            id="right-pinky"
            d="M 167,122 C 178,112 182,75 172,68 C 164,63 158,95 158,108"
            className={`${getFingerClass('rp')} transition-all duration-250`}
          />
          <path
            id="right-ring"
            d="M 148,108 C 155,85 155,45 144,40 C 134,35 132,75 134,100"
            className={`${getFingerClass('rr')} transition-all duration-250`}
          />
          <path
            id="right-middle"
            d="M 124,100 C 128,75 125,32 114,30 C 104,28 102,68 106,98"
            className={`${getFingerClass('rm')} transition-all duration-250`}
          />
          <path
            id="right-index"
            d="M 98,102 C 98,78 92,40 82,42 C 74,43 76,78 82,105"
            className={`${getFingerClass('ri')} transition-all duration-250`}
          />
          <path
            id="right-thumb"
            d="M 68,122 C 55,128 25,135 22,148 C 20,158 48,168 64,152"
            className={`${getFingerClass('rt')} transition-all duration-250`}
          />
        </g>
      )}

      {/* Guidelines showing finger Rest points */}
      <g opacity="0.3" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3">
        {isLeft ? (
          <>
            <circle cx="30" cy="55" r="3" className="fill-slate-400 stroke-none" />
            <circle cx="56" cy="30" r="3" className="fill-slate-400 stroke-none" />
            <circle cx="86" cy="20" r="3" className="fill-slate-400 stroke-none" />
            <circle cx="118" cy="32" r="3" className="fill-slate-400 stroke-none" />
            <circle cx="170" cy="138" r="3" className="fill-slate-400 stroke-none" />
          </>
        ) : (
          <>
            <circle cx="170" cy="55" r="3" className="fill-slate-400 stroke-none" />
            <circle cx="144" cy="30" r="3" className="fill-slate-400 stroke-none" />
            <circle cx="114" cy="20" r="3" className="fill-slate-400 stroke-none" />
            <circle cx="82" cy="32" r="3" className="fill-slate-400 stroke-none" />
            <circle cx="30" cy="138" r="3" className="fill-slate-400 stroke-none" />
          </>
        )}
      </g>
    </svg>
  );
};
export default SVGHand;
