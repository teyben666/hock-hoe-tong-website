import React from 'react';
import { RefreshCw, X, Bell } from 'lucide-react';
import { formatSyncTime } from './useAdminSync';

interface AdminSyncControlsProps {
  lastSyncedAt: Date | null;
  syncing: boolean;
  onSyncNow: () => void;
}

/** 顶栏：退出按钮左侧 */
export const AdminSyncControls: React.FC<AdminSyncControlsProps> = ({
  lastSyncedAt,
  syncing,
  onSyncNow,
}) => (
  <div className="flex items-center gap-2 sm:gap-3 text-xs text-stone-500 max-w-[min(100%,14rem)] sm:max-w-none">
    <span className="truncate hidden sm:inline" title="每 45 秒自动同步">
      {syncing
        ? '同步中…'
        : lastSyncedAt
          ? `更新 ${formatSyncTime(lastSyncedAt)}`
          : '未同步'}
    </span>
    <button
      type="button"
      onClick={onSyncNow}
      disabled={syncing}
      title="每 45 秒自动同步"
      className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-[#DEEAF4]/50 text-[#10143A] disabled:opacity-50 shrink-0 whitespace-nowrap"
    >
      <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
      <span className="hidden sm:inline">立即同步</span>
    </button>
  </div>
);

interface AdminNewBookingAlertProps {
  count: number;
  onDismiss: () => void;
}

export const AdminNewBookingAlert: React.FC<AdminNewBookingAlertProps> = ({
  count,
  onDismiss,
}) => {
  if (count <= 0) return null;
  return (
    <div className="max-w-4xl mx-auto mt-3 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#FDD772]/90 text-stone-900 text-sm">
      <span className="flex items-center gap-2 font-medium">
        <Bell size={16} />
        有 {count} 条新预约（含官网）
      </span>
      <button
        type="button"
        onClick={onDismiss}
        className="p-1 rounded hover:bg-black/10"
        aria-label="知道了"
      >
        <X size={16} />
      </button>
    </div>
  );
};
