import React, { useState } from 'react';
import { Download, MonitorCheck } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useLanguage } from '../../context/LanguageContext';
import { InstallAppModal } from './InstallAppModal';

interface InstallAppButtonProps {
  variant?: 'sidebar' | 'navbar' | 'card' | 'compact';
  className?: string;
}

export const InstallAppButton: React.FC<InstallAppButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isStandalone, isInstalled } = usePWAInstall();
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);

  // If running inside standalone app, we can either hide or show "Installed"
  if (variant === 'sidebar') {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          type="button"
          title={t('install_app')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
            isStandalone
              ? 'text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-800/30'
              : 'text-brand-300 bg-brand-950/40 hover:bg-brand-900/60 border border-brand-800/50 shadow-xs'
          } ${className}`}
        >
          <div className="flex items-center gap-2 truncate">
            {isStandalone ? (
              <MonitorCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Download className="w-4 h-4 text-brand-400 shrink-0 animate-pulse" />
            )}
            <span className="truncate">{t('install_app')}</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300">
            {isStandalone ? 'App' : 'PWA'}
          </span>
        </button>

        <InstallAppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  if (variant === 'navbar') {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          type="button"
          title={t('install_app')}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            isStandalone
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 shadow-xs'
          } ${className}`}
        >
          {isStandalone ? (
            <MonitorCheck className="w-4 h-4 text-emerald-600" />
          ) : (
            <Download className="w-4 h-4 text-brand-600" />
          )}
          <span>{t('install_app')}</span>
        </button>

        <InstallAppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  if (variant === 'card') {
    return (
      <>
        <div className={`bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 p-5 rounded-2xl border border-brand-800/40 text-white space-y-3 shadow-md ${className}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-500/20 border border-brand-500/30 text-brand-400">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{t('install_desktop_app')}</h3>
                <p className="text-[11px] text-slate-300">Windows PC, macOS, Android & iOS Standalone App</p>
              </div>
            </div>
            {isStandalone && (
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Active Standalone
              </span>
            )}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {t('install_app_desc')}
          </p>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-brand-600/30 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isStandalone ? t('install_guide') : t('install_now')}</span>
          </button>
        </div>

        <InstallAppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  // Compact variant (default)
  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        type="button"
        title={t('install_app')}
        className={`p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center ${className}`}
      >
        <Download className="w-4 h-4 text-brand-600" />
      </button>

      <InstallAppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
