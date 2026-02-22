import React, { useState, useEffect, useRef } from 'react';
import { Topic } from '../types';
import { unlockAudio, playAudioFile } from '../services/audioService';

interface DialogModuleProps {
  topic: Topic;
  onComplete?: () => void;
}

const DialogModule: React.FC<DialogModuleProps> = ({ topic, onComplete }) => {
  // Детальное логирование для темы 2
  useEffect(() => {
    if (topic.id === 'house-cleaning') {
      console.log('🔍 [DialogModule] house-cleaning topic received:', {
        id: topic.id,
        hasDialog: !!topic.dialog,
        dialogKeys: topic.dialog ? Object.keys(topic.dialog) : [],
        imageUrl: topic.dialog?.imageUrl,
        textExists: !!topic.dialog?.text,
        textLength: topic.dialog?.text?.length,
        audioUrl: topic.dialog?.audioUrl,
        hasQuiz: !!topic.quiz,
        quizLength: topic.quiz?.length,
        fullDialog: topic.dialog,
        fullTopic: topic
      });
    }
  }, [topic]);

  const [quizStarted, setQuizStarted] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const initAudio = async () => {
    await unlockAudio().catch(() => {});

    if (!audioRef.current) {
      setIsLoading(true);
      // Используем путь к аудио файлу (MP3 в корне public)
      const audioPath = topic.dialog.audioUrl.startsWith('/') 
        ? topic.dialog.audioUrl 
        : `/${topic.dialog.audioUrl}`;
      const audio = new Audio(audioPath);
      audioRef.current = audio;

      audio.oncanplaythrough = () => {
        setIsLoading(false);
        setDuration(audio.duration);
        audio.playbackRate = playbackRate;
      };
      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
        audio.playbackRate = playbackRate;
      };
      audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => { setIsPlaying(false); setCurrentTime(0); };
      audio.onerror = async (e) => { 
        setIsLoading(false); 
        setIsPlaying(false);
        // Fallback на SpeechSynthesis если файл не найден
        try {
          setIsPlaying(true);
          setIsLoading(true);
          await playAudioFile(audioPath, topic.dialog.text, 'de');
          setIsPlaying(false);
          setIsLoading(false);
        } catch (err) {
          setIsPlaying(false);
          setIsLoading(false);
        }
      };
      
      audio.load();
    }
  };

  const toggleAudio = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Если уже играет, останавливаем
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      return;
    }
    
    // Если аудио не инициализировано, инициализируем
    if (!audioRef.current) {
      await initAudio();
    }
    
    // Пробуем воспроизвести файл
    if (audioRef.current) {
      try {
        await audioRef.current.play();
      } catch (err) {
        // Если не удалось воспроизвести файл, используем fallback
        const audioPath = topic.dialog.audioUrl.startsWith('/') 
          ? topic.dialog.audioUrl 
          : `/${topic.dialog.audioUrl}`;
        setIsPlaying(true);
        setIsLoading(true);
        try {
          await playAudioFile(audioPath, topic.dialog.text, 'de');
        } catch (fallbackErr) {
          // Fallback failed silently
        }
        setIsPlaying(false);
        setIsLoading(false);
      }
    } else {
      // Если не удалось инициализировать, используем только fallback
      const audioPath = topic.dialog.audioUrl.startsWith('/') 
        ? topic.dialog.audioUrl 
        : `/${topic.dialog.audioUrl}`;
      setIsPlaying(true);
      setIsLoading(true);
      try {
        await playAudioFile(audioPath, topic.dialog.text, 'de');
      } catch (fallbackErr) {
        // Fallback failed silently
      }
      setIsPlaying(false);
      setIsLoading(false);
    }
  };


  const renderHighlightedText = (text: string) => {
    // Извлекаем слова из словаря темы и создаем список для поиска
    const wordsToMatch: string[] = [];
    
    topic.words.forEach(word => {
      // Извлекаем корень слова (убираем артикли der/die/das и окончания)
      let wordBase = word.de
        .replace(/^(der|die|das)\s+/i, '') // Убираем артикль
        .trim();
      
      // Добавляем полное слово для точного совпадения
      wordsToMatch.push(wordBase);
      
      // Для глаголов и существительных извлекаем корень
      // Убираем префиксы ab-, auf-, ein-, weg-, vor-, über-, unter-
      // Также убираем "sich " для рефлексивных глаголов и "um" в конце
      wordBase = wordBase.replace(/^sich\s+/i, '').replace(/\s+um$/i, '');
      let root = wordBase.replace(/^(ab|auf|ein|weg|aus|an|zu|vor|nach|mit|über|unter|emp|be|ver|ent|er|ge)-/i, '');
      
      // Убираем окончания для поиска однокоренных слов
      if (root.endsWith('en')) {
        const stem = root.slice(0, -2);
        if (stem.length > 3) {
          wordsToMatch.push(stem);
        }
      } else if (root.endsWith('n') && root.length > 4) {
        const stem = root.slice(0, -1);
        if (stem.length > 3) {
          wordsToMatch.push(stem);
        }
      }
      
      // Для сложных слов (например, Wischmopp, Staubsauger) добавляем части
      if (root.includes('mopp') || root.includes('sauger') || root.includes('blech') || root.includes('hahn')) {
        const parts = root.split(/(?=[A-Z])/);
        parts.forEach(part => {
          if (part.length > 3 && part !== root) {
            wordsToMatch.push(part.toLowerCase());
          }
        });
      }
    });

    // Удаляем дубликаты и сортируем по длине (сначала длинные слова)
    const uniqueWords = Array.from(new Set(wordsToMatch)).sort((a, b) => b.length - a.length);

    return text.split('\n\n').map((para, pIdx) => {
      let parts: (string | React.ReactNode)[] = [para];
      uniqueWords.forEach(word => {
        const newParts: (string | React.ReactNode)[] = [];
        // Ищем слово с учетом границ слова и различных окончаний
        // Учитываем заглавные и строчные буквы, а также умлауты
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b(${escapedWord}[a-zäöüßA-ZÄÖÜ]*)`, 'gi');
        parts.forEach(part => {
          if (typeof part !== 'string') {
            newParts.push(part);
            return;
          }
          const splitPart = part.split(regex);
          splitPart.forEach((subPart, i) => {
            if (subPart.match(regex)) {
              newParts.push(<span key={`${pIdx}-${word}-${i}`} className="highlight-word">{subPart}</span>);
            } else {
              newParts.push(subPart);
            }
          });
        });
        parts = newParts;
      });
      return <p key={pIdx} className="mb-3 leading-relaxed text-gray-800 text-lg sm:text-[13px] font-medium">{parts}</p>;
    });
  };

  const handleOptionSelect = (option: string) => {
    if (!topic.quiz || !topic.quiz[activeQuestion]) return;
    setSelectedOption(option);
    if (option === topic.quiz[activeQuestion].correctAnswer) setScore(s => s + 1);
    setTimeout(() => {
      if (activeQuestion + 1 < topic.quiz!.length) {
        setActiveQuestion(a => a + 1);
        setSelectedOption(null);
      } else {
        setShowResult(true);
        if (onComplete) onComplete();
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Проверка наличия данных
  if (!topic.dialog) {
    return (
      <div className="space-y-2 select-none pb-12 w-full px-0.5">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-bold">Ошибка: данные диалога не найдены для темы {topic.id}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 select-none pb-12 w-full px-0.5">
      {/* Изображение перед текстом (всегда видимо) */}
      {topic.dialog?.imageUrl && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-2 flex justify-center">
          <img 
            src={topic.dialog.imageUrl} 
            alt={topic.dialog.title || "Текст урока"}
            className="w-1/2 h-auto object-cover"
          />
        </div>
      )}

      {/* Кнопка открытия: теперь Бирюзовая (Teal) и компактная */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full flex items-center justify-between p-4 sm:p-3 transition-colors ${isExpanded ? 'bg-teal-100' : 'bg-teal-50 active:bg-teal-100'}`}
        >
          <div className="flex items-center gap-3 sm:gap-2">
            <div className={`w-12 h-12 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xl sm:text-base shadow-inner transition-colors ${isExpanded ? 'bg-teal-600 text-white' : 'bg-teal-100 text-teal-600'}`}>
              <i className="fas fa-file-alt"></i>
            </div>
            <div className="text-left">
              <h3 className="text-lg sm:text-[13px] font-black text-gray-800 leading-none">Текст урока</h3>
              <p className="text-xs sm:text-[8px] text-gray-400 font-bold uppercase tracking-tight">
                {isExpanded ? 'Скрыть текст' : 'Нажмите, чтобы прочитать'}
              </p>
            </div>
          </div>
          <div className={`w-8 h-8 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all duration-500 ${isExpanded ? 'rotate-180 bg-teal-200 text-teal-700' : 'bg-gray-100 text-gray-400'}`}>
            <i className="fas fa-chevron-down text-sm sm:text-[10px]"></i>
          </div>
        </button>

        <div 
          className="transition-all duration-500 ease-in-out overflow-hidden"
          style={{ maxHeight: isExpanded ? '5000px' : '0px', opacity: isExpanded ? 1 : 0 }}
        >
          <div className="px-4 sm:px-2 pb-6 sm:pb-4 pt-2 sm:pt-1 border-t border-teal-50">
            {/* Мини-плеер */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-2 border border-gray-100 mb-4 sm:mb-3 shadow-inner" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 sm:gap-2 mb-3 sm:mb-2">
                <button 
                  onClick={toggleAudio}
                  disabled={isLoading}
                  className={`w-12 h-12 sm:w-8 sm:h-8 rounded-md flex items-center justify-center transition-all shadow-sm active:scale-95 flex-shrink-0 ${
                    isPlaying ? 'bg-teal-600 text-white' : 'bg-white text-teal-600'
                  }`}
                >
                  {isLoading ? (
                    <i className="fas fa-circle-notch fa-spin text-base sm:text-[10px]"></i>
                  ) : (
                    <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-lg sm:text-xs ${!isPlaying && 'ml-0.5'}`}></i>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1 sm:mb-0.5">
                    <span className="text-xs sm:text-[7px] font-black text-teal-500 uppercase">{isPlaying ? 'Слушаем' : 'Пауза'}</span>
                    <span className="text-xs sm:text-[7px] font-bold text-gray-400 font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-1">
                <span className="text-xs sm:text-[7px] font-bold text-gray-500">Скорость:</span>
                {[0.5, 0.75, 1.0, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlaybackRate(rate);
                      if (audioRef.current) {
                        audioRef.current.playbackRate = rate;
                      }
                    }}
                    className={`px-3 py-1.5 sm:px-2 sm:py-1 rounded-lg text-xs sm:text-[8px] font-black transition-all ${
                      playbackRate === rate
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {rate}×
                  </button>
                ))}
              </div>
            </div>

            {/* Заголовок текста */}
            {topic.dialog.title && (
              <div className="mb-4 sm:mb-3">
                <h4 className="text-2xl sm:text-lg font-black text-gray-800 text-center italic">
                  {topic.dialog.title}
                </h4>
              </div>
            )}

            <div className="bg-white rounded-lg px-4 sm:px-2 py-4 sm:py-2 italic text-gray-700 leading-relaxed text-lg sm:text-[12px]">
               {renderHighlightedText(topic.dialog.text)}
            </div>
          </div>
        </div>
      </div>

      {topic.quiz && topic.quiz.length > 0 ? (
        !quizStarted ? (
          <button 
            onClick={async () => {
              await unlockAudio().catch(() => {});
              setQuizStarted(true);
            }}
            className="w-full py-4 sm:py-3 bg-indigo-600 text-white rounded-xl font-black text-base sm:text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
          >
            <i className="fas fa-check-double text-lg sm:text-sm"></i>
            Квиз по тексту
          </button>
        ) : showResult ? (
        <div className="bg-white rounded-xl p-6 sm:p-4 shadow-md text-center border border-gray-100 animate-in zoom-in">
          <div className="w-16 h-16 sm:w-10 sm:h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-2xl sm:text-lg mx-auto mb-4 sm:mb-3">
            <i className="fas fa-medal"></i>
          </div>
          <h3 className="text-lg sm:text-sm font-black mb-1 sm:mb-0.5 text-gray-800">Результат теста</h3>
          <p className="text-base sm:text-xs text-gray-500 mb-6 sm:mb-4 font-medium">{score} из {topic.quiz.length} верно</p>
          <button 
            onClick={() => { setQuizStarted(false); setActiveQuestion(0); setScore(0); setShowResult(false); }}
            className="w-full py-4 sm:py-2.5 bg-indigo-600 text-white rounded-lg font-black text-base sm:text-[11px] shadow-sm"
          >
            К изучению
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-6 sm:p-4 shadow-md border border-gray-100 animate-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-4 sm:mb-3">
            <span className="text-xs sm:text-[7px] font-black text-indigo-400 uppercase tracking-widest">Вопрос {activeQuestion + 1} / {topic.quiz?.length || 0}</span>
            <div className="flex gap-1 sm:gap-0.5">
              {topic.quiz?.map((_, i) => (
                <div key={i} className={`h-2 w-3 sm:h-1 sm:w-2 rounded-full transition-all duration-500 ${i <= activeQuestion ? 'bg-indigo-500' : 'bg-gray-100'}`}></div>
              ))}
            </div>
          </div>
          {topic.quiz && topic.quiz[activeQuestion] && (
            <>
              <h4 className="text-xl sm:text-[13px] font-black text-gray-800 mb-4 sm:mb-3 leading-tight">{topic.quiz[activeQuestion].question}</h4>
              <div className="space-y-3 sm:space-y-1.5">
                {topic.quiz[activeQuestion].options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => !selectedOption && handleOptionSelect(opt)}
                    className={`w-full p-4 sm:p-2.5 text-left rounded-lg border-2 transition-all font-bold group relative overflow-hidden min-h-[56px] sm:min-h-[40px] flex items-center ${
                      selectedOption === opt 
                        ? (opt === topic.quiz![activeQuestion].correctAnswer ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700')
                        : 'border-gray-50 bg-gray-50 active:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-2 relative z-10 w-full">
                      <div className={`w-6 h-6 sm:w-4 sm:h-4 rounded-full flex items-center justify-center text-xs sm:text-[7px] font-black flex-shrink-0 shadow-sm ${selectedOption === opt ? 'bg-current text-white' : 'bg-white text-gray-300'}`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="text-lg sm:text-[11px] leading-tight flex-1">{opt}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )
      ) : null}
    </div>
  );
};

export default DialogModule;