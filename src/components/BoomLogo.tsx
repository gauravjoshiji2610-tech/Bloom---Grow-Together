import React from 'react';

interface BoomLogoProps {
  size?: number;
  className?: string;
}

export const BoomLogo: React.FC<BoomLogoProps> = ({ size = 36, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 transition-transform duration-300 hover:scale-105 ${className}`}
    >
      {/* Outer Titanium / Chrome Ring */}
      <circle cx="50" cy="50" r="48" fill="#080c14" stroke="#ffffff" strokeWidth="2.5" strokeOpacity="0.25" />
      
      {/* Subtle Blue Glow Ambient Ring */}
      <circle cx="50" cy="50" r="45" stroke="#00aaff" strokeWidth="1.5" strokeOpacity="0.6" />

      {/* Inner Metallic Bevel Base */}
      <circle cx="50" cy="50" r="40" fill="#0c121e" />

      {/* White Semi-Circular Accent Arc (Top-Right Quadrant & Edge) */}
      <path
        d="M 50 14 A 36 36 0 0 1 86 50 L 68 50 A 18 18 0 0 0 50 32 Z"
        fill="#ffffff"
      />

      {/* White Semi-Circular Accent Arc (Bottom-Left Quadrant) */}
      <path
        d="M 50 86 A 36 36 0 0 1 14 50 L 32 50 A 18 18 0 0 0 50 68 Z"
        fill="#ffffff"
      />

      {/* Signature BMW Electric Blue Quadrants */}
      <path
        d="M 50 14 A 36 36 0 0 0 14 50 L 32 50 A 18 18 0 0 1 50 32 Z"
        fill="#0066b1"
      />
      <path
        d="M 50 86 A 36 36 0 0 0 86 50 L 68 50 A 18 18 0 0 1 50 68 Z"
        fill="#0066b1"
      />

      {/* Electric Cyan Diagonal Division Blades */}
      <line x1="50" y1="12" x2="50" y2="88" stroke="#05070a" strokeWidth="3" />
      <line x1="12" y1="50" x2="88" y2="50" stroke="#05070a" strokeWidth="3" />

      {/* Central Precision Core Badge */}
      <circle cx="50" cy="50" r="14" fill="#05070a" stroke="#00aaff" strokeWidth="2" />
      <circle cx="50" cy="50" r="7" fill="#00aaff" />
      <circle cx="50" cy="50" r="3" fill="#ffffff" />
    </svg>
  );
};
