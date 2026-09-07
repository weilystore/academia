import React from 'react';

interface MillenniumLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'image' | 'vector';
  showText?: boolean;
}

export const MillenniumLogo: React.FC<MillenniumLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'image',
  showText = false,
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-20 h-20',
  };

  const containerSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {variant === 'image' ? (
        <div className={`${containerSize} rounded-xl bg-white p-0.5 shadow-xs border border-slate-200/80 flex items-center justify-center overflow-hidden shrink-0`}>
          <img
            src="/millennium-academy-logo.jpg"
            alt="Millennium Academy"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        /* Vector SVG Shield & Laurel Wreath Logo */
        <div className={`${containerSize} relative flex items-center justify-center shrink-0`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Laurel Wreath Left (Green) */}
            <g fill="#2ebd68" opacity="0.95">
              <path d="M22 68 C16 60, 12 50, 13 38 C14 36, 17 38, 17 41 C16 48, 19 56, 25 63 Z" />
              <ellipse cx="14" cy="36" rx="4" ry="7" transform="rotate(-28 14 36)" />
              <ellipse cx="12" cy="46" rx="4" ry="7" transform="rotate(-15 12 46)" />
              <ellipse cx="13" cy="56" rx="4.2" ry="7" transform="rotate(5 13 56)" />
              <ellipse cx="18" cy="65" rx="4.5" ry="7" transform="rotate(25 18 65)" />
              <ellipse cx="25" cy="73" rx="4.5" ry="7" transform="rotate(45 25 73)" />
              <ellipse cx="35" cy="78" rx="4.5" ry="6.5" transform="rotate(65 35 78)" />
            </g>

            {/* Laurel Wreath Right (Green) */}
            <g fill="#2ebd68" opacity="0.95">
              <path d="M78 68 C84 60, 88 50, 87 38 C86 36, 83 38, 83 41 C84 48, 81 56, 75 63 Z" />
              <ellipse cx="86" cy="36" rx="4" ry="7" transform="rotate(28 86 36)" />
              <ellipse cx="88" cy="46" rx="4" ry="7" transform="rotate(15 88 46)" />
              <ellipse cx="87" cy="56" rx="4.2" ry="7" transform="rotate(-5 87 56)" />
              <ellipse cx="82" cy="65" rx="4.5" ry="7" transform="rotate(-25 82 65)" />
              <ellipse cx="75" cy="73" rx="4.5" ry="7" transform="rotate(-45 75 73)" />
              <ellipse cx="65" cy="78" rx="4.5" ry="6.5" transform="rotate(-65 65 78)" />
            </g>

            {/* Shield Body Outline (Royal Blue) */}
            <path
              d="M24 18 H76 C76 18, 76 52, 50 74 C24 52, 24 18, 24 18 Z"
              fill="white"
              stroke="#174492"
              strokeWidth="5"
              strokeLinejoin="round"
            />

            {/* Graduation Cap Inside Shield */}
            {/* Top Diamond Rhombus */}
            <polygon
              points="50,28 70,38 50,48 30,38"
              fill="#174492"
              stroke="white"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Cap Base / Neck */}
            <path
              d="M38 43 L38 53 C38 53, 44 56, 50 56 C56 56, 62 53, 62 53 L62 43 Z"
              fill="#174492"
            />
            {/* Tassel */}
            <path
              d="M36 39 L33 46 L31 46"
              stroke="#174492"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="31" cy="47" r="1.5" fill="#174492" />
          </svg>
        </div>
      )}

      {showText && (
        <div className="min-w-0">
          <span className="font-extrabold tracking-wide text-sm uppercase block truncate text-slate-900 leading-tight">
            Millennium Academy
          </span>
          <span className="text-[10px] text-emerald-600 font-bold tracking-widest uppercase block">
            Gestión Académica
          </span>
        </div>
      )}
    </div>
  );
};
