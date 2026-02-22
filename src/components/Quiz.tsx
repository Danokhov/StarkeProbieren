import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../types';
import { QuizService, QuizResult } from '../services/quizService';

interface QuizQuestion {
  verb: string;
  question: string;
  options: string[];
  correctAnswer: number;
  correctText: string;
}

interface QuizProps {
  user: User;
  onBack: () => void;
}

const Quiz: React.FC<QuizProps> = ({ user, onBack }) => {
  const [verbs, setVerbs] = useState<any>({});
  const [quizMode, setQuizMode] = useState<'select' | 'quiz' | 'results'>('select');
  const [questionCount, setQuestionCount] = useState<5 | 10 | 20>(10);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Загружаем данные из window.verbsPart1
    const loadVerbs = () => {
      try {
        const verbsData = (window as any).verbsPart1;
        if (verbsData && typeof verbsData === 'object') {
          setVerbs(verbsData);
        } else {
          console.warn('window.verbsPart1 не найден или имеет неверный формат');
        }
      } catch (error) {
        console.error('Ошибка загрузки данных глаголов:', error);
      } finally {
        setLoading(false);
      }
    };

    if ((window as any).verbsPart1) {
      loadVerbs();
    } else {
      const checkInterval = setInterval(() => {
        if ((window as any).verbsPart1) {
          loadVerbs();
          clearInterval(checkInterval);
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        setLoading(false);
      }, 5000);
    }
  }, []);

  // Собираем все вопросы из всех глаголов и ограничиваем опции до 3
  const allQuestions = useMemo(() => {
    const questionsList: QuizQuestion[] = [];
    Object.keys(verbs).forEach(verbKey => {
      const verb = verbs[verbKey];
      if (verb.quizQuestions && Array.isArray(verb.quizQuestions)) {
        verb.quizQuestions.forEach((q: any) => {
          // Ограничиваем опции до 3
          let limitedOptions = q.options.slice(0, 3);
          let correctedAnswer = q.correctAnswer;
          
          // Если правильный ответ находится за пределами первых 3 вариантов,
          // меняем его местами с одним из первых 3-х
          if (correctedAnswer >= 3) {
            // Берем правильный ответ с его позиции
            const correctOption = q.options[correctedAnswer];
            // Создаем новый массив: правильный ответ + остальные варианты
            limitedOptions = [correctOption, ...q.options.slice(0, 2)];
            // Правильный ответ теперь на первой позиции
            correctedAnswer = 0;
          }
          
          questionsList.push({
            verb: verb.infinitive,
            question: q.question,
            options: limitedOptions,
            correctAnswer: correctedAnswer,
            correctText: q.correctText
          });
        });
      }
    });
    return questionsList;
  }, [verbs]);

  // Функция перемешивания массива
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startQuiz = (count?: number) => {
    if (allQuestions.length === 0) {
      alert('Нет доступных вопросов для квиза');
      return;
    }

    // Используем переданное количество или текущее значение questionCount
    const questionsToUse = count ?? questionCount;

    // Выбираем случайные вопросы - используем выбранное пользователем количество
    const shuffled = shuffleArray(allQuestions);
    const selected = shuffled.slice(0, Math.min(questionsToUse, allQuestions.length));
    setQuestions(selected);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizMode('quiz');
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: answerIndex
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    let correctCount = 0;
    const questionResults = questions.map((q, index) => {
      const selected = selectedAnswers[index] ?? -1;
      const isCorrect = selected === q.correctAnswer;
      if (isCorrect) correctCount++;
      return {
        verb: q.verb,
        question: q.question,
        selectedAnswer: selected,
        correctAnswer: q.correctAnswer,
        isCorrect
      };
    });

    const percentage = Math.round((correctCount / questions.length) * 100);
    
    const result: Omit<QuizResult, 'completedAt'> = {
      telegramId: user.telegramId,
      name: user.name,
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      percentage,
      questions: questionResults
    };

    setQuizResult(result as QuizResult);
    setQuizMode('results');

    // Сохраняем результат в Firebase
    try {
      await QuizService.saveQuizResult(result);
    } catch (error) {
      console.error('Ошибка сохранения результата квиза:', error);
    }
  };

  const restartQuiz = () => {
    setQuizMode('select');
    setQuizResult(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
  };

  const currentQuestion = questions[currentQuestionIndex];
  const hasSelectedAnswer = selectedAnswers[currentQuestionIndex] !== undefined;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold">Загрузка вопросов...</p>
        </div>
      </div>
    );
  }

  if (allQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-[2.5rem] p-8 max-w-md mx-4 text-center">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-4">Нет доступных вопросов</h2>
          <p className="text-gray-600 font-semibold mb-6">В базе глаголов пока нет вопросов для квиза.</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 transition-colors"
          >
            Вернуться
          </button>
        </div>
      </div>
    );
  }

  if (quizMode === 'select') {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="w-11 h-11 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all"
              >
                <i className="fas fa-arrow-left text-lg"></i>
              </button>
              <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                <i className="fas fa-question-circle text-lg"></i>
              </div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">КВИЗ</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-lg border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-gray-800 mb-4">Выберите режим квиза</h2>
              <p className="text-gray-600 font-semibold">Доступно вопросов: {allQuestions.length}</p>
            </div>

            <div className="space-y-4 mb-8">
              {[5, 10, 20].map((count) => (
                <button
                  key={count}
                  onClick={() => {
                    setQuestionCount(count as 5 | 10 | 20);
                    startQuiz(count);
                  }}
                  disabled={allQuestions.length < count}
                  className={`w-full p-6 rounded-2xl border-2 transition-all ${
                    questionCount === count
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                      : allQuestions.length >= count
                      ? 'bg-white text-gray-800 border-gray-200 hover:border-indigo-300 hover:shadow-md'
                      : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black">{count} вопросов</span>
                    {allQuestions.length < count && (
                      <span className="text-sm font-bold">Недостаточно вопросов</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (quizMode === 'results' && quizResult) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="w-11 h-11 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all"
              >
                <i className="fas fa-arrow-left text-lg"></i>
              </button>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">Результаты КВИЗа</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-lg border border-gray-100 text-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-black mx-auto mb-6 shadow-xl">
              {quizResult.percentage}%
            </div>
            <h2 className="text-3xl font-black text-gray-800 mb-4">Результат квиза</h2>
            <p className="text-2xl font-black text-indigo-600 mb-2">
              {quizResult.correctAnswers} / {quizResult.totalQuestions}
            </p>
            <p className="text-gray-600 font-semibold">
              Правильных ответов: {quizResult.correctAnswers} из {quizResult.totalQuestions}
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {quizResult.questions.map((q, index) => (
              <div
                key={index}
                className={`p-6 rounded-2xl border-2 ${
                  q.isCorrect
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    q.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    <i className={`fas ${q.isCorrect ? 'fa-check' : 'fa-times'} text-sm`}></i>
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-800 mb-2">{q.question}</p>
                    <div className="mt-2">
                      <p className={`text-sm font-semibold mb-1 ${q.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        Правильный ответ: {questions[index]?.options[q.correctAnswer]}
                      </p>
                      {!q.isCorrect && (
                        <p className="text-sm text-gray-600">
                          Ваш ответ: {questions[index]?.options[q.selectedAnswer] || 'Не выбран'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={restartQuiz}
              className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black text-lg hover:bg-indigo-700 transition-colors"
            >
              Пройти еще раз
            </button>
            <button
              onClick={onBack}
              className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-black text-lg hover:bg-gray-200 transition-colors"
            >
              Вернуться
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="w-11 h-11 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all"
              >
                <i className="fas fa-arrow-left text-lg"></i>
              </button>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">КВИЗ</h1>
            </div>
            <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
              <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">
                {currentQuestionIndex + 1} / {questions.length}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        {currentQuestion && (
          <div className="bg-white rounded-[2.5rem] p-8 shadow-lg border border-gray-100">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-xs font-black uppercase">
                  {currentQuestion.verb}
                </span>
              </div>
              <h2 className="text-2xl font-black text-gray-800 leading-tight mb-6">
                {currentQuestion.question}
              </h2>
            </div>

            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswers[currentQuestionIndex] === index;
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                        : 'bg-white text-gray-800 border-gray-200 hover:border-indigo-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <span className="font-black">{String.fromCharCode(65 + index)}</span>
                      </div>
                      <span className="font-semibold">{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNext}
              disabled={!hasSelectedAnswer}
              className={`w-full py-4 rounded-xl font-black text-lg transition-all ${
                hasSelectedAnswer
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {currentQuestionIndex < questions.length - 1 ? 'Следующий вопрос' : 'Завершить квиз'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Quiz;
