import React from 'react';
import { Topic } from '../types';

interface TrialExercisesProps {
  topic: Topic;
  onBack: () => void;
  onStartExercise: (moduleType: 'exercises' | 'verb-forms' | 'verb-form-flashcards' | 'text-gaps') => void;
}

const TrialExercises: React.FC<TrialExercisesProps> = ({ topic, onBack, onStartExercise }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Кнопка назад */}
        <button
          onClick={onBack}
          className="mb-6 w-12 h-12 flex items-center justify-center bg-white text-gray-700 rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all"
        >
          <i className="fas fa-arrow-left text-xl"></i>
        </button>

        {/* Основной контент */}
        <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-gray-100">
          <h1 className="text-3xl font-black text-gray-800 mb-8 text-center">
            Потренируй запоминание глаголов в упражнениях
          </h1>

          <div className="space-y-4">
            {/* Карточки 3 формы */}
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-6 border-2 border-teal-200 shadow-lg">
              <p className="text-gray-700 text-sm font-bold mb-4 text-center">
                Карточки глаголов в 3-х формах
              </p>
              <button
                onClick={() => onStartExercise('verb-form-flashcards')}
                className="w-full py-4 bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 text-white rounded-xl font-black text-base shadow-lg hover:shadow-xl active:scale-95 transition-all"
              >
                Карточки 3 формы
              </button>
            </div>

            {/* Пробелы в мантрах */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-200 shadow-lg">
              <p className="text-gray-700 text-sm font-bold mb-4 text-center">
                Проверяем знание слов в мантрах
              </p>
              <button
                onClick={() => onStartExercise('exercises')}
                className="w-full py-4 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-xl font-black text-base shadow-lg hover:shadow-xl active:scale-95 transition-all"
              >
                Пробелы в мантрах
              </button>
            </div>

            {/* Заполнение слов */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
              <p className="text-gray-700 text-sm font-bold mb-4 text-center">
                Учимся писать слова
              </p>
              <button
                onClick={() => onStartExercise('verb-forms')}
                className="w-full py-4 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white rounded-xl font-black text-base shadow-lg hover:shadow-xl active:scale-95 transition-all"
              >
                Заполнение слов
              </button>
            </div>

            {/* Пробелы в тексте */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-6 border-2 border-violet-200 shadow-lg">
              <p className="text-gray-700 text-sm font-bold mb-4 text-center">
                Заполни пробелы в тексте (gewinnen, beginnen, schwimmen)
              </p>
              <button
                onClick={() => onStartExercise('text-gaps')}
                className="w-full py-4 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white rounded-xl font-black text-base shadow-lg hover:shadow-xl active:scale-95 transition-all"
              >
                Пробелы в тексте
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialExercises;
