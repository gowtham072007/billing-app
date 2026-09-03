import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Package,
  Boxes,
  ShoppingBag,
  CalendarCheck,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Store,
  Printer,
  Languages,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface AdminSidebarProps {
  pendingOrdersCount?: number;
  lowStockCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  pendingOrdersCount = 0,
  lowStockCount = 0,
}) => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: t('nav_dashboard') },
    { to: '/admin/billing', icon: Receipt, label: t('nav_billing'), highlight: true },
    { to: '/admin/orders', icon: ShoppingBag, label: t('nav_orders'), badge: pendingOrdersCount, badgeColor: 'bg-amber-500' },
    { to: '/admin/products', icon: Package, label: t('nav_products') },
    { to: '/admin/stock', icon: Boxes, label: t('nav_stock'), badge: lowStockCount, badgeColor: 'bg-rose-500' },
    { to: '/admin/bills', icon: CalendarCheck, label: t('nav_bills') },
    { to: '/admin/customers', icon: Users, label: t('nav_customers') },
    { to: '/admin/reports', icon: BarChart3, label: t('nav_reports') },
    { to: '/admin/settings', icon: Settings, label: t('nav_settings') },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 min-h-screen no-print select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 shrink-0">
            <Printer className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-white text-sm leading-tight truncate">
              {settings.shop_name || 'QuickBill POS'}
            </h1>
            <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {t('nav_admin_console')}
            </span>
          </div>
        </div>
      </div>

      {/* Language Switcher Widget */}
      <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
          <Languages className="w-3.5 h-3.5 text-brand-400" />
          <span>{t('language')}:</span>
        </span>
        <LanguageSwitcher variant="compact" />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? item.highlight
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 font-bold'
                      : 'bg-slate-800 text-white font-semibold'
                    : item.highlight
                    ? 'bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/60 border border-emerald-800/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`${item.badgeColor || 'bg-brand-500'} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Customer Store Preview Switcher & User Profile */}
      <div className="p-3 border-t border-slate-800 space-y-2 bg-slate-950/30">
        <NavLink
          to="/customer/products"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-950/30 hover:bg-emerald-950/60 border border-emerald-900/40 transition-colors"
        >
          <Store className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">{t('nav_shop_products')}</span>
        </NavLink>

        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between px-2">
          <div className="overflow-hidden pr-2">
            <p className="text-xs font-bold text-white truncate">{user?.name || 'Admin User'}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email || user?.phone}</p>
          </div>
          <button
            onClick={handleLogout}
            title={t('sign_out')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
