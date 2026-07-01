/**
 * 将 **粗体** 标记解析为 <strong>
 */

import React from 'react';

const BOLD_PATTERN = /(\*\*[^*]+\*\*)/g;

export function parseBoldMarkup(text: string): React.ReactNode[] {
  const parts = text.split(BOLD_PATTERN).filter((p) => p.length > 0);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-[#10143A]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}
