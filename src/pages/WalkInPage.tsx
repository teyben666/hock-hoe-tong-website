/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { fetchQueueStatusByPhone, submitPublicWalkIn } from '../api';
import { QueuePhoneStatus, QueueStatusEntry } from '../types';
import { DEFAULTS, QUEUE_WALKIN_COPY } from '../data';
import {
  PatientIdentityFields,
  PatientIdentityValues,
  validatePatientIdentityClient,
} from '../components/PatientIdentityFields';
import { BilingualLine } from '../components/BilingualLine';
import { ListOrdered, UserPlus, ArrowLeft } from 'lucide-react';

type Tab = 'check' | 'register';

const W = QUEUE_WALKIN_COPY.walkIn;
const S = QUEUE_WALKIN_COPY.status;
const H = QUEUE_WALKIN_COPY.hints;

function statusHint(ent: QueueStatusEntry): { zh: string; en: string } | null {
  if (ent.queueStatus === 'waiting' && ent.ahead !== null) {
    if (!ent.callable) return { zh: H.notCallableZh, en: H.notCallableEn };
    if (ent.ahead === 0) return { zh: H.nextUpZh, en: H.nextUpEn };
    return { zh: H.aheadZh(ent.ahead), en: H.aheadEn(ent.ahead) };
  }
  return null;
}

function NumberCard({ ent }: { ent: QueueStatusEntry }) {
  const hint = statusHint(ent);
  const status = S[ent.queueStatus as keyof typeof S];
  const isWalkIn = ent.source === 'walk_in';

  return (
    <div className="rounded-2xl bg-[#DEEAF4]/60 border border-[#10143A]/10 px-6 py-5 text-center">
      <p className="font-mono font-black text-gold text-5xl sm:text-6xl drop-shadow-sm">
        {ent.queueCode ?? '—'}
      </p>
      <p className="text-sm text-[#10143A]/70 mt-2">
        {isWalkIn ? W.sourceWalkInZh : W.sourceApptZh}
        {ent.timeSlot ? ` · ${ent.timeSlot}` : ''}
      </p>
      <p className="text-xs text-[#10143A]/45 mt-0.5">
        {isWalkIn ? W.sourceWalkInEn : W.sourceApptEn}
        {ent.timeSlot ? ` · ${ent.timeSlot}` : ''}
      </p>
      {status && (
        <div className="mt-2">
          <BilingualLine
            zh={status.zh}
            en={status.en}
            zhClassName="text-base font-medium text-[#10143A]"
            enClassName="text-xs text-[#10143A]/50 mt-0.5"
          />
        </div>
      )}
      {hint && (
        <BilingualLine
          zh={hint.zh}
          en={hint.en}
          className="mt-2"
          zhClassName="text-sm text-[#10143A]/60"
          enClassName="text-xs text-[#10143A]/45 mt-0.5"
        />
      )}
    </div>
  );
}

const emptyIdentity: PatientIdentityValues = {
  patientName: '',
  patientPhone: '',
  gender: 'female',
  birthDate: '',
};

export const WalkInPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('check');
  const [phone, setPhone] = useState('');
  const [checkResult, setCheckResult] = useState<QueuePhoneStatus | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const [identity, setIdentity] = useState<PatientIdentityValues>(emptyIdentity);
  const [identityErrors, setIdentityErrors] = useState<
    Partial<Record<keyof PatientIdentityValues, string>>
  >({});
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  const patchIdentity = (patch: Partial<PatientIdentityValues>) => {
    setIdentity((prev) => ({ ...prev, ...patch }));
  };

  const runCheck = async (phoneValue: string) => {
    const normalized = phoneValue.replace(/[\s-]/g, '');
    if (normalized.length < 8) {
      setCheckError(`${W.invalidPhoneZh} / ${W.invalidPhoneEn}`);
      return;
    }
    setCheckLoading(true);
    setCheckError(null);
    setCheckResult(null);
    try {
      const data = await fetchQueueStatusByPhone(normalized);
      setCheckResult(data);
      setPhone(normalized);
    } catch (e) {
      const msg = e instanceof Error ? e.message : W.queryFailedZh;
      setCheckError(`${msg} / ${W.queryFailedEn}`);
    } finally {
      setCheckLoading(false);
    }
  };

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    runCheck(phone);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const clientErrors = validatePatientIdentityClient(identity, { bilingual: true });
    if (Object.keys(clientErrors).length > 0) {
      setIdentityErrors(clientErrors);
      return;
    }
    setIdentityErrors({});
    setRegLoading(true);
    setRegError(null);
    setSuccessCode(null);
    try {
      const { queueCode } = await submitPublicWalkIn({
        patientName: identity.patientName.trim(),
        patientPhone: identity.patientPhone.replace(/[\s-]/g, ''),
        gender: identity.gender,
        birthDate: identity.birthDate,
      });
      setSuccessCode(queueCode);
      const normalized = identity.patientPhone.replace(/[\s-]/g, '');
      setPhone(normalized);
      setTab('check');
      await runCheck(normalized);
    } catch (e) {
      const msg = e instanceof Error ? e.message : W.registerFailedZh;
      setRegError(`${msg} / ${W.registerFailedEn}`);
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <header className="bg-[#DEEAF4] border-b border-[#10143A]/10 px-4 py-4">
        <a
          href="/"
          className="inline-flex items-center gap-1 text-xs text-[#10143A]/60 mb-2"
        >
          <ArrowLeft size={14} />
          <span>
            {W.backZh}
            <span className="text-[#10143A]/40 mx-1">·</span>
            {W.backEn}
          </span>
        </a>
        <p className="text-xs text-[#10143A]/60 tracking-widest">{DEFAULTS.CLINIC_ENGLISH}</p>
        <h1 className="font-serif text-xl font-bold text-[#10143A]">{DEFAULTS.CLINIC_NAME}</h1>
        <BilingualLine
          zh={W.subtitleZh}
          en={W.subtitleEn}
          className="mt-0.5"
          zhClassName="text-sm text-[#10143A]/70"
          enClassName="text-xs text-[#10143A]/45 mt-0.5"
        />
      </header>

      <div className="flex border-b border-[#10143A]/10 bg-white">
        <button
          type="button"
          onClick={() => setTab('check')}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-3 border-b-2 transition-colors min-h-[52px] ${
            tab === 'check'
              ? 'border-[#FDD772] text-[#10143A] bg-[#DEEAF4]/30'
              : 'border-transparent text-[#10143A]/50'
          }`}
        >
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            <ListOrdered size={18} />
            {W.tabCheckZh}
          </span>
          <span className="text-[10px] font-normal opacity-70">{W.tabCheckEn}</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('register')}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-3 border-b-2 transition-colors min-h-[52px] ${
            tab === 'register'
              ? 'border-[#FDD772] text-[#10143A] bg-[#DEEAF4]/30'
              : 'border-transparent text-[#10143A]/50'
          }`}
        >
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            <UserPlus size={18} />
            {W.tabRegisterZh}
          </span>
          <span className="text-[10px] font-normal opacity-70">{W.tabRegisterEn}</span>
        </button>
      </div>

      <main className="flex-1 max-w-md w-full mx-auto p-4 space-y-4">
        {tab === 'check' && (
          <>
            <form onSubmit={handleCheck} className="space-y-3">
              <BilingualLine
                zh={W.phoneLabelZh}
                en={W.phoneLabelEn}
                zhClassName="text-sm font-medium text-[#10143A]"
                enClassName="text-xs text-[#10143A]/50 mt-0.5"
              />
              <div className="flex gap-2">
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={`${W.phonePlaceholderZh} / ${W.phonePlaceholderEn}`}
                  className="flex-1 border border-[#10143A]/15 rounded-xl px-4 py-3 text-base font-mono bg-white"
                />
                <button
                  type="submit"
                  disabled={checkLoading}
                  className="px-4 py-3 rounded-xl bg-[#10143A] text-gold-on-dark font-semibold shrink-0 min-h-[48px] flex flex-col items-center justify-center leading-tight"
                >
                  <span>{checkLoading ? W.searchingZh : W.searchZh}</span>
                  <span className="text-[10px] font-normal opacity-80">
                    {checkLoading ? W.searchingEn : W.searchEn}
                  </span>
                </button>
              </div>
            </form>

            {checkError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{checkError}</p>
            )}

            {checkResult && !checkResult.found && (
              <div className="rounded-xl bg-white border border-[#10143A]/10 p-4 text-center">
                <BilingualLine
                  zh={W.notFoundZh}
                  en={W.notFoundEn}
                  zhClassName="text-sm text-[#10143A]/70"
                  enClassName="text-xs text-[#10143A]/50 mt-1"
                />
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  className="mt-3 text-[#10143A] font-semibold text-sm"
                >
                  {W.goRegisterZh}
                  <span className="block text-xs font-normal text-[#10143A]/50 mt-0.5">
                    {W.goRegisterEn}
                  </span>
                </button>
              </div>
            )}

            {checkResult?.found && checkResult.entries && (
              <div className="space-y-3">
                {checkResult.entries.map((ent) => (
                  <div key={ent.id}>
                    <NumberCard ent={ent} />
                  </div>
                ))}
              </div>
            )}

            <BilingualLine
              zh={W.footerHintZh}
              en={W.footerHintEn}
              className="text-center"
              zhClassName="text-xs text-[#10143A]/45"
              enClassName="text-[11px] text-[#10143A]/35 mt-1"
            />
          </>
        )}

        {tab === 'register' && (
          <>
            {successCode ? (
              <div className="space-y-4 text-center py-4">
                <BilingualLine
                  zh={W.successZh}
                  en={W.successEn}
                  zhClassName="text-sm text-[#10143A]/70"
                  enClassName="text-xs text-[#10143A]/50 mt-0.5"
                />
                <p className="font-mono font-black text-gold text-6xl drop-shadow-sm">
                  {successCode}
                </p>
                <BilingualLine
                  zh={W.successBodyZh}
                  en={W.successBodyEn}
                  className="px-2"
                  zhClassName="text-sm text-[#10143A] leading-relaxed"
                  enClassName="text-xs text-[#10143A]/55 mt-2 leading-relaxed"
                />
                <button
                  type="button"
                  onClick={() => {
                    setTab('check');
                    runCheck(identity.patientPhone);
                  }}
                  className="w-full py-3 rounded-xl bg-[#FBD7DE] text-[#10143A] font-semibold flex flex-col items-center"
                >
                  <span>{W.checkMyNumberZh}</span>
                  <span className="text-xs font-normal opacity-75">{W.checkMyNumberEn}</span>
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleRegister}
                className="space-y-4 bg-white rounded-2xl border border-[#10143A]/10 p-5"
              >
                <BilingualLine
                  zh={W.registerNoteZh}
                  en={W.registerNoteEn}
                  zhClassName="text-xs text-[#10143A]/60 leading-relaxed"
                  enClassName="text-[11px] text-[#10143A]/45 mt-1.5 leading-relaxed"
                />
                <PatientIdentityFields
                  values={identity}
                  onChange={patchIdentity}
                  errors={identityErrors}
                  compact
                  bilingual
                />
                {regError && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{regError}</p>
                )}
                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-3.5 rounded-xl bg-[#FBD7DE] hover:bg-[#f5c0c8] text-[#10143A] font-bold min-h-[48px] flex flex-col items-center justify-center"
                >
                  <span>{regLoading ? W.submittingZh : W.submitZh}</span>
                  <span className="text-xs font-normal opacity-80">
                    {regLoading ? W.submittingEn : W.submitEn}
                  </span>
                </button>
              </form>
            )}
          </>
        )}
      </main>

      <footer className="text-center text-[11px] text-[#10143A]/40 py-4 px-4 space-y-0.5">
        <p>
          {DEFAULTS.CLINIC_NAME} · {W.footerScreenZh}
        </p>
        <p className="text-[#10143A]/30">
          {DEFAULTS.CLINIC_ENGLISH} · {W.footerScreenEn}
        </p>
      </footer>
    </div>
  );
};
