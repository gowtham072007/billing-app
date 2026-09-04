import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  PanelLeft,
  PanelLeftClose,
  Receipt,
  Store,
  ShieldCheck,
  Languages,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { InstallAppButton } from './InstallAppButton';

interface AdminHeaderProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenMobileSidebar,
}) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { t } = useLanguage();
  const location = useLocation();

  // Determine current page name for top breadcrumb
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/billing')) return t('nav_billing');
    if (path.includes('/orders')) return t('nav_orders');
    if (path.includes('/products')) return t('nav_products');
    if (path.includes('/stock')) return t('nav_stock');
    if (path.includes('/bills')) return t('nav_bills');
    if (path.includes('/customers')) return t('nav_customers');
    if (path.includes('/reports')) return t('nav_reports');
    if (path.includes('/settings')) return t('nav_settings');
    return t('nav_dashboard');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 h-16 flex items-center justify-between no-print select-none shadow-xs">
      {/* Left: Menu Bar Toggle Button & Page Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onOpenMobileSidebar}
          type="button"
          className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Open Menu Bar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Collapse/Expand Toggle Button */}
        <button
          onClick={onToggleSidebar}
          type="button"
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer hover:border-brand-300 shadow-2xs"
          title={isSidebarCollapsed ? 'Expand Menu Bar (Show full sidebar)' : 'Collapse Menu Bar (Compact icon bar)'}
        >
          {isSidebarCollapsed ? (
            <PanelLeft className="w-4 h-4 text-brand-600" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-slate-500" />
          )}
          <span>{isSidebarCollapsed ? 'Expand Menu' : 'Menu'}</span>
        </button>

        {/* Breadcrumb / Title */}
        <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200">
          <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight truncate">
            {getPageTitle()}
          </span>
          <span className="hidden lg:inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {settings.shop_name || 'POS'}
          </span>
        </div>
      </div>

      {/* Right: Quick Action Shortcuts (POS Billing, Store, Language, App Install) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick POS Billing Button */}
        {!location.pathname.includes('/billing') && (
          <Link
            to="/admin/billing"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm shadow-brand-600/20 transition-all cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>{t('nav_billing')}</span>
          </Link>
        )}

        {/* Customer Store Link */}
        <Link
          to="/customer/products"
          className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title={t('nav_shop_products')}
        >
          <Store className="w-4 h-4 text-slate-500" />
          <span>{t('nav_shop_products')}</span>
        </Link>

        {/* Install App Button */}
        <InstallAppButton variant="navbar" />

        {/* Language Switcher */}
        <LanguageSwitcher variant="compact" />

        {/* User Pill */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-xs shadow-xs">
            {user?.name ? user.name[0].toUpperCase() : 'A'}
          </div>
          <span className="text-xs font-bold text-slate-700 hidden lg:inline max-w-[90px] truncate">
            {user?.name || 'Admin'}
          </span>
        </div>
      </div>
    </header>
  );
};
