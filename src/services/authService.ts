
import { User } from '../types';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
      };
    };
  }
}

export const AuthService = {
  /**
   * Automatically attempts to login using Telegram WebApp data.
   * If failing, falls back to saved data or creates a Guest session.
   */
  async autoLogin(): Promise<User> {
    const tg = window.Telegram?.WebApp;
    
    // 1. Try Telegram WebApp
    if (tg && tg.initDataUnsafe?.user) {
      const tgUser = tg.initDataUnsafe.user;
      tg.ready();
      tg.expand();
      
      const user: User = {
        id: `fb_${tgUser.id}`, 
        telegramId: String(tgUser.id),
        name: tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : '')
      };
      
      console.log('✅ Telegram user authenticated:', { telegramId: user.telegramId, name: user.name });
      localStorage.setItem('promnemo_user', JSON.stringify(user));
      return user;
    }
    
    // Если Telegram WebApp доступен, но данные пользователя отсутствуют
    if (tg) {
      console.warn('⚠️ Telegram WebApp доступен, но данные пользователя отсутствуют');
      console.log('Telegram WebApp initDataUnsafe:', tg.initDataUnsafe);
    } else {
      console.warn('⚠️ Telegram WebApp недоступен (приложение открыто не в Telegram)');
    }
    
    // 2. Check if we already have a saved session
    const saved = localStorage.getItem('promnemo_user');
    if (saved) {
      try {
        const savedUser = JSON.parse(saved);
        console.log('📦 Using saved user from localStorage:', { telegramId: savedUser.telegramId, name: savedUser.name });
        // Если сохранен guest user (telegramId: '0'), но Telegram доступен - не используем сохраненный
        if (savedUser.telegramId === '0' && tg) {
          console.warn('⚠️ Saved guest user detected, but Telegram is available. Clearing saved user.');
          localStorage.removeItem('promnemo_user');
        } else {
          return savedUser;
        }
      } catch (e) {
        console.error('❌ Error parsing saved user:', e);
        localStorage.removeItem('promnemo_user');
      }
    }
    
    // 3. Absolute Fallback: Create a Guest User
    const guestUser: User = {
      id: `guest_${Math.floor(Math.random() * 1000000)}`,
      telegramId: '0',
      name: 'Гость'
    };
    
    console.warn('⚠️ Creating guest user (telegramId: 0) - Telegram user data not available');
    localStorage.setItem('promnemo_user', JSON.stringify(guestUser));
    return guestUser;
  },

  getCurrentUser(): User | null {
    const saved = localStorage.getItem('promnemo_user');
    return saved ? JSON.parse(saved) : null;
  },

  logout() {
    localStorage.removeItem('promnemo_user');
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    } else {
      window.location.reload();
    }
  }
};
