
import React, { useState, useEffect, useMemo } from 'react';
import { Topic, Word, VerbFormCard } from '../types';
import { playWordAudio, unlockAudio } from '../services/audioService';
import { TOPICS } from '../constants';

interface FlashcardsProps {
  topic: Topic;
  onComplete?: () => void;
  isTrialLesson?: boolean;
  trialLessonMessage?: string;
  onNextLesson?: () => void;
}

type CardMode = 'words' | 'verb-forms';

// Функция перемешивания массива
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const Flashcards: React.FC<FlashcardsProps> = ({ topic, onComplete, isTrialLesson = false, trialLessonMessage, onNextLesson }) => {
  // Для пробных уроков оставляем только указанные глаголы
  const trialVerbs = ['fahren', 'erfahren', 'laden', 'einladen', 'gewinnen', 'schwimmen', 'beginnen'];
  const allVerbFormCards = topic.verbFormCards || [];
  const filteredVerbFormCards = useMemo(() => {
    if (isTrialLesson) {
      return allVerbFormCards.filter(card => trialVerbs.includes(card.praesens));
    }
    return allVerbFormCards;
  }, [isTrialLesson, allVerbFormCards]);
  
  const [cardMode, setCardMode] = useState<CardMode>('words');
  
  // Определяем доступные режимы
  const hasWords = topic.words && topic.words.length > 0;
  const hasVerbForms = filteredVerbFormCards && filteredVerbFormCards.length > 0;
  
  // Автоматически выбираем режим
  useEffect(() => {
    if (!hasWords && hasVerbForms) {
      setCardMode('verb-forms');
    } else if (hasWords && !hasVerbForms) {
      setCardMode('words');
    } else if (hasWords && hasVerbForms && (topic.id === 'module-6' || topic.id === 'module-7' || topic.id === 'module-8' || topic.id === 'module-9' || topic.id === 'module-10' || topic.id === 'module-11')) {
      // В модулях 6, 7, 8, 9, 10 и 11 «Карточки» показывают инфинитив + er/sie/es — по умолчанию «Формы глаголов»
      setCardMode('verb-forms');
    }
  }, [hasWords, hasVerbForms, topic.id]);

  // Инициализируем с перемешанными индексами в зависимости от режима
  const [activeIndices, setActiveIndices] = useState<number[]>(() => {
    if (cardMode === 'verb-forms' && filteredVerbFormCards) {
      const indices = filteredVerbFormCards.map((_, i) => i);
      return shuffleArray(indices);
    } else {
      const indices = topic.words.map((_, i) => i);
      return shuffleArray(indices);
    }
  });
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState<'de-ru' | 'ru-de'>('ru-de'); // По умолчанию ru-de
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [sessionFinished, setSessionFinished] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const currentWordIndex = activeIndices[currentIndex];
  const currentWord = cardMode === 'words' ? topic.words[currentWordIndex] : null;
  const currentVerbCard = cardMode === 'verb-forms' && filteredVerbFormCards ? filteredVerbFormCards[currentWordIndex] : null;
  
  // Пересоздаем индексы при смене режима
  useEffect(() => {
    if (cardMode === 'verb-forms' && filteredVerbFormCards) {
      const indices = filteredVerbFormCards.map((_, i) => i);
      setActiveIndices(shuffleArray(indices));
    } else if (cardMode === 'words') {
      const indices = topic.words.map((_, i) => i);
      setActiveIndices(shuffleArray(indices));
    }
    setCurrentIndex(0);
    setResults({});
    setSessionFinished(false);
    setIsFlipped(false);
  }, [cardMode, topic.words, filteredVerbFormCards]);

  // Разблокируем аудио при монтировании компонента
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
    
    setIsSpeaking(true);
    
    try {
      // Убеждаемся, что аудио разблокировано
      await unlockAudio();
      
      // Используем OpenAI TTS с кэшированием для слов
      try {
        let wordText = '';
        if (cardMode === 'words' && currentWord) {
          wordText = currentWord.de.replace(/^(der|die|das)\s+/i, '').trim();
        } else if (cardMode === 'verb-forms' && currentVerbCard) {
          // Для модулей 2+: инфинитив и er/sie/es (раздел «Карточки»)
          if (isModule2OrHigher()) {
            const thirdPerson = getThirdPersonForVerbCard(currentVerbCard);
            wordText = `${currentVerbCard.praesens}, ${thirdPerson}`;
          } else {
            // Для модуля 1 — только инфинитив
            wordText = currentVerbCard.praesens;
          }
        }
        
        if (wordText) {
          const { playTextWithOpenAITTS } = await import('../services/openaiTtsService');
          await playTextWithOpenAITTS(wordText, 'de');
        }
      } catch (openaiError) {
        console.warn("⚠️ [TTS Engine: OpenAI] Failed, trying WAV file:", openaiError);
        // Fallback на WAV файл только для обычных слов
        if (cardMode === 'words' && currentWord) {
          try {
            await playWordAudio(topic.id, currentWord.id, currentWord.de, 'de');
            console.log("✅ WAV audio played successfully");
          } catch (wavError) {
            console.warn("⚠️ WAV file not found, using browser speech synthesis");
            // Fallback на SpeechSynthesis уже обработан в playWordAudio
          }
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
    const newResults = { ...results, [currentWordIndex]: isCorrect };
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
    if (cardMode === 'verb-forms' && filteredVerbFormCards) {
      const indices = filteredVerbFormCards.map((_, i) => i);
      setActiveIndices(shuffleArray(indices));
    } else {
      const indices = topic.words.map((_, i) => i);
      setActiveIndices(shuffleArray(indices));
    }
    setCurrentIndex(0);
    setResults({});
    setSessionFinished(false);
    setIsFlipped(false);
  };

  const retryErrors = () => {
    const errors = activeIndices.filter(idx => !results[idx]);
    setActiveIndices(shuffleArray(errors)); // Перемешиваем ошибки
    setCurrentIndex(0);
    setResults({});
    setSessionFinished(false);
    setIsFlipped(false);
  };
  
  // Проверяем, это модуль 2 или выше (по индексу в массиве TOPICS)
  const isModule2OrHigher = () => {
    const moduleIndex = TOPICS.findIndex(t => t.id === topic.id);
    // Индекс 0 = module1, индекс 1 = module2, индекс 2 = module3, и т.д.
    return moduleIndex >= 1; // module2 и выше (индекс >= 1)
  };

  const isModule3OrHigher = () => {
    const moduleIndex = TOPICS.findIndex(t => t.id === topic.id);
    return moduleIndex >= 2; // module3 и выше (индекс >= 2)
  };

  // Генерируем форму 3-го лица Präsens для инфинитива (например, fahren -> er/sie/es fährt)
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

    // Специальные случаи для неправильных глаголов
    const irregularVerbs: { [key: string]: string } = {
      'tun': 'er/sie/es tut',
      'abhängen von': 'er/sie/es hängt ab',
      'ausgehen': 'er/sie/es geht aus',
      'verlassen': 'er/sie/es verlässt',
      'auffallen': 'er/sie/es fällt auf',
      'festhalten': 'er/sie/es hält fest',
      'sein': 'er/sie/es ist',
      'haben': 'er/sie/es hat',
      'werden': 'er/sie/es wird',
      // Модуль 5 - ряды i/e-a-e и e-o-o
      'bitten': 'er/sie/es bittet',
      'liegen': 'er/sie/es liegt',
      'sitzen': 'er/sie/es sitzt',
      'essen': 'er/sie/es isst',
      'fressen': 'er/sie/es frisst',
      'geben': 'er/sie/es gibt',
      'vergeben': 'er/sie/es vergibt',
      'sehen': 'er/sie/es sieht',
      'aussehen': 'er/sie/es sieht aus',
      'lesen': 'er/sie/es liest',
      'messen': 'er/sie/es misst',
      'treten': 'er/sie/es tritt',
      'vergessen': 'er/sie/es vergisst',
      'heben': 'er/sie/es hebt',
      'abheben': 'er/sie/es hebt ab',
      'scheren': 'er/sie/es schert',
      'schmelzen': 'er/sie/es schmilzt',
      'schwellen': 'er/sie/es schwillt',
      'schwören': 'er/sie/es schwört'
    };

    if (irregularVerbs[infinitive]) {
      return irregularVerbs[infinitive];
    }

    // Проверяем отделяемые приставки
    const separablePrefixes = ['ab', 'an', 'auf', 'aus', 'bei', 'ein', 'mit', 'nach', 'vor', 'zu', 'zurück', 'weg', 'her', 'hin', 'los', 'da'];
    let prefix = '';
    let baseVerb = infinitive;
    
    for (const p of separablePrefixes) {
      if (infinitive.startsWith(p)) {
        prefix = p;
        baseVerb = infinitive.substring(p.length);
        break;
      }
    }

    // Для обычных глаголов: удаляем -en из инфинитива
    let stem = baseVerb.replace(/en$/, '');
    
    // Для сильных глаголов применяем изменение гласной (a->ä, o->ö, u->ü)
    // Ищем последнюю гласную a/o/u перед согласными и заменяем на умлаут
    // fahren -> fahr -> fähr, graben -> grab -> gräb
    const lastA = stem.lastIndexOf('a');
    const lastO = stem.lastIndexOf('o');
    const lastU = stem.lastIndexOf('u');
    
    // Находим позицию последней из a/o/u
    const lastVowelPos = Math.max(lastA, lastO, lastU);
    
    if (lastVowelPos !== -1) {
      const vowel = stem[lastVowelPos];
      // Проверяем, что после гласной идут согласные (не конец слова)
      if (lastVowelPos < stem.length - 1 && /[bcdfghjklmnpqrstvwxyzßhr]/.test(stem[lastVowelPos + 1])) {
        // Заменяем последнюю гласную на умлаут
        if (vowel === 'a') {
          stem = stem.substring(0, lastVowelPos) + 'ä' + stem.substring(lastVowelPos + 1);
        } else if (vowel === 'o') {
          stem = stem.substring(0, lastVowelPos) + 'ö' + stem.substring(lastVowelPos + 1);
        } else if (vowel === 'u') {
          stem = stem.substring(0, lastVowelPos) + 'ü' + stem.substring(lastVowelPos + 1);
        }
      }
    }
    
    // Если есть отделяемая приставка - добавляем ее в конец
    if (prefix) {
      return `er/sie/es ${stem}t ${prefix}`;
    }
    
    return `er/sie/es ${stem}t`;
  };

  /** er/sie/es для карточки: из erSieEs или getPraesensThirdPerson. */
  const getThirdPersonForVerbCard = (card: VerbFormCard): string =>
    card.erSieEs ?? getPraesensThirdPerson(card.praesens);

  const getPraeteritumDu = (praeteritum: string): string => {
    // Для большинства сильных глаголов форма "du" = praeteritum + "st"
    // Но есть исключения: если глагол оканчивается на "t", "d", "ß", добавляем "est"
    if (praeteritum.endsWith('t')) {
      // hielt -> hieltest, tat -> tatest
      return praeteritum + 'est';
    } else if (praeteritum.endsWith('d')) {
      // stand -> standest
      return praeteritum + 'est';
    } else if (praeteritum.endsWith('ß')) {
      // ließ -> ließest, aß -> aßest
      return praeteritum + 'est';
    } else {
      // Стандартное правило: добавляем "st"
      // blies -> bliest, briet -> briest, fiel -> fielst
      return praeteritum + 'st';
    }
  };

  // Получаем текст для отображения
  const getGermanText = () => {
    if (cardMode === 'words' && currentWord) {
      return currentWord.de;
    } else if (cardMode === 'verb-forms' && currentVerbCard) {
      const duForm = getPraeteritumDu(currentVerbCard.praeteritum);
      return `${currentVerbCard.praesens}\ner, sie, es ${currentVerbCard.praeteritum}\ndu ${duForm}`;
    }
    return '';
  };
  
  const getRussianText = () => {
    if (cardMode === 'words' && currentWord) {
      return currentWord.ru;
    } else if (cardMode === 'verb-forms' && currentVerbCard) {
      return currentVerbCard.ru;
    }
    return '';
  };

  const correctCount = Object.values(results).filter(Boolean).length;
  const errorCount = activeIndices.length - correctCount;

  if (sessionFinished) {
    return (
      <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100 text-center animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-inner">
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
              className="w-full py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-lg shadow-xl"
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

  const totalItems = cardMode === 'verb-forms' && filteredVerbFormCards ? filteredVerbFormCards.length : topic.words.length;

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

      {/* Переключатель режимов карточек (только если есть оба варианта) */}
      {hasWords && hasVerbForms && (
        <div className="flex bg-gray-200/40 p-1.5 rounded-[1.2rem] mb-2 sm:mb-3 relative z-30 w-full max-w-md px-2">
          <button 
            onClick={(e) => { e.stopPropagation(); setCardMode('words'); }}
            className={`flex-1 py-2.5 rounded-xl text-[10px] sm:text-[9px] font-black transition-all ${
              cardMode === 'words' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500'
            }`}
          >
            Слова
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setCardMode('verb-forms'); }}
            className={`flex-1 py-2.5 rounded-xl text-[10px] sm:text-[9px] font-black transition-all ${
              cardMode === 'verb-forms' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500'
            }`}
          >
            Формы глаголов
          </button>
        </div>
      )}

      <div className="flex bg-gray-200/40 p-1.5 rounded-[1.2rem] mb-1 relative z-30">
        <button 
          onClick={(e) => { e.stopPropagation(); setDirection('de-ru'); setIsFlipped(false); }}
          className={`px-8 py-2.5 rounded-xl text-xs sm:text-[10px] font-black transition-all ${direction === 'de-ru' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
        >
          DE → RU
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); setDirection('ru-de'); setIsFlipped(false); }}
          className={`px-8 py-2.5 rounded-xl text-xs sm:text-[10px] font-black transition-all ${direction === 'ru-de' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
        >
          RU → DE
        </button>
      </div>

      <div 
        className="card-flip w-full px-2 flex items-center justify-center my-1"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`card-inner relative w-full h-[200px] sm:h-[260px] ${isFlipped ? 'card-flipped' : ''}`}>
          <div className="card-face absolute w-full h-full bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center p-3 sm:p-6 border border-gray-50">
            {cardMode === 'verb-forms' && direction === 'ru-de' ? (
              <div className="text-center mt-1 sm:mt-2">
                <h2 className="text-2xl sm:text-4xl font-black text-gray-800 leading-tight px-2 break-words">
                  {getRussianText()}
                </h2>
              </div>
            ) : cardMode === 'verb-forms' && direction === 'de-ru' ? (
              <div className="text-center mt-1 sm:mt-2 space-y-1 sm:space-y-2">
                {currentVerbCard && (
                  <>
                    {isModule2OrHigher() ? (
                      // Для модулей 2+: инфинитив и er/sie/es (раздел «Карточки»)
                      <>
                        <div className="text-2xl sm:text-4xl font-black text-gray-800">{currentVerbCard.praesens}</div>
                        <div className="text-2xl sm:text-4xl font-black text-gray-800">{getThirdPersonForVerbCard(currentVerbCard)}</div>
                      </>
                    ) : (
                      // Для модуля 1: 3 формы (инфинитив, Präteritum)
                      <>
                        <div className="text-2xl sm:text-4xl font-black text-gray-800">{currentVerbCard.praesens}</div>
                        <div className="text-2xl sm:text-4xl font-black text-gray-800">er, sie, es {currentVerbCard.praeteritum}</div>
                        <div className="text-2xl sm:text-4xl font-black text-gray-800">du {getPraeteritumDu(currentVerbCard.praeteritum)}</div>
                      </>
                    )}
                  </>
                )}
              </div>
            ) : (
              <h2 className="text-2xl sm:text-4xl font-black text-center text-gray-800 leading-tight px-2 break-words mt-1 sm:mt-2">
                {direction === 'de-ru' ? getGermanText() : getRussianText()}
              </h2>
            )}
            
            {direction === 'de-ru' ? (
              <button 
                onClick={handleAudioClick}
                disabled={isSpeaking}
                className={`mt-2 sm:mt-4 w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-inner transition-transform relative z-20 ${
                  isSpeaking 
                    ? 'bg-blue-200 text-blue-400 cursor-not-allowed' 
                    : 'bg-blue-50 text-blue-600 active:scale-110'
                }`}
              >
                <i className={`fas ${isSpeaking ? 'fa-spinner fa-spin' : 'fa-volume-up'} text-base sm:text-xl`}></i>
              </button>
            ) : (
              <div className="mt-2 sm:mt-4 h-10 sm:h-14"></div>
            )}
            
            <span className="absolute bottom-2 sm:bottom-4 text-[7px] sm:text-[9px] font-bold text-gray-300 uppercase tracking-widest">Перевернуть</span>
          </div>
          
          <div className="card-face card-back absolute w-full h-full bg-blue-600 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center p-3 sm:p-6 text-white">
            {cardMode === 'verb-forms' && direction === 'ru-de' ? (
              <div className="text-center mt-1 sm:mt-2 space-y-1 sm:space-y-2">
                {currentVerbCard && (
                  <>
                    {isModule2OrHigher() ? (
                      // Для модулей 2+: инфинитив и er/sie/es (раздел «Карточки»)
                      <>
                        <div className="text-2xl sm:text-4xl font-black text-white">{currentVerbCard.praesens}</div>
                        <div className="text-2xl sm:text-4xl font-black text-white">{getThirdPersonForVerbCard(currentVerbCard)}</div>
                      </>
                    ) : (
                      // Для модуля 1: 3 формы (инфинитив, Präteritum)
                      <>
                        <div className="text-2xl sm:text-4xl font-black text-white">{currentVerbCard.praesens}</div>
                        <div className="text-2xl sm:text-4xl font-black text-white">er, sie, es {currentVerbCard.praeteritum}</div>
                        <div className="text-2xl sm:text-4xl font-black text-white">du {getPraeteritumDu(currentVerbCard.praeteritum)}</div>
                      </>
                    )}
                  </>
                )}
              </div>
            ) : cardMode === 'verb-forms' && direction === 'de-ru' ? (
              <div className="text-center mt-1 sm:mt-2">
                <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight px-2 break-words">
                  {getRussianText()}
                </h2>
              </div>
            ) : (
              <h2 className="text-2xl sm:text-4xl font-black text-center leading-tight px-2 break-words mt-1 sm:mt-2">
                {direction === 'de-ru' ? getRussianText() : getGermanText()}
              </h2>
            )}

            {direction === 'ru-de' ? (
              <button 
                onClick={handleAudioClick}
                disabled={isSpeaking}
                className={`mt-2 sm:mt-4 w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border transition-transform relative z-20 ${
                  isSpeaking 
                    ? 'bg-white/5 text-white/50 border-white/10 cursor-not-allowed' 
                    : 'bg-white/10 text-white border-white/20 active:scale-110'
                }`}
              >
                <i className={`fas ${isSpeaking ? 'fa-spinner fa-spin' : 'fa-volume-up'} text-base sm:text-xl`}></i>
              </button>
            ) : (
              <div className="mt-2 sm:mt-4 h-10 sm:h-14"></div>
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

      {/* Кнопка "Вперед ко второму уроку" для пробных уроков - под карточками */}
      {isTrialLesson && onNextLesson && !sessionFinished && (
        <div className="w-full px-2 mt-4 mb-2">
          <button 
            onClick={onNextLesson}
            className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 text-white rounded-xl font-black text-base shadow-lg hover:shadow-xl active:scale-95 transition-all"
          >
            Вперед ко второму уроку
          </button>
        </div>
      )}
    </div>
  );
};

export default Flashcards;
