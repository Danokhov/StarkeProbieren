import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  Firestore 
} from 'firebase/firestore';
import { getFirestoreDb } from '../config/firebase';
import { SpacedRepetitionProgress } from './spacedRepetitionService';

export interface UserProgress {
  telegramId: string;
  name: string;
  progress: Record<string, string[]>; // topicId -> массив завершенных модулей
  itemProgress?: Record<string, Record<string, Record<string | number, boolean>>>; // topicId -> moduleId -> itemIndex (string | number) -> правильно/неправильно
  spacedRepetition?: SpacedRepetitionProgress; // Данные интервального повторения для карточек глаголов
  updatedAt?: any;
}

/**
 * Сервис для работы с прогрессом пользователя в Firebase Firestore
 */
export const ProgressService = {
  /**
   * Загружает прогресс пользователя из Firestore
   */
  async loadProgress(telegramId: string): Promise<Record<string, string[]>> {
    const db = getFirestoreDb();
    
    // Если Firebase не инициализирован, возвращаем пустой прогресс
    if (!db) {
      console.log('📦 Firebase not available, using local storage fallback');
      return this.loadProgressFromLocalStorage(telegramId);
    }

    try {
      const userRef = doc(db, 'users', telegramId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data() as UserProgress;
        console.log('✅ Progress loaded from Firestore:', data.progress);
        return data.progress || {};
      } else {
        console.log('📝 No progress found in Firestore for user:', telegramId);
        return {};
      }
    } catch (error) {
      console.error('❌ Error loading progress from Firestore:', error);
      // Fallback на localStorage при ошибке
      return this.loadProgressFromLocalStorage(telegramId);
    }
  },

  /**
   * Загружает детальный прогресс по items из Firestore
   * itemIndex может быть number (для модулей 1-2) или string (для модулей 3+ с временами)
   */
  async loadItemProgress(telegramId: string): Promise<Record<string, Record<string, Record<string | number, boolean>>>> {
    const db = getFirestoreDb();
    
    if (!db) {
      return this.loadItemProgressFromLocalStorage(telegramId);
    }

    try {
      const userRef = doc(db, 'users', telegramId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data() as UserProgress;
        return data.itemProgress || {};
      }
      return {};
    } catch (error) {
      console.error('❌ Error loading item progress from Firestore:', error);
      return this.loadItemProgressFromLocalStorage(telegramId);
    }
  },

  /**
   * Сохраняет прогресс пользователя в Firestore
   */
  async saveProgress(
    telegramId: string, 
    name: string, 
    progress: Record<string, string[]>,
    itemProgress?: Record<string, Record<string, Record<string | number, boolean>>>
  ): Promise<void> {
    const db = getFirestoreDb();
    
    // Если Firebase не инициализирован, сохраняем в localStorage
    if (!db) {
      console.log('📦 Firebase not available, saving to local storage');
      this.saveProgressToLocalStorage(telegramId, progress);
      if (itemProgress) {
        this.saveItemProgressToLocalStorage(telegramId, itemProgress);
      }
      return;
    }

    try {
      const userRef = doc(db, 'users', telegramId);
      
      // Используем setDoc с merge: true для обновления документа
      const updateData: any = {
        telegramId,
        name,
        progress,
        updatedAt: serverTimestamp()
      };
      
      if (itemProgress) {
        updateData.itemProgress = itemProgress;
      }
      
      await setDoc(userRef, updateData, { merge: true });
      
      console.log('✅ Progress saved to Firestore:', { 
        telegramId, 
        name, 
        progress, 
        itemProgress,
        itemProgressKeys: itemProgress ? Object.keys(itemProgress) : [],
        itemProgressStructure: itemProgress ? Object.keys(itemProgress).map(topicId => ({
          topicId,
          modules: Object.keys(itemProgress[topicId] || {}),
          exercisesCount: itemProgress[topicId]?.['exercises'] ? Object.keys(itemProgress[topicId]['exercises']).length : 0
        })) : []
      });
      
      // Также сохраняем в localStorage как резервную копию
      this.saveProgressToLocalStorage(telegramId, progress);
      if (itemProgress) {
        this.saveItemProgressToLocalStorage(telegramId, itemProgress);
      }
    } catch (error) {
      console.error('❌ Error saving progress to Firestore:', error);
      // Fallback на localStorage при ошибке
      this.saveProgressToLocalStorage(telegramId, progress);
      if (itemProgress) {
        this.saveItemProgressToLocalStorage(telegramId, itemProgress);
      }
    }
  },

  /**
   * Сохраняет прогресс по item упражнения
   * itemIndex может быть number (для модулей 1-2) или string (для модулей 3+ с временами)
   */
  async saveItemProgress(
    telegramId: string,
    name: string,
    topicId: string,
    moduleId: string,
    itemIndex: string | number,
    isCorrect: boolean
  ): Promise<void> {
    const currentItemProgress = await this.loadItemProgress(telegramId);
    const currentProgress = await this.loadProgress(telegramId);
    
    const newItemProgress = {
      ...currentItemProgress,
      [topicId]: {
        ...(currentItemProgress[topicId] || {}),
        [moduleId]: {
          ...(currentItemProgress[topicId]?.[moduleId] || {}),
          [itemIndex]: isCorrect
        }
      }
    };
    
    await this.saveProgress(telegramId, name, currentProgress, newItemProgress);
  },

  /**
   * Обновляет прогресс пользователя (добавляет завершенный модуль)
   */
  async updateProgress(
    telegramId: string,
    name: string,
    topicId: string,
    moduleId: string
  ): Promise<Record<string, string[]>> {
    // Сначала загружаем текущий прогресс
    const currentProgress = await this.loadProgress(telegramId);
    
    // Проверяем, не завершен ли уже этот модуль
    const currentTopicModules = currentProgress[topicId] || [];
    if (currentTopicModules.includes(moduleId)) {
      return currentProgress;
    }
    
    // Добавляем модуль к прогрессу
    const newProgress = {
      ...currentProgress,
      [topicId]: [...currentTopicModules, moduleId]
    };
    
    // Сохраняем обновленный прогресс
    await this.saveProgress(telegramId, name, newProgress);
    
    return newProgress;
  },

  /**
   * Обновляет процент выполнения для раздела exercises или text-gaps
   * Формат: "exercises:75" для временного прогресса, "exercises" для фиксированного 100%
   * Формат: "text-gaps:75" для временного прогресса, "text-gaps" для фиксированного 100%
   */
  async updateExercisesProgress(
    telegramId: string,
    name: string,
    topicId: string,
    percentage: number,
    isFixed: boolean = false,
    moduleId: string = 'exercises'
  ): Promise<Record<string, string[]>> {
    const currentProgress = await this.loadProgress(telegramId);
    const currentTopicModules = currentProgress[topicId] || [];
    
    // Удаляем старые записи для данного moduleId (если есть)
    const filteredModules = currentTopicModules.filter(m => 
      m !== moduleId && !m.startsWith(`${moduleId}:`)
    );
    
    // Добавляем новую запись
    const newModules = isFixed 
      ? [...filteredModules, moduleId] // Фиксированный 100%
      : [...filteredModules, `${moduleId}:${percentage}`]; // Временный процент
    
    const newProgress = {
      ...currentProgress,
      [topicId]: newModules
    };
    
    await this.saveProgress(telegramId, name, newProgress);
    return newProgress;
  },

  /**
   * Загружает прогресс из localStorage (fallback)
   */
  loadProgressFromLocalStorage(telegramId: string): Record<string, string[]> {
    try {
      const saved = localStorage.getItem(`promnemo_progress_${telegramId}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    return {};
  },

  /**
   * Сохраняет прогресс в localStorage (fallback)
   */
  saveProgressToLocalStorage(telegramId: string, progress: Record<string, string[]>): void {
    try {
      localStorage.setItem(`promnemo_progress_${telegramId}`, JSON.stringify(progress));
      // Также сохраняем в старом формате для совместимости
      localStorage.setItem('promnemo_progress', JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  /**
   * Загружает детальный прогресс из localStorage (fallback)
   */
  loadItemProgressFromLocalStorage(telegramId: string): Record<string, Record<string, Record<string | number, boolean>>> {
    try {
      const saved = localStorage.getItem(`promnemo_item_progress_${telegramId}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading item progress from localStorage:', error);
    }
    return {};
  },

  /**
   * Сохраняет детальный прогресс в localStorage (fallback)
   */
  saveItemProgressToLocalStorage(telegramId: string, itemProgress: Record<string, Record<string, Record<string | number, boolean>>>): void {
    try {
      localStorage.setItem(`promnemo_item_progress_${telegramId}`, JSON.stringify(itemProgress));
    } catch (error) {
      console.error('Error saving item progress to localStorage:', error);
    }
  },

  /**
   * Загружает данные интервального повторения из Firestore
   */
  async loadSpacedRepetition(telegramId: string): Promise<SpacedRepetitionProgress> {
    const db = getFirestoreDb();
    
    if (!db) {
      return this.loadSpacedRepetitionFromLocalStorage(telegramId);
    }

    try {
      const userRef = doc(db, 'users', telegramId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data() as UserProgress;
        return data.spacedRepetition || {};
      }
      return {};
    } catch (error) {
      console.error('❌ Error loading spaced repetition from Firestore:', error);
      return this.loadSpacedRepetitionFromLocalStorage(telegramId);
    }
  },

  /**
   * Сохраняет данные интервального повторения в Firestore
   */
  async saveSpacedRepetition(
    telegramId: string,
    name: string,
    spacedRepetition: SpacedRepetitionProgress
  ): Promise<void> {
    const db = getFirestoreDb();
    const currentProgress = await this.loadProgress(telegramId);
    const currentItemProgress = await this.loadItemProgress(telegramId);
    
    if (!db) {
      this.saveSpacedRepetitionToLocalStorage(telegramId, spacedRepetition);
      return;
    }

    try {
      const userRef = doc(db, 'users', telegramId);
      
      await setDoc(userRef, {
        telegramId,
        name,
        progress: currentProgress,
        itemProgress: currentItemProgress,
        spacedRepetition,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log('✅ Spaced repetition saved to Firestore');
      
      // Также сохраняем в localStorage как резервную копию
      this.saveSpacedRepetitionToLocalStorage(telegramId, spacedRepetition);
    } catch (error) {
      console.error('❌ Error saving spaced repetition to Firestore:', error);
      this.saveSpacedRepetitionToLocalStorage(telegramId, spacedRepetition);
    }
  },

  /**
   * Загружает данные интервального повторения из localStorage (fallback)
   */
  loadSpacedRepetitionFromLocalStorage(telegramId: string): SpacedRepetitionProgress {
    try {
      const saved = localStorage.getItem(`promnemo_spaced_repetition_${telegramId}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading spaced repetition from localStorage:', error);
    }
    return {};
  },

  /**
   * Сохраняет данные интервального повторения в localStorage (fallback)
   */
  saveSpacedRepetitionToLocalStorage(telegramId: string, spacedRepetition: SpacedRepetitionProgress): void {
    try {
      localStorage.setItem(`promnemo_spaced_repetition_${telegramId}`, JSON.stringify(spacedRepetition));
    } catch (error) {
      console.error('Error saving spaced repetition to localStorage:', error);
    }
  }
};

