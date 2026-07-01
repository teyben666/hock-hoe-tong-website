/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 候诊大厅大屏 — 访问 /queue-display
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { fetchQueueBoard } from '../api';
import { QueueBoard } from '../types';
import { DEFAULTS, QUEUE_WALKIN_COPY } from '../data';
import { BilingualLine } from './BilingualLine';
import { announceQueueCall, isSpeechSupported } from '../utils/queueAnnounce';
import {
  isMuteFromUrl,
  isQueueAudioUnlockedThisSession,
  saveSoundEnabledPreference,
  unlockQueueAudio,
} from '../utils/queueChime';
import { primeSpeechInUserGesture } from '../utils/queueSpeech';

const POLL_MS_IDLE = 5000;
const POLL_MS_ACTIVE = 2000;
const C = QUEUE_WALKIN_COPY.queueDisplay;
const NAVY = '#10143A';

const glassPanel =
  'backdrop-blur-xl bg-white/30 border border-white/40 shadow-lg shadow-black/5';
const glassBar = 'backdrop-blur-xl bg-white/25 border-white/35';

const zhText = 'text-[#10143A]';
const enText = 'text-[#10143A]/55';
const mutedText = 'text-[#10143A]/65';

function announcementKey(ann: QueueBoard['lastAnnouncement']): string {
  if (!ann) return '';
  return `${ann.bookingId}:${ann.at}:${ann.kind}`;
}

export const QueueDisplay: React.FC = () => {
  const [board, setBoard] = useState<QueueBoard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(() => isQueueAudioUnlockedThisSession());
  const [unlockFailed, setUnlockFailed] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [pulseToken, setPulseToken] = useState(0);
  const lastAnnKeyRef = useRef<string>('');
  const initialAnnRef = useRef(true);
  const audioUnlockedRef = useRef(audioUnlocked);
  const announcingRef = useRef(false);
  const muted = isMuteFromUrl();
  const pollMs = audioUnlocked && !muted ? POLL_MS_ACTIVE : POLL_MS_IDLE;

  audioUnlockedRef.current = audioUnlocked;

  useEffect(() => {
    setTtsSupported(isSpeechSupported());
  }, []);

  const runAnnouncement = useCallback(async (queueCode: string) => {
    if (announcingRef.current) return;
    announcingRef.current = true;
    try {
      await announceQueueCall(queueCode);
    } finally {
      announcingRef.current = false;
    }
  }, []);

  const enableSound = () => {
    primeSpeechInUserGesture();
    void unlockQueueAudio().then((ok) => {
      setUnlockFailed(!ok);
      if (ok) {
        setAudioUnlocked(true);
        saveSoundEnabledPreference(true);
      }
    });
  };

  useEffect(() => {
    const load = () =>
      fetchQueueBoard()
        .then((b) => {
          setBoard(b);
          const ann = b.lastAnnouncement;
          const key = announcementKey(ann);
          if (initialAnnRef.current) {
            initialAnnRef.current = false;
            lastAnnKeyRef.current = key;
            return;
          }
          if (key && key !== lastAnnKeyRef.current && audioUnlockedRef.current && !muted) {
            lastAnnKeyRef.current = key;
            setPulseToken((t) => t + 1);
            const code = ann?.queueCode ?? b.current?.queueCode;
            if (code) void runAnnouncement(code);
          }
        })
        .catch((e) =>
          setError(
            e instanceof Error
              ? `${C.loadErrorZh} / ${C.loadErrorEn}: ${e.message}`
              : `${C.loadErrorZh} / ${C.loadErrorEn}`
          )
        );
    load();
    const t = setInterval(load, pollMs);
    return () => clearInterval(t);
  }, [muted, pollMs, runAnnouncement]);

  const current = board?.current;
  const nextA = board?.waitingAppointment.slice(0, 4) ?? [];
  const nextW = board?.waitingWalkIn.slice(0, 3) ?? [];
  const showSoundPrompt = !muted && !audioUnlocked;

  return (
    <div className={`relative min-h-screen flex flex-col overflow-hidden bg-black ${zhText}`}>
      <video
        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        src="/video/0524.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden
      />

      {showSoundPrompt && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 p-6">
          <button
            type="button"
            onClick={enableSound}
            className={`max-w-sm w-full rounded-2xl px-8 py-6 text-center shadow-xl ${glassPanel}`}
          >
            <BilingualLine
              zh={C.enableSoundZh}
              en={C.enableSoundEn}
              zhClassName={`text-lg font-bold ${zhText}`}
              enClassName={`text-sm mt-2 ${enText}`}
            />
            {unlockFailed && (
              <p className="mt-3 text-sm text-red-800/90">
                未能播放测试音，请调高音量或换 Chrome / Edge 后重试
                <span className={`block text-xs mt-1 ${enText}`}>
                  Could not play test sound — raise volume or try Chrome / Edge
                </span>
              </p>
            )}
          </button>
        </div>
      )}

      <div className="relative z-10 flex min-h-screen flex-col">
        <header
          className={`px-6 py-4 border-b flex justify-between items-center gap-4 ${glassBar}`}
        >
          <div>
            <p className="text-gold font-sans tracking-widest text-sm drop-shadow-sm">
              {DEFAULTS.CLINIC_ENGLISH}
            </p>
            <h1 className="font-serif text-2xl font-bold mt-0.5">{DEFAULTS.CLINIC_NAME}</h1>
            <BilingualLine
              zh={C.titleZh}
              en={C.titleEn}
              className="mt-1"
              zhClassName={`text-lg font-medium ${zhText}`}
              enClassName={`text-sm mt-0.5 ${enText}`}
            />
          </div>
          <div className="text-right shrink-0 space-y-1 max-w-[11rem]">
            <p className={`font-mono text-sm ${mutedText}`}>{board?.date}</p>
            {!muted && audioUnlocked && (
              <BilingualLine
                zh={C.soundOnZh}
                en={C.soundOnEn}
                zhClassName={`text-[10px] ${mutedText}`}
                enClassName={`text-[9px] mt-0.5 ${enText}`}
              />
            )}
            {muted && <p className={`text-[10px] ${enText}`}>静音 / Muted</p>}
            {!muted && audioUnlocked && !ttsSupported && (
              <BilingualLine
                zh={C.ttsUnsupportedZh}
                en={C.ttsUnsupportedEn}
                zhClassName="text-[9px] text-amber-800/90 leading-snug"
                enClassName="text-[8px] text-amber-800/70 mt-0.5 leading-snug"
              />
            )}
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-10">
          {error && (
            <p
              className={`text-red-700 text-center text-sm max-w-xl rounded-xl px-4 py-2 ${glassPanel}`}
            >
              {error}
            </p>
          )}

          <section
            className={`text-center w-full max-w-2xl rounded-3xl px-8 py-10 ${glassPanel}`}
          >
            <BilingualLine
              zh={C.nowServingZh}
              en={C.nowServingEn}
              zhClassName={`text-lg sm:text-xl font-medium ${zhText}`}
              enClassName={`text-sm sm:text-base mt-1 ${enText}`}
            />
            <p
              key={pulseToken}
              className={`font-mono font-black text-gold leading-none mt-4 ${
                pulseToken > 0 ? 'queue-number-pulse' : ''
              }`}
              style={{
                fontSize: 'clamp(4rem, 18vw, 9rem)',
                textShadow: `0 2px 0 ${NAVY}22, 0 4px 16px ${NAVY}33`,
              }}
            >
              {current?.queueCode ?? '—'}
            </p>
            {current && (
              <p className={`text-2xl mt-4 font-medium ${zhText}`}>{current.maskedName}</p>
            )}
          </section>

          <section className="w-full max-w-3xl grid sm:grid-cols-2 gap-6">
            <div className={`rounded-2xl p-5 ${glassPanel}`}>
              <BilingualLine
                zh={C.appointmentZh}
                en={C.appointmentEn}
                zhClassName={`font-serif text-lg font-semibold ${zhText}`}
                enClassName={`text-sm mt-0.5 ${enText}`}
              />
              <ul className={`space-y-2 font-mono text-2xl mt-3 font-bold ${zhText}`}>
                {nextA.length === 0 ? (
                  <li>
                    <BilingualLine
                      zh={C.emptyZh}
                      en={C.emptyEn}
                      zhClassName={`text-base ${mutedText}`}
                      enClassName={`text-sm mt-0.5 ${enText}`}
                    />
                  </li>
                ) : (
                  nextA.map((r) => (
                    <li key={r.id}>
                      <span className="text-gold">{r.queueCode}</span>
                      <span className={`text-base font-normal ml-2 ${mutedText}`}>
                        {r.maskedName}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div className={`rounded-2xl p-5 ${glassPanel}`}>
              <BilingualLine
                zh={C.walkInZh}
                en={C.walkInEn}
                zhClassName={`font-serif text-lg font-semibold ${zhText}`}
                enClassName={`text-sm mt-0.5 ${enText}`}
              />
              <ul className={`space-y-2 font-mono text-2xl mt-3 font-bold ${zhText}`}>
                {nextW.length === 0 ? (
                  <li>
                    <BilingualLine
                      zh={C.emptyZh}
                      en={C.emptyEn}
                      zhClassName={`text-base ${mutedText}`}
                      enClassName={`text-sm mt-0.5 ${enText}`}
                    />
                  </li>
                ) : (
                  nextW.map((r) => (
                    <li key={r.id}>
                      <span className="text-gold">{r.queueCode}</span>
                      <span className={`text-base font-normal ml-2 ${mutedText}`}>
                        {r.maskedName}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </section>
        </main>

        <footer
          className={`text-center text-xs py-3 px-4 space-y-0.5 border-t ${glassBar} ${mutedText}`}
        >
          <p>{C.refreshZh(pollMs / 1000)}</p>
          <p className={enText}>{C.refreshEn(pollMs / 1000)}</p>
          <p className={`mt-2 ${enText}`}>{DEFAULTS.SLOGAN}</p>
        </footer>
      </div>
    </div>
  );
};
