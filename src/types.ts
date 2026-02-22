
export interface User {
  id: string;
  telegramId: string;
  name: string;
}

export interface Word {
  id: string; // Уникальный ID для слова
  de: string;
  ru: string;
  image?: string;
  audioDe?: string; // Путь к MP3 файлу для немецкого произношения
  audioRu?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface GapFillExercise {
  sentence_ru: string; // Точный перевод предложения на русский
  sentence: string; // Немецкое предложение с пропуском ____
  options: string[]; // 4 варианта: правильный, фонетически похожий, семантически возможный, дистрактор
  explanation: string; // Краткое объяснение значения или управления слова
}

export interface MantraGapExercise {
  id: string; // Уникальный ID упражнения
  ru: string; // Русский перевод предложения
  sentence_praesens?: string; // Немецкое предложение в Präsens с пропуском ____ (опционально)
  sentence_praeteritum?: string; // Немецкое предложение в Präteritum с пропуском ____ (опционально)
  sentence_partizip2?: string; // Немецкое предложение в Partizip 2 с пропуском ____ (опционально)
  options?: string[]; // Варианты ответов (опционально, для обратной совместимости)
  correct_praesens?: string; // Правильный ответ для Präsens (опционально)
  correct_praeteritum?: string; // Правильный ответ для Präteritum (опционально)
  correct_partizip2?: string; // Правильный ответ для Partizip 2 (опционально)
  options_praesens?: string[]; // Варианты ответов для Präsens (опционально)
  options_praeteritum?: string[]; // Варианты ответов для Präteritum (опционально)
  options_partizip2?: string[]; // Варианты ответов для Partizip 2 (опционально)
  explanation?: string; // Объяснение после выбора ответа (опционально)
}

export interface ArticleExercise {
  word: string; // Немецкое слово без артикля
  translation: string; // Перевод на русский
  correctArticle: 'der' | 'die' | 'das'; // Правильный артикль
  explanation: string; // Краткое объяснение рода существительного
}

export interface TextGapExercise {
  id: string; // Уникальный ID упражнения
  indicator: string; // Название/индикатор упражнения
  intro: string; // Инструкция на русском
  html: string; // HTML текст с пробелами (span.dropzone с data-answer и data-hint)
  words: string[]; // Массив слов для заполнения пробелов
}

export interface VerbFormExercise {
  id: string; // Уникальный ID упражнения
  ru: string; // Русский перевод
  praesens: string; // Präsens форма (например: "blasen")
  praeteritum: string; // Präteritum форма (например: "blies")
  auxillary: string; // Вспомогательный глагол (например: "hat" или "ist")
  partizip2: string; // Partizip 2 форма (например: "geblasen")
}

export interface VerbFormCard {
  id: string; // Уникальный ID карточки
  ru: string; // Русский перевод глагола
  praesens: string; // Präsens форма (инфинитив)
  praeteritum: string; // Präteritum форма
  auxillary: string; // Вспомогательный глагол (hat/ist)
  partizip2: string; // Partizip 2 форма
  /** Форма 3-го лица Präsens, напр. "er/sie/es fliegt". Для карточек: инфинитив + er/sie/es. */
  erSieEs?: string;
}

export interface Mantra {
  id: string; // Уникальный ID для мантры
  de: string; // Präsens форма
  ru: string; // Русский перевод в настоящем времени
  audioDe?: string; // Путь к MP3 файлу для немецкого произношения
  praeteritum?: string; // Präteritum форма (опционально)
  ru_praeteritum?: string; // Русский перевод в прошедшем времени для Präteritum (опционально)
  partizip2?: string; // Partizip 2 форма (опционально)
  ru_partizip2?: string; // Русский перевод в прошедшем времени для Partizip II (опционально)
}

export interface Lesson {
  title: string; // Заголовок урока (например, "Урок 3.1 Ряд A-U-A")
  videoUrl?: string; // URL видео для урока (опционально)
  words: Word[]; // Словарь урока
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  videoUrl: string;
  locked?: boolean; // Заблокирован ли модуль для просмотра
  imageUrl?: string; // Фото модуля для отображения на главном экране
  displayName?: string; // Кастомное название для отображения (например, "A-IE-A" вместо "Модуль 4")
  level?: string; // Уровень языка (например, "A1-A2", "A2-B1", "B1-B2")
  availableFrom?: string; // Дата доступности в формате "YYYY-MM-DD"
  dialog: {
    title?: string; // Заголовок текста
    imageUrl?: string; // Путь к изображению перед текстом
    videoUrl?: string; // URL видео для BandStory (опционально, если отличается от основного videoUrl)
    text: string;
    translation: string;
    audioUrl: string; // Ссылка на MP3 файл
  };
  words: Word[];
  lessons?: Lesson[]; // Несколько уроков с видео и словарем (опционально, для Модуля 3)
  mantras: Mantra[];
  quiz?: QuizQuestion[]; // Квиз по тексту (опционально)
  exercises?: GapFillExercise[]; // Упражнения на заполнение пробелов (устаревшие)
  mantraGapExercises?: MantraGapExercise[]; // Упражнения на пробелы в мантрах
  articleExercises?: ArticleExercise[]; // Упражнения на артикли
  textGapExercises?: TextGapExercise[]; // Упражнения с пробелами в тексте
  verbFormExercises?: VerbFormExercise[]; // Упражнения на заполнение форм глаголов
  verbFormCards?: VerbFormCard[]; // Карточки для повторения форм глаголов
}

export type ModuleType = 'video' | 'band-story' | 'flashcards' | 'verb-form-flashcards' | 'mantras' | 'exercises' | 'verb-forms' | 'text-gaps';
