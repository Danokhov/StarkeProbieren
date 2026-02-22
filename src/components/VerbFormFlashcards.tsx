import React, { useState, useEffect, useMemo } from 'react';
import { Topic, VerbFormCard } from '../types';
import { unlockAudio } from '../services/audioService';
import { TOPICS, TRIAL_VERBS } from '../constants';

interface VerbFormFlashcardsProps {
  topic: Topic;
  onComplete?: () => void;
  isTrialLesson?: boolean;
  trialLessonMessage?: string;
  onNextLesson?: () => void;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const VerbFormFlashcards: React.FC<VerbFormFlashcardsProps> = ({ topic, onComplete, isTrialLesson = false, trialLessonMessage, onNextLesson }) => {
  // Для пробных уроков оставляем только указанные глаголы
  const allVerbFormCards = topic.verbFormCards || [];
  const verbFormCards = useMemo(() => {
    if (isTrialLesson) {
      return allVerbFormCards.filter(card => TRIAL_VERBS.includes(card.praesens));
    }
    return allVerbFormCards;
  }, [isTrialLesson, allVerbFormCards]);
  
  const [activeIndices, setActiveIndices] = useState<number[]>(() => {
    const indices = verbFormCards.map((_, i) => i);
    return shuffleArray(indices);
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState<'de-ru' | 'ru-de'>('ru-de');
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [sessionFinished, setSessionFinished] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const currentCardIndex = activeIndices[currentIndex];
  const currentCard = verbFormCards[currentCardIndex];

  // Определяем индекс модуля
  const moduleIndex = TOPICS.findIndex(t => t.id === topic.id);
  const isModule2Card = moduleIndex === 1; // Модуль 2 (индекс 1)

  // Проверяем, это модуль 2 или выше (по индексу в массиве TOPICS)
  const isModule2OrHigher = () => {
    return moduleIndex >= 1; // module2 и выше (индекс >= 1)
  };

  const isModule3OrHigher = () => {
    return moduleIndex >= 2; // module3 и выше (индекс >= 2)
  };

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

    // Для обычных глаголов применяем стандартную логику
    let stem = infinitive.replace(/en$/, '');
    
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

  useEffect(() => {
    unlockAudio().catch((err) => {
      console.warn("⚠️ Failed to unlock audio on mount:", err);
    });
  }, []);

  const handleAudioClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Блокируем повторные нажатия
    if (isSpeaking) {
      console.log("⏸️ Already speaking, ignoring click");
      return;
    }
    
    if (!currentCard) return;
    
    console.log("🔊 VerbFormFlashcards: handleAudioClick called", { 
      verb: currentCard.praesens,
      cardId: currentCard.id,
      topicId: topic.id 
    });
    
    setIsSpeaking(true);
    
    try {
      // Убеждаемся, что аудио разблокировано
      await unlockAudio();
      console.log("✅ Audio unlocked before speaking");
      
      // Используем OpenAI TTS для озвучки
      try {
        const { playTextWithOpenAITTS } = await import('../services/openaiTtsService');
        
        // Для модулей 3+ озвучиваем три формы (инфинитив, Präteritum, Partizip II)
        if (isModule3OrHigher()) {
          await playTextWithOpenAITTS(currentCard.praesens, 'de');
          await new Promise(resolve => setTimeout(resolve, 500));
          await playTextWithOpenAITTS(currentCard.praeteritum, 'de');
          await new Promise(resolve => setTimeout(resolve, 500));
          await playTextWithOpenAITTS(currentCard.partizip2, 'de');
          await new Promise(resolve => setTimeout(resolve, 300));
        } else if (isModule2OrHigher()) {
          // Для модуля 2 озвучиваем: "infinitive, er/sie/es Präsens"
          const thirdPerson = getPraesensThirdPerson(currentCard.praesens);
          await playTextWithOpenAITTS(`${currentCard.praesens}, ${thirdPerson}`, 'de');
        } else {
          // Для модуля 1 озвучиваем только инфинитив
          await playTextWithOpenAITTS(currentCard.praesens, 'de');
        }
        console.log("✅ OpenAI TTS played successfully");
      } catch (openaiError) {
        console.warn("⚠️ [TTS Engine: OpenAI] Failed, switching to fallback:", openaiError);
        // Fallback на browser speech synthesis с правильной настройкой языка
        const { playTextWithSpeechSynthesis } = await import('../services/audioService');
        if (isModule3OrHigher()) {
          await playTextWithSpeechSynthesis(currentCard.praesens, 'de');
          await new Promise(resolve => setTimeout(resolve, 500));
          await playTextWithSpeechSynthesis(currentCard.praeteritum, 'de');
          await new Promise(resolve => setTimeout(resolve, 500));
          await playTextWithSpeechSynthesis(currentCard.partizip2, 'de');
          await new Promise(resolve => setTimeout(resolve, 300));
        } else if (isModule2OrHigher()) {
          const thirdPerson = getPraesensThirdPerson(currentCard.praesens);
          await playTextWithSpeechSynthesis(`${currentCard.praesens}, ${thirdPerson}`, 'de');
        } else {
          await playTextWithSpeechSynthesis(currentCard.praesens, 'de');
        }
      }
      
      // Пауза после воспроизведения
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error("❌ Error in handleAudioClick:", error);
      // Пауза даже при ошибке
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsSpeaking(false);
    }
  };

  const markResult = (isCorrect: boolean) => {
    const newResults = { ...results, [currentCardIndex]: isCorrect };
    setResults(newResults);

    if (currentIndex + 1 < activeIndices.length) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 150);
    } else {
      // Проверяем, что все карточки пройдены правильно
      const allResults = { ...newResults };
      const allCorrect = activeIndices.every(index => allResults[index] === true);
      
      setSessionFinished(true);
      if (onComplete && allCorrect) {
        onComplete();
      }
    }
  };

  const restartAll = () => {
    const indices = verbFormCards.map((_, i) => i);
    setActiveIndices(shuffleArray(indices));
    setCurrentIndex(0);
    setResults({});
    setSessionFinished(false);
    setIsFlipped(false);
  };

  const retryErrors = () => {
    const errors = activeIndices.filter(idx => !results[idx]);
    setActiveIndices(shuffleArray(errors));
    setCurrentIndex(0);
    setResults({});
    setSessionFinished(false);
    setIsFlipped(false);
  };

  const correctCount = Object.values(results).filter(Boolean).length;
  const errorCount = activeIndices.length - correctCount;

  if (sessionFinished) {
    return (
      <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100 text-center animate-in zoom-in mx-2">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
          <i className="fas fa-flag-checkered"></i>
        </div>
        <h3 className="text-3xl font-black text-gray-800 mb-3">Готово!</h3>
        <p className="text-lg text-gray-500 mb-8 font-medium">Результат: {correctCount} / {activeIndices.length}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-green-50 p-5 rounded-[1.8rem] border border-green-100">
            <p className="text-2xl font-black text-green-600">{correctCount}</p>
            <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mt-1">Знаю</p>
          </div>
          <div className="bg-red-50 p-5 rounded-[1.8rem] border border-red-100">
            <p className="text-2xl font-black text-red-600">{errorCount}</p>
            <p className="text-[10px] font-black text-red-700 uppercase tracking-widest mt-1">Ошибки</p>
          </div>
        </div>

        <div className="space-y-3">
          {errorCount > 0 && (
            <button 
              onClick={retryErrors}
              className="w-full py-5 bg-green-600 text-white rounded-[1.8rem] font-black text-lg shadow-xl"
            >
              Повторить ошибки
            </button>
          )}
          <button onClick={restartAll} className="w-full py-4 bg-gray-100 text-gray-600 rounded-[1.8rem] font-black">
            Начать заново
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard || verbFormCards.length === 0) {
    return (
      <div className="bg-white rounded-[2.5rem] p-8 text-center">
        <p className="text-gray-600 font-bold">Карточки пока недоступны.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto min-h-[85vh] sm:min-h-[75vh] py-0 gap-0">
      {/* Специальный текст для пробных уроков */}
      {isTrialLesson && trialLessonMessage && (
        <div className="w-full px-2 mb-4">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-4 border-2 border-purple-200">
            <p className="text-gray-700 text-sm font-bold leading-relaxed text-center">
              {trialLessonMessage}
            </p>
          </div>
        </div>
      )}

      <div className="flex bg-gray-200/40 p-1.5 rounded-[1.2rem] mb-1 relative z-30">
        <button 
          onClick={(e) => { e.stopPropagation(); setDirection('de-ru'); setIsFlipped(false); }}
          className={`px-8 py-3 rounded-xl text-xs sm:text-[10px] font-black transition-all ${direction === 'de-ru' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}
        >
          DE → RU
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); setDirection('ru-de'); setIsFlipped(false); }}
          className={`px-8 py-3 rounded-xl text-xs sm:text-[10px] font-black transition-all ${direction === 'ru-de' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}
        >
          RU → DE
        </button>
      </div>

      <div 
        className="card-flip w-full px-2 flex items-center justify-center my-1"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`card-inner relative w-full h-[200px] sm:h-[300px] ${isFlipped ? 'card-flipped' : ''}`}>
          <div className="card-face absolute w-full h-full bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center p-4 sm:p-8 border border-gray-50">
            {direction === 'ru-de' ? (
              <div className="text-center mt-2 sm:mt-4">
                <h2 className="text-2xl sm:text-5xl font-black text-gray-800 leading-tight px-2 break-words">
                  {currentCard.ru}
                </h2>
              </div>
            ) : (
              <div className="text-center mt-2 sm:mt-4 space-y-2 sm:space-y-3">
                {isModule2OrHigher() ? (
                  isModule2Card ? (
                    // Модуль 2 (модальные): инфинитив и er/sie/es
                    <>
                      <div className="text-2xl sm:text-4xl font-black text-gray-800">{currentCard.praesens}</div>
                      <div className="text-2xl sm:text-4xl font-black text-gray-800">{getPraesensThirdPerson(currentCard.praesens)}</div>
                    </>
                  ) : (
                    // Модули 3+: три формы (инфинитив — Präteritum — Partizip II)
                    <>
                      <div className="text-2xl sm:text-4xl font-black text-gray-800">{currentCard.praesens}</div>
                      <div className="text-2xl sm:text-4xl font-black text-gray-800">{currentCard.praeteritum}</div>
                      <div className="text-2xl sm:text-4xl font-black text-gray-800">{currentCard.partizip2}</div>
                    </>
                  )
                ) : (
                  // Для модуля 1 показываем 3 формы с префиксами
                  <>
                    <div className="text-2xl sm:text-4xl font-black text-gray-800">{currentCard.praesens}</div>
                    <div className="text-2xl sm:text-4xl font-black text-gray-800">er, sie, es {currentCard.praeteritum}</div>
                    <div className="text-2xl sm:text-4xl font-black text-gray-800">{currentCard.auxillary} {currentCard.partizip2}</div>
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
                    ? 'bg-green-200 text-green-400 cursor-not-allowed' 
                    : 'bg-green-50 text-green-600 active:scale-110'
                }`}
              >
                <i className={`fas ${isSpeaking ? 'fa-spinner fa-spin' : 'fa-volume-up'} text-lg sm:text-2xl`}></i>
              </button>
            ) : (
              <div className="mt-4 sm:mt-12 h-12 sm:h-16"></div>
            )}
            
            <span className="absolute bottom-4 sm:bottom-8 text-[7px] sm:text-[9px] font-bold text-gray-300 uppercase tracking-widest">Перевернуть</span>
          </div>
          
          <div className="card-face card-back absolute w-full h-full bg-green-600 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center p-4 sm:p-8 text-white">
            {direction === 'ru-de' ? (
              <div className="text-center mt-2 sm:mt-4 space-y-2 sm:space-y-3">
                {isModule2OrHigher() ? (
                  isModule2Card ? (
                    // Модуль 2 (модальные): инфинитив и er/sie/es
                    <>
                      <div className="text-2xl sm:text-4xl font-black text-white">{currentCard.praesens}</div>
                      <div className="text-2xl sm:text-4xl font-black text-white">{getPraesensThirdPerson(currentCard.praesens)}</div>
                    </>
                  ) : (
                    // Модули 3+: три формы (инфинитив — Präteritum — Partizip II)
                    <>
                      <div className="text-2xl sm:text-4xl font-black text-white">{currentCard.praesens}</div>
                      <div className="text-2xl sm:text-4xl font-black text-white">{currentCard.praeteritum}</div>
                      <div className="text-2xl sm:text-4xl font-black text-white">{currentCard.partizip2}</div>
                    </>
                  )
                ) : (
                  // Для модуля 1 показываем 3 формы с префиксами
                  <>
                    <div className="text-2xl sm:text-4xl font-black text-white">{currentCard.praesens}</div>
                    <div className="text-2xl sm:text-4xl font-black text-white">er, sie, es {currentCard.praeteritum}</div>
                    <div className="text-2xl sm:text-4xl font-black text-white">{currentCard.auxillary} {currentCard.partizip2}</div>
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

      <div className="grid grid-cols-2 gap-1 w-full px-2 mt-2">
        <button 
          onClick={(e) => { e.stopPropagation(); markResult(false); }}
          className="py-3 sm:py-3 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl font-extrabold uppercase text-xs sm:text-sm flex flex-col items-center gap-1 shadow-lg shadow-red-200 active:scale-95 transition-all"
        >
          <i className="fas fa-times text-lg sm:text-xl"></i>
          Трудно
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); markResult(true); }}
          className="py-3 sm:py-3 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl font-extrabold uppercase text-xs sm:text-sm flex flex-col items-center gap-1 shadow-lg shadow-green-200 active:scale-95 transition-all"
        >
          <i className="fas fa-check text-lg sm:text-xl"></i>
          Знаю
        </button>
      </div>

      {/* Кнопка "Перейти к следующим упражнениям" для пробных уроков - под карточками */}
      {isTrialLesson && onNextLesson && !sessionFinished && (
        <div className="w-full px-2 mt-4 mb-2">
          <button 
            onClick={onNextLesson}
            className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 text-white rounded-xl font-black text-base shadow-lg hover:shadow-xl active:scale-95 transition-all"
          >
            Перейти к следующим упражнениям
          </button>
        </div>
      )}
    </div>
  );
};

export default VerbFormFlashcards;

