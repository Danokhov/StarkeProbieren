
import React from 'react';

interface ModuleCardProps {
  title: string;
  icon: string;
  onClick: () => void;
  colorClass: string;
  isCompleted?: boolean;
  isLocked?: boolean;
  progressPercentage?: number;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ title, icon, onClick, colorClass, isCompleted, isLocked, progressPercentage = 0 }) => {
  // Круговой прогресс-бар показываем только если progressPercentage > 0
  // Это используется только для карточек топиков на главной странице
  const showProgress = progressPercentage > 0 && !isLocked;
  
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progressPercentage / 100) * circumference;
  
  // Определяем цвет прогресс-бара на основе colorClass
  const getProgressColor = () => {
    if (colorClass.includes('red')) return '#ef4444';
    if (colorClass.includes('pink')) return '#ec4899';
    if (colorClass.includes('green')) return '#10b981';
    if (colorClass.includes('indigo')) return '#6366f1';
    if (colorClass.includes('blue')) return '#3b82f6';
    if (colorClass.includes('purple')) return '#a855f7';
    if (colorClass.includes('teal')) return '#14b8a6';
    if (colorClass.includes('orange')) return '#f97316';
    return '#3b82f6';
  };

  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center p-4 bg-white rounded-[1.4rem] shadow-md border border-gray-100 transition-all text-center min-h-[110px] justify-center relative overflow-hidden group ${
        isLocked 
          ? 'opacity-60' 
          : 'hover:shadow-lg active:scale-95'
      }`}
    >
      {isCompleted && !isLocked && (
        <div className="absolute top-2 left-2 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-sm animate-in zoom-in z-10">
          <i className="fas fa-check"></i>
        </div>
      )}
      {isLocked && (
        <div className="absolute top-2 left-2 w-5 h-5 bg-gray-400 text-white rounded-full flex items-center justify-center text-[10px] shadow-sm z-10">
          <i className="fas fa-lock"></i>
        </div>
      )}
      
      {/* Круговой прогресс-бар - только для карточек топиков на главной странице */}
      {showProgress && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
            {/* Фоновый круг */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="4"
            />
            {/* Прогресс */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke={getProgressColor()}
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
        </div>
      )}
      
      <div className={`w-10 h-10 ${colorClass} text-white rounded-full flex items-center justify-center mb-2.5 text-lg shadow-lg shadow-current/20 transition-transform relative z-0 ${
        isLocked ? '' : 'group-hover:scale-110'
      }`}>
        <i className={`fas ${icon}`}></i>
        {isLocked && (
          <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center">
            <i className="fas fa-lock text-white text-xs"></i>
          </div>
        )}
      </div>
      <h3 className={`text-sm font-black leading-tight ${isLocked ? 'text-gray-400' : 'text-gray-800'} relative z-0`}>{title}</h3>
    </button>
  );
};

export default ModuleCard;
