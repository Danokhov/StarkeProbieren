import { Topic } from './types';

// Импортируем данные модулей из отдельных файлов
import { module1 } from './data/modules/module1';
import { module2 } from './data/modules/module2';
import { module3 } from './data/modules/module3';
import { module4 } from './data/modules/module4';
import { module5 } from './data/modules/module5';
import { module6 } from './data/modules/module6';
import { module7 } from './data/modules/module7';
import { module8 } from './data/modules/module8';
import { module9 } from './data/modules/module9';
import { module10 } from './data/modules/module10';
import { module11 } from './data/modules/module11';

// Глаголы для пробных уроков (модуль 3 без ассоциаций)
export const TRIAL_VERBS = ['fahren', 'laden', 'einladen', 'erfahren', 'schlagen', 'vorschlagen', 'gewinnen', 'schwimmen', 'beginnen'];

// Объединяем все модули в один массив
export const TOPICS: Topic[] = [
  module1,
  module2,
  module3,
  module4,
  module5,
  module6,
  module7,
  module8,
  module9,
  module10,
  module11
];
