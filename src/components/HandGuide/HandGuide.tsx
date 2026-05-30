import React from 'react';
import { SVGHand } from './SVGHand';
import { fingerMapping, fingerLabels } from '../../data/fingerMapping';
import type { FingerType } from '../../data/fingerMapping';

interface HandGuideProps {
  targetChar: string;
}

export const HandGuide: React.FC<HandGuideProps> = ({ targetChar }) => {
  // Resolve key config
  const config = fingerMapping[targetChar];

  let leftActive: FingerType | null = null;
  let rightActive: FingerType | null = null;
  let leftShift: FingerType | null = null;
  let rightShift: FingerType | null = null;

  let targetFingerLabel = 'Phím không xác định';
  let instructionText = '';

  if (config) {
    const { finger, requiresShift, hand } = config;
    targetFingerLabel = fingerLabels[finger];

    if (requiresShift) {
      if (hand === 'left') {
        // Left hand hits key, Right Pinky holds Shift
        leftActive = finger;
        rightShift = 'rp';
        instructionText = `Dùng ngón út phải giữ [Shift], đồng thời dùng ${targetFingerLabel.toLowerCase()} gõ phím "${targetChar.toUpperCase()}"`;
      } else {
        // Right hand hits key, Left Pinky holds Shift
        rightActive = finger;
        leftShift = 'lp';
        instructionText = `Dùng ngón út trái giữ [Shift], đồng thời dùng ${targetFingerLabel.toLowerCase()} gõ phím "${targetChar.toUpperCase()}"`;
      }
    } else {
      // Normal single keypress
      if (hand === 'left') {
        leftActive = finger;
      } else {
        rightActive = finger;
      }
      const displayChar = targetChar === ' ' ? '[Spacebar]' : `"${targetChar.toUpperCase()}"`;
      instructionText = `Dùng ${targetFingerLabel.toLowerCase()} để gõ phím ${displayChar}`;
    }
  } else {
    // Fallback if key not in mapping
    instructionText = `Gõ phím "${targetChar}" trên bàn phím`;
  }

  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-2xl glass shadow-md w-full border border-slate-200/50 dark:border-slate-800/50">
      {/* Hand Model SVGs side by side */}
      <div className="flex justify-center items-center gap-12 sm:gap-16">
        {/* Left Hand */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase tracking-wider font-semibold opacity-40">Tay trái</span>
          <SVGHand
            hand="left"
            activeFinger={leftActive}
            shiftFinger={leftShift}
          />
        </div>

        {/* Right Hand */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase tracking-wider font-semibold opacity-40">Tay phải</span>
          <SVGHand
            hand="right"
            activeFinger={rightActive}
            shiftFinger={rightShift}
          />
        </div>
      </div>

      {/* Dynamic Instruction Tooltip */}
      <div className="bg-primary-50 dark:bg-primary-950/20 border border-primary-200/40 dark:border-primary-900/40 rounded-xl px-4 py-2 text-center max-w-md shadow-sm transition-all duration-300">
        <p className="text-xs sm:text-sm font-medium text-primary-700 dark:text-primary-300">
          💡 {instructionText}
        </p>
      </div>
    </div>
  );
};
export default HandGuide;
