/**
 * Сервис для воспроизведения WAV файлов
 * Использует предзаписанные WAV файлы, с fallback на встроенную озвучку браузера (SpeechSynthesis)
 */

let sharedAudioContext: AudioContext | null = null;

/**
 * Определяет, является ли устройство мобильным
 */
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (typeof window !== 'undefined' && 'ontouchstart' in window);
}

/**
 * Разблокировка AudioContext для Telegram WebApp
 */
export async function unlockAudio() {
  if (!sharedAudioContext) {
    const options = isMobileDevice() ? {} : { sampleRate: 24000 };
    sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)(options);
    console.log("📱 AudioContext created:", { 
      isMobile: isMobileDevice(), 
      sampleRate: sharedAudioContext.sampleRate,
      state: sharedAudioContext.state 
    });
  }
  
  if (sharedAudioContext.state === 'suspended') {
    console.log("Resuming AudioContext...");
    await sharedAudioContext.resume();
  }
  return sharedAudioContext;
}

/**
 * Воспроизведение текста через встроенный SpeechSynthesis API браузера (fallback)
 */
export async function playTextWithSpeechSynthesis(text: string, lang: 'de' | 'ru' = 'de'): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      if (!('speechSynthesis' in window)) {
        reject(new Error("SpeechSynthesis API не поддерживается в этом браузере"));
        return;
      }

      console.log("🔊 [TTS Engine: Browser Speech Synthesis]", text);
      
      // Останавливаем любые текущие озвучки
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Настройки для языка
      utterance.lang = lang === 'de' ? 'de-DE' : 'ru-RU';
      utterance.rate = 1.0; // Скорость речи
      utterance.pitch = 0.9; // Немного ниже для более мужского звучания
      utterance.volume = 1.0; // Громкость
      
      // Пытаемся найти мужской голос
      const voices = window.speechSynthesis.getVoices();
      const targetLang = lang === 'de' ? 'de' : 'ru';
      const maleVoice = voices.find(voice => 
        voice.lang.startsWith(targetLang) && 
        (voice.name.toLowerCase().includes('male') || 
         voice.name.toLowerCase().includes('männlich') ||
         voice.gender === 'male' ||
         !voice.name.toLowerCase().includes('female') && !voice.name.toLowerCase().includes('weiblich'))
      ) || voices.find(voice => voice.lang.startsWith(targetLang));
      
      if (maleVoice) {
        utterance.voice = maleVoice;
        console.log("✅ Using voice:", maleVoice.name, maleVoice.lang);
      } else {
        console.warn("⚠️ No German male voice found, using default");
      }
      
      utterance.onend = () => {
        console.log("✅ SpeechSynthesis playback ended");
        resolve();
      };
      
      utterance.onerror = (e) => {
        console.error("❌ SpeechSynthesis error:", e);
        reject(new Error("SpeechSynthesis failed"));
      };
      
      window.speechSynthesis.speak(utterance);
      console.log("✅ SpeechSynthesis playback started");
    } catch (err) {
      console.error("❌ Error with SpeechSynthesis:", err);
      reject(err);
    }
  });
}

/**
 * Воспроизведение WAV файла по пути с fallback на SpeechSynthesis
 */
export async function playAudioFile(audioUrl: string, fallbackText?: string, lang?: 'de' | 'ru'): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      console.log("🔊 Playing audio file:", audioUrl);
      
      // Разблокируем аудио
      unlockAudio().catch(() => {});
      
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        console.log("✅ Audio playback ended");
        resolve();
      };
      
      audio.onerror = async (e) => {
        console.error("❌ Audio playback error:", e);
        console.error("💡 Файл не найден, используем встроенную озвучку браузера");
        
        // Если есть текст для fallback, используем SpeechSynthesis
        if (fallbackText) {
          try {
            // Используем переданный язык или определяем по URL
            const fallbackLang: 'de' | 'ru' = lang || (audioUrl.includes('/ru/') || audioUrl.includes('_ru') ? 'ru' : 'de');
            await playTextWithSpeechSynthesis(fallbackText, fallbackLang);
            resolve();
          } catch (synthError) {
            console.error("❌ SpeechSynthesis also failed:", synthError);
            reject(new Error(`Failed to play audio: ${audioUrl}`));
          }
        } else {
          reject(new Error(`Failed to play audio: ${audioUrl}`));
        }
      };
      
      audio.onloadstart = () => {
        console.log("📥 Audio loading started");
      };
      
      audio.oncanplay = () => {
        console.log("✅ Audio can play");
      };
      
      audio.play().then(() => {
        console.log("✅ Audio playback started");
      }).catch(async (err) => {
        console.error("❌ Audio play() failed:", err);
        console.log("💡 Пробуем встроенную озвучку браузера");
        
        // Если есть текст для fallback, используем SpeechSynthesis
        if (fallbackText) {
          try {
            // Используем переданный язык или определяем по URL
            const fallbackLang: 'de' | 'ru' = lang || (audioUrl.includes('/ru/') || audioUrl.includes('_ru') ? 'ru' : 'de');
            await playTextWithSpeechSynthesis(fallbackText, fallbackLang);
            resolve();
          } catch (synthError) {
            console.error("❌ SpeechSynthesis also failed:", synthError);
            reject(err);
          }
        } else {
          reject(err);
        }
      });
    } catch (err) {
      console.error("❌ Error creating audio:", err);
      // Если есть текст для fallback, пробуем SpeechSynthesis
      if (fallbackText) {
        // Используем переданный язык или определяем по URL
        const fallbackLang: 'de' | 'ru' = lang || (audioUrl.includes('/ru/') || audioUrl.includes('_ru') ? 'ru' : 'de');
        playTextWithSpeechSynthesis(fallbackText, fallbackLang)
          .then(() => resolve())
          .catch((synthError) => reject(err));
      } else {
        reject(err);
      }
    }
  });
}

/**
 * Воспроизведение WAV файла для слова по ID с fallback на SpeechSynthesis
 */
export async function playWordAudio(topicId: string, wordId: string, wordText?: string, lang: 'de' | 'ru' = 'de'): Promise<void> {
  const audioUrl = `/audio/words/${topicId}/${wordId}.wav`;
  return playAudioFile(audioUrl, wordText, lang);
}

/**
 * Воспроизведение WAV файла для мантры по ID с fallback на SpeechSynthesis
 */
export async function playMantraAudio(topicId: string, mantraId: string, mantraText?: string, lang: 'de' | 'ru' = 'de'): Promise<void> {
  const audioUrl = `/audio/mantras/${topicId}/${mantraId}.wav`;
  return playAudioFile(audioUrl, mantraText, lang);
}

