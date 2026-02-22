/**
 * Сервис для интервального повторения (Spaced Repetition)
 * Использует алгоритм SM-2 (SuperMemo 2)
 */

export interface SpacedRepetitionData {
  // Уникальный ID карточки глагола (например: 'fahren-card-forms')
  cardId: string;
  
  // Дата следующего повторения (timestamp в миллисекундах)
  nextReview: number;
  
  // Коэффициент легкости (Ease Factor) - от 1.3 до 2.5
  // Начальное значение: 2.5
  // Увеличивается при правильных ответах, уменьшается при ошибках
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

export interface SpacedRepetitionProgress {
  [cardId: string]: SpacedRepetitionData;
}

/**
 * Алгоритм SM-2 для интервального повторения
 */
export class SpacedRepetitionSM2 {
  // Минимальный Ease Factor
  private static readonly MIN_EASE_FACTOR = 1.3;
  
  // Начальный Ease Factor
  private static readonly INITIAL_EASE_FACTOR = 2.5;
  
  // Оценка качества ответа (0-5, где 5 - отлично, 0 - совсем не помню)
  // В нашей системе: true = помню (4-5), false = не помню (0-2)
  
  /**
   * Инициализирует данные для новой карточки
   */
  static initialize(cardId: string): SpacedRepetitionData {
    const now = Date.now();
    return {
      cardId,
      nextReview: now, // Сразу готово к повторению
      easeFactor: this.INITIAL_EASE_FACTOR,
      interval: 0, // Первое повторение через 0 дней (сразу)
      repetitions: 0,
      lastReview: now,
      successCount: 0,
      failCount: 0
    };
  }
  
  /**
   * Обновляет данные карточки после ответа
   * @param data Текущие данные карточки
   * @param isCorrect true если ответ правильный, false если неправильный
   * @returns Обновленные данные карточки
   */
  static update(data: SpacedRepetitionData, isCorrect: boolean): SpacedRepetitionData {
    const now = Date.now();
    const updated = { ...data, lastReview: now };
    
    if (isCorrect) {
      // Правильный ответ
      updated.successCount = (updated.successCount || 0) + 1;
      updated.repetitions = (updated.repetitions || 0) + 1;
      
      // Фиксированные интервалы повторения:
      // 1-е: сразу (0 дней)
      // 2-е: завтра (1 день)
      // 3-е: через день (1 день)
      // 4-е: через 3 дня
      // 5-е: через 7 дней
      // 6-е: через 14 дней
      // 7-е: через 1 месяц (30 дней)
      // 8-е и далее: через 3 месяца (90 дней)
      
      if (updated.repetitions === 1) {
        // 1-е повторение → 2-е: завтра
        updated.interval = 1;
      } else if (updated.repetitions === 2) {
        // 2-е повторение → 3-е: через день
        updated.interval = 1;
      } else if (updated.repetitions === 3) {
        // 3-е повторение → 4-е: через 3 дня
        updated.interval = 3;
      } else if (updated.repetitions === 4) {
        // 4-е повторение → 5-е: через 7 дней
        updated.interval = 7;
      } else if (updated.repetitions === 5) {
        // 5-е повторение → 6-е: через 14 дней
        updated.interval = 14;
      } else if (updated.repetitions === 6) {
        // 6-е повторение → 7-е: через 1 месяц (30 дней)
        updated.interval = 30;
      } else {
        // 7-е повторение и далее: через 3 месяца (90 дней)
        updated.interval = 90;
      }
      
      // Ease Factor больше не используется, но оставляем для совместимости
      updated.easeFactor = this.INITIAL_EASE_FACTOR;
      
      // Устанавливаем дату следующего повторения
      updated.nextReview = now + (updated.interval * 24 * 60 * 60 * 1000);
    } else {
      // Неправильный ответ
      updated.failCount = (updated.failCount || 0) + 1;
      
      // Сбрасываем прогресс: начинаем заново с 1-го повторения
      updated.repetitions = 0;
      updated.interval = 0; // Повторить через 0 дней (сразу)
      
      // Ease Factor сбрасывается до начального
      updated.easeFactor = this.INITIAL_EASE_FACTOR;
      
      // Следующее повторение - сразу
      updated.nextReview = now; // Сразу готово к повторению
    }
    
    return updated;
  }
  
  /**
   * Получает карточки, готовые к повторению
   * @param progress Данные о прогрессе всех карточек
   * @param allCards Массив всех карточек
   * @returns Массив ID карточек, готовых к повторению
   */
  static getCardsDueForReview(
    progress: SpacedRepetitionProgress,
    allCards: Array<{ id: string }>
  ): string[] {
    const now = Date.now();
    const dueCards: string[] = [];
    
    for (const card of allCards) {
      const cardData = progress[card.id];
      
      // Показываем ТОЛЬКО карточки, которые уже добавлены в систему (есть в progress)
      // Карточки, которых нет в progress, НЕ показываются
      if (cardData && cardData.nextReview <= now) {
        // Если наступила дата следующего повторения
        dueCards.push(card.id);
      }
      // Убрана проверка if (!cardData) - не показываем карточки, которых нет в системе
    }
    
    return dueCards;
  }
  
  /**
   * Получает карточки для изучения (новые карточки)
   * @param progress Данные о прогрессе всех карточек
   * @param allCards Массив всех карточек
   * @param maxNew Максимальное количество новых карточек за сессию
   * @returns Массив ID новых карточек
   */
  static getNewCards(
    progress: SpacedRepetitionProgress,
    allCards: Array<{ id: string }>,
    maxNew: number = 10
  ): string[] {
    const newCards: string[] = [];
    
    for (const card of allCards) {
      if (newCards.length >= maxNew) break;
      
      if (!progress[card.id]) {
        // Карточка еще не изучалась
        newCards.push(card.id);
      }
    }
    
    return newCards;
  }
  
  /**
   * Получает статистику по повторениям
   */
  static getStatistics(progress: SpacedRepetitionProgress): {
    totalCards: number;
    newCards: number;
    dueToday: number;
    mastered: number; // Карточки с интервалом > 30 дней
    successRate: number; // Процент успешных повторений
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
      if (cardData.repetitions === 0) {
        stats.newCards++;
      }
      
      if (cardData.nextReview <= now) {
        stats.dueToday++;
      }
      
      if (cardData.interval > 30) {
        stats.mastered++;
      }
      
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
