import React from 'react';
import {
  Navigation as NavIcon,
  Siren,
  Play,
  Pause,
  RotateCcw,
  Radio,
  CheckCircle2,
  Clock,
  Gauge,
  MapPin,
  Building2,
  ShieldAlert,
  Zap,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/i18n';
import { TrafficJunction } from '../types';

export const SmartTrafficCoordinationPage: React.FC = () => {
  const {
    ambulanceSim,
    toggleAmbulanceSimulation,
    resetAmbulanceSimulation,
    advanceAmbulanceStep,
    toggleGreenCorridor,
    triggerSignalPreemption,
    language,
    setActiveTab,
  } = useApp();

  const t = TRANSLATIONS[language];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-white/92 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-teal-100/90 shadow-xl shadow-teal-950/5 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-black uppercase tracking-widest text-teal-800">
              {language === 'te-IN'
                ? 'స్మార్ట్ ట్రాఫిక్ & గ్రీన్ కారిడార్ సమన్వయం'
                : language === 'hi-IN'
                ? 'स्मार्ट ट्रैफिक एवं ग्रीन कॉरिडोर समन्वय'
                : 'V2I Smart Traffic & Green Wave Preemption'}
            </span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight flex items-center gap-3">
            <span>{t.trafficCoordination}</span>
            {ambulanceSim.greenCorridorActive && (
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                Active Green Wave
              </span>
            )}
          </h1>
          <p className="mt-1 text-slate-600 text-sm font-medium">
            {language === 'te-IN'
              ? 'అంబులెన్స్ ప్రయాణ సమయాన్ని తగ్గించడానికి ట్రాఫిక్ సిగ్నల్స్‌ను ఆటోమేటిక్‌గా గ్రీన్ లైట్‌గా క్లియర్ చేసే స్మార్ట్ సిస్టమ్.'
              : language === 'hi-IN'
              ? 'आपातकालीन एम्बुलेंस के लिए सिग्नलों को स्वतः हरा कर सुरक्षित मार्ग सुनिश्चित करने वाली उन्नत V2I प्रणाली।'
              : 'Automated signal preemption system dynamically clearing city intersections for critical emergency vehicles.'}
          </p>
        </div>

        {/* Simulation Control Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={toggleAmbulanceSimulation}
            className={`px-4 py-2.5 rounded-2xl font-display font-black text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md cursor-pointer ${
              ambulanceSim.isRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
            }`}
          >
            {ambulanceSim.isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>{language === 'te-IN' ? 'తాత్కాలికంగా ఆపు' : 'Pause Simulation'}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>{language === 'te-IN' ? 'సిమ్యులేషన్ ప్రారంభించు' : 'Start Simulation'}</span>
              </>
            )}
          </button>

          <button
            onClick={advanceAmbulanceStep}
            className="px-3.5 py-2.5 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-black border border-teal-200 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="Step to next junction"
          >
            <ChevronRight className="w-4 h-4 text-teal-700" />
            <span>Step</span>
          </button>

          <button
            onClick={resetAmbulanceSimulation}
            className="p-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-all shadow-2xs cursor-pointer"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Telemetry Dashboard Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/92 backdrop-blur-xl rounded-2xl p-4 border border-teal-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-bold">Vehicle Unit</span>
            <Siren className="w-4 h-4 text-rose-600 animate-pulse" />
          </div>
          <div className="font-display font-black text-slate-900 text-sm sm:text-base truncate">
            {ambulanceSim.ambulanceCode}
          </div>
          <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block mt-0.5">
            ALS Mobile ICU
          </span>
        </div>

        <div className="bg-white/92 backdrop-blur-xl rounded-2xl p-4 border border-teal-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-bold">Estimated ETA</span>
            <Clock className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="font-mono font-black text-2xl text-teal-800">
            {ambulanceSim.etaMinutes} <span className="text-xs font-bold font-sans text-slate-500">mins</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
            {ambulanceSim.distanceRemainingKm.toFixed(1)} km remaining
          </span>
        </div>

        <div className="bg-white/92 backdrop-blur-xl rounded-2xl p-4 border border-teal-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-bold">Telemetry Speed</span>
            <Gauge className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="font-mono font-black text-2xl text-slate-900">
            {ambulanceSim.currentSpeedKmH} <span className="text-xs font-bold font-sans text-slate-500">km/h</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 block mt-0.5">
            Speed Profile: Rapid Transit
          </span>
        </div>

        <div className="bg-white/92 backdrop-blur-xl rounded-2xl p-4 border border-teal-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-bold">Corridor Status</span>
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
          </div>
          <div className="font-display font-black text-emerald-800 text-sm sm:text-base">
            {ambulanceSim.greenCorridorActive ? 'Priority Active' : 'Standard Queue'}
          </div>
          <button
            onClick={toggleGreenCorridor}
            className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline block mt-0.5 cursor-pointer"
          >
            {ambulanceSim.greenCorridorActive ? 'Disable Green Wave' : 'Enable Green Wave'}
          </button>
        </div>
      </div>

      {/* Visual Junctions Pipeline */}
      <div className="bg-white/92 backdrop-blur-xl rounded-3xl p-6 border border-teal-100 shadow-xl shadow-teal-950/5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-black text-lg text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <span>Traffic Junction Signal Sequence</span>
          </h2>
          <span className="text-xs font-bold text-slate-500">
            Destination: {ambulanceSim.hospitalName}
          </span>
        </div>

        <div className="space-y-3">
          {ambulanceSim.junctions.map((junc: TrafficJunction, idx: number) => {
            const isCurrent = idx === ambulanceSim.currentJunctionIndex;
            const isPassed = idx < ambulanceSim.currentJunctionIndex;
            return (
              <div
                key={junc.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCurrent
                    ? 'bg-teal-50/80 border-teal-300 ring-2 ring-teal-400/30 shadow-md'
                    : isPassed
                    ? 'bg-slate-50/60 border-slate-200 opacity-75'
                    : 'bg-white border-teal-100/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-sm ${
                      isPassed
                        ? 'bg-emerald-100 text-emerald-800'
                        : isCurrent
                        ? 'bg-teal-600 text-white animate-pulse'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                  </div>

                  <div>
                    <h4 className="font-display font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <span>{junc.name}</span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-600 text-white uppercase">
                          Ambulance Approaching
                        </span>
                      )}
                    </h4>
                    <span className="text-xs text-slate-500">
                      {junc.distanceKm} km from departure • Expected clearance: {junc.crossingTimeSec}s
                    </span>
                  </div>
                </div>

                {/* Signal indicator & preemption */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-mono text-xs font-black">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        junc.signalState === 'GREEN'
                          ? 'bg-emerald-400 shadow-md shadow-emerald-400/50'
                          : junc.signalState === 'CLEARING' || junc.signalState === 'YELLOW'
                          ? 'bg-amber-400'
                          : 'bg-rose-500'
                      }`}
                    ></span>
                    <span>{junc.signalState}</span>
                  </div>

                  {!junc.preempted && (
                    <button
                      onClick={() => triggerSignalPreemption(junc.id)}
                      className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-black border border-teal-200 transition-all cursor-pointer"
                    >
                      Preempt Signal
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Coordination Logs */}
      {ambulanceSim.logs && ambulanceSim.logs.length > 0 && (
        <div className="bg-slate-950 rounded-3xl p-5 border border-slate-800 text-slate-200 shadow-xl space-y-2 font-mono text-xs">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Radio className="w-4 h-4" />
            <span>Encrypted Emergency Telemetry Stream</span>
          </div>
          {ambulanceSim.logs.map((log: string, idx: number) => (
            <div key={idx} className="text-slate-300 flex items-start gap-2">
              <span className="text-teal-400 shrink-0">&gt;</span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
