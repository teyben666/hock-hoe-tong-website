/**
 * 叫号完整播报：铃声 + 双语 TTS
 */

import { isQueueAudioUnlockedThisSession, playQueueChimeAsync } from './queueChime';
import {
  getSpeechModeFromUrl,
  isSpeechSupported,
  speakQueueAnnouncement,
  type SpeechMode,
} from './queueSpeech';

export async function announceQueueCall(
  queueCode: string,
  options?: { speechMode?: SpeechMode; withChime?: boolean }
): Promise<void> {
  const code = queueCode.trim();
  if (!code) return;
  if (!isQueueAudioUnlockedThisSession()) return;

  const speechMode = options?.speechMode ?? getSpeechModeFromUrl();
  const withChime = options?.withChime ?? true;

  if (withChime) {
    await playQueueChimeAsync();
  }

  if (isSpeechSupported()) {
    await speakQueueAnnouncement(code, speechMode);
  }
}

export { getSpeechModeFromUrl, isSpeechSupported } from './queueSpeech';
