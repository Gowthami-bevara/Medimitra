import React from 'react';
import {
  Mic,
  Activity,
  Sparkles,
  UserCheck,
  Building2,
  Pill,
  ShieldCheck,
  Lock,
  ArrowRight,
  HeartPulse,
  Siren,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  Info,
  Navigation as NavIcon,
  PhoneCall,
  Clock,
  Compass,
  RefreshCw,
  Droplets,
  Moon,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/i18n';
import { getLocalizedUserName } from '../utils/nameTransliteration';

export const HomePage: React.FC = () => {
  const {
    user,
    prediction,
    healthProfile,
    medicines,
    doctors,
    hospitals,
    toggleMedicineTaken,
    setActiveTab,
    setIsVoiceAssistantOpen,
    language,
    easyMode,
    userLocation,
    startLiveLocationTracking,
    stopLiveLocationTracking,
  } = useApp();

  const t = TRANSLATIONS[language];

  // Localized user greeting adhering strictly to Requirement 8:
  // English: "Rohini" / "Welcome, Rohini"
  // Telugu: "రోహిణి" / "నమస్కారం, రోహిణి గారు"
  // Hindi: "रोहिणी" / "नमस्ते, रोहिणी जी"
  const localizedName = getLocalizedUserName(user?.name || 'Rohini', language);
  const personalizedGreeting =
    language === 'te-IN'
      ? `నమస్కారం, ${localizedName} గారు`
      : language === 'hi-IN'
      ? `नमस्ते, ${localizedName} जी`
      : `Welcome, ${localizedName}`;

  // 1. Overall Health Status: "Good" / "Needs Attention" / "Stable" (Requirement 7.1)
  const getOverallStatus = () => {
    const score = prediction?.overallScore ?? 78;
    if (score >= 75) {
      return {
        key: 'good',
        label: 'Good',
        labelTe: 'మంచి ఆరోగ్యం (Good)',
        labelHi: 'उत्तम स्वास्थ्य (Good)',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        cardBg: 'bg-emerald-50/60 border-emerald-200',
        dotClass: 'bg-emerald-500',
        icon: CheckCircle2,
        desc: 'All core routine lifestyle markers are well within balanced parameters.',
        descTe: 'అన్ని దినచర్య అలవాట్లు స్థిరంగా మరియు ఆరోగ్యకరంగా ఉన్నాయి.',
        descHi: 'सभी दिनचर्या की आदतें संतुलित और अच्छी स्थिति में हैं।',
      };
    } else if (score >= 55) {
      return {
        key: 'stable',
        label: 'Stable',
        labelTe: 'స్థిరమైన ఆరోగ్యం (Stable)',
        labelHi: 'स्थिर स्वास्थ्य (Stable)',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
        cardBg: 'bg-blue-50/60 border-blue-200',
        dotClass: 'bg-blue-500',
        icon: Info,
        desc: 'Steady baseline habits. Following daily guidance keeps your vitality high.',
        descTe: 'స్థిరమైన ఆరోగ్యం. రోజూ సూచనలు పాటించడం ద్వారా మెరుగుపడుతుంది.',
        descHi: 'स्थिर स्थिति। दैनिक स्वास्थ्य सलाह का पालन करना लाभदायक है।',
      };
    } else {
      return {
        key: 'needs_attention',
        label: 'Needs Attention',
        labelTe: 'శ్రద్ధ అవసరం (Needs Attention)',
        labelHi: 'ध्यान देने योग्य (Needs Attention)',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        cardBg: 'bg-amber-50/60 border-amber-200',
        dotClass: 'bg-amber-500',
        icon: AlertTriangle,
        desc: 'A few routine habits need attention. Check suggestions for small adjustments.',
        descTe: 'కొన్ని అలవాట్లను మెరుగుపరచాలి. సలహాలు పరిశీలించండి.',
        descHi: 'कुछ आदतों में सुधार आवश्यक है। सुझाव देखें।',
      };
    }
  };

  const statusInfo = getOverallStatus();
  const StatusIcon = statusInfo.icon;

  // 2. Daily Wellness Guidance (Simple action card - Requirement 7.2)
  const getDailyGuidance = () => {
    if (healthProfile?.typicalWater && healthProfile.typicalWater < 2) {
      return {
        title: language === 'te-IN' ? 'మంచి నీళ్లు తాగండి' : language === 'hi-IN' ? 'पानी पिएं' : 'Hydration Guidance',
        action: language === 'te-IN' ? 'ఈ రోజు మరో 2 గ్లాసుల నీళ్లు తాగండి' : language === 'hi-IN' ? 'आज 2 और गिलास पानी पिएं' : 'Drink 2 more glasses of water today',
        tip: language === 'te-IN' ? 'శరీరం చల్లగా మరియు ఆరోగ్యంగా ఉంటుంది.' : 'Keeps body energized and digestion smooth.',
        icon: Droplets,
        color: 'text-blue-600 bg-blue-50 border-blue-200',
      };
    }
    if (healthProfile?.typicalSleep && healthProfile.typicalSleep < 6) {
      return {
        title: language === 'te-IN' ? 'విశ్రాంతి తీసుకోండి' : language === 'hi-IN' ? 'आराम करें' : 'Rest Guidance',
        action: language === 'te-IN' ? 'ఈ రాత్రి కనీసం 7 గంటలు ప్రశాంతంగా నిద్రపోండి' : language === 'hi-IN' ? 'आज रात कम से कम 7 घंटे की नींद लें' : 'Aim for at least 7 hours of restorative sleep tonight',
        tip: language === 'te-IN' ? 'రోజూ తగినంత నిద్ర రోగనిరోధక శక్తిని పెంచుతుంది.' : 'Adequate sleep improves recovery and immune health.',
        icon: Moon,
        color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      };
    }
    return {
      title: language === 'te-IN' ? 'రోజువారీ నడక' : language === 'hi-IN' ? 'दैनिक टहलना' : 'Daily Movement',
      action: language === 'te-IN' ? 'సాయంత్రం 20 నిమిషాలు నడవండి' : language === 'hi-IN' ? 'शाम को 20 मिनट टहलें' : 'Take a light 20-minute walk in the evening',
      tip: language === 'te-IN' ? 'గుండె ఆరోగ్యానికి మరియు రక్త ప్రసరణకు మంచిది.' : 'Supports cardiovascular wellness and blood pressure stability.',
      icon: Activity,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    };
  };

  const dailyGuidance = getDailyGuidance();
  const GuidanceIcon = dailyGuidance.icon;

  // 3. Today's Medicines (Requirement 7.3)
  const nextMedicine = medicines && medicines.length > 0 ? medicines[0] : null;
  const pendingCount = medicines ? medicines.filter((m) => !m.takenToday).length : 0;
  const takenCount = medicines ? medicines.filter((m) => m.takenToday).length : 0;

  // 5. Nearby Services (Nearest doctor & hospital - Requirement 7.5)
  const nearestDoctor = doctors && doctors.length > 0 ? doctors[0] : null;
  const nearestHospital = hospitals && hospitals.length > 0 ? hospitals[0] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* 1. Header with Language-Adaptive Greeting & Privacy Safeguard */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">
              {t.activeTracking || 'Protected Health Profile'}
            </span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-slate-900 tracking-tight">
            {personalizedGreeting}
          </h1>
          <p className="mt-1 text-slate-500 text-sm font-medium">
            {t.tagline}
          </p>
        </div>

        {/* Dedicated Toggle to View Full Health Metrics Privately */}
        <button
          id="btn-view-full-health-metrics"
          onClick={() => setActiveTab('my-health')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-colors shadow-2xs self-start md:self-auto cursor-pointer"
        >
          <Lock className="w-4 h-4 text-blue-600" />
          <span>{t.viewFullMetrics}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Live GPS Tracking & Location Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className={`w-3 h-3 rounded-full ${userLocation.isTrackingActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
          <div>
            <span className="font-bold text-slate-800">
              📍 {userLocation.area}, {userLocation.city}
            </span>
            <span className="text-[11px] text-slate-500 ml-2">
              (GPS: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)})
              {userLocation.accuracy ? ` • Acc: ±${Math.round(userLocation.accuracy)}m` : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {userLocation.isTrackingActive ? (
            <button
              type="button"
              onClick={stopLiveLocationTracking}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              {t.stopTracking}
            </button>
          ) : (
            <button
              type="button"
              onClick={startLiveLocationTracking}
              className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{t.resumeTracking}</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Quick Voice Assistant Hero Banner: "Tap to Talk to MediMitra" (Requirement 7.4) */}
      <div
        id="hero-talk-banner"
        onClick={() => setIsVoiceAssistantOpen(true)}
        className="cursor-pointer relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-600/20 hover:scale-[1.01] active:scale-[0.99] transition-all group"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 text-center sm:text-left">
            <div className="w-16 h-16 rounded-2xl bg-white text-blue-700 flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform shrink-0">
              <Mic className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-[11px] font-bold tracking-wider uppercase mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                <span>Full-Screen AI Voice Assistant</span>
              </div>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
                {t.tapToTalkMediMitra}
              </h2>
              <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl font-medium">
                {language === 'te-IN'
                  ? 'తెలుగులో స్పష్టమైన స్త్రీ కంఠంతో ఆరోగ్య సలహాలు పొందండి.'
                  : language === 'hi-IN'
                  ? 'हिंदी और अंग्रेजी में तुरंत स्वास्थ्य सलाह प्राप्त करें।'
                  : 'Instant voice consultation in English, Telugu & Hindi.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-blue-900 font-extrabold text-sm shadow-md group-hover:bg-blue-50 transition-colors whitespace-nowrap">
            <span>{t.talkToMediMitra}</span>
            <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* PRIVACY-SAFE SUMMARY CARDS (NO RAW BIOMETRICS ON HOME) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* CARD 1: Overall Health Status (Requirement 7.1) */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between ${statusInfo.cardBg}`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t.overallHealthStatus}
              </span>
              <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${statusInfo.badgeClass}`}>
                {language === 'te-IN' ? statusInfo.labelTe : language === 'hi-IN' ? statusInfo.labelHi : statusInfo.label}
              </span>
            </div>
            <div className="flex items-center gap-3 my-2">
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-xs">
                <StatusIcon className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h3 className="font-display font-black text-xl text-slate-900">
                  {language === 'te-IN' ? statusInfo.labelTe : language === 'hi-IN' ? statusInfo.labelHi : statusInfo.label}
                </h3>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mt-2">
              {language === 'te-IN' ? statusInfo.descTe : language === 'hi-IN' ? statusInfo.descHi : statusInfo.desc}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Biometrics hidden</span>
            <button
              onClick={() => setActiveTab('prediction')}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{t.viewEvaluation}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CARD 2: Daily Wellness Guidance (Requirement 7.2) */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t.dailyGuidance}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                Today
              </span>
            </div>
            <div className="flex items-center gap-3 my-2">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${dailyGuidance.color}`}>
                <GuidanceIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500">{dailyGuidance.title}</span>
                <h3 className="font-display font-black text-base text-slate-900 leading-snug">
                  {dailyGuidance.action}
                </h3>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mt-2">
              {dailyGuidance.tip}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Action Card</span>
            <button
              onClick={() => setActiveTab('my-health')}
              className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Log Habits</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CARD 3: Today's Medicines (Requirement 7.3) */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t.todaysMedicines}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${pendingCount === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {pendingCount === 0 ? t.taken : `${pendingCount} ${t.pending}`}
              </span>
            </div>

            {nextMedicine ? (
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                      <Pill className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{nextMedicine.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{nextMedicine.time} ({nextMedicine.schedule})</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleMedicineTaken(nextMedicine.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      nextMedicine.takenToday
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {nextMedicine.takenToday ? '✓ Taken' : 'Mark Taken'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  {takenCount} of {medicines.length} doses logged for today.
                </p>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-500">
                {language === 'te-IN' ? 'రోజూ వేసుకునే మందులు ఏవీ నమోదు కాలేదు' : 'No regular daily medicines registered.'}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">{t.nextDose}</span>
            <button
              onClick={() => setActiveTab('medicines')}
              className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{t.manageMedicines}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* CARD 5: Nearby Services & Emergency Quick Call 108 (Requirement 7.5) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-black text-lg text-slate-900 flex items-center gap-2">
              <NavIcon className="w-5 h-5 text-blue-600" />
              <span>{t.nearbyServices}</span>
            </h3>
            <p className="text-xs text-slate-500">
              Sorted by live GPS distance from your current location ({userLocation.area}).
            </p>
          </div>

          {/* Emergency 108 Quick Call Button */}
          <a
            href="tel:108"
            id="emergency-108-call-btn"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-rose-600/20 transition-transform active:scale-95"
          >
            <PhoneCall className="w-4 h-4" />
            <span>{t.emergencyCall108}</span>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Nearest Doctor Card */}
          {nearestDoctor && (
            <div
              onClick={() => setActiveTab('doctors')}
              className="cursor-pointer p-4 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base group-hover:scale-105 transition-transform">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                    {t.nearestDoctor}
                  </span>
                  <div className="font-bold text-slate-900 text-sm">{nearestDoctor.name}</div>
                  <div className="text-xs text-slate-500">{nearestDoctor.specialty} • {nearestDoctor.hospital}</div>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800">
                  {nearestDoctor.distanceKm.toFixed(1)} km
                </span>
                <span className="block text-[10px] text-slate-400 mt-1">
                  {nearestDoctor.isAvailable ? '🟢 Available' : 'Consults'}
                </span>
              </div>
            </div>
          )}

          {/* Nearest Hospital Card */}
          {nearestHospital && (
            <div
              onClick={() => setActiveTab('hospitals')}
              className="cursor-pointer p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                    {t.nearestHospital}
                  </span>
                  <div className="font-bold text-slate-900 text-sm">{nearestHospital.name}</div>
                  <div className="text-xs text-slate-500">ICU: {nearestHospital.emergencyBedsAvailable} beds • {nearestHospital.area}</div>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800">
                  {nearestHospital.distanceKm.toFixed(1)} km
                </span>
                <span className="block text-[10px] text-emerald-600 font-bold mt-1">
                  24/7 Trauma Bay
                </span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* CORE APPLICATION NAVIGATION TILES */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg sm:text-xl text-slate-900">
            Core Healthcare Navigation
          </h2>
          <span className="text-xs text-slate-500">
            All features connected
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div
            onClick={() => setActiveTab('my-health')}
            className="cursor-pointer p-5 rounded-3xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Activity className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">{t.myHealth}</h4>
              <p className="text-xs text-slate-500 mt-1">Detailed sleep, water, steps, BMI & private biometric graphs.</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-blue-700 flex items-center justify-between">
              <span>Private View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div
            onClick={() => setActiveTab('prediction')}
            className="cursor-pointer p-5 rounded-3xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">{t.healthPrediction}</h4>
              <p className="text-xs text-slate-500 mt-1">Multi-category preventive evaluation & risk score radar.</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-indigo-700 flex items-center justify-between">
              <span>Open Evaluation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div
            onClick={() => setActiveTab('ambulance-traffic')}
            className="cursor-pointer p-5 rounded-3xl bg-rose-50/70 border border-rose-200 hover:border-rose-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center mb-3">
                <Siren className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">Smart Traffic Coordination</h4>
              <p className="text-xs text-slate-600 mt-1">Real-time green corridor simulation with live junction preemption.</p>
            </div>
            <div className="mt-4 pt-3 border-t border-rose-200/60 text-xs font-bold text-rose-700 flex items-center justify-between">
              <span>Simulate Corridor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div
            onClick={() => setActiveTab('symptoms')}
            className="cursor-pointer p-5 rounded-3xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">{t.symptomGuidance}</h4>
              <p className="text-xs text-slate-500 mt-1">Clinical guidance, triage levels and red-flag symptom warnings.</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-emerald-700 flex items-center justify-between">
              <span>Check Symptoms</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
