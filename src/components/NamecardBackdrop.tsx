/**
 * 背景层 — 首屏：国风山水 + 自上而下渐增 alpha；医师区：浅蓝 + Logo
 */

import React from 'react';

type Variant = 'clinic' | 'doctor';

interface NamecardBackdropProps {
  variant: Variant;
  className?: string;
  children?: React.ReactNode;
}

const LOGO_BG: Record<Variant, string> = {
  clinic: '#deeaf4',
  doctor: '#deeaf4',
};

/** 首屏：由上到下白色 alpha 渐强（约 5% → 7% → 9%），无 backdrop-blur */
const CLINIC_ALPHA_GRADIENT =
  'linear-gradient(180deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.50) 50%, rgba(255,255,255,0.70) 85%, rgba(250,248,245,0.95) 100%)';

export const NamecardBackdrop: React.FC<NamecardBackdropProps> = ({
  variant,
  className = '',
  children,
}) => {
  const color = LOGO_BG[variant];
  const isClinic = variant === 'clinic';

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{ backgroundColor: color }}
      />

      {isClinic ? (
        <>
          <img
            src="/hero-landscape.png"
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden
            style={{ background: CLINIC_ALPHA_GRADIENT }}
          />
        </>
      ) : (
        <img
          src="/logo.png"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none opacity-[0.14]"
        />
      )}

      {children ? <div className="relative z-10">{children}</div> : null}
    </div>
  );
};
