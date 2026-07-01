/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 官方 Logo 图（/logo.png），不使用门店招牌裁剪
 */

import React from 'react';
import { DEFAULTS } from '../data';

interface LogoProps {
  size?: number;
  showText?: boolean;
  /** 顶栏窄屏：仅图标，xl 及以上再显示 HOCK HOE TONG / 福和堂 文字 */
  compact?: boolean;
  /** 顶栏：Logo 区域半透明玻璃底 */
  glass?: boolean;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  size = 48,
  showText = true,
  compact = false,
  glass = false,
  onClick,
}) => {
  return (
    <div
      className={`flex items-center gap-2.5 cursor-pointer select-none group shrink-0 ${
        glass
          ? 'rounded-2xl px-3 py-2 bg-white/40 backdrop-blur-md border border-white/60 shadow-sm'
          : ''
      }`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div
        className="relative flex-shrink-0 transition-transform duration-300 group-hover:scale-105 active:scale-95 overflow-hidden rounded-xl bg-black shadow-md ring-1 ring-[#FDD772]/50"
        style={{ width: size, height: size }}
      >
        <img
          src="/logo.png"
          alt={`${DEFAULTS.CLINIC_NAME} ${DEFAULTS.CLINIC_ENGLISH} Logo`}
          className="w-full h-full object-contain"
          width={size}
          height={size}
        />
      </div>

      {showText && (
        <div
          className={`flex flex-col items-start leading-tight min-w-0 ${
            compact ? 'hidden xl:flex' : 'hidden sm:flex'
          }`}
        >
          <span className="font-sans text-[9px] font-semibold tracking-[0.15em] text-stone-500 uppercase">
            {DEFAULTS.CLINIC_ENGLISH}
          </span>
          <span className="font-serif text-base font-bold text-[#10143A] tracking-widest">
            {DEFAULTS.CLINIC_NAME}
          </span>
          <span className="font-sans text-[9px] text-[#10143A]/65 tracking-wider">
            {DEFAULTS.ESTABLISHED_LABEL}
          </span>
        </div>
      )}
    </div>
  );
};
