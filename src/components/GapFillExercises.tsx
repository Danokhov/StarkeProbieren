import React, { useState, useEffect } from 'react';
import { Topic, User } from '../types';
import { unlockAudio } from '../services/audioService';
// ProgressService удален - используем только localStorage

interface GapFillExercisesProps {
  topic: Topic;
  user?: User;
  onComplete?: () => void;
  onItemProgressUpdate?: () => void;
}

interface SavedProgress {
  currentExercise: number;
  score: number;
  wrongAnswers: number[];
  originalWrongAnswers: number[];
  exerciseIndices: number[];
  totalExercises: number;
  isCompleted: boolean;
}

const GapFillExercises: React.FC<GapFillExercisesProps> = ({ topic, onComplete }) => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<number[]>([]);
  const [originalWrongAnswers, setOriginalWrongAnswers] = useState<number[]>([]);
  const [exerciseIndices, setExerciseIndices] = useState<number[]>([]);
  const [totalExercises, setTotalExercises] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [itemProgress, setItemProgress] = useState<Record<number, boolean>>({});

  const exercises = topic.exercises || [];

  // Загружаем сохраненный прогресс при входе
  useEffect(() => {
    const loadSavedProgress = async () => {
      if (!user || exercises.length === 0) {
        // Если нет пользователя, инициализируем все упражнения
        const indices = exercises.map((_, i) => i);
        setExerciseIndices(indices);
        setTotalExercises(exercises.length);
        setIsLoading(false);
        return;
      }
      
      try {
        const itemProgressKey = `promnemo_item_progress_${user.telegramId}`;
        const savedItemProgressData = localStorage.getItem(itemProgressKey);
        const savedItemProgress = savedItemProgressData ? JSON.parse(savedItemProgressData) : {};
        const moduleProgress = savedItemProgress[topic.id]?.['gap-fill'] || {};
        
        // Преобразуем строковые ключи в числа
        const progressMap: Record<number, boolean> = {};
        Object.keys(moduleProgress).forEach(key => {
          const index = parseInt(key, 10);
          if (!isNaN(index)) {
            progressMap[index] = moduleProgress[index];
          }
        });
        
        setItemProgress(progressMap);
        
        // Подсчитываем правильные ответы из сохраненного прогресса
        const correctCount = Object.values(progressMap).filter(Boolean).length;
        setScore(correctCount);
        
        // Проверяем, есть ли реально пройденные (true или false) ответы
        const hasRelevantProgress = Object.keys(progressMap).some(key => {
          const index = parseInt(key, 10);
          if (isNaN(index)) return false;
          const value = progressMap[index];
          return value === true || value === false;
        });
        
        // Показываем выбор режима только если есть релевантный прогресс
        if (hasRelevantProgress) {
          setShowModeSelection(true);
        } else {
          // Если прогресса нет, инициализируем все упражнения
          const indices = exercises.map((_, i) => i);
          setExerciseIndices(indices);
          setTotalExercises(exercises.length);
        }
        
        setTotalExercises(exercises.length);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading item progress:', error);
        const indices = exercises.map((_, i) => i);
        setExerciseIndices(indices);
        setTotalExercises(exercises.length);
        setIsLoading(false);
      }
    };
    
    if (exercises.length > 0) {
      loadSavedProgress();
    }
  }, [user, topic.id, exercises.length]);

  useEffect(() => {
    unlockAudio().catch(() => {});
    if (!isLoading && exerciseIndices.length > 0 && currentExercise < exerciseIndices.length) {
      shuffleOptions();
    }
  }, [currentExercise, exerciseIndices, isLoading]);

  const shuffleOptions = () => {
    if (exerciseIndices.length > 0 && currentExercise < exerciseIndices.length) {
      const exerciseIndex = exerciseIndices[currentExercise];
      if (exercises[exerciseIndex]) {
        const options = [...exercises[exerciseIndex].options];
        for (let i = options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [options[i], options[j]] = [options[j], options[i]];
        }
        setShuffledOptions(options);
      }
    }
  };

  const handleOptionSelect = async (option: string) => {
    if (selectedOption) return;
    
    setSelectedOption(option);
    const exerciseIndex = exerciseIndices[currentExercise];
    const isCorrect = option === exercises[exerciseIndex].options[0];
    
    // Обновляем itemProgress
    const newItemProgress = { ...itemProgress, [exerciseIndex]: isCorrect };
    setItemProgress(newItemProgress);
    
    if (isCorrect) {
      const newScore = score + 1;
      setScore(newScore);
    } else {
      // Сохраняем индекс неправильного ответа
      const newWrongAnswers = [...wrongAnswers, exerciseIndex];
      setWrongAnswers(newWrongAnswers);
    }
    
    // Сохраняем прогресс в Firebase/localStorage
    if (user) {
      try {
        // Сохраняем в localStorage
        const itemProgressKey = `promnemo_item_progress_${user.telegramId}`;
        const savedItemProgressData = localStorage.getItem(itemProgressKey);
        const currentItemProgress = savedItemProgressData ? JSON.parse(savedItemProgressData) : {};
        
        const updatedItemProgress = {
          ...currentItemProgress,
          [topic.id]: {
            ...currentItemProgress[topic.id],
            'gap-fill': {
              ...(currentItemProgress[topic.id]?.['gap-fill'] || {}),
              [exerciseIndex]: isCorrect
            }
          }
        };
        localStorage.setItem(itemProgressKey, JSON.stringify(updatedItemProgress));
        
        // Загружаем обновленный прогресс для вычисления процента
        const savedExercisesProgress = updatedItemProgress[topic.id]?.['gap-fill'] || {};
        
        // Вычисляем процент выполнения
        const correctCount = Object.values(savedExercisesProgress).filter(Boolean).length;
        const percentage = exercises.length > 0 ? Math.round((correctCount / exercises.length) * 100) : 0;
        
        // Проверяем, все ли упражнения пройдены правильно (100%)
        const allExercisesComplete = exercises.every((_, idx) => savedExercisesProgress[idx] === true);
        const hasIncorrect = exercises.some((_, idx) => savedExercisesProgress[idx] === false);
        
        // Обновляем процент в progress (временный прогресс) - только в localStorage
        const progressKey = `promnemo_progress_${user.telegramId}`;
        const savedProgressData = localStorage.getItem(progressKey);
        const currentProgress = savedProgressData ? JSON.parse(savedProgressData) : {};
        const currentTopicModules = currentProgress[topic.id] || [];
        
        if (allExercisesComplete && !hasIncorrect) {
          // Все упражнения пройдены правильно - фиксируем раздел как пройденный навсегда (100%)
          const filteredModules = currentTopicModules.filter((m: string) => 
            m !== 'gap-fill' && !m.startsWith('gap-fill:')
          );
          const newProgress = {
            ...currentProgress,
            [topic.id]: [...filteredModules, 'gap-fill']
          };
          localStorage.setItem(progressKey, JSON.stringify(newProgress));
          if (onComplete) {
            onComplete(); // Фиксируем раздел как пройденный
          }
        } else {
          // Временный прогресс - сохраняем процент
          const filteredModules = currentTopicModules.filter((m: string) => 
            m !== 'gap-fill' && !m.startsWith('gap-fill:')
          );
          const newProgress = {
            ...currentProgress,
            [topic.id]: [...filteredModules, `gap-fill:${percentage}`]
          };
          localStorage.setItem(progressKey, JSON.stringify(newProgress));
        }
        
        // Обновляем прогресс в App.tsx после сохранения
        if (onItemProgressUpdate) {
          onItemProgressUpdate();
        }
      } catch (error) {
        console.error('Error saving item progress:', error);
      }
    }
    
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentExercise + 1 < exerciseIndices.length) {
      const nextExercise = currentExercise + 1;
      setCurrentExercise(nextExercise);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      // Упражнения завершены
      // Сохраняем оригинальный список неправильных ответов для отображения в результатах
      const finalWrongAnswers = [...wrongAnswers];
      setOriginalWrongAnswers(finalWrongAnswers);
      setIsCompleted(true);
      
      // Проверяем, что все упражнения пройдены правильно (нет неправильных ответов)
      // onComplete уже вызывается в handleOptionSelect при 100% правильных ответов
    }
  };

  const handleRetryWrong = () => {
    if (originalWrongAnswers.length === 0) return;
    
    // Устанавливаем только неправильные упражнения для повторного прохождения
    // Создаем копию массива, чтобы не изменять оригинальный
    const wrongIndices = [...new Set(originalWrongAnswers)]; // Убираем дубликаты
    setExerciseIndices(wrongIndices);
    setCurrentExercise(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setScore(0);
    // Очищаем wrongAnswers для нового прохождения
    setWrongAnswers([]);
    setIsCompleted(false);
  };

  const handleContinue = () => {
    setShowModeSelection(false);
    // Находим первое непройденное упражнение
    const firstIncomplete = exercises.findIndex((_, idx) => itemProgress[idx] !== true);
    if (firstIncomplete !== -1) {
      // Находим индекс в exerciseIndices
      const indexInIndices = exerciseIndices.findIndex(idx => idx === firstIncomplete);
      if (indexInIndices !== -1) {
        setCurrentExercise(indexInIndices);
      } else {
        // Если не найдено, добавляем все непройденные в exerciseIndices
        const incompleteIndices = exercises
          .map((_, idx) => idx)
          .filter(idx => itemProgress[idx] !== true);
        setExerciseIndices(incompleteIndices);
        setCurrentExercise(0);
      }
    } else {
      // Все пройдены, начинаем с начала
      const indices = exercises.map((_, i) => i);
      setExerciseIndices(indices);
      setCurrentExercise(0);
    }
  };

  const handleStartOver = async () => {
    setShowModeSelection(false);
    const indices = exercises.map((_, i) => i);
    setExerciseIndices(indices);
    setCurrentExercise(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setScore(0);
    setWrongAnswers([]);
    setOriginalWrongAnswers([]);
    setIsCompleted(false);
    setItemProgress({});
    
    // Очищаем прогресс в Firebase
    if (user) {
      try {
        // Очищаем itemProgress для gap-fill
        const itemProgressKey = `promnemo_item_progress_${user.telegramId}`;
        const savedItemProgressData = localStorage.getItem(itemProgressKey);
        const savedItemProgress = savedItemProgressData ? JSON.parse(savedItemProgressData) : {};
        const updatedItemProgress = {
          ...savedItemProgress,
          [topic.id]: {
            ...(savedItemProgress[topic.id] || {}),
            'gap-fill': {}
          }
        };
        localStorage.setItem(itemProgressKey, JSON.stringify(updatedItemProgress));
        
        // Удаляем временный прогресс из progress
        const progressKey = `promnemo_progress_${user.telegramId}`;
        const savedProgressData = localStorage.getItem(progressKey);
        const currentProgress = savedProgressData ? JSON.parse(savedProgressData) : {};
        const currentTopicModules = currentProgress[topic.id] || [];
        const filteredModules = currentTopicModules.filter(m => 
          m !== 'gap-fill' && !m.startsWith('gap-fill:')
        );
        const newProgress = {
          ...currentProgress,
          [topic.id]: filteredModules
        };
        localStorage.setItem(progressKey, JSON.stringify(newProgress));
      } catch (error) {
        console.error('Error clearing progress:', error);
      }
    }
  };

  const handleReset = () => {
    // Обнуляем все и начинаем заново
    const indices = exercises.map((_, i) => i);
    setExerciseIndices(indices);
    setCurrentExercise(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setScore(0);
    setWrongAnswers([]);
    setOriginalWrongAnswers([]);
    setIsCompleted(false);
  };

  if (exercises.length === 0) {
    return (
      <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-md text-center">
        <p className="text-gray-600 font-bold">Упражнения пока не добавлены</p>
      </div>
    );
  }

  // Показываем загрузку пока восстанавливаем прогресс
  if (isLoading) {
    return (
      <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-md text-center">
        <p className="text-gray-600 font-bold">Загрузка...</p>
      </div>
    );
  }

  // Модальное окно выбора режима (Continue/Start over)
  if (showModeSelection) {
    const correctCount = Object.values(itemProgress).filter(Boolean).length;
    const allCompleted = exercises.every((_, idx) => itemProgress[idx] === true);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-2xl max-w-md w-full text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
            <i className="fas fa-bookmark"></i>
          </div>
          <h3 className="text-3xl sm:text-4xl font-black text-gray-800 mb-4">У вас есть сохраненный прогресс</h3>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 font-medium">
            Выполнено упражнений: {correctCount} из {exercises.length}
          </p>
          <div className="space-y-3">
            {!allCompleted && (
              <button 
                onClick={handleContinue}
                className="w-full py-4 px-6 bg-indigo-600 text-white rounded-lg font-black text-base sm:text-lg hover:bg-indigo-700 active:scale-95 transition-all border-2 border-indigo-700"
              >
                Продолжить
              </button>
            )}
            <button 
              onClick={handleStartOver}
              className="w-full py-3 px-6 bg-gray-100 text-gray-600 rounded-lg font-black text-base hover:bg-gray-200 active:scale-95 transition-all border-2 border-gray-300"
            >
              Начать заново
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Экран результатов
  if (isCompleted) {
    const percentage = Math.round((score / totalExercises) * 100);
    // Используем оригинальный список неправильных ответов для отображения
    const wrongCount = originalWrongAnswers.length;
    const hasWrongAnswers = wrongCount > 0;

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
              Правильно: {score} из {totalExercises}
            </p>
            {hasWrongAnswers && (
              <p className="text-red-600 font-bold mt-2">
                Неправильных ответов: {wrongCount}
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
                <span>Пройти еще раз неправильные ({wrongCount})</span>
              </button>
            )}
            <button
              onClick={handleReset}
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

  if (exerciseIndices.length === 0 || currentExercise >= exerciseIndices.length) {
    return null;
  }

  const exerciseIndex = exerciseIndices[currentExercise];
  const exercise = exercises[exerciseIndex];
  const isCorrect = selectedOption === exercise.options[0];
  const isLast = currentExercise + 1 === exerciseIndices.length;

  return (
    <div className="space-y-6 pb-12">
      {/* Прогресс */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">
            Упражнение {currentExercise + 1} / {exerciseIndices.length}
          </span>
          <span className="text-xs font-bold text-gray-500">
            Правильно: {score} / {currentExercise + (selectedOption ? 1 : 0)}
          </span>
        </div>
        <div className="flex gap-1">
          {exerciseIndices.map((exerciseIdx, i) => {
            const wasAnswered = i < currentExercise || (i === currentExercise && selectedOption);
            const wasCorrect = i < currentExercise 
              ? !wrongAnswers.includes(exerciseIdx)
              : (i === currentExercise && selectedOption && isCorrect);
            
            return (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                  wasAnswered
                    ? wasCorrect
                      ? 'bg-green-500'
                      : 'bg-red-500'
                    : i === currentExercise
                    ? 'bg-indigo-500'
                    : 'bg-gray-100'
                }`}
              ></div>
            );
          })}
        </div>
      </div>

      {/* Упражнение */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-md border border-gray-100">
        {/* Русский перевод */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-gray-600 font-bold text-lg leading-relaxed">{exercise.sentence_ru}</p>
        </div>

        {/* Немецкое предложение с пропуском */}
        <div className="mb-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xl font-bold text-gray-800 leading-relaxed">
            {exercise.sentence.split('____').map((part, i, arr) => (
              <React.Fragment key={i}>
                <span>{part}</span>
                {i < arr.length - 1 && (
                  <span className={`inline-block px-2 mx-1 border-b-2 ${
                    selectedOption 
                      ? (isCorrect ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700')
                      : 'border-indigo-400 border-dashed'
                  } min-w-[80px] text-center`}>
                    {selectedOption ? (
                      <span className={`font-black text-lg ${
                        isCorrect ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {selectedOption}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">____</span>
                    )}
                  </span>
                )}
              </React.Fragment>
            ))}
          </p>
        </div>

        {/* Варианты ответов */}
        {!selectedOption && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {shuffledOptions.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionSelect(option)}
                className="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-100 hover:border-indigo-300 transition-all active:scale-95 text-left"
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {/* Объяснение */}
        {showExplanation && (
          <div className={`p-4 rounded-xl border-2 mb-6 ${
            isCorrect
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                isCorrect ? 'bg-green-500' : 'bg-red-500'
              } text-white font-black`}>
                <i className={`fas ${isCorrect ? 'fa-check' : 'fa-times'}`}></i>
              </div>
              <div className="flex-1">
                <p className={`font-black mb-2 ${
                  isCorrect ? 'text-green-700' : 'text-red-700'
                }`}>
                  {isCorrect ? 'Правильно!' : `Неверно. Правильный ответ: ${exercise.options[0]}`}
                </p>
                {isCorrect && (
                  <p className="text-gray-700 font-medium leading-relaxed">{exercise.explanation}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Кнопка "Далее" */}
        {showExplanation && (
          <button
            onClick={handleNext}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-base flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
          >
            <span>{isLast ? 'Завершить' : 'Следующее упражнение'}</span>
            <i className={`fas ${isLast ? 'fa-check-circle' : 'fa-arrow-right'}`}></i>
          </button>
        )}
      </div>
    </div>
  );
};

export default GapFillExercises;

