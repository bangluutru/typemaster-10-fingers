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

// Absolute coordinates of the 10 finger tips in the original 1200x520 SVG
const FINGER_ORIGINS: Record<FingerType, { x: number; y: number }> = {
  lp: { x: 202, y: 112 },  // leftPinky (82 + 120, 42 + 70)
  lr: { x: 248, y: 91 },   // leftRing (128 + 120, 21 + 70)
  lm: { x: 295, y: 80 },   // leftMiddle (175 + 120, 10 + 70)
  li: { x: 351, y: 108 },  // leftIndex (231 + 120, 38 + 70)
  lt: { x: 438, y: 291 },  // leftThumb (318 + 120, 221 + 70)
  rt: { x: 797, y: 291 },  // rightThumb (82 + 715, 221 + 70)
  ri: { x: 884, y: 108 },  // rightIndex (169 + 715, 38 + 70)
  rm: { x: 940, y: 80 },   // rightMiddle (225 + 715, 10 + 70)
  rr: { x: 987, y: 91 },   // rightRing (272 + 715, 21 + 70)
  rp: { x: 1033, y: 112 }, // rightPinky (318 + 715, 42 + 70)
};

export const HandOverlay: React.FC<HandOverlayProps> = ({
  geometry,
  targetChar,
  lastPressedKey,
  lastPressedCorrect,
}) => {
  // If keyboard geometry isn't measured yet, hide overlay to prevent flash jump
  if (Object.keys(geometry).length === 0) return null;

  // Verify target keys and shift holds
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

  // Resolve errors
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

  // DYNAMIC SVG ALIGNMENT MATH:
  // We align the SVG overlay such that the rest positions of index fingers (left index 'F' and right index 'J')
  // exactly match the measured key centers of 'F' and 'J' in the DOM.
  const rectF = geometry['f'];
  const rectJ = geometry['j'];

  if (!rectF || !rectJ) return null;

  // 1. Calculate perfect scale ratio based on the J-F horizontal distance
  const targetDistance = rectJ.centerX - rectF.centerX;
  const svgOriginalDistance = 533; // 884 (rightIndex X) - 351 (leftIndex X) on original SVG
  const scale = targetDistance / svgOriginalDistance;

  // 2. Calculate top-left absolute coordinates of the SVG overlay box
  // Such that leftIndex tip (351, 108) lands exactly on rectF center
  const svgLeft = rectF.centerX - 351 * scale;
  const svgTop = rectF.centerY - 108 * scale;

  // 3. Render 10 finger transformations dynamically
  const fingerTransformations = (Object.keys(FINGER_ORIGINS) as FingerType[]).reduce((acc, fingerId) => {
    const origin = FINGER_ORIGINS[fingerId];
    let dx = 0;
    let dy = 0;
    let fingerScale = 1.0;
    let fingerOpacity = 0.78; // Rest opacity

    const isActive = fingerId === activeFinger;
    const isShift = fingerId === shiftFinger;
    const isError = fingerId === errorFinger;

    if (isActive || isShift || isError) {
      fingerOpacity = 1.0; // Highlight active fingers
      
      // Determine destination key coordinate
      let targetKeyId = 'a'; // Fallback
      if (isActive) {
        const config = fingerMapping[targetChar];
        targetKeyId = config ? config.key : targetChar.toLowerCase();
      } else if (isShift) {
        targetKeyId = fingerId === 'lp' ? 'shift-left' : 'shift-right';
      }

      let destRect = geometry[targetKeyId.toLowerCase()];
      if (!destRect && targetKeyId === 'space') {
        destRect = geometry['space'];
      }

      if (destRect) {
        let destX = destRect.centerX;
        let destY = destRect.centerY;

        // Custom spacebar offsets for thumbs
        if (targetKeyId === 'space') {
          if (fingerId === 'lt') {
            destX = destRect.x + destRect.width * 0.38;
          } else if (fingerId === 'rt') {
            destX = destRect.x + destRect.width * 0.62;
          }
          destY = destRect.centerY - destRect.height * 0.15;
        }

        // Convert DOM destination to SVG-local coordinates
        const svgDestX = (destX - svgLeft) / scale;
        const svgDestY = (destY - svgTop) / scale;

        // Calculate translation deltas relative to finger's original tip drawing
        dx = svgDestX - origin.x;
        dy = svgDestY - origin.y;

        // Apply interactive scaling feedback
        if (isActive && isTypingCorrect) {
          fingerScale = 0.92; // Tactile press scale down
        } else {
          fingerScale = 1.05; // Active hover scale up
        }
      }
    }

    acc[fingerId] = { dx, dy, scale: fingerScale, opacity: fingerOpacity, isActive, isShift, isError };
    return acc;
  }, {} as Record<FingerType, { dx: number; dy: number; scale: number; opacity: number; isActive: boolean; isShift: boolean; isError: boolean }>);

  // SVG Size matching original bounds
  const svgWidth = 1200 * scale;
  const svgHeight = 520 * scale;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${svgLeft}px`,
        top: `${svgTop}px`,
        width: `${svgWidth}px`,
        height: `${svgHeight}px`,
        pointerEvents: 'none',
        zIndex: 25,
      }}
      className="pointer-events-none select-none"
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1200 520"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="skin" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#FFE8D8" stopOpacity="0.75"/>
            <stop offset="100%" stopColor="#FFC7A9" stopOpacity="0.55"/>
          </linearGradient>
          {/* Exact color gradients from typing-hands.svg */}
          <linearGradient id="leftPinky" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#FF7FB3" stopOpacity=".82"/><stop offset="100%" stopColor="#FF7FB3" stopOpacity=".46"/></linearGradient>
          <linearGradient id="leftRing" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#C58BFF" stopOpacity=".82"/><stop offset="100%" stop-color="#C58BFF" stopOpacity=".46"/></linearGradient>
          <linearGradient id="leftMiddle" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#8EC5FF" stopOpacity=".82"/><stop offset="100%" stopColor="#8EC5FF" stopOpacity=".46"/></linearGradient>
          <linearGradient id="leftIndex" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#69DDA6" stopOpacity=".82"/><stop offset="100%" stopColor="#69DDA6" stopOpacity=".46"/></linearGradient>
          <linearGradient id="thumb" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#62D6D8" stopOpacity=".80"/><stop offset="100%" stopColor="#62D6D8" stopOpacity=".44"/></linearGradient>
          <linearGradient id="rightIndex" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#FFB04D" stopOpacity=".82"/><stop offset="100%" stopColor="#FFB04D" stopOpacity=".46"/></linearGradient>
          <linearGradient id="rightMiddle" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#8EC5FF" stopOpacity=".82"/><stop offset="100%" stopColor="#8EC5FF" stopOpacity=".46"/></linearGradient>
          <linearGradient id="rightRing" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#C58BFF" stopOpacity=".82"/><stop offset="100%" stopColor="#C58BFF" stopOpacity=".46"/></linearGradient>
          <linearGradient id="rightPinky" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#FF7FB3" stopOpacity=".82"/><stop offset="100%" stopColor="#FF7FB3" stopOpacity=".46"/></linearGradient>
          
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#406080" floodOpacity="0.08"/>
          </filter>
        </defs>

        <style>
          {`
            .hand { filter: url(#softShadow); }
            .palm { fill: url(#skin); stroke: #F0A886; stroke-width: 1.5; opacity: 0.65; }
            .crease { fill: none; stroke: #DCA284; stroke-width: 1; opacity: 0.22; }
            .finger { stroke-width: 1.8; transition: all 0.18s ease-out; }
            .nail { fill: #fff; opacity: 0.32; stroke: #fff; stroke-width: 0.8; }
          `}
        </style>

        {/* LEFT HAND */}
        <g id="left-hand" className="hand" transform="translate(120,70)">
          <path className="palm" d="M145 255 C105 245 77 215 73 174 C70 135 91 101 125 90 C158 79 194 84 219 107 C245 131 258 164 260 205 C262 243 220 271 145 255 Z"/>
          <path className="crease" d="M126 194 C147 182 172 181 194 193"/>
          <path className="crease" d="M112 145 C145 157 189 154 216 136"/>

          {/* leftPinky */}
          <g
            id="left-pinky"
            data-finger="leftPinky"
            opacity={fingerTransformations.lp.opacity}
            style={{
              transform: `translate(${fingerTransformations.lp.dx}px, ${fingerTransformations.lp.dy}px) scale(${fingerTransformations.lp.scale})`,
              transformOrigin: '82px 42px',
              transition: 'transform 0.18s ease-out, opacity 0.18s',
            }}
          >
            <path
              className="finger"
              fill="url(#leftPinky)"
              stroke={fingerTransformations.lp.isActive ? '#3b82f6' : fingerTransformations.lp.isError ? '#ef4444' : '#FF6FAA'}
              strokeWidth={fingerTransformations.lp.isActive || fingerTransformations.lp.isError ? 2.5 : 1.8}
              d="M75 151 C59 152 49 143 50 127 L58 51 C60 29 75 17 90 21 C105 25 111 42 108 63 L97 136 C95 147 88 151 75 151 Z"
            />
            <ellipse className="nail" cx="82" cy="42" rx="15" ry="10" transform="rotate(-82 82 42)"/>
          </g>

          {/* leftRing */}
          <g
            id="left-ring"
            data-finger="leftRing"
            opacity={fingerTransformations.lr.opacity}
            style={{
              transform: `translate(${fingerTransformations.lr.dx}px, ${fingerTransformations.lr.dy}px) scale(${fingerTransformations.lr.scale})`,
              transformOrigin: '128px 21px',
              transition: 'transform 0.18s ease-out, opacity 0.18s',
            }}
          >
            <path
              className="finger"
              fill="url(#leftRing)"
              stroke={fingerTransformations.lr.isActive ? '#3b82f6' : fingerTransformations.lr.isError ? '#ef4444' : '#B779FF'}
              strokeWidth={fingerTransformations.lr.isActive || fingerTransformations.lr.isError ? 2.5 : 1.8}
              d="M113 128 C95 128 86 118 88 101 L100 25 C104 4 119 -8 135 -4 C151 0 158 17 155 39 L142 108 C139 122 128 129 113 128 Z"
            />
            <ellipse className="nail" cx="128" cy="21" rx="16" ry="10" transform="rotate(-80 128 21)"/>
          </g>

          {/* leftMiddle */}
          <g
            id="left-middle"
            data-finger="leftMiddle"
            opacity={fingerTransformations.lm.opacity}
            style={{
              transform: `translate(${fingerTransformations.lm.dx}px, ${fingerTransformations.lm.dy}px) scale(${fingerTransformations.lm.scale})`,
              transformOrigin: '175px 10px',
              transition: 'transform 0.18s ease-out, opacity 0.18s',
            }}
          >
            <path
              className="finger"
              fill="url(#leftMiddle)"
              stroke={fingerTransformations.lm.isActive ? '#3b82f6' : fingerTransformations.lm.isError ? '#ef4444' : '#79B9FF'}
              strokeWidth={fingerTransformations.lm.isActive || fingerTransformations.lm.isError ? 2.5 : 1.8}
              d="M154 125 C136 124 127 113 130 96 L146 14 C150 -9 167 -21 184 -15 C200 -10 205 8 200 31 L183 104 C180 119 169 126 154 125 Z"
            />
            <ellipse className="nail" cx="175" cy="10" rx="17" ry="10" transform="rotate(-77 175 10)"/>
          </g>

          {/* leftIndex */}
          <g
            id="left-index"
            data-finger="leftIndex"
            opacity={fingerTransformations.li.opacity}
            style={{
              transform: `translate(${fingerTransformations.li.dx}px, ${fingerTransformations.li.dy}px) scale(${fingerTransformations.li.scale})`,
              transformOrigin: '231px 38px',
              transition: 'transform 0.18s ease-out, opacity 0.18s',
            }}
          >
            <path
              className="finger"
              fill="url(#leftIndex)"
              stroke={fingerTransformations.li.isActive ? '#3b82f6' : fingerTransformations.li.isError ? '#ef4444' : '#4DC98F'}
              strokeWidth={fingerTransformations.li.isActive || fingerTransformations.li.isError ? 2.5 : 1.8}
              d="M199 137 C182 134 174 123 180 107 L202 38 C209 18 226 10 241 18 C256 26 258 44 249 63 L223 125 C219 135 211 140 199 137 Z"
            />
            <ellipse className="nail" cx="231" cy="38" rx="15" ry="9" transform="rotate(-67 231 38)"/>
          </g>

          {/* leftThumb */}
          <g
            id="left-thumb"
            data-finger="leftThumb"
            opacity={fingerTransformations.lt.opacity}
            style={{
              transform: `translate(${fingerTransformations.lt.dx}px, ${fingerTransformations.lt.dy}px) scale(${fingerTransformations.lt.scale})`,
              transformOrigin: '318px 221px',
              transition: 'transform 0.18s ease-out, opacity 0.18s',
            }}
          >
            <path
              className="finger"
              fill="url(#thumb)"
              stroke={fingerTransformations.lt.isActive ? '#3b82f6' : fingerTransformations.lt.isError ? '#ef4444' : '#42C2C6'}
              strokeWidth={fingerTransformations.lt.isActive || fingerTransformations.lt.isError ? 2.5 : 1.8}
              d="M240 182 C249 169 264 165 278 172 L333 200 C350 209 355 225 347 237 C339 250 321 252 305 243 L252 214 C238 206 233 193 240 182 Z"
            />
            <ellipse className="nail" cx="318" cy="221" rx="14" ry="9" transform="rotate(24 318 221)"/>
          </g>
        </g>

        {/* RIGHT HAND */}
        <g id="right-hand" className="hand" transform="translate(715,70)">
          <path className="palm" d="M255 255 C295 245 323 215 327 174 C330 135 309 101 275 90 C242 79 206 84 181 107 C155 131 142 164 140 205 C138 243 180 271 255 255 Z"/>
          <path className="crease" d="M274 194 C253 182 228 181 206 193"/>
          <path className="crease" d="M288 145 C255 157 211 154 184 136"/>

          {/* rightIndex */}
          <g
            id="right-index"
            data-finger="rightIndex"
            opacity={fingerTransformations.ri.opacity}
            style={{
              transform: `translate(${fingerTransformations.ri.dx}px, ${fingerTransformations.ri.dy}px) scale(${fingerTransformations.ri.scale})`,
              transformOrigin: '169px 38px',
              transition: 'transform 0.18s ease-out, opacity 0.18s',
            }}
          >
            <path
              className="finger"
              fill="url(#rightIndex)"
              stroke={fingerTransformations.ri.isActive ? '#3b82f6' : fingerTransformations.ri.isError ? '#ef4444' : '#F6A13D'}
              strokeWidth={fingerTransformations.ri.isActive || fingerTransformations.ri.isError ? 2.5 : 1.8}
              d="M201 137 C218 134 226 123 220 107 L198 38 C191 18 174 10 159 18 C144 26 142 44 151 63 L177 125 C181 135 189 140 201 137 Z"
            />
            <ellipse className="nail" cx="169" cy="38" rx="15" ry="9" transform="rotate(67 169 38)"/>
          </g>

          {/* rightMiddle */}
          <g
            id="right-middle"
            data-finger="rightMiddle"
            opacity={fingerTransformations.rm.opacity}
            style={{
              transform: `translate(${fingerTransformations.rm.dx}px, ${fingerTransformations.rm.dy}px) scale(${fingerTransformations.rm.scale})`,
              transformOrigin: '225px 10px',
              transition: 'transform 0.18s ease-out, opacity 0.18s',
            }}
          >
            <path
              className="finger"
              fill="url(#rightMiddle)"
              stroke={fingerTransformations.rm.isActive ? '#3b82f6' : fingerTransformations.rm.isError ? '#ef4444' : '#79B9FF'}
              strokeWidth={fingerTransformations.rm.isActive || fingerTransformations.rm.isError ? 2.5 : 1.8}
              d="M246 125 C264 124 273 113 270 96 L254 14 C250 -9 233 -21 216 -15 C200 -10 195 8 200 31 L217 104 C220 119 231 126 246 125 Z"
            />
            <ellipse className="nail" cx="225" cy="10" rx="17" ry="10" transform="rotate(77 225 10)"/>
          </g>

          {/* rightRing */}
          <g
            id="right-ring"
            data-finger="rightRing"
            opacity={fingerTransformations.rr.opacity}
            style={{
              transform: `translate(${fingerTransformations.rr.dx}px, ${fingerTransformations.rr.dy}px) scale(${fingerTransformations.rr.scale})`,
              transformOrigin: '272px 21px',
              transition: 'transform 0.18s ease-out, opacity 0.18s',
            }}
          >
            <path
              className="finger"
              fill="url(#rightRing)"
              stroke={fingerTransformations.rr.isActive ? '#3b82f6' : fingerTransformations.rr.isError ? '#ef4444' : '#B779FF'}
              strokeWidth={fingerTransformations.rr.isActive || fingerTransformations.rr.isError ? 2.5 : 1.8}
              d="M287 128 C305 128 314 118 312 101 L300 25 C296 4 281 -8 265 -4 C249 0 242 17 245 39 L258 108 C261 122 272 129 287 128 Z"
            />
            <ellipse className="nail" cx="272" cy="21" rx="16" ry="10" transform="rotate(80 272 21)"/>
          </g>

          {/* rightPinky */}
          <g
            id="right-pinky"
            data-finger="rightPinky"
            opacity={fingerTransformations.rp.opacity}
            style={{
              transform: `translate(${fingerTransformations.rp.dx}px, ${fingerTransformations.rp.dy}px) scale(${fingerTransformations.rp.scale})`,
              transformOrigin: '318px 42px',
              transition: 'transform 0.18s ease-out, opacity 0.18s',
            }}
          >
            <path
              className="finger"
              fill="url(#rightPinky)"
              stroke={fingerTransformations.rp.isActive ? '#3b82f6' : fingerTransformations.rp.isError ? '#ef4444' : '#FF6FAA'}
              strokeWidth={fingerTransformations.rp.isActive || fingerTransformations.rp.isError ? 2.5 : 1.8}
              d="M325 151 C341 152 351 143 350 127 L342 51 C340 29 325 17 310 21 C295 25 289 42 292 63 L303 136 C305 147 312 151 325 151 Z"
            />
            <ellipse className="nail" cx="318" cy="42" rx="15" ry="10" transform="rotate(82 318 42)"/>
          </g>

          {/* rightThumb */}
          <g
            id="right-thumb"
            data-finger="rightThumb"
            opacity={fingerTransformations.rt.opacity}
            style={{
              transform: `translate(${fingerTransformations.rt.dx}px, ${fingerTransformations.rt.dy}px) scale(${fingerTransformations.rt.scale})`,
              transformOrigin: '82px 221px',
              transition: 'transform 0.18s ease-out, opacity 0.18s',
            }}
          >
            <path
              className="finger"
              fill="url(#thumb)"
              stroke={fingerTransformations.rt.isActive ? '#3b82f6' : fingerTransformations.rt.isError ? '#ef4444' : '#42C2C6'}
              strokeWidth={fingerTransformations.rt.isActive || fingerTransformations.rt.isError ? 2.5 : 1.8}
              d="M160 182 C151 169 136 165 122 172 L67 200 C50 209 45 225 53 237 C61 250 79 252 95 243 L148 214 C162 206 167 193 160 182 Z"
            />
            <ellipse className="nail" cx="82" cy="221" rx="14" ry="9" transform="rotate(-24 82 221)"/>
          </g>
        </g>
      </svg>
    </div>
  );
};
export default HandOverlay;
