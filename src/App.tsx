import React, { useState, useEffect, useMemo } from 'react';
import { AuthService } from './services/authService';
import { TOPICS } from './constants';
import { Topic, ModuleType, User } from './types';
import ModuleCard from './components/ModuleCard';
import VideoAssociations from './components/VideoAssociations';
import BandStory from './components/BandStory';
import Flashcards from './components/Flashcards';
import VerbFormFlashcards from './components/VerbFormFlashcards';
import Mantras from './components/Mantras';
import GapFillExercises from './components/GapFillExercises';
import MantraGapExercises from './components/MantraGapExercises';
import ArticleExercises from './components/ArticleExercises';
import AssociationsBase from './components/AssociationsBase';
import Quiz from './components/Quiz';
import TextGapFill from './components/TextGapFill';
import VerbFormFill from './components/VerbFormFill';
import SpacedRepetitionFlashcards from './components/SpacedRepetitionFlashcards';
import SpecialOffer from './components/SpecialOffer';
import CourseInfo from './components/CourseInfo';
import TrialLessons from './components/TrialLessons';
import TrialExercises from './components/TrialExercises';
import TrialKnowledgeCheck from './components/TrialKnowledgeCheck';
import { unlockAudio } from './services/audioService';
import { AccessControlService } from './services/accessControlService';
// ProgressService удален - используем только localStorage
import { initFirebase } from './config/firebase';
import { SpacedRepetitionSM2 } from './services/spacedRepetitionService';
import { getAllVerbFormCards } from './utils/verbCardsUtils';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleType | null>(null);
  const [topicProgress, setTopicProgress] = useState<Record<string, string[]>>({});
  const [itemProgress, setItemProgress] = useState<Record<string, Record<string, Record<string | number, boolean>>>>({});
  const [showProModal, setShowProModal] = useState(false);
  const [showAssociationsBase, setShowAssociationsBase] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showSpacedRepetition, setShowSpacedRepetition] = useState(false);
  const [spacedRepetitionDueCount, setSpacedRepetitionDueCount] = useState(0);
  const [showSpecialOffer, setShowSpecialOffer] = useState(false);
  const [showCourseInfo, setShowCourseInfo] = useState(false);
  const [showPromoVideoModal, setShowPromoVideoModal] = useState(false);
  const [showTrialLessons, setShowTrialLessons] = useState(false);
  const [showTrialExercises, setShowTrialExercises] = useState(false);
  const [showTrialKnowledgeCheck, setShowTrialKnowledgeCheck] = useState(false);
  const [isTrialLessonMode, setIsTrialLessonMode] = useState(false);
  const [trialLessonMessage, setTrialLessonMessage] = useState<string | undefined>(undefined);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Инициализируем Telegram WebApp если доступен
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.ready();
          window.Telegram.WebApp.expand();
          console.log('✅ Telegram WebApp initialized');
        }
        
        // Инициализируем Firebase
        initFirebase();
        
        // Авторизуем пользователя
        const loggedUser = await AuthService.autoLogin();
        setUser(loggedUser);
        
        // Загружаем прогресс из localStorage
        const savedProgressKey = `promnemo_progress_${loggedUser.telegramId}`;
        const savedProgress = localStorage.getItem(savedProgressKey);
        if (savedProgress) {
          setTopicProgress(JSON.parse(savedProgress));
        }
        
        // Загружаем детальный прогресс по items из localStorage
        const savedItemProgressKey = `promnemo_item_progress_${loggedUser.telegramId}`;
        const savedItemProgress = localStorage.getItem(savedItemProgressKey);
        if (savedItemProgress) {
          setItemProgress(JSON.parse(savedItemProgress));
        }
        
        // Загружаем и обновляем счетчик готовых карточек для интервального повторения
        await updateSpacedRepetitionDueCount(loggedUser);
        
        // Разблокируем аудио после небольшой задержки (для Telegram WebView)
        setTimeout(async () => {
          try {
            await unlockAudio();
            console.log('✅ Audio unlocked on app init');
          } catch (err) {
            console.warn('⚠️ Failed to unlock audio on init:', err);
          }
        }, 500);
      } catch (error) {
        console.error("Critical Auth error:", error);
      } finally {
        setTimeout(() => setIsAuthenticating(false), 1200);
      }
    };
    initApp();
  }, []);

  // Глобальный обработчик клика для разблокировки звука в Telegram
  const handleGlobalClick = () => {
    unlockAudio().catch(() => {});
  };

  const updateProgress = async (topicId: string, moduleId: string) => {
    if (!user) return;
    
    // Обновляем прогресс только в localStorage
    setTopicProgress(prev => {
      const currentTopicModules = prev[topicId] || [];
      if (currentTopicModules.includes(moduleId)) return prev;
      
      const localProgress = {
        ...prev,
        [topicId]: [...currentTopicModules, moduleId]
      };
      const progressKey = `promnemo_progress_${user.telegramId}`;
      localStorage.setItem(progressKey, JSON.stringify(localProgress));
      // Также сохраняем в старом формате для совместимости
      localStorage.setItem('promnemo_progress', JSON.stringify(localProgress));
      return localProgress;
    });
  };

  // Функция для обновления itemProgress после сохранения в компонентах
  const updateItemProgress = async () => {
    if (!user) return;
    try {
      const savedItemProgressKey = `promnemo_item_progress_${user.telegramId}`;
      const savedItemProgress = localStorage.getItem(savedItemProgressKey);
      if (savedItemProgress) {
        setItemProgress(JSON.parse(savedItemProgress));
      }
    } catch (error) {
      console.error('Error updating item progress:', error);
    }
  };

  // Функция для обновления счетчика готовых карточек
  const updateSpacedRepetitionDueCount = async (currentUser?: User) => {
    const userToCheck = currentUser || user;
    if (!userToCheck) return;
    
    try {
      const spacedRepetitionKey = `promnemo_spaced_repetition_${userToCheck.telegramId}`;
      const savedSpacedRepetition = localStorage.getItem(spacedRepetitionKey);
      const spacedRepetition = savedSpacedRepetition ? JSON.parse(savedSpacedRepetition) : {};
      
      const allCards = getAllVerbFormCards();
      
      // Фильтруем: показываем ТОЛЬКО карточки, которые уже добавлены в интервальное повторение
      const cardsAddedToSystem = allCards.filter(card => spacedRepetition[card.id]);
      
      // Определяем карточки, готовые к повторению (только из добавленных в систему)
      const dueCards = SpacedRepetitionSM2.getCardsDueForReview(spacedRepetition, cardsAddedToSystem);
      
      setSpacedRepetitionDueCount(dueCards.length);
    } catch (error) {
      console.error('Error updating spaced repetition due count:', error);
      setSpacedRepetitionDueCount(0);
    }
  };

  // Функция для автоматического добавления карточек при завершении verb-form-flashcards
  // Добавляет карточки из модулей 2-11 (не из модуля 1)
  // ТОЛЬКО из раздела "Карточки глаголов в 3-х формах" (verb-form-flashcards)
  // Карточки из "Базы глаголов" НЕ добавляются
  const addVerbFormCardsToSpacedRepetition = async (topic: Topic) => {
    if (!user || !topic.verbFormCards || topic.verbFormCards.length === 0) return;
    
    // Проверяем, что это модуль 2 или выше (индекс >= 1 в массиве TOPICS)
    const moduleIndex = TOPICS.findIndex(t => t.id === topic.id);
    if (moduleIndex < 1) {
      // Модуль 1 (индекс 0) НЕ добавляется в интервальное повторение
      console.log(`ℹ️ [Spaced Repetition] Пропускаем модуль ${moduleIndex + 1} (${topic.id}) - добавляются только модули 2-11`);
      return;
    }
    
    try {
      const spacedRepetitionKey = `promnemo_spaced_repetition_${user.telegramId}`;
      const savedSpacedRepetition = localStorage.getItem(spacedRepetitionKey);
      const currentSpacedRepetition = savedSpacedRepetition ? JSON.parse(savedSpacedRepetition) : {};
      let addedCount = 0;
      
      // Добавляем карточки из модуля (только verbFormCards из verb-form-flashcards), если их еще нет
      for (const card of topic.verbFormCards) {
        if (!currentSpacedRepetition[card.id]) {
          currentSpacedRepetition[card.id] = SpacedRepetitionSM2.initialize(card.id);
          addedCount++;
        }
      }
      
      // Сохраняем, если были добавлены новые карточки
      if (addedCount > 0) {
        localStorage.setItem(spacedRepetitionKey, JSON.stringify(currentSpacedRepetition));
        console.log(`✅ [Spaced Repetition] Добавлено ${addedCount} карточек из модуля ${moduleIndex + 1} (${topic.id}) в интервальное повторение`);
        // Обновляем счетчик
        await updateSpacedRepetitionDueCount();
      }
    } catch (error) {
      console.error('❌ Error adding verb form cards to spaced repetition:', error);
    }
  };

  const handleBack = () => {
    if (showTrialLessons) {
      // Если мы на странице пробных уроков, возвращаемся на главную
      setShowTrialLessons(false);
      setIsTrialLessonMode(false);
      setTrialLessonMessage(undefined);
      setSelectedTopic(null);
      setActiveModule(null);
    } else if (isTrialLessonMode) {
      // Если это пробный урок, проверяем откуда мы пришли
      setIsTrialLessonMode(false);
      setTrialLessonMessage(undefined);
      
      // Если мы были на странице упражнений (mantras, exercises, verb-forms, verb-form-flashcards, text-gaps), возвращаемся к TrialExercises
      if (activeModule === 'mantras' || activeModule === 'exercises' || activeModule === 'verb-forms' || activeModule === 'verb-form-flashcards' || activeModule === 'text-gaps') {
        setActiveModule(null);
        setShowTrialExercises(true);
      } else {
        // Иначе возвращаемся к пробным урокам
        setSelectedTopic(null);
        setActiveModule(null);
        setShowTrialLessons(true);
      }
    } else if (activeModule) {
      setActiveModule(null);
    } else if (selectedTopic) {
      setSelectedTopic(null);
    }
  };

  // Функция для определения доступных модулей в топике
  const getAvailableModules = (topic: Topic): string[] => {
    const modules: string[] = [];
    
    // Проверяем наличие контента для каждого модуля
    if (topic.videoUrl) modules.push('video');
    if (topic.dialog?.text) modules.push('band-story');
    // Исключаем flashcards, verb-form-flashcards и verb-forms для Модуля 1
    if (topic.words && topic.words.length > 0 && topic.id !== 'house-cleaning') modules.push('flashcards');
    if (topic.verbFormCards && topic.verbFormCards.length > 0 && topic.id !== 'house-cleaning') modules.push('verb-form-flashcards');
    if (topic.mantras && topic.mantras.length > 0) modules.push('mantras');
    if (topic.mantraGapExercises && topic.mantraGapExercises.length > 0) modules.push('exercises');
    if (topic.verbFormExercises && topic.verbFormExercises.length > 0 && topic.id !== 'house-cleaning') modules.push('verb-forms');
    if (topic.textGapExercises && topic.textGapExercises.length > 0) modules.push('text-gaps');
    if (topic.exercises && topic.exercises.length > 0) modules.push('gap-fill');
    
    return modules;
  };

  // Определяем веса разделов (сумма должна быть 100)
  const getSectionWeights = (topicId: string): Record<string, number> => {
    const topic = TOPICS.find(t => t.id === topicId);
    if (!topic) return {};
    
    const weights: Record<string, number> = {};
    const availableModules = getAvailableModules(topic);
    const totalModules = availableModules.length;
    
    if (totalModules === 0) return {};
    
    // Равномерное распределение весов, но exercises имеет особый расчет
    const baseWeight = 100 / totalModules;
    
    availableModules.forEach(moduleId => {
      if (moduleId === 'exercises') {
        // Для exercises вес будет умножен на % правильных
        weights[moduleId] = baseWeight;
      } else {
        // Для остальных модулей: 1 если завершен, 0 если нет
        weights[moduleId] = baseWeight;
      }
    });
    
    return weights;
  };

  const getProgressPercentage = (topicId: string) => {
    const topic = TOPICS.find(t => t.id === topicId);
    if (!topic) return 0;
    
    const availableModules = getAvailableModules(topic);
    if (availableModules.length === 0) return 0;
    
    const weights = getSectionWeights(topicId);
    let totalProgress = 0;
    
    // Проверяем, это модуль 3+ (по индексу в TOPICS)
    const moduleIndex = TOPICS.findIndex(t => t.id === topicId);
    const isModule3Plus = moduleIndex >= 2;
    
    availableModules.forEach(moduleId => {
      if (moduleId === 'exercises') {
        // Проверяем, отмечен ли раздел как пройденный в progress (фиксирован навсегда)
        const isCompleted = topicProgress[topicId]?.includes(moduleId);
        
        if (isCompleted) {
          // Раздел фиксирован как пройденный (все упражнения пройдены правильно) - считаем как 100%
          totalProgress += weights[moduleId] || 0;
        } else {
          // Раздел не фиксирован - считаем временный прогресс по проценту правильных ответов
          // Прогресс сохраняется в itemProgress, но раздел не отмечается как пройденный
          const moduleProgress = itemProgress[topicId]?.[moduleId] || {};
          const totalItems = topic.mantraGapExercises?.length || 0;
          
          if (isModule3Plus && totalItems > 0) {
            // Для модулей 3+: считаем прогресс отдельно по каждому времени (Präsens, Präteritum, Partizip II)
            const praesensCorrect = Object.entries(moduleProgress).filter(([id, value]) => id.includes('praesens') && value === true).length;
            const praeteritumCorrect = Object.entries(moduleProgress).filter(([id, value]) => id.includes('praeteritum') && value === true).length;
            const partizip2Correct = Object.entries(moduleProgress).filter(([id, value]) => id.includes('partizip2') && value === true).length;
            
            // Каждое время дает 1/3 от веса раздела
            const praesensPercentage = (praesensCorrect / totalItems) * 100;
            const praeteritumPercentage = (praeteritumCorrect / totalItems) * 100;
            const partizip2Percentage = (partizip2Correct / totalItems) * 100;
            
            const sectionWeight = weights[moduleId] || 0;
            totalProgress += (sectionWeight / 3) * (praesensPercentage / 100);
            totalProgress += (sectionWeight / 3) * (praeteritumPercentage / 100);
            totalProgress += (sectionWeight / 3) * (partizip2Percentage / 100);
          } else {
            // Для модулей 1-2: общий % правильных ответов
            const correctCount = Object.values(moduleProgress).filter(Boolean).length;
            const percentage = totalItems > 0 ? (correctCount / totalItems) * 100 : 0;
            totalProgress += (weights[moduleId] || 0) * (percentage / 100);
          }
        }
      } else if (moduleId === 'text-gaps') {
        // Проверяем, отмечен ли раздел как пройденный в progress (фиксирован навсегда)
        const isCompleted = topicProgress[topicId]?.includes(moduleId);
        
        if (isCompleted) {
          // Раздел фиксирован как пройденный (все упражнения пройдены правильно) - считаем как 100%
          totalProgress += weights[moduleId] || 0;
        } else {
          // Раздел не фиксирован - считаем временный прогресс по проценту правильных ответов
          const moduleProgress = itemProgress[topicId]?.[moduleId] || {};
          const totalItems = topic.textGapExercises?.length || 0;
          
          // Общий % правильных ответов
          const correctCount = Object.values(moduleProgress).filter(Boolean).length;
          const percentage = totalItems > 0 ? (correctCount / totalItems) * 100 : 0;
          totalProgress += (weights[moduleId] || 0) * (percentage / 100);
        }
      } else if (moduleId === 'gap-fill') {
        // Проверяем, отмечен ли раздел как пройденный в progress (фиксирован навсегда)
        const isCompleted = topicProgress[topicId]?.includes(moduleId);
        
        if (isCompleted) {
          // Раздел фиксирован как пройденный (все упражнения пройдены правильно) - считаем как 100%
          totalProgress += weights[moduleId] || 0;
        } else {
          // Раздел не фиксирован - считаем временный прогресс по проценту правильных ответов
          const moduleProgress = itemProgress[topicId]?.[moduleId] || {};
          const totalItems = topic.exercises?.length || 0;
          
          // Общий % правильных ответов
          const correctCount = Object.values(moduleProgress).filter(Boolean).length;
          const percentage = totalItems > 0 ? (correctCount / totalItems) * 100 : 0;
          totalProgress += (weights[moduleId] || 0) * (percentage / 100);
        }
      } else if (moduleId === 'mantras' && isModule3Plus) {
        // Для модулей 3+: мантры тоже делятся по временам (если есть mantraGapExercises с временами)
        // Пока считаем как обычно (завершено/не завершено)
        const isCompleted = topicProgress[topicId]?.includes(moduleId);
        totalProgress += isCompleted ? (weights[moduleId] || 0) : 0;
      } else {
        // Для остальных модулей: вес если завершен, 0 если нет
        const isCompleted = topicProgress[topicId]?.includes(moduleId);
        totalProgress += isCompleted ? (weights[moduleId] || 0) : 0;
      }
    });
    
    return Math.round(totalProgress);
  };

  // Фильтруем темы по доступу пользователя
  const availableTopics = useMemo(() => {
    return AccessControlService.filterTopicsByAccess(user, TOPICS);
  }, [user]);

  if (isAuthenticating || !user) {
    return (
      <div 
        className="h-full flex flex-col items-center justify-center p-6 text-white overflow-hidden relative"
        style={{
          backgroundImage: 'url(/marathon-knight.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-5xl font-black mb-4 tracking-tight">PRO Starke Verben</h1>
          <p className="text-white font-bold text-xl uppercase tracking-widest">Загрузка...</p>
        </div>
      </div>
    );
  }

  const mainPadding = 'px-6';

  return (
    <div className="h-full flex flex-col bg-gray-50 relative" onClick={handleGlobalClick}>
      <main className={`flex-1 overflow-y-auto ${mainPadding} pt-6 pb-32 scroll-smooth relative`}>
        {showSpecialOffer ? (
          <SpecialOffer onBack={() => setShowSpecialOffer(false)} />
        ) : showCourseInfo ? (
          <CourseInfo onBack={() => setShowCourseInfo(false)} />
        ) : showTrialLessons ? (
          <TrialLessons 
            onBack={() => {
              setShowTrialLessons(false);
              setIsTrialLessonMode(false);
              setTrialLessonMessage(undefined);
            }} 
            onStartModule={(topic, moduleType, message) => {
              setShowTrialLessons(false);
              setIsTrialLessonMode(true);
              setTrialLessonMessage(message);
              setSelectedTopic(topic);
              setActiveModule(moduleType);
            }}
            onReturnToLessons={() => {
              setIsTrialLessonMode(false);
              setTrialLessonMessage(undefined);
              setSelectedTopic(null);
              setActiveModule(null);
              setShowTrialLessons(true);
            }}
            onShowKnowledgeCheck={() => {
              setShowTrialLessons(false);
              setShowTrialKnowledgeCheck(true);
            }}
            onShowSpecialOffer={() => {
              setShowTrialLessons(false);
              setShowSpecialOffer(true);
            }}
            onStartTrialExercises={() => {
              const module3 = TOPICS.find(t => t.id === 'module-3');
              if (module3) {
                setShowTrialLessons(false);
                setShowTrialExercises(true);
                setSelectedTopic(module3);
                setIsTrialLessonMode(true);
              }
            }}
          />
        ) : showTrialKnowledgeCheck ? (
          (() => {
            const module3 = TOPICS.find(t => t.id === 'module-3');
            if (!module3) return null;
            return (
              <TrialKnowledgeCheck
                topic={module3}
                onBack={() => {
                  setShowTrialKnowledgeCheck(false);
                  setShowTrialLessons(true);
                }}
                onShowSpecialOffer={() => {
                  setShowTrialKnowledgeCheck(false);
                  setShowSpecialOffer(true);
                }}
                onShowCourseInfo={() => {
                  setShowTrialKnowledgeCheck(false);
                  setShowCourseInfo(true);
                }}
              />
            );
          })()
        ) : showTrialExercises ? (
          (() => {
            // Убеждаемся, что selectedTopic установлен
            const topic = selectedTopic || TOPICS.find(t => t.id === 'module-3');
            if (!topic) {
              // Если topic не найден, возвращаемся к пробным урокам
              setShowTrialExercises(false);
              setShowTrialLessons(true);
              return null;
            }
            return (
              <TrialExercises
                topic={topic}
                onBack={() => {
                  setShowTrialExercises(false);
                  setIsTrialLessonMode(false);
                  setTrialLessonMessage(undefined);
                  setSelectedTopic(null);
                  setActiveModule(null);
                  setShowTrialLessons(true);
                }}
                onStartExercise={(moduleType) => {
                  setShowTrialExercises(false);
                  setIsTrialLessonMode(true);
                  setTrialLessonMessage(undefined);
                  const module3 = TOPICS.find(t => t.id === 'module-3');
                  if (module3) {
                    setSelectedTopic(module3);
                  }
                  setActiveModule(moduleType);
                }}
              />
            );
          })()
        ) : showQuiz ? (
          <Quiz user={user} onBack={() => setShowQuiz(false)} />
        ) : showSpacedRepetition ? (
          user && <SpacedRepetitionFlashcards 
            user={user} 
            onComplete={async () => {
              setShowSpacedRepetition(false);
              await updateSpacedRepetitionDueCount();
            }}
            onDueCountUpdate={(count) => {
              setSpacedRepetitionDueCount(count);
            }}
          />
        ) : showAssociationsBase ? (
          <AssociationsBase 
            onBack={() => setShowAssociationsBase(false)} 
            onShowSpecialOffer={() => {
              setShowAssociationsBase(false);
              setShowSpecialOffer(true);
            }}
          />
        ) : !selectedTopic ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700 relative">
            {/* Фоновое изображение с полупрозрачностью - только на главном экране */}
            <div 
              className="fixed inset-0 z-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: 'url(/marathon-knight.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            />
            <div className="relative z-10">
            <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden mb-6">
               <div className="relative z-10">
                 <h2 className="text-3xl font-black mb-2 leading-tight">Hallo, {user.name.split(' ')[0]}!</h2>
                 <p className="opacity-90 text-lg font-medium leading-relaxed mb-4">
                   Приветствую тебя в курсе 180+ Сильных глаголов! Тебя ждут 11 Модулей (22 видео урока с ассоциациями, упражнениями и базой сильных глаголов) с помощью которых ты запомнишь все глаголы в 3-х формах.
                 </p>
                 <button
                   onClick={() => setShowPromoVideoModal(true)}
                   className="w-full py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-black text-base shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 border border-white/30"
                 >
                   <i className="fas fa-play-circle text-xl"></i>
                   Как выглядит курс изнутри
                 </button>
               </div>
            </div>

            {/* Блок про пробные уроки */}
            <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-[2rem] p-6 border-2 border-orange-200 shadow-lg mb-6">
              <h3 className="text-xl font-black text-orange-700 mb-4">В Пробных уроках ты узнаешь</h3>
              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-3">
                  <span className="text-orange-600 text-lg font-black">1️⃣</span>
                  <p className="text-gray-700 flex-1">
                    как легко и быстро запоминать глаголы с помощью ассоциаций ✨
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-orange-600 text-lg font-black">2️⃣</span>
                  <p className="text-gray-700 flex-1">
                    как запоминать 3 формы глагола с помощью 🧠 мнемотехник
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-orange-600 text-lg font-black">3️⃣</span>
                  <p className="text-gray-700 flex-1">
                    запомнишь ряд полезных сильных глаголов и пройдешь Квиз
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTrialLessons(true);
                }}
                className="w-full py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white rounded-xl font-black text-base shadow-lg hover:shadow-xl active:scale-95 transition-all"
              >
                Вперед к пробным урокам
              </button>
            </div>

            {/* Меню основного курса */}
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-black text-blue-600">Меню основного курса</h2>
            </div>

            {/* Блок базы глаголов, квиза и интервального повторения */}
            <div className="grid grid-cols-3 gap-3 mb-12">
              <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 rounded-2xl p-1.5 shadow-xl">
                <button
                  onClick={() => setShowAssociationsBase(true)}
                  className="w-full bg-white text-purple-600 px-4 py-4 rounded-xl font-black text-base sm:text-lg hover:shadow-lg active:scale-95 transition-all"
                >
                  БАЗА
                </button>
              </div>
              <div className="bg-gradient-to-br from-indigo-500 via-blue-500 to-sky-400 rounded-2xl p-1.5 shadow-xl relative opacity-75">
                <button
                  onClick={() => setShowProModal(true)}
                  className="w-full bg-white/80 text-blue-600 px-4 py-4 rounded-xl font-black text-base sm:text-lg hover:shadow-lg active:scale-95 transition-all relative cursor-not-allowed"
                >
                  <i className="fas fa-lock text-blue-400 mr-2"></i>
                  КВИЗ
                </button>
              </div>
              <div className="bg-gradient-to-br from-green-500 via-emerald-400 to-lime-400 rounded-2xl p-1.5 shadow-xl relative opacity-75">
                <button
                  onClick={() => setShowProModal(true)}
                  className="w-full bg-white/80 text-green-600 px-4 py-4 rounded-xl font-black text-base sm:text-lg hover:shadow-lg active:scale-95 transition-all relative cursor-not-allowed"
                >
                  <i className="fas fa-lock text-green-400 mr-2"></i>
                  ПОВТОР
                </button>
              </div>
            </div>
            
            <div className="space-y-6 mt-12">
              {availableTopics.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-md text-center">
                  <p className="text-gray-600 font-bold">У вас нет доступа ни к одной теме. Обратитесь к администратору.</p>
                </div>
              ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6">
                {availableTopics.map((topic, index) => {
                  const progress = getProgressPercentage(topic.id);
                  const isAvailable = !topic.availableFrom || new Date(topic.availableFrom) <= new Date();
                  const availableDate = topic.availableFrom ? new Date(topic.availableFrom).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null;
                  const moduleNumber = index + 1;
                  // Все модули заблокированы - доступны только в полном курсе
                  const isLocked = true;
                  
                  const radius = 35;
                  const circumference = 2 * Math.PI * radius;
                  const offset = circumference - (progress / 100) * circumference;
                  
                  return (
                    <div 
                      key={topic.id}
                      onClick={() => {
                        if (isLocked) {
                          // Первые 6 модулей — ссылка на оплату 6 модулей
                          if (moduleNumber <= 6) {
                            window.open('https://t.me/de_starke_verben_bot?start=699813f65029210aa5020570', '_blank');
                          } else {
                            setShowProModal(true);
                          }
                          return;
                        }
                        if (isAvailable) {
                          if (topic.id === 'house-cleaning') {
                            console.log('🏠 Setting house-cleaning topic:', {
                              id: topic.id,
                              hasDialog: !!topic.dialog,
                              imageUrl: topic.dialog?.imageUrl,
                              textLength: topic.dialog?.text?.length,
                              audioUrl: topic.dialog?.audioUrl,
                              quizLength: topic.quiz?.length
                            });
                          }
                          setSelectedTopic(topic);
                        } else {
                          setShowProModal(true);
                        }
                      }}
                      className={`group relative flex flex-col items-center ${
                        isLocked ? 'opacity-50 cursor-not-allowed' : isAvailable ? 'cursor-pointer hover:scale-105 transition-transform' : 'opacity-60 cursor-pointer'
                      }`}
                    >
                      <div className="relative w-28 h-28">
                        {/* Центральный круг с номером модуля */}
                        <div className={`absolute inset-0 rounded-full overflow-hidden shadow-lg z-0 ${isAvailable && !isLocked ? 'group-hover:shadow-xl' : ''} ${!isAvailable || isLocked ? 'opacity-60' : ''} ${topic.color || 'bg-gray-200'}`}>
                          {topic.imageUrl ? (
                            <>
                              <img 
                                src={topic.imageUrl} 
                                alt={topic.title}
                                className="w-full h-full object-cover"
                              />
                              {/* Номер модуля поверх изображения */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white text-2xl font-black drop-shadow-lg">{moduleNumber}</span>
                              </div>
                            </>
                          ) : (
                            <div className={`w-full h-full ${topic.color || 'bg-gray-200'} flex items-center justify-center`}>
                              <span className="text-white text-2xl font-black">{moduleNumber}</span>
                            </div>
                          )}
                          {(!isAvailable || isLocked) && (
                            <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center">
                              {/* Замочек в углу, не перекрывает номер */}
                              <div className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center">
                                <i className="fas fa-lock text-white text-xs"></i>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Круговой прогресс - поверх изображения */}
                        {isAvailable && !isLocked && (
                          <svg className="transform -rotate-90 w-28 h-28 absolute inset-0 z-10 pointer-events-none" viewBox="0 0 80 80">
                            {/* Фоновый круг */}
                            <circle
                              cx="40"
                              cy="40"
                              r={radius}
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="6"
                            />
                            {/* Прогресс - показываем только если > 0 */}
                            {progress > 0 && (
                              <circle
                                cx="40"
                                cy="40"
                                r={radius}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="6"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                className="transition-all duration-500"
                              />
                            )}
                          </svg>
                        )}
                      </div>
                      
                      {/* Название модуля */}
                      <h3 className={`mt-3 text-center text-sm font-black leading-tight px-1 ${
                        isLocked ? 'text-gray-400' : 'text-gray-800'
                      }`}>
                        {topic.displayName || topic.title}
                      </h3>
                    </div>
                  );
                })}
              </div>
              )}
              
            </div>
            </div>
          </div>
        ) : !activeModule ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 px-2">
            {(() => {
              // Проверяем доступ к теме
              if (!AccessControlService.canAccessTopic(user, selectedTopic.id)) {
                return (
                  <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-md text-center">
                    <div className="mb-6">
                      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-lock text-red-500 text-3xl"></i>
                      </div>
                      <h2 className="text-2xl font-black text-gray-800 mb-2">Доступ ограничен</h2>
                      <p className="text-gray-600 font-bold">У вас нет доступа к этому модулю.</p>
                      <p className="text-gray-500 text-sm mt-2">Обратитесь к администратору для получения доступа.</p>
                    </div>
                    <button
                      onClick={() => setSelectedTopic(null)}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-base shadow-lg hover:shadow-xl active:scale-95 transition-all"
                    >
                      Вернуться к списку модулей
                    </button>
                  </div>
                );
              }
              
              const isTopicAvailable = !selectedTopic.availableFrom || new Date(selectedTopic.availableFrom) <= new Date();
              
              if (!isTopicAvailable) {
                const availableDate = selectedTopic.availableFrom ? new Date(selectedTopic.availableFrom).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null;
                return (
                  <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-md text-center">
                    <div className={`w-20 h-20 ${selectedTopic.color} rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg mx-auto mb-6`}>
                      <i className={`fas ${selectedTopic.icon}`}></i>
                    </div>
                    <h2 className="text-2xl font-black text-gray-800 mb-4">{selectedTopic.title}</h2>
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <i className="fas fa-lock text-gray-400 text-4xl mb-4"></i>
                      <p className="text-lg font-bold text-gray-600 mb-2">Модуль пока недоступен</p>
                      <p className="text-sm font-medium text-gray-500">
                        Доступен с {availableDate}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedTopic(null)}
                      className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition-colors"
                    >
                      Вернуться к модулям
                    </button>
                  </div>
                );
              }
              
              return (
                <>
                  <div className="flex items-center gap-5">
                     <div className={`w-16 h-16 ${selectedTopic.color} rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg`}>
                        <i className={`fas ${selectedTopic.icon}`}></i>
                     </div>
                     <div>
                       <div className="flex items-center gap-3 mb-1">
                         <h2 className="text-3xl font-black text-gray-800 leading-tight">{selectedTopic.title}</h2>
                         {selectedTopic.level && (
                           <span className="px-4 py-2 bg-blue-600 text-white rounded-xl text-base font-black uppercase tracking-wider">
                             {selectedTopic.level}
                           </span>
                         )}
                       </div>
                     </div>
                  </div>

            <div className="grid grid-cols-2 gap-4">
              <ModuleCard 
                title={selectedTopic.id === 'house-cleaning' ? 'Теория глаголов' : selectedTopic.id === 'job-interview' ? 'Модальные глаголы' : 'Ассоциации'} icon="fa-video" colorClass="bg-red-500" 
                isCompleted={topicProgress[selectedTopic.id]?.includes('video')}
                isLocked={false}
                onClick={() => {
                  setActiveModule('video');
                  updateProgress(selectedTopic.id, 'video');
                }} 
              />
              {selectedTopic.id !== 'house-cleaning' && selectedTopic.id !== 'job-interview' && (
                <ModuleCard 
                  title="Заполнение слов" icon="fa-keyboard" colorClass="bg-pink-500" 
                  isCompleted={topicProgress[selectedTopic.id]?.includes('verb-forms')}
                  isLocked={false}
                  onClick={() => {
                    setActiveModule('verb-forms');
                  }} 
                />
              )}
              {selectedTopic.id !== 'house-cleaning' && selectedTopic.id !== 'job-interview' && (
                <ModuleCard 
                  title="Карточки" icon="fa-clone" colorClass="bg-green-500" 
                  isCompleted={topicProgress[selectedTopic.id]?.includes('flashcards')}
                  isLocked={false}
                  onClick={() => {
                    setActiveModule('flashcards');
                  }} 
                />
              )}
              <ModuleCard 
                title="Пробелы в тексте" icon="fa-edit" colorClass="bg-indigo-500" 
                isCompleted={topicProgress[selectedTopic.id]?.includes('text-gaps')}
                isLocked={false}
                onClick={() => {
                  setActiveModule('text-gaps');
                }} 
              />
              <ModuleCard 
                title={selectedTopic.id === 'house-cleaning' ? 'Техника ассоциаций' : selectedTopic.id === 'job-interview' ? 'Техники для запоминания банд' : 'История Банды'} icon="fa-video" colorClass="bg-blue-500" 
                isCompleted={topicProgress[selectedTopic.id]?.includes('band-story')}
                isLocked={false}
                onClick={() => {
                  setActiveModule('band-story');
                  updateProgress(selectedTopic.id, 'band-story');
                }} 
              />
              <ModuleCard 
                title="Мантры" icon="fa-comments" colorClass="bg-purple-500" 
                isCompleted={topicProgress[selectedTopic.id]?.includes('mantras')}
                isLocked={false}
                onClick={() => {
                  setActiveModule('mantras');
                }} 
              />
              {selectedTopic.id !== 'house-cleaning' && (
                <ModuleCard 
                  title={selectedTopic.id === 'job-interview' ? 'Карточки для повторения' : 'Карточки Глаголы в 3-х формах'} icon="fa-clone" colorClass="bg-teal-500" 
                  isCompleted={topicProgress[selectedTopic.id]?.includes('verb-form-flashcards')}
                  isLocked={false}
                  onClick={() => {
                    setActiveModule('verb-form-flashcards');
                  }} 
                />
              )}
              <ModuleCard 
                title="Пробелы в мантрах" icon="fa-pencil-alt" colorClass="bg-orange-500" 
                isCompleted={topicProgress[selectedTopic.id]?.includes('exercises')}
                isLocked={false}
                onClick={() => {
                  setActiveModule('exercises');
                }} 
              />
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <div className="w-full flex justify-between items-end mb-4">
                <h4 className="text-xl font-black text-gray-800">Прогресс модуля</h4>
                <span className="text-sm font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full">
                  {getProgressPercentage(selectedTopic.id)}%
                </span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-indigo-500 h-full transition-all duration-1000" 
                  style={{ width: `${getProgressPercentage(selectedTopic.id)}%` }}
                ></div>
              </div>
            </div>
                </>
              );
            })()}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {(() => {
              const isTopicAvailable = !selectedTopic.availableFrom || new Date(selectedTopic.availableFrom) <= new Date();
              
              if (!isTopicAvailable) {
                const availableDate = selectedTopic.availableFrom ? new Date(selectedTopic.availableFrom).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null;
                return (
                  <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-md text-center">
                    <div className={`w-20 h-20 ${selectedTopic.color} rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg mx-auto mb-6`}>
                      <i className={`fas ${selectedTopic.icon}`}></i>
                    </div>
                    <h2 className="text-2xl font-black text-gray-800 mb-4">{selectedTopic.title}</h2>
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <i className="fas fa-lock text-gray-400 text-4xl mb-4"></i>
                      <p className="text-lg font-bold text-gray-600 mb-2">Модуль пока недоступен</p>
                      <p className="text-sm font-medium text-gray-500">
                        Доступен с {availableDate}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTopic(null);
                        setActiveModule(null);
                      }}
                      className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition-colors"
                    >
                      Вернуться к модулям
                    </button>
                  </div>
                );
              }
              
              return (
                <>
                  {activeModule === 'video' && <VideoAssociations topic={selectedTopic} />}
                  {activeModule === 'band-story' && <BandStory topic={selectedTopic} />}
                  {activeModule === 'flashcards' && <Flashcards 
                    topic={selectedTopic} 
                    onComplete={() => {
                      updateProgress(selectedTopic.id, 'flashcards');
                    }}
                    isTrialLesson={isTrialLessonMode && selectedTopic?.id === 'module-3'}
                    trialLessonMessage={trialLessonMessage}
                    onNextLesson={() => {
                      // Переход ко второму уроку
                      setIsTrialLessonMode(false);
                      setTrialLessonMessage(undefined);
                      setSelectedTopic(null);
                      setActiveModule(null);
                      // Устанавливаем шаг 2 в localStorage для отображения прогресса
                      localStorage.setItem('trialLessonStep', '2');
                      setShowTrialLessons(true);
                    }}
                  />}
                  {activeModule === 'mantras' && <Mantras topic={selectedTopic} onComplete={() => updateProgress(selectedTopic.id, 'mantras')} isTrialLesson={isTrialLessonMode && selectedTopic?.id === 'module-3'} />}
                  {activeModule === 'exercises' && <MantraGapExercises topic={selectedTopic} user={user || undefined} onComplete={() => updateProgress(selectedTopic.id, 'exercises')} onItemProgressUpdate={updateItemProgress} isTrialLesson={isTrialLessonMode && selectedTopic?.id === 'module-3'} />}
                  {activeModule === 'verb-forms' && <VerbFormFill topic={selectedTopic} user={user || undefined} onComplete={() => updateProgress(selectedTopic.id, 'verb-forms')} isTrialLesson={isTrialLessonMode && selectedTopic?.id === 'module-3'} />}
                  {activeModule === 'verb-form-flashcards' && <VerbFormFlashcards 
                    topic={selectedTopic} 
                    onComplete={async () => {
                      await updateProgress(selectedTopic.id, 'verb-form-flashcards');
                      // Автоматически добавляем карточки в интервальное повторение
                      await addVerbFormCardsToSpacedRepetition(selectedTopic);
                    }}
                    isTrialLesson={isTrialLessonMode && selectedTopic?.id === 'module-3'}
                    trialLessonMessage={trialLessonMessage}
                    onNextLesson={() => {
                      // После карточек 3 формы возвращаемся к списку упражнений
                      setTrialLessonMessage(undefined);
                      const module3 = TOPICS.find(t => t.id === 'module-3');
                      if (module3) {
                        setSelectedTopic(module3);
                      }
                      setActiveModule(null);
                      setShowTrialExercises(true);
                    }}
                  />}
                  {activeModule === 'text-gaps' && <TextGapFill topic={selectedTopic} user={user || undefined} onComplete={() => updateProgress(selectedTopic.id, 'text-gaps')} onItemProgressUpdate={updateItemProgress} isTrialLesson={isTrialLessonMode && selectedTopic?.id === 'module-3'} />}
                  {activeModule === 'gap-fill' && <GapFillExercises topic={selectedTopic} user={user || undefined} onComplete={() => updateProgress(selectedTopic.id, 'gap-fill')} onItemProgressUpdate={updateItemProgress} />}
                </>
              );
            })()}
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 px-6 py-5 grid grid-cols-3 gap-2 items-center z-50 shadow-2xl">
        <div className="flex items-center gap-3 min-w-0">
          {(selectedTopic || activeModule || showTrialLessons) && (
            <button 
              onClick={handleBack} 
              className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-blue-600 text-white rounded-2xl active:scale-90 transition-all shadow-xl"
            >
              <i className="fas fa-arrow-left text-xl"></i>
            </button>
          )}
          <h1 className="text-sm sm:text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 uppercase tracking-tight truncate">
            {showSpecialOffer ? 'Спецпредложение' : showCourseInfo ? 'Курс' : showTrialLessons ? 'Пробные Уроки' : showTrialKnowledgeCheck ? 'Проверка знаний' : showAssociationsBase ? 'База глаголов' : activeModule ? (activeModule === 'video' ? (selectedTopic?.id === 'house-cleaning' ? 'Теория глаголов' : selectedTopic?.id === 'job-interview' ? 'Модальные глаголы' : 'Ассоциации') : activeModule === 'band-story' ? (selectedTopic?.id === 'house-cleaning' ? 'Техника ассоциаций' : selectedTopic?.id === 'job-interview' ? 'Техники для запоминания банд' : 'История Банды') : activeModule === 'flashcards' ? 'Карточки' : activeModule === 'verb-form-flashcards' ? 'Карточки Глаголы в 3-х формах' : activeModule === 'mantras' ? 'Мантры' : activeModule === 'exercises' ? 'Пробелы в мантрах' : activeModule === 'verb-forms' ? 'Заполнение слов' : activeModule === 'text-gaps' ? 'Пробелы в тексте' : '') : selectedTopic ? 'Модули' : 'PRO Starke Verben'}
          </h1>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => {
              setShowSpecialOffer(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-xl font-black text-sm shadow-lg active:scale-95 transition-all whitespace-nowrap"
          >
            СПЕЦПРЕДЛОЖЕНИЕ
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => {
              setShowSpecialOffer(false);
              setShowCourseInfo(false);
              setShowTrialLessons(false);
              setShowTrialKnowledgeCheck(false);
              setShowAssociationsBase(false);
              setSelectedTopic(null);
              setActiveModule(null);
              setIsTrialLessonMode(false);
              setTrialLessonMessage(undefined);
            }}
            className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center active:scale-90 transition-all shadow-xl"
          >
            <i className="fas fa-home text-lg"></i>
          </button>
        </div>
      </footer>

      {/* Модалка с промо-видео */}
      {showPromoVideoModal && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowPromoVideoModal(false)}
        >
          <div 
            className="relative w-full max-w-sm mx-auto aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPromoVideoModal(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-black/50 text-white rounded-full hover:bg-black/70 active:scale-95 transition-all"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
            <iframe
              src="https://kinescope.io/embed/rmjHvw3NDUwz1fx2W6RG6A?autoplay=1"
              className="w-full h-full"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              title="Как выглядит курс изнутри"
            />
          </div>
        </div>
      )}

      {/* Модалка для недоступных тем */}
      {showProModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowProModal(false)}
        >
          <div 
            className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-gray-100 animate-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowProModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg mx-auto mb-6">
                <i className="fas fa-crown"></i>
              </div>
              <h3 className="text-2xl font-black text-gray-800 mb-4">Доступно в полном курсе</h3>
              <p className="text-gray-600 mb-6 text-sm">Квиз и все модули доступны только для участников полного курса PRO Starke Verben</p>
              <button
                onClick={() => {
                  setShowProModal(false);
                  setShowSpecialOffer(true);
                }}
                className="w-full py-4 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-xl font-black text-base shadow-lg active:scale-95 transition-all"
              >
                Твое спецпредложение
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;