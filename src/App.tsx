/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { AuthModal } from './components/AuthModal';
import { HealthProfileSetup } from './components/HealthProfileSetup';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { ActiveMedicineAlarmModal } from './components/ActiveMedicineAlarmModal';
import { HospitalAmbienceBackground } from './components/HospitalAmbienceBackground';

import { HomePage } from './pages/HomePage';
import { MyHealthPage } from './pages/MyHealthPage';
import { HealthPredictionPage } from './pages/HealthPredictionPage';
import { DoctorFinderPage } from './pages/DoctorFinderPage';
import { NearbyHospitalPage } from './pages/NearbyHospitalPage';
import { MedicineManagerPage } from './pages/MedicineManagerPage';
import { SymptomGuidancePage } from './pages/SymptomGuidancePage';
import { EmergencySupportPage } from './pages/EmergencySupportPage';
import { SmartTrafficCoordinationPage } from './pages/SmartTrafficCoordinationPage';

import { Mic, HeartPulse, ShieldCheck, Siren, PhoneCall } from 'lucide-react';
import { TRANSLATIONS } from './utils/i18n';

const MainAppContent: React.FC = () => {
  const {
    user,
    healthProfile,
    activeTab,
    setIsVoiceAssistantOpen,
    language,
    easyMode,
  } = useApp();

  const t = TRANSLATIONS[language];

  // 1. If not authenticated, show Auth modal (with instant Demo account button)
  if (!user) {
    return (
      <div className="min-h-screen text-slate-900 flex flex-col justify-between relative overflow-hidden">
        {/* Realistic Hospital Ambience Background */}
        <HospitalAmbienceBackground variant="login" />

        <header className="bg-white/80 backdrop-blur-md border-b border-teal-100/80 py-4 px-6 flex items-center justify-between shadow-xs relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 via-cyan-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <span className="font-display font-black text-xl text-slate-900">
                Medi<span className="text-teal-600">Mitra</span>
              </span>
              <span className="block text-[10px] font-bold text-teal-600 uppercase tracking-widest">
                AI Health & Safety Companion
              </span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-600 bg-white/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-teal-100">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Hospital Network Ready</span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 relative z-10">
          <AuthModal />
        </main>

        <footer className="py-4 text-center text-xs text-slate-500 border-t border-teal-100/80 bg-white/75 backdrop-blur-md relative z-10">
          MediMitra • Smart Healthcare & Clinical AI Triage • Integrated Emergency Support
        </footer>
      </div>
    );
  }

  // 2. Strict Onboarding Order: REGISTER -> SET UP HEALTH PROFILE -> DASHBOARD
  if (!healthProfile.isCompleted) {
    return (
      <div className="min-h-screen text-slate-900 flex flex-col relative">
        <HospitalAmbienceBackground variant="subtle" />
        <Header />
        <main className="flex-1 py-8 px-4 relative z-10">
          <HealthProfileSetup />
        </main>
      </div>
    );
  }

  // 3. Main Application Dashboard & Navigation
  return (
    <div className={`min-h-screen text-slate-900 flex flex-col relative ${easyMode ? 'text-lg' : ''}`}>
      {/* Realistic Hospital Ambience Background behind Dashboard */}
      <HospitalAmbienceBackground variant="default" />

      {/* Top Header */}
      <Header />

      {/* Main Tab Navigation */}
      <Navigation />

      {/* Main Content Area */}
      <main className="flex-1 pb-16 relative z-10">
        {activeTab === 'home' && <HomePage />}
        {activeTab === 'my-health' && <MyHealthPage />}
        {activeTab === 'prediction' && <HealthPredictionPage />}
        {activeTab === 'doctors' && <DoctorFinderPage />}
        {activeTab === 'hospitals' && <NearbyHospitalPage />}
        {activeTab === 'medicines' && <MedicineManagerPage />}
        {activeTab === 'symptoms' && <SymptomGuidancePage />}
        {activeTab === 'emergency' && <EmergencySupportPage />}
        {(activeTab === 'traffic-sim' || activeTab === 'ambulance-traffic') && <SmartTrafficCoordinationPage />}
      </main>

      {/* Persistent Floating "Talk to MediMitra" Quick Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          id="floating-talk-btn"
          onClick={() => setIsVoiceAssistantOpen(true)}
          className="group relative flex items-center gap-3 py-3.5 px-5 rounded-full bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-700 text-white font-display font-black text-sm shadow-xl shadow-teal-950/25 hover:scale-105 active:scale-95 transition-all border-2 border-white/60 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-white text-teal-700 flex items-center justify-center shadow-xs">
            <Mic className="w-4 h-4 animate-pulse text-teal-600" />
          </div>
          <span className="hidden sm:inline-block pr-1 font-black">
            {t.talkToMediMitra}
          </span>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-ping"></span>
        </button>
      </div>

      {/* Global Voice Assistant Modal */}
      <VoiceAssistantModal />

      {/* Global Active Medicine Alarm Modal */}
      <ActiveMedicineAlarmModal />

      {/* Global Footer */}
      <footer className="bg-white/90 backdrop-blur-xl border-t border-teal-100/90 mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <span className="font-display font-black text-base text-slate-900">
                  Medi<span className="text-teal-600">Mitra</span>
                </span>
                <p className="text-xs text-slate-500 font-semibold">
                  {t.tagline}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-black text-slate-600">
              <a href="tel:108" className="text-rose-600 hover:text-rose-700 flex items-center gap-1">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Emergency 108</span>
              </a>
              <span>•</span>
              <a href="tel:112" className="text-slate-700 hover:text-slate-900">
                National Helpline 112
              </a>
              <span>•</span>
              <span className="text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                Live Healthcare v2.0
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
            <p>
              {t.disclaimerMedical} Prescriptions are logged for personal adherence only. Not a medical diagnostic tool.
            </p>
            <div className="flex items-center gap-1 shrink-0 text-teal-800 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Multi-language: English, తెలుగు, हिन्दी</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
