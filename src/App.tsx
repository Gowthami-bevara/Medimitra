/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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

import {
  Mic,
  HeartPulse,
  ShieldCheck,
  Siren,
  PhoneCall,
  BatteryMedium,
  BatteryLow,
  Zap,
} from 'lucide-react';
import { TRANSLATIONS } from './utils/i18n';

const MainAppContent: React.FC = () => {
  const {
    user,
    healthProfile,
    activeTab,
    setIsVoiceAssistantOpen,
    language,
    easyMode,
    ambulanceSim,
    activeMedicineAlarm,
  } = useApp();

  const t = TRANSLATIONS[language];

  // Battery status state for user peace of mind during extended emergency / triage usage
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean>(false);

  useEffect(() => {
    let batteryInstance: any = null;

    const updateBattery = (battery: any) => {
      if (typeof battery?.level === 'number') {
        setBatteryLevel(Math.round(battery.level * 100));
      }
      setIsCharging(Boolean(battery?.charging));
    };

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any)
        .getBattery()
        .then((battery: any) => {
          batteryInstance = battery;
          updateBattery(battery);
          battery.addEventListener('levelchange', () => updateBattery(battery));
          battery.addEventListener('chargingchange', () => updateBattery(battery));
        })
        .catch(() => {
          setBatteryLevel(88);
          setIsCharging(false);
        });
    } else {
      setBatteryLevel(88);
      setIsCharging(false);
    }

    return () => {
      if (batteryInstance) {
        try {
          batteryInstance.removeEventListener('levelchange', () => {});
          batteryInstance.removeEventListener('chargingchange', () => {});
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  // Detect whether the user is in an active emergency context
  const isEmergencyContext =
    activeTab === 'emergency' ||
    activeTab === 'traffic-sim' ||
    activeTab === 'ambulance-traffic' ||
    ambulanceSim?.isRunning ||
    ambulanceSim?.status === 'dispatched' ||
    ambulanceSim?.status === 'en_route' ||
    ambulanceSim?.status === 'preempting' ||
    ambulanceSim?.status === 'green_wave_active' ||
    Boolean(activeMedicineAlarm);

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
      <main className="flex-1 pb-28 md:pb-16 relative z-10">
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

      {/* Persistent Floating Quick Action Button */}
      <div className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-40">
        <button
          id="floating-talk-btn"
          onClick={() => setIsVoiceAssistantOpen(true)}
          aria-label={
            isEmergencyContext
              ? (language === 'te-IN'
                  ? 'అత్యవసర SOS వాయిస్ అసిస్టెంట్'
                  : language === 'hi-IN'
                  ? 'आपातकालीन SOS वॉयस सहायक'
                  : 'Emergency SOS Voice Assistant')
              : t.talkToMediMitra
          }
          title={
            isEmergencyContext
              ? (language === 'te-IN'
                  ? 'అత్యవసర వాయిస్ అసిస్టెంట్ - తక్షణ ట్రయాజ్ & 108 గైడెన్స్'
                  : language === 'hi-IN'
                  ? 'आपातकालीन वॉयस सहायक - त्वरित ट्राइएज व 108 सहायता'
                  : 'Emergency SOS Assistant - Urgent Triage & 108 Coordination')
              : t.talkToMediMitra
          }
          className={`group relative flex items-center gap-2.5 sm:gap-3 py-3 sm:py-3.5 px-4 sm:px-5 rounded-full text-white font-display font-black text-xs sm:text-sm border-2 cursor-pointer
            transform transition-all duration-300 ease-out
            hover:scale-105 sm:hover:scale-108 hover:-translate-y-1 hover:shadow-2xl
            active:scale-95 active:translate-y-0
            ${
              isEmergencyContext
                ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 shadow-xl shadow-rose-950/40 border-rose-200/90 hover:shadow-rose-900/50 animate-emergency-glow'
                : 'bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-700 shadow-xl shadow-teal-950/25 border-white/70 hover:shadow-teal-900/35'
            }`}
        >
          {/* Urgent Outer Pulse Ripple Effect when in Emergency Context */}
          {isEmergencyContext && (
            <>
              <span className="absolute -inset-2 rounded-full bg-rose-600/30 animate-emergency-ripple pointer-events-none -z-10" />
              <span className="absolute -inset-0.5 rounded-full bg-red-500/30 animate-pulse-urgent pointer-events-none -z-10" />
            </>
          )}

          {/* Icon Container with subtle scale-up on group-hover */}
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-xs transform transition-transform duration-300 ease-out group-hover:scale-110 shrink-0 ${
              isEmergencyContext ? 'bg-white text-rose-700' : 'bg-white text-teal-700'
            }`}
          >
            {isEmergencyContext ? (
              <Siren className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse-urgent text-rose-600" />
            ) : (
              <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse text-teal-600" />
            )}
          </div>

          {/* Label Text */}
          <span className="hidden sm:inline-block pr-1 font-black tracking-wide">
            {isEmergencyContext
              ? (language === 'te-IN'
                  ? 'అత్యవసర SOS'
                  : language === 'hi-IN'
                  ? 'आपातकालीन SOS'
                  : 'Emergency SOS')
              : t.talkToMediMitra}
          </span>
          <span className="sm:hidden font-black text-xs">
            {isEmergencyContext ? 'SOS' : 'Talk'}
          </span>

          {/* Context-Aware Battery Status Icon next to Beacon Dot */}
          <div
            id="floating-btn-battery-status"
            className={`absolute -top-2.5 sm:-top-3 right-5 sm:right-6 flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black border shadow-xs transition-all pointer-events-none select-none z-10 ${
              isEmergencyContext
                ? batteryLevel !== null && batteryLevel <= 20 && !isCharging
                  ? 'bg-rose-950 text-rose-200 border-rose-400 ring-2 ring-rose-500 animate-pulse'
                  : 'bg-rose-950/95 text-rose-100 border-rose-300/80 shadow-rose-900/30'
                : batteryLevel !== null && batteryLevel <= 20 && !isCharging
                ? 'bg-amber-100 text-amber-950 border-amber-300 ring-1 ring-amber-400 animate-pulse'
                : 'bg-slate-900/90 text-emerald-300 border-slate-700/80 backdrop-blur-xs'
            }`}
            title={`Device Battery: ${batteryLevel ?? 88}% ${isCharging ? '(Charging)' : 'Ready for emergency triage'}`}
          >
            {isCharging ? (
              <Zap className="w-2.5 h-2.5 text-amber-300 animate-pulse shrink-0" />
            ) : batteryLevel !== null && batteryLevel <= 20 ? (
              <BatteryLow className="w-2.5 h-2.5 text-rose-400 animate-pulse shrink-0" />
            ) : (
              <BatteryMedium className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
            )}
            <span>{batteryLevel ?? 88}%</span>
          </div>

          {/* Beacon Dot: Enhanced fast pulse / ping in emergency context */}
          <span
            className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
              isEmergencyContext
                ? 'bg-rose-500 animate-ping-urgent shadow-xs'
                : 'bg-emerald-400 animate-ping'
            }`}
          />
          {isEmergencyContext && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-600 animate-pulse-urgent" />
          )}
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
