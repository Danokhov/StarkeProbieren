
# PRO Starke Verben

Интерактивное приложение для изучения немецкого языка через Telegram WebApp.

## Как запустить проект

### 1. Деплой на GitHub и Netlify
1. Создайте новый репозиторий на GitHub.
2. Скопируйте файлы проекта в репозиторий.
3. Подключите репозиторий к **Netlify**.

### 2. Настройка API ключа (ВАЖНО)
Для работы озвучки (TTS) и генерации квизов используется Google Gemini API.
1. Получите ключ на [ai.google.dev](https://ai.google.dev/).
2. В панели управления Netlify перейдите в:
   `Site configuration` > `Environment variables`.
3. Добавьте переменную:
   - Key: `API_KEY`
   - Value: `ВАШ_КЛЮЧ_GEMINI`

### 3. Настройка Telegram Бота
1. Создайте бота через `@BotFather`.
2. Используйте команду `/newapp`, выберите своего бота.
3. В поле `Web App URL` вставьте ссылку, которую выдал Netlify.
4. Теперь приложение будет открываться внутри Telegram и автоматически подхватывать ваше имя и ID.

## Технологии
- **Frontend:** React + Tailwind CSS
- **AI:** Google Gemini API (для озвучки и тестов)
- **Auth:** Telegram WebApp API (автоматическая авторизация)
- **Storage:** Имитация Firebase (localStorage)
