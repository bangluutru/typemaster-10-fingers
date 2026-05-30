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

// Friendly Vietnamese short names for fingers to display on overlays
const FINGER_SHORT_NAMES: Record<FingerType, string> = {
  lp: 'Út T',
  lr: 'Áp T',
  lm: 'Giữa T',
  li: 'Trỏ T',
  lt: 'Cái T',
  rt: 'Cái P',
  ri: 'Trỏ P',
  rm: 'Giữa P',
  rr: 'Áp P',
  rp: 'Út P',
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
        x = rect.x + rect.width * 0.4;
      } else if (fingerId === 'rt') {
        x = rect.x + rect.width * 0.6;
      }
      y = rect.centerY - rect.height * 0.15;
    }

    const isActive = fingerId === activeFinger;
    const isShift = fingerId === shiftFinger;
    const isError = fingerId === errorFinger;

    // Apply tactile press effect: slightly scale down or push down when successfully pressing
    let scale = 1.0;
    if (isActive && isTypingCorrect) {
      scale = 0.92; // Pressed down nảy nhẹ
    } else if (isActive || isShift) {
      scale = 1.06; // Active hover state
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

  // Build organic palm curves
  const buildPalmPath = (hand: 'left' | 'right') => {
    const isLeft = hand === 'left';
    const wristX = isLeft ? leftWristX : rightWristX;
    const wristY = isLeft ? leftWristY : rightWristY;
    
    // Get fingers of this hand
    const handFingers = isLeft ? ['lp', 'lr', 'lm', 'li', 'lt'] : ['rp', 'rr', 'rm', 'ri', 'rt'];
    const positions = fingerPositions.filter(p => p && handFingers.includes(p.fingerId));

    if (positions.length < 5) return '';

    // Map fingers to temporary variables for path calculation
    const fPos = (id: string) => positions.find(p => p?.fingerId === id);
    const p1 = fPos(isLeft ? 'lp' : 'rp'); // Pinky
    const p2 = fPos(isLeft ? 'lr' : 'rr'); // Ring
    const p3 = fPos(isLeft ? 'lm' : 'rm'); // Middle
    const p4 = fPos(isLeft ? 'li' : 'ri'); // Index
    const p5 = fPos(isLeft ? 'lt' : 'rt'); // Thumb

    if (!p1 || !p2 || !p3 || !p4 || !p5) return '';

    // Coordinates of finger bases (slightly shifted down from tip coordinate y)
    const base1X = p1.x; const base1Y = p1.y + p1.height * 0.5;
    const base2X = p2.x; const base2Y = p2.y + p2.height * 0.55;
    const base3X = p3.x; const base3Y = p3.y + p3.height * 0.55;
    const base4X = p4.x; const base4Y = p4.y + p4.height * 0.5;
    const base5X = p5.x; const base5Y = p5.y + p5.height * 0.35;

    // Organic SVG Bezier path tracing the palm perimeter
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

  // Gradient definitions helper matching user color suggestions
  const fingerGradients = [
    { id: 'grad-lp', start: '#f472b6', end: '#ec4899' }, // Pink (Ngón út trái)
    { id: 'grad-lr', start: '#c084fc', end: '#a855f7' }, // Purple (Ngón áp út trái)
    { id: 'grad-lm', start: '#818cf8', end: '#6366f1' }, // Indigo (Ngón giữa trái)
    { id: 'grad-li', start: '#60a5fa', end: '#3b82f6' }, // Blue (Ngón trỏ trái)
    { id: 'grad-lt', start: '#2dd4bf', end: '#0d9488' }, // Teal (Ngón cái trái)
    { id: 'grad-rt', start: '#2dd4bf', end: '#0d9488' }, // Teal (Ngón cái phải)
    { id: 'grad-ri', start: '#34d399', end: '#10b981' }, // Emerald (Ngón trỏ phải)
    { id: 'grad-rm', start: '#fbbf24', end: '#f59e0b' }, // Amber/Yellow (Ngón giữa phải)
    { id: 'grad-rr', start: '#fb923c', end: '#f97316' }, // Orange (Ngón áp út phải)
    { id: 'grad-rp', start: '#fda4af', end: '#f43f5e' }, // Rose/Red (Ngón út phải)
  ];

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20">
      
      {/* Canvas SVG overlay */}
      <svg className="absolute inset-0 w-full h-full overflow-visible">
        
        {/* 1. Define Premium Gradients for organic finger look */}
        <defs>
          {fingerGradients.map((g) => (
            <linearGradient key={g.id} id={g.id} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={g.start} stopOpacity="0.75" />
              <stop offset="100%" stopColor={g.end} stopOpacity="0.65" />
            </linearGradient>
          ))}
          {/* Active glow filter */}
          <filter id="glow-active" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 2. Render Semi-Transparent Palm (0.15 opacity) linking fingers structurally */}
        {leftPalmPath && (
          <path
            d={leftPalmPath}
            className="fill-slate-300/25 dark:fill-slate-700/10 stroke-slate-300/35 dark:stroke-slate-700/20 transition-all duration-200"
            strokeWidth="1.5"
            style={{ transition: 'd 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
          />
        )}
        {rightPalmPath && (
          <path
            d={rightPalmPath}
            className="fill-slate-300/25 dark:fill-slate-700/10 stroke-slate-300/35 dark:stroke-slate-700/20 transition-all duration-200"
            strokeWidth="1.5"
            style={{ transition: 'd 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
          />
        )}

        {/* 3. Render organic Tendon lines connecting Wrist base to fingers */}
        {fingerPositions.map((pos) => {
          if (!pos) return null;
          const { fingerId, x, y, isActive, isShift, isError } = pos;
          
          const isLeft = fingerId === 'lp' || fingerId === 'lr' || fingerId === 'lm' || fingerId === 'li' || fingerId === 'lt';
          const wristX = isLeft ? leftWristX : rightWristX;
          const wristY = isLeft ? leftWristY : rightWristY;

          const ctrlX = (x + wristX) / 2;
          const ctrlY = (y + wristY) / 2 + 15;

          let strokeClass = 'stroke-slate-300 dark:stroke-slate-700/50';
          let strokeWidth = '1.5';
          
          if (isError) {
            strokeClass = 'stroke-danger-500/50';
            strokeWidth = '2';
          } else if (isActive) {
            strokeClass = 'stroke-primary-500/50';
            strokeWidth = '2';
          } else if (isShift) {
            strokeClass = 'stroke-teal-500/50';
            strokeWidth = '2';
          }

          return (
            <path
              key={`line-${fingerId}`}
              d={`M ${wristX} ${wristY} Q ${ctrlX} ${ctrlY} ${x} ${y + 10}`}
              fill="none"
              className={`${strokeClass} transition-all duration-200`}
              strokeWidth={strokeWidth}
              style={{ transition: 'd 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
            />
          );
        })}

        {/* Wrist Base circle anchors */}
        <circle cx={leftWristX} cy={leftWristY} r="8" className="fill-slate-300/40 dark:fill-slate-700/30 stroke-slate-400/20" strokeWidth="1" />
        <circle cx={rightWristX} cy={rightWristY} r="8" className="fill-slate-300/40 dark:fill-slate-700/30 stroke-slate-400/20" strokeWidth="1" />

        {/* 4. Render the 10 Fingers in detail (Body + Nail + Joint details) */}
        {fingerPositions.map((pos) => {
          if (!pos) return null;
          const { fingerId, x, y, width, height, isActive, isShift, isError, scale } = pos;

          // Standardize finger shapes beautifully
          const fWidth = Math.max(12, Math.round(width * 0.34));
          const fHeight = Math.max(40, Math.round(height * 1.15));

          const radiusX = fWidth / 2;
          const radiusY = fHeight / 2;

          let strokeColor = 'stroke-slate-400/40 dark:stroke-slate-500/30';
          let glowFilter = '';
          let opacity = '0.7';

          if (isError) {
            strokeColor = 'stroke-danger-600 dark:stroke-danger-400';
            glowFilter = 'url(#glow-active)';
            opacity = '0.85';
          } else if (isActive) {
            strokeColor = 'stroke-primary-600 dark:stroke-primary-400';
            glowFilter = 'url(#glow-active)';
            opacity = '0.85';
          } else if (isShift) {
            strokeColor = 'stroke-teal-600 dark:stroke-teal-400';
            glowFilter = 'url(#glow-active)';
            opacity = '0.85';
          }

          // Build finger shape capsule dynamically
          const fingerPath = `
            M ${-radiusX} ${-radiusY + radiusX}
            A ${radiusX} ${radiusX} 0 0 1 ${radiusX} ${-radiusY + radiusX}
            L ${radiusX} ${radiusY}
            L ${-radiusX} ${radiusY}
            Z
          `;

          return (
            <g
              key={fingerId}
              transform={`translate(${x}, ${y}) scale(${scale})`}
              className="transition-transform duration-200"
              style={{
                transition: 'transform 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
            >
              {/* Finger Body Capsule */}
              <path
                d={fingerPath}
                fill={`url(#grad-${fingerId})`}
                className={`${strokeColor} transition-all duration-200`}
                strokeWidth="1.5"
                filter={glowFilter}
                opacity={opacity}
              />

              {/* Finger Nail (Móng tay bán nguyệt ở đầu ngón) */}
              <ellipse
                cx="0"
                cy={-radiusY + radiusX + 2}
                rx={radiusX * 0.65}
                ry={radiusX * 0.55}
                className="fill-white/40 dark:fill-white/20 stroke-white/10"
                strokeWidth="0.5"
                opacity={isActive || isShift || isError ? '0.9' : '0.6'}
              />

              {/* Finger Joint Lines (Các nét vẽ nếp nhăn khớp ngón tay tạo độ thật) */}
              <g className="text-black/10 dark:text-white/15" opacity="0.6">
                <path d={`M ${-radiusX * 0.7} ${-radiusY * 0.2} Q 0 ${-radiusY * 0.16} ${radiusX * 0.7} ${-radiusY * 0.2}`} fill="none" stroke="currentColor" strokeWidth="0.8" />
                <path d={`M ${-radiusX * 0.8} ${radiusY * 0.2} Q 0 ${radiusY * 0.24} ${radiusX * 0.8} ${radiusY * 0.2}`} fill="none" stroke="currentColor" strokeWidth="0.8" />
              </g>

              {/* Text helper label inside active fingers */}
              {(isActive || isShift || isError) && (
                <g transform="translate(0, 5)">
                  {/* Small round background bubble for text */}
                  <rect
                    x="-13"
                    y="6"
                    width="26"
                    height="9"
                    rx="3"
                    className="fill-white/95 dark:fill-slate-950/95 stroke-slate-200/50 dark:stroke-slate-800/50"
                    strokeWidth="0.5"
                  />
                  <text
                    x="0"
                    y="12"
                    textAnchor="middle"
                    className="text-[6.5px] font-black fill-slate-800 dark:fill-slate-200"
                    style={{ fontSize: '6.5px' }}
                  >
                    {FINGER_SHORT_NAMES[fingerId]}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
export default HandOverlay;
