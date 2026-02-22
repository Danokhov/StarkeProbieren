import React from 'react';
import { openTelegramBotLink } from '../utils/telegramUtils';

interface SpecialOfferProps {
  onBack: () => void;
}

const SpecialOffer: React.FC<SpecialOfferProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Кнопка назад */}
        <button
          onClick={onBack}
          className="mb-6 w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700 hover:shadow-xl active:scale-95 transition-all"
        >
          <i className="fas fa-arrow-left text-xl"></i>
        </button>

        {/* Основной контент */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <div className="inline-block mb-4">
              <span className="text-4xl">🔥</span>
            </div>
            <h1 className="text-3xl font-black text-gray-800 mb-2 leading-tight">
              Спецпредложение на полный курс со скидкой 50% Ограничено по времени!
            </h1>
          </div>

          {/* Опции */}
          <div className="space-y-6 mb-8">
            <h2 className="text-2xl font-black text-gray-800 text-center mb-6">
              Выбирай свою ОПЦИЮ!
            </h2>

            {/* Опция 1 */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-orange-200 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="text-3xl">1️⃣</div>
                <div className="flex-1">
                  <div className="mb-3">
                    <span className="text-green-600 text-xl mr-2">✅</span>
                    <span className="text-xl font-black text-gray-800">
                      🏆 <b>"ВСЕ 11 МОДУЛЕЙ"</b>
                    </span>
                  </div>
                  <div className="ml-8 space-y-2">
                    <p className="text-lg font-bold text-gray-700">
                      за <b className="text-orange-600 text-xl">39 евро</b>{' '}
                      <s className="text-gray-400">вместо 79 евро</s>
                    </p>
                    <p className="text-base text-gray-600">
                      + доступ в закрытый Телеграм Канал с дополнительными материалами.
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => openTelegramBotLink('https://t.me/de_starke_verben_bot?start=69515bee2cfb28cd220a0f17')}
                className="w-full mt-4 py-3 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-xl font-black text-base shadow-lg hover:shadow-xl active:scale-95 transition-all"
              >
                Оплатить
              </button>
            </div>

            {/* Опция 2 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-indigo-200 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="text-3xl">2️⃣</div>
                <div className="flex-1">
                  <div className="mb-3">
                    <span className="text-green-600 text-xl mr-2">✅</span>
                    <span className="text-xl font-black text-gray-800">
                      <b>Первые 6 МОДУЛЕЙ</b>
                    </span>
                  </div>
                  <div className="ml-8 space-y-2">
                    <p className="text-lg font-bold text-gray-700">
                      за <b className="text-indigo-600 text-xl">25 евро</b>
                    </p>
                    <p className="text-base text-gray-600 mb-2">
                      ➕ Потом по желанию остальные 5 МОДУЛЕЙ — за{' '}
                      <b className="text-indigo-600">19 евро</b>
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => openTelegramBotLink('https://t.me/de_starke_verben_bot?start=699813f65029210aa5020570')}
                className="w-full mt-4 py-3 bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 text-white rounded-xl font-black text-base shadow-lg hover:shadow-xl active:scale-95 transition-all"
              >
                Оплатить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecialOffer;
