/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface BilingualLineProps {
  zh: string;
  en: string;
  className?: string;
  zhClassName?: string;
  enClassName?: string;
}

export const BilingualLine: React.FC<BilingualLineProps> = ({
  zh,
  en,
  className = '',
  zhClassName = '',
  enClassName = 'text-xs text-stone-500 mt-0.5',
}) => (
  <div className={className}>
    <span className={`block ${zhClassName}`}>{zh}</span>
    <span className={`block ${enClassName}`}>{en}</span>
  </div>
);
