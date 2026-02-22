/**
 * Конфигурация доступа пользователей к темам
 * 
 * Структура:
 * - 'all' - полный доступ ко всем темам
 * - ['topic-id-1', 'topic-id-2'] - доступ только к указанным темам
 * 
 * Используйте Telegram ID пользователя (число) в качестве ключа
 */

export interface AccessConfig {
  [telegramId: string]: 'all' | string[];
}

export const ACCESS_CONFIG: AccessConfig = {
  // Пример: пользователь с Telegram ID 123456789 имеет полный доступ
  // '123456789': 'all',
  
  // Пример: пользователь с Telegram ID 987654321 имеет доступ только к теме "doctor-visit"
  // '987654321': ['doctor-visit'],
  
  // Пример: пользователь с Telegram ID 111222333 имеет доступ к нескольким темам
  // '111222333': ['doctor-visit', 'house-cleaning'],
  
  // По умолчанию: если пользователь не указан в конфиге, у него полный доступ
  // Для ограничения доступа раскомментируйте и настройте нужные ID
};

/**
 * Проверяет, имеет ли пользователь доступ к теме
 */
export function hasAccessToTopic(telegramId: string, topicId: string): boolean {
  // Если пользователь не указан в конфиге, по умолчанию полный доступ
  const userAccess = ACCESS_CONFIG[telegramId];
  
  if (!userAccess) {
    return true; // По умолчанию полный доступ
  }
  
  if (userAccess === 'all') {
    return true; // Полный доступ
  }
  
  // Проверяем, есть ли тема в списке разрешенных
  return userAccess.includes(topicId);
}

/**
 * Получает список доступных тем для пользователя
 */
export function getAvailableTopics(telegramId: string, allTopics: string[]): string[] {
  const userAccess = ACCESS_CONFIG[telegramId];
  
  if (!userAccess) {
    return allTopics; // По умолчанию все темы
  }
  
  if (userAccess === 'all') {
    return allTopics; // Полный доступ
  }
  
  // Возвращаем только разрешенные темы
  return userAccess.filter(topicId => allTopics.includes(topicId));
}

