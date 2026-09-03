import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, User, Store, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';

export const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') === 'admin' ? 'admin' : 'customer';
  const redirectUrl = searchParams.get('redirect') || (defaultRole === 'admin' ? '/admin/dashboard' : '/customer/products');

  const [role, setRole] = useState<'admin' | 'customer'>(defaultRole);

  // Customer State (Name only!)
  const [customerName, setCustomerName] = useState<string>('Arun Kumar');
  const [customerPhone, setCustomerPhone] = useState<string>('9876543210');

  // Admin State
  const [adminIdentifier, setAdminIdentifier] = useState<string>('admin@shop.com');
  const [adminPassword, setAdminPassword] = useState<string>('admin123');

  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { login, customerQuickSign } = useAuth();
  const { settings } = useSettings();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleRoleSwitch = (newRole: 'admin' | 'customer') => {
    setRole(newRole);
    setErrorMessage('');
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMessage(t('enter_name_to_shop'));
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await customerQuickSign(customerName.trim(), customerPhone.trim() || undefined);
      navigate(redirectUrl.startsWith('/admin') ? '/customer/products' : redirectUrl);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const user = await login(adminIdentifier, adminPassword, 'admin');
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid admin login credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Top Language Switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <LanguageSwitcher variant="full" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-brand-600/30">
          <Store className="w-7 h-7" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {settings.shop_name || t('app_title')}
        </h2>
        <p className="text-xs text-slate-500">
          {role === 'customer' ? t('enter_name_to_shop') : t('nav_admin_console')}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl rounded-3xl border border-slate-200/80 space-y-5">
          {/* Role Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => handleRoleSwitch('customer')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                role === 'customer'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5 text-brand-600" />
              <span>{t('customer')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSwitch('admin')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                role === 'admin'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('admin')}</span>
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {errorMessage}
            </div>
          )}

          {/* CUSTOMER FORM: Name Only */}
          {role === 'customer' ? (
            <form onSubmit={handleCustomerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('full_name')} *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. அருண் குமார் / Arun Kumar"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {t('mobile_phone')} ({t('other')})
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:bg-white focus:border-brand-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-brand-600/25 transition-all cursor-pointer"
              >
                <span>{isSubmitting ? t('loading') : t('sign_in')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* 1-Click Name Picker for Easy Demo */}
              <div className="pt-3 border-t border-slate-100 text-center space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-brand-500" />
                  <span>{t('customer')}</span>
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
                  {['Arun Kumar', 'Priya Sharma', 'Karthik Raja'].map(name => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setCustomerName(name)}
                      className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors ${
                        customerName === name
                          ? 'bg-brand-50 text-brand-700 border border-brand-200'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            /* ADMIN FORM: Email & Password */
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Admin Email / Mobile
                </label>
                <input
                  type="text"
                  required
                  value={adminIdentifier}
                  onChange={e => setAdminIdentifier(e.target.value)}
                  placeholder="admin@shop.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 transition-all cursor-pointer"
              >
                <span>{isSubmitting ? t('loading') : t('sign_in')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-3 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAdminIdentifier('admin@shop.com');
                    setAdminPassword('admin123');
                  }}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold text-[11px]"
                >
                  Admin Demo (admin@shop.com / admin123)
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
