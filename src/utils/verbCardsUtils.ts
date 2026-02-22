/**
 * Утилиты для работы с карточками глаголов из всех модулей
 */
import { TOPICS } from '../constants';
import { VerbFormCard } from '../types';

/**
 * Собирает все карточки глаголов из всех модулей в единый список
 */
export function getAllVerbFormCards(): VerbFormCard[] {
  const allCards: VerbFormCard[] = [];
  
  for (const topic of TOPICS) {
    if (topic.verbFormCards && topic.verbFormCards.length > 0) {
      // Добавляем карточки из модуля с информацией о модуле (опционально можно добавить topic.id)
      allCards.push(...topic.verbFormCards);
    }
  }
  
  return allCards;
}

/**
 * Получает карточку по ID
 */
export function getVerbFormCardById(cardId: string): VerbFormCard | undefined {
  const allCards = getAllVerbFormCards();
  return allCards.find(card => card.id === cardId);
}
