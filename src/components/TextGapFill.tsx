import React, { useState, useEffect, useMemo } from 'react';
import { Topic, User } from '../types';
// ProgressService удален - используем только localStorage

interface TextGapFillProps {
  topic: Topic;
  user?: User;
  onComplete?: () => void;
  onItemProgressUpdate?: () => void;
  isTrialLesson?: boolean;
}

interface GapPosition {
  id: string;
  answer: string;
  hint?: string;
}

const TextGapFill: React.FC<TextGapFillProps> = ({ topic, user, onComplete, onItemProgressUpdate, isTrialLesson = false }) => {
  const allExercises = topic.textGapExercises || [];
  const exercises = isTrialLesson && topic.id === 'module-3'
    ? allExercises.filter(ex => ex.id === 'i-a-o-verbs')
    : allExercises;
  const [current, setCurrent] = useState(0);
  const [gapSelections, setGapSelections] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [itemProgress, setItemProgress] = useState<Record<number, boolean>>({});
  const [wrongExercises, setWrongExercises] = useState<number[]>([]);
  const [showResultsScreen, setShowResultsScreen] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [exerciseMode, setExerciseMode] = useState<'all' | 'errors'>('all');
  const [exerciseIndices, setExerciseIndices] = useState<number[]>([]);
  const [isRetryMode, setIsRetryMode] = useState(false); // Флаг повторного прохождения после успешного завершения

  // Функция для получения порядка упражнений: для модулей 9 и 10 - исходный порядок, для остальных - перемешанный
  const getExerciseOrder = (indices: number[]): number[] => {
    if (topic.id === 'module-9' || topic.id === 'module-10') {
      return indices; // Для модулей 9 и 10 сохраняем исходный порядок
    }
    return [...indices].sort(() => Math.random() - 0.5); // Для остальных модулей перемешиваем
  };

  const currentExercise = exercises[current];

  // Парсим HTML в массив элементов
  const parsedContent = useMemo(() => {
    if (!currentExercise) return { parts: [], gaps: [] };
    
    const html = currentExercise.html;
    const parts: (string | GapPosition)[] = [];
    const gaps: GapPosition[] = [];
    
    // Разбиваем HTML по dropzone тегам
    const regex = /<span class="dropzone" data-answer="([^"]+)"(?:[^>]*)(?:data-hint="([^"]*)")?[^>]*><\/span>/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(html)) !== null) {
      // Добавляем текст перед gap
      if (match.index > lastIndex) {
        const beforeText = html.substring(lastIndex, match.index);
        if (beforeText) {
          parts.push(beforeText);
        }
      }

      // Добавляем gap
      const gapId = `gap-${current}-${gaps.length}`;
      const gap: GapPosition = {
        id: gapId,
        answer: match[1],
        hint: match[2] || undefined
      };
      gaps.push(gap);
      parts.push(gap);
      lastIndex = regex.lastIndex;
    }

    // Добавляем оставшийся текст
    if (lastIndex < html.length) {
      const afterText = html.substring(lastIndex);
      if (afterText) {
        parts.push(afterText);
      }
    }

    return { parts, gaps };
  }, [currentExercise, current]);

  // Загружаем сохраненный прогресс при входе
  useEffect(() => {
    const loadSavedProgress = async () => {
      if (!user || exercises.length === 0) {
        // Если нет пользователя, инициализируем все упражнения
        const indices = exercises.map((_, i) => i);
        const ordered = getExerciseOrder(indices);
        setExerciseIndices(ordered);
        return;
      }
      
      try {
        const itemProgressKey = `promnemo_item_progress_${user.telegramId}`;
        const savedItemProgressData = localStorage.getItem(itemProgressKey);
        const savedItemProgress = savedItemProgressData ? JSON.parse(savedItemProgressData) : {};
        const moduleProgress = savedItemProgress[topic.id]?.['text-gaps'] || {};
        
        // Проверяем, есть ли фиксированный прогресс (раздел пройден)
        const progressKey = `promnemo_progress_${user.telegramId}`;
        const savedProgressData = localStorage.getItem(progressKey);
        const currentProgress = savedProgressData ? JSON.parse(savedProgressData) : {};
        const topicModules = currentProgress[topic.id] || [];
        const hasFixedProgress = topicModules.includes('text-gaps');
        
        console.log('📥 Loaded text-gaps progress from DB:');
        console.log('  Topic ID:', topic.id);
        console.log('  Module Progress:', JSON.stringify(moduleProgress, null, 2));
        console.log('  Has Fixed Progress:', hasFixedProgress);
        
        // Преобразуем строковые ключи в числа
        const progressMap: Record<number, boolean> = {};
        Object.keys(moduleProgress).forEach(key => {
          const index = parseInt(key, 10);
          if (!isNaN(index)) {
            progressMap[index] = moduleProgress[index];
          }
        });
        
        // Если есть фиксированный прогресс, но нет временного - это повторное прохождение
        if (hasFixedProgress && Object.keys(progressMap).length === 0) {
          setIsRetryMode(true);
          console.log('  ✅ Retry mode activated - fixed progress exists, no temporary progress');
        }
        
        setItemProgress(progressMap);
        setResults(progressMap);
        
        // Подсчитываем правильные ответы из сохраненного прогресса
        const correctCount = Object.values(progressMap).filter(Boolean).length;
        
        // Проверяем, есть ли реально пройденные (true или false) ответы
        const hasRelevantProgress = Object.keys(progressMap).some(key => {
          const index = parseInt(key, 10);
          if (isNaN(index)) return false;
          const value = progressMap[index];
          return value === true || value === false;
        });
        
        console.log('  Has Relevant Progress:', hasRelevantProgress);
        console.log('  Progress Map:', progressMap);
        console.log('  Is Retry Mode:', hasFixedProgress && Object.keys(progressMap).length === 0);
        
        // Показываем выбор режима если есть релевантный прогресс ИЛИ фиксированный прогресс
        // Но если есть только фиксированный прогресс и нет временного - это повторное прохождение, сразу начинаем
        if (hasRelevantProgress) {
          // Есть временный прогресс - показываем модалку выбора режима
          setShowModeSelection(true);
          // Инициализируем exerciseIndices для отображения прогресса
          const indices = exercises.map((_, i) => i);
          const ordered = getExerciseOrder(indices);
          setExerciseIndices(ordered);
          // Находим первое непройденное упражнение для установки current
          const firstIncomplete = ordered.findIndex(idx => progressMap[idx] !== true);
          if (firstIncomplete !== -1) {
            setCurrent(ordered[firstIncomplete]);
          } else {
            setCurrent(ordered[0]);
          }
        } else if (hasFixedProgress && !hasRelevantProgress) {
          // Есть только фиксированный прогресс, нет временного - это повторное прохождение
          // Не показываем модалку, сразу начинаем упражнения
          setIsRetryMode(true);
          const indices = exercises.map((_, i) => i);
          const ordered = getExerciseOrder(indices);
          setExerciseIndices(ordered);
          setCurrent(ordered[0]);
          console.log('  ✅ Retry mode: fixed progress exists, starting fresh');
        } else {
          // Если прогресса нет, инициализируем все упражнения
          const indices = exercises.map((_, i) => i);
          const ordered = getExerciseOrder(indices);
          setExerciseIndices(ordered);
          setCurrent(ordered[0]);
        }
      } catch (error) {
        console.error('Error loading item progress:', error);
        // При ошибке инициализируем все упражнения
        const indices = exercises.map((_, i) => i);
        const ordered = getExerciseOrder(indices);
        setExerciseIndices(ordered);
      }
    };
    
    if (exercises.length > 0) {
      loadSavedProgress();
    }
  }, [user, topic.id, exercises.length]);

  useEffect(() => {
    if (currentExercise) {
      setGapSelections({});
      setShowResults(false);
    }
  }, [current, currentExercise]);

  const handleSelectChange = (gapId: string, value: string) => {
    setGapSelections(prev => ({
      ...prev,
      [gapId]: value
    }));
  };

  const handleCheck = async () => {
    const allGapsFilled = parsedContent.gaps.every(gap => gapSelections[gap.id]);
    
    if (!allGapsFilled) {
      alert('Пожалуйста, заполните все пробелы!');
      return;
    }

    // Проверяем все ответы
    const allCorrect = parsedContent.gaps.every(gap => 
      gapSelections[gap.id]?.toLowerCase().trim() === gap.answer.toLowerCase().trim()
    );

    setShowResults(true);
    
    const newResults = { ...results, [current]: allCorrect };
    setResults(newResults);
    
    // Обновляем itemProgress
    const newItemProgress = { ...itemProgress, [current]: allCorrect };
    setItemProgress(newItemProgress);
    
    // Сохраняем прогресс в Firebase/localStorage
    if (user) {
      try {
        console.log('💾 Saving itemProgress:', {
          topicId: topic.id,
          exerciseIndex: current,
          isCorrect: allCorrect,
          isRetryMode,
          currentItemProgress: itemProgress
        });
        
        // Сохраняем в localStorage
        const itemProgressKey = `promnemo_item_progress_${user.telegramId}`;
        const savedItemProgressData = localStorage.getItem(itemProgressKey);
        const currentItemProgress = savedItemProgressData ? JSON.parse(savedItemProgressData) : {};
        
        const updatedItemProgress = {
          ...currentItemProgress,
          [topic.id]: {
            ...currentItemProgress[topic.id],
            'text-gaps': {
              ...(currentItemProgress[topic.id]?.['text-gaps'] || {}),
              [current]: allCorrect
            }
          }
        };
        localStorage.setItem(itemProgressKey, JSON.stringify(updatedItemProgress));
        
        // Загружаем обновленный прогресс для вычисления процента
        const savedItemProgress = currentItemProgress;
        const savedExercisesProgress = savedItemProgress[topic.id]?.['text-gaps'] || {};
        
        console.log('✅ After save, loaded itemProgress:', {
          savedExercisesProgress,
          exerciseIndex: current,
          savedValue: savedExercisesProgress[current]
        });
        
        // Вычисляем процент выполнения
        const correctCount = Object.values(savedExercisesProgress).filter(Boolean).length;
        const percentage = exercises.length > 0 ? Math.round((correctCount / exercises.length) * 100) : 0;
        
        // Проверяем, все ли упражнения пройдены правильно (100%)
        const allExercisesComplete = exercises.every((_, idx) => savedExercisesProgress[idx] === true);
        const hasIncorrect = exercises.some((_, idx) => savedExercisesProgress[idx] === false);
        
        // Обновляем процент в progress (временный прогресс)
        // Если это режим повторного прохождения (isRetryMode), не обновляем progress, только itemProgress
        if (!isRetryMode) {
          if (allExercisesComplete && !hasIncorrect) {
            // Все упражнения пройдены правильно - фиксируем раздел как пройденный навсегда (100%)
            // Проверяем, нет ли уже фиксированного прогресса
            const progressKey = `promnemo_progress_${user.telegramId}`;
        const savedProgressData = localStorage.getItem(progressKey);
        const currentProgress = savedProgressData ? JSON.parse(savedProgressData) : {};
            const topicModules = currentProgress[topic.id] || [];
            const hasFixedProgress = topicModules.includes('text-gaps');
            
            if (!hasFixedProgress) {
              // Фиксируем только если еще не зафиксирован
              // Фиксируем прогресс в localStorage
              const filteredModules = topicModules.filter((m: string) => 
                m !== 'text-gaps' && !m.startsWith('text-gaps:')
              );
              const newProgress = {
                ...currentProgress,
                [topic.id]: [...filteredModules, 'text-gaps']
              };
              localStorage.setItem(progressKey, JSON.stringify(newProgress));
              if (onComplete) {
                onComplete(); // Фиксируем раздел как пройденный
              }
            }
          } else {
            // Временный прогресс - сохраняем процент
            // Сохраняем временный прогресс в localStorage
            const filteredModules = topicModules.filter((m: string) => 
              m !== 'text-gaps' && !m.startsWith('text-gaps:')
            );
            const newProgress = {
              ...currentProgress,
              [topic.id]: [...filteredModules, `text-gaps:${percentage}`]
            };
            localStorage.setItem(progressKey, JSON.stringify(newProgress));
          }
        } else {
          // В режиме повторного прохождения не обновляем progress, только itemProgress
          // Прогресс уже сохранен в itemProgress выше через saveItemProgress
          console.log('🔄 Retry mode: skipping progress update, only itemProgress saved');
          console.log('  Current itemProgress:', newItemProgress);
          console.log('  Saved to Firebase itemProgress for exercise:', current, '=', allCorrect);
        }
        
        // Обновляем прогресс в App.tsx после сохранения
        if (onItemProgressUpdate) {
          onItemProgressUpdate();
        }
        
        // Проверяем, все ли упражнения пройдены правильно для показа модалки
        // Используем exerciseIndices для определения последнего упражнения
        const indicesToUse = exerciseIndices.length > 0 ? exerciseIndices : exercises.map((_, i) => i);
        const currentIndexInIndices = indicesToUse.indexOf(current);
        const isLastInCurrentMode = currentIndexInIndices === indicesToUse.length - 1;
        
        if (allExercisesComplete && !hasIncorrect && isLastInCurrentMode) {
          setTimeout(() => {
            setShowSuccessModal(true);
          }, 1500);
        } else if (isLastInCurrentMode && allCorrect) {
          // Если это последнее упражнение в текущем режиме, но не все правильно - показываем экран результатов
          setTimeout(() => {
            setShowResultsScreen(true);
            const correctCount = Object.values(savedExercisesProgress).filter(Boolean).length;
            setTotalScore(correctCount);
            // Сохраняем неправильные упражнения
            const wrong: number[] = [];
            exercises.forEach((_, idx) => {
              if (savedExercisesProgress[idx] === false) {
                wrong.push(idx);
              }
            });
            setWrongExercises(wrong);
          }, 1500);
        }
      } catch (error) {
        console.error('Error saving item progress:', error);
      }
    } else {
      // Если нет пользователя, просто проверяем для показа модалки
      const indicesToUse = exerciseIndices.length > 0 ? exerciseIndices : exercises.map((_, i) => i);
      const currentIndexInIndices = indicesToUse.indexOf(current);
      const isLastInCurrentMode = currentIndexInIndices === indicesToUse.length - 1;
      
      if (allCorrect && isLastInCurrentMode) {
        const allCompleted = exercises.every((_, idx) => newResults[idx] === true);
        if (allCompleted) {
          setTimeout(() => {
            setShowSuccessModal(true);
          }, 1500);
        }
      }
    }
  };

  const handleNext = () => {
    if (!showResults) return; // Можно перейти только после проверки
    
    const indicesToUse = exerciseIndices.length > 0 ? exerciseIndices : exercises.map((_, i) => i);
    const currentIndexInIndices = indicesToUse.indexOf(current);
    
    if (currentIndexInIndices < indicesToUse.length - 1) {
      setCurrent(indicesToUse[currentIndexInIndices + 1]);
      setShowResults(false);
      setGapSelections({});
    } else {
      // Все упражнения в текущем режиме завершены
      // Проверяем, все ли упражнения из всех пройдены правильно
      if (user) {
        // Загружаем актуальный прогресс
        const itemProgressKey = `promnemo_item_progress_${user.telegramId}`;
        const savedItemProgressData = localStorage.getItem(itemProgressKey);
        const savedItemProgress = savedItemProgressData ? JSON.parse(savedItemProgressData) : {};
        // Используем сохраненный прогресс
        const savedExercisesProgress = savedItemProgress[topic.id]?.['text-gaps'] || {};
        const allExercisesComplete = exercises.every((_, idx) => savedExercisesProgress[idx] === true);
        const hasIncorrect = exercises.some((_, idx) => savedExercisesProgress[idx] === false);
        
        if (allExercisesComplete && !hasIncorrect) {
          // Все упражнения пройдены правильно
          setShowSuccessModal(true);
        } else {
          // Показываем экран результатов
          setShowResultsScreen(true);
          const correctCount = Object.values(savedExercisesProgress).filter(Boolean).length;
          setTotalScore(correctCount);
          const wrong: number[] = [];
          exercises.forEach((_, idx) => {
            if (savedExercisesProgress[idx] === false) {
              wrong.push(idx);
            }
          });
          setWrongExercises(wrong);
        }
      } else {
        // Если нет пользователя, проверяем локальный прогресс
        const allCompleted = exercises.every((_, idx) => results[idx] === true);
        if (allCompleted) {
          setShowSuccessModal(true);
        } else {
          setShowResultsScreen(true);
          const correctCount = Object.values(results).filter(Boolean).length;
          setTotalScore(correctCount);
          const wrong: number[] = [];
          exercises.forEach((_, idx) => {
            if (results[idx] === false) {
              wrong.push(idx);
            }
          });
          setWrongExercises(wrong);
        }
      }
    }
  };

  const handleRetryWrong = () => {
    if (wrongExercises.length === 0) return;
    
    // Устанавливаем только неправильные упражнения для повторного прохождения
    const firstWrong = wrongExercises[0];
    setCurrent(firstWrong);
    setShowResultsScreen(false);
    setShowResults(false);
    setGapSelections({});
    setResults(prev => {
      const newResults = { ...prev };
      wrongExercises.forEach(idx => {
        delete newResults[idx];
      });
      return newResults;
    });
    setWrongExercises(wrongExercises.slice(1)); // Убираем первое из списка
  };

  const handleRestart = async () => {
    // Очищаем только локальное состояние
    setCurrent(0);
    setResults({});
    setGapSelections({});
    setShowResults(false);
    setShowSuccessModal(false);
    setShowResultsScreen(false);
    setWrongExercises([]);
    setTotalScore(0);
    setItemProgress({});
    
    // Проверяем, есть ли фиксированный прогресс - если есть, включаем режим повторного прохождения
    if (user) {
      try {
        const progressKey = `promnemo_progress_${user.telegramId}`;
        const savedProgressData = localStorage.getItem(progressKey);
        const currentProgress = savedProgressData ? JSON.parse(savedProgressData) : {};
        const topicModules = currentProgress[topic.id] || [];
        const hasFixedProgress = topicModules.includes('text-gaps');
        
        if (hasFixedProgress) {
          // Если есть фиксированный прогресс, включаем режим повторного прохождения
          setIsRetryMode(true);
        }
        
        // Очищаем itemProgress для text-gaps
        const itemProgressKey = `promnemo_item_progress_${user.telegramId}`;
        const savedItemProgressData = localStorage.getItem(itemProgressKey);
        const savedItemProgress = savedItemProgressData ? JSON.parse(savedItemProgressData) : {};
        const updatedItemProgress = {
          ...savedItemProgress,
          [topic.id]: {
            ...(savedItemProgress[topic.id] || {}),
            'text-gaps': {}
          }
        };
        // Сохраняем в localStorage
        localStorage.setItem(itemProgressKey, JSON.stringify(updatedItemProgress));
        
        // НЕ трогаем progress - фиксированный прогресс остается
        // Удаляем только временный прогресс из progress (text-gaps:XX), но НЕ удаляем фиксированный (text-gaps)
        const currentProgressAfterLoad = currentProgress;
        const currentTopicModules = currentProgressAfterLoad[topic.id] || [];
        const filteredModules = currentTopicModules.filter(m => 
          m !== 'text-gaps' && !m.startsWith('text-gaps:')
        );
        // Если был фиксированный прогресс (text-gaps), сохраняем его
        if (currentTopicModules.includes('text-gaps')) {
          filteredModules.push('text-gaps');
        }
        const newProgress = {
          ...currentProgressAfterLoad,
          [topic.id]: filteredModules
        };
        localStorage.setItem(progressKey, JSON.stringify(newProgress));
        
        // Инициализируем упражнения заново
        const indices = exercises.map((_, i) => i);
        const ordered = getExerciseOrder(indices);
        setExerciseIndices(ordered);
        setCurrent(ordered[0]);
      } catch (error) {
        console.error('Error clearing temporary progress:', error);
      }
    } else {
      // Если нет пользователя, просто инициализируем заново
      const indices = exercises.map((_, i) => i);
      const ordered = getExerciseOrder(indices);
      setExerciseIndices(ordered);
      setCurrent(ordered[0]);
    }
  };

  const handleExit = () => {
    setShowSuccessModal(false);
    // Не вызываем onComplete при выходе, только при 100% завершении
  };

  // Функция инициализации упражнений
  const initializeExercises = async (mode: 'all' | 'errors', progressMap: Record<number, boolean>) => {
    let indices: number[] = [];
    
    if (mode === 'errors') {
      // Только неправильные (false) и непройденные (undefined)
      indices = exercises
        .map((_, idx) => idx)
        .filter(idx => {
          const progress = progressMap[idx];
          return progress === false || progress === undefined;
        });
    } else {
      // Все упражнения - очищаем только временный прогресс, но сохраняем фиксированный
      indices = exercises.map((_, idx) => idx);
      
      // Если режим 'all' и пользователь есть, очищаем только временный прогресс
      if (user && mode === 'all') {
        try {
          // Проверяем, есть ли фиксированный прогресс
          const progressKey = `promnemo_progress_${user.telegramId}`;
        const savedProgressData = localStorage.getItem(progressKey);
        const currentProgress = savedProgressData ? JSON.parse(savedProgressData) : {};
          const topicModules = currentProgress[topic.id] || [];
          const hasFixedProgress = topicModules.includes('text-gaps');
          
          if (hasFixedProgress) {
            // Если есть фиксированный прогресс, включаем режим повторного прохождения
            setIsRetryMode(true);
          }
          
          // Очищаем itemProgress для text-gaps
          const itemProgressKey = `promnemo_item_progress_${user.telegramId}`;
        const savedItemProgressData = localStorage.getItem(itemProgressKey);
        const savedItemProgress = savedItemProgressData ? JSON.parse(savedItemProgressData) : {};
          const updatedItemProgress = {
            ...savedItemProgress,
            [topic.id]: {
              ...(savedItemProgress[topic.id] || {}),
              'text-gaps': {}
            }
          };
          localStorage.setItem(itemProgressKey, JSON.stringify(updatedItemProgress));
          
          // НЕ трогаем progress - фиксированный прогресс остается
          // Удаляем только временный прогресс из progress (text-gaps:XX), но НЕ удаляем фиксированный (text-gaps)
          const currentProgressAfterLoad = currentProgress;
          const currentTopicModules = currentProgressAfterLoad[topic.id] || [];
          const filteredModules = currentTopicModules.filter(m => 
            m !== 'text-gaps' && !m.startsWith('text-gaps:')
          );
          // Если был фиксированный прогресс (text-gaps), сохраняем его
          if (currentTopicModules.includes('text-gaps')) {
            filteredModules.push('text-gaps');
          }
          const newProgress = {
            ...currentProgressAfterLoad,
            [topic.id]: filteredModules
          };
          localStorage.setItem(progressKey, JSON.stringify(newProgress));
          
          // Обновляем локальное состояние
          setItemProgress({});
          setResults({});
        } catch (error) {
          console.error('Error clearing temporary progress:', error);
        }
      }
    }
    
    // Получаем порядок упражнений (для модуля 9 - исходный порядок, для остальных - перемешанный)
    const ordered = getExerciseOrder(indices);
    
    setExerciseIndices(ordered);
    
    // Находим первое непройденное упражнение
    const firstIncomplete = ordered.findIndex(idx => progressMap[idx] !== true);
    setCurrent(firstIncomplete !== -1 ? ordered[firstIncomplete] : ordered[0]);
    
    setExerciseMode(mode);
    setShowModeSelection(false);
    setGapSelections({});
    setShowResults(false);
  };

  // Модальное окно выбора режима
  if (showModeSelection) {
    const hasErrors = Object.values(itemProgress).some(result => result === false);
    const hasUnanswered = exercises.some((_, idx) => itemProgress[idx] === undefined);
    
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

  // Экран результатов
  if (showResultsScreen) {
    const percentage = Math.round((totalScore / exercises.length) * 100);
    const hasWrongAnswers = wrongExercises.length > 0;

    return (
      <div className="space-y-6 pb-12">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-md border border-gray-100 text-center">
          <div className="mb-6">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl font-black mb-4 ${
              percentage >= 80 ? 'bg-green-500 text-white' :
              percentage >= 60 ? 'bg-yellow-500 text-white' :
              'bg-red-500 text-white'
            }`}>
              {percentage}%
            </div>
            <h2 className="text-3xl font-black text-gray-800 mb-2">Упражнения завершены!</h2>
            <p className="text-gray-600 font-bold text-lg">
              Правильно: {totalScore} из {exercises.length}
            </p>
            {hasWrongAnswers && (
              <p className="text-red-600 font-bold mt-2">
                Неправильных упражнений: {wrongExercises.length}
              </p>
            )}
          </div>

          <div className="space-y-4">
            {hasWrongAnswers && (
              <button
                onClick={handleRetryWrong}
                className="w-full py-4 bg-orange-500 text-white rounded-xl font-black text-base flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all hover:bg-orange-600"
              >
                <i className="fas fa-redo"></i>
                <span>Пройти еще раз неправильные ({wrongExercises.length})</span>
              </button>
            )}
            <button
              onClick={handleRestart}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-base flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all hover:bg-indigo-700"
            >
              <i className="fas fa-sync-alt"></i>
              <span>Обнулить и начать заново</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Модальное окно успешного завершения
  if (showSuccessModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-2xl max-w-md w-full text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
            <i className="fas fa-check-circle"></i>
          </div>
          <h3 className="text-3xl sm:text-4xl font-black text-gray-800 mb-4">Успех!</h3>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 font-medium">
            Вы прошли все упражнения правильно!
          </p>
          <div className="space-y-3">
            <button 
              onClick={handleRestart}
              className="w-full py-4 px-6 bg-indigo-600 text-white rounded-lg font-black text-base sm:text-lg hover:bg-indigo-700 active:scale-95 transition-all border-2 border-indigo-700"
            >
              Пройти заново
            </button>
            <button 
              onClick={handleExit}
              className="w-full py-3 px-6 bg-gray-100 text-gray-600 rounded-lg font-black text-base hover:bg-gray-200 active:scale-95 transition-all border-2 border-gray-300"
            >
              Вернуться
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentExercise || exercises.length === 0) {
    return (
      <div className="bg-white rounded-[2.5rem] p-8 text-center">
        <p className="text-gray-600 font-bold">Упражнения пока недоступны.</p>
      </div>
    );
  }

  const allGapsFilled = parsedContent.gaps.every(gap => gapSelections[gap.id]);
  const allCorrect = showResults && parsedContent.gaps.every(gap => 
    gapSelections[gap.id]?.toLowerCase().trim() === gap.answer.toLowerCase().trim()
  );

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto min-h-[85vh] py-4 px-2">
      {/* Индикатор прогресса */}
      <div className="w-full mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-black text-gray-400 uppercase tracking-wider">
            {currentExercise.indicator || `Упражнение ${(exerciseIndices.length > 0 ? exerciseIndices.indexOf(current) : current) + 1}`} / {exerciseIndices.length > 0 ? exerciseIndices.length : exercises.length}
          </span>
        </div>
        <div className="flex gap-1">
          {(exerciseIndices.length > 0 ? exerciseIndices : exercises.map((_, i) => i)).map((exerciseIdx, i) => {
            const wasAnswered = Object.keys(results).includes(exerciseIdx.toString());
            const wasCorrect = wasAnswered ? results[exerciseIdx] === true : false;
            const isCurrent = exerciseIdx === current;
            
            return (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                  wasAnswered
                    ? wasCorrect
                      ? 'bg-green-500'
                      : 'bg-red-500'
                    : isCurrent
                    ? 'bg-indigo-500'
                    : 'bg-gray-100'
                }`}
              ></div>
            );
          })}
        </div>
      </div>

      {/* Текст с пробелами */}
      <div className="w-full bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
        <div className="text-lg leading-relaxed space-y-2">
          {parsedContent.parts.map((part, index) => {
            if (typeof part === 'string') {
              // Обрабатываем HTML текст (поддерживаем <br> и прочие теги)
              return (
                <span
                  key={`text-${index}`}
                  dangerouslySetInnerHTML={{ __html: part }}
                  className="text-gray-800"
                />
              );
            } else {
              // Это gap - рендерим select
              const gap = part as GapPosition;
              const selectedValue = gapSelections[gap.id] || '';
              const isCorrect = showResults && selectedValue.toLowerCase().trim() === gap.answer.toLowerCase().trim();
              const isIncorrect = showResults && selectedValue && !isCorrect;

              return (
                <select
                  key={gap.id}
                  value={selectedValue}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleSelectChange(gap.id, e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  disabled={showResults && isCorrect}
                  className={`inline-block mx-1 px-3 py-1 rounded-lg border-2 font-bold text-base transition-all cursor-pointer outline-none
                    ${isCorrect ? 'bg-green-50 border-green-500 text-green-700' : ''}
                    ${isIncorrect ? 'bg-red-50 border-red-500 text-red-700' : ''}
                    ${!showResults ? 'border-gray-300 hover:border-indigo-400' : ''}
                    ${showResults && isCorrect ? 'cursor-not-allowed' : ''}
                  `}
                >
                  <option value=""></option>
                  {currentExercise.words.map((word, i) => (
                    <option key={i} value={word}>
                      {word}
                    </option>
                  ))}
                </select>
              );
            }
          })}
        </div>
      </div>

      {/* Результат проверки с объяснениями */}
      {showResults && (
        <div className="w-full space-y-4 mb-4">
          <div className={`w-full p-4 rounded-xl text-center font-bold ${
            allCorrect
              ? 'bg-green-50 text-green-700 border-2 border-green-300'
              : 'bg-red-50 text-red-700 border-2 border-red-300'
          }`}>
            {allCorrect ? (
              <>
                <i className="fas fa-check-circle text-2xl mb-2"></i>
                <div>Отлично! Все правильно!</div>
              </>
            ) : (
              <>
                <i className="fas fa-times-circle text-2xl mb-2"></i>
                <div>Есть ошибки. Проверьте правильные ответы ниже.</div>
              </>
            )}
          </div>
          
          {/* Объяснения для каждого пробела */}
          {!allCorrect && (
            <div className="space-y-2">
              {parsedContent.gaps.map((gap) => {
                const selectedValue = gapSelections[gap.id] || '';
                const isCorrect = selectedValue.toLowerCase().trim() === gap.answer.toLowerCase().trim();
                const isIncorrect = selectedValue && !isCorrect;
                
                if (!isIncorrect) return null;
                
                return (
                  <div key={gap.id} className="p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-500 text-white font-black flex items-center justify-center flex-shrink-0 text-sm">
                        <i className="fas fa-times"></i>
                      </div>
                      <div className="flex-1">
                        <p className="text-red-700 font-black mb-1">
                          Неверно: <span className="line-through">{selectedValue}</span>
                        </p>
                        <p className="text-green-700 font-bold">
                          Правильно: <span className="font-black">{gap.answer}</span>
                        </p>
                        {gap.hint && (
                          <p className="text-gray-600 font-medium text-sm mt-1">
                            {gap.hint}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Кнопки */}
      <div className="w-full flex gap-3">
        {!showResults ? (
          <button
            onClick={handleCheck}
            disabled={!allGapsFilled}
            className={`flex-1 py-4 px-6 rounded-xl font-black text-lg transition-all ${
              allGapsFilled
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Проверить
          </button>
        ) : allCorrect && (() => {
          const indicesToUse = exerciseIndices.length > 0 ? exerciseIndices : exercises.map((_, i) => i);
          const currentIndexInIndices = indicesToUse.indexOf(current);
          return currentIndexInIndices < indicesToUse.length - 1;
        })() ? (
          <button
            onClick={handleNext}
            className="flex-1 py-4 px-6 bg-green-600 text-white rounded-xl font-black text-lg hover:bg-green-700 active:scale-95 transition-all"
          >
            Следующее <i className="fas fa-arrow-right ml-2"></i>
          </button>
        ) : !allCorrect ? (
          <button
            onClick={() => {
              setGapSelections({});
              setShowResults(false);
            }}
            className="flex-1 py-4 px-6 bg-orange-600 text-white rounded-xl font-black text-lg hover:bg-orange-700 active:scale-95 transition-all"
          >
            Попробовать снова
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default TextGapFill;
