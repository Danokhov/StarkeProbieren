import React, { useState, useEffect } from 'react';
import { unlockAudio } from '../services/audioService';

// Типы для данных глаголов
interface VerbData {
  infinitive: string;
  pronunciation: string;
  verbType: string;
  ablaut: string;
  ablautForms: {
    infinitive: string;
    praeteritum: string;
    partizipII: string;
  };
  meanings: string[];
  conjugation: Array<{
    person: string;
    form: string;
  }>;
  usage: Array<{
    construct: string;
    meaning: string;
    example: string;
  }>;
  features: Array<{
    title: string;
    text: string;
  }>;
  frequentWords: Array<{
    word: string;
    translation: string;
  }>;
  quizQuestions: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    correctText: string;
  }>;
  association?: {
    imageUrl: string;
    text: string; // формат: "перевод - мнемо якорь - нем слово"
  };
}

interface VerbsData {
  [key: string]: VerbData;
}

interface AssociationsBaseProps {
  onBack: () => void;
  onShowSpecialOffer?: () => void;
}

const AssociationsBase: React.FC<AssociationsBaseProps> = ({ onBack, onShowSpecialOffer }) => {
  const [verbs, setVerbs] = useState<VerbsData>({});
  const [loading, setLoading] = useState(true);
  const [selectedVerb, setSelectedVerb] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    // Загружаем данные из window.verbsPart1
    const loadVerbs = () => {
      try {
        const verbsData = (window as any).verbsPart1;
        console.log('📚 Загрузка данных глаголов...', {
          exists: !!verbsData,
          type: typeof verbsData,
          keysCount: verbsData ? Object.keys(verbsData).length : 0
        });
        
        if (verbsData && typeof verbsData === 'object') {
          // Только глаголы из пробного доступа
          const allowedVerbs = ['einladen', 'fahren', 'erfahren', 'schlagen', 'vorschlagen', 'graben', 'beginnen', 'gewinnen', 'schwimmen'];
          const filteredData: VerbsData = {};
          allowedVerbs.forEach(key => {
            if (verbsData[key]) {
              filteredData[key] = verbsData[key];
            }
          });
          
          setVerbs(filteredData);
          console.log('✅ Данные глаголов загружены успешно (пробный доступ:', Object.keys(filteredData).length, 'глаголов)');
        } else {
          console.warn('⚠️ window.verbsPart1 не найден или имеет неверный формат');
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки данных глаголов:', error);
      } finally {
        setLoading(false);
      }
    };

    // Проверяем, загружены ли данные
    if ((window as any).verbsPart1) {
      console.log('✅ window.verbsPart1 уже доступен');
      loadVerbs();
    } else {
      console.log('⏳ Ожидание загрузки window.verbsPart1...');
      // Ждем загрузки данных
      const checkInterval = setInterval(() => {
        if ((window as any).verbsPart1) {
          console.log('✅ window.verbsPart1 загружен');
          loadVerbs();
          clearInterval(checkInterval);
        }
      }, 100);

      // Таймаут через 5 секунд
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!(window as any).verbsPart1) {
          console.error('❌ Таймаут: window.verbsPart1 не загрузился за 5 секунд');
        }
        setLoading(false);
      }, 5000);
    }

    // Разблокируем аудио при монтировании
    unlockAudio().catch((err) => {
      console.warn("⚠️ Failed to unlock audio on mount:", err);
    });
  }, []);

  // Озвучка глагола
  const handleAudioClick = async (e: React.MouseEvent, verbInfinitive: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSpeaking) {
      console.log("⏸️ Already speaking, ignoring click");
      return;
    }
    
    setIsSpeaking(true);
    
    try {
      await unlockAudio();
      console.log("✅ Audio unlocked before speaking");
      
      try {
        const { playTextWithOpenAITTS } = await import('../services/openaiTtsService');
        await playTextWithOpenAITTS(verbInfinitive, 'de');
        console.log("✅ OpenAI TTS played successfully");
      } catch (openaiError) {
        console.warn("⚠️ [TTS Engine: OpenAI] Failed, switching to fallback:", openaiError);
        const { playTextWithSpeechSynthesis } = await import('../services/audioService');
        await playTextWithSpeechSynthesis(verbInfinitive, 'de');
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error("❌ Error in handleAudioClick:", error);
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsSpeaking(false);
    }
  };

  const filteredVerbs = Object.keys(verbs);

  const selectedVerbData = selectedVerb ? verbs[selectedVerb] : null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header - зафиксирован сверху */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="w-11 h-11 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all"
              >
                <i className="fas fa-arrow-left text-lg"></i>
              </button>
              <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                <i className="fas fa-book text-lg"></i>
              </div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">База Глаголов</h1>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
              <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">{filteredVerbs.length}</span>
            </div>
          </div>
          
          {/* Информация о полной базе */}
          <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-slate-700 font-bold text-center mb-3">Полная база включает 200 глаголов</p>
            {onShowSpecialOffer && (
              <button
                onClick={onShowSpecialOffer}
                className="w-full py-3 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-xl font-black text-base shadow-lg hover:shadow-xl active:scale-95 transition-all"
              >
                Получить доступ
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Отступ сверху для зафиксированного header */}
      <div className="h-[160px]"></div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 bg-[length:200%_100%] animate-pulse border border-slate-100"></div>
            ))}
          </div>
        ) : filteredVerbs.length === 0 ? (
          <div className="py-32 text-center text-slate-300 font-bold uppercase tracking-widest">
            {Object.keys(verbs).length === 0 ? 'Данные не загружены' : 'Ничего не найдено'}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredVerbs.map(verbKey => {
              const verb = verbs[verbKey];
              
              // Проверка на существование глагола и обязательных полей
              if (!verb || !verb.infinitive) {
                console.warn(`⚠️ Глагол "${verbKey}" имеет неполные данные, пропускаем`);
                return null;
              }
              
              return (
                <div 
                  key={verbKey} 
                  onClick={() => setSelectedVerb(verbKey)}
                  className="bg-white rounded-xl p-3 cursor-pointer border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <div className="text-center">
                    {/* Квадратное изображение ассоциации */}
                    {verb.association?.imageUrl && (
                      <div className="mb-3 rounded-lg overflow-hidden aspect-square">
                        <img 
                          src={verb.association.imageUrl} 
                          alt="Ассоциация"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    {/* Только название глагола */}
                    <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">{verb.infinitive}</h3>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Verb Details Modal */}
      {selectedVerbData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedVerb(null)}
        >
          <div 
            className="bg-white w-full max-w-3xl rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col relative animate-in zoom-in duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-8 md:p-12 overflow-y-auto">
              <div className="flex justify-between items-start mb-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
                      {selectedVerbData.infinitive}
                    </h2>
                    <button
                      onClick={(e) => handleAudioClick(e, selectedVerbData.infinitive)}
                      disabled={isSpeaking}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${
                        isSpeaking 
                          ? 'bg-indigo-200 text-indigo-400 cursor-not-allowed' 
                          : 'bg-indigo-50 text-indigo-600 active:scale-110 hover:bg-indigo-100'
                      }`}
                    >
                      <i className={`fas ${isSpeaking ? 'fa-spinner fa-spin' : 'fa-volume-up'}`}></i>
                    </button>
                  </div>
                  <p className="text-indigo-500 font-mono text-xl mb-2">{selectedVerbData.pronunciation}</p>
                  {selectedVerbData.ablaut && selectedVerbData.ablaut.trim() !== '' && (
                    <div className="flex flex-wrap gap-2">
                      <span className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black">
                        Аблаут: {selectedVerbData.ablaut}
                      </span>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setSelectedVerb(null)}
                  className="p-3 bg-slate-100 text-slate-400 hover:text-slate-900 rounded-full transition-colors"
                >
                  <i className="fas fa-times text-lg"></i>
                </button>
              </div>

              {/* Аблаут формы */}
              {selectedVerbData.ablautForms && (
                <div className="mb-8 p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100">
                  <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-4">Формы глагола</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-black text-slate-500 uppercase">Infinitiv: </span>
                      <span className="text-xl font-black text-slate-800" dangerouslySetInnerHTML={{ __html: selectedVerbData.ablautForms.infinitive || selectedVerbData.infinitive || '' }} />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-500 uppercase">Präteritum: </span>
                      <span className="text-xl font-black text-slate-800" dangerouslySetInnerHTML={{ __html: selectedVerbData.ablautForms.praeteritum || '' }} />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-500 uppercase">Partizip II: </span>
                      <span className="text-xl font-black text-slate-800" dangerouslySetInnerHTML={{ __html: selectedVerbData.ablautForms.partizipII || '' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Значения */}
              <div className="mb-8">
                <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-4">Значения</h3>
                <div className="space-y-4">
                  {(selectedVerbData.meanings && Array.isArray(selectedVerbData.meanings) ? selectedVerbData.meanings : []).map((meaning, index) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-slate-700 font-semibold leading-relaxed" dangerouslySetInnerHTML={{ __html: meaning }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Ассоциация */}
              {selectedVerbData.association && (
                <div className="mb-8">
                  <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-4">Ассоциация</h3>
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
                    {selectedVerbData.association.imageUrl && (
                      <div className="mb-4 rounded-xl overflow-hidden border border-purple-200">
                        <img 
                          src={selectedVerbData.association.imageUrl} 
                          alt="Ассоциация"
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    )}
                    {selectedVerbData.association.text && (
                      <p className="text-slate-700 font-semibold text-lg leading-relaxed text-center">
                        {selectedVerbData.association.text}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Спряжение */}
              {selectedVerbData.conjugation && Array.isArray(selectedVerbData.conjugation) && selectedVerbData.conjugation.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-4">Спряжение (Präsens)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedVerbData.conjugation.map((conj, index) => (
                      <div key={index} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-xs font-black text-slate-500 uppercase">{conj?.person || ''}: </span>
                        <span className="text-lg font-black text-slate-800" dangerouslySetInnerHTML={{ __html: conj?.form || '' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Использование */}
              {selectedVerbData.usage && Array.isArray(selectedVerbData.usage) && selectedVerbData.usage.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-4">Использование</h3>
                  <div className="space-y-3">
                    {selectedVerbData.usage.map((usage, index) => (
                      <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-sm font-black text-indigo-600 mb-1">{usage.construct}</p>
                        <p className="text-slate-600 font-semibold mb-2">{usage.meaning}</p>
                        <p className="text-slate-700 italic">{usage.example}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Особенности */}
              {selectedVerbData.features && Array.isArray(selectedVerbData.features) && selectedVerbData.features.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-4">Особенности</h3>
                  <div className="space-y-4">
                    {selectedVerbData.features.map((feature, index) => (
                      <div key={index} className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                        <h4 className="text-sm font-black text-indigo-700 mb-2">{feature?.title || ''}</h4>
                        <p className="text-slate-700 font-semibold leading-relaxed" dangerouslySetInnerHTML={{ __html: (feature?.text || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Родственные слова */}
              {selectedVerbData.frequentWords && Array.isArray(selectedVerbData.frequentWords) && selectedVerbData.frequentWords.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-4">Родственные слова</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedVerbData.frequentWords.map((word, index) => (
                      <div key={index} className="px-4 py-2 bg-slate-100 rounded-xl">
                        <span className="text-slate-800 font-black">{word.word}</span>
                        <span className="text-slate-500 text-sm ml-2">— {word.translation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssociationsBase;
