import React, { useState, useEffect } from 'react';
import { Topic } from '../types';
import { TOPICS } from '../constants';
import Flashcards from './Flashcards';
import TrialKnowledgeCheck from './TrialKnowledgeCheck';

interface TrialLessonsProps {
  onBack: () => void;
  onStartModule: (topic: Topic, moduleType: 'flashcards' | 'verb-form-flashcards', message?: string) => void;
  onReturnToLessons: () => void;
  onShowKnowledgeCheck: () => void;
  onShowSpecialOffer?: () => void;
  onStartTrialExercises?: () => void;
}

const TrialLessons: React.FC<TrialLessonsProps> = ({ onBack, onStartModule, onReturnToLessons, onShowKnowledgeCheck, onShowSpecialOffer, onStartTrialExercises }) => {
  // Всегда начинаем с урока 1
  const [currentStep, setCurrentStep] = useState(1);
  const [showFlashcardsModal, setShowFlashcardsModal] = useState(false);
  const [flashcardsCompleted, setFlashcardsCompleted] = useState(false);
  
  const [showSpecialOfferModal, setShowSpecialOfferModal] = useState(false);

  // При монтировании проверяем, нужно ли показать урок 2 (только если пользователь явно перешел к нему)
  useEffect(() => {
    // Проверяем, был ли переход к уроку 2 через кнопку
    const saved = localStorage.getItem('trialLessonStep');
    if (saved && parseInt(saved, 10) === 2) {
      // Показываем урок 2 только если был явный переход
      setCurrentStep(2);
    } else {
      // Всегда начинаем с урока 1
      setCurrentStep(1);
      localStorage.setItem('trialLessonStep', '1');
    }
  }, []);

  // Добавляем кнопку для возврата к уроку 1
  const handleBackToLesson1 = () => {
    setCurrentStep(1);
    localStorage.setItem('trialLessonStep', '1');
  };

  // Находим модуль 3 для карточек
  const module3 = TOPICS.find(t => t.id === 'module-3');

  // Видео для Урока 1
  const lesson1VideoUrl = 'https://kinescope.io/dSKDFUksKLTtoPeg5sH39T';
  
  // Видео для Урока 2
  const lesson2VideoUrl = 'https://kinescope.io/6Nx6weDwUygTkr33Cuwq9v';

  const handleOpenFlashcards = () => {
    setShowFlashcardsModal(true);
  };

  const handleCloseFlashcards = () => {
    setShowFlashcardsModal(false);
    // После закрытия модалки показываем кнопку "Вперед ко 2-му уроку"
    setFlashcardsCompleted(true);
  };

  const handleFlashcardsComplete = () => {
    setFlashcardsCompleted(true);
    setShowFlashcardsModal(false);
  };

  const handleGoToLesson2 = () => {
    setCurrentStep(2);
    localStorage.setItem('trialLessonStep', '2');
    setFlashcardsCompleted(false);
  };

  const handleOpenSpecialOfferModal = () => {
    setShowSpecialOfferModal(true);
  };

  // Функция для перехода к уроку 2 после завершения карточек урока 1
  const handleLesson1Complete = () => {
    setCurrentStep(2);
  };

  const handleRestartTrialLessons = () => {
    localStorage.removeItem('trialQuizPassed');
    localStorage.removeItem('trialLessonStep');
    setCurrentStep(1);
  };

  // Если квиз пройден — при заходе в пробные уроки показываем экран «пробные уроки пройдены»
  const quizPassed = localStorage.getItem('trialQuizPassed') === 'true';
  if (quizPassed) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4 sm:px-6">
        <div className="w-full">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-3xl font-black text-gray-800 mb-4">
                Пробные уроки пройдены
              </h1>
              <p className="text-lg text-gray-700 font-bold leading-relaxed mb-4">
                Предлагаем пройти ещё раз или получить спецпредложение на полный курс.
              </p>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => onShowSpecialOffer?.()}
                className="w-full py-4 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-xl font-black text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all"
              >
                Получить спецпредложение
              </button>
              <button
                onClick={handleRestartTrialLessons}
                className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 text-white rounded-xl font-black text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all"
              >
                Пройти ещё раз
              </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4 sm:px-6">
      <div className="w-full">
        {/* Основной контент — на весь экран без рамок */}
        <div className="w-full">

          {/* Урок 1 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-gray-800 mb-4">
                  Урок 1. Как легко запомнить все самые важные сильные глаголы?
                </h2>
              </div>

              {/* Видео */}
              <div className="rounded-[2rem] overflow-hidden shadow-2xl bg-black aspect-video relative border-4 border-white">
                <iframe 
                  src={lesson1VideoUrl}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                  title="Урок 1. Как легко запомнить все самые важные сильные глаголы?"
                ></iframe>
              </div>

              {/* Текст под видео */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-4 border-2 border-purple-200">
                <p className="text-gray-700 text-sm font-bold leading-relaxed">
                  После просмотра Урока пройди упражнения "Карточки", а потом переходи ко 2-му Уроку.
                </p>
              </div>

              {/* Кнопка Карточки */}
              <button
                onClick={handleOpenFlashcards}
                className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 text-white rounded-xl font-black text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all"
              >
                Карточки
              </button>

              {/* Кнопка "Вперед ко 2-му уроку" - всегда видна */}
              <div className="mt-4">
                <button
                  onClick={handleGoToLesson2}
                  className="w-full py-4 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 text-white rounded-xl font-black text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all"
                >
                  Вперед ко 2-му уроку
                </button>
              </div>
            </div>
          )}

          {/* Модалка с карточками */}
          {showFlashcardsModal && module3 && (
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={handleCloseFlashcards}
            >
              <div 
                className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Заголовок модалки */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h3 className="text-2xl font-black text-gray-800">Карточки</h3>
                  <button
                    onClick={handleCloseFlashcards}
                    className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>
                
                {/* Контент карточек */}
                <div className="flex-1 overflow-y-auto px-4 py-1">
                  <Flashcards
                    topic={module3}
                    onComplete={handleFlashcardsComplete}
                    isTrialLesson={true}
                    trialLessonMessage="Важно пройти карточки в обе стороны хотя бы по одному разу так ты закрепишь знания слов."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Урок 2 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <button
                onClick={handleBackToLesson1}
                className="mb-4 text-purple-600 hover:text-purple-700 font-bold text-sm flex items-center gap-2"
              >
                <i className="fas fa-arrow-left"></i>
                Вернуться к Уроку 1
              </button>
              <div>
                <h2 className="text-2xl font-black text-gray-800 mb-4">
                  Урок 2.
                </h2>
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-4 border-2 border-purple-200 mb-4">
                  <p className="text-gray-700 text-sm font-bold leading-relaxed">
                    Теперь мы разберём как запоминать 3 формы глагола в рамках группы (ряда аблаута).
                  </p>
                </div>
              </div>

              {/* Видео */}
              <div className="rounded-[2rem] overflow-hidden shadow-2xl bg-black aspect-video relative border-4 border-white">
                <iframe 
                  src={lesson2VideoUrl}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                  title="Урок 2"
                ></iframe>
              </div>

              {/* Текст под видео */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-4 border-2 border-purple-200">
                <p className="text-gray-700 text-sm font-bold leading-relaxed">
                  После просмотра Урока потренируй упражнения.
                </p>
              </div>

              {/* Кнопка Потренируй упражнения */}
              <button
                onClick={() => onStartTrialExercises?.()}
                className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 text-white rounded-xl font-black text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all"
              >
                Потренируй упражнения
              </button>

              {/* Блок с информацией о курсе и спецпредложении */}
              <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-2xl p-6 shadow-xl border-2 border-orange-200">
                <p className="text-lg font-bold leading-relaxed mb-4 text-gray-800">
                  👋 Отлично! Первые шаги уже сделаны, и теперь ты готов(а) перейти на новый уровень.
                </p>
                <p className="text-gray-700 font-medium mb-4">
                  Открой Полный курс и выучи 180 сильных глаголов в 3-х формах легко — навсегда.
                </p>
                <p className="text-gray-700 font-bold mb-4">
                  Хочешь получить мое спецпредложение с доступом по минимальной цене?
                </p>
                <button
                  onClick={() => onShowSpecialOffer?.()}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-xl font-black text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all"
                >
                  Получить 🔥 СПЕЦПРЕДЛОЖЕНИЕ
                </button>
              </div>
            </div>
          )}

        {/* Модалка "Отлично! теперь ты..." */}
        {showSpecialOfferModal && (
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowSpecialOfferModal(false)}
            >
              <div 
                className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-black text-gray-800 mb-4">
                    Отлично! Теперь ты готов к своему спецпредложению на полный курс.
                  </h3>
                  <p className="text-gray-600 font-bold mb-6">
                    Получи доступ ко всем 11 модулям и 200+ сильным глаголам по специальной цене.
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowSpecialOfferModal(false);
                      onShowSpecialOffer?.();
                    }}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-xl font-black text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all"
                  >
                    Получить спецпредложение
                  </button>
                  <button
                    onClick={() => setShowSpecialOfferModal(false)}
                    className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition-all"
                  >
                    Позже
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default TrialLessons;
