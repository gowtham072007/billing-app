import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Phone, User as UserIcon, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';

export const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const [name, setName] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { login, isAuthenticated, isAdmin, isLoading } = useAuth();
  const { settings } = useSettings();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // If already logged in, redirect automatically to the corresponding dashboard
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      if (isAdmin) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate(redirectUrl || '/customer/products', { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, navigate, redirectUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = name.trim();
    const cleanSecret = secret.trim();

    if (!cleanName) {
      setErrorMessage(t('enter_name_to_shop', 'Please enter your name.'));
      return;
    }

    if (!cleanSecret) {
      setErrorMessage(t('phone_password_field_placeholder', 'Please enter your phone number.'));
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await login(cleanName, cleanSecret);
      // Automatic Role Detection: Redirect to correct dashboard
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate(redirectUrl || '/customer/products', { replace: true });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Invalid credentials. Please verify your details.';
      setErrorMessage(msg);
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

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center mb-3">
          <img
            src="/logo.png"
            alt="Store Logo"
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-2xl bg-white p-2 shadow-xl border border-slate-200/80"
          />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {settings.shop_name || 'Vilmani Store'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {t('store_tagline', 'Modern POS Billing & Customer Ordering System')}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-3xl shadow-xl border border-slate-200/80 space-y-6">
          <div className="text-center border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-800">
              {t('sign_in', 'Sign In')}
            </h3>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* COMMON LOGIN FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field 1: Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('name_field_label', 'Name')} <span className="text-rose-600 font-bold">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('name_field_placeholder', 'Enter registered name')}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-brand-500 outline-none placeholder:text-slate-400 placeholder:font-normal transition-colors"
                  autoFocus
                />
              </div>
            </div>

            {/* Field 2: Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('phone_password_field_label', 'Phone Number')} <span className="text-rose-600 font-bold">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type={showSecret ? 'text' : 'password'}
                  required
                  value={secret}
                  onChange={e => setSecret(e.target.value)}
                  placeholder={t('phone_password_field_placeholder', 'Enter phone number')}
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-brand-500 outline-none placeholder:text-slate-400 placeholder:font-normal transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showSecret ? 'Hide secret' : 'Show secret'}
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-slate-900/25 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('authenticating', 'Verifying credentials...')}</span>
                </>
              ) : (
                <>
                  <span>{t('login_btn', 'Login')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
