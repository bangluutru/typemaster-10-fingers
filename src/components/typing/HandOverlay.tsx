import React from 'react';
import { Finger } from './Finger';
import { fingerMapping } from '../../data/fingerMapping';
import type { KeyboardGeometry } from './useKeyboardGeometry';
import type { FingerType } from '../../data/fingerMapping';

interface HandOverlayProps {
  geometry: KeyboardGeometry;
  targetChar: string;
  lastPressedKey: string | null;
  lastPressedCorrect: boolean | null;
}

// Fixed Home Row keys for the 10 resting positions
const FINGER_HOME_KEYS: Record<FingerType, string> = {
  lp: 'a',
  lr: 's',
  lm: 'd',
  li: 'f',
  lt: 'space',
  rt: 'space',
  ri: 'j',
  rm: 'k',
  rr: 'l',
  rp: ';',
};

export const HandOverlay: React.FC<HandOverlayProps> = ({
  geometry,
  targetChar,
  lastPressedKey,
  lastPressedCorrect,
}) => {
  // If geometry is not loaded yet, don't render fingers to prevent jump flashes
  if (Object.keys(geometry).length === 0) return null;

  // Resolve target key configuration
  const targetConfig = fingerMapping[targetChar] || null;
  const targetFinger = targetConfig ? targetConfig.finger : null;
  const requiresShift = targetConfig ? targetConfig.requiresShift : false;
  const targetHand = targetConfig ? targetConfig.hand : 'left';

  // Determine active fingers
  let activeFinger: FingerType | null = null;
  let shiftFinger: FingerType | null = null;

  if (targetFinger) {
    activeFinger = targetFinger;
    
    if (requiresShift) {
      // Opposite pinky holds Shift
      if (targetHand === 'left') {
        shiftFinger = 'rp'; // Right pinky holds Shift-Right
      } else {
        shiftFinger = 'lp'; // Left pinky holds Shift-Left
      }
    }
  }

  // Get active error finger if gõ sai
  const getCleanKey = (k: string): string => {
    if (k === ' ') return 'space';
    if (k === 'Enter') return 'enter';
    if (k === 'Backspace') return 'backspace';
    return k.toLowerCase();
  };

  const cleanLastPressed = lastPressedKey ? getCleanKey(lastPressedKey) : null;
  const isTypingError = lastPressedCorrect === false;
  
  let errorFinger: FingerType | null = null;
  if (isTypingError && cleanLastPressed) {
    const errorConfig = fingerMapping[cleanLastPressed] || fingerMapping[lastPressedKey || ''];
    if (errorConfig) {
      errorFinger = errorConfig.finger;
    }
  }

  // Calculate current coordinates for all 10 fingers
  const fingerPositions = (Object.keys(FINGER_HOME_KEYS) as FingerType[]).map((fingerId) => {
    // 1. Identify which key this finger should be touching
    let targetKeyId = FINGER_HOME_KEYS[fingerId];

    if (fingerId === activeFinger) {
      // Active finger goes to target character key
      const config = fingerMapping[targetChar];
      targetKeyId = config ? config.key : targetChar.toLowerCase();
    } else if (fingerId === shiftFinger) {
      // Shift finger goes to corresponding opposite Shift key
      targetKeyId = fingerId === 'lp' ? 'shift-left' : 'shift-right';
    }

    // 2. Fetch coordinates from measured geometry
    let rect = geometry[targetKeyId.toLowerCase()];
    
    // Fallback: if space is not measured, map to main space keys or home row
    if (!rect && targetKeyId === 'space') {
      rect = geometry['space'];
    }

    if (!rect) {
      // If target key coordinate is not measured yet, fallback to default Home key
      const homeKey = FINGER_HOME_KEYS[fingerId];
      rect = geometry[homeKey];
    }

    if (!rect) return null;

    // Standard positioning on key center
    let x = rect.centerX;
    let y = rect.centerY;
    
    // Adjust thumbs resting side-by-side on the Spacebar
    if (targetKeyId === 'space') {
      if (fingerId === 'lt') {
        x = rect.x + rect.width * 0.4; // Left thumb on left side of Spacebar
      } else if (fingerId === 'rt') {
        x = rect.x + rect.width * 0.6; // Right thumb on right side of Spacebar
      }
      y = rect.centerY - rect.height * 0.1;
    }

    return {
      fingerId,
      x,
      y,
      width: rect.width,
      height: rect.height,
      isActive: fingerId === activeFinger,
      isShift: fingerId === shiftFinger,
      isError: fingerId === errorFinger,
    };
  });

  // Calculate simulated wrist anchor points below the keyboard to draw organic palm paths
  const leftWristX = geometry['a'] ? geometry['a'].centerX + 20 : 100;
  const leftWristY = geometry['space'] ? geometry['space'].centerY + 80 : 350;

  const rightWristX = geometry[';'] ? geometry[';'].centerX - 20 : 500;
  const rightWristY = geometry['space'] ? geometry['space'].centerY + 80 : 350;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10">
      
      {/* 1. Draw Organic Semi-Transparent Tendons connecting fingers to Wrist */}
      <svg className="absolute inset-0 w-full h-full opacity-35 dark:opacity-20">
        {fingerPositions.map((pos) => {
          if (!pos) return null;
          const { fingerId, x, y, isActive, isShift, isError } = pos;
          
          const isLeftHand = fingerId === 'lp' || fingerId === 'lr' || fingerId === 'lm' || fingerId === 'li' || fingerId === 'lt';
          const wristX = isLeftHand ? leftWristX : rightWristX;
          const wristY = isLeftHand ? leftWristY : rightWristY;

          // Elastic bezier curve connecting wrist to finger center
          const ctrlX = (x + wristX) / 2;
          const ctrlY = (y + wristY) / 2 + 30; // Push curve down for palm look

          let strokeColor = 'stroke-slate-400 dark:stroke-slate-600';
          let strokeWidth = '2';
          
          if (isError) {
            strokeColor = 'stroke-danger-500';
            strokeWidth = '3';
          } else if (isActive) {
            strokeColor = 'stroke-primary-500';
            strokeWidth = '3';
          } else if (isShift) {
            strokeColor = 'stroke-teal-500';
            strokeWidth = '3';
          }

          return (
            <path
              key={`line-${fingerId}`}
              d={`M ${wristX} ${wristY} Q ${ctrlX} ${ctrlY} ${x} ${y}`}
              fill="none"
              className={`${strokeColor} transition-all duration-200`}
              strokeWidth={strokeWidth}
              strokeDasharray={isActive || isShift || isError ? '0' : '2,2'}
            />
          );
        })}

        {/* Wrist Base indicators */}
        <circle cx={leftWristX} cy={leftWristY} r="10" fill="currentColor" className="text-slate-300 dark:text-slate-800" />
        <circle cx={rightWristX} cy={rightWristY} r="10" fill="currentColor" className="text-slate-300 dark:text-slate-800" />
      </svg>

      {/* 2. Render the 10 Finger Capsules */}
      {fingerPositions.map((pos) => {
        if (!pos) return null;
        return (
          <Finger
            key={pos.fingerId}
            fingerId={pos.fingerId}
            x={pos.x}
            y={pos.y}
            width={pos.width}
            height={pos.height}
            isActive={pos.isActive}
            isShift={pos.isShift}
            isError={pos.isError}
          />
        );
      })}
    </div>
  );
};
export default HandOverlay;
