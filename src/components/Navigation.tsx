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

  return (
    <nav className="bg-white border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Primary Navigation Row */}
        <div className="flex items-center justify-between overflow-x-auto py-2.5 gap-1.5 sm:gap-2">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  item.isEmergency && isActive
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                    : item.isEmergency
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    : isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:text-blue-900 hover:bg-blue-50/60'
                } ${easyMode ? 'text-base sm:text-lg py-3 px-4' : ''}`}
              >
                <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isActive ? 'text-white' : item.isEmergency ? 'text-rose-600' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.highlight && (
                  <span className="hidden md:inline-block w-2 h-2 rounded-full bg-sky-300 animate-pulse"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Secondary Navigation Row (Quick links to key modules) */}
        <div className="flex items-center gap-2 py-1.5 border-t border-slate-100 text-xs text-slate-500">
          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] hidden sm:inline">
            Quick Modules:
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {secondaryNav.map((sub) => {
              const SubIcon = sub.icon;
              const isSubActive = activeTab === sub.id;
              return (
                <button
                  key={sub.id}
                  id={`subnav-${sub.id}`}
                  onClick={() => setActiveTab(sub.id)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    isSubActive
                      ? 'bg-blue-100 text-blue-900 font-bold border border-blue-200'
                      : 'hover:bg-blue-50/70 text-slate-600'
                  }`}
                >
                  <SubIcon className="w-3.5 h-3.5" />
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </nav>
  );
};
