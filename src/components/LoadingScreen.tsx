/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Logo } from './Logo';
import { DEFAULTS } from '../data';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [bloomClass, setBloomClass] = useState('scale-50 opacity-0');
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      onComplete();
      return;
    }

    const t1 = setTimeout(() => setBloomClass('scale-150 opacity-100 transition-all duration-[600ms] ease-out'), 50);
    const t2 = setTimeout(() => setFadeOut(true), 900);
    const t3 = setTimeout(() => onComplete(), 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background:
          'linear-gradient(168deg, #fdf6f8 0%, #fae8ef 50%, #deeaf4 100%)',
      }}
    >
      <div className="relative flex flex-col items-center">
        <div
          className={`absolute rounded-full w-44 h-44 bg-[#FBD7DE]/40 blur-2xl pointer-events-none ${bloomClass}`}
        />
        <Logo size={120} showText={false} />
        <p className="font-sans text-[10px] text-stone-500 mt-6 tracking-wider">
          {DEFAULTS.ESTABLISHED_LABEL}
        </p>
      </div>
    </div>
  );
};
