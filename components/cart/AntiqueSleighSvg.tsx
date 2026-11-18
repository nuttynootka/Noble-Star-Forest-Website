"use client";

import { motion, type MotionValue } from "framer-motion";

export function AntiqueSleighSvg({
  treeCount,
  wheelAngle,
  className = "",
}: {
  treeCount: number;
  wheelAngle: MotionValue<number>;
  className?: string;
}) {
  const cargoSlots = Math.min(3, treeCount);

  return (
    <svg
      viewBox="0 0 132 76"
      aria-hidden="true"
      className={`overflow-visible drop-shadow-[0_8px_12px_rgba(0,0,0,0.65)] ${className}`}
    >
      <defs>
        <linearGradient id="sleigh-brass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5e6bf" />
          <stop offset="42%" stopColor="#cfa75c" />
          <stop offset="78%" stopColor="#8f6b2c" />
          <stop offset="100%" stopColor="#e6cf98" />
        </linearGradient>
        <linearGradient id="sleigh-walnut" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#563421" />
          <stop offset="55%" stopColor="#351e13" />
          <stop offset="100%" stopColor="#21120b" />
        </linearGradient>
        <linearGradient id="sleigh-burgundy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8d0829" />
          <stop offset="60%" stopColor="#77001E" />
          <stop offset="100%" stopColor="#460011" />
        </linearGradient>
      </defs>

      {/* Miniature Noble Fir Cargo */}
      {cargoSlots >= 1 && (
        <g transform="translate(46, 12)">
          <path d="M16 0 L21 10 L17 9 L24 19 L19 18 L27 29 L5 29 L13 18 L8 19 L15 9 L11 10 Z" fill="#12673D" stroke="#e9d7b0" strokeWidth="0.6" />
        </g>
      )}
      {cargoSlots >= 2 && (
        <g transform="translate(28, 15) rotate(-8 14 20)">
          <path d="M14 0 L19 9 L15 8 L22 17 L17 16 L24 26 L4 26 L11 16 L6 17 L13 8 L9 9 Z" fill="#004323" stroke="#CADFE9" strokeWidth="0.55" />
        </g>
      )}
      {cargoSlots >= 3 && (
        <g transform="translate(62, 16) rotate(7 13 20)">
          <path d="M13 0 L18 9 L14 8 L21 17 L16 16 L23 26 L3 26 L10 16 L5 17 L12 8 L8 9 Z" fill="#187a49" stroke="#e9d7b0" strokeWidth="0.55" />
        </g>
      )}

      {/* Carved Burgundy & Walnut Carriage Body */}
      <path
        d="M22 25 C22 25 27 45 36 49 L92 49 C104 49 111 40 112 31 C112 27 107 26 104 29 C100 34 94 35 84 35 L58 35 C47 35 42 23 31 20 C25 18 22 21 22 25 Z"
        fill="url(#sleigh-burgundy)"
        stroke="url(#sleigh-brass)"
        strokeWidth="1.6"
      />
      {/* Walnut Trim & Inner Seat Rail */}
      <path
        d="M28 24 C38 25 44 37 58 37 L86 37 C94 37 101 36 105 32 L103 44 C99 47 93 48 87 48 L38 48 C32 45 28 33 28 24 Z"
        fill="url(#sleigh-walnut)"
        opacity="0.72"
      />
      <path d="M35 42 C52 44 76 44 96 41" fill="none" stroke="url(#sleigh-brass)" strokeWidth="1.1" strokeLinecap="round" opacity="0.85" />

      {/* Evergreen Bough & Brass Ornament Trim */}
      <path d="M25 28 Q33 26 38 33 Q32 34 25 28 Z" fill="#12673D" />
      <circle cx="31" cy="29" r="1.7" fill="#e9d7b0" />
      <circle cx="35" cy="31" r="1.4" fill="#FFFCF3" />

      {/* Undercarriage Struts */}
      <path d="M40 49 L35 61 M65 49 L65 61 M90 49 L94 61" stroke="url(#sleigh-brass)" strokeWidth="2.1" strokeLinecap="round" />

      {/* Aged Brass Runner Blade with Front Scroll Finial */}
      <path
        d="M16 61 L101 61 C115 61 124 53 124 44 C124 39 119 37 116 40 C114 42 115 46 118 46"
        fill="none"
        stroke="url(#sleigh-brass)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />

      {/* Articulated Carriage Wheels */}
      {[
        { cx: 41, cy: 56, r: 6.5 },
        { cx: 88, cy: 56, r: 6.5 },
      ].map((w) => (
        <motion.g
          key={w.cx}
          style={{
            rotate: wheelAngle,
            transformOrigin: `${w.cx}px ${w.cy}px`,
          }}
        >
          <circle cx={w.cx} cy={w.cy} r={w.r} fill="#161210" fillOpacity="0.55" stroke="url(#sleigh-brass)" strokeWidth="1.6" />
          <line x1={w.cx - w.r + 1} y1={w.cy} x2={w.cx + w.r - 1} y2={w.cy} stroke="url(#sleigh-brass)" strokeWidth="0.9" />
          <line x1={w.cx} y1={w.cy - w.r + 1} x2={w.cx} y2={w.cy + w.r - 1} stroke="url(#sleigh-brass)" strokeWidth="0.9" />
          <circle cx={w.cx} cy={w.cy} r="1.6" fill="#f5e6bf" />
        </motion.g>
      ))}
    </svg>
  );
}
