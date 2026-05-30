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
  let opacity = 0.60; // Default rest opacity (0.55 - 0.7 as suggested)
  
  const isWorking = isActive || isShift || isError;

  if (isWorking) {
    opacity = 0.95;
    scale = 1.04;
    
    // Tactile feedback: slightly press down if key pressed correctly (-2px as suggested in diagram)
    if (isActive && isCorrect) {
      scale = 0.96;
      ty = 2; // Press down 2px
    } else {
      ty = -3; // Hover up 3px when active to guide the user
    }

    const cleanTarget = targetKey.toLowerCase();
    
    // Small natural bending rotate/translate based on target key direction to keep fingers connected
    if (fingerId === 'li') { // Left Index
      if (['r', '4'].includes(cleanTarget)) { rotate = -4; ty = -5; }
      else if (['t', '5'].includes(cleanTarget)) { rotate = 5; ty = -5; tx = 2; }
      else if (['g'].includes(cleanTarget)) { rotate = 6; tx = 2; }
      else if (['v'].includes(cleanTarget)) { rotate = -3; ty = 3; }
      else if (['b'].includes(cleanTarget)) { rotate = 5; ty = 4; tx = 2; }
    } else if (fingerId === 'ri') { // Right Index
      if (['u', '7'].includes(cleanTarget)) { rotate = 4; ty = -5; }
      else if (['y', '6'].includes(cleanTarget)) { rotate = -5; ty = -5; tx = -2; }
      else if (['h'].includes(cleanTarget)) { rotate = -6; tx = -2; }
      else if (['m'].includes(cleanTarget)) { rotate = 3; ty = 3; }
      else if (['n'].includes(cleanTarget)) { rotate = -5; ty = 4; tx = -2; }
    } else if (fingerId === 'lm') { // Left Middle
      if (['e', '3'].includes(cleanTarget)) { ty = -5; }
      else if (['c'].includes(cleanTarget)) { rotate = -2; ty = 2; }
    } else if (fingerId === 'rm') { // Right Middle
      if (['i', '8'].includes(cleanTarget)) { ty = -5; }
      else if ([','].includes(cleanTarget)) { rotate = 2; ty = 2; }
    } else if (fingerId === 'lr') { // Left Ring
      if (['w', '2'].includes(cleanTarget)) { rotate = -2; ty = -5; }
      else if (['x'].includes(cleanTarget)) { rotate = -2; ty = 2; }
    } else if (fingerId === 'rr') { // Right Ring
      if (['o', '9'].includes(cleanTarget)) { rotate = 2; ty = -5; }
      else if (['.'].includes(cleanTarget)) { rotate = 2; ty = 2; }
    } else if (fingerId === 'lp') { // Left Pinky
      if (['q', '1'].includes(cleanTarget)) { rotate = -4; ty = -5; }
      else if (['z'].includes(cleanTarget)) { rotate = -4; ty = 2; }
    } else if (fingerId === 'rp') { // Right Pinky
      if (['p', '0'].includes(cleanTarget)) { rotate = 4; ty = -5; }
      else if (['/', ';', "'", 'enter', 'backspace'].includes(cleanTarget)) { rotate = 3; ty = 2; }
    } else if (fingerId === 'lt' || fingerId === 'rt') { // Thumbs
      if (cleanTarget === 'space') {
        ty = 1.5;
        scale = isActive && isCorrect ? 0.95 : 1.02;
      }
    }
  }

  // Exact joint anchor root coordinates on the redesigned 400x480 SVG coordinates
  let transformOrigin = '200px 300px';
  switch (fingerId) {
    case 'lp': transformOrigin = '108px 220px'; break;
    case 'lr': transformOrigin = '147px 220px'; break;
    case 'lm': transformOrigin = '194px 220px'; break;
    case 'li': transformOrigin = '238px 225px'; break;
    case 'lt': transformOrigin = '260px 290px'; break;
    case 'rt': transformOrigin = '140px 290px'; break;
    case 'ri': transformOrigin = '162px 225px'; break;
    case 'rm': transformOrigin = '206px 220px'; break;
    case 'rr': transformOrigin = '253px 220px'; break;
    case 'rp': transformOrigin = '292px 220px'; break;
  }

  return {
    transform: `translate(${tx}px, ${ty}px) scale(${scale}) rotate(${rotate}deg)`,
    transformOrigin,
    opacity,
    transition: 'transform 0.22s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.22s, filter 0.22s',
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
  // Horizontal distance between Pinky (105, 120) and Index (242, 92) is exactly 137 units on SVG
  const leftDistance = rectF.centerX - rectA.centerX;
  const scaleLeft = leftDistance / 137;
  const leftHandWidth = 400 * scaleLeft;
  const leftHandHeight = 480 * scaleLeft;
  // Position so Left Index tip (242, 92) exactly lands on rectF center
  const leftSvgLeft = rectF.centerX - 242 * scaleLeft;
  const leftSvgTop = rectF.centerY - 92 * scaleLeft;

  // 2. Calculate Right Hand coordinates
  // Horizontal distance between Index (158, 92) and Pinky (295, 120) is exactly 137 units on SVG
  const rightDistance = rectPinkyRight.centerX - rectJ.centerX;
  const scaleRight = rightDistance / 137;
  const rightHandWidth = 400 * scaleRight;
  const rightHandHeight = 480 * scaleRight;
  // Position so Right Index tip (158, 92) exactly lands on rectJ center
  const rightSvgLeft = rectJ.centerX - 158 * scaleRight;
  const rightSvgTop = rectJ.centerY - 92 * scaleRight;

  // Render a single seamless finger group (borderless path overlay, nail, knuckle lines)
  const renderFinger = (
    fingerId: FingerType,
    className: string,
    pathD: string,
    nailCx: number,
    nailCy: number,
    nailRx: number,
    nailRy: number,
    nailRotate: number,
    activeColor: string,
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

    const glowColor = isError ? '#ef4444' : (isShift ? '#3b82f6' : activeColor);

    return (
      <g
        id={`finger-${fingerId}`}
        className={className}
        data-finger={fingerId}
        style={{
          ...style,
          filter: (isActive || isShift || isError) 
            ? `drop-shadow(0 0 10px ${glowColor}cc)` 
            : 'none',
        }}
      >
        {/* Finger color overlay - Borderless so it merges perfectly into the palm */}
        <path
          className="finger-shape"
          d={pathD}
          fill={fillUrl}
          stroke="none"
          strokeWidth="0"
        />
        {/* Knuckle lines (creases) */}
        {knucklePath1 && (
          <path
            d={knucklePath1}
            fill="none"
            stroke="rgba(238, 150, 110, 0.25)"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
        )}
        {knucklePath2 && (
          <path
            d={knucklePath2}
            fill="none"
            stroke="rgba(238, 150, 110, 0.25)"
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
          viewBox="0 0 400 480"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          <defs>
            {/* Skin palm gradient */}
            <linearGradient id="leftPalmSkin" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#FFEAD5" stopOpacity="0.45"/>
              <stop offset="100%" stopColor="#FFC8A2" stopOpacity="0.25"/>
            </linearGradient>

            {/* Smooth fading pastel gradients (melts to transparent at finger roots) */}
            {/* lp (Pinky): #FF7BD5 */}
            <linearGradient id="grad-lp" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#FF7BD5" stopOpacity="0.85"/>
              <stop offset="65%" stopColor="#FF7BD5" stopOpacity="0.45"/>
              <stop offset="100%" stopColor="#FF7BD5" stopOpacity="0.0"/>
            </linearGradient>
            {/* lr (Ring): #C58DFF */}
            <linearGradient id="grad-lr" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#C58DFF" stopOpacity="0.85"/>
              <stop offset="65%" stopColor="#C58DFF" stopOpacity="0.45"/>
              <stop offset="100%" stopColor="#C58DFF" stopOpacity="0.0"/>
            </linearGradient>
            {/* lm (Middle): #A6DBFF */}
            <linearGradient id="grad-lm" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#A6DBFF" stopOpacity="0.85"/>
              <stop offset="65%" stopColor="#A6DBFF" stopOpacity="0.45"/>
              <stop offset="100%" stopColor="#A6DBFF" stopOpacity="0.0"/>
            </linearGradient>
            {/* li (Index): #8EE7B5 */}
            <linearGradient id="grad-li" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#8EE7B5" stopOpacity="0.85"/>
              <stop offset="65%" stopColor="#8EE7B5" stopOpacity="0.45"/>
              <stop offset="100%" stopColor="#8EE7B5" stopOpacity="0.0"/>
            </linearGradient>
            {/* lt (Thumb): #6EE7E0 */}
            <linearGradient id="grad-lt" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#6EE7E0" stopOpacity="0.85"/>
              <stop offset="65%" stopColor="#6EE7E0" stopOpacity="0.45"/>
              <stop offset="100%" stopColor="#6EE7E0" stopOpacity="0.0"/>
            </linearGradient>

            <filter id="softHandShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#475569" floodOpacity="0.08"/>
            </filter>
          </defs>

          <style>
            {`
              .hand-svg { filter: url(#softHandShadow); }
              .outer-outline { fill: url(#leftPalmSkin); stroke: rgba(238, 150, 110, 0.45); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
              .palm-crease { fill: none; stroke: rgba(238, 150, 110, 0.22); stroke-width: 1.2; stroke-linecap: round; }
              .nail { fill: rgba(255, 255, 255, 0.4); stroke: rgba(255, 255, 255, 0.7); stroke-width: 0.8; }
            `}
          </style>

          <g className="hand left hand-svg">
            {/* SINGLE SEAMLESS OUTER OUTLINE - Recreated 100% to match LEFT HAND SVG mockup */}
            <path
              className="outer-outline"
              d="M 110,470 C 95,440 70,360 75,340 C 80,320 88,260 92,218 C 90,165 91,135 105,120 C 118,105 121,155 124,222 C 127,155 133,105 148,88 C 162,70 164,120 170,218 C 173,120 180,75 196,60 C 212,45 214,95 218,222 C 221,120 227,105 242,92 C 256,78 257,135 258,250 C 258,285 248,310 262,305 C 290,295 320,285 355,275 C 375,270 380,305 350,335 C 320,365 295,410 290,420 C 285,430 250,455 230,470 Z"
            />

            {/* Creases (Lines) on the Palm - Recreated from biological curves of LEFT HAND SVG mockup */}
            <path className="palm-crease" d="M 242,260 C 235,310 205,370 200,410" /> {/* Life line */}
            <path className="palm-crease" d="M 115,260 C 135,270 175,265 235,245" /> {/* Head line */}
            <path className="palm-crease" d="M 110,230 C 130,240 170,225 185,200" /> {/* Heart line */}

            {/* Left Pinky (Ngón út trái) */}
            {renderFinger(
              'lp',
              'pinkyfinger',
              'M 92,218 C 90,165 91,135 105,120 C 118,105 121,155 124,222 Z',
              105, 132, 11, 7.5, -82,
              '#FF7BD5',
              'url(#grad-lp)',
              'M 96,160 Q 106,156 116,160',
              'M 94,188 Q 106,184 118,188'
            )}

            {/* Left Ring (Ngón áp út trái) */}
            {renderFinger(
              'lr',
              'ringfinger',
              'M 124,222 C 127,155 133,105 148,88 C 162,70 164,120 170,218 Z',
              148, 101, 12, 8, -80,
              '#C58DFF',
              'url(#grad-lr)',
              'M 134,132 Q 148,127 162,132',
              'M 130,168 Q 148,163 164,168'
            )}

            {/* Left Middle (Ngón giữa trái) */}
            {renderFinger(
              'lm',
              'middlefinger',
              'M 170,218 C 173,120 180,75 196,60 C 212,45 214,95 218,222 Z',
              196, 74, 13, 8.5, -77,
              '#A6DBFF',
              'url(#grad-lm)',
              'M 180,116 Q 196,111 210,116',
              'M 176,152 Q 196,147 212,152'
            )}

            {/* Left Index (Ngón trỏ trái) */}
            {renderFinger(
              'li',
              'indexfinger',
              'M 218,222 C 221,120 227,105 242,92 C 256,78 257,135 258,250 Z',
              242, 106, 12, 8, -67,
              '#8EE7B5',
              'url(#grad-li)',
              'M 226,142 Q 242,138 256,142',
              'M 222,176 Q 242,171 254,176'
            )}

            {/* Left Thumb (Ngón cái trái) */}
            {renderFinger(
              'lt',
              'thumb',
              'M 258,250 C 258,285 248,310 262,305 C 290,295 320,285 355,275 C 375,270 380,305 350,335 C 320,365 295,410 290,420 Z',
              348, 283, 12, 8, 24,
              '#6EE7E0',
              'url(#grad-lt)',
              'M 292,305 Q 312,298 328,308'
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
          viewBox="0 0 400 480"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          <defs>
            {/* Skin palm gradient */}
            <linearGradient id="rightPalmSkin" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#FFEAD5" stopOpacity="0.45"/>
              <stop offset="100%" stopColor="#FFC8A2" stopOpacity="0.25"/>
            </linearGradient>

            {/* Smooth fading pastel gradients for Right Hand */}
            {/* rp (Pinky): #FF7BD5 */}
            <linearGradient id="grad-rp" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#FF7BD5" stopOpacity="0.85"/>
              <stop offset="65%" stopColor="#FF7BD5" stopOpacity="0.45"/>
              <stop offset="100%" stopColor="#FF7BD5" stopOpacity="0.0"/>
            </linearGradient>
            {/* rr (Ring): #C58DFF */}
            <linearGradient id="grad-rr" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#C58DFF" stopOpacity="0.85"/>
              <stop offset="65%" stopColor="#C58DFF" stopOpacity="0.45"/>
              <stop offset="100%" stopColor="#C58DFF" stopOpacity="0.0"/>
            </linearGradient>
            {/* rm (Middle): #A6DBFF */}
            <linearGradient id="grad-rm" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#A6DBFF" stopOpacity="0.85"/>
              <stop offset="65%" stopColor="#A6DBFF" stopOpacity="0.45"/>
              <stop offset="100%" stopColor="#A6DBFF" stopOpacity="0.0"/>
            </linearGradient>
            {/* ri (Index): #FFB455 */}
            <linearGradient id="grad-ri" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#FFB455" stopOpacity="0.85"/>
              <stop offset="65%" stopColor="#FFB455" stopOpacity="0.45"/>
              <stop offset="100%" stopColor="#FFB455" stopOpacity="0.0"/>
            </linearGradient>
            {/* rt (Thumb): #6EE7E0 */}
            <linearGradient id="grad-rt" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#6EE7E0" stopOpacity="0.85"/>
              <stop offset="65%" stopColor="#6EE7E0" stopOpacity="0.45"/>
              <stop offset="100%" stopColor="#6EE7E0" stopOpacity="0.0"/>
            </linearGradient>
          </defs>

          <g className="hand right hand-svg">
            {/* SINGLE SEAMLESS OUTER OUTLINE - Perfect mathematical mirror (x -> 400 - x) */}
            <path
              className="outer-outline"
              d="M 290,470 C 305,440 330,360 325,340 C 320,320 312,260 308,218 C 310,165 309,135 295,120 C 282,105 279,155 276,222 C 273,155 267,105 252,88 C 238,70 236,120 230,218 C 227,120 220,75 204,60 C 188,45 186,95 182,222 C 179,120 173,105 158,92 C 144,78 143,135 142,250 C 142,285 152,310 138,305 C 110,295 80,285 45,275 C 25,270 20,305 50,335 C 80,365 105,410 110,420 C 115,430 150,455 170,470 Z"
            />

            {/* Creases (Lines) on the Palm - Mirrored (x -> 400 - x) */}
            <path className="palm-crease" d="M 158,260 C 165,310 195,370 200,410" />
            <path className="palm-crease" d="M 285,260 C 265,270 225,265 165,245" />
            <path className="palm-crease" d="M 290,230 C 270,240 230,225 215,200" />

            {/* Right Index (Ngón trỏ phải) */}
            {renderFinger(
              'ri',
              'indexfinger',
              'M 182,222 C 179,120 173,105 158,92 C 144,78 143,135 142,250 Z',
              158, 106, 12, 8, 67,
              '#FFB455',
              'url(#grad-ri)',
              'M 174,142 Q 158,138 144,142',
              'M 178,176 Q 158,171 146,176'
            )}

            {/* Right Middle (Ngón giữa phải) */}
            {renderFinger(
              'rm',
              'middlefinger',
              'M 182,222 C 186,95 188,45 204,60 C 220,75 227,120 230,218 Z',
              204, 74, 13, 8.5, 77,
              '#A6DBFF',
              'url(#grad-rm)',
              'M 220,116 Q 204,111 190,116',
              'M 224,152 Q 204,147 188,152'
            )}

            {/* Right Ring (Ngón áp út phải) */}
            {renderFinger(
              'rr',
              'ringfinger',
              'M 230,218 C 236,120 238,70 252,88 C 267,105 273,155 276,222 Z',
              252, 101, 12, 8, 80,
              '#C58DFF',
              'url(#grad-rr)',
              'M 266,132 Q 252,127 238,132',
              'M 270,168 Q 252,163 236,168'
            )}

            {/* Right Pinky (Ngón út phải) */}
            {renderFinger(
              'rp',
              'pinkyfinger',
              'M 276,222 C 279,155 282,105 295,120 C 309,135 308,165 308,218 Z',
              295, 132, 11, 7.5, 82,
              '#FF7BD5',
              'url(#grad-rp)',
              'M 304,160 Q 294,156 284,160',
              'M 306,188 Q 294,184 282,188'
            )}

            {/* Right Thumb (Ngón cái phải) */}
            {renderFinger(
              'rt',
              'thumb',
              'M 142,250 C 142,285 152,310 138,305 C 110,295 80,285 45,275 C 25,270 20,305 50,335 C 80,365 105,410 110,420 Z',
              52, 283, 12, 8, -24,
              '#6EE7E0',
              'url(#grad-rt)',
              'M 108,305 Q 88,298 72,308'
            )}
          </g>
        </svg>
      </div>
    </>
  );
};

export default HandOverlay;
