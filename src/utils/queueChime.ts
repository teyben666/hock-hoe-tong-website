/**
 * 叫号提示音：优先 MP3，失败时用 Web Audio 合成短铃
 * 浏览器要求：每个标签页须有一次用户点击「解锁」后才能播放
 */

const CHIME_SRC = `/sounds/${encodeURIComponent(
  'Doorbell (Ding Dong) - Sound Effect for Editing.mp3'
)}`;

/** 门铃音量（0–1），100% → 65% */
const CHIME_VOLUME = 0.65;

let audioEl: HTMLAudioElement | null = null;
let sharedAudioContext: AudioContext | null = null;

function getAudio(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio(CHIME_SRC);
    audioEl.volume = CHIME_VOLUME;
    audioEl.preload = 'auto';
  }
  return audioEl;
}

function getAudioContextClass(): typeof AudioContext | null {
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ||
    null
  );
}

async function resumeSharedAudioContext(): Promise<AudioContext | null> {
  const Ctx = getAudioContextClass();
  if (!Ctx) return null;
  if (!sharedAudioContext) sharedAudioContext = new Ctx();
  if (sharedAudioContext.state === 'suspended') {
    await sharedAudioContext.resume();
  }
  return sharedAudioContext;
}

function playSyntheticChimeOn(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const freqs = [880, 1174];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const start = now + i * 0.08;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.15 * CHIME_VOLUME, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.4);
  });
}

export const QUEUE_AUDIO_UNLOCK_SESSION_KEY = 'fht_queue_audio_unlocked';

/** 本标签页是否已在用户点击后解锁音频（与 localStorage 偏好无关） */
export function isQueueAudioUnlockedThisSession(): boolean {
  try {
    return sessionStorage.getItem(QUEUE_AUDIO_UNLOCK_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function markQueueAudioUnlockedThisSession(): void {
  try {
    sessionStorage.setItem(QUEUE_AUDIO_UNLOCK_SESSION_KEY, '1');
  } catch {
    /* ignore */
  }
}

/** 用户偏好 + 本会话已解锁 */
export function isQueueAudioReady(): boolean {
  return readSoundEnabledPreference() && isQueueAudioUnlockedThisSession();
}

/**
 * 在用户点击时调用，解锁后续叫号铃声（须在 click 回调内触发）
 */
export async function unlockQueueAudio(): Promise<boolean> {
  markQueueAudioUnlockedThisSession();
  let ok = false;

  try {
    const el = getAudio();
    el.volume = CHIME_VOLUME;
    el.currentTime = 0;
    await el.play();
    ok = true;
  } catch {
    /* MP3 被策略拦截时尝试 Web Audio */
  }

  if (!ok) {
    try {
      const ctx = await resumeSharedAudioContext();
      if (ctx) {
        playSyntheticChimeOn(ctx);
        ok = true;
      }
    } catch {
      ok = false;
    }
  }

  return ok;
}

/** 浏览器策略：需用户手势后调用 */
export function playQueueChime(): void {
  void playQueueChimeAsync();
}

/** 返回 Promise，便于铃声结束后再 TTS */
export function playQueueChimeAsync(): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const fallbackSynthetic = () => {
      void resumeSharedAudioContext()
        .then((ctx) => {
          if (ctx) playSyntheticChimeOn(ctx);
        })
        .finally(() => setTimeout(finish, 520));
    };

    try {
      const el = getAudio();
      el.volume = CHIME_VOLUME;
      el.currentTime = 0;
      const onEnded = () => {
        el.removeEventListener('ended', onEnded);
        finish();
      };
      el.addEventListener('ended', onEnded);
      const p = el.play();
      if (p && typeof p.then === 'function') {
        p.catch(() => fallbackSynthetic());
      }
      setTimeout(finish, 2800);
    } catch {
      fallbackSynthetic();
    }
  });
}

export const QUEUE_SOUND_STORAGE_KEY = 'fht_queue_sound_enabled';

export function readSoundEnabledPreference(): boolean {
  try {
    return localStorage.getItem(QUEUE_SOUND_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveSoundEnabledPreference(enabled: boolean): void {
  try {
    localStorage.setItem(QUEUE_SOUND_STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function isMuteFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('mute') === '1';
}
