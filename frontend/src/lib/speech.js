import { Capacitor } from '@capacitor/core';
import { generateSpeech } from './firebase';

const audioCache = new Map();

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

// Lazy-loaded native TTS module
let nativeTTS = null;
const getNativeTTS = async () => {
  if (nativeTTS) return nativeTTS;
  try {
    const mod = await import('@capacitor-community/text-to-speech');
    nativeTTS = mod.TextToSpeech;
    return nativeTTS;
  } catch (e) {
    console.error('[Speech] Failed to load native TTS:', e);
    return null;
  }
};

export const safeSpeech = {
  cancel: () => {
    try {
      if (synth) {
        synth.cancel();
      } else if (Capacitor.isNativePlatform()) {
        getNativeTTS().then(tts => tts?.stop()).catch(() => {});
      }
    } catch (e) { /* ignore */ }
  },

  speak: (utteranceOrText) => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Native: ALWAYS prefer Capacitor TTS plugin on Android/iOS
        const text = typeof utteranceOrText === 'string' 
          ? utteranceOrText 
          : utteranceOrText?.text || '';
        const lang = typeof utteranceOrText === 'string'
          ? 'en-US'
          : utteranceOrText?.lang || 'en-US';
        
        if (!text) return;
        
        getNativeTTS().then(tts => {
          if (tts) {
            tts.speak({
              text: text,
              lang: lang,
              rate: 1.0,
              pitch: 1.0,
              volume: 1.0,
              category: 'playback'
            }).catch(err => console.error('[Speech] Native speak error:', err));
          }
        }).catch(() => {});
      } else if (synth) {
        // Web: use standard SpeechSynthesis
        synth.speak(utteranceOrText);
      }
    } catch (e) {
      console.error('[Speech] speak error:', e);
    }
  },

  getVoices: () => {
    try {
      return synth?.getVoices() || [];
    } catch (e) {
      return [];
    }
  },

  get supported() {
    return !!synth || Capacitor.isNativePlatform();
  }
};

/**
 * Plays high-quality audio using the Google Cloud TTS backend.
 * Includes a local cache to avoid redundant network requests.
 */
export const playProfessionalSpeech = async (text, voiceId = 'orion') => {
  if (!text) return;
  
  const cacheKey = `${voiceId}:${text.toLowerCase().trim()}`;
  
  try {
    let audioData;
    
    if (audioCache.has(cacheKey)) {
      audioData = audioCache.get(cacheKey);
    } else {
      // Request high-quality audio from backend
      const result = await generateSpeech(text, voiceId);
      audioData = result.audioContent;
      // Cache it for next time
      audioCache.set(cacheKey, audioData);
    }
    
    // Play the audio and return a promise that resolves when it ends
    return new Promise((resolve, reject) => {
      const audio = new Audio(`data:audio/mp3;base64,${audioData}`);
      audio.onended = () => resolve();
      audio.onerror = (e) => reject(e);
      audio.play().catch(reject);
    });
  } catch (error) {
    console.error('[Speech] Professional Speech Error:', error);
    // Fallback to safeSpeech logic if backend fails
    return new Promise((resolve) => {
      if (Capacitor.isNativePlatform()) {
        const textToSpeak = typeof text === 'string' ? text : text?.text || '';
        const langToSpeak = typeof text === 'string' ? 'en-US' : text?.lang || 'en-US';
        import('@capacitor-community/text-to-speech').then(mod => {
          mod.TextToSpeech.speak({
            text: textToSpeak,
            lang: langToSpeak,
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0,
            category: 'playback'
          }).then(resolve).catch(() => resolve());
        }).catch(() => resolve());
      } else {
        const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
        if (synth) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.onend = resolve;
          utterance.onerror = resolve;
          synth.speak(utterance);
        } else {
          resolve();
        }
      }
    });
  }
};

export default safeSpeech;
