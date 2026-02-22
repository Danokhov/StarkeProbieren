
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { verbsPart1 } from './data/verbsPart1';

// Делаем данные доступными глобально для обратной совместимости
(window as any).verbsPart1 = verbsPart1;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
