import React from 'react';

interface CourseInfoProps {
  onBack: () => void;
}

const CourseInfo: React.FC<CourseInfoProps> = ({ onBack }) => {
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
        <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-4xl shadow-lg mx-auto mb-6">
              <i className="fas fa-graduation-cap"></i>
            </div>
            <h1 className="text-3xl font-black text-gray-800 mb-4 leading-tight">
              Курс 180+ Сильных Глаголов
            </h1>
          </div>

          {/* Описание курса */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200">
              <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">🎓</span>
                <span>Структура курса</span>
              </h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">✅</span>
                  <span className="flex-1">
                    <b className="font-black">11 Модулей</b> с тематическими уроками
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">✅</span>
                  <span className="flex-1">
                    <b className="font-black">22 видео урока</b> с ассоциациями для запоминания
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">✅</span>
                  <span className="flex-1">
                    <b className="font-black">Интерактивные упражнения</b> для закрепления материала
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">✅</span>
                  <span className="flex-1">
                    <b className="font-black">База сильных глаголов</b> с ассоциациями и примерами
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-orange-200">
              <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">💫</span>
                <span>Что ты получишь</span>
              </h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 text-xl">🎯</span>
                  <span className="flex-1">Освоишь более <b className="font-black">180 сильных глаголов</b> немецкого языка</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 text-xl">🎯</span>
                  <span className="flex-1">Научишься правильно использовать <b className="font-black">3 формы глаголов</b></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 text-xl">🎯</span>
                  <span className="flex-1">Улучшишь понимание <b className="font-black">немецкой грамматики</b></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 text-xl">🎯</span>
                  <span className="flex-1">Получишь доступ к <b className="font-black">интерактивным упражнениям</b> и тестам</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
              <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">🚀</span>
                <span>Пробные уроки</span>
              </h2>
              <p className="text-sm text-gray-600">
                Попробуй и оцени качество обучения перед покупкой полного курса.
              </p>
            </div>
          </div>

          {/* Кнопка действия */}
          <div className="mt-8 text-center">
            <a
              href="https://mnemo-deutsch.de/"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-xl font-black text-lg shadow-xl hover:shadow-2xl active:scale-95 transition-all mb-3"
            >
              Получить полный доступ
            </a>
            <button
              onClick={onBack}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-base hover:bg-gray-200 active:scale-95 transition-all"
            >
              Вернуться
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseInfo;
