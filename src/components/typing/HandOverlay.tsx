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

// Helper to determine natural CSS transform style for each finger without breaking away from the hand
const getFingerStyle = (
  fingerId: FingerType,
  isActive: boolean,
  isShift: boolean,
  isError: boolean,
  targetKey: string,
  isCorrect: boolean
): React.CSSProperties => {
  let rotate = 0;
  let tx = 0;
  let ty = 0;
  let scale = 1.0;
  let opacity = 0.65; // Default rest opacity
  
  const isWorking = isActive || isShift || isError;

  if (isWorking) {
    opacity = 0.95;
    scale = 1.05;
    
    // Tactile feedback: slightly press down if key pressed correctly
    if (isActive && isCorrect) {
      scale = 0.96;
      ty = 2; // Press down 2px
    } else {
      ty = -3; // Hover up 3px when active
    }

    const cleanTarget = targetKey.toLowerCase();
    
    // Small natural bending rotate/translate based on target key direction
    if (fingerId === 'li') { // Left Index
      if (['r', '4'].includes(cleanTarget)) { rotate = -5; ty = -6; }
      else if (['t', '5'].includes(cleanTarget)) { rotate = 6; ty = -6; tx = 3; }
      else if (['g'].includes(cleanTarget)) { rotate = 8; tx = 2; }
      else if (['v'].includes(cleanTarget)) { rotate = -4; ty = 3; }
      else if (['b'].includes(cleanTarget)) { rotate = 6; ty = 4; tx = 2; }
    } else if (fingerId === 'ri') { // Right Index
      if (['u', '7'].includes(cleanTarget)) { rotate = 5; ty = -6; }
      else if (['y', '6'].includes(cleanTarget)) { rotate = -6; ty = -6; tx = -3; }
      else if (['h'].includes(cleanTarget)) { rotate = -8; tx = -2; }
      else if (['m'].includes(cleanTarget)) { rotate = 4; ty = 3; }
      else if (['n'].includes(cleanTarget)) { rotate = -6; ty = 4; tx = -2; }
    } else if (fingerId === 'lm') { // Left Middle
      if (['e', '3'].includes(cleanTarget)) { ty = -6; }
      else if (['c'].includes(cleanTarget)) { rotate = -3; ty = 3; }
    } else if (fingerId === 'rm') { // Right Middle
      if (['i', '8'].includes(cleanTarget)) { ty = -6; }
      else if ([','].includes(cleanTarget)) { rotate = 3; ty = 3; }
    } else if (fingerId === 'lr') { // Left Ring
      if (['w', '2'].includes(cleanTarget)) { rotate = -2; ty = -6; }
      else if (['x'].includes(cleanTarget)) { rotate = -3; ty = 3; }
    } else if (fingerId === 'rr') { // Right Ring
      if (['o', '9'].includes(cleanTarget)) { rotate = 2; ty = -6; }
      else if (['.'].includes(cleanTarget)) { rotate = 3; ty = 3; }
    } else if (fingerId === 'lp') { // Left Pinky
      if (['q', '1'].includes(cleanTarget)) { rotate = -5; ty = -6; }
      else if (['z'].includes(cleanTarget)) { rotate = -6; ty = 3; }
    } else if (fingerId === 'rp') { // Right Pinky
      if (['p', '0'].includes(cleanTarget)) { rotate = 5; ty = -6; }
      else if (['/', ';', "'", 'enter', 'backspace'].includes(cleanTarget)) { rotate = 4; ty = 3; }
    } else if (fingerId === 'lt' || fingerId === 'rt') { // Thumbs
      if (cleanTarget === 'space') {
        ty = 2;
        scale = isActive && isCorrect ? 0.95 : 1.03;
      }
    }
  }

  // Exact anchor root coordinates (joint base) on SVG coordinate system (300x380)
  let transformOrigin = '150px 250px';
  switch (fingerId) {
    case 'lp': transformOrigin = '47px 185px'; break;
    case 'lr': transformOrigin = '98px 175px'; break;
    case 'lm': transformOrigin = '148px 172px'; break;
    case 'li': transformOrigin = '192px 175px'; break;
    case 'lt': transformOrigin = '218px 230px'; break;
    case 'rt': transformOrigin = '82px 230px'; break;
    case 'ri': transformOrigin = '108px 175px'; break;
    case 'rm': transformOrigin = '152px 172px'; break;
    case 'rr': transformOrigin = '202px 175px'; break;
    case 'rp': transformOrigin = '253px 185px'; break;
  }

  return {
    transform: `translate(${tx}px, ${ty}px) scale(${scale}) rotate(${rotate}deg)`,
    transformOrigin,
    opacity,
    transition: 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s, filter 0.2s, stroke 0.2s',
  };
};

export const HandOverlay: React.FC<HandOverlayProps> = ({
  geometry,
  targetChar,
  lastPressedKey,
  lastPressedCorrect,
}) => {
  // If keyboard geometry isn't measured yet, hide overlay to prevent flash jumps
  if (Object.keys(geometry).length === 0) return null;

  // Resolve target mapping configuration
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
        shiftFinger = 'rp'; // Right pinky holds Shift
      } else {
        shiftFinger = 'lp'; // Left pinky holds Shift
      }
    }
  }

  // Resolve clean key name
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

  // Dynamic Anchor Docking Math for Left Hand (A to F)
  const rectA = geometry['a'];
  const rectF = geometry['f'];

  // Dynamic Anchor Docking Math for Right Hand (J to ;)
  const rectJ = geometry['j'];
  const rectPinkyRight = geometry[';'];

  if (!rectA || !rectF || !rectJ || !rectPinkyRight) return null;

  // 1. Calculate Left Hand coordinates
  // Vertical distance between Pinky (45, 110) and Index (210, 95) is 165 units on SVG
  const leftDistance = rectF.centerX - rectA.centerX;
  const scaleLeft = leftDistance / 165;
  const leftHandWidth = 300 * scaleLeft;
  const leftHandHeight = 380 * scaleLeft;
  // Position so Left Index tip (210, 95) exactly lands on rectF center
  const leftSvgLeft = rectF.centerX - 210 * scaleLeft;
  const leftSvgTop = rectF.centerY - 95 * scaleLeft;

  // 2. Calculate Right Hand coordinates
  // Horizontal distance between Index (90, 95) and Pinky (255, 110) is 165 units on SVG
  const rightDistance = rectPinkyRight.centerX - rectJ.centerX;
  const scaleRight = rightDistance / 165;
  const rightHandWidth = 300 * scaleRight;
  const rightHandHeight = 380 * scaleRight;
  // Position so Right Index tip (90, 95) exactly lands on rectJ center
  const rightSvgLeft = rectJ.centerX - 90 * scaleRight;
  const rightSvgTop = rectJ.centerY - 95 * scaleRight;

  // Render a single finger group (path, nail, knuckle lines)
  const renderFinger = (
    fingerId: FingerType,
    pathD: string,
    nailCx: number,
    nailCy: number,
    nailRx: number,
    nailRy: number,
    nailRotate: number,
    strokeColor: string,
    activeStrokeColor: string,
    fillUrl: string,
    knucklePath1?: string,
    knucklePath2?: string
  ) => {
    const isActive = fingerId === activeFinger;
    const isShift = fingerId === shiftFinger;
    const isError = fingerId === errorFinger;

    const style = getFingerStyle(
      fingerId,
      isActive,
      isShift,
      isError,
      targetChar,
      isTypingCorrect
    );

    const activeColor = isError ? '#ef4444' : (isShift ? '#3b82f6' : activeStrokeColor);
    const stroke = (isActive || isShift || isError) ? activeColor : strokeColor;
    const strokeWidth = (isActive || isShift || isError) ? 2.2 : 1.2;

    return (
      <g
        id={`finger-${fingerId}`}
        data-finger={fingerId}
        style={{
          ...style,
          filter: (isActive || isShift || isError) 
            ? `drop-shadow(0 0 8px ${activeColor}bb)` 
            : 'none',
        }}
        className="transition-all"
      >
        {/* Finger main shape */}
        <path
          className="finger-shape"
          d={pathD}
          fill={fillUrl}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Knuckle lines (creases) */}
        {knucklePath1 && (
          <path
            d={knucklePath1}
            fill="none"
            stroke="rgba(238, 150, 110, 0.28)"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
        )}
        {knucklePath2 && (
          <path
            d={knucklePath2}
            fill="none"
            stroke="rgba(238, 150, 110, 0.28)"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
        )}
        {/* Nail */}
        <ellipse
          className="nail"
          cx={nailCx}
          cy={nailCy}
          rx={nailRx}
          ry={nailRy}
          transform={`rotate(${nailRotate} ${nailCx} ${nailCy})`}
        />
      </g>
    );
  };

  return (
    <>
      {/* 1. LEFT HAND OVERLAY */}
      <div
        style={{
          position: 'absolute',
          left: `${leftSvgLeft}px`,
          top: `${leftSvgTop}px`,
          width: `${leftHandWidth}px`,
          height: `${leftHandHeight}px`,
          pointerEvents: 'none',
          zIndex: 25,
        }}
        className="pointer-events-none select-none transition-all duration-200"
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 300 380"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          <defs>
            {/* Skin palm gradient */}
            <linearGradient id="leftPalmSkin" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#FFEAD5" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#FFC8A2" stopOpacity="0.2"/>
            </linearGradient>

            {/* Pastel gradients for Left Hand fingers */}
            <linearGradient id="grad-lp" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#FF96C8" stopOpacity="0.80"/>
              <stop offset="100%" stopColor="#FF5A9F" stopOpacity="0.55"/>
            </linearGradient>
            <linearGradient id="grad-lr" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#D2A0FF" stopOpacity="0.80"/>
              <stop offset="100%" stopColor="#A05AFF" stopOpacity="0.55"/>
            </linearGradient>
            <linearGradient id="grad-lm" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#B4E1FF" stopOpacity="0.80"/>
              <stop offset="100%" stopColor="#78B4FF" stopOpacity="0.55"/>
            </linearGradient>
            <linearGradient id="grad-li" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#A0F0C8" stopOpacity="0.80"/>
              <stop offset="100%" stopColor="#64D796" stopOpacity="0.55"/>
            </linearGradient>
            <linearGradient id="grad-lt" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#82F0EB" stopOpacity="0.80"/>
              <stop offset="100%" stopColor="#4BD2CD" stopOpacity="0.55"/>
            </linearGradient>

            <filter id="softHandShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#475569" floodOpacity="0.08"/>
            </filter>
          </defs>

          <style>
            {`
              .hand-svg { filter: url(#softHandShadow); }
              .palm-shape { stroke: rgba(238, 150, 110, 0.45); stroke-width: 1.5; }
              .nail { fill: rgba(255, 255, 255, 0.4); stroke: rgba(255, 255, 255, 0.7); stroke-width: 0.8; }
            `}
          </style>

          <g className="hand-svg">
            {/* Lòng bàn tay (Palm path) - Beautifully unified and flowing */}
            <path
              className="palm-shape"
              fill="url(#leftPalmSkin)"
              d="M 60,380 C 50,290 40,210 70,195 C 100,180 130,175 160,180 C 190,185 215,195 230,215 C 245,235 240,265 255,290 C 270,315 255,360 240,380 Z"
            />

            {/* Left Pinky (Ngón út trái) */}
            {renderFinger(
              'lp',
              'M 33,205 C 30,170 32,135 38,125 C 42,115 52,115 56,125 C 62,135 64,170 65,198',
              47, 127, 10, 7, -82,
              'rgba(255, 90, 159, 0.45)',
              '#FF5A9F',
              'url(#grad-lp)',
              'M 38,155 Q 47,152 56,155',
              'M 35,178 Q 47,175 58,178'
            )}

            {/* Left Ring (Ngón áp út trái) */}
            {renderFinger(
              'lr',
              'M 67,198 C 70,150 78,95 88,85 C 94,75 106,75 112,85 C 122,95 125,150 120,186',
              100, 87, 11, 8, -80,
              'rgba(160, 90, 255, 0.45)',
              '#A05AFF',
              'url(#grad-lr)',
              'M 80,125 Q 100,121 118,125',
              'M 75,155 Q 100,150 118,155'
            )}

            {/* Left Middle (Ngón giữa trái) */}
            {renderFinger(
              'lm',
              'M 122,186 C 125,150 133,75 143,65 C 149,55 161,55 167,65 C 177,75 178,150 174,186',
              155, 67, 12, 8, -77,
              'rgba(120, 180, 255, 0.45)',
              '#78B4FF',
              'url(#grad-lm)',
              'M 132,108 Q 155,103 172,108',
              'M 128,142 Q 155,137 172,142'
            )}

            {/* Left Index (Ngón trỏ trái) */}
            {renderFinger(
              'li',
              'M 175,186 C 178,155 188,110 198,100 C 204,90 216,90 222,100 C 230,110 231,160 221,208',
              210, 102, 11, 8, -67,
              'rgba(90, 215, 150, 0.45)',
              '#64D796',
              'url(#grad-li)',
              'M 188,138 Q 210,134 226,138',
              'M 182,168 Q 210,163 224,168'
            )}

            {/* Left Thumb (Ngón cái trái) */}
            {renderFinger(
              'lt',
              'M 218,222 C 222,205 240,205 255,215 C 270,225 285,240 282,255 C 278,268 260,272 245,268 C 230,262 220,245 218,222 Z',
              268, 245, 11, 8, 24,
              'rgba(70, 210, 200, 0.45)',
              '#4BD2CD',
              'url(#grad-lt)',
              'M 235,230 Q 250,222 262,232'
            )}
          </g>
        </svg>
      </div>

      {/* 2. RIGHT HAND OVERLAY */}
      <div
        style={{
          position: 'absolute',
          left: `${rightSvgLeft}px`,
          top: `${rightSvgTop}px`,
          width: `${rightHandWidth}px`,
          height: `${rightHandHeight}px`,
          pointerEvents: 'none',
          zIndex: 25,
        }}
        className="pointer-events-none select-none transition-all duration-200"
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 300 380"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          <defs>
            {/* Skin palm gradient */}
            <linearGradient id="rightPalmSkin" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#FFEAD5" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#FFC8A2" stopOpacity="0.2"/>
            </linearGradient>

            {/* Pastel gradients for Right Hand fingers */}
            <linearGradient id="grad-rp" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#FF96C8" stopOpacity="0.80"/>
              <stop offset="100%" stopColor="#FF5A9F" stopOpacity="0.55"/>
            </linearGradient>
            <linearGradient id="grad-rr" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#D2A0FF" stopOpacity="0.80"/>
              <stop offset="100%" stopColor="#A05AFF" stopOpacity="0.55"/>
            </linearGradient>
            <linearGradient id="grad-rm" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#B4E1FF" stopOpacity="0.80"/>
              <stop offset="100%" stopColor="#78B4FF" stopOpacity="0.55"/>
            </linearGradient>
            <linearGradient id="grad-ri" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#FFC878" stopOpacity="0.80"/>
              <stop offset="100%" stopColor="#FF9628" stopOpacity="0.55"/>
            </linearGradient>
            <linearGradient id="grad-rt" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#82F0EB" stopOpacity="0.80"/>
              <stop offset="100%" stopColor="#4BD2CD" stopOpacity="0.55"/>
            </linearGradient>
          </defs>

          <g className="hand-svg">
            {/* Lòng bàn tay (Palm path) - Beautifully unified and flowing */}
            <path
              className="palm-shape"
              fill="url(#rightPalmSkin)"
              d="M 240,380 C 250,290 260,210 230,195 C 200,180 170,175 140,180 C 110,185 85,195 70,215 C 55,235 60,265 45,290 C 30,315 45,360 60,380 Z"
            />

            {/* Right Index (Ngón trỏ phải) */}
            {renderFinger(
              'ri',
              'M 125,186 C 122,155 112,110 102,100 C 96,90 84,90 78,100 C 70,110 69,160 79,208',
              90, 102, 11, 8, 67,
              'rgba(240, 150, 40, 0.45)',
              '#FF9628',
              'url(#grad-ri)',
              'M 112,138 Q 90,134 74,138',
              'M 118,168 Q 90,163 76,168'
            )}

            {/* Right Middle (Ngón giữa phải) */}
            {renderFinger(
              'rm',
              'M 178,186 C 175,150 167,75 157,65 C 151,55 139,55 133,65 C 123,75 122,150 126,186',
              145, 67, 12, 8, 77,
              'rgba(120, 180, 255, 0.45)',
              '#78B4FF',
              'url(#grad-rm)',
              'M 168,108 Q 145,103 128,108',
              'M 172,142 Q 145,137 128,142'
            )}

            {/* Right Ring (Ngón áp út phải) */}
            {renderFinger(
              'rr',
              'M 233,198 C 230,150 222,95 212,85 C 206,75 194,75 188,85 C 178,95 175,150 180,186',
              200, 87, 11, 8, 80,
              'rgba(160, 90, 255, 0.45)',
              '#A05AFF',
              'url(#grad-rr)',
              'M 220,125 Q 200,121 182,125',
              'M 225,155 Q 200,150 182,155'
            )}

            {/* Right Pinky (Ngón út phải) */}
            {renderFinger(
              'rp',
              'M 267,205 C 270,170 268,135 262,125 C 258,115 248,115 244,125 C 238,135 236,170 235,198',
              253, 127, 10, 7, 82,
              'rgba(255, 90, 159, 0.45)',
              '#FF5A9F',
              'url(#grad-rp)',
              'M 262,155 Q 253,152 244,155',
              'M 265,178 Q 253,175 242,178'
            )}

            {/* Right Thumb (Ngón cái phải) */}
            {renderFinger(
              'rt',
              'M 82,222 C 78,205 60,205 45,215 C 30,225 15,240 18,255 C 22,268 40,272 55,268 C 70,262 80,245 82,222 Z',
              32, 245, 11, 8, -24,
              'rgba(70, 210, 200, 0.45)',
              '#4BD2CD',
              'url(#grad-rt)',
              'M 65,230 Q 50,222 38,232'
            )}
          </g>
        </svg>
      </div>
    </>
  );
};

export default HandOverlay;
