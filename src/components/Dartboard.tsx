import React, { useRef, useState } from 'react';
import { DartThrow } from '../types/darts';
import {
  BOARD_DIMENSIONS,
  BOARD_SEGMENTS,
  polarToCartesian,
  describeArc,
  getDartThrowFromCoords,
} from '../engine/darts-engine';

interface DartboardProps {
  onThrowDart?: (dart: DartThrow) => void;
  currentTurnDarts?: DartThrow[];
  highlightTarget?: string | null;
  historicalThrows?: DartThrow[];
  showHeatmap?: boolean;
  interactive?: boolean;
  className?: string;
}

export const Dartboard: React.FC<DartboardProps> = ({
  onThrowDart,
  currentTurnDarts = [],
  highlightTarget,
  historicalThrows = [],
  showHeatmap = false,
  interactive = true,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [lastClick, setLastClick] = useState<{ x: number; y: number } | null>(null);

  const viewBoxSize = 2 * BOARD_DIMENSIONS.BOARD_TOTAL_RADIUS + 10;
  const center = viewBoxSize / 2;

  const toSvgCoords = (x: number, y: number) => ({
    x: center + x,
    y: center + y,
  });

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive || !onThrowDart || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const scale = viewBoxSize / rect.width;
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const svgX = clientX * scale;
    const svgY = clientY * scale;

    const boardX = svgX - center;
    const boardY = svgY - center;

    const dart = getDartThrowFromCoords(boardX, boardY);
    setLastClick({ x: svgX, y: svgY });
    onThrowDart(dart);
  };

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {highlightTarget && (
        <div className="absolute top-2 z-20 px-3 py-1 bg-amber-500 text-zinc-950 text-xs font-black uppercase tracking-wider rounded-full shadow-lg border border-amber-300 animate-pulse">
          Aim: {highlightTarget}
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        className={`w-full max-w-[460px] h-auto drop-shadow-2xl transition-transform ${
          interactive ? 'cursor-crosshair active:scale-[0.99]' : ''
        }`}
        onClick={handleClick}
      >
        <defs>
          <radialGradient id="boardDepthGrad" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="#121316" />
            <stop offset="95%" stopColor="#0a0a0c" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>

          <filter id="wireGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodColor="#000" floodOpacity="0.8" />
          </filter>

          <filter id="targetPulse" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feColorMatrix type="matrix" values="1 0 0 0 1   0 1 0 0 0.8   0 0 1 0 0   0 0 0 2 0" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Catch Ring */}
        <circle
          cx={center}
          cy={center}
          r={BOARD_DIMENSIONS.BOARD_TOTAL_RADIUS}
          fill="url(#boardDepthGrad)"
          stroke="#33373B"
          strokeWidth="3"
        />

        {/* Double Wire Outer Boundary */}
        <circle
          cx={center}
          cy={center}
          r={BOARD_DIMENSIONS.DOUBLE_OUTER_RADIUS}
          fill="#16181B"
          stroke="#8E9297"
          strokeWidth="1.5"
        />

        {/* 20 Radial Sectors */}
        {BOARD_SEGMENTS.map((seg, idx) => {
          const startAngle = -90 + 18 * idx - 9;
          const endAngle = -90 + 18 * idx + 9;
          const isEven = idx % 2 === 0;

          const singleColor = isEven ? '#1E2022' : '#F4EAD4';
          const ringColor = isEven ? '#E51837' : '#00843D';

          const isTrebleAim = highlightTarget === `T${seg}`;
          const isDoubleAim = highlightTarget === `D${seg}`;
          const isSingleAim = highlightTarget === `S${seg}` || highlightTarget === `${seg}`;

          // Outer Single Wedge (between triple outer and double inner)
          const outerSinglePath = describeArc(
            center,
            center,
            BOARD_DIMENSIONS.TRIPLE_OUTER_RADIUS,
            BOARD_DIMENSIONS.DOUBLE_INNER_RADIUS,
            startAngle,
            endAngle
          );

          // Inner Single Wedge (between single bull and triple inner)
          const innerSinglePath = describeArc(
            center,
            center,
            BOARD_DIMENSIONS.SINGLE_BULL_RADIUS,
            BOARD_DIMENSIONS.TRIPLE_INNER_RADIUS,
            startAngle,
            endAngle
          );

          // Treble Ring Arc
          const treblePath = describeArc(
            center,
            center,
            BOARD_DIMENSIONS.TRIPLE_INNER_RADIUS,
            BOARD_DIMENSIONS.TRIPLE_OUTER_RADIUS,
            startAngle,
            endAngle
          );

          // Double Ring Arc
          const doublePath = describeArc(
            center,
            center,
            BOARD_DIMENSIONS.DOUBLE_INNER_RADIUS,
            BOARD_DIMENSIONS.DOUBLE_OUTER_RADIUS,
            startAngle,
            endAngle
          );

          const textPos = polarToCartesian(198, -90 + 18 * idx);

          return (
            <g key={`sector-${seg}`}>
              {/* Outer Single */}
              <path
                d={outerSinglePath}
                fill={singleColor}
                stroke="#6B7280"
                strokeWidth="0.8"
                className={`transition-colors duration-150 ${
                  isSingleAim ? 'fill-amber-400/80 animate-pulse' : ''
                } hover:opacity-90`}
              />

              {/* Inner Single */}
              <path
                d={innerSinglePath}
                fill={singleColor}
                stroke="#6B7280"
                strokeWidth="0.8"
                className={`transition-colors duration-150 ${
                  isSingleAim ? 'fill-amber-400/80 animate-pulse' : ''
                } hover:opacity-90`}
              />

              {/* Treble Ring Bed */}
              <path
                d={treblePath}
                fill={ringColor}
                stroke="#D1D5DB"
                strokeWidth="1.2"
                filter={isTrebleAim ? 'url(#targetPulse)' : undefined}
                className={`transition-all duration-200 ${
                  isTrebleAim ? 'fill-amber-400 stroke-amber-200 stroke-2 animate-pulse' : 'hover:brightness-125'
                }`}
              />

              {/* Double Ring Bed */}
              <path
                d={doublePath}
                fill={ringColor}
                stroke="#D1D5DB"
                strokeWidth="1.2"
                filter={isDoubleAim ? 'url(#targetPulse)' : undefined}
                className={`transition-all duration-200 ${
                  isDoubleAim ? 'fill-amber-400 stroke-amber-200 stroke-2 animate-pulse' : 'hover:brightness-125'
                }`}
              />

              {/* Wire Number */}
              <text
                x={Math.round((center + textPos.x) * 100) / 100}
                y={Math.round((center + textPos.y + 7) * 100) / 100}
                fill="#FAFAFA"
                fontSize="20"
                fontWeight="900"
                fontFamily="system-ui, -apple-system, sans-serif"
                textAnchor="middle"
                className="select-none pointer-events-none drop-shadow-md"
              >
                {seg}
              </text>
            </g>
          );
        })}

        {/* Outer Bull (Single Bull, 25) */}
        <circle
          cx={center}
          cy={center}
          r={BOARD_DIMENSIONS.SINGLE_BULL_RADIUS}
          fill="#00843D"
          stroke="#E5E7EB"
          strokeWidth="1.2"
          className={`transition-all duration-200 ${
            highlightTarget === 'BULL' || highlightTarget === '25'
              ? 'fill-amber-400 stroke-amber-200 stroke-2 animate-pulse'
              : 'hover:brightness-125'
          }`}
        />

        {/* Inner Bull (Double Bullseye, 50) */}
        <circle
          cx={center}
          cy={center}
          r={BOARD_DIMENSIONS.DOUBLE_BULL_RADIUS}
          fill="#E51837"
          stroke="#FFFFFF"
          strokeWidth="1.4"
          className={`transition-all duration-200 ${
            highlightTarget === 'D-BULL' || highlightTarget === '50'
              ? 'fill-amber-400 stroke-amber-200 stroke-2 animate-pulse'
              : 'hover:brightness-125'
          }`}
        />

        {/* Center Spider Hub Pin */}
        <circle cx={center} cy={center} r="1.5" fill="#D1D5DB" />

        {/* Heatmap overlay */}
        {showHeatmap && historicalThrows.length > 0 && (
          <g className="pointer-events-none opacity-75">
            {historicalThrows.map((d, i) => {
              if (d.x === undefined || d.y === undefined) return null;
              const pos = toSvgCoords(d.x, d.y);
              return (
                <circle
                  key={`heat-${i}`}
                  cx={pos.x}
                  cy={pos.y}
                  r="8"
                  fill="rgba(239, 68, 68, 0.45)"
                  filter="blur(3px)"
                />
              );
            })}
          </g>
        )}

        {/* Current Turn Darts in Hand Markers */}
        {currentTurnDarts.map((d, idx) => {
          if (d.x === undefined || d.y === undefined) return null;
          const pos = toSvgCoords(d.x, d.y);
          const dartColors = ['#EF4444', '#3B82F6', '#10B981'];
          const color = dartColors[idx % dartColors.length];

          return (
            <g key={`dart-${idx}`} className="pointer-events-none">
              {/* Drop Shadow */}
              <ellipse cx={pos.x + 3} cy={pos.y + 4} rx="6" ry="3" fill="rgba(0, 0, 0, 0.5)" />
              {/* Dart Tip */}
              <circle cx={pos.x} cy={pos.y} r="3" fill="#FFFFFF" stroke="#111827" strokeWidth="1" />
              {/* Dart Flag/Badge */}
              <g transform={`translate(${pos.x + 4}, ${pos.y - 14})`}>
                <rect
                  x="0"
                  y="0"
                  width="18"
                  height="14"
                  rx="3"
                  fill={color}
                  stroke="#FFFFFF"
                  strokeWidth="1"
                  className="drop-shadow-md"
                />
                <text x="9" y="10.5" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">
                  {idx + 1}
                </text>
              </g>
              {/* Dart Label */}
              <text
                x={pos.x}
                y={pos.y - 18}
                fill="#FFFFFF"
                fontSize="11"
                fontWeight="900"
                textAnchor="middle"
                className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
