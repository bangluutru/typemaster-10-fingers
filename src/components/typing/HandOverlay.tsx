import React from 'react';
import { fingerMapping } from '../../data/fingerMapping';
import type { KeyboardGeometry } from './useKeyboardGeometry';
import type { FingerType } from '../../data/fingerMapping';

interface HandOverlayProps {
  geometry: KeyboardGeometry;
  targetChar: string;
  lastPressedKey: string | null;
  lastPressedCorrect: boolean | null;
}

// Resting home row keys for the 10 fingers
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
  if (Object.keys(geometry).length === 0) return null;

  // Resolve target key details
  const targetConfig = fingerMapping[targetChar] || null;
  const targetFinger = targetConfig ? targetConfig.finger : null;
  const requiresShift = targetConfig ? targetConfig.requiresShift : false;
  const targetHand = targetConfig ? targetConfig.hand : 'left';

  let activeFinger: FingerType | null = null;
  let shiftFinger: FingerType | null = null;

  if (targetFinger) {
    activeFinger = targetFinger;
    
    if (requiresShift) {
      if (targetHand === 'left') {
        shiftFinger = 'rp';
      } else {
        shiftFinger = 'lp';
      }
    }
  }

  // Resolve typing errors
  const getCleanKey = (k: string): string => {
    if (k === ' ') return 'space';
    if (k === 'Enter') return 'enter';
    if (k === 'Backspace') return 'backspace';
    return k.toLowerCase();
  };

  const cleanLastPressed = lastPressedKey ? getCleanKey(lastPressedKey) : null;
  const isTypingError = lastPressedCorrect === false;
  const isTypingCorrect = lastPressedCorrect === true;
  
  let errorFinger: FingerType | null = null;
  if (isTypingError && cleanLastPressed) {
    const errorConfig = fingerMapping[cleanLastPressed] || fingerMapping[lastPressedKey || ''];
    if (errorConfig) {
      errorFinger = errorConfig.finger;
    }
  }

  // Calculate current coordinates for the 10 fingers
  const fingerPositions = (Object.keys(FINGER_HOME_KEYS) as FingerType[]).map((fingerId) => {
    let targetKeyId = FINGER_HOME_KEYS[fingerId];

    if (fingerId === activeFinger) {
      const config = fingerMapping[targetChar];
      targetKeyId = config ? config.key : targetChar.toLowerCase();
    } else if (fingerId === shiftFinger) {
      targetKeyId = fingerId === 'lp' ? 'shift-left' : 'shift-right';
    }

    let rect = geometry[targetKeyId.toLowerCase()];
    if (!rect && targetKeyId === 'space') {
      rect = geometry['space'];
    }

    if (!rect) {
      const homeKey = FINGER_HOME_KEYS[fingerId];
      rect = geometry[homeKey];
    }

    if (!rect) return null;

    let x = rect.centerX;
    let y = rect.centerY;
    
    if (targetKeyId === 'space') {
      if (fingerId === 'lt') {
        x = rect.x + rect.width * 0.38;
      } else if (fingerId === 'rt') {
        x = rect.x + rect.width * 0.62;
      }
      y = rect.centerY - rect.height * 0.15;
    }

    const isActive = fingerId === activeFinger;
    const isShift = fingerId === shiftFinger;
    const isError = fingerId === errorFinger;

    // Apply nảy nhẹ when gõ đúng
    let scale = 1.0;
    if (isActive && isTypingCorrect) {
      scale = 0.92;
    } else if (isActive || isShift) {
      scale = 1.05;
    }

    return {
      fingerId,
      x,
      y,
      width: rect.width,
      height: rect.height,
      isActive,
      isShift,
      isError,
      scale,
    };
  });

  // Wrist coordinates (anchor points at bottom corners)
  const leftWristX = geometry['a'] ? geometry['a'].centerX + 15 : 100;
  const leftWristY = geometry['space'] ? geometry['space'].centerY + 105 : 350;

  const rightWristX = geometry[';'] ? geometry[';'].centerX - 15 : 500;
  const rightWristY = geometry['space'] ? geometry['space'].centerY + 105 : 350;

  // Build organic palm paths matching "palm: hình bầu dục bo tròn"
  const buildPalmPath = (hand: 'left' | 'right') => {
    const isLeft = hand === 'left';
    const wristX = isLeft ? leftWristX : rightWristX;
    const wristY = isLeft ? leftWristY : rightWristY;
    
    const handFingers = isLeft ? ['lp', 'lr', 'lm', 'li', 'lt'] : ['rp', 'rr', 'rm', 'ri', 'rt'];
    const positions = fingerPositions.filter(p => p && handFingers.includes(p.fingerId));

    if (positions.length < 5) return '';

    const fPos = (id: string) => positions.find(p => p?.fingerId === id);
    const p1 = fPos(isLeft ? 'lp' : 'rp'); // Pinky
    const p2 = fPos(isLeft ? 'lr' : 'rr'); // Ring
    const p3 = fPos(isLeft ? 'lm' : 'rm'); // Middle
    const p4 = fPos(isLeft ? 'li' : 'ri'); // Index
    const p5 = fPos(isLeft ? 'lt' : 'rt'); // Thumb

    if (!p1 || !p2 || !p3 || !p4 || !p5) return '';

    const base1X = p1.x; const base1Y = p1.y + p1.height * 0.5;
    const base2X = p2.x; const base2Y = p2.y + p2.height * 0.55;
    const base3X = p3.x; const base3Y = p3.y + p3.height * 0.55;
    const base4X = p4.x; const base4Y = p4.y + p4.height * 0.5;
    const base5X = p5.x; const base5Y = p5.y + p5.height * 0.35;

    if (isLeft) {
      return `
        M ${wristX - 18} ${wristY}
        C ${wristX - 25} ${wristY - 25}, ${base1X - 15} ${base1Y + 25}, ${base1X} ${base1Y}
        Q ${(base1X + base2X)/2} ${(base1Y + base2Y)/2 + 4}, ${base2X} ${base2Y}
        Q ${(base2X + base3X)/2} ${(base2Y + base3Y)/2 + 4}, ${base3X} ${base3Y}
        Q ${(base3X + base4X)/2} ${(base3Y + base4Y)/2 + 4}, ${base4X} ${base4Y}
        C ${base4X + 8} ${base4Y - 2}, ${base5X - 12} ${base5Y - 15}, ${base5X} ${base5Y}
        C ${base5X + 18} ${base5Y + 12}, ${wristX + 30} ${wristY - 15}, ${wristX + 18} ${wristY}
        Z
      `;
    } else {
      return `
        M ${wristX + 18} ${wristY}
        C ${wristX + 25} ${wristY - 25}, ${base1X + 15} ${base1Y + 25}, ${base1X} ${base1Y}
        Q ${(base1X + base2X)/2} ${(base1Y + base2Y)/2 + 4}, ${base2X} ${base2Y}
        Q ${(base2X + base3X)/2} ${(base2Y + base3Y)/2 + 4}, ${base3X} ${base3Y}
        Q ${(base3X + base4X)/2} ${(base3Y + base4Y)/2 + 4}, ${base4X} ${base4Y}
        C ${base4X - 8} ${base4Y - 2}, ${base5X + 12} ${base5Y - 15}, ${base5X} ${base5Y}
        C ${base5X - 18} ${base5Y + 12}, ${wristX - 30} ${wristY - 15}, ${wristX - 18} ${wristY}
        Z
      `;
    }
  };

  const leftPalmPath = buildPalmPath('left');
  const rightPalmPath = buildPalmPath('right');

  // Exact color codes from "MÀU SẮC NGÓN TAY (ĐỀ XUẤT)":
  // Út trái: #FFB7D5 | Áp út trái: #C5B3FF | Giữa trái: #A6D8FF | Trỏ trái: #8EE7B5 | Cái trái: #6EE7E0
  // Út phải: #FFB7D5 | Áp út phải: #C5B3FF | Giữa phải: #A6D8FF | Trỏ phải: #8EE7B5 | Cái phải: #6EE7E0
  const fingerGradients = [
    { id: 'grad-lp', start: '#FFF0F5', end: '#FFB7D5' }, // Pink
    { id: 'grad-lr', start: '#F3EFFF', end: '#C5B3FF' }, // Purple
    { id: 'grad-lm', start: '#E6F2FF', end: '#A6D8FF' }, // Blue
    { id: 'grad-li', start: '#EEFBF4', end: '#8EE7B5' }, // Green
    { id: 'grad-lt', start: '#E0FBF9', end: '#6EE7E0' }, // Teal
    { id: 'grad-rt', start: '#E0FBF9', end: '#6EE7E0' }, // Teal
    { id: 'grad-ri', start: '#EEFBF4', end: '#8EE7B5' }, // Green
    { id: 'grad-rm', start: '#E6F2FF', end: '#A6D8FF' }, // Blue
    { id: 'grad-rr', start: '#F3EFFF', end: '#C5B3FF' }, // Purple
    { id: 'grad-rp', start: '#FFF0F5', end: '#FFB7D5' }, // Pink
  ];

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20">
      
      <svg className="absolute inset-0 w-full h-full overflow-visible">
        
        <defs>
          {fingerGradients.map((g) => (
            <linearGradient key={g.id} id={g.id} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={g.start} stopOpacity="0.75" />
              <stop offset="100%" stopColor={g.end} stopOpacity="0.65" />
            </linearGradient>
          ))}
          {/* drop-shadow(0 4px 12px rgba(0,0,0,0.06)) */}
          <filter id="premium-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* Lòng bàn tay (opacity: 0.18 - 0.25) */}
        {leftPalmPath && (
          <path
            d={leftPalmPath}
            className="fill-slate-200/20 dark:fill-slate-800/10 stroke-slate-300/30 dark:stroke-slate-700/20 transition-all duration-200"
            strokeWidth="1.5"
            style={{ transition: 'd 0.18s ease-out' }}
          />
        )}
        {rightPalmPath && (
          <path
            d={rightPalmPath}
            className="fill-slate-200/20 dark:fill-slate-800/10 stroke-slate-300/30 dark:stroke-slate-700/20 transition-all duration-200"
            strokeWidth="1.5"
            style={{ transition: 'd 0.18s ease-out' }}
          />
        )}

        {/* Tendon lines (co giãn theo chuyển động ngón) */}
        {fingerPositions.map((pos) => {
          if (!pos) return null;
          const { fingerId, x, y, isActive, isShift, isError } = pos;
          
          const isLeft = fingerId === 'lp' || fingerId === 'lr' || fingerId === 'lm' || fingerId === 'li' || fingerId === 'lt';
          const wristX = isLeft ? leftWristX : rightWristX;
          const wristY = isLeft ? leftWristY : rightWristY;

          const ctrlX = (x + wristX) / 2;
          const ctrlY = (y + wristY) / 2 + 15;

          let strokeClass = 'stroke-slate-300 dark:stroke-slate-800';
          let strokeWidth = '1.2';
          
          if (isError) {
            strokeClass = 'stroke-danger-400';
            strokeWidth = '1.8';
          } else if (isActive) {
            strokeClass = 'stroke-primary-400';
            strokeWidth = '1.8';
          } else if (isShift) {
            strokeClass = 'stroke-teal-400';
            strokeWidth = '1.8';
          }

          return (
            <path
              key={`line-${fingerId}`}
              d={`M ${wristX} ${wristY} Q ${ctrlX} ${ctrlY} ${x} ${y + 10}`}
              fill="none"
              className={`${strokeClass} transition-all duration-180`}
              strokeWidth={strokeWidth}
              style={{ transition: 'd 0.18s ease-out' }}
            />
          );
        })}

        {/* CẤU TRÚC 3 ĐỐT NGÓN TAY + MÓNG TAY (SVG EXPORT PRESETS) */}
        {fingerPositions.map((pos) => {
          if (!pos) return null;
          const { fingerId, x, y, width, height, isActive, isShift, isError, scale } = pos;

          // Tính toán kích thước ngón tỉ lệ chuẩn theo phím
          const fWidth = Math.max(12, Math.round(width * 0.35));
          const fHeight = Math.max(42, Math.round(height * 1.15));

          const radiusX = fWidth / 2;
          
          // Chiều cao của từng đốt ngón (3 đốt: segment s1, s2, s3 bo tròn)
          const segHeight = fHeight / 3.2;

          let strokeColor = 'stroke-slate-400/30 dark:stroke-slate-600/30';
          let opacity = '0.55'; // Trạng thái nghỉ: opacity 0.55

          if (isError) {
            strokeColor = 'stroke-danger-500';
            opacity = '1'; // Trạng thái hoạt động: opacity 1
          } else if (isActive) {
            strokeColor = 'stroke-primary-500';
            opacity = '1';
          } else if (isShift) {
            strokeColor = 'stroke-teal-500';
            opacity = '1';
          }

          const fillGradient = `url(#grad-${fingerId})`;

          return (
            <g
              key={fingerId}
              transform={`translate(${x}, ${y}) scale(${scale})`}
              className="transition-transform duration-180"
              style={{
                transition: 'transform 0.18s ease-out',
              }}
              opacity={opacity}
              filter="url(#premium-shadow)"
            >
              {/* Đốt ngón 3 (Gốc ngón - s3) */}
              <rect
                x={-radiusX}
                y={segHeight * 0.4}
                width={fWidth}
                height={segHeight * 1.1}
                rx={radiusX * 0.6}
                fill={fillGradient}
                className={`${strokeColor} transition-all duration-180`}
                strokeWidth="1.2"
              />

              {/* Đốt ngón 2 (Giữa ngón - s2) */}
              <rect
                x={-radiusX * 0.95}
                y={-segHeight * 0.7}
                width={fWidth * 0.9}
                height={segHeight * 1.15}
                rx={radiusX * 0.55}
                fill={fillGradient}
                className={`${strokeColor} transition-all duration-180`}
                strokeWidth="1.2"
              />

              {/* Đốt ngón 1 (Đầu ngón - s1 - bo tròn lớn) */}
              <path
                d={`
                  M ${-radiusX * 0.9} ${-segHeight * 0.7}
                  A ${radiusX * 0.9} ${radiusX * 0.9} 0 0 1 ${radiusX * 0.9} ${-segHeight * 0.7}
                  L ${radiusX * 0.9} ${-segHeight * 0.6}
                  L ${-radiusX * 0.9} ${-segHeight * 0.6}
                  Z
                `}
                fill={fillGradient}
                className={`${strokeColor} transition-all duration-180`}
                strokeWidth="1.2"
              />

              {/* Móng tay (Nail - hình elip mảnh ở đầu ngón) */}
              <ellipse
                cx="0"
                cy={-segHeight * 1.25}
                rx={radiusX * 0.55}
                ry={radiusX * 0.42}
                className="fill-white/50 dark:fill-white/30 stroke-white/20"
                strokeWidth="0.5"
              />

              {/* Nếp gấp khớp ngón (Khớp ngón vết gấp nhẹ) */}
              <path
                d={`M ${-radiusX * 0.65} ${-segHeight * 0.7} Q 0 ${-segHeight * 0.65} ${radiusX * 0.65} ${-segHeight * 0.7}`}
                fill="none"
                className="stroke-slate-500/25 dark:stroke-white/20"
                strokeWidth="0.8"
              />
              <path
                d={`M ${-radiusX * 0.75} ${segHeight * 0.4} Q 0 ${segHeight * 0.45} ${radiusX * 0.75} ${segHeight * 0.4}`}
                fill="none"
                className="stroke-slate-500/25 dark:stroke-white/20"
                strokeWidth="0.8"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
export default HandOverlay;
