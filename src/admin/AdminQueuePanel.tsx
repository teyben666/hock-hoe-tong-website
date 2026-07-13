/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  staffCallAppointment,
  staffCallById,
  staffCallNext,
  staffCallWalkIn,
  staffCheckIn,
  staffCreateWalkIn,
  staffFetchQueueBoard,
  staffRecallQueue,
  staffRequeue,
  staffSetQueueMode,
  staffSetQueuePriority,
  staffSetQueueStatus,
} from '../api/admin';
import { Gender, QueueBoard, QueueCallMode, QueueStatus } from '../types';
import { DEFAULTS } from '../data';
import { useTreatments } from '../hooks/useTreatments';
import {
  PatientIdentityFields,
  PatientIdentityValues,
  validatePatientIdentityClient,
} from '../components/PatientIdentityFields';
import { formatPatientIdentity } from '../utils/patientLabels';
import { Megaphone, UserPlus, Star, RefreshCw } from 'lucide-react';

const emptyWalkInIdentity: PatientIdentityValues = {
  patientName: '',
  patientPhone: '',
  gender: 'female',
  birthDate: '',
};

const MODE_LABELS: Record<QueueCallMode, string> = {
  standard: '标准（到点预约优先）',
  appointment: '预约优先',
  walkin: '现场优先',
};

const STATUS_LABEL: Record<QueueStatus, string> = {
  not_arrived: '未到',
  waiting: '等候',
  called: '已叫号',
  in_service: '就诊中',
  done: '完成',
  skipped: '过号',
};

const POLL_MS = 5000;

interface AdminQueuePanelProps {
  onMessage: (msg: string) => void;
}

export const AdminQueuePanel: React.FC<AdminQueuePanelProps> = ({ onMessage }) => {
  const { treatments } = useTreatments(true);
  const [board, setBoard] = useState<QueueBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<QueueCallMode>('standard');
  const [wiIdentity, setWiIdentity] = useState<PatientIdentityValues>(emptyWalkInIdentity);
  const [wiIdentityErrors, setWiIdentityErrors] = useState<
    Partial<Record<keyof PatientIdentityValues, string>>
  >({});
  const [wiTreatment, setWiTreatment] = useState('t2');

  const refresh = useCallback(async () => {
    try {
      const b = await staffFetchQueueBoard();
      setBoard(b);
      setMode(b.mode);
    } catch (e) {
      onMessage(e instanceof Error ? e.message : '加载叫号失败');
    } finally {
      setLoading(false);
    }
  }, [onMessage]);

  useEffect(() => {
    refresh();
    const t = setInterval(() => refresh(), POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleMode = (m: QueueCallMode) =>
    run(async () => {
      await staffSetQueueMode(m);
      onMessage(`叫号模式：${MODE_LABELS[m]}`);
    });

  const handleSkip = (id: string, code?: string) => {
    const label = code ? `确定过号 ${code}？` : '确定过号？';
    if (!window.confirm(`${label}\n患者可稍后在「过号」列表中「再次排队」。`)) return;
    run(async () => {
      await staffSetQueueStatus(id, 'skipped');
      onMessage(code ? `已过号 ${code}` : '已过号');
    });
  };

  if (loading && !board) {
    return <p className="text-center text-stone-500 py-12">加载叫号数据…</p>;
  }

  const current = board?.current;

  const inServiceOthers = (board?.allToday ?? [])
    .filter((b) => b.queueStatus === 'in_service' && b.id !== current?.id)
    .sort((a, b) =>
      (a.queueCode ?? '').localeCompare(b.queueCode ?? '', undefined, { numeric: true })
    );

  const renderRow = (
    row: {
      id: string;
      queueCode?: string;
      patientName?: string;
      gender?: Gender;
      birthDate?: string;
      timeSlot?: string | null;
      queueStatus: QueueStatus;
      queuePriority?: boolean;
    },
    actions: React.ReactNode
  ) => (
    <li
      key={row.id}
      className="flex flex-wrap items-center justify-between gap-2 py-2.5 border-b border-stone-100 last:border-0"
    >
      <div className="min-w-0">
        <span className="font-mono font-bold text-[#10143A] text-lg">{row.queueCode ?? '—'}</span>
        <span className="ml-2 text-sm text-stone-700">
          {row.patientName
            ? formatPatientIdentity(row.patientName, row.gender, row.birthDate)
            : '—'}
        </span>
        {row.timeSlot && (
          <span className="ml-2 text-xs font-mono text-stone-400">{row.timeSlot}</span>
        )}
        <span className="ml-2 text-xs text-stone-500">{STATUS_LABEL[row.queueStatus]}</span>
        {row.queuePriority && (
          <Star size={12} className="inline ml-1 text-[#FDD772] fill-[#FDD772]" />
        )}
      </div>
      <div className="flex flex-wrap gap-1">{actions}</div>
    </li>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-5 shadow-sm border space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif font-bold text-[#10143A] flex items-center gap-2">
            <Megaphone size={20} className="text-[#FDD772]" />
            今日叫号 · {board?.date}
          </h2>
          <button
            type="button"
            disabled={busy}
            onClick={() => refresh()}
            className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg border"
          >
            <RefreshCw size={14} className={busy ? 'animate-spin' : ''} />
            刷新
          </button>
        </div>

        <div className="rounded-xl bg-[#DEEAF4]/50 border border-[#10143A]/10 p-4 text-center">
          <p className="text-xs text-[#10143A]/60 mb-1">
            当前叫号（大屏同步）
            {current && (
              <span className="ml-2 text-[#10143A]/80">
                · {STATUS_LABEL[current.queueStatus]}
              </span>
            )}
          </p>
          <p className="font-mono text-4xl font-black text-[#FDD772] drop-shadow-sm">
            {current?.queueCode ?? '—'}
          </p>
          {current && (
            <>
              <p className="text-sm text-[#10143A] mt-1">{current.maskedName}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      const b = await staffRecallQueue(current.id);
                      onMessage(`已重叫 ${b.queueCode}`);
                    })
                  }
                  className="text-xs px-3 py-2 rounded-lg border border-[#10143A]/20 bg-white/60 text-[#10143A] font-semibold"
                >
                  重叫
                </button>
                {current.queueStatus === 'called' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        await staffSetQueueStatus(current.id, 'in_service');
                        onMessage(`${current.queueCode} 已进入就诊`);
                      })
                    }
                    className="text-xs px-3 py-2 rounded-lg border bg-[#FDD772]/40 text-[#10143A] font-semibold"
                  >
                    进诊
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await staffSetQueueStatus(current.id, 'done');
                      onMessage(`${current.queueCode} 已完成`);
                    })
                  }
                  className="text-xs px-3 py-2 rounded-lg border bg-white text-[#10143A] font-semibold"
                >
                  完成
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleSkip(current.id, current.queueCode)}
                  className="text-xs px-3 py-2 rounded-lg border border-amber-300 text-amber-900 font-semibold"
                >
                  过号
                </button>
              </div>
            </>
          )}
        </div>

        {inServiceOthers.length > 0 && (
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3">
            <p className="text-xs font-semibold text-amber-900 mb-2">
              其他就诊中（{inServiceOthers.length}）— 请点「完成」清台，避免挡住叫号
            </p>
            <ul className="space-y-1">
              {inServiceOthers.map((row) =>
                renderRow(row, (
                  <button
                    type="button"
                    disabled={busy}
                    className="text-xs px-2 py-1 rounded border bg-white font-medium text-[#10143A]"
                    onClick={() =>
                      run(async () => {
                        await staffSetQueueStatus(row.id, 'done');
                        onMessage(`${row.queueCode} 已完成`);
                      })
                    }
                  >
                    完成
                  </button>
                ))
              )}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {(['standard', 'appointment', 'walkin'] as const).map((m) => (
            <button
              key={m}
              type="button"
              disabled={busy}
              onClick={() => handleMode(m)}
              className={`text-xs px-3 py-2 rounded-lg border ${
                mode === m
                  ? 'bg-[#10143A] text-[#FDD772] border-[#10143A]'
                  : 'bg-stone-50 text-stone-600'
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(async () => {
                const r = await staffCallNext();
                onMessage(
                  r.booking
                    ? `已叫 ${r.booking.queueCode}`
                    : r.message ?? '暂无等候'
                );
              })
            }
            className="py-3 rounded-xl bg-[#10143A] text-[#FDD772] font-bold text-sm"
          >
            叫下一位
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(async () => {
                const r = await staffCallAppointment();
                onMessage(
                  r.booking
                    ? `已叫预约 ${r.booking.queueCode}`
                    : r.message ?? '暂无到点预约'
                );
              })
            }
            className="py-3 rounded-xl bg-[#FDD772] text-[#10143A] font-bold text-sm"
          >
            下一位预约
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(async () => {
                const r = await staffCallWalkIn();
                onMessage(
                  r.booking
                    ? `已叫现场 ${r.booking.queueCode}`
                    : r.message ?? '暂无现场等候'
                );
              })
            }
            className="py-3 rounded-xl bg-[#FBD7DE] text-[#10143A] font-bold text-sm"
          >
            下一位现场
          </button>
        </div>

        <p className="text-[11px] text-stone-400 text-center leading-relaxed">
          叫下一位时，其他「已叫号未进诊」将自动过号。
          <br />
          大屏：
          <a
            href="/queue-display"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#10143A] underline ml-1"
          >
            /queue-display
          </a>
        </p>
      </div>

      <form
        className="bg-white rounded-2xl p-5 shadow-sm border space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const clientErrors = validatePatientIdentityClient(wiIdentity);
          if (Object.keys(clientErrors).length > 0) {
            setWiIdentityErrors(clientErrors);
            return;
          }
          setWiIdentityErrors({});
          run(async () => {
            const b = await staffCreateWalkIn({
              patientName: wiIdentity.patientName.trim(),
              patientPhone: wiIdentity.patientPhone.replace(/[\s-]/g, ''),
              gender: wiIdentity.gender,
              birthDate: wiIdentity.birthDate,
              treatmentId: wiTreatment,
            });
            onMessage(`现场取号 ${b.queueCode}`);
            setWiIdentity(emptyWalkInIdentity);
          });
        }}
      >
        <h3 className="font-serif font-bold text-[#10143A] flex items-center gap-2">
          <UserPlus size={18} className="text-[#FDD772]" />
          现场 Walk-in 取号
        </h3>
        <PatientIdentityFields
          values={wiIdentity}
          onChange={(patch) => setWiIdentity((prev) => ({ ...prev, ...patch }))}
          errors={wiIdentityErrors}
        />
        <select
          value={wiTreatment}
          onChange={(e) => setWiTreatment(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        >
          {treatments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={busy}
          className="w-full py-2.5 rounded-xl bg-[#FBD7DE] text-[#10143A] font-semibold text-sm"
        >
          登记并取 W 号
        </button>
      </form>

      <div className="bg-white rounded-2xl p-5 shadow-sm border">
        <h3 className="font-serif font-bold text-stone-800 mb-2">
          已叫号（待进诊）· {board?.calledWaiting?.length ?? 0}
        </h3>
        <ul>
          {(board?.calledWaiting ?? []).length === 0 ? (
            <li className="text-sm text-stone-400 py-2">暂无</li>
          ) : (
            (board?.calledWaiting ?? []).map((row) =>
              renderRow(row, (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    className="text-xs px-2 py-1 rounded border bg-[#FDD772]/30 text-[#10143A] font-medium"
                    onClick={() =>
                      run(async () => {
                        const b = await staffRecallQueue(row.id);
                        onMessage(`已重叫 ${b.queueCode}`);
                      })
                    }
                  >
                    重叫
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className="text-xs px-2 py-1 rounded border"
                    onClick={() =>
                      run(async () => {
                        await staffSetQueueStatus(row.id, 'in_service');
                        onMessage('已进入就诊');
                      })
                    }
                  >
                    进诊
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className="text-xs px-2 py-1 rounded border border-amber-300 text-amber-800"
                    onClick={() => handleSkip(row.id, row.queueCode)}
                  >
                    过号
                  </button>
                </>
              ))
            )
          )}
        </ul>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border">
        <h3 className="font-serif font-bold text-stone-800 mb-2">
          预约等候（已到点）· {board?.waitingAppointment.length ?? 0}
        </h3>
        <ul>
          {(board?.waitingAppointment ?? []).map((row) =>
            renderRow(row, (
              <>
                <button
                  type="button"
                  disabled={busy}
                  className="text-xs px-2 py-1 rounded border"
                  onClick={() =>
                    run(async () => {
                      const b = await staffCallById(row.id);
                      onMessage(`已叫 ${b.queueCode}`);
                    })
                  }
                >
                  叫号
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="text-xs px-2 py-1 rounded border"
                  onClick={() =>
                    run(async () => {
                      await staffSetQueueStatus(row.id, 'in_service');
                      onMessage('已进入就诊');
                    })
                  }
                >
                  进诊
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="text-xs px-2 py-1 rounded border text-[#FDD772]"
                  onClick={() =>
                    run(async () => {
                      await staffSetQueuePriority(row.id);
                      onMessage('已设优先');
                    })
                  }
                >
                  优先
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="text-xs px-2 py-1 rounded border border-amber-300 text-amber-800"
                  onClick={() => handleSkip(row.id, row.queueCode)}
                >
                  过号
                </button>
              </>
            ))
          )}
        </ul>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border">
        <h3 className="font-serif font-bold text-stone-800 mb-2">
          现场等候 · {board?.waitingWalkIn.length ?? 0}
        </h3>
        <ul>
          {(board?.waitingWalkIn ?? []).map((row) =>
            renderRow(row, (
              <>
                <button
                  type="button"
                  disabled={busy}
                  className="text-xs px-2 py-1 rounded border"
                  onClick={() =>
                    run(async () => {
                      const b = await staffCallById(row.id);
                      onMessage(`已叫 ${b.queueCode}`);
                    })
                  }
                >
                  叫号
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="text-xs px-2 py-1 rounded border border-amber-300 text-amber-800"
                  onClick={() => handleSkip(row.id, row.queueCode)}
                >
                  过号
                </button>
              </>
            ))
          )}
        </ul>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border">
        <h3 className="font-serif font-bold text-stone-800 mb-2">
          过号 · {board?.skippedToday?.length ?? 0}
        </h3>
        <ul>
          {(board?.skippedToday ?? []).length === 0 ? (
            <li className="text-sm text-stone-400 py-2">暂无过号</li>
          ) : (
            (board?.skippedToday ?? []).map((row) =>
              renderRow(row, (
                <button
                  type="button"
                  disabled={busy}
                  className="text-xs px-2 py-1 rounded border bg-[#DEEAF4]/50 text-[#10143A] font-medium"
                  onClick={() =>
                    run(async () => {
                      const b = await staffRequeue(row.id);
                      onMessage(`已恢复排队 ${b.queueCode}`);
                    })
                  }
                >
                  再次排队
                </button>
              ))
            )
          )}
        </ul>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border">
        <h3 className="font-serif font-bold text-stone-800 mb-2">
          预约未到点 / 未签到 · {board?.upcomingAppointment.length ?? 0}
        </h3>
        <ul>
          {(board?.upcomingAppointment ?? []).map((row) =>
            renderRow(row, (
              <button
                type="button"
                disabled={busy}
                className="text-xs px-2 py-1 rounded border bg-[#DEEAF4]/50"
                onClick={() =>
                  run(async () => {
                    const b = await staffCheckIn(row.id);
                    onMessage(`已签到 ${b.queueCode}`);
                  })
                }
              >
                签到发 A 号
              </button>
            ))
          )}
        </ul>
        <p className="text-xs text-stone-400 mt-3">
          今日预约也可在「日程」格子里找到后到此签到。{DEFAULTS.CLINIC_NAME}
        </p>
      </div>
    </div>
  );
};
