import React, { useState } from 'react';
import { Topic } from '../types';
import TrialQuiz from './TrialQuiz';

interface TrialKnowledgeCheckProps {
  topic: Topic;
  onBack: () => void;
  onShowSpecialOffer: () => void;
  onShowCourseInfo?: () => void;
}

const TrialKnowledgeCheck: React.FC<TrialKnowledgeCheckProps> = ({ topic, onBack, onShowSpecialOffer, onShowCourseInfo }) => {
  const [showVideoModal, setShowVideoModal] = useState(false);
  
  // Проверяем, прошел ли пользователь квиз ранее
  const quizPassed = localStorage.getItem('trialQuizPassed') === 'true';

  const handleRestartTrialLessons = () => {
    localStorage.removeItem('trialQuizPassed');
    localStorage.removeItem('trialLessonStep');
    onBack();
  };

  // Если квиз уже пройден, показываем сообщение вместо квиза
  if (quizPassed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-gray-100">
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
                onClick={onShowSpecialOffer}
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
                onClick={handleRestartTrialLessons}
                className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 text-white rounded-xl font-black text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all"
              >
                Пройти ещё раз
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Показываем квиз
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <TrialQuiz 
          topic={topic} 
          onClose={onBack}
          onComplete={() => {}}
          onShowSpecialOffer={onShowSpecialOffer}
          onShowCourseInfo={onShowCourseInfo}
        />
      </div>
    </div>
  );
};

export default TrialKnowledgeCheck;
