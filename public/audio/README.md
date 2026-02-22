# Структура WAV файлов для озвучки

## Формат файлов

### Слова (Words)
Путь: `/audio/words/{topicId}/{wordId}.wav`

Примеры:
- `/audio/words/doctor-visit/antibiotikum.wav`
- `/audio/words/doctor-visit/magen.wav`

### Мантры (Mantras)
Путь: `/audio/mantras/{topicId}/{mantraId}.wav`

Примеры:
- `/audio/mantras/doctor-visit/termin-vereinbaren.wav`
- `/audio/mantras/doctor-visit/starke-schmerzen.wav`

## Как добавить файлы

1. Запишите или скачайте WAV файлы для каждого слова/мантры
2. Назовите файлы по ID из `src/constants.ts`
3. Поместите файлы в соответствующие папки:
   - Слова → `public/audio/words/{topicId}/`
   - Мантры → `public/audio/mantras/{topicId}/`

## ID файлов

Список всех ID можно найти в `src/constants.ts`:
- `words[].id` - ID для слов
- `mantras[].id` - ID для мантр

## Формат WAV

Рекомендуемые параметры для WAV файлов:
- Формат: WAV (PCM)
- Частота дискретизации: 22050 Hz или 44100 Hz
- Битность: 16-bit
- Каналы: моно (1 канал) или стерео (2 канала)

