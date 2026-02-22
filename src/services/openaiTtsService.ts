import { unlockAudio } from './audioService';

// Типы для Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
      };
    };
  }
}

// Кэш в IndexedDB для хранения аудио
const DB_NAME = 'mnemo_audio_cache';
const DB_VERSION = 1;
const STORE_NAME = 'audio_cache';

interface CachedAudio {
  key: string;
  text: string;
  lang: string;
  audioBlob: Blob;
  timestamp: number;
}

// Инициализация IndexedDB
async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });
}

// Генерация ключа для кэша
function getCacheKey(text: string, lang: string): string {
  return `${lang}:${text}`;
}

// Получение из кэша
async function getFromCache(text: string, lang: string): Promise<Blob | null> {
  try {
    const db = await initDB();
    const key = getCacheKey(text, lang);
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.audioBlob) {
          // Проверяем, не устарел ли кэш (30 дней)
          const age = Date.now() - result.timestamp;
          const ageInDays = Math.floor(age / (24 * 60 * 60 * 1000));
          if (age < 30 * 24 * 60 * 60 * 1000) {
            console.log(`✅ [Cache] 💰 БЕСПЛАТНО! Найдено в кэше (возраст: ${ageInDays} дней, размер: ${(result.audioBlob.size / 1024).toFixed(2)} KB)`);
            console.log(`✅ [Cache] ⚡ Используется кэш - запрос к OpenAI API НЕ выполняется`);
            resolve(result.audioBlob);
          } else {
            console.log(`🗑️ [Cache] Запись устарела (возраст: ${ageInDays} дней, максимум: 30 дней)`);
            console.log(`💰 [Cache] Потребуется новый запрос к OpenAI API (платно)`);
            resolve(null);
          }
        } else {
          console.log('❌ [Cache] Не найдено в кэше');
          console.log(`💰 [Cache] Потребуется новый запрос к OpenAI API (платно)`);
          resolve(null);
        }
      };
      request.onerror = () => {
        console.error('❌ [Cache] Read error:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.warn('❌ [Cache] Read error:', error);
    return null;
  }
}

// Сохранение в кэш
async function saveToCache(text: string, lang: string, audioBlob: Blob): Promise<void> {
  try {
    const db = await initDB();
    const key = getCacheKey(text, lang);
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put({
        key,
        text,
        lang,
        audioBlob,
        timestamp: Date.now(),
      });
      request.onsuccess = () => {
        console.log(`💾 [Cache] ✅ Сохранено в кэш (размер: ${(audioBlob.size / 1024).toFixed(2)} KB)`);
      console.log(`💾 [Cache] 💰 Следующий раз это аудио будет БЕСПЛАТНЫМ (из кэша)`);
        resolve();
      };
      request.onerror = () => {
        console.error('❌ [Cache] Write error:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.warn('❌ [Cache] Write error:', error);
  }
}

// Воспроизведение аудио из Blob
async function playAudioBlob(audioBlob: Blob): Promise<void> {
  console.log('🔓 [Audio Playback] Unlocking audio...');
  await unlockAudio();
  console.log('✅ [Audio Playback] Audio unlocked');
  
  const audioUrl = URL.createObjectURL(audioBlob);
  console.log('🎵 [Audio Playback] Created object URL, creating Audio element...');
  const audio = new Audio(audioUrl);
  
  return new Promise((resolve, reject) => {
    audio.onloadedmetadata = () => {
      console.log('✅ [Audio Playback] Audio metadata loaded, duration:', audio.duration, 'seconds');
    };
    
    audio.oncanplay = () => {
      console.log('✅ [Audio Playback] Audio can play');
    };
    
    audio.onplay = () => {
      console.log('▶️ [Audio Playback] Audio started playing');
    };
    
    audio.onended = () => {
      console.log('✅ [Audio Playback] Audio playback completed');
      URL.revokeObjectURL(audioUrl);
      resolve();
    };
    
    audio.onerror = (error) => {
      console.error('❌ [Audio Playback] Audio playback error:', error);
      console.error('❌ [Audio Playback] Audio error details:', {
        error: audio.error,
        code: audio.error?.code,
        message: audio.error?.message
      });
      URL.revokeObjectURL(audioUrl);
      reject(new Error(`Audio playback failed: ${audio.error?.message || 'Unknown error'}`));
    };
    
    console.log('▶️ [Audio Playback] Attempting to play audio...');
    audio.play().then(() => {
      console.log('✅ [Audio Playback] Play() promise resolved');
    }).catch((playError) => {
      console.error('❌ [Audio Playback] Play() promise rejected:', playError);
      URL.revokeObjectURL(audioUrl);
      reject(playError);
    });
  });
}

// Проверка, находимся ли мы в Telegram WebView
function isTelegramWebView(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
}

// Получение аудио от OpenAI через прокси (для Telegram) или напрямую (для браузера)
async function fetchOpenAITTS(text: string, lang: 'de' | 'ru'): Promise<Blob> {
  const isTelegram = isTelegramWebView();
  
  console.log('🔑 [OpenAI TTS] Environment:', {
    isTelegram,
    userAgent: navigator.userAgent.substring(0, 50)
  });

  // В Telegram WebView используем прокси через Netlify Function
  // Но если прокси недоступен (404), используем прямой запрос
  if (isTelegram) {
    console.log('📡 [OpenAI TTS] Используется прокси (обнаружен Telegram WebView)...');
    console.log('💰 [OpenAI TTS] ⚠️ ПЛАТНО! Выполняется запрос к OpenAI API через прокси');
    
    try {
      // Определяем URL прокси (используем относительный путь для Netlify)
      const proxyUrl = '/.netlify/functions/openai-tts-proxy';
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          lang,
          model: 'tts-1',
          voice: 'nova',
          speed: 1.0,
        }),
      });

      console.log('📥 [OpenAI TTS Proxy] Response status:', response.status, response.statusText);

      // Если прокси недоступен (404), используем прямой запрос
      if (response.status === 404) {
        console.warn('⚠️ [OpenAI TTS] Прокси недоступен (404), переключаемся на прямой запрос...');
        console.warn('⚠️ [OpenAI TTS] Это может не работать в Telegram WebView из-за CORS');
        // Продолжаем выполнение - упадет на прямой запрос ниже
        throw new Error('Proxy not available (404)');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ [OpenAI TTS Proxy] API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`OpenAI TTS proxy failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      // Конвертируем base64 обратно в Blob
      const audioBase64 = data.audio;
      const audioBytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
      const blob = new Blob([audioBytes], { type: data.contentType || 'audio/mpeg' });
      
      console.log('✅ [OpenAI TTS Proxy] Audio blob received:', {
        size: `${(blob.size / 1024).toFixed(2)} KB`,
        type: blob.type
      });
      
      return blob;
    } catch (error: any) {
      // Если прокси недоступен (404, сетевая ошибка и т.д.), используем прямой запрос
      console.warn('⚠️ [OpenAI TTS] Прокси недоступен, переключаемся на прямой запрос к OpenAI API');
      console.warn('⚠️ [OpenAI TTS] Ошибка прокси:', error.message || error);
      // Продолжаем выполнение - код ниже сделает прямой запрос к OpenAI API
    }
  }

  // В обычном браузере используем прямой запрос к OpenAI API
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  console.log('🔑 [OpenAI TTS] Checking API key...', {
    hasKey: !!apiKey,
    keyLength: apiKey ? apiKey.length : 0
  });
  
  if (!apiKey) {
    const errorMsg = 'OpenAI API key not found. Please set VITE_OPENAI_API_KEY in .env file or Netlify environment variables';
    console.error('❌ [OpenAI TTS]', errorMsg);
    throw new Error(errorMsg);
  }

  console.log('💰 [OpenAI TTS] ⚠️ ПЛАТНО! Отправка прямого запроса к OpenAI API...', {
    text: text.substring(0, 50) + '...',
    lang,
    model: 'tts-1',
    voice: 'nova'
  });
  console.log('💰 [OpenAI TTS] Это стоит денег - убедитесь, что это не кэшированное аудио');

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1', // Используем стандартную модель для экономии
        input: text,
        voice: 'nova', // Качественный голос (можно изменить на 'onyx' для мужского)
        language: lang === 'de' ? 'de' : 'ru',
        speed: 1.0, // Скорость речи (0.25-4.0)
      }),
    });

    console.log('📥 [OpenAI TTS] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [OpenAI TTS] API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`OpenAI TTS failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const blob = await response.blob();
    console.log('✅ [OpenAI TTS] Audio blob received:', {
      size: `${(blob.size / 1024).toFixed(2)} KB`,
      type: blob.type
    });
    return blob;
  } catch (error) {
    console.error('❌ [OpenAI TTS] Fetch error:', error);
    throw error;
  }
}

// Предзагрузка аудио в кэш (без воспроизведения) — для быстрого старта при клике
export async function preloadTextForTTS(text: string, lang: 'de' | 'ru' = 'de'): Promise<void> {
  try {
    const cached = await getFromCache(text, lang);
    if (cached) return; // уже в кэше
    const blob = await fetchOpenAITTS(text, lang);
    await saveToCache(text, lang, blob);
  } catch {
    // Игнорируем ошибки предзагрузки
  }
}

// Основная функция воспроизведения с кэшированием
export async function playTextWithOpenAITTS(
  text: string, 
  lang: 'de' | 'ru' = 'de'
): Promise<void> {
  console.log('🔊 [TTS Engine: OpenAI] Starting playback for:', text.substring(0, 50));
  
  try {
    // Проверяем кэш
    console.log('🔍 [Cache] Проверка кэша для:', text.substring(0, 30) + '...');
    const cachedAudio = await getFromCache(text, lang);
    if (cachedAudio) {
      console.log('✅ [TTS Engine: OpenAI] 💰 БЕСПЛАТНО! Используется кэш из IndexedDB');
      console.log('✅ [TTS Engine: OpenAI] ⚡ Запрос к OpenAI API НЕ выполняется - экономия средств!');
      await playAudioBlob(cachedAudio);
      return;
    }
    
    // Если нет в кэше, получаем от OpenAI
    console.log('💰 [TTS Engine: OpenAI] ⚠️ ПЛАТНО! Не найдено в кэше, запрос к OpenAI API...');
    console.log('💰 [TTS Engine: OpenAI] Выполняется запрос (model: tts-1, voice: nova) - это стоит денег');
    const audioBlob = await fetchOpenAITTS(text, lang);
    
    // Сохраняем в кэш
    await saveToCache(text, lang, audioBlob);
    console.log('✅ [TTS Engine: OpenAI] 💾 Аудио сохранено в кэш для будущего использования');
    console.log('✅ [TTS Engine: OpenAI] 💰 Следующий раз будет БЕСПЛАТНО (из кэша)!');
    
    // Воспроизводим
    console.log('▶️ [TTS Engine: OpenAI] Starting playback...');
    await playAudioBlob(audioBlob);
    console.log('✅ [TTS Engine: OpenAI] Playback completed successfully');
  } catch (error) {
    console.error('❌ [TTS Engine: OpenAI] Error in playTextWithOpenAITTS:', error);
    throw error;
  }
}

