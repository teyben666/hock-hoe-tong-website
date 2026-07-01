/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  DOCTORS,
  TREATMENTS,
  DEFAULTS,
  BOOKING_DAYS_AHEAD,
  DEFAULT_DOCTOR_ID,
  BOOKING_COPY,
} from '../data';
import { BilingualLine } from './BilingualLine';
import { generateConsultTimeSlots } from '../utils/consultSlots';
import { Reservation, Gender, SlotAvailability } from '../types';
import { createBooking, fetchSlotsRange, checkApiHealth } from '../api';
import {
  filterVisibleSlots,
  getClinicToday,
  getClinicDatesAhead,
  pickDefaultBookingDate,
  dayHasBookableSlot,
  isSlotPast,
} from '../utils/clinicTime';
import { getDayLabelBilingual } from '../utils/bookingLabels';
import {
  Phone,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Heart,
  Loader2,
} from 'lucide-react';

interface BookingFormProps {
  selectedDoctorId?: string;
  selectedTreatmentId?: string;
  onBookingSuccess: (reservation: Reservation) => void;
  onSelectDoctor: (id: string) => void;
  onSelectTreatment: (id: string) => void;
}

const UI = BOOKING_COPY.ui;
const F = BOOKING_COPY.form;

export const BookingForm: React.FC<BookingFormProps> = ({
  selectedDoctorId = '',
  selectedTreatmentId = '',
  onBookingSuccess,
  onSelectDoctor,
  onSelectTreatment,
}) => {
  const [availability, setAvailability] = useState<SlotAvailability[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiOnline, setApiOnline] = useState(true);
  const [flashTitle, setFlashTitle] = useState(false);

  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [gender, setGender] = useState<Gender>('female');
  const [birthDate, setBirthDate] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [todayEndedHint, setTodayEndedHint] = useState<string | null>(null);

  const formRef = useRef<HTMLDivElement>(null);
  const POLL_MS = 45_000;
  const contactHref = DEFAULTS.WHATSAPP_URL;

  const buildLocalFallback = useCallback((): SlotAvailability[] => {
    const allSlots: SlotAvailability['slots'] = generateConsultTimeSlots().map(
      (time) => ({ time, booked: false })
    );
    return getClinicDatesAhead(BOOKING_DAYS_AHEAD).map((date) => ({
      date,
      slots: filterVisibleSlots(date, allSlots),
    }));
  }, []);

  const applyDefaultDate = useCallback((days: SlotAvailability[]) => {
    setSelectedDate((prev) => {
      const current = days.find((d) => d.date === prev);
      if (current && dayHasBookableSlot(current)) return prev;
      return pickDefaultBookingDate(days);
    });
  }, []);

  const loadSlots = useCallback(async () => {
    try {
      const days = await fetchSlotsRange(BOOKING_DAYS_AHEAD);
      setAvailability(days);
      applyDefaultDate(days);
      setApiOnline(true);
    } catch {
      setApiOnline(false);
      const fallback = buildLocalFallback();
      setAvailability(fallback);
      applyDefaultDate(fallback);
    }
  }, [applyDefaultDate, buildLocalFallback]);

  useEffect(() => {
    onSelectDoctor(DEFAULT_DOCTOR_ID);
    checkApiHealth().then(setApiOnline);
    loadSlots();
  }, [loadSlots]);

  useEffect(() => {
    if (!apiOnline) return;
    const id = window.setInterval(() => loadSlots(), POLL_MS);
    return () => clearInterval(id);
  }, [apiOnline, loadSlots]);

  const currentDay = availability.find((d) => d.date === selectedDate);
  const daySlots = currentDay?.slots ?? [];
  const visibleDaySlots = useMemo(
    () => filterVisibleSlots(selectedDate, daySlots),
    [selectedDate, daySlots]
  );

  const dayClosed = currentDay?.closed ?? false;
  const clinicToday = getClinicToday();
  const todayNoMoreBookable = useMemo(() => {
    if (!currentDay || dayClosed || selectedDate !== clinicToday) return false;
    return !dayHasBookableSlot(currentDay);
  }, [currentDay, dayClosed, selectedDate, clinicToday]);

  useEffect(() => {
    if (!todayNoMoreBookable || availability.length === 0) {
      if (selectedDate !== clinicToday) setTodayEndedHint(null);
      return;
    }
    const tomorrow = availability.find(
      (d) => d.date > clinicToday && dayHasBookableSlot(d)
    );
    setTodayEndedHint(`${UI.todayEndedZh} ${UI.todayEndedEn}`);
    if (tomorrow && selectedDate === clinicToday) {
      setSelectedDate(tomorrow.date);
      setSelectedSlot('');
      setFormOpen(false);
    }
  }, [todayNoMoreBookable, availability, clinicToday, selectedDate]);

  const handleSlotClick = (time: string, slot: { booked: boolean; closed?: boolean }) => {
    if (dayClosed || slot.closed || slot.booked || isSlotPast(selectedDate, time)) return;
    setSelectedSlot(time);
    setFormOpen(true);
    setFlashTitle(true);
    setTimeout(() => setFlashTitle(false), 800);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedDoctorId) e.doctorId = '请选择医师';
    if (!selectedTreatmentId) e.treatmentId = '请选择项目';
    if (!patientName.trim()) e.patientName = '请输入姓名';
    const phone = patientPhone.replace(/[\s-]/g, '');
    if (!phone) e.patientPhone = '请输入手机号';
    else if (!/^(\+?6?01|1[3-9])\d{7,9}$/.test(phone) && phone.length < 8) {
      e.patientPhone = '手机号格式不正确';
    }
    if (!birthDate) e.birthDate = '请选择出生日期';
    if (gender !== 'female' && gender !== 'male') {
      e.gender = `${F.genderRequiredZh} / ${F.genderRequiredEn}`;
    }
    if (!selectedSlot) e.slot = '请选择时段';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const payload = {
      patientName: patientName.trim(),
      patientPhone: patientPhone.replace(/[\s-]/g, ''),
      gender,
      birthDate,
      visitorCount: 1,
      doctorId: selectedDoctorId,
      treatmentId: selectedTreatmentId,
      date: selectedDate,
      timeSlot: selectedSlot,
      symptoms: symptoms.trim(),
    };

    try {
      let booking: Reservation;
      if (apiOnline) {
        booking = await createBooking(payload);
      } else {
        booking = {
          ...payload,
          id: 'local_' + Date.now(),
          createdTime: new Date().toISOString(),
          status: 'pending',
        };
        const stored = JSON.parse(localStorage.getItem('hockhoe_bookings') || '[]');
        stored.push(booking);
        localStorage.setItem('hockhoe_bookings', JSON.stringify(stored));
      }

      onBookingSuccess(booking);
      setToast(
        `${F.successToastZh} (${selectedDate} ${selectedSlot}) ${F.successToastEn}`
      );
      setFormOpen(false);
      setSelectedSlot('');
      setPatientName('');
      setPatientPhone('');
      setBirthDate('');
      setSymptoms('');
      await loadSlots();
      setTimeout(() => setToast(null), 12000);
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : '提交失败' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="booking" className="scroll-mt-28 space-y-5">
      {toast && (
        <div
          role="alert"
          className="bg-emerald-50 border border-emerald-400 text-emerald-900 rounded-xl p-4 flex gap-3"
        >
          <CheckCircle className="text-emerald-600 shrink-0" size={22} />
          <p className="text-sm">{toast}</p>
        </div>
      )}

      {/* 长辈电话通道 */}
      <div className="bg-gradient-to-br from-[#DEEAF4] to-[#DEEAF4]/50 rounded-2xl p-5 border-2 border-[#FDD772]/60 shadow-md">
        <h3 className="font-serif font-bold text-[#10143A] text-lg flex items-center gap-2">
          <Phone size={20} className="icon-gold" />
          <BilingualLine
            zh={BOOKING_COPY.senior.titleZh}
            en={BOOKING_COPY.senior.titleEn}
            enClassName="text-xs font-sans font-normal text-[#10143A]/70 mt-0.5"
          />
        </h3>
        <BilingualLine
          zh={BOOKING_COPY.senior.subtitleZh}
          en={BOOKING_COPY.senior.subtitleEn}
          className="mt-1"
          zhClassName="text-sm text-stone-600"
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl p-4 border border-[#FDD772]/25">
          <a
            href={contactHref}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-2xl font-bold text-[#10143A] hover:underline"
          >
            {DEFAULTS.PHONE_NUMBER}
          </a>
          <a
            href={contactHref}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#FBD7DE] hover:bg-[#f5c0c8] text-[#10143A] px-5 py-3 rounded-full font-semibold text-base flex flex-col items-center justify-center gap-0.5 min-h-[48px]"
          >
            <span className="flex items-center gap-2">
              <Phone size={18} />
              {BOOKING_COPY.senior.callNowZh}
            </span>
            <span className="text-xs font-normal opacity-80">
              {BOOKING_COPY.senior.callNowEn}
            </span>
          </a>
        </div>
        <div className="text-xs text-stone-500 mt-2 flex items-start gap-1">
          <Heart size={12} className="icon-gold mt-1 shrink-0" />
          <BilingualLine
            zh={BOOKING_COPY.senior.noteZh}
            en={BOOKING_COPY.senior.noteEn}
          />
        </div>
      </div>

      {/* 在线预约 */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 bg-[#DEEAF4]/30">
          <h3 className="font-serif font-bold text-[#10143A] text-lg flex items-center gap-2">
            <FileSpreadsheet size={18} className="icon-gold" />
            <BilingualLine
              zh={BOOKING_COPY.slotSection.titleZh}
              en={BOOKING_COPY.slotSection.titleEn}
              enClassName="text-xs font-sans font-normal text-stone-500 mt-0.5"
            />
          </h3>
          <ul className="mt-2 space-y-2">
            {BOOKING_COPY.slotSection.rules.map((rule) => (
              <li key={rule.zh}>
                <BilingualLine
                  zh={rule.zh}
                  en={rule.en}
                  zhClassName="text-xs text-stone-600"
                  enClassName="text-[11px] text-stone-400 mt-0.5"
                />
              </li>
            ))}
          </ul>
          {(currentDay?.partialClosed || !apiOnline) && (
            <p className="text-xs text-stone-500 mt-2">
              {currentDay?.partialClosed && (
                <>
                  {UI.partialClosedTagZh} · {UI.partialClosedTagEn}
                  {' · '}
                </>
              )}
              {!apiOnline && (
                <>
                  {UI.offlineZh} {UI.offlineEn}
                </>
              )}
            </p>
          )}
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {availability.map((day, i) => (
              <button
                key={day.date}
                type="button"
                disabled={day.closed}
                onClick={() => {
                  if (day.closed) return;
                  setSelectedDate(day.date);
                  setSelectedSlot('');
                  setFormOpen(false);
                }}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                  day.closed
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed line-through'
                    : selectedDate === day.date
                      ? 'bg-[#FDD772] text-stone-900 shadow-md scale-[1.02]'
                      : 'bg-stone-50 border border-stone-200 text-stone-600 hover:border-[#FDD772]'
                }`}
              >
                {day.closed ? (
                  <span className="flex flex-col leading-tight">
                    <span>{UI.closedZh}</span>
                    <span className="text-[9px] opacity-80">{UI.closedEn}</span>
                  </span>
                ) : (
                  (() => {
                    const labels = getDayLabelBilingual(day.date, i);
                    return (
                      <span className="flex flex-col leading-tight">
                        <span>{labels.zh}</span>
                        <span className="text-[9px] opacity-80">{labels.en}</span>
                      </span>
                    );
                  })()
                )}
              </button>
            ))}
          </div>

          {todayEndedHint && (
            <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-2">
              {todayEndedHint}
            </p>
          )}

          {dayClosed ? (
            <BilingualLine
              zh={UI.dayRestZh}
              en={UI.dayRestEn}
              zhClassName="text-sm text-stone-500 bg-stone-100 rounded-lg px-4 py-6 text-center"
              enClassName="text-xs text-stone-400 text-center mt-2 px-4"
            />
          ) : visibleDaySlots.length === 0 ? (
            <p className="text-sm text-stone-500 bg-stone-100 rounded-lg px-4 py-6 text-center">
              {UI.noSlotsZh}{' '}
              <a
                href={contactHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#10143A] font-semibold underline"
              >
                {UI.phoneBookLinkZh}
              </a>
              <span className="block text-xs text-stone-400 mt-2">
                {UI.noSlotsEn}{' '}
                <a
                  href={contactHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {UI.phoneBookLinkEn}
                </a>
              </span>
            </p>
          ) : (
            <>
              {currentDay?.partialClosed && (
                <BilingualLine
                  zh={UI.partialClosedZh}
                  en={UI.partialClosedEn}
                  zhClassName="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2"
                  enClassName="text-[10px] text-amber-700/90 mt-1 px-3"
                />
              )}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {visibleDaySlots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  disabled={slot.booked || slot.closed}
                  onClick={() => handleSlotClick(slot.time, slot)}
                  className={`py-2.5 rounded-lg text-sm font-mono transition-all duration-200 min-h-[44px] ${
                    slot.closed
                      ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      : slot.booked
                        ? 'bg-stone-100 text-stone-300 line-through cursor-not-allowed'
                        : selectedSlot === slot.time
                          ? 'border-2 border-[#FDD772] bg-[#FDD772]/15 scale-[1.02] font-bold text-stone-800'
                          : 'border border-[#FDD772]/40 hover:bg-[#FDD772]/10 text-stone-700'
                  }`}
                  aria-disabled={slot.booked || slot.closed}
                >
                  {slot.closed ? (
                    <span className="flex flex-col leading-tight text-[10px] sm:text-sm">
                      <span>{UI.closedZh}</span>
                      <span className="text-[8px] sm:text-[9px] opacity-80">{UI.closedEn}</span>
                    </span>
                  ) : slot.booked ? (
                    <span className="flex flex-col leading-tight text-[10px] sm:text-sm">
                      <span>{UI.bookedZh}</span>
                      <span className="text-[8px] sm:text-[9px] opacity-80">{UI.bookedEn}</span>
                    </span>
                  ) : (
                    slot.time
                  )}
                </button>
              ))}
              </div>
            </>
          )}
        </div>

        {formOpen && selectedSlot && (
          <div
            ref={formRef}
            className={`border-t border-stone-200 p-5 space-y-4 transition-colors ${
              flashTitle ? 'bg-[#DEEAF4]/40' : 'bg-stone-50/50'
            }`}
          >
            <BilingualLine
              zh={`${UI.currentPickZh}：${selectedDate} ${selectedSlot}`}
              en={`${UI.currentPickEn}: ${selectedDate} ${selectedSlot}`}
              zhClassName="font-serif font-semibold text-[#10143A]"
              enClassName="text-xs text-stone-500 mt-0.5"
            />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <BilingualLine
                    zh={F.physicianZh}
                    en={F.physicianEn}
                    zhClassName="text-xs text-stone-500"
                    enClassName="text-[10px] text-stone-400 mt-0.5"
                  />
                  <p className="mt-1 rounded-lg border border-[#FDD772]/30 bg-[#DEEAF4]/35 px-3 py-2.5 text-sm font-serif font-semibold text-[#10143A]">
                    {DOCTORS[0]?.name} {F.physicianSuffixZh}
                  </p>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    {DOCTORS[0]?.name} · {F.physicianEn}
                  </p>
                </div>
                <div>
                  <BilingualLine
                    zh={F.treatmentZh}
                    en={F.treatmentEn}
                    zhClassName="text-xs text-stone-500"
                    enClassName="text-[10px] text-stone-400 mt-0.5"
                  />
                  <select
                    value={selectedTreatmentId}
                    onChange={(e) => onSelectTreatment(e.target.value)}
                    className="w-full mt-1 rounded-lg border p-2.5 text-sm bg-white"
                  >
                    <option value="">{F.selectTreatmentZh}</option>
                    {TREATMENTS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-stone-400 mt-0.5">{F.selectTreatmentEn}</p>
                  {errors.treatmentId && (
                    <span className="text-red-500 text-xs">{errors.treatmentId}</span>
                  )}
                </div>
              </div>

              <BilingualLine
                zh={F.onePatientZh}
                en={F.onePatientEn}
                zhClassName="text-xs text-amber-900/90 bg-amber-50/80 border border-amber-200/60 rounded-lg px-3 py-2"
                enClassName="text-[10px] text-amber-800/70 mt-1 px-3"
              />

              <div>
                <BilingualLine
                  zh={F.nameZh}
                  en={F.nameEn}
                  zhClassName="text-xs text-stone-500"
                  enClassName="text-[10px] text-stone-400 mt-0.5"
                />
                <input
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full mt-1 rounded-lg border p-2.5 text-sm bg-white"
                  placeholder={F.namePlaceholderZh}
                />
                <p className="text-[10px] text-stone-400 mt-0.5">{F.namePlaceholderEn}</p>
                {errors.patientName && (
                  <span className="text-red-500 text-xs">{errors.patientName}</span>
                )}
              </div>

              <div>
                <BilingualLine
                  zh={F.genderZh}
                  en={F.genderEn}
                  zhClassName="text-xs text-stone-500 mb-1"
                  enClassName="text-[10px] text-stone-400 mb-1"
                />
                <div className="flex gap-2">
                  {(
                    [
                      ['female', F.femaleZh, F.femaleEn],
                      ['male', F.maleZh, F.maleEn],
                    ] as const
                  ).map(([v, labelZh, labelEn]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setGender(v)}
                      className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
                        gender === v
                          ? 'bg-[#FDD772] border-[#FDD772] text-stone-900 font-medium'
                          : 'bg-white border-stone-200'
                      }`}
                    >
                      <span className="flex flex-col leading-tight">
                        <span>{labelZh}</span>
                        <span className="text-[9px] font-normal opacity-75">{labelEn}</span>
                      </span>
                    </button>
                  ))}
                </div>
                {errors.gender && (
                  <span className="text-red-500 text-xs mt-1 block">{errors.gender}</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <BilingualLine
                    zh={F.birthZh}
                    en={F.birthEn}
                    zhClassName="text-xs text-stone-500"
                    enClassName="text-[10px] text-stone-400 mt-0.5"
                  />
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full mt-1 rounded-lg border p-2.5 text-sm bg-white"
                  />
                  <p className="text-[10px] text-stone-400 mt-0.5">{F.birthEn}</p>
                  {errors.birthDate && (
                    <span className="text-red-500 text-xs">{errors.birthDate}</span>
                  )}
                </div>
                <div>
                  <BilingualLine
                    zh={F.phoneZh}
                    en={F.phoneEn}
                    zhClassName="text-xs text-stone-500"
                    enClassName="text-[10px] text-stone-400 mt-0.5"
                  />
                  <input
                    type="tel"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full mt-1 rounded-lg border p-2.5 text-sm bg-white font-mono"
                    placeholder={F.phonePlaceholderZh}
                  />
                  <p className="text-[10px] text-stone-400 mt-0.5">{F.phonePlaceholderEn}</p>
                  {errors.patientPhone && (
                    <span className="text-red-500 text-xs">{errors.patientPhone}</span>
                  )}
                </div>
              </div>

              <div>
                <BilingualLine
                  zh={F.symptomsZh}
                  en={F.symptomsEn}
                  zhClassName="text-xs text-stone-500"
                  enClassName="text-[10px] text-stone-400 mt-0.5"
                />
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={2}
                  placeholder={F.symptomsPlaceholderZh}
                  className="w-full mt-1 rounded-lg border p-2.5 text-xs bg-white resize-none"
                />
                <p className="text-[10px] text-stone-400 mt-0.5">{F.symptomsPlaceholderEn}</p>
              </div>

              <BilingualLine
                zh={F.privacyZh}
                en={F.privacyEn}
                zhClassName="text-[11px] text-stone-500"
                enClassName="text-[10px] text-stone-400 mt-1"
              />

              {errors.submit && (
                <p className="text-red-600 text-sm flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.submit}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#10143A] hover:bg-[#1a2348] text-gold-on-dark font-serif font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-60 shadow-sm"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
                <span className="flex flex-col leading-tight">
                  <span>
                    {UI.confirmBookZh} {selectedSlot}
                  </span>
                  <span className="text-[10px] font-normal opacity-90">
                    {UI.confirmBookEn} {selectedSlot}
                  </span>
                </span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
