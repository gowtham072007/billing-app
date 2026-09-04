import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useLanguage } from '../../context/LanguageContext';

interface SplashScreenProps {
  redirectPath?: string;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  redirectPath = '/login',
  durationMs = 2200,
}) => {
  const { settings } = useSettings();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<number>(0);
  const [isExiting, setIsExiting] = useState<boolean>(false);

  useEffect(() => {
    // Increment progress bar smoothly
    const intervalTime = 40;
    const totalSteps = durationMs / intervalTime;
    const stepIncrement = 100 / totalSteps;

    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + stepIncrement;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    // Trigger exit animation and navigation
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 450);
    }, durationMs);

    return () => {
      clearInterval(timer);
      clearTimeout(exitTimer);
    };
  }, [durationMs, navigate, redirectPath]);

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      navigate(redirectPath, { replace: true });
    }, 200);
  };

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden select-none cursor-pointer transition-all duration-500 ${
        isExiting ? 'opacity-0 scale-98 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Ambient background glow & radial lights */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-600/25 rounded-full blur-3xl animate-glow-pulse pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl animate-glow-pulse delay-1000 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Main Animated Content Card */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm w-full animate-logo-intro">
        {/* Glowing Logo Container */}
        <div className="relative mb-6 group">
          {/* Animated Halo / Glow Ring */}
          <div className="absolute -inset-2 bg-gradient-to-r from-brand-500 via-indigo-500 to-emerald-500 rounded-3xl blur-md opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-glow-pulse" />

          {/* Logo Card */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 bg-white rounded-3xl p-3 shadow-2xl flex items-center justify-center border border-white/20">
            <img
              src="/logo.png"
              alt="Store Logo"
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>

          {/* Sparkle Accent Badge */}
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-slate-900 border border-brand-400 text-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* Store Title */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm mb-1.5">
          <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            {settings.shop_name || 'Vilmani Store'}
          </span>
        </h1>

        {/* Tagline */}
        <p className="text-xs sm:text-sm font-medium text-slate-400 mb-8 max-w-xs">
          {t('store_tagline')}
        </p>

        {/* Sleek Progress Bar */}
        <div className="w-full max-w-xs bg-slate-900/80 rounded-full h-2 border border-slate-800 p-0.5 overflow-hidden shadow-inner mb-3">
          <div
            className="h-full bg-gradient-to-r from-brand-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-75 relative overflow-hidden"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          >
            <div className="absolute inset-0 bg-white/25 animate-shimmer" />
          </div>
        </div>

        {/* Progress State Label */}
        <div className="flex items-center justify-between w-full max-w-xs text-[11px] text-slate-500 font-mono">
          <span>
            {progress < 40
              ? 'Starting application...'
              : progress < 85
              ? 'Preparing store...'
              : 'Opening Sign In...'}
          </span>
          <span className="text-brand-400 font-bold">{Math.round(progress)}%</span>
        </div>

        {/* Skip hint */}
        <div className="mt-8 text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
          <span>Click anywhere to continue</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};
