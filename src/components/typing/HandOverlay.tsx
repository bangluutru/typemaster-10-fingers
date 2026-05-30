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
  let opacity = 0.65; // Default rest opacity (as suggested in design guide: 0.55 - 0.7)
  
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

  // Exact joint anchor root coordinates (joint base) on SVG coordinate system (300x380)
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
          viewBox="0 0 300 380"
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
              <stop offset="0%" stopColor="#FF7BD5" stopOpacity="0.80"/>
              <stop offset="65%" stopColor="#FF7BD5" stopOpacity="0.40"/>
              <stop offset="100%" stopColor="#FF7BD5" stopOpacity="0.0"/>
            </linearGradient>
            {/* lr (Ring): #C58DFF */}
            <linearGradient id="grad-lr" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#C58DFF" stopOpacity="0.80"/>
              <stop offset="65%" stopColor="#C58DFF" stopOpacity="0.40"/>
              <stop offset="100%" stopColor="#C58DFF" stopOpacity="0.0"/>
            </linearGradient>
            {/* lm (Middle): #A6DBFF */}
            <linearGradient id="grad-lm" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#A6DBFF" stopOpacity="0.80"/>
              <stop offset="65%" stopColor="#A6DBFF" stopOpacity="0.40"/>
              <stop offset="100%" stopColor="#A6DBFF" stopOpacity="0.0"/>
            </linearGradient>
            {/* li (Index): #8EE7B5 */}
            <linearGradient id="grad-li" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#8EE7B5" stopOpacity="0.80"/>
              <stop offset="65%" stopColor="#8EE7B5" stopOpacity="0.40"/>
              <stop offset="100%" stopColor="#8EE7B5" stopOpacity="0.0"/>
            </linearGradient>
            {/* lt (Thumb): #6EE7E0 */}
            <linearGradient id="grad-lt" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#6EE7E0" stopOpacity="0.80"/>
              <stop offset="65%" stopColor="#6EE7E0" stopOpacity="0.40"/>
              <stop offset="100%" stopColor="#6EE7E0" stopOpacity="0.0"/>
            </linearGradient>

            <filter id="softHandShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#475569" floodOpacity="0.08"/>
            </filter>
          </defs>

          <style>
            {`
              .hand-svg { filter: url(#softHandShadow); }
              .outer-outline { fill: url(#leftPalmSkin); stroke: rgba(238, 150, 110, 0.45); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
              .nail { fill: rgba(255, 255, 255, 0.4); stroke: rgba(255, 255, 255, 0.7); stroke-width: 0.8; }
            `}
          </style>

          <g className="hand left hand-svg">
            {/* SINGLE SEAMLESS OUTER OUTLINE - Keeps the palm and fingers unified 100% */}
            <path
              className="outer-outline"
              d="M 70,380 C 45,350 25,290 33,205 C 31,165 33,130 40,118 C 45,108 55,108 59,118 C 65,130 63,165 65,198 C 68,150 78,92 86,80 C 92,70 102,70 108,80 C 117,92 120,150 120,186 C 123,145 133,72 142,60 C 147,50 157,50 162,60 C 171,72 173,145 174,186 C 177,150 186,105 196,95 C 201,85 211,85 216,95 C 224,105 225,150 221,208 C 220,215 212,228 215,225 C 220,202 242,198 258,212 C 272,224 286,242 284,258 C 281,270 262,274 246,268 C 230,262 232,320 230,380 Z"
            />

            {/* Left Pinky (Ngón út trái) */}
            {renderFinger(
              'lp',
              'pinkyfinger',
              'M 33,205 C 31,165 33,130 40,118 C 45,108 55,108 59,118 C 65,130 63,165 65,198 Z',
              47, 127, 10, 7, -82,
              '#FF7BD5',
              'url(#grad-lp)',
              'M 38,155 Q 47,152 56,155',
              'M 35,178 Q 47,175 58,178'
            )}

            {/* Left Ring (Ngón áp út trái) */}
            {renderFinger(
              'lr',
              'ringfinger',
              'M 65,198 C 68,150 78,92 86,80 C 92,70 102,70 108,80 C 117,92 120,150 120,186 Z',
              100, 87, 11, 8, -80,
              '#C58DFF',
              'url(#grad-lr)',
              'M 80,125 Q 100,121 118,125',
              'M 75,155 Q 100,150 118,155'
            )}

            {/* Left Middle (Ngón giữa trái) */}
            {renderFinger(
              'lm',
              'middlefinger',
              'M 120,186 C 123,145 133,72 142,60 C 147,50 157,50 162,60 C 171,72 173,145 174,186 Z',
              155, 67, 12, 8, -77,
              '#A6DBFF',
              'url(#grad-lm)',
              'M 132,108 Q 155,103 172,108',
              'M 128,142 Q 155,137 172,142'
            )}

            {/* Left Index (Ngón trỏ trái) */}
            {renderFinger(
              'li',
              'indexfinger',
              'M 174,186 C 177,150 186,105 196,95 C 201,85 211,85 216,95 C 224,105 225,150 221,208 Z',
              210, 102, 11, 8, -67,
              '#8EE7B5',
              'url(#grad-li)',
              'M 188,138 Q 210,134 226,138',
              'M 182,168 Q 210,163 224,168'
            )}

            {/* Left Thumb (Ngón cái trái) */}
            {renderFinger(
              'lt',
              'thumb',
              'M 215,225 C 220,202 242,198 258,212 C 272,224 286,242 284,258 C 281,270 262,274 246,268 C 231,262 220,245 215,225 Z',
              268, 245, 11, 8, 24,
              '#6EE7E0',
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
              <stop offset="0%" stopColor="#FFEAD5" stopOpacity="0.45"/>
              <stop offset="100%" stopColor="#FFC8A2" stopOpacity="0.25"/>
            </linearGradient>

            {/* Smooth fading pastel gradients for Right Hand */}
            {/* rp (Pinky): #FF7BD5 */}
            <linearGradient id="grad-rp" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#FF7BD5" stopOpacity="0.80"/>
              <stop offset="65%" stopColor="#FF7BD5" stopOpacity="0.40"/>
              <stop offset="100%" stopColor="#FF7BD5" stopOpacity="0.0"/>
            </linearGradient>
            {/* rr (Ring): #C58DFF */}
            <linearGradient id="grad-rr" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#C58DFF" stopOpacity="0.80"/>
              <stop offset="65%" stopColor="#C58DFF" stopOpacity="0.40"/>
              <stop offset="100%" stopColor="#C58DFF" stopOpacity="0.0"/>
            </linearGradient>
            {/* rm (Middle): #A6DBFF */}
            <linearGradient id="grad-rm" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#A6DBFF" stopOpacity="0.80"/>
              <stop offset="65%" stopColor="#A6DBFF" stopOpacity="0.40"/>
              <stop offset="100%" stopColor="#A6DBFF" stopOpacity="0.0"/>
            </linearGradient>
            {/* ri (Index): #FFB455 */}
            <linearGradient id="grad-ri" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#FFB455" stopOpacity="0.80"/>
              <stop offset="65%" stopColor="#FFB455" stopOpacity="0.40"/>
              <stop offset="100%" stopColor="#FFB455" stopOpacity="0.0"/>
            </linearGradient>
            {/* rt (Thumb): #6EE7E0 */}
            <linearGradient id="grad-rt" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#6EE7E0" stopOpacity="0.80"/>
              <stop offset="65%" stopColor="#6EE7E0" stopOpacity="0.40"/>
              <stop offset="100%" stopColor="#6EE7E0" stopOpacity="0.0"/>
            </linearGradient>
          </defs>

          <g className="hand right hand-svg">
            {/* SINGLE SEAMLESS OUTER OUTLINE - Keeps the palm and fingers unified 100% */}
            <path
              className="outer-outline"
              d="M 230,380 C 255,350 275,290 267,205 C 269,165 267,130 260,118 C 255,108 245,108 241,118 C 235,130 237,165 235,198 C 232,150 222,92 214,80 C 208,70 198,70 192,80 C 183,92 180,150 180,186 C 177,145 167,72 158,60 C 153,50 143,50 138,60 C 129,72 127,145 126,186 C 123,150 114,105 104,95 C 99,85 89,85 84,95 C 76,105 75,150 79,208 C 80,215 88,228 85,225 C 80,202 58,198 42,212 C 28,224 14,242 16,258 C 19,270 38,274 54,268 C 70,262 68,320 70,380 Z"
            />

            {/* Right Index (Ngón trỏ phải) */}
            {renderFinger(
              'ri',
              'indexfinger',
              'M 126,186 C 123,150 114,105 104,95 C 99,85 89,85 84,95 C 76,105 75,150 79,208 Z',
              90, 102, 11, 8, 67,
              '#FFB455',
              'url(#grad-ri)',
              'M 112,138 Q 90,134 74,138',
              'M 118,168 Q 90,163 76,168'
            )}

            {/* Right Middle (Ngón giữa phải) */}
            {renderFinger(
              'rm',
              'middlefinger',
              'M 180,186 C 177,145 167,72 158,60 C 153,50 143,50 138,60 C 129,72 127,145 126,186 Z',
              145, 67, 12, 8, 77,
              '#A6DBFF',
              'url(#grad-rm)',
              'M 168,108 Q 145,103 128,108',
              'M 172,142 Q 145,137 128,142'
            )}

            {/* Right Ring (Ngón áp út phải) */}
            {renderFinger(
              'rr',
              'ringfinger',
              'M 235,198 C 232,150 224,92 214,80 C 208,70 198,70 192,80 C 183,92 180,150 180,186 Z',
              200, 87, 11, 8, 80,
              '#C58DFF',
              'url(#grad-rr)',
              'M 220,125 Q 200,121 182,125',
              'M 225,155 Q 200,150 182,155'
            )}

            {/* Right Pinky (Ngón út phải) */}
            {renderFinger(
              'rp',
              'pinkyfinger',
              'M 267,205 C 269,165 267,130 260,118 C 255,108 245,108 241,118 C 235,130 237,165 235,198 Z',
              253, 127, 10, 7, 82,
              '#FF7BD5',
              'url(#grad-rp)',
              'M 262,155 Q 253,152 244,155',
              'M 265,178 Q 253,175 242,178'
            )}

            {/* Right Thumb (Ngón cái phải) */}
            {renderFinger(
              'rt',
              'thumb',
              'M 85,225 C 80,202 58,198 42,212 C 28,224 14,242 16,258 C 19,270 38,274 54,268 C 69,262 80,245 85,225 Z',
              32, 245, 11, 8, -24,
              '#6EE7E0',
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
