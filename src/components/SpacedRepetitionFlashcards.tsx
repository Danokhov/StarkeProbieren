import React, { useState, useEffect } from 'react';
import { VerbFormCard, User } from '../types';
import { unlockAudio } from '../services/audioService';
// ProgressService удален - используем только localStorage
import { SpacedRepetitionSM2, SpacedRepetitionProgress } from '../services/spacedRepetitionService';
import { getAllVerbFormCards, getVerbFormCardById } from '../utils/verbCardsUtils';
import { TOPICS } from '../constants';

interface SpacedRepetitionFlashcardsProps {
  user: User;
  onComplete?: () => void;
  onDueCountUpdate?: (count: number) => void; // Callback для обновления бейджа
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const SpacedRepetitionFlashcards: React.FC<SpacedRepetitionFlashcardsProps> = ({ user, onComplete, onDueCountUpdate }) => {
  const allCards = getAllVerbFormCards();
  const [spacedRepetition, setSpacedRepetition] = useState<SpacedRepetitionProgress>({});
  const [sessionCards, setSessionCards] = useState<string[]>([]); // ID карточек для текущей сессии
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState<'de-ru' | 'ru-de'>('ru-de');
  const [sessionFinished, setSessionFinished] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [totalUserCards, setTotalUserCards] = useState(0); // Количество карточек пользователя в системе

  const currentCardId = sessionCards[currentIndex];
  const currentCard = currentCardId ? getVerbFormCardById(currentCardId) : null;

  // Определяем, из какого модуля карточка (для правильного отображения формата)
  const getCardModuleIndex = (cardId: string): number => {
    // Ищем модуль, содержащий эту карточку
    for (let i = 0; i < TOPICS.length; i++) {
      const topic = TOPICS[i];
      if (topic.verbFormCards && topic.verbFormCards.some((c: VerbFormCard) => c.id === cardId)) {
        return i;
      }
    }
    return -1; // Не найдено
  };

  const currentCardModuleIndex = currentCard ? getCardModuleIndex(currentCard.id) : -1;
  const isModule2Card = currentCardModuleIndex === 1; // Модуль 2 имеет индекс 1

  // Генерируем форму 3-го лица Präsens для инфинитива
  const getPraesensThirdPerson = (infinitive: string): string => {
    // Для модальных глаголов используем специальные формы
    const modalVerbs: { [key: string]: string } = {
      'können': 'kann',
      'müssen': 'muss',
      'dürfen': 'darf',
      'sollen': 'soll',
      'wollen': 'will',
      'mögen': 'mag',
      'möchten': 'möchte'
    };

    if (modalVerbs[infinitive]) {
      return `er/sie/es ${modalVerbs[infinitive]}`;
    }

    // Для обычных глаголов: удаляем -en из инфинитива
    let stem = infinitive.replace(/en$/, '');
    
    // Для сильных глаголов применяем изменение гласной (a->ä, o->ö, u->ü)
    const lastA = stem.lastIndexOf('a');
    const lastO = stem.lastIndexOf('o');
    const lastU = stem.lastIndexOf('u');
    const lastVowelPos = Math.max(lastA, lastO, lastU);
    
    if (lastVowelPos !== -1) {
      const vowel = stem[lastVowelPos];
      if (lastVowelPos < stem.length - 1 && /[bcdfghjklmnpqrstvwxyzßhr]/.test(stem[lastVowelPos + 1])) {
        if (vowel === 'a') {
          stem = stem.substring(0, lastVowelPos) + 'ä' + stem.substring(lastVowelPos + 1);
        } else if (vowel === 'o') {
          stem = stem.substring(0, lastVowelPos) + 'ö' + stem.substring(lastVowelPos + 1);
        } else if (vowel === 'u') {
          stem = stem.substring(0, lastVowelPos) + 'ü' + stem.substring(lastVowelPos + 1);
        }
      }
    }
    
    return `er/sie/es ${stem}t`;
  };

  // Загружаем данные интервального повторения
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const spacedRepetitionKey = `promnemo_spaced_repetition_${user.telegramId}`;
        const savedSpacedRepetition = localStorage.getItem(spacedRepetitionKey);
        const progress = savedSpacedRepetition ? JSON.parse(savedSpacedRepetition) : {};
        setSpacedRepetition(progress);
        
        // Фильтруем: показываем ТОЛЬКО карточки, которые уже добавлены в интервальное повторение
        // (есть в progress) - это карточки из модулей 3-11 после прохождения verb-form-flashcards
        const cardsInSystem = Object.keys(progress);
        
        // Из allCards берем только те, что есть в системе интервального повторения
        const cardsAddedToSystem = allCards.filter(card => progress[card.id]);
        
        // Сохраняем общее количество карточек пользователя
        setTotalUserCards(cardsAddedToSystem.length);
        
        // Определяем карточки, готовые к повторению (только из добавленных в систему)
        const dueCards = SpacedRepetitionSM2.getCardsDueForReview(progress, cardsAddedToSystem);
        
        // Добавляем новые карточки из уже добавленных в систему (максимум 10 новых за сессию)
        // "Новые" - это те, что добавлены в систему, но еще не изучались (repetitions === 0)
        const newCards = cardsAddedToSystem
          .filter(card => {
            const cardData = progress[card.id];
            return cardData && cardData.repetitions === 0;
          })
          .slice(0, 10)
          .map(card => card.id);
        
        // Объединяем и перемешиваем
        const uniqueCards = [...new Set([...dueCards, ...newCards])];
        const cardsToReview = shuffleArray(uniqueCards);
        
        // Если нет карточек для повторения, завершаем
        if (cardsToReview.length === 0) {
          setSessionFinished(true);
        } else {
          setSessionCards(cardsToReview);
        }
      } catch (error) {
        console.error('Error loading spaced repetition data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user.telegramId]);

  useEffect(() => {
    unlockAudio().catch((err) => {
      console.warn("⚠️ Failed to unlock audio on mount:", err);
    });
  }, []);

  const handleAudioClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSpeaking || !currentCard) return;
    
    setIsSpeaking(true);
    
    try {
      await unlockAudio();
      
      try {
        const { playTextWithOpenAITTS } = await import('../services/openaiTtsService');
        await playTextWithOpenAITTS(currentCard.praesens, 'de');
      } catch (openaiError) {
        console.warn("⚠️ [TTS Engine: OpenAI] Failed, switching to fallback:", openaiError);
        const { playTextWithSpeechSynthesis } = await import('../services/audioService');
        await playTextWithSpeechSynthesis(currentCard.praesens, 'de');
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error("❌ Error in handleAudioClick:", error);
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsSpeaking(false);
    }
  };

  const markResult = async (isCorrect: boolean) => {
    if (!currentCardId || !currentCard) return;
    
    // Получаем текущие данные карточки или создаем новые
    let cardData = spacedRepetition[currentCardId];
    if (!cardData) {
      cardData = SpacedRepetitionSM2.initialize(currentCardId);
    }
    
    // Обновляем данные через алгоритм SM-2
    const updatedData = SpacedRepetitionSM2.update(cardData, isCorrect);
    
    // Обновляем состояние
    const updatedProgress = {
      ...spacedRepetition,
      [currentCardId]: updatedData
    };
    setSpacedRepetition(updatedProgress);
    
    // Сохраняем в Firebase
    try {
      const spacedRepetitionKey = `promnemo_spaced_repetition_${user.telegramId}`;
      localStorage.setItem(spacedRepetitionKey, JSON.stringify(updatedProgress));
      
      // Обновляем счетчик на бейдже после сохранения
      if (onDueCountUpdate) {
        // Пересчитываем количество карточек, готовых к повторению
        const cardsAddedToSystem = allCards.filter(card => updatedProgress[card.id]);
        const dueCards = SpacedRepetitionSM2.getCardsDueForReview(updatedProgress, cardsAddedToSystem);
        onDueCountUpdate(dueCards.length);
      }
    } catch (error) {
      console.error('Error saving spaced repetition:', error);
    }
    
    // Переходим к следующей карточке
    if (currentIndex + 1 < sessionCards.length) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 150);
    } else {
      // Сессия завершена
      setSessionFinished(true);
    }
  };

  const restartSession = async () => {
    // Перезагружаем данные для новой сессии
    const spacedRepetitionKey = `promnemo_spaced_repetition_${user.telegramId}`;
    const savedSpacedRepetition = localStorage.getItem(spacedRepetitionKey);
    const progress = savedSpacedRepetition ? JSON.parse(savedSpacedRepetition) : {};
    setSpacedRepetition(progress);
    
    // Фильтруем: показываем ТОЛЬКО карточки, которые уже добавлены в интервальное повторение
    const cardsAddedToSystem = allCards.filter(card => progress[card.id]);
    
    // Обновляем общее количество карточек пользователя
    setTotalUserCards(cardsAddedToSystem.length);
    
    const dueCards = SpacedRepetitionSM2.getCardsDueForReview(progress, cardsAddedToSystem);
    
    // Новые карточки - те, что в системе, но еще не изучались
    const newCards = cardsAddedToSystem
      .filter(card => {
        const cardData = progress[card.id];
        return cardData && cardData.repetitions === 0;
      })
      .slice(0, 10)
      .map(card => card.id);
    
    const uniqueCards = [...new Set([...dueCards, ...newCards])];
    const cardsToReview = shuffleArray(uniqueCards);
    
    if (cardsToReview.length === 0) {
      setSessionFinished(true);
    } else {
      setSessionCards(cardsToReview);
      setCurrentIndex(0);
      setIsFlipped(false);
      setSessionFinished(false);
    }
  };

  // Получаем статистику
  const stats = SpacedRepetitionSM2.getStatistics(spacedRepetition);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[85vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Загрузка карточек...</p>
        </div>
      </div>
    );
  }

  if (sessionFinished || sessionCards.length === 0) {
    const completedCount = currentIndex > 0 ? currentIndex : sessionCards.length;
    
    // Если нет карточек в системе, показываем специальное сообщение
    if (sessionCards.length === 0 && Object.keys(spacedRepetition).length === 0) {
      return (
        <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100 text-center animate-in zoom-in mx-2">
          <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
            <i className="fas fa-inbox"></i>
          </div>
          <h3 className="text-3xl font-black text-gray-800 mb-3">Пока пусто</h3>
          <p className="text-lg text-gray-600 mb-8 font-medium">
            Карточки появятся после прохождения раздела "Карточки глаголов в 3-х формах" в модулях 2-11.
          </p>
          <button 
            onClick={(e) => { 
              e.preventDefault();
              e.stopPropagation(); 
              console.log('🏠 SpacedRepetition: Returning to home');
              if (onComplete) {
                onComplete();
              }
            }}
            className="w-full py-4 bg-indigo-600 text-white rounded-[1.8rem] font-black active:scale-95 transition-all"
          >
            Вернуться к модулям
          </button>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100 text-center animate-in zoom-in mx-2">
        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
          <i className="fas fa-check-circle"></i>
        </div>
        <h3 className="text-3xl font-black text-gray-800 mb-3">Отлично!</h3>
        <p className="text-lg text-gray-500 mb-2 font-medium">
          Повторено: {completedCount} {completedCount === 1 ? 'карточка' : completedCount < 5 ? 'карточки' : 'карточек'}
        </p>
        <div className="bg-gray-50 rounded-xl p-6 mb-8 mt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-2xl font-black text-indigo-600">{stats.dueToday}</div>
              <div className="text-gray-600">К повторению</div>
            </div>
            <div>
              <div className="text-2xl font-black text-green-600">{stats.mastered}</div>
              <div className="text-gray-600">Освоено</div>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              restartSession();
            }}
            className="w-full py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-lg shadow-xl active:scale-95 transition-all"
          >
            Повторить еще раз
          </button>
          <button 
            onClick={(e) => { 
              e.preventDefault();
              e.stopPropagation(); 
              console.log('🏠 SpacedRepetition: Returning to home from completion screen');
              if (onComplete) {
                onComplete();
              }
            }}
            className="w-full py-4 bg-gray-100 text-gray-600 rounded-[1.8rem] font-black active:scale-95 transition-all"
          >
            Вернуться к модулям
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="text-center p-10">
        <p className="text-gray-600">Карточка не найдена</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto min-h-[85vh] sm:min-h-[75vh] py-0 gap-0">
      {/* Кнопка выхода вверху */}
      <div className="w-full px-2 mb-2">
        <button 
          onClick={(e) => { 
            e.preventDefault();
            e.stopPropagation(); 
            console.log('🏠 SpacedRepetition: Exiting from active session');
            if (onComplete) {
              onComplete();
            }
          }}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 font-bold transition-all active:scale-95"
        >
          <i className="fas fa-arrow-left"></i>
          <span>Назад</span>
        </button>
      </div>

      {/* Статистика */}
      <div className="w-full px-2 mb-3 sm:mb-6">
        <div className="bg-indigo-50 rounded-xl p-4 mb-3">
          <div className="grid grid-cols-3 gap-2 text-xs text-center">
            <div>
              <div className="text-lg font-black text-indigo-600">{stats.dueToday}</div>
              <div className="text-gray-600">К повторению</div>
            </div>
            <div>
              <div className="text-lg font-black text-green-600">{stats.mastered}</div>
              <div className="text-gray-600">Освоено</div>
            </div>
            <div>
              <div className="text-lg font-black text-gray-700">{totalUserCards}</div>
              <div className="text-gray-600">Всего</div>
            </div>
          </div>
        </div>
        
        {/* Прогресс сессии */}
        <div className="flex gap-1">
          {sessionCards.map((cardId, i) => (
            <div
              key={cardId}
              className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                i < currentIndex
                  ? 'bg-green-500'
                  : i === currentIndex
                  ? 'bg-indigo-500'
                  : 'bg-gray-100'
              }`}
            ></div>
          ))}
        </div>
        <div className="text-center mt-1">
          <span className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
            {currentIndex + 1} / {sessionCards.length}
          </span>
        </div>
      </div>

      {/* Переключатель направления */}
      <div className="flex bg-gray-200/40 p-1.5 rounded-[1.2rem] mb-1 relative z-30">
        <button 
          onClick={(e) => { e.stopPropagation(); setDirection('de-ru'); setIsFlipped(false); }}
          className={`px-8 py-3 rounded-xl text-xs sm:text-[10px] font-black transition-all ${direction === 'de-ru' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
        >
          DE → RU
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); setDirection('ru-de'); setIsFlipped(false); }}
          className={`px-8 py-3 rounded-xl text-xs sm:text-[10px] font-black transition-all ${direction === 'ru-de' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
        >
          RU → DE
        </button>
      </div>

      {/* Карточка */}
      <div 
        className="card-flip w-full px-2 flex items-center justify-center my-1"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`card-inner relative w-full h-[200px] sm:h-[300px] ${isFlipped ? 'card-flipped' : ''}`}>
          <div className="card-face absolute w-full h-full bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center p-4 sm:p-8 border border-gray-50">
            <span className="absolute top-4 sm:top-8 text-[8px] sm:text-[10px] font-black text-indigo-200 uppercase tracking-[0.4em]">
              {direction === 'de-ru' ? 'Deutsch' : 'Русский'}
            </span>
            {direction === 'ru-de' ? (
              <div className="text-center mt-2 sm:mt-4">
                <h2 className="text-2xl sm:text-5xl font-black text-gray-800 leading-tight px-2 break-words">
                  {currentCard.ru}
                </h2>
              </div>
            ) : (
              <div className="text-center mt-2 sm:mt-4 space-y-2 sm:space-y-3">
                {isModule2Card ? (
                  // Для модуля 2: инфинитив + 3-е лицо Präsens (например, dürfen / er/sie/es darf)
                  <>
                    <div className="text-2xl sm:text-4xl font-black text-gray-800">{currentCard.praesens}</div>
                    <div className="text-2xl sm:text-4xl font-black text-gray-800">{getPraesensThirdPerson(currentCard.praesens)}</div>
                  </>
                ) : (
                  // Для модулей 3+: только 3 формы без префиксов
                  <>
                    <div className="text-2xl sm:text-4xl font-black text-gray-800">{currentCard.praesens}</div>
                    <div className="text-2xl sm:text-4xl font-black text-gray-800">{currentCard.praeteritum}</div>
                    <div className="text-2xl sm:text-4xl font-black text-gray-800">{currentCard.partizip2}</div>
                  </>
                )}
              </div>
            )}
            
            {direction === 'de-ru' ? (
              <button 
                onClick={handleAudioClick}
                disabled={isSpeaking}
                className={`mt-4 sm:mt-12 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-inner transition-transform relative z-20 ${
                  isSpeaking 
                    ? 'bg-indigo-200 text-indigo-400 cursor-not-allowed' 
                    : 'bg-indigo-50 text-indigo-600 active:scale-110'
                }`}
              >
                <i className={`fas ${isSpeaking ? 'fa-spinner fa-spin' : 'fa-volume-up'} text-lg sm:text-2xl`}></i>
              </button>
            ) : (
              <div className="mt-4 sm:mt-12 h-12 sm:h-16"></div>
            )}
            
            <span className="absolute bottom-4 sm:bottom-8 text-[7px] sm:text-[9px] font-bold text-gray-300 uppercase tracking-widest">Перевернуть</span>
          </div>
          
          <div className="card-face card-back absolute w-full h-full bg-indigo-600 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center p-4 sm:p-8 text-white">
            <span className="absolute top-4 sm:top-8 text-[8px] sm:text-[10px] font-black text-indigo-100 uppercase tracking-[0.4em]">
              {direction === 'de-ru' ? 'Русский' : 'Deutsch'}
            </span>
            {direction === 'ru-de' ? (
              <div className="text-center mt-2 sm:mt-4 space-y-2 sm:space-y-3">
                {isModule2Card ? (
                  // Для модуля 2: инфинитив + 3-е лицо Präsens (например, dürfen / er/sie/es darf)
                  <>
                    <div className="text-2xl sm:text-4xl font-black text-white">{currentCard.praesens}</div>
                    <div className="text-2xl sm:text-4xl font-black text-white">{getPraesensThirdPerson(currentCard.praesens)}</div>
                  </>
                ) : (
                  // Для модулей 3+: только 3 формы без префиксов
                  <>
                    <div className="text-2xl sm:text-4xl font-black text-white">{currentCard.praesens}</div>
                    <div className="text-2xl sm:text-4xl font-black text-white">{currentCard.praeteritum}</div>
                    <div className="text-2xl sm:text-4xl font-black text-white">{currentCard.partizip2}</div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center mt-2 sm:mt-4">
                <h2 className="text-2xl sm:text-5xl font-black text-white leading-tight px-2 break-words">
                  {currentCard.ru}
                </h2>
              </div>
            )}

            {direction === 'ru-de' ? (
              <button 
                onClick={handleAudioClick}
                disabled={isSpeaking}
                className={`mt-4 sm:mt-12 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border transition-transform relative z-20 ${
                  isSpeaking 
                    ? 'bg-white/5 text-white/50 border-white/10 cursor-not-allowed' 
                    : 'bg-white/10 text-white border-white/20 active:scale-110'
                }`}
              >
                <i className={`fas ${isSpeaking ? 'fa-spinner fa-spin' : 'fa-volume-up'} text-lg sm:text-2xl`}></i>
              </button>
            ) : (
              <div className="mt-4 sm:mt-12 h-12 sm:h-16"></div>
            )}
          </div>
        </div>
      </div>

      {/* Кнопки ответов */}
      <div className="grid grid-cols-2 gap-1 w-full px-2 mt-2">
        <button 
          onClick={(e) => { e.stopPropagation(); markResult(false); }}
          className="py-3 sm:py-4 bg-white text-red-500 border-2 border-red-50 rounded-[1.5rem] sm:rounded-[2rem] font-extrabold uppercase text-xs sm:text-[10px] flex flex-col items-center gap-1 sm:gap-1.5 active:bg-red-50"
        >
          <i className="fas fa-times text-xl sm:text-2xl"></i>
          Не знаю
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); markResult(true); }}
          className="py-3 sm:py-4 bg-white text-green-500 border-2 border-green-50 rounded-[1.5rem] sm:rounded-[2rem] font-extrabold uppercase text-xs sm:text-[10px] flex flex-col items-center gap-1 sm:gap-1.5 shadow-lg shadow-green-100/30 active:bg-green-50"
        >
          <i className="fas fa-check text-xl sm:text-2xl"></i>
          Знаю
        </button>
      </div>
    </div>
  );
};

export default SpacedRepetitionFlashcards;
