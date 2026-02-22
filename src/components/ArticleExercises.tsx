import React, { useState, useEffect } from 'react';
import { Topic } from '../types';
import { unlockAudio } from '../services/audioService';

interface ArticleExercisesProps {
  topic: Topic;
  onComplete?: () => void;
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

const ArticleExercises: React.FC<ArticleExercisesProps> = ({ topic, onComplete }) => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [shuffledArticles, setShuffledArticles] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<number[]>([]);
  const [originalWrongAnswers, setOriginalWrongAnswers] = useState<number[]>([]);
  const [exerciseIndices, setExerciseIndices] = useState<number[]>([]);
  const [totalExercises, setTotalExercises] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const exercises = topic.articleExercises || [];
  const articles = ['der', 'die', 'das'];
  const storageKey = `article_progress_${topic.id}`;

  // Функция для сохранения прогресса
  const saveProgress = (updates: Partial<SavedProgress>) => {
    try {
      const currentProgress: SavedProgress = {
        currentExercise: updates.currentExercise ?? currentExercise,
        score: updates.score ?? score,
        wrongAnswers: updates.wrongAnswers ?? wrongAnswers,
        originalWrongAnswers: updates.originalWrongAnswers ?? originalWrongAnswers,
        exerciseIndices: updates.exerciseIndices ?? exerciseIndices,
        totalExercises: updates.totalExercises ?? totalExercises,
        isCompleted: updates.isCompleted ?? isCompleted,
      };
      localStorage.setItem(storageKey, JSON.stringify(currentProgress));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  // Функция для загрузки прогресса
  const loadProgress = (): SavedProgress | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const progress: SavedProgress = JSON.parse(saved);
        // Проверяем, что сохраненный прогресс соответствует текущему количеству упражнений
        if (progress.totalExercises === exercises.length) {
          return progress;
        }
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
    return null;
  };

  // Функция для очистки прогресса
  const clearProgress = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to clear progress:', error);
    }
  };

  // Инициализация индексов упражнений и загрузка сохраненного прогресса
  useEffect(() => {
    if (exercises.length > 0) {
      const savedProgress = loadProgress();
      
      if (savedProgress && !savedProgress.isCompleted) {
        // Восстанавливаем прогресс, если упражнения не были завершены
        setCurrentExercise(savedProgress.currentExercise);
        setScore(savedProgress.score);
        setWrongAnswers(savedProgress.wrongAnswers);
        setOriginalWrongAnswers(savedProgress.originalWrongAnswers);
        setExerciseIndices(savedProgress.exerciseIndices);
        setTotalExercises(savedProgress.totalExercises);
        setIsCompleted(false);
      } else {
        // Начинаем заново или если упражнения были завершены
        const indices = exercises.map((_, i) => i);
        setExerciseIndices(indices);
        setTotalExercises(exercises.length);
        if (savedProgress?.isCompleted) {
          // Если упражнения были завершены, показываем результаты
          setScore(savedProgress.score);
          setOriginalWrongAnswers(savedProgress.originalWrongAnswers);
          setIsCompleted(true);
        }
      }
      setIsLoading(false);
    }
  }, [exercises.length, topic.id]);

  useEffect(() => {
    unlockAudio().catch(() => {});
    if (!isLoading && exerciseIndices.length > 0 && currentExercise < exerciseIndices.length) {
      shuffleArticles();
    }
  }, [currentExercise, exerciseIndices, isLoading]);

  const shuffleArticles = () => {
    const shuffled = [...articles];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setShuffledArticles(shuffled);
  };

  const handleArticleSelect = (article: string) => {
    if (selectedArticle) return;
    
    setSelectedArticle(article);
    const exerciseIndex = exerciseIndices[currentExercise];
    const isCorrect = article === exercises[exerciseIndex].correctArticle;
    
    if (isCorrect) {
      const newScore = score + 1;
      setScore(newScore);
      // Сохраняем прогресс после правильного ответа
      setTimeout(() => {
        saveProgress({ score: newScore });
      }, 0);
    } else {
      // Сохраняем индекс неправильного ответа
      const newWrongAnswers = [...wrongAnswers, exerciseIndex];
      setWrongAnswers(newWrongAnswers);
      // Сохраняем прогресс после неправильного ответа
      setTimeout(() => {
        saveProgress({ wrongAnswers: newWrongAnswers });
      }, 0);
    }
    
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentExercise + 1 < exerciseIndices.length) {
      const nextExercise = currentExercise + 1;
      setCurrentExercise(nextExercise);
      setSelectedArticle(null);
      setShowExplanation(false);
      
      // Сохраняем прогресс при переходе к следующему упражнению
      setTimeout(() => {
        saveProgress({ currentExercise: nextExercise });
      }, 0);
    } else {
      // Упражнения завершены
      // Сохраняем оригинальный список неправильных ответов для отображения в результатах
      const finalWrongAnswers = [...wrongAnswers];
      setOriginalWrongAnswers(finalWrongAnswers);
      setIsCompleted(true);
      
      // Сохраняем финальный прогресс
      setTimeout(() => {
        saveProgress({
          isCompleted: true,
          originalWrongAnswers: finalWrongAnswers
        });
      }, 0);
      
      if (onComplete) onComplete();
    }
  };

  const handleRetryWrong = () => {
    if (originalWrongAnswers.length === 0) return;
    
    // Устанавливаем только неправильные упражнения для повторного прохождения
    const wrongIndices = [...new Set(originalWrongAnswers)]; // Убираем дубликаты
    setExerciseIndices(wrongIndices);
    setCurrentExercise(0);
    setSelectedArticle(null);
    setShowExplanation(false);
    setScore(0);
    // Очищаем wrongAnswers для нового прохождения
    setWrongAnswers([]);
    setIsCompleted(false);
    
    // Сохраняем новый прогресс для повторного прохождения
    setTimeout(() => {
      saveProgress({
        currentExercise: 0,
        score: 0,
        wrongAnswers: [],
        exerciseIndices: wrongIndices,
        isCompleted: false
      });
    }, 0);
  };

  const handleReset = () => {
    // Обнуляем все и начинаем заново
    const indices = exercises.map((_, i) => i);
    setExerciseIndices(indices);
    setCurrentExercise(0);
    setSelectedArticle(null);
    setShowExplanation(false);
    setScore(0);
    setWrongAnswers([]);
    setOriginalWrongAnswers([]);
    setIsCompleted(false);
    
    // Очищаем сохраненный прогресс
    clearProgress();
  };

  const handleAudioClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSpeaking) {
      console.log("⏸️ Already speaking, ignoring click");
      return;
    }
    
    const exerciseIndex = exerciseIndices[currentExercise];
    const exercise = exercises[exerciseIndex];
    const wordWithArticle = `${exercise.correctArticle} ${exercise.word}`;
    
    setIsSpeaking(true);
    
    try {
      await unlockAudio();
      console.log("✅ Audio unlocked before speaking");
      
      // Используем OpenAI TTS с кэшированием
      try {
        const { playTextWithOpenAITTS } = await import('../services/openaiTtsService');
        await playTextWithOpenAITTS(wordWithArticle, 'de');
        console.log("✅ OpenAI TTS played successfully");
      } catch (openaiError) {
        console.warn("⚠️ [TTS Engine: OpenAI] Failed, switching to fallback:", openaiError);
        // Fallback на встроенный Speech Synthesis
        const { playTextWithSpeechSynthesis } = await import('../services/audioService');
        await playTextWithSpeechSynthesis(wordWithArticle, 'de');
        console.log("✅ [TTS Engine: Browser Speech Synthesis] Fallback activated");
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error("❌ Error in handleAudioClick:", error);
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsSpeaking(false);
    }
  };

  if (exercises.length === 0) {
    return (
      <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-md text-center">
        <p className="text-gray-600 font-bold">Упражнения на артикли пока не добавлены</p>
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

  // Экран результатов
  if (isCompleted) {
    const percentage = Math.round((score / totalExercises) * 100);
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
  const isCorrect = selectedArticle === exercise.correctArticle;
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
            Правильно: {score} / {currentExercise + (selectedArticle ? 1 : 0)}
          </span>
        </div>
        <div className="flex gap-1">
          {exerciseIndices.map((exerciseIdx, i) => {
            const wasAnswered = i < currentExercise || (i === currentExercise && selectedArticle);
            const wasCorrect = i < currentExercise 
              ? !wrongAnswers.includes(exerciseIdx)
              : (i === currentExercise && selectedArticle && isCorrect);
            
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
        {/* Немецкое слово с пропуском для артикля */}
        <div className="mb-6 p-8 bg-indigo-50 rounded-xl border-2 border-indigo-100 relative">
          <button
            onClick={handleAudioClick}
            disabled={isSpeaking}
            className={`absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-sm transition-transform ${
              isSpeaking 
                ? 'bg-indigo-200 text-indigo-400 cursor-not-allowed' 
                : 'bg-indigo-100 text-indigo-600 active:scale-110 hover:bg-indigo-200'
            }`}
          >
            <i className={`fas ${isSpeaking ? 'fa-spinner fa-spin' : 'fa-volume-up'} text-lg`}></i>
          </button>
          <p className="text-4xl font-black text-gray-800 text-center leading-relaxed">
            <span className={`inline-block px-4 py-2 mx-2 border-b-3 min-w-[100px] text-center ${
              selectedArticle 
                ? (isCorrect ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700')
                : 'border-indigo-400 border-dashed'
            }`}>
              {selectedArticle ? (
                <span className={`font-black text-3xl ${
                  isCorrect ? 'text-green-700' : 'text-red-700'
                }`}>
                  {selectedArticle}
                </span>
              ) : (
                <span className="text-indigo-500 text-lg font-medium">___</span>
              )}
            </span>
            <span className="text-gray-800 ml-3 text-4xl">{exercise.word}</span>
          </p>
        </div>

        {/* Варианты артиклей */}
        {!selectedArticle && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {shuffledArticles.map((article, idx) => {
              const getArticleStyle = (art: string) => {
                if (art === 'der') return 'bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50';
                if (art === 'die') return 'bg-white border-2 border-red-500 text-red-600 hover:bg-red-50';
                if (art === 'das') return 'bg-white border-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50';
                return 'bg-white border-2 border-gray-200 text-gray-700';
              };
              
              return (
                <button
                  key={idx}
                  onClick={() => handleArticleSelect(article)}
                  className={`p-6 rounded-xl font-black text-2xl transition-all active:scale-95 ${getArticleStyle(article)}`}
                >
                  {article}
                </button>
              );
            })}
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
                  {isCorrect ? 'Правильно!' : `Неверно. Правильный артикль: ${exercise.correctArticle}`}
                </p>
                <p className="text-gray-700 font-medium leading-relaxed">{exercise.explanation}</p>
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

export default ArticleExercises;

