import React from 'react';
import {
  Home,
  Activity,
  Sparkles,
  UserCheck,
  Pill,
  Siren,
  Stethoscope,
  Building2,
  Navigation as NavIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/i18n';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, language, easyMode } = useApp();
  const t = TRANSLATIONS[language];

  const primaryNav = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'my-health', label: t.myHealth, icon: Activity },
    { id: 'prediction', label: t.healthPrediction, icon: Sparkles, highlight: true },
    { id: 'doctors', label: t.findDoctor, icon: UserCheck },
    { id: 'medicines', label: t.medicines, icon: Pill },
    { id: 'emergency', label: t.emergencySupport, icon: Siren, isEmergency: true },
  ];

  const secondaryNav = [
    { id: 'symptoms', label: t.symptomGuidance, icon: Stethoscope },
    { id: 'hospitals', label: t.nearbyHospital, icon: Building2 },
    { id: 'ambulance-traffic', label: t.trafficCoordination, icon: NavIcon },
  ];

  // Mobile Bottom Navigation items
  const mobileBottomNav = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'my-health', label: t.myHealth, icon: Activity },
    { id: 'prediction', label: 'Predict', icon: Sparkles },
    { id: 'medicines', label: 'Meds', icon: Pill },
    { id: 'emergency', label: '108 SOS', icon: Siren, isEmergency: true },
  ];

  return (
    <>
      {/* Top Navigation for Desktop, Tablet, and Mobile scrolling chips */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-teal-100/80 sticky top-16 sm:top-20 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          
          {/* Primary Navigation Row */}
          <div className="flex items-center justify-start md:justify-between overflow-x-auto py-2 sm:py-2.5 gap-1.5 sm:gap-2 no-scrollbar">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4.5 py-1.5 sm:py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    item.isEmergency && isActive
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                      : item.isEmergency
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      : isActive
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-700 text-white shadow-md shadow-teal-600/20 scale-[1.02]'
                      : 'text-slate-600 hover:text-teal-900 hover:bg-teal-50/70'
                  } ${easyMode ? 'text-sm sm:text-lg py-2.5 sm:py-3 px-3.5 sm:px-4' : ''}`}
                >
                  <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 ${isActive ? 'text-white' : item.isEmergency ? 'text-rose-600' : 'text-teal-600'}`} />
                  <span>{item.label}</span>
                  {item.highlight && (
                    <span className="hidden md:inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Secondary Navigation Row (Quick links to key modules) */}
          <div className="flex items-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 border-t border-slate-100/90 text-xs text-slate-500 overflow-x-auto no-scrollbar">
            <span className="font-bold text-teal-800/60 uppercase tracking-wider text-[10px] hidden sm:inline shrink-0">
              Quick Modules:
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {secondaryNav.map((sub) => {
                const SubIcon = sub.icon;
                const isSubActive = activeTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    id={`subnav-${sub.id}`}
                    onClick={() => setActiveTab(sub.id)}
                    className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      isSubActive
                        ? 'bg-teal-100/80 text-teal-900 font-black border border-teal-300/80 shadow-2xs'
                        : 'hover:bg-teal-50/60 text-slate-600'
                    }`}
                  >
                    <SubIcon className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (< 768px) for effortless thumb reach */}
      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-teal-100 shadow-xl px-1.5 py-1.5 flex items-center justify-around"
      >
        {mobileBottomNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1.5 rounded-xl transition-all cursor-pointer ${
                item.isEmergency
                  ? isActive
                    ? 'text-rose-600 font-black scale-105'
                    : 'text-rose-600/90 font-bold'
                  : isActive
                  ? 'text-teal-700 font-black scale-105'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl mb-0.5 relative transition-colors ${
                  item.isEmergency
                    ? isActive
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : 'bg-rose-50 text-rose-600 border border-rose-200'
                    : isActive
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                    : 'bg-transparent text-slate-600'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                {item.isEmergency && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </div>
              <span className="text-[10px] leading-tight font-bold">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

