// Используем Google Text-to-Speech API вместо Gemini API

let sharedAudioContext: AudioContext | null = null;

/**
 * Определяет, является ли устройство мобильным
 */
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (typeof window !== 'undefined' && 'ontouchstart' in window);
}

/**
 * Важно для Telegram: AudioContext должен быть разблокирован ПРЯМЫМ действием пользователя.
 */
export async function unlockAudio() {
  if (!sharedAudioContext) {
    // На мобильных устройствах не указываем sampleRate, используем дефолтный
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
 * Воспроизведение MP3 из base64 (Google TTS возвращает MP3)
 */
async function playAudioFromBase64MP3(base64Data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Создаем data URL для MP3
      const audioUrl = `data:audio/mp3;base64,${base64Data}`;
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        console.log("✅ Audio playback ended (MP3)");
        resolve();
      };
      
      audio.onerror = (e) => {
        console.error("❌ Audio playback error (MP3):", e);
        reject(new Error("Audio playback failed"));
      };
      
      audio.play().then(() => {
        console.log("✅ Audio playback started (MP3)");
      }).catch((err) => {
        console.error("❌ Audio play() failed:", err);
        reject(err);
      });
    } catch (err) {
      console.error("❌ Error creating audio:", err);
      reject(err);
    }
  });
}

/**
 * Воспроизведение через HTML Audio элемент (лучше работает на мобильных)
 * Используется для PCM данных (старый формат Gemini)
 */
async function playAudioViaHTMLAudio(base64Data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Конвертируем base64 PCM в WAV
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Создаем WAV файл из PCM данных
      const sampleRate = 24000;
      const numChannels = 1;
      const bitsPerSample = 16;
      const dataInt16 = new Int16Array(bytes.buffer);
      const dataLength = dataInt16.length * 2;
      
      const wavBuffer = new ArrayBuffer(44 + dataLength);
      const view = new DataView(wavBuffer);
      
      // WAV заголовок
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + dataLength, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true);
      view.setUint16(32, numChannels * bitsPerSample / 8, true);
      view.setUint16(34, bitsPerSample, true);
      writeString(36, 'data');
      view.setUint32(40, dataLength, true);
      
      // Копируем PCM данные
      const dataView = new DataView(wavBuffer, 44);
      for (let i = 0; i < dataInt16.length; i++) {
        dataView.setInt16(i * 2, dataInt16[i], true);
      }
      
      // Создаем Blob и data URL
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);
      
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        console.log("✅ Audio playback ended (HTML Audio)");
        resolve();
      };
      
      audio.onerror = (e) => {
        URL.revokeObjectURL(audioUrl);
        console.error("❌ Audio playback error (HTML Audio):", e);
        reject(new Error("Audio playback failed"));
      };
      
      audio.play().then(() => {
        console.log("✅ Audio playback started (HTML Audio)");
      }).catch((err) => {
        URL.revokeObjectURL(audioUrl);
        console.error("❌ Audio play() failed:", err);
        reject(err);
      });
    } catch (err) {
      console.error("❌ Error creating audio:", err);
      reject(err);
    }
  });
}

/**
 * Воспроизведение через AudioContext (работает на десктопе)
 */
async function playAudioViaAudioContext(base64Data: string): Promise<void> {
  try {
    const ctx = await unlockAudio();
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Декодируем PCM данные
    const dataInt16 = new Int16Array(bytes.buffer);
    const frameCount = dataInt16.length;
    const sampleRate = ctx.sampleRate; // Используем sample rate контекста
    
    const audioBuffer = ctx.createBuffer(1, frameCount, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    
    return new Promise((resolve, reject) => {
      source.onended = () => {
        console.log("✅ Audio playback ended (AudioContext)");
        resolve();
      };
      source.start(0);
      console.log("✅ Audio playback started (AudioContext)");
    });
  } catch (err) {
    console.error("❌ Audio playback error (AudioContext):", err);
    throw err;
  }
}

/**
 * Универсальная функция воспроизведения аудио
 * На мобильных использует HTML Audio, на десктопе - AudioContext
 */
async function playAudio(base64Data: string): Promise<void> {
  const useHTMLAudio = isMobileDevice();
  console.log(`🔊 Playing audio using ${useHTMLAudio ? 'HTML Audio' : 'AudioContext'}`);
  
  try {
    if (useHTMLAudio) {
      await playAudioViaHTMLAudio(base64Data);
    } else {
      await playAudioViaAudioContext(base64Data);
    }
  } catch (err) {
    console.error("❌ Primary playback method failed, trying fallback...", err);
    // Fallback: пробуем другой метод
    try {
      if (useHTMLAudio) {
        await playAudioViaAudioContext(base64Data);
      } else {
        await playAudioViaHTMLAudio(base64Data);
      }
    } catch (fallbackErr) {
      console.error("❌ Fallback playback also failed:", fallbackErr);
      throw fallbackErr;
    }
  }
}

export const GeminiService = {
  async speak(text: string, lang: 'de' | 'ru') {
    console.log("🔊 GeminiService.speak called:", { text: text.substring(0, 50), lang });
    
    if (lang !== 'de') {
      console.log("⏭️ Skipping - language is not 'de'");
      return;
    }

    // Пытаемся разблокировать аудио при каждом вызове
    try {
      await unlockAudio();
      console.log("✅ AudioContext unlocked");
    } catch (e) {
      console.warn("⚠️ Audio unlock failed", e);
    }

    // Пробуем получить API ключ из разных источников (для совместимости с Vite и Netlify)
    const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY || "";
    
    // ДИАГНОСТИКА: детальная проверка API ключа
    console.log("🔑 API_KEY диагностика:", {
      exists: !!apiKey,
      length: apiKey?.length || 0,
      preview: apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}` : "MISSING",
      isString: typeof apiKey === 'string',
      isEmpty: apiKey === "",
      processEnv: typeof process !== 'undefined' ? 'defined' : 'undefined',
      importMetaEnv: typeof import.meta !== 'undefined' ? 'defined' : 'undefined',
      sources: {
        processEnv: !!process.env.API_KEY,
        importMetaEnv: !!(import.meta as any).env?.VITE_API_KEY
      }
    });
    
    if (!apiKey) {
      console.error("❌ API_KEY missing!");
      console.error("📋 Инструкции по исправлению:");
      console.error("1. Откройте Netlify Dashboard");
      console.error("2. Site settings > Environment variables");
      console.error("3. Убедитесь, что переменная называется точно 'API_KEY'");
      console.error("4. Scope должен быть 'All scopes' (Builds and Functions)");
      console.error("5. Пересоберите проект: Deploys > Trigger deploy > Clear cache and deploy");
      
      alert("❌ Ошибка: API ключ не найден.\n\nПроверьте:\n1. Настройки Netlify (Environment variables)\n2. Пересоберите проект после добавления переменной\n\nОткройте консоль для деталей.");
      return;
    }

    console.log("🚀 Начинаем запрос к Google Text-to-Speech API...");

    try {
      // Используем Google Cloud Text-to-Speech API
      const apiUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
      
      const requestBody = {
        input: { text: text },
        voice: {
          languageCode: 'de-DE',
          name: 'de-DE-Neural2-D', // Немецкий голос
          ssmlGender: 'NEUTRAL'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0.0
        }
      };
      
      console.log("📤 Отправляем запрос к Google TTS:", {
        textLength: text.length,
        voice: 'de-DE-Neural2-D',
        language: 'de-DE'
      });
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log("✅ Получен ответ от Google TTS API");

      const audioData = data.audioContent; // Base64 строка

      if (audioData) {
        console.log("✅ Audio data получен, длина:", audioData.length);
        // Google TTS возвращает MP3 в base64, нужно декодировать
        await playAudioFromBase64MP3(audioData);
        console.log("✅ Озвучка завершена успешно");
      } else {
        console.error("❌ No audio data in response", { data });
        throw new Error("API вернул пустой ответ. Попробуйте еще раз.");
      }
    } catch (error: any) {
      console.error("❌ Gemini TTS Full Error:", error);
      console.error("📋 Error details:", {
        name: error?.name,
        message: error?.message,
        status: error?.status,
        statusText: error?.statusText,
        code: error?.code,
        response: error?.response,
        stack: error?.stack?.split('\n').slice(0, 5)
      });
      
      // Обрабатываем ошибки
      const errStr = error.toString();
      const errMsg = error?.message || errStr;
      const status = error?.status || error?.response?.status;
      
      console.error("🔍 Error details for debugging:", {
        status,
        statusText: error?.statusText,
        message: errMsg,
        fullError: error
      });
      
      // Ошибка 429 - превышена квота API (Too Many Requests)
      if (status === 429 || errStr.includes("429") || errMsg.includes("429") || errStr.includes("quota") || errMsg.includes("quota") || errStr.includes("RESOURCE_EXHAUSTED")) {
        console.error("⛔ API Quota Exceeded (429) - лимит запросов исчерпан");
        console.warn("💡 Решения:\n1. Проверьте квоты на https://ai.dev/usage\n2. Подождите сброса квоты (обычно раз в день)\n3. Обновите план API на ai.google.dev");
        // Не показываем alert, так как это техническая проблема, а не ошибка пользователя
        // Просто тихо игнорируем, чтобы не прерывать работу приложения
        return;
      }
      
      // Ошибки 400/500 - тихо игнорируем, но логируем детально для отладки
      if (status === 400 || status === 500 || errStr.includes("400") || errStr.includes("500") || errMsg.includes("Bad Request")) {
        console.warn(`⚠️ Error ${status || '400/500'} occurred - this will be silently ignored to avoid user interruption`);
        return;
      }
      
      // Критичные ошибки (401, API ключ, OAuth) - показываем alert
      if (status === 401 || errStr.includes("401") || errMsg.includes("401") || 
          errStr.includes("API key") || errMsg.includes("API key") ||
          errStr.includes("UNAUTHENTICATED") || errMsg.includes("UNAUTHENTICATED") ||
          errStr.includes("OAuth2") || errMsg.includes("OAuth2") ||
          errStr.includes("CREDENTIALS_MISSING") || errMsg.includes("CREDENTIALS_MISSING")) {
        console.error("🔑 Ошибка авторизации - проверьте API ключ!");
        console.error("💡 Google Text-to-Speech API требует правильный API ключ с включенным Text-to-Speech API");
        console.error("💡 Проверьте:\n1. Что API ключ создан в Google Cloud Console\n2. Что включен Text-to-Speech API\n3. Что ключ имеет правильные ограничения");
        alert("❌ Ошибка авторизации API.\n\nПроверьте:\n1. Правильность API ключа в Netlify\n2. Что Text-to-Speech API включен в Google Cloud Console\n3. Что ключ имеет доступ к Text-to-Speech API\n4. Пересоберите проект");
        return;
      }

      // Для остальных ошибок логируем и завершаем без показа пользователю
      console.warn("⚠️ Unknown error occurred, silently ignoring:", errMsg);
      return;
    }
  }
};