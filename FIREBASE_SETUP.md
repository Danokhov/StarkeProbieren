# Настройка Firebase для сохранения прогресса пользователей

## Шаги настройки

### 1. Создайте проект в Firebase Console

1. Перейдите на https://console.firebase.google.com/
2. Создайте новый проект или выберите существующий
3. Следуйте инструкциям по настройке проекта

### 2. Создайте базу данных Firestore

1. В Firebase Console перейдите в раздел **Firestore Database**
2. Нажмите **"Create database"**
3. Выберите режим:
   - **Production mode** (рекомендуется для продакшена)
   - **Test mode** (для тестирования - правила безопасности более открытые)
4. Выберите регион (например, `europe-west`)
5. Нажмите **"Enable"**

### 3. Настройте правила безопасности Firestore ⚠️ КРИТИЧЕСКИ ВАЖНО!

**Без правильных правил безопасности вы получите ошибку "Missing or insufficient permissions"**

Перейдите в Firebase Console → **Firestore Database** → **Rules** и **скопируйте следующие правила**:

**Для тестирования (обязательно начните с этого!):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Разрешаем чтение и запись для всех (для тестирования)
      allow read, write: if true;
    }
  }
}
```

**ВАЖНО:**
1. Скопируйте правила выше (или из файла `FIRESTORE_RULES.txt` в корне проекта)
2. Вставьте их в редактор правил в Firebase Console
3. **Нажмите "Publish" (Опубликовать)** в правом верхнем углу
4. Подождите несколько секунд для применения правил

**Для продакшена (более безопасные правила):**
После тестирования можно переключиться на более строгие правила:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Разрешаем чтение и запись, если telegramId совпадает с ID документа
      allow read, write: if request.resource.data.telegramId == userId || 
                           resource.data.telegramId == userId;
    }
  }
}
```

**⚠️ КРИТИЧЕСКИ ВАЖНО:** 
- **Начните с правил `if true`** для тестирования
- **Обязательно нажмите "Publish"** после вставки правил
- Без правильных правил приложение не сможет сохранять данные

### 4. Получите конфигурационные данные

1. В Firebase Console перейдите в **Project Settings** (⚙️ рядом с Project Overview)
2. Прокрутите вниз до раздела **"Your apps"**
3. Нажмите на иконку **Web** (`</>`)
4. Зарегистрируйте приложение (укажите название, например "PRO Starke Verben")
5. Скопируйте конфигурационные данные (они будут выглядеть так):

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};
```

### 5. Создайте файл .env

В корне проекта создайте файл `.env` (или `.env.local` для локальной разработки) со следующим содержимым:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123...
```

**Важно**: 
- Замените значения на свои из Firebase Console
- Не коммитьте файл `.env` в git (он уже должен быть в `.gitignore`)
- Для продакшена (Netlify/Vercel) добавьте эти переменные в настройки окружения

### 6. Структура данных в Firestore

Приложение автоматически создаст следующую структуру:

**Коллекция**: `users`
**Документ ID**: `{telegramId}` (например, "123456789")
**Поля документа**:
```javascript
{
  telegramId: "123456789",
  name: "Имя Фамилия",
  progress: {
    "house-cleaning": ["video", "flashcards", "mantras"],
    "module-4": ["verb-forms", "text-gaps"]
  },
  updatedAt: Timestamp
}
```

### 7. Развертывание на продакшен

Если вы используете Netlify, Vercel или другую платформу:

1. Перейдите в настройки проекта на вашей платформе
2. Найдите раздел **Environment Variables** / **Переменные окружения**
3. Добавьте все переменные из `.env` файла:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. Сохраните и пересоберите проект

### 8. Проверка работы

После настройки:

1. Запустите приложение локально: `npm run dev`
2. Откройте приложение в Telegram WebApp
3. Пройдите несколько модулей
4. Проверьте в Firebase Console (Firestore Database), что данные появились в коллекции `users`

### Fallback механизм

Если Firebase не настроен или произошла ошибка, приложение автоматически использует `localStorage` для сохранения прогресса. Прогресс будет сохранен локально на устройстве пользователя, но не будет синхронизироваться между устройствами.

## Безопасность

- **Не публикуйте** конфигурационные данные Firebase в публичных репозиториях
- Используйте переменные окружения для хранения чувствительных данных
- Настройте правила безопасности Firestore в соответствии с вашими требованиями
- Для продакшена рекомендуется настроить аутентификацию Firebase (опционально)

