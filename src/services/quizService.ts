import { 
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  Firestore 
} from 'firebase/firestore';
import { getFirestoreDb } from '../config/firebase';

export interface QuizResult {
  telegramId: string;
  name: string;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  questions: Array<{
    verb: string;
    question: string;
    selectedAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
  }>;
  completedAt: any;
}

/**
 * Сервис для работы с результатами квизов в Firebase Firestore
 */
export const QuizService = {
  /**
   * Сохраняет результат квиза в Firestore
   */
  async saveQuizResult(result: Omit<QuizResult, 'completedAt'>): Promise<void> {
    const db = getFirestoreDb();
    
    if (!db) {
      console.log('📦 Firebase not available, saving to local storage');
      this.saveQuizResultToLocalStorage(result);
      return;
    }

    try {
      const quizResultsRef = collection(db, 'quizResults');
      await addDoc(quizResultsRef, {
        ...result,
        completedAt: serverTimestamp()
      });
      
      console.log('✅ Quiz result saved to Firestore:', result);
      
      // Также сохраняем в localStorage как резервную копию
      this.saveQuizResultToLocalStorage(result);
    } catch (error) {
      console.error('❌ Error saving quiz result to Firestore:', error);
      // Fallback на localStorage при ошибке
      this.saveQuizResultToLocalStorage(result);
    }
  },

  /**
   * Получает последние результаты квизов пользователя
   */
  async getQuizResults(telegramId: string, limitCount: number = 10): Promise<QuizResult[]> {
    const db = getFirestoreDb();
    
    if (!db) {
      return this.getQuizResultsFromLocalStorage(telegramId, limitCount);
    }

    try {
      const quizResultsRef = collection(db, 'quizResults');
      const q = query(
        quizResultsRef,
        where('telegramId', '==', telegramId),
        orderBy('completedAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const results: QuizResult[] = [];
      
      querySnapshot.forEach((doc) => {
        results.push(doc.data() as QuizResult);
      });
      
      console.log('✅ Quiz results loaded from Firestore:', results.length);
      return results;
    } catch (error) {
      console.error('❌ Error loading quiz results from Firestore:', error);
      return this.getQuizResultsFromLocalStorage(telegramId, limitCount);
    }
  },

  /**
   * Сохраняет результат квиза в localStorage (fallback)
   */
  saveQuizResultToLocalStorage(result: Omit<QuizResult, 'completedAt'>): void {
    try {
      const key = `quiz_results_${result.telegramId}`;
      const existing = this.getQuizResultsFromLocalStorage(result.telegramId, 1000);
      existing.unshift({
        ...result,
        completedAt: Date.now()
      } as QuizResult);
      // Оставляем только последние 100 результатов
      const limited = existing.slice(0, 100);
      localStorage.setItem(key, JSON.stringify(limited));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  /**
   * Получает результаты квизов из localStorage (fallback)
   */
  getQuizResultsFromLocalStorage(telegramId: string, limitCount: number): QuizResult[] {
    try {
      const key = `quiz_results_${telegramId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const results = JSON.parse(saved) as QuizResult[];
        return results.slice(0, limitCount);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    return [];
  }
};
