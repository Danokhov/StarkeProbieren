
import React, { useState } from 'react';
import { Topic, Word } from '../types';

interface VideoAssociationsProps {
  topic: Topic;
}

const VideoAssociations: React.FC<VideoAssociationsProps> = ({ topic }) => {
  const [expandedLessons, setExpandedLessons] = useState<{ [key: number]: boolean }>({});
  const [expandedModalVerbs, setExpandedModalVerbs] = useState(false);

  const toggleLesson = (index: number) => {
    setExpandedLessons(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Если есть lessons, используем их, иначе используем старый формат
  if (topic.lessons && topic.lessons.length > 0) {
    return (
      <div className="space-y-8 pb-10">
        {topic.lessons.map((lesson, lessonIndex) => (
          <div key={lessonIndex} className="space-y-6">
            {/* Заголовок урока */}
            <h2 className="text-3xl font-black text-indigo-600 mb-4">
              {lesson.title}
            </h2>

            {/* Видео (если есть) */}
            {lesson.videoUrl && (
              <div className="rounded-[2.5rem] overflow-hidden shadow-2xl bg-black aspect-video relative border-4 border-white">
                <iframe 
                  src={lesson.videoUrl}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                  title={lesson.title}
                ></iframe>
              </div>
            )}

            {/* Словарь урока с аккордеоном */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-md border border-gray-100">
              <button
                onClick={() => toggleLesson(lessonIndex)}
                className="w-full flex items-center justify-between text-left mb-4"
              >
                <h3 className="text-3xl font-black flex items-center gap-3">
                  <i className="fas fa-tags text-blue-500"></i>
                  Словарь урока
                </h3>
                <i className={`fas fa-chevron-${expandedLessons[lessonIndex] ? 'up' : 'down'} text-gray-400 text-xl`}></i>
              </button>
              
              {expandedLessons[lessonIndex] && (
                <div className="grid grid-cols-1 gap-4 mt-4">
                  {lesson.words.map((word, idx) => (
                    <div 
                      key={idx} 
                      className="p-6 rounded-[2rem] bg-gray-50 border border-gray-100 transition-colors"
                    >
                      <div className="text-xl font-black whitespace-pre-line">
                        <div className="text-indigo-600 mb-2">{word.de}</div>
                        {word.de !== word.ru && (
                          <>
                            <div className="mx-3 text-gray-300 my-2">—</div>
                            <div className="text-gray-600 font-bold">{word.ru}</div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Словарь модальных глаголов для Модуля 2
  const modalVerbs = [
    { verb: 'können', meanings: ['уметь, мочь (способность)', 'можно (разрешение)'], examples: ['Ich kann schwimmen. (Я умею плавать.)', 'Kann ich hier rauchen? (Можно здесь курить?)'] },
    { verb: 'müssen', meanings: ['должен, нужно (необходимость)', 'придётся (вынужденность)'], examples: ['Ich muss lernen. (Мне нужно учиться.)', 'Du musst pünktlich sein. (Ты должен быть пунктуальным.)'] },
    { verb: 'dürfen', meanings: ['разрешается, можно (разрешение)', 'иметь право'], examples: ['Darf ich hereinkommen? (Можно войти?)', 'Kinder dürfen nicht rauchen. (Детям нельзя курить.)'] },
    { verb: 'sollen', meanings: ['должен (совет, указание)', 'следует (рекомендация)'], examples: ['Du sollst mehr schlafen. (Тебе следует больше спать.)', 'Was soll ich tun? (Что мне делать?)'] },
    { verb: 'wollen', meanings: ['хотеть (намерение)', 'желать'], examples: ['Ich will nach Deutschland fahren. (Я хочу поехать в Германию.)', 'Was willst du? (Что ты хочешь?)'] },
    { verb: 'mögen', meanings: ['любить, нравиться', 'хотеть (вежливая форма)'], examples: ['Ich mag Schokolade. (Я люблю шоколад.)', 'Möchten Sie Kaffee? (Хотите кофе?)'] },
    { verb: 'möchten', meanings: ['хотеть (вежливая форма от mögen)'], examples: ['Ich möchte ein Bier. (Я хочу пиво.)', 'Möchten Sie etwas trinken? (Хотите что-нибудь выпить?)'] }
  ];

  // Старый формат (для обратной совместимости)
  return (
    <div className="space-y-8 pb-10">
      <div className="rounded-[2.5rem] overflow-hidden shadow-2xl bg-black aspect-video relative border-4 border-white">
        <iframe 
          src={topic.videoUrl}
          className="w-full h-full"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          title="Video Association"
        ></iframe>
      </div>

      {/* Словарь модальных глаголов для Модуля 2 */}
      {topic.id === 'job-interview' && (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-md border border-gray-100">
          <button
            onClick={() => setExpandedModalVerbs(!expandedModalVerbs)}
            className="w-full flex items-center justify-between text-left mb-4"
          >
            <h3 className="text-3xl font-black flex items-center gap-3">
              <i className="fas fa-tags text-blue-500"></i>
              Словарь темы
            </h3>
            <i className={`fas fa-chevron-${expandedModalVerbs ? 'up' : 'down'} text-gray-400 text-xl`}></i>
          </button>
          
          {expandedModalVerbs && (
            <div className="space-y-4 mt-4">
              {modalVerbs.map((modalVerb, idx) => (
                <div 
                  key={idx} 
                  className="p-6 rounded-[2rem] bg-gray-50 border border-gray-100 transition-colors"
                >
                  <div className="text-2xl font-black text-indigo-600 mb-3">{modalVerb.verb}</div>
                  <div className="space-y-2 mb-3">
                    {modalVerb.meanings.map((meaning, mIdx) => (
                      <div key={mIdx} className="text-lg font-semibold text-gray-700">
                        • {meaning}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 mt-4 pt-4 border-t border-gray-200">
                    {modalVerb.examples.map((example, eIdx) => (
                      <div key={eIdx} className="text-base text-gray-600 italic">
                        {example}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {topic.id !== 'house-cleaning' && topic.id !== 'job-interview' && (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-md border border-gray-100">
          <h3 className="text-3xl font-black mb-8 flex items-center gap-3">
            <i className="fas fa-tags text-blue-500"></i>
            Словарь урока
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {topic.words.map((word, idx) => (
              <div 
                key={idx} 
                className="p-6 rounded-[2rem] bg-gray-50 border border-gray-100 transition-colors"
              >
                <div className="text-xl font-black whitespace-pre-line">
                  <div className="text-indigo-600 mb-2">{word.de}</div>
                  {word.de !== word.ru && (
                    <>
                      <div className="mx-3 text-gray-300 my-2">—</div>
                      <div className="text-gray-600 font-bold">{word.ru}</div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoAssociations;
