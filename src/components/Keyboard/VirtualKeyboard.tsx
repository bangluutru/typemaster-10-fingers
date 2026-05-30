import React from 'react';
import { VirtualKey } from './VirtualKey';
import { fingerMapping } from '../../data/fingerMapping';
import type { FingerType } from '../../data/fingerMapping';

interface VirtualKeyboardProps {
  targetChar: string;
  lastPressedKey: string | null;
  lastPressedCorrect: boolean | null;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  targetChar,
  lastPressedKey,
  lastPressedCorrect,
}) => {
  const getCleanKey = (k: string): string => {
    if (k === ' ') return 'space';
    if (k === 'Enter') return 'enter';
    if (k === 'Backspace') return 'backspace';
    return k.toLowerCase();
  };

  const cleanLastPressed = lastPressedKey ? getCleanKey(lastPressedKey) : null;

  const targetConfig = fingerMapping[targetChar] || null;
  const targetKey = targetConfig ? targetConfig.key : targetChar.toLowerCase();
  const requiresShift = targetConfig ? targetConfig.requiresShift : false;
  const targetHand = targetConfig ? targetConfig.hand : 'left';

  const checkIsTarget = (keyLabel: string): boolean => {
    const cleanLabel = keyLabel.toLowerCase();
    
    if (cleanLabel === targetKey) return true;
    
    if (requiresShift) {
      if (cleanLabel === 'shift-right' && targetHand === 'left') return true;
      if (cleanLabel === 'shift-left' && targetHand === 'right') return true;
    }

    return false;
  };

  const checkIsError = (keyLabel: string): boolean => {
    if (lastPressedCorrect === true || !cleanLastPressed) return false;
    const cleanLabel = keyLabel.toLowerCase();
    return cleanLabel === cleanLastPressed;
  };

  const checkIsPressed = (keyLabel: string): boolean => {
    if (lastPressedCorrect !== true || !cleanLastPressed) return false;
    const cleanLabel = keyLabel.toLowerCase();
    return cleanLabel === cleanLastPressed;
  };

  const row1 = [
    { label: '`', shiftLabel: '~', key: '`', finger: 'lp' as FingerType },
    { label: '1', shiftLabel: '!', key: '1', finger: 'lp' as FingerType },
    { label: '2', shiftLabel: '@', key: '2', finger: 'lr' as FingerType },
    { label: '3', shiftLabel: '#', key: '3', finger: 'lm' as FingerType },
    { label: '4', shiftLabel: '$', key: '4', finger: 'li' as FingerType },
    { label: '5', shiftLabel: '%', key: '5', finger: 'li' as FingerType },
    { label: '6', shiftLabel: '^', key: '6', finger: 'ri' as FingerType },
    { label: '7', shiftLabel: '&', key: '7', finger: 'ri' as FingerType },
    { label: '8', shiftLabel: '*', key: '8', finger: 'rm' as FingerType },
    { label: '9', shiftLabel: '(', key: '9', finger: 'rr' as FingerType },
    { label: '0', shiftLabel: ')', key: '0', finger: 'rp' as FingerType },
    { label: '-', shiftLabel: '_', key: '-', finger: 'rp' as FingerType },
    { label: '=', shiftLabel: '+', key: '=', finger: 'rp' as FingerType },
    { label: 'Backspace', key: 'backspace', finger: 'rp' as FingerType, width: 'w-16 sm:w-20 md:w-24' },
  ];

  const row2 = [
    { label: 'Tab', key: 'tab', finger: 'lp' as FingerType, width: 'w-12 sm:w-14 md:w-16' },
    { label: 'Q', key: 'q', finger: 'lp' as FingerType },
    { label: 'W', key: 'w', finger: 'lr' as FingerType },
    { label: 'E', key: 'e', finger: 'lm' as FingerType },
    { label: 'R', key: 'r', finger: 'li' as FingerType },
    { label: 'T', key: 't', finger: 'li' as FingerType },
    { label: 'Y', key: 'y', finger: 'ri' as FingerType },
    { label: 'U', key: 'u', finger: 'ri' as FingerType },
    { label: 'I', key: 'i', finger: 'rm' as FingerType },
    { label: 'O', key: 'o', finger: 'rr' as FingerType },
    { label: 'P', key: 'p', finger: 'rp' as FingerType },
    { label: '[', shiftLabel: '{', key: '[', finger: 'rp' as FingerType },
    { label: ']', shiftLabel: '}', key: ']', finger: 'rp' as FingerType },
    { label: '\\', shiftLabel: '|', key: '\\', finger: 'rp' as FingerType, width: 'w-10 sm:w-12 md:w-14' },
  ];

  const row3 = [
    { label: 'Caps', key: 'capslock', finger: 'lp' as FingerType, width: 'w-14 sm:w-16 md:w-20' },
    { label: 'A', key: 'a', finger: 'lp' as FingerType },
    { label: 'S', key: 's', finger: 'lr' as FingerType },
    { label: 'D', key: 'd', finger: 'lm' as FingerType },
    { label: 'F', key: 'f', finger: 'li' as FingerType },
    { label: 'G', key: 'g', finger: 'li' as FingerType },
    { label: 'H', key: 'h', finger: 'ri' as FingerType },
    { label: 'J', key: 'j', finger: 'ri' as FingerType },
    { label: 'K', key: 'k', finger: 'rm' as FingerType },
    { label: 'L', key: 'l', finger: 'rr' as FingerType },
    { label: ';', shiftLabel: ':', key: ';', finger: 'rp' as FingerType },
    { label: "'", shiftLabel: '"', key: "'", finger: 'rp' as FingerType },
    { label: 'Enter', key: 'enter', finger: 'rp' as FingerType, width: 'w-16 sm:w-20 md:w-24' },
  ];

  const row4 = [
    { label: 'Shift', key: 'shift-left', finger: 'lp' as FingerType, width: 'w-16 sm:w-20 md:w-24' },
    { label: 'Z', key: 'z', finger: 'lp' as FingerType },
    { label: 'X', key: 'x', finger: 'lr' as FingerType },
    { label: 'C', key: 'c', finger: 'lm' as FingerType },
    { label: 'V', key: 'v', finger: 'li' as FingerType },
    { label: 'B', key: 'b', finger: 'li' as FingerType },
    { label: 'N', key: 'n', finger: 'ri' as FingerType },
    { label: 'M', key: 'm', finger: 'ri' as FingerType },
    { label: ',', shiftLabel: '<', key: ',', finger: 'rm' as FingerType },
    { label: '.', shiftLabel: '>', key: '.', finger: 'rr' as FingerType },
    { label: '/', shiftLabel: '?', key: '/', finger: 'rp' as FingerType },
    { label: 'Shift', key: 'shift-right', finger: 'rp' as FingerType, width: 'w-20 sm:w-24 md:w-28' },
  ];

  return (
    <div className="flex flex-col gap-1 sm:gap-1.5 p-3 sm:p-4 rounded-2xl glass shadow-md max-w-full overflow-x-auto select-none border border-slate-200/50 dark:border-slate-800/50">
      <div className="flex gap-1 sm:gap-1.5 justify-center">
        {row1.map((k) => (
          <VirtualKey
            key={k.key}
            label={k.label}
            shiftLabel={k.shiftLabel}
            finger={k.finger}
            widthClass={k.width}
            isTarget={checkIsTarget(k.key)}
            isError={checkIsError(k.key)}
            isPressed={checkIsPressed(k.key)}
          />
        ))}
      </div>

      <div className="flex gap-1 sm:gap-1.5 justify-center">
        {row2.map((k) => (
          <VirtualKey
            key={k.key}
            label={k.label}
            shiftLabel={k.shiftLabel}
            finger={k.finger}
            widthClass={k.width}
            isTarget={checkIsTarget(k.key)}
            isError={checkIsError(k.key)}
            isPressed={checkIsPressed(k.key)}
          />
        ))}
      </div>

      <div className="flex gap-1 sm:gap-1.5 justify-center">
        {row3.map((k) => (
          <VirtualKey
            key={k.key}
            label={k.label}
            finger={k.finger}
            widthClass={k.width}
            isTarget={checkIsTarget(k.key)}
            isError={checkIsError(k.key)}
            isPressed={checkIsPressed(k.key)}
          />
        ))}
      </div>

      <div className="flex gap-1 sm:gap-1.5 justify-center">
        {row4.map((k) => (
          <VirtualKey
            key={k.key}
            label={k.label}
            shiftLabel={k.shiftLabel}
            finger={k.finger}
            widthClass={k.width}
            isTarget={checkIsTarget(k.key)}
            isError={checkIsError(k.key)}
            isPressed={checkIsPressed(k.key)}
          />
        ))}
      </div>

      <div className="flex gap-1 sm:gap-1.5 justify-center">
        <VirtualKey
          label="Space"
          finger="rt"
          widthClass="w-64 sm:w-80 md:w-96"
          isTarget={checkIsTarget(' ')}
          isError={checkIsError(' ')}
          isPressed={checkIsPressed(' ')}
        />
      </div>
    </div>
  );
};
export default VirtualKeyboard;
