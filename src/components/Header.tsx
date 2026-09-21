import React from 'react';
import {
  HeartPulse,
  Mic,
  Languages,
  Accessibility,
  PhoneCall,
  UserCheck,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/i18n';
import { AppLanguage } from '../types';

export const Header: React.FC = () => {
  const {
    user,
    language,
    setLanguage,
    easyMode,
    setEasyMode,
    setActiveTab,
    setIsVoiceAssistantOpen,
    loginDemoUser,
    logout
  } = useApp();

  const t = TRANSLATIONS[language];

  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-teal-100/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Tagline */}
          <div
            id="brand-logo-btn"
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-teal-600 via-cyan-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-teal-500/25 group-hover:scale-105 transition-transform">
              <HeartPulse className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-xl sm:text-2xl tracking-tight text-slate-900">
                  Medi<span className="text-teal-600">Mitra</span>
                </span>
                <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200/80">
                  Health AI
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block font-medium">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Action controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* TALK TO MEDIMITRA Quick Button */}
            <button
              id="header-talk-btn"
              onClick={() => setIsVoiceAssistantOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4.5 py-2 rounded-xl bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title={t.talkToMediMitra}
            >
              <Mic className="w-4 h-4 text-teal-100 animate-pulse" />
              <span className="hidden xs:inline">{t.talkToMediMitra}</span>
              <span className="xs:hidden">Talk</span>
            </button>

            {/* Language Selector */}
            <div className="relative">
              <label htmlFor="language-select" className="sr-only">Select Language</label>
              <div className="flex items-center bg-teal-50/80 rounded-xl p-1 border border-teal-200/80">
                <Languages className="w-4 h-4 text-teal-600 ml-1.5 mr-1" />
                <select
                  id="language-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as AppLanguage)}
                  className="bg-transparent text-xs sm:text-sm font-bold text-teal-950 focus:outline-none cursor-pointer py-1 pr-2"
                >
                  <option value="en-IN">English</option>
                  <option value="te-IN">తెలుగు</option>
                  <option value="hi-IN">हिन्दी</option>
                </select>
              </div>
            </div>

            {/* Easy Mode Toggle */}
            <button
              id="toggle-easy-mode-btn"
              onClick={() => setEasyMode(!easyMode)}
              className={`p-2 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                easyMode
                  ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-xs'
                  : 'bg-slate-100/90 border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
              title="Toggle Easy / Accessible Mode"
            >
              <Accessibility className="w-4 h-4" />
              <span className="hidden lg:inline">{easyMode ? t.easyModeActive : t.easyMode}</span>
            </button>

            {/* Emergency Fast Trigger */}
            <button
              id="header-emergency-btn"
              onClick={() => setActiveTab('emergency')}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title={t.emergencySupport}
            >
              <PhoneCall className="w-4 h-4 text-rose-600 animate-bounce" />
              <span className="hidden sm:inline">108 / SOS</span>
            </button>

            {/* User Profile / Auth State */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  id="header-profile-btn"
                  onClick={() => setActiveTab('profile')}
                  className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-teal-50 border border-teal-200/80 transition-colors cursor-pointer"
                  title="Profile"
                >
                  <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                    {user.name ? user.name[0] : 'U'}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 hidden xl:inline">
                    {user.name}
                  </span>
                </button>
                <button
                  id="header-logout-btn"
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title={t.logout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="header-demo-login-btn"
                onClick={loginDemoUser}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Demo User</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
