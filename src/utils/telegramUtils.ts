/**
 * Открытие ссылок на бота Telegram.
 * В WebView: openTelegramLink + close — приложение сворачивается, пользователь видит чат с ботом.
 * В браузере: обычный window.open.
 */
export function openTelegramBotLink(url: string): void {
  const tg = (window as any).Telegram?.WebApp;
  if (tg && typeof tg.openTelegramLink === 'function') {
    tg.openTelegramLink(url);
    tg.close();
  } else {
    window.open(url, '_blank');
  }
}
