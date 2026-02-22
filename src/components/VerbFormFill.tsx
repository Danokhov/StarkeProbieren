import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Topic } from '../types';
// ProgressService удален - используем только localStorage
import { TRIAL_VERBS } from '../constants';

interface VerbFormFillProps {
  topic: Topic;
  user?: { telegramId: string; name: string };
  onComplete?: () => void;
  isTrialLesson?: boolean;
}

const VerbFormFill: React.FC<VerbFormFillProps> = ({ topic, user, onComplete, isTrialLesson = false }) => {
  const allExercises = useMemo(() => {
    const exercises = topic.verbFormExercises || [];
    if (isTrialLesson && topic.id === 'module-3') {
      return exercises.filter(ex => TRIAL_VERBS.includes(ex.id));
    }
    return exercises;
  }, [topic, isTrialLesson]);
  const storageKey = `verbFormFill_${topic.id}`;
  const moduleId = 'verb-forms';
  
  // Загружаем сохраненный прогресс из localStorage
  const loadProgress = async () => {
    if (user) {
      try {
        const itemProgressKey = `promnemo_item_progress_${user.telegramId}`;
        const savedItemProgress = localStorage.getItem(itemProgressKey);
        const itemProgress = savedItemProgress ? JSON.parse(savedItemProgress) : {};
        const moduleProgress = itemProgress[topic.id]?.[moduleId];
        if (moduleProgress) {
          // Если это старый формат (просто объект результатов)
          if (!moduleProgress.results && !moduleProgress.exerciseOrder) {
            return { results: moduleProgress };
          }
          // Новый формат с exerciseOrder
          if (moduleProgress.exerciseOrder) {
            // Восстанавливаем порядок упражнений по ID
            const restoredOrder = moduleProgress.exerciseOrder
              .map(id => allExercises.find(ex => ex.id === id))
              .filter(Boolean);
            return {
              results: moduleProgress.results,
              exerciseOrder: restoredOrder
            };
          }
          return moduleProgress;
        }
      } catch (error) {
        console.error('Error loading progress from Firebase:', error);
      }
    }
    
    // Fallback на localStorage
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const [savedProgress, setSavedProgress] = useState<any>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [shuffledExercises, setShuffledExercises] = useState<any[]>([]);
  
  const exercises = shuffledExercises;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAllComplete, setShowAllComplete] = useState(false);
  const [showModeSelection, setShowModeSelection] = useState(false);

  // Загружаем прогресс при монтировании
  useEffect(() => {
    loadProgress().then(progress => {
      setSavedProgress(progress);
      
      // Инициализируем exerciseResults из сохраненного прогресса
      if (progress?.results && Object.keys(progress.results).length > 0) {
        setExerciseResults(progress.results);
      }
      
      // Инициализируем shuffledExercises после загрузки прогресса
      if (progress?.exerciseOrder) {
        setShuffledExercises(progress.exerciseOrder);
      } else {
        const shuffled = [...allExercises];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setShuffledExercises(shuffled);
      }
      
      setIsLoadingProgress(false);
    });
  }, []);
  
  // Простые поля ввода
  const [praesens, setPraesens] = useState('');
  const [praeteritum, setPraeteritum] = useState('');
  const [partizip2, setPartizip2] = useState('');
  
  const [exerciseResults, setExerciseResults] = useState<Record<number, boolean>>({});
  const [results, setResults] = useState<(boolean | null)[]>([null, null, null]);
  const [hintsShown, setHintsShown] = useState<Record<number, boolean>>({});
  
  const praesensRef = useRef<HTMLInputElement>(null);
  const praeteritumRef = useRef<HTMLInputElement>(null);
  const partizip2Ref = useRef<HTMLInputElement>(null);

  const currentExercise = exercises[currentIndex];

  // Проверяем при входе: есть ли сохраненный прогресс?
  useEffect(() => {
    if (!isLoadingProgress && savedProgress && exercises.length > 0) {
      const results = savedProgress.results || {};
      const hasAnyResults = Object.keys(results).length > 0;
      
      if (hasAnyResults) {
        // Проверяем: есть ли ПРАВИЛЬНО выполненные упражнения
        const correctCount = Object.values(results).filter(Boolean).length;
        const allCorrect = exercises.every((_, idx) => results[idx] === true);
        
        // Показываем модальное окно если:
        // 1. Все упражнения пройдены (чтобы предложить пройти заново)
        // 2. Или есть частичный прогресс (чтобы предложить продолжить)
        if (allCorrect || (correctCount > 0 && !allCorrect)) {
          setShowModeSelection(true);
        }
      }
    }
  }, [isLoadingProgress, savedProgress, exercises]);

  useEffect(() => {
    if (currentExercise) {
      resetForm();
    }
  }, [currentIndex, currentExercise]);

  // Сохраняем прогресс при каждом изменении результатов
  useEffect(() => {
    if (isLoadingProgress) return; // Не сохраняем пока загружается прогресс
    
    // Не сохраняем если нет результатов
    const hasResults = Object.keys(exerciseResults).length > 0;
    if (!hasResults) return;
    
    const saveProgress = async () => {
      // Сохраняем в localStorage
      const progressData = {
        results: exerciseResults,
        exerciseOrder: shuffledExercises
      };
      localStorage.setItem(storageKey, JSON.stringify(progressData));
      
      // Сохраняем в localStorage
      if (user) {
        try {
          const itemProgressKey = `promnemo_item_progress_${user.telegramId}`;
          const savedItemProgress = localStorage.getItem(itemProgressKey);
          const currentItemProgress = savedItemProgress ? JSON.parse(savedItemProgress) : {};
          
          // Обновляем прогресс для этого модуля (сохраняем И результаты И порядок)
          const updatedItemProgress = {
            ...currentItemProgress,
            [topic.id]: {
              ...currentItemProgress[topic.id],
              [moduleId]: {
                results: exerciseResults,
                exerciseOrder: shuffledExercises.map(e => e.id) // ✅ Сохраняем порядок по ID
              }
            }
          };
          
          localStorage.setItem(itemProgressKey, JSON.stringify(updatedItemProgress));
        } catch (error) {
          // Ошибка сохранения прогресса
        }
      }
    };
    
    saveProgress();
  }, [exerciseResults]);

  const resetForm = () => {
    setPraesens('');
    setPraeteritum('');
    setPartizip2('');
    setHintsShown({});
    setResults([null, null, null]);
    
    // Фокус на первое поле
    setTimeout(() => {
      praesensRef.current?.focus();
    }, 100);
  };

  const normalizeString = (str: string) => {
    if (!str) return '';
    return str.toLowerCase().trim().replace(/\s+/g, ' ');
  };

  // Автоматическая проверка правильности поля
  const checkField = (userValue: string, correctValue: string): boolean => {
    if (!userValue || !correctValue) return false;
    return normalizeString(userValue) === normalizeString(correctValue);
  };

  // Проверка всех полей для активации кнопки "Вперед"
  // Принимаем необязательные параметры для проверки новых значений (до обновления состояния)
  const checkAllFields = (newPraesens?: string, newPraeteritum?: string, newPartizip2?: string) => {
    if (!currentExercise) return false;

    const isPraesensCorrect = checkField(newPraesens ?? praesens, currentExercise.praesens);
    const isPraeteritumCorrect = checkField(newPraeteritum ?? praeteritum, currentExercise.praeteritum);
    const isPartizip2Correct = checkField(newPartizip2 ?? partizip2, currentExercise.partizip2);

    const allCorrect = isPraesensCorrect && isPraeteritumCorrect && isPartizip2Correct;
    
    setResults([isPraesensCorrect, isPraeteritumCorrect, isPartizip2Correct]);

    if (allCorrect) {
      setExerciseResults(prev => ({ ...prev, [currentIndex]: true }));
    }

    return allCorrect;
  };

  // Обработчик изменения Präsens с автопереходом
  const handlePraesensChange = (value: string) => {
    setPraesens(value);
    if (currentExercise && checkField(value, currentExercise.praesens)) {
      setResults(prev => [true, prev[1], prev[2], prev[3]]);
      setTimeout(() => praeteritumRef.current?.focus(), 50);
    }
  };

  // Обработчик изменения Präteritum с автопереходом
  const handlePraeteritumChange = (value: string) => {
    setPraeteritum(value);
    if (currentExercise && checkField(value, currentExercise.praeteritum)) {
      setResults(prev => [prev[0], true, prev[2]]);
      setTimeout(() => partizip2Ref.current?.focus(), 50);
    }
  };

  // Обработчик изменения Partizip II с финальной проверкой
  const handlePartizip2Change = (value: string) => {
    setPartizip2(value);
    
    // Проверяем все поля сразу с новым значением (до обновления состояния)
    if (currentExercise) {
      const isPartizip2Correct = checkField(value, currentExercise.partizip2);
      // Обновляем results для Partizip II
      setResults(prev => [prev[0], prev[1], isPartizip2Correct]);
      
      if (isPartizip2Correct) {
        // Проверяем ВСЕ поля с учетом нового значения Partizip II
        checkAllFields(praesens, praeteritum, value);
      } else {
        // Если Partizip II неправильный, обновляем только его результат
        setResults(prev => [prev[0], prev[1], false]);
      }
    }
  };

  const showHint = () => {
    if (!currentExercise) return;

    // Показываем подсказку для первого незаполненного поля
    if (!praesens && !hintsShown[0]) {
      const firstChar = currentExercise.praesens.charAt(0);
      setPraesens(firstChar);
      setHintsShown(prev => ({ ...prev, 0: true }));
      setTimeout(() => praesensRef.current?.focus(), 50);
    } else if (!praeteritum && !hintsShown[1]) {
      const firstChar = currentExercise.praeteritum.charAt(0);
      setPraeteritum(firstChar);
      setHintsShown(prev => ({ ...prev, 1: true }));
      setTimeout(() => praeteritumRef.current?.focus(), 50);
    } else if (!partizip2 && !hintsShown[2]) {
      const firstChar = currentExercise.partizip2.charAt(0);
      setPartizip2(firstChar);
      setHintsShown(prev => ({ ...prev, 2: true }));
      setTimeout(() => partizip2Ref.current?.focus(), 50);
    }
  };

  const handleNext = () => {
    const allCorrect = results.every(r => r === true);
    if (!allCorrect) return;

    // Ищем следующее непройденное упражнение
    const nextIncomplete = exercises.findIndex((_, idx) => 
      idx > currentIndex && exerciseResults[idx] !== true
    );

    if (nextIncomplete !== -1) {
      // Есть непройденное упражнение - переходим к нему
      setCurrentIndex(nextIncomplete);
    } else {
      // Непройденных больше нет - проверяем все ли правильные
      const allExercisesCorrect = exercises.every((_, idx) => exerciseResults[idx] === true);
      if (allExercisesCorrect) {
        setShowAllComplete(true);
      } else {
        // Есть неправильные - ищем первое неправильное от начала
        const firstIncorrect = exercises.findIndex((_, idx) => exerciseResults[idx] !== true);
        if (firstIncorrect !== -1) {
          setCurrentIndex(firstIncorrect);
        }
      }
    }
  };

  const handleRestart = async () => {
    setCurrentIndex(0);
    setExerciseResults({});
    setShowAllComplete(false);
    localStorage.removeItem(storageKey);
    
    // Очищаем прогресс из localStorage
    if (user) {
      try {
        const itemProgressKey = `promnemo_item_progress_${user.telegramId}`;
        const savedItemProgress = localStorage.getItem(itemProgressKey);
        const currentItemProgress = savedItemProgress ? JSON.parse(savedItemProgress) : {};
        
        // Удаляем прогресс для этого упражнения
        const updatedItemProgress = {
          ...currentItemProgress,
          [topic.id]: {
            ...currentItemProgress[topic.id],
            [moduleId]: {} // Очищаем
          }
        };
        
        localStorage.setItem(itemProgressKey, JSON.stringify(updatedItemProgress));
      } catch (error) {
        // Ошибка очистки прогресса
      }
    }
    
    resetForm();
  };

  const handleExit = () => {
    // Проверяем: все ли упражнения правильные?
    const allCorrect = exercises.every((_, idx) => exerciseResults[idx] === true);
    
    if (allCorrect && onComplete) {
      // Только если ВСЕ правильно - фиксируем прогресс модуля
      onComplete();
      localStorage.removeItem(storageKey);
    }
    // Иначе просто выходим (прогресс уже сохранен в localStorage)
  };

  const handleContinue = () => {
    setShowModeSelection(false);
    // Находим первое непройденное или неправильное упражнение
    const firstIncomplete = exercises.findIndex((_, idx) => exerciseResults[idx] !== true);
    
    if (firstIncomplete !== -1) {
      setCurrentIndex(firstIncomplete);
    }
  };

  const handleStartOver = async () => {
    setShowModeSelection(false);
    setExerciseResults({});
    setCurrentIndex(0);
    localStorage.removeItem(storageKey);
    
    // Очищаем прогресс из localStorage
    if (user) {
      try {
        const itemProgressKey = `promnemo_item_progress_${user.telegramId}`;
        const savedItemProgress = localStorage.getItem(itemProgressKey);
        const currentItemProgress = savedItemProgress ? JSON.parse(savedItemProgress) : {};
        
        // Удаляем прогресс для этого упражнения
        const updatedItemProgress = {
          ...currentItemProgress,
          [topic.id]: {
            ...currentItemProgress[topic.id],
            [moduleId]: {} // Очищаем
          }
        };
        
        localStorage.setItem(itemProgressKey, JSON.stringify(updatedItemProgress));
      } catch (error) {
        // Ошибка очистки прогресса
      }
    }
  };

  const getInputClassName = (resultIndex: number) => {
    const baseClass = "w-full px-3 py-2 text-base font-bold rounded-lg border-2 transition-all";
    
    if (results[resultIndex] === null) {
      return `${baseClass} border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200`;
    }
    
    if (results[resultIndex] === true) {
      return `${baseClass} border-green-500 bg-green-50 text-green-700`;
    }
    
    return `${baseClass} border-red-500 bg-red-50 text-red-700`;
  };

  // Модальное окно успешного завершения
  if (showAllComplete) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-2xl max-w-md w-full text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
            <i className="fas fa-check-circle"></i>
          </div>
          <h3 className="text-3xl sm:text-4xl font-black text-gray-800 mb-4">Отлично!</h3>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 font-medium">
            Вы прошли все упражнения правильно!
          </p>
          <div className="space-y-3">
            <button 
              onClick={handleRestart}
              className="w-full py-4 px-6 bg-indigo-600 text-white rounded-xl font-black text-base sm:text-lg hover:bg-indigo-700 active:scale-95 transition-all"
            >
              Пройти заново
            </button>
            <button 
              onClick={handleExit}
              className="w-full py-3 px-6 bg-gray-100 text-gray-600 rounded-xl font-black text-base hover:bg-gray-200 active:scale-95 transition-all"
            >
              Вернуться
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentExercise) {
    return (
      <div className="bg-white rounded-[2.5rem] p-8 text-center">
        <p className="text-gray-600 font-bold">Нет доступных упражнений.</p>
      </div>
    );
  }

  // Показываем индикатор загрузки
  if (isLoadingProgress) {
    return (
      <div className="bg-white rounded-[2.5rem] p-8 text-center">
        <p className="text-gray-600 font-bold">Загрузка прогресса...</p>
      </div>
    );
  }

  // Модальное окно выбора режима
  if (showModeSelection) {
    const correctCount = Object.values(exerciseResults).filter(Boolean).length;
    const allCompleted = correctCount === exercises.length;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl">
          <h2 className="text-2xl font-black text-gray-800 mb-4 text-center">
            {allCompleted ? 'Вы уже прошли все упражнения!' : 'У вас есть сохраненный прогресс!'}
          </h2>
          <p className="text-gray-600 font-bold mb-6 text-center">
            Правильно выполнено: {correctCount} из {exercises.length}
          </p>
          <div className="space-y-3">
            {!allCompleted && (
              <button
                onClick={handleContinue}
                className="w-full py-4 px-6 bg-indigo-600 text-white rounded-xl font-black text-lg hover:bg-indigo-700 active:scale-95 transition-all"
              >
                Продолжить
              </button>
            )}
            <button
              onClick={handleStartOver}
              className={`w-full py-4 px-6 rounded-xl font-black text-lg active:scale-95 transition-all ${
                allCompleted 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Начать заново
            </button>
          </div>
        </div>
      </div>
    );
  }

  const allCorrect = results.every(r => r === true);
  const correctCount = Object.values(exerciseResults).filter(Boolean).length;

  return (
    <div className="w-full max-w-2xl mx-auto py-2 px-3">
      {/* Прогресс */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-bold text-gray-600">
            {currentIndex + 1}/{exercises.length}
          </span>
          <span className="text-xs font-bold text-indigo-600">
            ✓ {correctCount}/{exercises.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / exercises.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Перевод */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-3 mb-3 border border-indigo-100">
        <p className="text-lg font-black text-center text-gray-800">
          {currentExercise.ru}
        </p>
      </div>

      {/* Поля ввода */}
      <div className="space-y-2 mb-3">
        {/* Präsens */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">
            Präsens
          </label>
          <input
            ref={praesensRef}
            type="text"
            value={praesens}
            onChange={(e) => handlePraesensChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && currentExercise && checkField(praesens, currentExercise.praesens)) {
                praeteritumRef.current?.focus();
              }
            }}
            disabled={results[0] === true}
            className={getInputClassName(0)}
            placeholder="Введите форму..."
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {/* Präteritum */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">
            Präteritum
          </label>
          <input
            ref={praeteritumRef}
            type="text"
            value={praeteritum}
            onChange={(e) => handlePraeteritumChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && currentExercise && checkField(praeteritum, currentExercise.praeteritum)) {
                partizip2Ref.current?.focus();
              }
            }}
            disabled={results[0] !== true}
            className={getInputClassName(1)}
            placeholder="Введите форму..."
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {/* Partizip II */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">
            Partizip II
          </label>
          <input
            ref={partizip2Ref}
            type="text"
            value={partizip2}
            onChange={(e) => handlePartizip2Change(e.target.value)}
            disabled={results[2] === true || results[1] !== true}
            className={getInputClassName(2)}
            placeholder="Введите форму..."
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>


      {/* Кнопки */}
      <div className="flex gap-2">
        <button
          onClick={showHint}
          disabled={hintsShown[0] && hintsShown[1] && hintsShown[2]}
          className="w-12 h-12 bg-yellow-500 text-white rounded-lg font-black hover:bg-yellow-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xl"
          title="Подсказка"
        >
          💡
        </button>

        <button
          onClick={handleNext}
          disabled={!allCorrect}
          className="flex-1 py-3 bg-green-600 text-white rounded-lg font-black text-base hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Вперед →
        </button>
      </div>

    </div>
  );
};

export default VerbFormFill;
