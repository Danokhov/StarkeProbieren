# Как проверить, работает ли кэширование аудио

## 🔍 Быстрая проверка в консоли

Откройте консоль браузера (F12) и нажмите на кнопку аудио. Вы увидите один из двух сценариев:

### ✅ Сценарий 1: Используется кэш (БЕСПЛАТНО)

```
🔍 [Cache] Проверка кэша для: Ich bin zu Hause gewesen...
✅ [Cache] 💰 БЕСПЛАТНО! Найдено в кэше (возраст: 0 дней, размер: 45.23 KB)
✅ [Cache] ⚡ Используется кэш - запрос к OpenAI API НЕ выполняется
✅ [TTS Engine: OpenAI] 💰 БЕСПЛАТНО! Используется кэш из IndexedDB
✅ [TTS Engine: OpenAI] ⚡ Запрос к OpenAI API НЕ выполняется - экономия средств!
```

**Это означает:** Аудио уже было загружено ранее и сохранено в кэш. Запрос к OpenAI API **НЕ выполняется** - это **БЕСПЛАТНО**! 💰

### 💰 Сценарий 2: Новый запрос (ПЛАТНО)

```
🔍 [Cache] Проверка кэша для: Ich bin zu Hause gewesen...
❌ [Cache] Не найдено в кэше
💰 [Cache] Потребуется новый запрос к OpenAI API (платно)
💰 [TTS Engine: OpenAI] ⚠️ ПЛАТНО! Не найдено в кэше, запрос к OpenAI API...
💰 [TTS Engine: OpenAI] Выполняется запрос (model: tts-1, voice: nova) - это стоит денег
📡 [OpenAI TTS] Используется прокси (обнаружен Telegram WebView)...
💰 [OpenAI TTS] ⚠️ ПЛАТНО! Выполняется запрос к OpenAI API через прокси
✅ [OpenAI TTS Proxy] Audio blob received: {size: "45.23 KB", type: "audio/mpeg"}
💾 [Cache] ✅ Сохранено в кэш (размер: 45.23 KB)
💾 [Cache] 💰 Следующий раз это аудио будет БЕСПЛАТНЫМ (из кэша)!
✅ [TTS Engine: OpenAI] 💾 Аудио сохранено в кэш для будущего использования
✅ [TTS Engine: OpenAI] 💰 Следующий раз будет БЕСПЛАТНО (из кэша)!
```

**Это означает:** Аудио не было в кэше, выполнен запрос к OpenAI API. Это **ПЛАТНО**, но аудио сохранено в кэш, и **следующий раз будет БЕСПЛАТНО**.

---

## 📊 Проверка кэша в DevTools

### Шаг 1: Откройте DevTools
- Нажмите `F12` или `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)

### Шаг 2: Перейдите в Application
- Вкладка **Application** (или **Приложение**)

### Шаг 3: Откройте IndexedDB
- В левом меню найдите **IndexedDB**
- Разверните → `mnemo_audio_cache` → `audio_cache`

### Шаг 4: Просмотрите записи
- Вы увидите все закэшированные аудио
- Каждая запись содержит:
  - `key`: ключ кэша (формат: `de:текст` или `ru:текст`)
  - `text`: текст, который был озвучен
  - `lang`: язык (`de` или `ru`)
  - `audioBlob`: само аудио (Blob)
  - `timestamp`: время сохранения

### Шаг 5: Проверьте размер кэша
- В консоли выполните:
```javascript
// Подсчет размера кэша
(async () => {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('mnemo_audio_cache', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  const transaction = db.transaction(['audio_cache'], 'readonly');
  const store = transaction.objectStore('audio_cache');
  const request = store.getAll();
  
  request.onsuccess = () => {
    const items = request.result;
    let totalSize = 0;
    items.forEach(item => {
      totalSize += item.audioBlob.size;
    });
    console.log(`📊 Кэш содержит ${items.length} аудио файлов`);
    console.log(`📊 Общий размер кэша: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📊 Средний размер файла: ${(totalSize / items.length / 1024).toFixed(2)} KB`);
  };
})();
```

---

## 🧹 Очистка кэша

Если нужно очистить кэш:

### Способ 1: Через DevTools
1. Application → IndexedDB → `mnemo_audio_cache` → `audio_cache`
2. Правый клик → **Clear** или **Delete**

### Способ 2: Через консоль
```javascript
// Очистка всего кэша
indexedDB.deleteDatabase('mnemo_audio_cache');
console.log('✅ Кэш очищен');
```

**⚠️ Внимание:** После очистки кэша все аудио нужно будет загрузить заново (платно).

---

## 💡 Советы по экономии

1. **Первый запуск:** Все аудио загружается в кэш (платно)
2. **Последующие запуски:** Все аудио берется из кэша (бесплатно)
3. **Кэш хранится 30 дней:** После этого аудио нужно загрузить заново
4. **Кэш привязан к браузеру:** Разные браузеры/устройства имеют свой кэш

---

## 📈 Статистика использования

В консоли вы всегда увидите:
- `💰 БЕСПЛАТНО!` - используется кэш, запрос к API не выполняется
- `💰 ПЛАТНО!` - выполняется запрос к OpenAI API

**Правило:** Если видите `💰 БЕСПЛАТНО!` - вы не платите. Если видите `💰 ПЛАТНО!` - это стоит денег, но аудио сохраняется в кэш для будущего использования.
