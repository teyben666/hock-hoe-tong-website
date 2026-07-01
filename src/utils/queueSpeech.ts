/**
 * 叫号双语语音播报（Web Speech API，无需预录音频）
 */

export type SpeechMode = 'zh' | 'en' | 'both';

const ZH_DIGIT: Record<string, string> = {
  '0': '零',
  '1': '一',
  '2': '二',
  '3': '三',
  '4': '四',
  '5': '五',
  '6': '六',
  '7': '七',
  '8': '八',
  '9': '九',
};

const EN_DIGIT: Record<string, string> = {
  '0': 'zero',
  '1': 'one',
  '2': 'two',
  '3': 'three',
  '4': 'four',
  '5': 'five',
  '6': 'six',
  '7': 'seven',
  '8': 'eight',
  '9': 'nine',
};

/** A05 → 「A 零五」 */
export function formatQueueCodeZh(code: string): string {
  const t = code.trim().toUpperCase();
  if (!t) return '';
  const prefix = t.charAt(0);
  const digits = t.slice(1).replace(/\D/g, '');
  const spokenDigits = [...digits].map((d) => ZH_DIGIT[d] ?? d).join('');
  return `${prefix} ${spokenDigits}`.trim();
}

/** A05 → 「A zero five」 */
export function formatQueueCodeEn(code: string): string {
  const t = code.trim().toUpperCase();
  if (!t) return '';
  const prefix = t.charAt(0);
  const digits = t.slice(1).replace(/\D/g, '');
  const spokenDigits = [...digits].map((d) => EN_DIGIT[d] ?? d).join(' ');
  return `${prefix} ${spokenDigits}`.trim();
}

export function buildAnnouncementZh(queueCode: string): string {
  const spoken = formatQueueCodeZh(queueCode);
  return spoken ? `请 ${spoken} 号进诊` : '';
}

export function buildAnnouncementEn(queueCode: string): string {
  const spoken = formatQueueCodeEn(queueCode);
  return spoken ? `Now calling ${spoken}, please proceed` : '';
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function getSpeechModeFromUrl(): SpeechMode {
  if (typeof window === 'undefined') return 'both';
  const v = new URLSearchParams(window.location.search).get('speech');
  if (v === 'zh' || v === 'en' || v === 'both') return v;
  return 'both';
}

export function cancelQueueSpeech(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}

/**
 * 须在用户点击回调里同步调用，否则部分浏览器会静默拦截 TTS
 */
export function primeSpeechInUserGesture(): void {
  if (!isSpeechSupported()) return;
  const utter = new SpeechSynthesisUtterance(' ');
  utter.lang = 'zh-CN';
  utter.volume = 0.01;
  utter.rate = 1;
  window.speechSynthesis.speak(utter);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const existing = synth.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }
    const onChange = () => {
      synth.removeEventListener('voiceschanged', onChange);
      resolve(synth.getVoices());
    };
    synth.addEventListener('voiceschanged', onChange);
    setTimeout(() => {
      synth.removeEventListener('voiceschanged', onChange);
      resolve(synth.getVoices());
    }, 500);
  });
}

function pickVoice(voices: SpeechSynthesisVoice[], langPrefix: string): SpeechSynthesisVoice | null {
  const lower = langPrefix.toLowerCase();
  return (
    voices.find((v) => v.lang.toLowerCase() === lower) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(lower.split('-')[0])) ??
    null
  );
}

function speakLine(text: string, lang: string, voices: SpeechSynthesisVoice[]): Promise<void> {
  return new Promise((resolve) => {
    if (!text.trim() || !isSpeechSupported()) {
      resolve();
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.9;
    utter.pitch = 1;
    utter.volume = 1;
    const voice = pickVoice(voices, lang);
    if (voice) utter.voice = voice;
    utter.onend = () => resolve();
    utter.onerror = () => resolve();
    window.speechSynthesis.speak(utter);
  });
}

/**
 * 先华语后英语播报；新叫号会取消未播完的语音
 */
export async function speakQueueAnnouncement(
  queueCode: string,
  mode: SpeechMode = 'both'
): Promise<void> {
  if (!isSpeechSupported() || !queueCode.trim()) return;

  cancelQueueSpeech();
  await delay(80);

  const voices = await waitForVoices();
  const zh = buildAnnouncementZh(queueCode);
  const en = buildAnnouncementEn(queueCode);

  if (mode === 'zh' || mode === 'both') {
    await speakLine(zh, 'zh-CN', voices);
  }
  if (mode === 'en' || mode === 'both') {
    await speakLine(en, 'en-US', voices);
  }
}
