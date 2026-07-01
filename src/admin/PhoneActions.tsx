import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface PhoneActionsProps {
  phone: string;
  className?: string;
}

export const PhoneActions: React.FC<PhoneActionsProps> = ({ phone, className = '' }) => {
  const [copied, setCopied] = useState(false);
  const tel = phone.replace(/[^\d+]/g, '') || phone;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <a
        href={`tel:${tel}`}
        className="font-mono text-sm text-[#10143A] hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {phone}
      </a>
      <button
        type="button"
        onClick={handleCopy}
        title={copied ? '已复制' : '复制号码'}
        className="p-1 rounded-md text-stone-400 hover:text-[#10143A] hover:bg-stone-100"
        aria-label="复制手机号"
      >
        {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
      </button>
    </span>
  );
};
