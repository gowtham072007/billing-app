import React, { useState } from 'react';
import {
  Download,
  Monitor,
  Smartphone,
  Apple,
  X,
  CheckCircle2,
  Sparkles,
  Zap,
  Printer,
  Barcode,
  WifiOff,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { promptInstall, isInstalled, isStandalone, platform } = usePWAInstall();
  const { t } = useLanguage();
  const { settings } = useSettings();

  const [activeTab, setActiveTab] = useState<'windows' | 'android' | 'ios'>(() => {
    if (platform === 'ios') return 'ios';
    if (platform === 'android') return 'android';
    return 'windows';
  });

  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await promptInstall();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-brand-900 to-slate-900 p-5 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          
          <div className="flex items-center gap-3.5 relative z-10">
            <img
              src="/logo.png"
              alt="QuickBill POS Logo"
              className="w-12 h-12 rounded-xl bg-white p-1 shadow-md border border-slate-700 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">{settings.shop_name || 'QuickBill POS'}</h2>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  PWA Ready
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                {t('install_desktop_app')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Status / Quick Action */}
          {isInstalled || isStandalone ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900">{t('already_installed')}</p>
                <p className="text-[11px] text-emerald-700">
                  QuickBill POS is running in standalone app mode with full desktop and hardware integration.
                </p>
              </div>
            </div>
          ) : installSuccess ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 animate-bounce" />
              <div>
                <p className="text-xs font-bold text-emerald-900">Installation Started!</p>
                <p className="text-[11px] text-emerald-700">
                  Check your desktop / home screen for the newly installed QuickBill POS icon.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-brand-50 border border-brand-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-brand-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  <span>One-Click Fast Installation</span>
                </p>
                <p className="text-[11px] text-brand-700 mt-0.5">
                  Click the button to install QuickBill POS directly to your device desktop/home screen.
                </p>
              </div>
              <button
                onClick={handleInstallClick}
                className="w-full sm:w-auto px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-brand-600/30 transition-all shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{t('install_now')}</span>
              </button>
            </div>
          )}

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center space-y-1">
              <Zap className="w-4 h-4 text-amber-500 mx-auto" />
              <p className="text-[11px] font-bold text-slate-800">1-Click Launch</p>
              <p className="text-[10px] text-slate-500 leading-tight">Instant taskbar & desktop access</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center space-y-1">
              <Printer className="w-4 h-4 text-emerald-600 mx-auto" />
              <p className="text-[11px] font-bold text-slate-800">Direct Thermal</p>
              <p className="text-[10px] text-slate-500 leading-tight">Seamless 4-inch receipt printing</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center space-y-1">
              <Barcode className="w-4 h-4 text-brand-600 mx-auto" />
              <p className="text-[11px] font-bold text-slate-800">USB & Camera</p>
              <p className="text-[10px] text-slate-500 leading-tight">Instant barcode scanner support</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center space-y-1">
              <WifiOff className="w-4 h-4 text-purple-600 mx-auto" />
              <p className="text-[11px] font-bold text-slate-800">Offline Cache</p>
              <p className="text-[10px] text-slate-500 leading-tight">Service Worker fast caching</p>
            </div>
          </div>

          {/* Platform Step-by-Step Instructions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                {t('install_guide')}
              </h4>
            </div>

            {/* Platform Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('windows')}
                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  activeTab === 'windows'
                    ? 'border-brand-600 text-brand-600 bg-brand-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Windows / Mac PC</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  activeTab === 'android'
                    ? 'border-brand-600 text-brand-600 bg-brand-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android Phone / POS</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  activeTab === 'ios'
                    ? 'border-brand-600 text-brand-600 bg-brand-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Apple className="w-3.5 h-3.5" />
                <span>iPhone / iPad</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-2.5">
              {activeTab === 'windows' && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="leading-relaxed">
                      Open this billing URL in <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="leading-relaxed">
                      Click the <strong>Install icon (💻 ⊕)</strong> in the right corner of the browser address bar, or click <strong>Install Now</strong> button above.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <p className="leading-relaxed">
                      Click <strong>Install</strong> on the popup dialog. A standalone window will open and a desktop shortcut icon will be created!
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'android' && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="leading-relaxed">
                      In Google Chrome on your Android phone or billing tablet, tap the <strong>Install Now</strong> button above.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="leading-relaxed">
                      Alternatively, tap the Chrome menu (<strong>⋮</strong> in top right) and select <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <p className="leading-relaxed">
                      Confirm installation to place the QuickBill icon on your smartphone home screen.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'ios' && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="leading-relaxed">
                      Open this web application in Apple <strong>Safari</strong> on your iPhone or iPad.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="leading-relaxed">
                      Tap the <strong>Share</strong> button (the box with an upward arrow ⎋) at the bottom or top of Safari.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <p className="leading-relaxed">
                      Scroll down in the share sheet and tap <strong>Add to Home Screen</strong> (➕), then tap <strong>Add</strong> in the top right.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Works across Windows, macOS, Android, and iOS devices.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
