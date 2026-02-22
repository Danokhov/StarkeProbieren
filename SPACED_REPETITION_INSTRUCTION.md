# 📚 Инструкция по интервальному повторению (Spaced Repetition)

## 🎯 Обзор

Эта инструкция описывает реализацию системы интервального повторения на основе модифицированного алгоритма SM-2 с **фиксированными интервалами**. Система предназначена для изучения карточек (например, глаголов) и автоматически определяет, когда показывать карточку для повторения.

---

## 📊 Структура данных

### Интерфейс данных карточки

```typescript
interface SpacedRepetitionData {
  // Уникальный ID карточки (например: 'fahren-card-forms')
  cardId: string;
  
  // Дата следующего повторения (timestamp в миллисекундах)
  nextReview: number;
  
  // Коэффициент легкости (Ease Factor) - от 1.3 до 2.5
  // Начальное значение: 2.5
  // В данной реализации не используется для расчета интервалов, но хранится для совместимости
  easeFactor: number;
  
  // Текущий интервал повторения (в днях)
  interval: number;
  
  // Количество последовательных правильных ответов
  repetitions: number;
  
  // Дата последнего повторения (timestamp в миллисекундах)
  lastReview: number;
  
  // Количество успешных повторений всего
  successCount: number;
  
  // Количество неуспешных повторений всего
  failCount: number;
}
```

### Хранение данных

```typescript
// Все карточки пользователя хранятся в объекте:
interface SpacedRepetitionProgress {
  [cardId: string]: SpacedRepetitionData;
}

// Пример:
const progress: SpacedRepetitionProgress = {
  "fahren-card-forms": {
    cardId: "fahren-card-forms",
    nextReview: 1704124800000,  // timestamp
    easeFactor: 2.5,
    interval: 7,                 // дней
    repetitions: 4,
    lastReview: 1704038400000,   // timestamp
    successCount: 4,
    failCount: 0
  },
  "kommen-card-forms": {
    cardId: "kommen-card-forms",
    nextReview: 1704038400000,
    easeFactor: 2.5,
    interval: 1,
    repetitions: 2,
    lastReview: 1703952000000,
    successCount: 2,
    failCount: 0
  }
  // ... другие карточки
};
```

---

## 🔧 Основные функции

### 1. Инициализация новой карточки

Когда карточка впервые добавляется в систему:

```typescript
function initialize(cardId: string): SpacedRepetitionData {
  const now = Date.now();
  return {
    cardId: cardId,
    nextReview: now,              // Сразу готово к повторению
    easeFactor: 2.5,              // Начальный Ease Factor
    interval: 0,                  // Первое повторение через 0 дней (сразу)
    repetitions: 0,              // Еще не было повторений
    lastReview: now,             // Дата инициализации
    successCount: 0,             // Нет успешных повторений
    failCount: 0                 // Нет неуспешных повторений
  };
}
```

**Использование:**
```typescript
const newCard = initialize("fahren-card-forms");
progress["fahren-card-forms"] = newCard;
```

---

### 2. Обновление после ответа пользователя

После того, как пользователь ответил на карточку (правильно или неправильно):

```typescript
function update(
  data: SpacedRepetitionData, 
  isCorrect: boolean
): SpacedRepetitionData {
  const now = Date.now();
  const updated = { ...data, lastReview: now };
  
  if (isCorrect) {
    // ✅ ПРАВИЛЬНЫЙ ОТВЕТ
    
    updated.successCount = (updated.successCount || 0) + 1;
    updated.repetitions = (updated.repetitions || 0) + 1;
    
    // ФИКСИРОВАННЫЕ ИНТЕРВАЛЫ ПОВТОРЕНИЯ:
    // 1-е правильное повторение → 2-е: через 1 день
    // 2-е правильное повторение → 3-е: через 1 день
    // 3-е правильное повторение → 4-е: через 3 дня
    // 4-е правильное повторение → 5-е: через 7 дней
    // 5-е правильное повторение → 6-е: через 14 дней
    // 6-е правильное повторение → 7-е: через 30 дней
    // 7-е и далее: через 90 дней
    
    if (updated.repetitions === 1) {
      updated.interval = 1;        // 1 день
    } else if (updated.repetitions === 2) {
      updated.interval = 1;        // 1 день
    } else if (updated.repetitions === 3) {
      updated.interval = 3;        // 3 дня
    } else if (updated.repetitions === 4) {
      updated.interval = 7;        // 7 дней
    } else if (updated.repetitions === 5) {
      updated.interval = 14;       // 14 дней
    } else if (updated.repetitions === 6) {
      updated.interval = 30;       // 30 дней (1 месяц)
    } else {
      updated.interval = 90;       // 90 дней (3 месяца)
    }
    
    updated.easeFactor = 2.5;      // Оставляем для совместимости
    
    // Устанавливаем дату следующего повторения
    updated.nextReview = now + (updated.interval * 24 * 60 * 60 * 1000);
    
  } else {
    // ❌ НЕПРАВИЛЬНЫЙ ОТВЕТ
    
    updated.failCount = (updated.failCount || 0) + 1;
    
    // СБРАСЫВАЕМ ПРОГРЕСС: начинаем заново
    updated.repetitions = 0;      // Сбрасываем счетчик
    updated.interval = 0;         // Повторить через 0 дней (сразу)
    updated.easeFactor = 2.5;     // Сбрасываем Ease Factor
    
    // Следующее повторение - сразу
    updated.nextReview = now;     // Сразу готово к повторению
  }
  
  return updated;
}
```

**Использование:**
```typescript
// Пользователь ответил правильно
const cardData = progress["fahren-card-forms"];
const updatedData = update(cardData, true);
progress["fahren-card-forms"] = updatedData;

// Пользователь ответил неправильно
const cardData2 = progress["kommen-card-forms"];
const updatedData2 = update(cardData2, false);
progress["kommen-card-forms"] = updatedData2;
```

---

### 3. Определение карточек, готовых к повторению

Получить список карточек, которые нужно повторить прямо сейчас:

```typescript
function getCardsDueForReview(
  progress: SpacedRepetitionProgress,
  allCards: Array<{ id: string }>
): string[] {
  const now = Date.now();
  const dueCards: string[] = [];
  
  for (const card of allCards) {
    const cardData = progress[card.id];
    
    // Показываем ТОЛЬКО карточки, которые уже добавлены в систему
    // (есть в progress) И наступила дата следующего повторения
    if (cardData && cardData.nextReview <= now) {
      dueCards.push(card.id);
    }
  }
  
  return dueCards;
}
```

**Использование:**
```typescript
const allCards = [
  { id: "fahren-card-forms" },
  { id: "kommen-card-forms" },
  { id: "gehen-card-forms" }
];

const dueCards = getCardsDueForReview(progress, allCards);
// Вернет: ["fahren-card-forms", "kommen-card-forms"]
// (если их nextReview <= текущее время)
```

---

### 4. Получение новых карточек (для изучения)

Получить карточки, которые еще не были добавлены в систему:

```typescript
function getNewCards(
  progress: SpacedRepetitionProgress,
  allCards: Array<{ id: string }>,
  maxNew: number = 10
): string[] {
  const newCards: string[] = [];
  
  for (const card of allCards) {
    if (newCards.length >= maxNew) break;
    
    if (!progress[card.id]) {
      // Карточка еще не изучалась (нет в progress)
      newCards.push(card.id);
    }
  }
  
  return newCards;
}
```

**Использование:**
```typescript
const newCards = getNewCards(progress, allCards, 10);
// Вернет максимум 10 новых карточек, которых еще нет в progress
```

---

### 5. Статистика

Получить статистику по всем карточкам:

```typescript
function getStatistics(
  progress: SpacedRepetitionProgress
): {
  totalCards: number;      // Всего карточек в системе
  newCards: number;        // Новых карточек (repetitions === 0)
  dueToday: number;        // Готовых к повторению сегодня
  mastered: number;        // Освоенных (interval > 30 дней)
  successRate: number;     // Процент успешных повторений
} {
  const now = Date.now();
  const stats = {
    totalCards: Object.keys(progress).length,
    newCards: 0,
    dueToday: 0,
    mastered: 0,
    successRate: 0
  };
  
  let totalAttempts = 0;
  let totalSuccesses = 0;
  
  for (const cardData of Object.values(progress)) {
    // Новые карточки (еще не было повторений)
    if (cardData.repetitions === 0) {
      stats.newCards++;
    }
    
    // Готовые к повторению
    if (cardData.nextReview <= now) {
      stats.dueToday++;
    }
    
    // Освоенные (интервал > 30 дней)
    if (cardData.interval > 30) {
      stats.mastered++;
    }
    
    // Подсчет успешности
    const attempts = (cardData.successCount || 0) + (cardData.failCount || 0);
    totalAttempts += attempts;
    totalSuccesses += (cardData.successCount || 0);
  }
  
  if (totalAttempts > 0) {
    stats.successRate = Math.round((totalSuccesses / totalAttempts) * 100);
  }
  
  return stats;
}
```

**Использование:**
```typescript
const stats = getStatistics(progress);
console.log(`Всего карточек: ${stats.totalCards}`);
console.log(`К повторению: ${stats.dueToday}`);
console.log(`Освоено: ${stats.mastered}`);
console.log(`Успешность: ${stats.successRate}%`);
```

---

## 🔄 Алгоритм работы системы

### Шаг 1: Инициализация

1. Загрузить все карточки из базы данных
2. Загрузить `progress` (данные интервального повторения) из хранилища
3. Определить карточки, готовые к повторению

```typescript
// Псевдокод
const allCards = loadAllCards();                    // Все карточки
const progress = loadProgress();                    // Данные пользователя
const dueCards = getCardsDueForReview(progress, allCards);
const newCards = getNewCards(progress, allCards, 10);
```

---

### Шаг 2: Формирование сессии

1. Сначала показываем карточки, готовые к повторению (`dueCards`)
2. Затем добавляем новые карточки (`newCards`, максимум 10)
3. Перемешиваем порядок для разнообразия

```typescript
// Псевдокод
let sessionCards = [...dueCards];
sessionCards = sessionCards.concat(newCards.slice(0, 10));
sessionCards = shuffle(sessionCards);  // Перемешать
```

---

### Шаг 3: Показ карточки

1. Показать карточку пользователю
2. Дождаться ответа ("Знаю" / "Не знаю")
3. Обновить данные карточки через `update()`
4. Сохранить обновленные данные

```typescript
// Псевдокод
const currentCard = sessionCards[currentIndex];
showCard(currentCard);

// Пользователь нажал "Знаю"
const cardData = progress[currentCard.id];
const updated = update(cardData, true);
progress[currentCard.id] = updated;
saveProgress(progress);

// Переход к следующей карточке
currentIndex++;
```

---

### Шаг 4: Завершение сессии

После прохождения всех карточек в сессии:
- Обновить статистику
- Показать результаты
- Сохранить все изменения

---

## 📅 Таблица интервалов повторения

| Повторение | Интервал | Когда показывать |
|------------|----------|------------------|
| 1-е (первое) | 0 дней | Сразу после добавления |
| 2-е | 1 день | Через 1 день после 1-го |
| 3-е | 1 день | Через 1 день после 2-го |
| 4-е | 3 дня | Через 3 дня после 3-го |
| 5-е | 7 дней | Через 7 дней после 4-го |
| 6-е | 14 дней | Через 14 дней после 5-го |
| 7-е | 30 дней | Через 30 дней после 6-го |
| 8-е и далее | 90 дней | Через 90 дней после предыдущего |

**Важно:** При неправильном ответе счетчик `repetitions` сбрасывается в 0, и карточка показывается сразу (интервал = 0).

---

## 💾 Хранение данных

### Варианты хранения:

1. **Локальное хранилище (localStorage, IndexedDB)**
   - Для однопользовательского приложения
   - Простая реализация

2. **База данных (Firebase, PostgreSQL, MongoDB)**
   - Для многопользовательского приложения
   - Синхронизация между устройствами

### Структура в базе данных:

```json
{
  "users": {
    "user123": {
      "spacedRepetition": {
        "fahren-card-forms": {
          "cardId": "fahren-card-forms",
          "nextReview": 1704124800000,
          "easeFactor": 2.5,
          "interval": 7,
          "repetitions": 4,
          "lastReview": 1704038400000,
          "successCount": 4,
          "failCount": 0
        }
      }
    }
  }
}
```

---

## 🎨 Пример полной реализации (TypeScript/JavaScript)

```typescript
// spacedRepetition.ts

export interface SpacedRepetitionData {
  cardId: string;
  nextReview: number;
  easeFactor: number;
  interval: number;
  repetitions: number;
  lastReview: number;
  successCount: number;
  failCount: number;
}

export interface SpacedRepetitionProgress {
  [cardId: string]: SpacedRepetitionData;
}

export class SpacedRepetitionSM2 {
  private static readonly INITIAL_EASE_FACTOR = 2.5;
  
  static initialize(cardId: string): SpacedRepetitionData {
    const now = Date.now();
    return {
      cardId,
      nextReview: now,
      easeFactor: this.INITIAL_EASE_FACTOR,
      interval: 0,
      repetitions: 0,
      lastReview: now,
      successCount: 0,
      failCount: 0
    };
  }
  
  static update(
    data: SpacedRepetitionData, 
    isCorrect: boolean
  ): SpacedRepetitionData {
    const now = Date.now();
    const updated = { ...data, lastReview: now };
    
    if (isCorrect) {
      updated.successCount = (updated.successCount || 0) + 1;
      updated.repetitions = (updated.repetitions || 0) + 1;
      
      // Фиксированные интервалы
      if (updated.repetitions === 1) {
        updated.interval = 1;
      } else if (updated.repetitions === 2) {
        updated.interval = 1;
      } else if (updated.repetitions === 3) {
        updated.interval = 3;
      } else if (updated.repetitions === 4) {
        updated.interval = 7;
      } else if (updated.repetitions === 5) {
        updated.interval = 14;
      } else if (updated.repetitions === 6) {
        updated.interval = 30;
      } else {
        updated.interval = 90;
      }
      
      updated.easeFactor = this.INITIAL_EASE_FACTOR;
      updated.nextReview = now + (updated.interval * 24 * 60 * 60 * 1000);
    } else {
      updated.failCount = (updated.failCount || 0) + 1;
      updated.repetitions = 0;
      updated.interval = 0;
      updated.easeFactor = this.INITIAL_EASE_FACTOR;
      updated.nextReview = now;
    }
    
    return updated;
  }
  
  static getCardsDueForReview(
    progress: SpacedRepetitionProgress,
    allCards: Array<{ id: string }>
  ): string[] {
    const now = Date.now();
    const dueCards: string[] = [];
    
    for (const card of allCards) {
      const cardData = progress[card.id];
      if (cardData && cardData.nextReview <= now) {
        dueCards.push(card.id);
      }
    }
    
    return dueCards;
  }
  
  static getNewCards(
    progress: SpacedRepetitionProgress,
    allCards: Array<{ id: string }>,
    maxNew: number = 10
  ): string[] {
    const newCards: string[] = [];
    
    for (const card of allCards) {
      if (newCards.length >= maxNew) break;
      if (!progress[card.id]) {
        newCards.push(card.id);
      }
    }
    
    return newCards;
  }
  
  static getStatistics(progress: SpacedRepetitionProgress) {
    const now = Date.now();
    const stats = {
      totalCards: Object.keys(progress).length,
      newCards: 0,
      dueToday: 0,
      mastered: 0,
      successRate: 0
    };
    
    let totalAttempts = 0;
    let totalSuccesses = 0;
    
    for (const cardData of Object.values(progress)) {
      if (cardData.repetitions === 0) stats.newCards++;
      if (cardData.nextReview <= now) stats.dueToday++;
      if (cardData.interval > 30) stats.mastered++;
      
      const attempts = (cardData.successCount || 0) + (cardData.failCount || 0);
      totalAttempts += attempts;
      totalSuccesses += (cardData.successCount || 0);
    }
    
    if (totalAttempts > 0) {
      stats.successRate = Math.round((totalSuccesses / totalAttempts) * 100);
    }
    
    return stats;
  }
}
```

---

## ✅ Ключевые особенности реализации

1. **Фиксированные интервалы** вместо динамических (как в классическом SM-2)
   - Проще для понимания и отладки
   - Предсказуемое поведение

2. **Сброс при ошибке**
   - При неправильном ответе карточка сбрасывается и показывается сразу
   - Счетчик `repetitions` обнуляется

3. **Только добавленные карточки**
   - Показываются только карточки, которые уже есть в `progress`
   - Новые карточки добавляются отдельно (максимум 10 за сессию)

4. **Статистика**
   - Отслеживание успешности
   - Подсчет освоенных карточек
   - Количество карточек к повторению

---

## 🚀 Быстрый старт

1. Скопируйте класс `SpacedRepetitionSM2` в ваш проект
2. Определите структуру ваших карточек (должен быть уникальный `id`)
3. При первом показе карточки инициализируйте её через `initialize()`
4. При ответе пользователя обновляйте через `update()`
5. Для получения карточек к повторению используйте `getCardsDueForReview()`
6. Сохраняйте `progress` после каждого изменения

---

## 📝 Примечания

- Все временные метки в **миллисекундах** (JavaScript `Date.now()`)
- Интервалы в **днях**, конвертируются в миллисекунды: `дни × 24 × 60 × 60 × 1000`
- Ease Factor в данной реализации не используется для расчета интервалов, но хранится для совместимости
- Система работает только с карточками, которые уже добавлены в `progress`

---

**Готово!** Теперь вы можете реализовать интервальное повторение в любом приложении, следуя этой инструкции.
