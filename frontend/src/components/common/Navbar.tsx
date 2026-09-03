import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ShoppingCart,
  User as UserIcon,
  Store,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const { settings } = useSettings();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Shop Name */}
        <Link to="/customer/products" className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Vilmani Store Logo"
            className="w-10 h-10 object-contain rounded-xl bg-white p-0.5 border border-slate-200 shadow-sm"
          />
          <div>
            <span className="font-bold text-slate-900 text-lg sm:text-xl tracking-tight block leading-tight">
              {settings.shop_name || 'Vilmani Store'}
            </span>
            <span className="text-[11px] text-slate-500 font-medium hidden sm:block">
              {settings.shop_phone || '+91 98765 43210'}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink
            to="/customer/products"
            className={({ isActive }) =>
              `text-sm font-semibold transition-colors ${
                isActive ? 'text-brand-600' : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            {t('nav_shop_products')}
          </NavLink>

          {isAuthenticated && (
            <NavLink
              to="/customer/orders"
              className={({ isActive }) =>
                `text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  isActive ? 'text-brand-600' : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t('nav_my_orders')}</span>
            </NavLink>
          )}

          {isAdmin && (
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t('nav_admin_console')}</span>
            </Link>
          )}
        </nav>

        {/* Right Action Icons: Language, Cart, Profile, Login */}
        <div className="flex items-center gap-2.5">
          {/* Language Switcher */}
          <LanguageSwitcher variant="compact" />

          {/* Cart Trigger */}
          <Link
            to="/customer/cart"
            className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all flex items-center gap-1"
            title={t('view_cart')}
          >
            <ShoppingCart className="w-5 h-5 text-slate-700" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-brand-600 text-white text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-sm">
                {totalItems}
              </span>
            )}
            <span className="hidden sm:inline text-xs font-bold ml-1 text-slate-700">{t('cart')}</span>
          </Link>

          {/* User Account / Auth */}
          {isAuthenticated ? (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
              <Link
                to="/customer/profile"
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 text-xs font-medium"
              >
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <span className="max-w-[100px] truncate font-semibold">{user?.name}</span>
              </Link>
              <button
                onClick={handleLogout}
                title={t('sign_out')}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/20 transition-colors"
            >
              {t('sign_in')}
            </Link>
          )}

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3">
          <Link
            to="/customer/products"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-slate-800 hover:text-brand-600"
          >
            {t('nav_shop_products')}
          </Link>
          {isAuthenticated && (
            <>
              <Link
                to="/customer/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-semibold text-slate-800 hover:text-brand-600"
              >
                {t('nav_my_orders')}
              </Link>
              <Link
                to="/customer/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-semibold text-slate-800 hover:text-brand-600"
              >
                {t('nav_my_profile')}
              </Link>
            </>
          )}
          {isAdmin && (
            <Link
              to="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-brand-600"
            >
              {t('nav_admin_console')}
            </Link>
          )}
          {isAuthenticated && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full text-left py-2 text-sm font-semibold text-rose-600"
            >
              {t('sign_out')} ({user?.name})
            </button>
          )}
        </div>
      )}
    </header>
  );
};
