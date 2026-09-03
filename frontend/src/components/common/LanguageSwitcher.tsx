import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-xs ${className}`}
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
          language === 'en'
            ? 'bg-white text-slate-900 shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        title="Switch to English"
      >
        {variant === 'full' ? 'English' : 'EN'}
      </button>

      <button
        type="button"
        onClick={() => setLanguage('ta')}
        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
          language === 'ta'
            ? 'bg-brand-600 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        title="தமிழுக்கு மாற்றுக"
      >
        <span>தமிழ்</span>
      </button>
    </div>
  );
};
