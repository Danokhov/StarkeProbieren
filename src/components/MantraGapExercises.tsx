import React, { useState, useEffect, useMemo } from 'react';
import { Topic, User } from '../types';
// ProgressService удален - используем только localStorage
import { TOPICS, TRIAL_VERBS } from '../constants';

interface MantraGapExercisesProps {
  topic: Topic;
  user?: User;
  onComplete?: () => void;
  onItemProgressUpdate?: () => void; // Callback для обновления прогресса в App.tsx
  isTrialLesson?: boolean;
}

type TenseMode = 'präsens' | 'präteritum' | 'partizip2';

const MantraGapExercises: React.FC<MantraGapExercisesProps> = ({ topic, user, onComplete, onItemProgressUpdate, isTrialLesson = false }) => {
  const allExercises = useMemo(() => {
    const exercises = topic.mantraGapExercises || [];
    if (isTrialLesson && topic.id === 'module-3') {
      return exercises.filter(ex => 
        TRIAL_VERBS.some(v => ex.id?.startsWith(v + '-') || ex.id === v)
      );
    }
    return exercises;
  }, [topic, isTrialLesson]);
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [exerciseMode, setExerciseMode] = useState<'all' | 'errors'>('all');
  const [exercises, setExercises] = useState<typeof allExercises>([]);
  const [exerciseIndices, setExerciseIndices] = useState<number[]>([]); // Индексы упражнений в исходном массиве
  const [currentExercise, setCurrentExercise] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [tenseMode, setTenseMode] = useState<TenseMode>('präsens');
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [sessionFinished, setSessionFinished] = useState(false);
  const [itemProgress, setItemProgress] = useState<Record<string | number, boolean>>({});
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0); // Подряд правильных ответов
  const [showMilestone, setShowMilestone] = useState(false); // Показывать поздравление
  const [showAllComplete, setShowAllComplete] = useState(false); // Показывать поздравление о прохождении всех упражнений
  const [shuffledOptionsMap, setShuffledOptionsMap] = useState<Record<string, string[]>>({}); // Сохраненный порядок вариантов для каждого упражнения (ключ: "index-tense")

  const currentEx = exercises.length > 0 && currentExercise < exercises.length ? exercises[currentExercise] : null;
  const currentOriginalIndex = exerciseIndices.length > 0 && currentExercise < exerciseIndices.length ? exerciseIndices[currentExercise] : undefined; // Оригинальный индекс в allExercises

  // Получаем текущее предложение в зависимости от режима времени
  const getCurrentSentence = (): string => {
    if (!currentEx) return '';
    // Для Модуля 1 и Модуля 2 всегда используем только Partizip 2
    if (topic.id === 'house-cleaning' || topic.id === 'job-interview') {
      return currentEx.sentence_partizip2 || '';
    }
    switch (tenseMode) {
      case 'präteritum':
        return currentEx.sentence_praeteritum || currentEx.sentence_praesens || '';
      case 'partizip2':
        return currentEx.sentence_partizip2 || currentEx.sentence_praesens || '';
      default:
        return currentEx.sentence_praesens || '';
    }
  };

  // Получаем правильный ответ в зависимости от режима времени
  const getCorrectAnswer = (): string => {
    if (!currentEx) return '';
    // Для Модуля 1 и Модуля 2 всегда используем только Partizip 2
    if (topic.id === 'house-cleaning' || topic.id === 'job-interview') {
      return currentEx.correct_partizip2 || '';
    }
    switch (tenseMode) {
      case 'präteritum':
        return currentEx.correct_praeteritum || currentEx.correct_praesens || '';
      case 'partizip2':
        return currentEx.correct_partizip2 || currentEx.correct_praesens || '';
      default:
        return currentEx.correct_praesens || '';
    }
  };

  // Получаем варианты ответов в зависимости от режима времени
  const getOptions = (): string[] => {
    if (!currentEx) return [];
    // Для Модуля 1 и Модуля 2 всегда используем только Partizip 2
    if (topic.id === 'house-cleaning' || topic.id === 'job-interview') {
      return currentEx.options_partizip2 || [];
    }
    switch (tenseMode) {
      case 'präteritum':
        return currentEx.options_praeteritum || currentEx.options_praesens || currentEx.options || [];
      case 'partizip2':
        return currentEx.options_partizip2 || currentEx.options_praesens || currentEx.options || [];
      default:
        return currentEx.options_praesens || currentEx.options || [];
    }
  };

  const handleSelect = async (option: string) => {
    if (showResult) return;
    
    // Проверяем, что все необходимое для проверки ответа доступно
    if (!currentEx) {
      console.warn('currentEx is undefined');
      return;
    }
    
    if (currentOriginalIndex === undefined) {
      console.warn('currentOriginalIndex is undefined', { currentExercise, exerciseIndices });
      return;
    }
    
    setSelectedOption(option);
    
    // Автоматически проверяем ответ сразу после выбора
    
    const correct = option === getCorrectAnswer();
    setIsCorrect(correct);
    setShowResult(true);
    
    // Обновляем результаты для текущей сессии
    const newResults = { ...results, [currentExercise]: correct };
    setResults(newResults);
    
    // Определяем ключ прогресса (для модулей 3+ - строка, для 1-2 - число)
    const moduleIndex = TOPICS.findIndex(t => t.id === topic.id);
    const isModule3Plus = moduleIndex >= 2;
    
    let progressKey: string | number;
    if (isModule3Plus && currentEx?.id) {
      // Для модулей 3+: используем id упражнения + суффикс времени
      progressKey = `${currentEx.id}-${tenseMode}`;
    } else {
      // Для модулей 1-2: используем оригинальный индекс
      progressKey = currentOriginalIndex ?? 0;
    }
    
    // Обновляем прогресс по правильному ключу
    const newItemProgress = { ...itemProgress, [progressKey]: correct };
    setItemProgress(newItemProgress);
    
    // Обновляем счетчик подряд правильных ответов (только для текущей сессии)
    if (correct) {
      const newConsecutive = consecutiveCorrect + 1;
      setConsecutiveCorrect(newConsecutive);
      
      // Проверяем каждые 10 правильных ответов подряд
      if (newConsecutive > 0 && newConsecutive % 10 === 0) {
        setShowMilestone(true);
        // Не переходим к следующему упражнению автоматически, ждем нажатия кнопки
        return;
      }
    } else {
      setConsecutiveCorrect(0);
    }
    
    // Пересчитываем score на основе всего прогресса
    const newScore = Object.values(newItemProgress).filter(Boolean).length;
    setScore(newScore);
    
    // Сохраняем прогресс в Firebase/localStorage (временный прогресс всегда сохраняется)
    if (user) {
      try {
        console.log('💾 Saving temporary progress:', {
          topicId: topic.id,
          isModule3Plus,
          progressKey,
          correct,
          currentExId: currentEx?.id,
          tenseMode
        });
        
        // Сохраняем прогресс в localStorage
        const itemProgressKey = `promnemo_item_progress_${user.telegramId}`;
        const savedItemProgressData = localStorage.getItem(itemProgressKey);
        const currentItemProgress = savedItemProgressData ? JSON.parse(savedItemProgressData) : {};
        
        const updatedItemProgress = {
          ...currentItemProgress,
          [topic.id]: {
            ...currentItemProgress[topic.id],
            exercises: {
              ...(currentItemProgress[topic.id]?.['exercises'] || {}),
              [progressKey]: correct
            }
          }
        };
        localStorage.setItem(itemProgressKey, JSON.stringify(updatedItemProgress));
        
        // Загружаем обновленный прогресс для вычисления процента
        const savedExercisesProgress = updatedItemProgress[topic.id]?.['exercises'] || {};
        
        // Вычисляем процент выполнения
        let percentage = 0;
        
        if (isModule3Plus && allExercises.length > 0) {
          // Для модулей 3+: считаем прогресс отдельно по каждому времени
          const tenses: TenseMode[] = ['präsens', 'präteritum', 'partizip2'];
          let totalCorrect = 0;
          let totalPossible = 0;
          
          allExercises.forEach(ex => {
            if (ex.id) {
              tenses.forEach(tense => {
                totalPossible++;
                const key = `${ex.id}-${tense}`;
                if (savedExercisesProgress[key] === true) {
                  totalCorrect++;
                }
              });
            }
          });
          
          percentage = totalPossible > 0 ? Math.round((totalCorrect / totalPossible) * 100) : 0;
        } else {
          // Для модулей 1-2: общий % правильных ответов
          const correctCount = Object.values(savedExercisesProgress).filter(Boolean).length;
          percentage = allExercises.length > 0 ? Math.round((correctCount / allExercises.length) * 100) : 0;
        }
        
        // Проверяем, все ли упражнения пройдены правильно (100%)
        let allExercisesComplete = false;
        let hasIncorrect = false;
        
        if (isModule3Plus) {
          const tenses: TenseMode[] = ['präsens', 'präteritum', 'partizip2'];
          allExercisesComplete = allExercises.every((ex) => {
            if (!ex.id) return false;
            return tenses.every(tense => {
              const key = `${ex.id}-${tense}`;
              return savedExercisesProgress[key] === true;
            });
          });
          hasIncorrect = allExercises.some((ex) => {
            if (!ex.id) return false;
            return tenses.some(tense => {
              const key = `${ex.id}-${tense}`;
              return savedExercisesProgress[key] === false;
            });
          });
        } else {
          allExercisesComplete = allExercises.every((_, idx) => savedExercisesProgress[idx] === true);
          hasIncorrect = allExercises.some((_, idx) => savedExercisesProgress[idx] === false);
        }
        
        // Обновляем процент в progress (временный прогресс) - уже обработано выше в localStorage
        if (allExercisesComplete && !hasIncorrect) {
          // Все упражнения пройдены правильно - фиксируем раздел как пройденный навсегда (100%)
          console.log('✅ All exercises complete - marking section as completed and fixed at 100%');
          if (onComplete) {
            onComplete(); // Фиксируем раздел как пройденный
          }
        } else {
          // Временный прогресс - уже сохранен в localStorage выше
          console.log('✅ Temporary progress saved successfully:', {
            topicId: topic.id,
            progressKey,
            correct,
            percentage,
            savedProgressCount: Object.keys(savedExercisesProgress).length,
            allExercisesComplete,
            hasIncorrect
          });
        }
        
        // Обновляем прогресс в App.tsx после сохранения
        if (onItemProgressUpdate) {
          onItemProgressUpdate();
        }
      } catch (error) {
        console.error('Error saving item progress:', error);
      }
    }
  };

  const handleNext = async () => {
    if (!showResult) return; // Можно перейти только после проверки
    
    // Если показывается поздравление, просто скрываем его и продолжаем
    if (showMilestone) {
      setShowMilestone(false);
      return;
    }
    
    if (currentExercise < exercises.length - 1) {
      // Переход к следующему упражнению
      setCurrentExercise(currentExercise + 1);
      setSelectedOption(null);
      setShowResult(false);
      setIsCorrect(null);
      // Счетчик consecutiveCorrect НЕ сбрасываем - он продолжает работать для серии правильных ответов
    } else {
      // Достигли последнего упражнения - проверяем статус всех упражнений в модуле
      // Проверяем, это модуль 3+
      const moduleIndex = TOPICS.findIndex(t => t.id === topic.id);
      const isModule3Plus = moduleIndex >= 2;
      
      // Проверяем статус ВСЕХ упражнений в модуле (не только текущей сессии)
      let allExercisesComplete: boolean;
      let hasIncorrect: boolean;
      
      if (isModule3Plus) {
        // Для модулей 3+: проверяем прогресс для ВСЕХ времен (Präsens, Präteritum, Partizip II)
        const tenses: TenseMode[] = ['präsens', 'präteritum', 'partizip2'];
        allExercisesComplete = allExercises.every((ex) => {
          if (!ex.id) return false;
          // Проверяем, что для всех времен упражнение пройдено правильно
          return tenses.every(tense => {
            const progressKey = `${ex.id}-${tense}`;
            return itemProgress[progressKey] === true;
          });
        });
        hasIncorrect = allExercises.some((ex) => {
          if (!ex.id) return false;
          // Проверяем, есть ли хотя бы одно время с неправильным ответом
          return tenses.some(tense => {
            const progressKey = `${ex.id}-${tense}`;
            return itemProgress[progressKey] === false;
          });
        });
      } else {
        // Для модулей 1-2: используем числовые индексы
        allExercisesComplete = allExercises.every((_, idx) => itemProgress[idx] === true);
        hasIncorrect = allExercises.some((_, idx) => itemProgress[idx] === false);
      }
      
      console.log('🎯 Last exercise reached:', {
        isModule3Plus,
        tenseMode,
        currentExercise,
        exercisesLength: exercises.length,
        allExercisesLength: allExercises.length,
        allExercisesComplete,
        hasIncorrect,
        itemProgressKeys: Object.keys(itemProgress),
        itemProgress
      });
      
      setSessionFinished(true);
      
      if (allExercisesComplete && !hasIncorrect) {
        // Все упражнения пройдены правильно - фиксируем раздел как пройденный навсегда
        console.log('✅ All exercises complete - marking section as completed');
        if (onComplete) {
          onComplete(); // Фиксируем раздел как пройденный
        }
        setShowAllComplete(true);
      } else if (hasIncorrect) {
        // Есть неправильные - показываем предложение пройти неправильные
        console.log('❌ Has incorrect - showing retry option');
        setShowAllComplete(true);
      } else {
        // Если есть непройденные, но нет неправильных - НЕ фиксируем раздел
        // Прогресс сохраняется временно в itemProgress, но раздел не отмечается как пройденный
        console.log('⚠️ Some exercises not completed - NOT marking as completed, progress saved temporarily');
        setShowAllComplete(true);
      }
    }
  };

  const handlePrev = () => {
    if (currentExercise > 0) {
      setCurrentExercise(currentExercise - 1);
      setSelectedOption(null);
      setShowResult(false);
      setIsCorrect(null);
    }
  };

  const restartAll = async () => {
    // Перезапускаем с режимом "все упражнения"
    initializeExercises('all', itemProgress);
    setSessionFinished(false);
    setConsecutiveCorrect(0);
  };

  const retryErrors = () => {
    // Перезапускаем с режимом "только ошибки"
    initializeExercises('errors', itemProgress);
    setSessionFinished(false);
    setConsecutiveCorrect(0);
  };

  useEffect(() => {
    // При смене упражнения проверяем, есть ли сохраненный прогресс
    if (!currentEx || currentOriginalIndex === undefined) return;
    
    // НЕ показываем сохраненный результат автоматически при переходе к упражнению
    // Пользователь должен видеть пробел и сам выбрать ответ
    setSelectedOption(null);
    setShowResult(false);
    setIsCorrect(null);
    
    // Если для этого упражнения еще нет перемешанных вариантов, создаем их один раз
    // Проверяем не только наличие ключа, но и что массив не пустой
    // Ключ включает и индекс упражнения, и режим времени
    const optionsKey = `${currentExercise}-${tenseMode}`;
    if (!shuffledOptionsMap[optionsKey] || shuffledOptionsMap[optionsKey].length === 0) {
      const currentOptions = getOptions();
      console.log(`🔄 Обновление опций для ключа "${optionsKey}":`, currentOptions);
      if (currentOptions && currentOptions.length > 0) {
        const shuffled = [...currentOptions].sort(() => Math.random() - 0.5);
        setShuffledOptionsMap(prev => ({
          ...prev,
          [optionsKey]: shuffled
        }));
      }
    }
  }, [tenseMode, currentExercise]);

  // Для Модуля 1 и Модуля 2 автоматически устанавливаем режим Partizip 2
  useEffect(() => {
    if (topic.id === 'house-cleaning' || topic.id === 'job-interview') {
      setTenseMode('partizip2');
    }
  }, [topic.id]);

  // Загружаем сохраненный прогресс по items при монтировании
  useEffect(() => {
    const loadSavedProgress = async () => {
      if (!user) {
        // Если нет пользователя, сразу показываем все упражнения
        initializeExercises('all', {});
        return;
      }
      
      try {
        const itemProgressKey = `promnemo_item_progress_${user.telegramId}`;
        const savedItemProgressData = localStorage.getItem(itemProgressKey);
        const savedItemProgress = savedItemProgressData ? JSON.parse(savedItemProgressData) : {};
        const moduleProgress = savedItemProgress[topic.id]?.['exercises'] || {};
        
        console.log('📥 Loaded progress from DB:');
        console.log('  Topic ID:', topic.id);
        console.log('  Module Progress:', JSON.stringify(moduleProgress, null, 2));
        console.log('  Saved Item Progress Keys:', Object.keys(savedItemProgress));
        
        // Проверяем, это модуль 3+
        const moduleIndex = TOPICS.findIndex(t => t.id === topic.id);
        const isModule3Plus = moduleIndex >= 2;
        
        // Для модулей 3+: сохраняем прогресс как есть (со строковыми ключами)
        // Для модулей 1-2: преобразуем строковые ключи в числа
        let progressMap: Record<string | number, boolean> = {};
        if (isModule3Plus) {
          progressMap = moduleProgress;
        } else {
          Object.keys(moduleProgress).forEach(key => {
            const index = parseInt(key, 10);
            if (!isNaN(index)) {
              progressMap[index] = moduleProgress[index];
            }
          });
        }
        
        setItemProgress(progressMap as any);
        setResults(progressMap as any);
        
        // Подсчитываем правильные ответы из сохраненного прогресса
        const correctCount = Object.values(progressMap).filter(Boolean).length;
        setScore(correctCount);
        
        // Проверяем, есть ли реально пройденные (true или false) ответы для ТЕКУЩЕГО времени
        // НЕ считаем undefined (непройденные) как прогресс
        let hasRelevantProgress = false;
        
        if (isModule3Plus) {
          // Для модулей 3+: проверяем, есть ли хотя бы один ответ (true или false) для текущего времени
          hasRelevantProgress = allExercises.some(ex => {
            const progressKey = ex.id ? `${ex.id}-${tenseMode}` : undefined;
            if (!progressKey) return false;
            const value = progressMap[progressKey];
            // Считаем прогрессом только если есть реальный ответ (true или false), НЕ undefined
            return value === true || value === false;
          });
        } else {
          // Для модулей 1-2: проверяем, есть ли хотя бы один реальный ответ
          const detailedCheck: any[] = [];
          hasRelevantProgress = Object.keys(progressMap).some(key => {
            const index = parseInt(key, 10);
            if (isNaN(index)) {
              detailedCheck.push({ key, reason: 'not a number' });
              return false;
            }
            const value = progressMap[index];
            const isRelevant = value === true || value === false;
            detailedCheck.push({ key, index, value, isRelevant });
            return isRelevant;
          });
          
          console.log('🔍 Module 1-2 detailed check:');
          console.log('  Topic ID:', topic.id);
          console.log('  Progress Map Keys:', Object.keys(progressMap));
          console.log('  Progress Map Raw:', JSON.stringify(progressMap, null, 2));
          console.log('  Detailed Check:', JSON.stringify(detailedCheck, null, 2));
          console.log('  Has Relevant Progress:', hasRelevantProgress);
        }
        
        console.log('🔍 Progress check:', {
          topicId: topic.id,
          moduleIndex,
          isModule3Plus,
          tenseMode,
          progressMapKeys: Object.keys(progressMap),
          progressMapValues: progressMap,
          hasRelevantProgress,
          allExercisesCount: allExercises.length
        });
        
        // Показываем выбор режима только если есть релевантный прогресс
        if (hasRelevantProgress) {
          setShowModeSelection(true);
        } else {
          // Если прогресса нет, сразу инициализируем все упражнения
          initializeExercises('all', progressMap);
        }
      } catch (error) {
        console.error('Error loading item progress:', error);
        initializeExercises('all', {});
      }
    };
    
    loadSavedProgress();
  }, [user, topic.id]);

  // Функция инициализации упражнений
  const initializeExercises = (mode: 'all' | 'errors', progressMap: Record<number | string, boolean>) => {
    let indices: number[] = [];
    
    // Проверяем, это модуль 3+
    const moduleIndex = TOPICS.findIndex(t => t.id === topic.id);
    const isModule3Plus = moduleIndex >= 2;
    
    if (mode === 'errors') {
      // Только неправильные (false) и непройденные (undefined)
      indices = allExercises
        .map((_, idx) => idx)
        .filter(idx => {
          if (isModule3Plus) {
            // Для модулей 3+: проверяем прогресс для текущего времени
            const ex = allExercises[idx];
            const progressKey = ex?.id ? `${ex.id}-${tenseMode}` : idx;
            const progress = progressMap[progressKey];
            return progress === false || progress === undefined;
          } else {
            // Для модулей 1-2: используем числовой индекс
            const progress = progressMap[idx];
            return progress === false || progress === undefined;
          }
        });
    } else {
      // Все упражнения
      indices = allExercises.map((_, idx) => idx);
    }
    
    // Перемешиваем в случайном порядке
    const shuffled = [...indices].sort(() => Math.random() - 0.5);
    
    setExerciseIndices(shuffled);
    setExercises(shuffled.map(idx => allExercises[idx]));
    setCurrentExercise(0);
    setExerciseMode(mode);
    setShowModeSelection(false);
    setConsecutiveCorrect(0);
    setShuffledOptionsMap({});
    
    setSelectedOption(null);
    setShowResult(false);
    setIsCorrect(null);
  };

  // Получаем правильный ответ для конкретного индекса
  const getCorrectAnswerForIndex = (originalIndex: number): string => {
    const ex = allExercises[originalIndex];
    if (!ex) return '';
    if (topic.id === 'house-cleaning' || topic.id === 'job-interview') {
      return ex.correct_partizip2 || '';
    }
    switch (tenseMode) {
      case 'präteritum':
        return ex.correct_praeteritum || ex.correct_praesens || '';
      case 'partizip2':
        return ex.correct_partizip2 || ex.correct_praesens || '';
      default:
        return ex.correct_praesens || '';
    }
  };

  // Вычисляем процент правильных ответов для текущей сессии
  const totalItems = allExercises.length;
  const correctCount = Object.values(itemProgress).filter(Boolean).length;
  const answeredCount = Object.keys(itemProgress).length;
  const progressPercentage = totalItems > 0 ? Math.round((correctCount / totalItems) * 100) : 0;
  
  // Правильные ответы в текущей сессии
  const sessionCorrectCount = exercises.filter((_, i) => {
    const originalIndex = exerciseIndices[i];
    return itemProgress[originalIndex] === true;
  }).length;

  // Модальное окно выбора режима
  if (showModeSelection) {
    const hasErrors = Object.values(itemProgress).some(result => result === false);
    const hasUnanswered = allExercises.some((_, idx) => itemProgress[idx] === undefined);
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[85vh] px-4">
        <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100 text-center animate-in zoom-in max-w-md w-full">
          <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
            <i className="fas fa-redo"></i>
          </div>
          <h3 className="text-3xl font-black text-gray-800 mb-3">Выберите режим</h3>
          <p className="text-lg text-gray-500 mb-8 font-medium">
            У вас есть сохраненный прогресс
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => initializeExercises('all', itemProgress)}
              className="w-full py-5 bg-orange-600 text-white rounded-[1.8rem] font-black text-lg shadow-xl hover:bg-orange-700 transition-all"
            >
              Пройти заново
            </button>
            {(hasErrors || hasUnanswered) && (
              <button
                onClick={() => initializeExercises('errors', itemProgress)}
                className="w-full py-5 bg-blue-600 text-white rounded-[1.8rem] font-black text-lg shadow-xl hover:bg-blue-700 transition-all"
              >
                Только неправильные и непройденные
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Модальное окно поздравления о прохождении всех упражнений
  if (showAllComplete) {
    // Проверяем статус всех упражнений
    const allExercisesComplete = allExercises.every((_, idx) => itemProgress[idx] === true);
    const hasIncorrect = allExercises.some((_, idx) => itemProgress[idx] === false);
    
    const handleRestart = () => {
      // НЕ очищаем прогресс - просто перезапускаем упражнения с сохранением прогресса
      setResults({});
      setSessionFinished(false);
      setShowAllComplete(false);
      setCurrentExercise(0);
      setSelectedOption(null);
      setShowResult(false);
      setIsCorrect(null);
      setConsecutiveCorrect(0);
      
      // Инициализируем заново с сохраненным прогрессом (не очищаем его)
      initializeExercises('all', itemProgress);
    };

    const handleRetryErrors = () => {
      // Переходим к режиму "только неправильные"
      setSessionFinished(false);
      setShowAllComplete(false);
      initializeExercises('errors', itemProgress);
    };

    const handleExit = () => {
      setShowAllComplete(false);
      // НЕ вызываем onComplete() при выходе - раздел фиксируется только когда все упражнения пройдены правильно
      // Прогресс уже сохранен в itemProgress как временный
    };

    // Если все пройдены правильно
    if (allExercisesComplete && !hasIncorrect) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[85vh] px-4">
          <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100 text-center animate-in zoom-in max-w-md w-full">
            <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
              <i className="fas fa-star"></i>
            </div>
            <h3 className="text-3xl font-black text-gray-800 mb-3">Супер!</h3>
            <p className="text-lg text-gray-500 mb-8 font-medium">
              Вы прошли все упражнения!
            </p>
            
            <div className="space-y-4">
              <button
                onClick={handleRestart}
                className="w-full py-5 bg-orange-600 text-white rounded-[1.8rem] font-black text-lg shadow-xl hover:bg-orange-700 transition-all"
              >
                Начать заново все протестировать
              </button>
              <button
                onClick={handleExit}
                className="w-full py-5 bg-gray-100 text-gray-700 rounded-[1.8rem] font-black text-lg hover:bg-gray-200 transition-all"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // Если есть неправильные
    if (hasIncorrect) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[85vh] px-4">
          <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100 text-center animate-in zoom-in max-w-md w-full">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
              <i className="fas fa-redo"></i>
            </div>
            <h3 className="text-3xl font-black text-gray-800 mb-3">Завершено!</h3>
            <p className="text-lg text-gray-500 mb-8 font-medium">
              Есть неправильно пройденные упражнения
            </p>
            
            <div className="space-y-4">
              <button
                onClick={handleRetryErrors}
                className="w-full py-5 bg-blue-600 text-white rounded-[1.8rem] font-black text-lg shadow-xl hover:bg-blue-700 transition-all"
              >
                Пройти неправильные
              </button>
              <button
                onClick={handleExit}
                className="w-full py-5 bg-gray-100 text-gray-700 rounded-[1.8rem] font-black text-lg hover:bg-gray-200 transition-all"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // Модальное окно поздравления каждые 10 правильных
  if (showMilestone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[85vh] px-4">
        <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100 text-center animate-in zoom-in max-w-md w-full">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
            <i className="fas fa-trophy"></i>
          </div>
          <h3 className="text-3xl font-black text-gray-800 mb-3">Отлично!</h3>
          <p className="text-lg text-gray-500 mb-8 font-medium">
            Вы правильно ответили на {consecutiveCorrect} вопросов подряд!
          </p>
          
          <button
            onClick={() => {
              setShowMilestone(false);
              // Продолжаем к следующему упражнению, если оно есть
              if (currentExercise < exercises.length - 1) {
                setCurrentExercise(currentExercise + 1);
                setSelectedOption(null);
                setShowResult(false);
                setIsCorrect(null);
              }
            }}
            className="w-full py-5 bg-green-600 text-white rounded-[1.8rem] font-black text-lg shadow-xl hover:bg-green-700 transition-all"
          >
            Идем дальше
          </button>
        </div>
      </div>
    );
  }

  if (sessionFinished) {
    const errorCount = exercises.length - correctCount;
    
    return (
      <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100 text-center animate-in zoom-in mx-2">
        <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
          <i className="fas fa-check-circle"></i>
        </div>
        <h3 className="text-3xl font-black text-gray-800 mb-3">Готово!</h3>
        <p className="text-lg text-gray-500 mb-8 font-medium">Результат: {sessionCorrectCount} / {exercises.length}</p>
        <div className="mb-6">
          <div className="bg-gray-100 rounded-full h-4 mb-2">
            <div 
              className="bg-green-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm font-bold text-gray-600">Правильных ответов: {progressPercentage}%</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-green-50 p-5 rounded-[1.8rem] border border-green-100">
            <p className="text-2xl font-black text-green-600">{correctCount}</p>
            <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mt-1">Правильно</p>
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
              className="w-full py-5 bg-orange-600 text-white rounded-[1.8rem] font-black text-lg shadow-xl"
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

  if (!currentEx || exercises.length === 0 || exerciseIndices.length === 0) {
    return (
      <div className="bg-white rounded-[2.5rem] p-8 text-center">
        <p className="text-gray-600 font-bold">Упражнения пока недоступны.</p>
      </div>
    );
  }

  const sentence = getCurrentSentence();
  const options = getOptions();
  
  // Используем сохраненный порядок вариантов - не пересчитываем при каждом рендере
  // Если порядок уже сохранен в shuffledOptionsMap, используем его
  // Если нет - используем исходный порядок (перемешивание произойдет один раз в useEffect)
  // Ключ включает и индекс упражнения, и режим времени
  const optionsKey = `${currentExercise}-${tenseMode}`;
  const shuffledOptions = shuffledOptionsMap[optionsKey] && shuffledOptionsMap[optionsKey].length > 0
    ? shuffledOptionsMap[optionsKey]
    : options;

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto min-h-[85vh] py-4 px-2">
      {/* Индикатор прогресса и % правильных */}
      <div className="w-full mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-black text-gray-400 uppercase tracking-wider">
            Упражнение {currentExercise + 1} / {exercises.length}
          </span>
          <span className="text-xs font-black text-gray-400 uppercase tracking-wider">
            Прогресс: {Math.round(((currentExercise + 1) / exercises.length) * 100)}%
          </span>
        </div>
        <div className="flex gap-1">
          {exercises.map((_, i) => {
            // Простой прогресс-бар без цветовой индикации результатов
            // Показываем только текущее упражнение и пройденные
            const isCurrent = i === currentExercise;
            const isPassed = i < currentExercise;
            
            return (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                  isCurrent
                    ? 'bg-indigo-500'
                    : isPassed
                    ? 'bg-blue-300'
                    : 'bg-gray-100'
                }`}
              ></div>
            );
          })}
        </div>
      </div>

      {/* Переключатель режимов времени (скрыт для Модуля 1 и Модуля 2, там только Partizip 2) */}
      {topic.id !== 'house-cleaning' && topic.id !== 'job-interview' && (
        <div className="w-full mb-6">
          <div className="flex bg-gray-200/40 p-1.5 rounded-[1.2rem]">
            <button 
              onClick={(e) => { e.stopPropagation(); setTenseMode('präsens'); }}
              className={`flex-1 py-2.5 rounded-xl text-[10px] sm:text-[9px] font-black transition-all ${
                tenseMode === 'präsens' 
                  ? 'bg-white text-orange-600 shadow-sm' 
                  : 'text-gray-500'
              }`}
            >
              Präsens
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setTenseMode('präteritum'); }}
              className={`flex-1 py-2.5 rounded-xl text-[10px] sm:text-[9px] font-black transition-all ${
                tenseMode === 'präteritum' 
                  ? 'bg-white text-orange-600 shadow-sm' 
                  : 'text-gray-500'
              }`}
            >
              Präteritum
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setTenseMode('partizip2'); }}
              className={`flex-1 py-2.5 rounded-xl text-[10px] sm:text-[9px] font-black transition-all ${
                tenseMode === 'partizip2' 
                  ? 'bg-white text-orange-600 shadow-sm' 
                  : 'text-gray-500'
              }`}
            >
              Partizip II
            </button>
          </div>
        </div>
      )}

      {/* Русский перевод */}
      <div className="w-full mb-6 flex justify-center">
        <div className="bg-blue-50 rounded-[2rem] p-6 border-2 border-blue-100 max-w-xl">
          <p className="text-xl font-black text-blue-800 text-center">
            {currentEx.ru}
            {topic.id !== 'house-cleaning' && topic.id !== 'job-interview' && (
              <span className="block text-sm font-medium text-blue-600 mt-2">
                {tenseMode === 'präsens' ? '(в презенсе)' : '(в прошедшем времени)'}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Немецкое предложение с пробелом */}
      <div className="w-full mb-8">
        <div className="bg-white rounded-[2rem] p-8 shadow-lg border-2 border-gray-100">
          <div className="text-2xl font-bold text-gray-800 text-center leading-relaxed">
            {sentence.split('____').map((part, idx, arr) => {
              // Для отделяемых глаголов разделяем ответ на части
              const answerParts = selectedOption ? selectedOption.split(' ') : [];
              const gapCount = arr.length - 1;
              let displayText = '____';
              
              if (selectedOption) {
                if (gapCount > 1 && answerParts.length > 1) {
                  // Если несколько пробелов и ответ состоит из нескольких слов
                  displayText = answerParts[idx] || '____';
                } else {
                  // Если один пробел, вставляем весь ответ
                  displayText = selectedOption;
                }
              }
              
              return (
                <React.Fragment key={idx}>
                  {part}
                  {idx < arr.length - 1 && (
                    <span className={`inline-block mx-2 px-4 py-2 rounded-xl border-2 min-w-[120px] ${
                      showResult
                        ? isCorrect
                          ? 'bg-green-100 border-green-400 text-green-800'
                          : 'bg-red-100 border-red-400 text-red-800'
                        : selectedOption
                          ? 'bg-blue-100 border-blue-400 text-blue-800'
                          : 'bg-gray-100 border-gray-300 text-gray-400'
                    }`}>
                      {displayText}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Варианты ответов с кнопками навигации */}
      <div className="w-full flex items-center gap-3 mb-6">
        {/* Кнопка назад */}
        <button
          onClick={handlePrev}
          disabled={currentExercise === 0}
          className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 flex items-center justify-center bg-gray-100 text-gray-600 rounded-full font-black text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 active:scale-95 transition-all shadow-md"
        >
          <i className="fas fa-arrow-left"></i>
        </button>

        {/* Варианты ответов */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          {shuffledOptions.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(option)}
              disabled={showResult}
              className={`
                py-4 px-6 rounded-xl font-bold text-lg transition-all
                ${showResult && option === getCorrectAnswer()
                  ? 'bg-green-500 text-white shadow-lg'
                  : showResult && option === selectedOption && !isCorrect
                  ? 'bg-red-500 text-white shadow-lg'
                  : selectedOption === option
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
                ${showResult ? 'cursor-not-allowed' : 'cursor-pointer active:scale-95'}
              `}
            >
              {option}
            </button>
          ))}
        </div>

        {/* Кнопка вперед */}
        <button
          onClick={handleNext}
          disabled={!showResult}
          className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 flex items-center justify-center bg-orange-600 text-white rounded-full font-black text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-700 active:scale-95 transition-all shadow-lg"
        >
          <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </div>
  );
};

export default MantraGapExercises;

