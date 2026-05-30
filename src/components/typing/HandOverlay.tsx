import React from 'react';
import { fingerMapping } from '../../data/fingerMapping';
import type { KeyboardGeometry } from './useKeyboardGeometry';
import type { FingerType } from '../../data/fingerMapping';

// Import SVG Assets directly as Vite static URLs
import leftHandSvg from '../../assets/left.svg';
import rightHandSvg from '../../assets/right.svg';

interface HandOverlayProps {
  geometry: KeyboardGeometry;
  targetChar: string;
  lastPressedKey: string | null;
  lastPressedCorrect: boolean | null;
}

// Finger-specific colors from mockup guide
const fingerColorsHex: Record<FingerType, string> = {
  lp: '#FF7BD5', // Pinky
  lr: '#C58DFF', // Ring
  lm: '#A6DBFF', // Middle
  li: '#8EE7B5', // Left Index
  lt: '#6EE7E0', // Left Thumb
  rt: '#6EE7E0', // Right Thumb
  ri: '#FFB455', // Right Index (Orange)
  rm: '#A6DBFF', // Right Middle
  rr: '#C58DFF', // Right Ring
  rp: '#FF7BD5', // Right Pinky
};

export const HandOverlay: React.FC<HandOverlayProps> = ({
  geometry,
  targetChar,
  lastPressedCorrect,
}) => {
  // Hide overlay if keyboard geometry hasn't been measured yet to avoid jumping
  if (Object.keys(geometry).length === 0) return null;

  // Resolve target mapping configuration
  const targetConfig = fingerMapping[targetChar] || null;
  const targetFinger = targetConfig ? targetConfig.finger : null;

  let activeFinger: FingerType | null = null;
  if (targetFinger) {
    activeFinger = targetFinger;
  }

  // Resolve typing state
  const isTypingError = lastPressedCorrect === false;

  // DYNAMIC DOCKING GEOMETRY MATH (A to F for Left Hand, J to ; for Right Hand)
  const rectA = geometry['a'];
  const rectF = geometry['f'];
  const rectJ = geometry['j'];
  const rectPinkyRight = geometry[';'];

  if (!rectA || !rectF || !rectJ || !rectPinkyRight) return null;

  // 1. Left Hand Positioning (Align Left Index tip at 1010, 110 and Left Pinky tip at 880, 160)
  // Distance in vector space = 1010 - 880 = 130 units
  const leftDistance = rectF.centerX - rectA.centerX;
  const scaleLeft = leftDistance / 130;
  const leftSvgWidth = 1536 * scaleLeft;
  const leftSvgHeight = 1024 * scaleLeft;
  // Offset top-left of Left Hand absolute container so Left Index (1010, 110) lands exactly on phím F
  const leftSvgLeft = rectF.centerX - 1010 * scaleLeft;
  const leftSvgTop = rectF.centerY - 110 * scaleLeft;

  // 2. Right Hand Positioning (Align Right Index tip at 520, 110 and Right Pinky tip at 650, 160)
  // Distance in vector space = 650 - 520 = 130 units
  const rightDistance = rectPinkyRight.centerX - rectJ.centerX;
  const scaleRight = rightDistance / 130;
  const rightSvgWidth = 1536 * scaleRight;
  const rightSvgHeight = 1024 * scaleRight;
  // Offset top-left of Right Hand absolute container so Right Index (520, 110) lands exactly on phím J
  const rightSvgLeft = rectJ.centerX - 520 * scaleRight;
  const rightSvgTop = rectJ.centerY - 110 * scaleRight;

  // Active hands highlights state
  const isLeftHandActive = activeFinger ? activeFinger.startsWith('l') : false;
  const isRightHandActive = activeFinger ? activeFinger.startsWith('r') : false;

  // Render glow indicator overlay directly over the active key center
  const renderActiveFingerIndicator = () => {
    if (!activeFinger) return null;

    let targetKeyId = 'a';
    if (activeFinger) {
      const config = fingerMapping[targetChar];
      targetKeyId = config ? config.key : targetChar.toLowerCase();
    }
    
    let destRect = geometry[targetKeyId.toLowerCase()];
    if (!destRect && targetKeyId === 'space') {
      destRect = geometry['space'];
    }

    if (!destRect) return null;

    let destX = destRect.centerX;
    let destY = destRect.centerY;

    // Adjust custom offsets for Spacebar Thumbs
    if (targetKeyId === 'space') {
      if (activeFinger === 'lt') {
        destX = destRect.x + destRect.width * 0.38;
      } else if (activeFinger === 'rt') {
        destX = destRect.x + destRect.width * 0.62;
      }
      destY = destRect.centerY - destRect.height * 0.15;
    }

    const activeColor = isTypingError ? '#ef4444' : fingerColorsHex[activeFinger];

    return (
      <div
        style={{
          position: 'absolute',
          left: `${destX}px`,
          top: `${destY}px`,
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          backgroundColor: `${activeColor}33`,
          border: `2.5px solid ${activeColor}`,
          boxShadow: `0 0 16px ${activeColor}, inset 0 0 8px ${activeColor}`,
          transform: 'translate(-50%, -50%) scale(1)',
          pointerEvents: 'none',
          zIndex: 30,
        }}
        className="animate-pulse"
      />
    );
  };

  return (
    <>
      <style>
        {`
          @keyframes float-hand {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-3px); }
            100% { transform: translateY(0px); }
          }
          .floating-hand-left {
            animation: float-hand 4s ease-in-out infinite;
          }
          .floating-hand-right {
            animation: float-hand 4s ease-in-out infinite 2s;
          }
        `}
      </style>

      {/* 1. LEFT HAND SVG ASSET */}
      <div
        style={{
          position: 'absolute',
          left: `${leftSvgLeft}px`,
          top: `${leftSvgTop}px`,
          width: `${leftSvgWidth}px`,
          height: `${leftSvgHeight}px`,
          pointerEvents: 'none',
          zIndex: 25,
          opacity: isLeftHandActive ? 0.92 : 0.45,
          filter: isLeftHandActive ? 'drop-shadow(0 15px 20px rgba(0,0,0,0.18))' : 'grayscale(15%)',
          transition: 'opacity 0.25s ease, filter 0.25s ease',
        }}
        className={`pointer-events-none select-none ${isLeftHandActive ? 'floating-hand-left' : ''}`}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="820 50 350 480"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          <image
            href={leftHandSvg}
            width="1536"
            height="1024"
            x="0"
            y="0"
          />
        </svg>
      </div>

      {/* 2. RIGHT HAND SVG ASSET */}
      <div
        style={{
          position: 'absolute',
          left: `${rightSvgLeft}px`,
          top: `${rightSvgTop}px`,
          width: `${rightSvgWidth}px`,
          height: `${rightSvgHeight}px`,
          pointerEvents: 'none',
          zIndex: 25,
          opacity: isRightHandActive ? 0.92 : 0.45,
          filter: isRightHandActive ? 'drop-shadow(0 15px 20px rgba(0,0,0,0.18))' : 'grayscale(15%)',
          transition: 'opacity 0.25s ease, filter 0.25s ease',
        }}
        className={`pointer-events-none select-none ${isRightHandActive ? 'floating-hand-right' : ''}`}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="360 50 350 480"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          <image
            href={rightHandSvg}
            width="1536"
            height="1024"
            x="0"
            y="0"
          />
        </svg>
      </div>

      {/* 3. DYNAMIC ACTIVE FINGER NEON GLOW INDICATOR OVERLAY */}
      {renderActiveFingerIndicator()}
    </>
  );
};

export default HandOverlay;
