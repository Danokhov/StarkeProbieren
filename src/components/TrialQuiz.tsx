import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Topic, VerbFormCard } from '../types';

interface TrialQuizProps {
  topic: Topic;
  onClose: () => void;
  onComplete?: (score: number, total: number) => void;
  onShowSpecialOffer?: () => void;
  onShowCourseInfo?: () => void;
}

type QuestionType = 
  | 'gap-in-mantra'
  | 'choose-verb-form'
  | 'write-verb-form'
  | 'translate-to-german'
  | 'translate-to-russian'
  | 'choose-praeteritum'
  | 'choose-partizip2'
  | 'choose-auxillary'
  | 'fill-gap-sentence'
  | 'match-forms';

interface Question {
  id: number;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  verbCard?: VerbFormCard;
  mantra?: any;
  sentence?: string;
}

// Функция для перемешивания массива
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Ограничиваем варианты ответа до 3
const limitOptionsTo3 = (options: string[], correctAnswer: string): string[] => {
  const correctIncluded = options.includes(correctAnswer);
  const wrongOptions = options.filter(o => o !== correctAnswer);
  const limitedWrong = wrongOptions.slice(0, 2);
  const result = [correctAnswer, ...limitedWrong];
  return shuffleArray(result);
};

// Генерируем неправильные варианты Partizip II из того же глагола с разными корневыми гласными (аблаут)
const getPartizip2WrongOptions = (card: VerbFormCard): string[] => {
  const { partizip2 } = card;
  const wrongOptions: string[] = [];
  
  // Замена корневой гласной по типичным рядам аблаута: a↔u (a-u-a), o↔a (i-a-o)
  const replacements: [RegExp, string][] = [
    [/([bcdfghjklmnpqrstvwxyzß])(a)([bcdfghjklmnpqrstvwxyzß]+en)$/i, '$1u$3'],  // a→u (fahren→gefuhren)
    [/([bcdfghjklmnpqrstvwxyzß])(u)([bcdfghjklmnpqrstvwxyzß]+en)$/i, '$1a$3'],  // u→a
    [/([bcdfghjklmnpqrstvwxyzß])(o)([bcdfghjklmnpqrstvwxyzß]+en)$/i, '$1a$3'],  // o→a (gewonnen→gewannen)
    [/([bcdfghjklmnpqrstvwxyzß])(a)([bcdfghjklmnpqrstvwxyzß]+en)$/i, '$1o$3'],  // a→o
  ];
  
  for (const [pattern, replacement] of replacements) {
    const variant = partizip2.replace(pattern, replacement);
    if (variant !== partizip2 && !wrongOptions.includes(variant)) {
      wrongOptions.push(variant);
      if (wrongOptions.length >= 2) break;
    }
  }
  
  // Вариант с -et (как у слабых глаголов): geladen→geladet
  const withEt = partizip2.replace(/en$/i, 'et');
  if (withEt !== partizip2 && !wrongOptions.includes(withEt)) {
    wrongOptions.push(withEt);
  }
  
  return wrongOptions.slice(0, 2);
};

// Генерируем неправильные варианты Präteritum из того же глагола с разными корневыми гласными (аблаут)
const getPraeteritumWrongOptions = (card: VerbFormCard): string[] => {
  const { praeteritum } = card;
  const wrongOptions: string[] = [];

  // Замена корневой гласной по аблауту
  const tryReplace = (pattern: RegExp, repl: string): string | null => {
    const v = praeteritum.replace(pattern, repl);
    return v !== praeteritum ? v : null;
  };

  // u→a (fuhr→fahr, lud→lad, erfuhr→erfahr)
  const u2a = tryReplace(/([bcdfghjklmnpqrstvwxyzß])u([bcdfghjklmnpqrstvwxyzß]*)/i, '$1a$2');
  if (u2a && !wrongOptions.includes(u2a)) wrongOptions.push(u2a);

  // u→o (fuhr→for, lud→lod)
  const u2o = tryReplace(/([bcdfghjklmnpqrstvwxyzß])u([bcdfghjklmnpqrstvwxyzß]*)/i, '$1o$2');
  if (u2o && !wrongOptions.includes(u2o)) wrongOptions.push(u2o);

  // a→i (gewann→gewinn, schwamm→schwimm, begann→beginn)
  const a2i = tryReplace(/([bcdfghjklmnpqrstvwxyzß])a([bcdfghjklmnpqrstvwxyzß]*)/i, '$1i$2');
  if (a2i && !wrongOptions.includes(a2i)) wrongOptions.push(a2i);

  // a→o (gewann→gewonn, schwamm→schwomm, begann→begonn)
  const a2o = tryReplace(/([bcdfghjklmnpqrstvwxyzß])a([bcdfghjklmnpqrstvwxyzß]*)/i, '$1o$2');
  if (a2o && !wrongOptions.includes(a2o)) wrongOptions.push(a2o);

  // Вариант с окончанием слабых глаголов (-te) для глаголов с u в основе: fuhr→fahrte, lud→ladete
  if (wrongOptions.length < 2 && /u/.test(praeteritum)) {
    const parts = praeteritum.split(/\s+/);
    const stem = parts[0];
    const suffix = parts.length > 1 ? ' ' + parts.slice(1).join(' ') : '';
    const weakStem = stem.replace(/u([bcdfghjklmnpqrstvwxyzß]*)$/i, 'a$1');
    const weakVariant = weakStem + (/[dt]$/i.test(weakStem) ? 'e' : '') + 'te' + suffix;
    if (weakVariant !== praeteritum && !wrongOptions.includes(weakVariant)) {
      wrongOptions.push(weakVariant);
    }
  }

  return wrongOptions.slice(0, 2);
};

const TrialQuiz: React.FC<TrialQuizProps> = ({ topic, onClose, onComplete, onShowSpecialOffer, onShowCourseInfo }) => {
  const verbFormCards = topic.verbFormCards || [];
  const mantras = topic.mantras || [];
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const hasShownSuccessModal = useRef(false);

  // Создаем пул вопросов, из которого выберем 10 рандомных
  const allQuestions = useMemo(() => {
    const questions: Question[] = [];
    let questionId = 1;

    // Находим нужные глаголы
    const fahrenCard = verbFormCards.find(c => c.praesens === 'fahren');
    const ladenCard = verbFormCards.find(c => c.praesens === 'laden');
    const erfahrenCard = verbFormCards.find(c => c.praesens === 'erfahren');
    const einladenCard = verbFormCards.find(c => c.praesens === 'einladen');
    const gewinnenCard = verbFormCards.find(c => c.praesens === 'gewinnen');
    const schwimmenCard = verbFormCards.find(c => c.praesens === 'schwimmen');
    const beginnenCard = verbFormCards.find(c => c.praesens === 'beginnen');

    // Вопрос 1: Как будет форма fahren с er (er/sie/es форма) - 3 варианта
    if (fahrenCard) {
      const options = ['fährt', 'fahrt', 'fahren', 'fuhren'];
      questions.push({
        id: questionId++,
        type: 'choose-verb-form',
        question: 'Как будет форма глагола fahren в 3-м лице единственного числа (er/sie/es)?',
        options: limitOptionsTo3(options, 'fährt'),
        correctAnswer: 'fährt',
        verbCard: fahrenCard
      });
    }

    // Вопрос 2: Как будет форма laden с er - 3 варианта
    if (ladenCard) {
      const options = ['lädt', 'ladet', 'laden', 'luden'];
      questions.push({
        id: questionId++,
        type: 'choose-verb-form',
        question: 'Как будет форма глагола laden в 3-м лице единственного числа (er/sie/es)?',
        options: limitOptionsTo3(options, 'lädt'),
        correctAnswer: 'lädt',
        verbCard: ladenCard
      });
    }

    // Вопрос 3: Как сказать "он испытал в жизни много интересного" - erfahren - 3 варианта
    if (erfahrenCard) {
      const options = ['erfahren', 'erfuhr', 'erfährt', 'erfahrt'];
      questions.push({
        id: questionId++,
        type: 'fill-gap-sentence',
        question: 'Заполните пробел: "Er hat viel Interessantes im Leben ____." (он испытал в жизни много интересного)',
        options: limitOptionsTo3(options, 'erfahren'),
        correctAnswer: 'erfahren',
        verbCard: erfahrenCard,
        sentence: 'Er hat viel Interessantes im Leben erfahren.'
      });
    }

    // Вопрос 4: То же с einladen - 3 варианта
    if (einladenCard) {
      const options = ['eingeladen', 'einluden', 'einladen', 'einladet'];
      questions.push({
        id: questionId++,
        type: 'fill-gap-sentence',
        question: 'Заполните пробел: "Wir haben unsere Freunde zum Abendessen ____." (мы пригласили наших друзей на ужин)',
        options: limitOptionsTo3(options, 'eingeladen'),
        correctAnswer: 'eingeladen',
        verbCard: einladenCard,
        sentence: 'Wir haben unsere Freunde zum Abendessen eingeladen.'
      });
    }

    // Вопросы 5-11: Как будет претеритум для каждого глагола
    const praeteritumVerbs = [
      { card: fahrenCard, ru: 'ехать' },
      { card: ladenCard, ru: 'грузить' },
      { card: einladenCard, ru: 'приглашать' },
      { card: erfahrenCard, ru: 'узнавать' },
      { card: gewinnenCard, ru: 'выигрывать' },
      { card: schwimmenCard, ru: 'плавать' },
      { card: beginnenCard, ru: 'начинать' }
    ];

    praeteritumVerbs.forEach(({ card, ru }) => {
      if (card) {
        const wrongOptions = getPraeteritumWrongOptions(card);
        const options = limitOptionsTo3([card.praeteritum, ...wrongOptions], card.praeteritum);
        questions.push({
          id: questionId++,
          type: 'choose-praeteritum',
          question: `Как будет Präteritum от глагола "${card.praesens}" (${ru})?`,
          options,
          correctAnswer: card.praeteritum,
          verbCard: card
        });
      }
    });

    // Вопрос 12: Какой вспомогательный глагол в "мы ехали на машине" - 3 варианта
    if (fahrenCard) {
      const options = ['sind', 'haben', 'ist', 'hat'];
      questions.push({
        id: questionId++,
        type: 'choose-auxillary',
        question: 'Какой вспомогательный глагол нужен в предложении "Wir ____ mit dem Auto gefahren" (мы ехали на машине)?',
        options: limitOptionsTo3(options, 'sind'),
        correctAnswer: 'sind',
        verbCard: fahrenCard
      });
    }

    // Вопрос 13: Какой вспомогательный глагол в "он вел машину" - 3 варианта
    if (fahrenCard) {
      const options = ['hat', 'ist', 'haben', 'sind'];
      questions.push({
        id: questionId++,
        type: 'choose-auxillary',
        question: 'Какой вспомогательный глагол нужен в предложении "Er ____ das Auto gefahren" (он вел машину)?',
        options: limitOptionsTo3(options, 'hat'),
        correctAnswer: 'hat',
        verbCard: fahrenCard
      });
    }

    // Вопрос 14: Какой вспомогательный глагол в "они плавали сегодня" - 3 варианта
    if (schwimmenCard) {
      const options = ['sind', 'haben', 'ist', 'hat'];
      questions.push({
        id: questionId++,
        type: 'choose-auxillary',
        question: 'Какой вспомогательный глагол нужен в предложении "Sie ____ heute geschwommen" (они плавали сегодня)?',
        options: limitOptionsTo3(options, 'sind'),
        correctAnswer: 'sind',
        verbCard: schwimmenCard
      });
    }

    // Вопрос 15: Какой персонаж для запоминания ряда аблаута i-a-o - 3 варианта
    const characterOptions = ['Пифагор', 'Доктор', 'Учитель', 'Повар'];
    questions.push({
      id: questionId++,
      type: 'choose-verb-form',
      question: 'Какой персонаж используется для запоминания ряда аблаута i-a-o?',
      options: limitOptionsTo3(characterOptions, 'Пифагор'),
      correctAnswer: 'Пифагор',
      verbCard: beginnenCard
    });

    // Добавляем вопросы про Partizip 2
    const partizip2Verbs = [
      { card: fahrenCard, ru: 'ехать' },
      { card: gewinnenCard, ru: 'выигрывать' },
      { card: beginnenCard, ru: 'начинать' },
      { card: schwimmenCard, ru: 'плавать' },
      { card: ladenCard, ru: 'грузить' },
      { card: einladenCard, ru: 'приглашать' }
    ];

    partizip2Verbs.forEach(({ card, ru }) => {
      if (card) {
        const wrongOptions = getPartizip2WrongOptions(card);
        const options = limitOptionsTo3([card.partizip2, ...wrongOptions], card.partizip2);
        questions.push({
          id: questionId++,
          type: 'choose-partizip2',
          question: `Как будет Partizip II глагола "${card.praesens}" (${ru})?`,
          options,
          correctAnswer: card.partizip2,
          verbCard: card
        });
      }
    });

    // Перемешиваем все вопросы и берем 10 рандомных
    return shuffleArray(questions).slice(0, 7);
  }, [verbFormCards, mantras]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [quizFinished, setQuizFinished] = useState(false);

  const currentQuestion = allQuestions[currentQuestionIndex];
  
  // Подсчитываем счет на основе ответов
  const score = Object.values(answers).filter(Boolean).length;

  const handleSelectAnswer = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    const correct = answer === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
    setAnswers({ ...answers, [currentQuestion.id]: correct });
  };

  const handleNext = () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(null);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(null);
    setAnswers({});
    setQuizFinished(false);
    setShowSuccessModal(false);
  };

  // Вычисляем финальный результат
  const finalAnswers = quizFinished ? { ...answers, [currentQuestion.id]: isCorrect === true } : answers;
  const finalScore = Object.values(finalAnswers).filter(Boolean).length;
  const passed = quizFinished && finalScore >= 4;
  const percentage = quizFinished ? Math.round((finalScore / allQuestions.length) * 100) : 0;

  // Автоматически показываем модалку успеха при успешном прохождении (только один раз)
  useEffect(() => {
    if (quizFinished && passed && !hasShownSuccessModal.current) {
      localStorage.setItem('trialQuizPassed', 'true');
      setShowSuccessModal(true);
      hasShownSuccessModal.current = true;
    }
  }, [quizFinished, passed]);

  // Если квиз завершен и пройден успешно, показываем модалку успеха
  if (quizFinished) {
    
    if (onComplete) {
      onComplete(finalScore, allQuestions.length);
    }

    // Если квиз пройден успешно и модалка открыта, показываем модалку
    if (passed && showSuccessModal) {
      return (
        <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-2xl font-black text-gray-800">Квиз завершен!</h3>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-3xl font-black text-gray-800 mb-4">
                Успех
              </h1>
              <div className="text-2xl font-black text-green-600 mb-6">
                Результат: {percentage}%
              </div>
              <p className="text-lg text-gray-700 font-bold leading-relaxed mb-4">
                Первые шаги уже сделаны. Если хочешь продолжить и выучить за 11 модулей все самые важные сильные глаголы без зубрёжки раз и навсегда, то вот что ждёт тебя в курсе. Ниже тебе доступно спецпредложение.
              </p>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => {
                  if (onShowCourseInfo) {
                    onShowCourseInfo();
                  }
                }}
                className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 text-white rounded-xl font-black text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all"
              >
                Подробнее про курс
              </button>
              <button
                onClick={() => {
                  if (onShowSpecialOffer) {
                    onShowSpecialOffer();
                  }
                }}
                className="w-full py-4 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-xl font-black text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all"
              >
                Твое спецпредложение
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Если квиз пройден успешно, но модалка закрыта, показываем экран "квиз уже пройден"
    if (passed && !showSuccessModal) {
      return (
        <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
          <div className="flex items-center justify-center p-6 border-b border-gray-200">
            <h3 className="text-2xl font-black text-gray-800">Квиз уже пройден</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-3xl font-black text-gray-800 mb-4">
                Квиз уже пройден
              </h1>
              <p className="text-lg text-gray-700 font-bold leading-relaxed mb-4">
                Если хочешь выучить все сильные глаголы за 11 модулей и за 22 урока, то получай своё спецпредложение.
              </p>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => {
                  if (onShowSpecialOffer) {
                    onShowSpecialOffer();
                  }
                }}
                className="w-full py-4 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-xl font-black text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all"
              >
                Спецпредложение
              </button>
              <div className="text-center mb-2">
                <p className="text-base text-gray-600 font-bold">
                  Еще раз пройти пробные уроки
                </p>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('trialQuizPassed');
                  localStorage.removeItem('trialLessonStep');
                  if (onClose) {
                    onClose();
                  }
                }}
                className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 text-white rounded-xl font-black text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all"
              >
                Пройти ещё раз
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Если не пройден, показываем обычный экран результатов
    return (
      <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-2xl font-black text-gray-800">Квиз завершен!</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
            <i className="fas fa-trophy"></i>
          </div>
          <h2 className="text-3xl font-black text-gray-800 mb-4">
            Результат: {finalScore} / {allQuestions.length}
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            {finalScore === allQuestions.length 
              ? 'Отлично! Все ответы правильные! 🎉' 
              : finalScore >= allQuestions.length * 0.7
              ? 'Хорошо! Продолжай в том же духе! 💪'
              : 'Не расстраивайся! Повтори материал и попробуй еще раз! 📚'}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleRestart}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 active:scale-95 transition-all"
            >
              Пройти еще раз
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-black hover:bg-gray-200 active:scale-95 transition-all"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h3 className="text-2xl font-black text-gray-800">Квиз</h3>
          <p className="text-sm text-gray-500 mt-1">
            Вопрос {currentQuestionIndex + 1} из {allQuestions.length}
          </p>
          <p className="text-sm font-bold text-purple-600 mt-2">
            Ответь минимум на 4 вопроса из 7 правильно чтобы пройти квиз
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
        >
          <i className="fas fa-times text-xl"></i>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h2 className="text-xl font-black text-gray-800 mb-4">
            {currentQuestion.question}
          </h2>
        </div>
        <div className="space-y-3">
          {currentQuestion.options?.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectAnswer(option)}
              disabled={showResult}
              className={`w-full py-4 px-6 rounded-xl font-bold text-left transition-all ${
                showResult && option === currentQuestion.correctAnswer
                  ? 'bg-green-500 text-white shadow-lg'
                  : showResult && option === selectedAnswer && !isCorrect
                  ? 'bg-red-500 text-white shadow-lg'
                  : selectedAnswer === option
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${showResult ? 'cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
            >
              {option}
            </button>
          ))}
        </div>
        {showResult && (
          <div className="mt-6">
            <button
              onClick={handleNext}
              className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 text-white rounded-xl font-black text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all"
            >
              {currentQuestionIndex < allQuestions.length - 1 ? 'Следующий вопрос' : 'Завершить квиз'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrialQuiz;
