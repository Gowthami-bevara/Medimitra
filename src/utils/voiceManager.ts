import { AppLanguage } from '../types';

export interface SpeakOptions {
  onStart?: () => void;
  onChunkStart?: (chunkIdx: number, total: number) => void;
  onEnd?: () => void;
  onError?: (err?: string) => void;
}

let activeUtterances: SpeechSynthesisUtterance[] = [];
let isCancelled = false;

export function stopSpeakingAudio() {
  isCancelled = true;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
  activeUtterances = [];
}

export function speakNaturalVoice(
  rawText: string,
  language: AppLanguage,
  options: SpeakOptions = {}
) {
  stopSpeakingAudio();
  isCancelled = false;

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    options.onError?.('speech_synthesis_unsupported');
    options.onEnd?.();
    return;
  }

  // Clean Markdown & formatting artifacts
  const clean = rawText
    .replace(/[*#_~`[\]()<>]/g, ' ')
    .replace(/\b(https?:\/\/\S+)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) {
    options.onEnd?.();
    return;
  }

  // Split into manageable sentences/chunks for smooth uninterrupted speech
  const rawSentences = clean.split(/(?<=[.!?।॥\n])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of rawSentences) {
    if ((current + ' ' + sentence).length > 180 && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = current ? current + ' ' + sentence : sentence;
    }
  }
  if (current.trim()) {
    chunks.push(current.trim());
  }

  if (chunks.length === 0) {
    options.onEnd?.();
    return;
  }

  const voices = window.speechSynthesis.getVoices();
  const langPrefix = language.split('-')[0].toLowerCase();

  // Find preferred natural or female voice for the target language
  const voice =
    voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith(langPrefix) &&
        (v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('natural') ||
          v.name.toLowerCase().includes('google'))
    ) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix)) ||
    voices.find((v) => v.lang.toLowerCase().includes('en-in') || v.lang.toLowerCase().includes('en'));

  if (language === 'te-IN' && !voice) {
    options.onError?.('telugu_female_unavailable');
  }

  options.onStart?.();

  let currentIndex = 0;

  function speakNextChunk() {
    if (isCancelled || currentIndex >= chunks.length) {
      options.onEnd?.();
      return;
    }

    const chunkText = chunks[currentIndex];
    const chunkIdx = currentIndex + 1;
    options.onChunkStart?.(chunkIdx, chunks.length);

    const utterance = new SpeechSynthesisUtterance(chunkText);
    utterance.lang = language;
    utterance.rate = language === 'te-IN' ? 0.92 : 0.96;
    utterance.pitch = 1.05;

    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => {
      if (isCancelled) return;
      currentIndex++;
      speakNextChunk();
    };

    utterance.onerror = (e) => {
      if (isCancelled) return;
      // Continue to next chunk on non-fatal error
      currentIndex++;
      speakNextChunk();
    };

    activeUtterances.push(utterance);
    window.speechSynthesis.speak(utterance);
  }

  speakNextChunk();
}
