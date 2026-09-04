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
  Languages,
  Menu,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { InstallAppButton } from './InstallAppButton';

interface AdminSidebarProps {
  pendingOrdersCount?: number;
  lowStockCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  pendingOrdersCount = 0,
  lowStockCount = 0,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
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
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden animate-fade-in"
        />
      )}

      <aside
        className={`bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 min-h-screen no-print select-none transition-all duration-300 z-50 ${
          // Mobile drawer vs Desktop sidebar
          isMobileOpen
            ? 'fixed inset-y-0 left-0 w-64 shadow-2xl translate-x-0'
            : 'hidden md:flex'
        } ${!isMobileOpen && (isCollapsed ? 'w-16' : 'w-64')}`}
      >
        {/* Brand Header & Toggle Option */}
        <div
          className={`p-3.5 border-b border-slate-800 flex items-center justify-between gap-2 h-16 ${
            isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'px-4'
          }`}
        >
          {(!isCollapsed || isMobileOpen) ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <img
                src="/logo.png"
                alt="Store Logo"
                className="w-9 h-9 object-contain rounded-xl bg-white p-0.5 border border-slate-700 shadow-md shrink-0"
              />
              <div className="overflow-hidden">
                <span className="font-extrabold text-white text-sm tracking-tight block truncate">
                  {settings.shop_name || 'Vilmani Store'}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                  POS Console
                </span>
              </div>
            </div>
          ) : (
            <img
              src="/logo.png"
              alt="Store Logo"
              title={settings.shop_name || 'QuickBill POS'}
              className="w-8 h-8 object-contain rounded-xl bg-white p-0.5 border border-slate-700 shadow-md cursor-pointer"
              onClick={onToggleCollapse}
            />
          )}

          {/* Collapse/Expand Menu Bar Button (Desktop) */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              type="button"
              title={isCollapsed ? 'Expand Menu Bar' : 'Collapse Menu Bar'}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden md:flex items-center justify-center cursor-pointer ${
                isCollapsed ? 'mt-2' : ''
              }`}
            >
              {isCollapsed ? <PanelLeft className="w-4 h-4 text-brand-400" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          )}

          {/* Close Button on Mobile Drawer */}
          {isMobileOpen && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              type="button"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Language Switcher Widget */}
        {(!isCollapsed || isMobileOpen) ? (
          <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-brand-400" />
              <span>{t('language')}:</span>
            </span>
            <LanguageSwitcher variant="compact" />
          </div>
        ) : (
          <div className="py-2 border-b border-slate-800/80 flex justify-center bg-slate-950/40">
            <LanguageSwitcher variant="compact" />
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={isMobileOpen ? onCloseMobile : undefined}
                title={isCollapsed && !isMobileOpen ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center ${
                    isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'justify-between px-3.5'
                  } py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all relative group ${
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
                  {(!isCollapsed || isMobileOpen) && <span className="truncate">{item.label}</span>}
                </div>

                {/* Badge */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`${item.badgeColor || 'bg-brand-500'} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                      isCollapsed && !isMobileOpen ? 'absolute top-1 right-1' : ''
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Hover Tooltip for Collapsed State */}
                {isCollapsed && !isMobileOpen && (
                  <div className="fixed left-16 ml-2 px-2.5 py-1 bg-slate-950 text-white text-xs font-semibold rounded-lg shadow-xl border border-slate-800 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Customer Store Preview Switcher & User Profile */}
        <div className={`p-3 border-t border-slate-800 space-y-2 bg-slate-950/30 ${isCollapsed && !isMobileOpen ? 'px-2' : ''}`}>
          <NavLink
            to="/customer/products"
            title={t('nav_shop_products')}
            className={`flex items-center ${
              isCollapsed && !isMobileOpen ? 'justify-center p-2' : 'gap-2 px-3 py-2'
            } rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-950/30 hover:bg-emerald-950/60 border border-emerald-900/40 transition-colors`}
          >
            <Store className="w-4 h-4 text-emerald-400 shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span className="truncate">{t('nav_shop_products')}</span>}
          </NavLink>

          {(!isCollapsed || isMobileOpen) ? (
            <InstallAppButton variant="sidebar" />
          ) : (
            <InstallAppButton variant="compact" className="w-full bg-brand-950/50 border border-brand-800/40 text-brand-300 hover:bg-brand-900/60" />
          )}

          <div
            className={`pt-2 border-t border-slate-800/60 flex items-center ${
              isCollapsed && !isMobileOpen ? 'justify-center' : 'justify-between px-1'
            }`}
          >
            {(!isCollapsed || isMobileOpen) && (
              <div className="overflow-hidden pr-2">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'Admin User'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || user?.phone}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              title={t('sign_out')}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
