# Структура прогресса пользователя в Firebase

## Формат данных в Firebase

В коллекции `users` для каждого пользователя хранится документ с полем `progress`:

```javascript
progress: {
  "job-interview": ["video", "text-gaps", "band-story", "mantras", "verb-form-flashcards", "exercises"],
  "module-3": ["video", "band-story", "mantras", "exercises"],
  "module-4": ["video", "flashcards", "verb-forms"]
}
```

### Структура:
- **Ключ** = `topicId` (ID модуля, например: `"module-3"`, `"job-interview"`)
- **Значение** = массив строк с ID пройденных разделов

## Возможные разделы (moduleId)

Список всех возможных разделов:

1. **`video`** - Видео/Ассоциации
2. **`band-story`** - История банды
3. **`flashcards`** - Карточки (обычные слова)
4. **`verb-form-flashcards`** - Карточки 3 формы (формы глаголов)
5. **`mantras`** - Мантры
6. **`exercises`** - Пробелы в мантрах
7. **`verb-forms`** - Заполнение слов
8. **`text-gaps`** - Пробелы в тексте

## Как вычислить прогресс по модулю

### Шаг 1: Определить доступные разделы модуля

Для каждого модуля нужно проверить наличие контента:

```javascript
function getAvailableModules(topic) {
  const modules = [];
  
  if (topic.videoUrl) modules.push('video');
  if (topic.dialog?.text) modules.push('band-story');
  if (topic.words && topic.words.length > 0 && topic.id !== 'house-cleaning') 
    modules.push('flashcards');
  if (topic.verbFormCards && topic.verbFormCards.length > 0 && topic.id !== 'house-cleaning') 
    modules.push('verb-form-flashcards');
  if (topic.mantras && topic.mantras.length > 0) 
    modules.push('mantras');
  if (topic.mantraGapExercises && topic.mantraGapExercises.length > 0) 
    modules.push('exercises');
  if (topic.verbFormExercises && topic.verbFormExercises.length > 0 && topic.id !== 'house-cleaning') 
    modules.push('verb-forms');
  if (topic.textGapExercises && topic.textGapExercises.length > 0) 
    modules.push('text-gaps');
  
  return modules;
}
```

### Шаг 2: Получить пройденные разделы

Из Firebase:
```javascript
const completedModules = progress[topicId] || [];
// Например: ["video", "text-gaps", "band-story", "mantras"]
```

### Шаг 3: Вычислить процент прогресса

```javascript
function calculateProgress(topicId, topic, progress) {
  // 1. Получаем доступные разделы
  const availableModules = getAvailableModules(topic);
  
  // 2. Получаем пройденные разделы
  const completedModules = progress[topicId] || [];
  
  // 3. Считаем сколько пройдено
  const completedCount = completedModules.filter(moduleId => 
    availableModules.includes(moduleId)
  ).length;
  
  // 4. Вычисляем процент
  const totalModules = availableModules.length;
  const percentage = totalModules > 0 
    ? Math.round((completedCount / totalModules) * 100) 
    : 0;
  
  return {
    completed: completedCount,
    total: totalModules,
    percentage: percentage,
    completedModules: completedModules,
    availableModules: availableModules
  };
}
```

## Пример расчета

### Для модуля `job-interview`:

**Данные из Firebase:**
```javascript
progress["job-interview"] = ["video", "text-gaps", "band-story", "mantras", "verb-form-flashcards", "exercises"]
```

**Доступные разделы** (из структуры модуля):
- `video` ✅ (есть videoUrl)
- `band-story` ✅ (есть dialog.text)
- `text-gaps` ✅ (есть textGapExercises)
- `mantras` ✅ (есть mantras)
- `verb-form-flashcards` ✅ (есть verbFormCards)
- `exercises` ✅ (есть mantraGapExercises)

**Результат:**
- Всего разделов: 6
- Пройдено: 6
- Прогресс: **100%** ✅

### Для модуля `module-3`:

**Данные из Firebase:**
```javascript
progress["module-3"] = ["video", "band-story", "mantras"]
```

**Доступные разделы** (из структуры модуля):
- `video` ✅
- `band-story` ✅
- `mantras` ✅
- `exercises` ✅
- `verb-forms` ✅
- `verb-form-flashcards` ✅

**Результат:**
- Всего разделов: 6
- Пройдено: 3
- Прогресс: **50%**

## Важные замечания

1. **Модуль `house-cleaning`** - специальный случай:
   - Не имеет разделов `flashcards`, `verb-form-flashcards`, `verb-forms`

2. **Раздел `exercises`** - имеет дополнительную логику:
   - Прогресс считается не просто как "пройден/не пройден"
   - Учитывается процент правильных ответов из `itemProgress[topicId]["exercises"]`

3. **Раздел `mantras`** (для модулей 3+):
   - Также может учитывать прогресс по временам (Präsens, Präteritum, Partizip II)

## Детальный прогресс (itemProgress)

Помимо общего прогресса, есть детальный прогресс по каждому упражнению:

```javascript
itemProgress: {
  "module-4": {
    "exercises": {
      0: true,  // Упражнение 0 пройдено правильно
      1: false, // Упражнение 1 неправильно
      2: true   // Упражнение 2 пройдено правильно
    },
    "verb-forms": {
      0: true,
      1: true,
      2: false
    }
  }
}
```

Это используется для:
- Подсчета процента правильных ответов в разделе `exercises`
- Сохранения прогресса в упражнении "Заполнение слов"
- Определения, какие упражнения нужно повторить
