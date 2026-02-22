import { Topic } from '../types';
import { User } from '../types';
import { hasAccessToTopic, getAvailableTopics, ACCESS_CONFIG } from '../config/accessConfig';

/**
 * Сервис для управления доступом пользователей к контенту
 */
export const AccessControlService = {
  /**
   * Фильтрует список тем в зависимости от доступа пользователя
   */
  filterTopicsByAccess(user: User | null, allTopics: Topic[]): Topic[] {
    if (!user || !user.telegramId) {
      // Если пользователь не авторизован, показываем все темы (или можно ограничить)
      return allTopics;
    }

    const telegramId = user.telegramId;
    const allTopicIds = allTopics.map(t => t.id);
    const availableTopicIds = getAvailableTopics(telegramId, allTopicIds);

    // Фильтруем темы по доступным ID
    return allTopics.filter(topic => availableTopicIds.includes(topic.id));
  },

  /**
   * Проверяет, имеет ли пользователь доступ к конкретной теме
   */
  canAccessTopic(user: User | null, topicId: string): boolean {
    if (!user || !user.telegramId) {
      // Если пользователь не авторизован, можно ограничить доступ
      // Или разрешить по умолчанию
      return true;
    }

    return hasAccessToTopic(user.telegramId, topicId);
  },

  /**
   * Получает уровень доступа пользователя (для отображения)
   */
  getUserAccessLevel(user: User | null): 'full' | 'limited' | 'none' {
    if (!user || !user.telegramId) {
      return 'full'; // По умолчанию
    }

    const userAccess = ACCESS_CONFIG[user.telegramId];

    if (!userAccess) {
      return 'full'; // По умолчанию полный доступ
    }

    if (userAccess === 'all') {
      return 'full';
    }

    return 'limited';
  }
};

