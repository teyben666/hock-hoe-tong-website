/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Reservation } from '../types';
import { DOCTORS, TREATMENTS, DEFAULTS, BOOKING_COPY } from '../data';
import { queryBookingsByPhone, cancelBooking, checkApiHealth } from '../api';
import { BilingualLine } from './BilingualLine';
import { Search, Trash2, AlertCircle, Phone } from 'lucide-react';

const Q = BOOKING_COPY.query;

export const BookingQuery: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [results, setResults] = useState<Reservation[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = phone.replace(/[\s-]/g, '');
    if (!clean) return;
    setLoading(true);
    try {
      const online = await checkApiHealth();
      if (online) {
        setResults(await queryBookingsByPhone(clean));
      } else {
        const stored: Reservation[] = JSON.parse(
          localStorage.getItem('hockhoe_bookings') || '[]'
        );
        setResults(stored.filter((r) => r.patientPhone.replace(/[\s-]/g, '') === clean));
      }
    } catch {
      setResults([]);
    } finally {
      setHasSearched(true);
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm(`${Q.cancelConfirmZh}\n${Q.cancelConfirmEn}`)) return;
    try {
      const online = await checkApiHealth();
      if (online) await cancelBooking(id);
      else {
        const stored: Reservation[] = JSON.parse(
          localStorage.getItem('hockhoe_bookings') || '[]'
        );
        localStorage.setItem(
          'hockhoe_bookings',
          JSON.stringify(stored.filter((r) => r.id !== id))
        );
      }
      setNotice(`${Q.cancelledZh} ${Q.cancelledEn}`);
      await handleSearch();
      setTimeout(() => setNotice(null), 6000);
    } catch {
      setNotice(`${Q.cancelFailZh} ${Q.cancelFailEn}`);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-4">
      <BilingualLine
        zh={Q.titleZh}
        en={Q.titleEn}
        zhClassName="font-serif font-bold text-[#10143A]"
        enClassName="text-xs text-stone-500 mt-0.5"
      />
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={`${Q.placeholderZh} / ${Q.placeholderEn}`}
          className="flex-1 rounded-xl border px-3 py-2.5 text-sm font-mono"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[#10143A] text-gold-on-dark px-4 rounded-xl font-medium text-sm hover:bg-[#1a2348] min-w-[4.5rem]"
        >
          {loading ? Q.searching : (
            <span className="flex flex-col leading-tight">
              <span>{Q.searchZh}</span>
              <span className="text-[9px] font-normal opacity-90">{Q.searchEn}</span>
            </span>
          )}
        </button>
      </form>

      {notice && (
        <p className="text-xs text-orange-800 bg-orange-50 p-3 rounded-lg flex gap-2">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{notice}</span>
        </p>
      )}

      {hasSearched &&
        (results.length ? (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {results.map((res) => (
              <div
                key={res.id}
                className="p-3 bg-[#F5F3EF] rounded-xl border text-sm relative"
              >
                <button
                  type="button"
                  onClick={() => handleCancel(res.id)}
                  className="absolute right-2 top-2 text-stone-400 hover:text-red-500"
                  title={`${Q.cancelTitleZh} / ${Q.cancelTitleEn}`}
                >
                  <Trash2 size={14} />
                </button>
                <p className="font-bold">
                  {res.patientName} · {res.date} {res.timeSlot}
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  {TREATMENTS.find((t) => t.id === res.treatmentId)?.name} /{' '}
                  {DOCTORS.find((d) => d.id === res.doctorId)?.name}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <BilingualLine
            zh={Q.notFoundZh}
            en={Q.notFoundEn}
            zhClassName="text-xs text-stone-400 text-center py-4"
            enClassName="text-[10px] text-stone-400 text-center mt-1"
          />
        ))}

      <a
        href={DEFAULTS.WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 text-sm text-[#10143A] font-medium pt-2 border-t"
      >
        <Phone size={14} className="shrink-0" />
        <span>
          {Q.callBookZh} {DEFAULTS.PHONE_NUMBER}
          <span className="block text-[10px] text-stone-500 font-normal mt-0.5">
            {Q.callBookEn} {DEFAULTS.PHONE_NUMBER}
          </span>
        </span>
      </a>
    </div>
  );
};
