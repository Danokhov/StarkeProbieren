# Диагностика проблем с Firebase

## Проверка настройки Firebase в Netlify

### 1. Проверьте переменные окружения в Netlify

1. Перейдите в панель Netlify: `Site settings` → `Environment variables`
2. Убедитесь, что добавлены **все 6 переменных**:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

### 2. Проверьте консоль браузера

Откройте приложение в Telegram и проверьте консоль браузера (через DevTools):

**Ожидаемые сообщения при успешной инициализации:**
```
✅ Firebase initialized successfully
Firebase config: { projectId: "...", apiKey: "..." }
```

**Сообщения об ошибках:**
```
⚠️ Firebase config is not complete. Progress will be saved locally only.
Firebase config check: { apiKey: false, projectId: false, ... }
```

Если видите предупреждение ⚠️, значит переменные окружения не настроены.

### 3. Проверьте правила безопасности Firestore ⚠️ ВАЖНО!

**Ошибка "Missing or insufficient permissions" означает, что правила Firestore блокируют доступ.**

В Firebase Console перейдите в **Firestore Database** → **Rules** и скопируйте следующие правила:

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

**После вставки правил:**
1. Нажмите **"Publish"** (Опубликовать) в правом верхнем углу
2. Подождите несколько секунд, пока правила применятся
3. Обновите страницу приложения в Telegram
4. Проверьте, что ошибка исчезла

**⚠️ ВАЖНО:** 
- Для продакшена замените `if true` на более строгие правила
- Но для начала **обязательно** используйте `if true` для тестирования
- Файл `FIRESTORE_RULES.txt` в корне проекта содержит эти правила - скопируйте оттуда

### 4. Пересоберите проект после добавления переменных

После добавления переменных окружения в Netlify:
1. Перейдите в **Deploys**
2. Нажмите **Trigger deploy** → **Clear cache and deploy site**
3. Дождитесь завершения деплоя
4. Проверьте консоль браузера снова

### 5. Проверьте логи сохранения

В консоли браузера при сохранении прогресса должны появиться сообщения:

**Успешное сохранение:**
```
✅ Progress saved to Firestore: { ... }
```

**Ошибка сохранения:**
```
❌ Error saving progress to Firestore: [ошибка]
📦 Firebase not available, saving to local storage
```

### 6. Проверьте данные в Firestore Console

1. Перейдите в Firebase Console → **Firestore Database** → **Data**
2. Должна быть коллекция `users`
3. Документы должны иметь ID = `telegramId` пользователя
4. Внутри документа должны быть поля: `telegramId`, `name`, `progress`, `updatedAt`

### Частые проблемы:

1. **Переменные окружения не добавлены** - добавьте все 6 переменных в Netlify
2. **Переменные добавлены, но проект не пересобран** - пересоберите проект в Netlify
3. **Правила безопасности блокируют запись** - используйте `allow read, write: if true` для тестирования
4. **Firestore Database не создана** - создайте базу данных в Firebase Console
5. **Неправильные значения переменных** - проверьте, что скопировали правильные значения из Firebase Console

