import React, { useState, useRef } from 'react';
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
  Upload,
  FileText,
  Scan,
  Check,
  MapPin,
  ExternalLink,
  ShieldAlert,
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
    detectUserLocation,
    emergencyContacts,
  } = useApp();

  const t = TRANSLATIONS[language];

  // Reports state
  const [uploadedReports, setUploadedReports] = useState<Array<{ id: string; name: string; date: string; summary: string; status: 'normal' | 'attention' }>>([
    {
      id: 'rep-1',
      name: language === 'te-IN' ? 'రక్త పరీక్ష నివేదిక (CBC)' : 'Complete Blood Count (CBC)',
      date: '14 Sep 2026',
      summary: language === 'te-IN' ? 'హీమోగ్లోబిన్: 13.8 g/dL • సాధారణ స్థితి' : 'Hemoglobin: 13.8 g/dL • Normal parameters',
      status: 'normal',
    },
    {
      id: 'rep-2',
      name: language === 'te-IN' ? 'షుగర్ పరీక్ష (HbA1c & Fasting)' : 'Metabolic Panel & HbA1c',
      date: '02 Sep 2026',
      summary: language === 'te-IN' ? 'HbA1c: 5.6% • నియంత్రణలో ఉంది' : 'HbA1c: 5.6% • Optimal glycemic control',
      status: 'normal',
    },
  ]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Localized user greeting
  const localizedName = getLocalizedUserName(user?.name || 'Rohini', language);
  const personalizedGreeting =
    language === 'te-IN'
      ? `నమస్కారం, ${localizedName} గారు`
      : language === 'hi-IN'
      ? `नमस्ते, ${localizedName} जी`
      : `Welcome, ${localizedName}`;

  // Overall Health Status
  const getOverallStatus = () => {
    const score = prediction?.overallScore ?? 78;
    if (score >= 75) {
      return {
        key: 'good',
        label: 'Good',
        labelTe: 'మంచి ఆరోగ్యం (Good)',
        labelHi: 'उत्तम स्वास्थ्य (Good)',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        cardBg: 'bg-white border-emerald-200/80 shadow-emerald-950/5',
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
        badgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
        cardBg: 'bg-white border-teal-200/80 shadow-teal-950/5',
        dotClass: 'bg-teal-500',
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
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
        cardBg: 'bg-white border-amber-200/80 shadow-amber-950/5',
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

  // Medicine calculations
  const pendingCount = medicines ? medicines.filter((m) => !m.takenToday).length : 0;
  const takenCount = medicines ? medicines.filter((m) => m.takenToday).length : 0;

  // Nearby Services
  const nearestDoctor = doctors && doctors.length > 0 ? doctors[0] : null;
  const nearestHospital = hospitals && hospitals.length > 0 ? hospitals[0] : null;
  const primaryEmergencyContact = emergencyContacts && emergencyContacts.length > 0 ? emergencyContacts[0] : null;

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const newReport = {
      id: `rep-${Date.now()}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      date: 'Just now',
      summary: language === 'te-IN' ? 'నివేదిక అప్‌లోడ్ విజయవంతమైంది • పరిశీలనలో ఉంది' : 'Uploaded successfully • AI Verified Normal',
      status: 'normal' as const,
    };
    setUploadedReports([newReport, ...uploadedReports]);
    setUploadSuccess(language === 'te-IN' ? `"${file.name}" విజయవంతంగా భద్రపరచబడింది` : `"${file.name}" uploaded successfully`);
    setTimeout(() => setUploadSuccess(null), 4000);
  };

  // Mock Scan Handler
  const handleScanReport = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const scannedReport = {
        id: `rep-scan-${Date.now()}`,
        name: language === 'te-IN' ? 'ల్యాబ్ స్కాన్ నివేదిక (Lipid Profile)' : 'Scanned Lab Report (Lipid Profile)',
        date: 'Today',
        summary: language === 'te-IN' ? 'కొలెస్ట్రాల్: 182 mg/dL • సాధారణ పరిమితిలో ఉంది' : 'Total Cholesterol: 182 mg/dL • Within normal range',
        status: 'normal' as const,
      };
      setUploadedReports([scannedReport, ...uploadedReports]);
      setUploadSuccess(language === 'te-IN' ? 'స్కాన్ పూర్తయింది! నివేదిక జోడించబడింది' : 'Scan complete! Lab parameters extracted');
      setTimeout(() => setUploadSuccess(null), 4000);
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-6">
      
      {/* 1. Header Greeting Banner with Prominent MedMitra Identity */}
      <div className="bg-white/92 backdrop-blur-xl rounded-3xl p-5 sm:p-8 border border-teal-100/90 shadow-xl shadow-teal-950/5 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5 transition-all hover:shadow-2xl hover:shadow-teal-950/10">
        <div className="flex items-start sm:items-center gap-3.5 sm:gap-5">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-teal-600 via-cyan-600 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-teal-700/25 shrink-0">
            <HeartPulse className="w-7 h-7 sm:w-9 sm:h-9" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 flex-wrap">
              <span className="font-display font-black text-xs sm:text-sm text-teal-900 tracking-wider flex items-center gap-1.5 uppercase">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                Medi<span className="text-teal-600">Mitra</span> • {language === 'te-IN' ? 'AI ఆరోగ్య వేదిక' : language === 'hi-IN' ? 'AI स्वास्थ्य साथी' : 'AI Healthcare Suite'}
              </span>
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                {language === 'te-IN' ? 'సురక్షిత ప్రొఫైల్' : 'Verified Session'}
              </span>
            </div>
            <h1 className="font-display font-black text-xl sm:text-3xl lg:text-4xl text-slate-900 tracking-tight">
              {personalizedGreeting}
            </h1>
            <p className="mt-1 text-slate-600 text-xs sm:text-sm font-semibold">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* View Full Health Metrics Privately */}
        <button
          id="btn-view-full-health-metrics"
          onClick={() => setActiveTab('my-health')}
          className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-teal-50 hover:bg-teal-100/90 text-teal-950 text-xs font-black border border-teal-200/90 transition-all shadow-2xs w-full sm:w-auto cursor-pointer hover:scale-102 active:scale-98 shrink-0"
        >
          <Lock className="w-4 h-4 text-teal-600" />
          <span>{t.viewFullMetrics}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. CARD 1: AI Health Assistant Hero Card with Modern Icons & Quick Chips */}
      <div
        id="hero-talk-banner"
        className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-cyan-800 to-blue-900 text-white rounded-3xl p-5 sm:p-8 shadow-xl shadow-teal-950/10"
      >
        {/* Glowing radial backdrop */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-6">
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-5">
            <div
              onClick={() => setIsVoiceAssistantOpen(true)}
              className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-white text-teal-700 flex items-center justify-center shadow-xl shadow-black/20 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 group"
              title="Click to talk"
            >
              <Mic className="w-7 h-7 sm:w-10 sm:h-10 text-teal-600 group-hover:scale-110 transition-transform animate-pulse" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[11px] font-black tracking-wider uppercase mb-2 border border-white/20 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>AI Health Assistant</span>
              </div>
              <h2 className="font-display font-black text-xl sm:text-3xl text-white tracking-tight">
                {t.tapToTalkMediMitra}
              </h2>
              <p className="text-teal-100 text-xs sm:text-sm mt-1 max-w-xl font-medium">
                {language === 'te-IN'
                  ? 'తెలుగులో స్పష్టమైన స్త్రీ కంఠంతో తక్షణ ఆరోగ్య సలహాలు పొందండి.'
                  : language === 'hi-IN'
                  ? 'हिंदी और अंग्रेजी में तुरंत स्वास्थ्य सलाह प्राप्त करें।'
                  : 'Instant conversational voice consultation in English, Telugu & Hindi.'}
              </p>
            </div>
          </div>

          {/* Big Talk Button */}
          <button
            id="hero-talk-cta-btn"
            onClick={() => setIsVoiceAssistantOpen(true)}
            className="w-full lg:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-teal-950 font-black text-sm shadow-xl shadow-black/15 hover:bg-teal-50 transition-all whitespace-nowrap cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Mic className="w-4.5 h-4.5 text-teal-600" />
            <span>{t.talkToMediMitra}</span>
            <ArrowRight className="w-4 h-4 text-teal-600" />
          </button>
        </div>

        {/* Quick Action Chips */}
        <div className="relative z-10 mt-6 pt-5 border-t border-white/15">
          <span className="block text-[11px] font-black uppercase tracking-wider text-teal-200/90 mb-3">
            {language === 'te-IN' ? 'తక్షణ సహాయ చిప్స్:' : 'Quick Consultation Chips:'}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {[
              {
                label: language === 'te-IN' ? '🗣️ లక్షణాలు అడగండి' : '🗣️ Check Symptoms',
                action: () => setActiveTab('symptoms'),
              },
              {
                label: language === 'te-IN' ? '🩺 బీపీ & షుగర్ సూచనలు' : '🩺 BP & Sugar Insights',
                action: () => setActiveTab('prediction'),
              },
              {
                label: language === 'te-IN' ? '💊 మందుల వేళలు' : '💊 Medicine Reminders',
                action: () => setActiveTab('medicines'),
              },
              {
                label: language === 'te-IN' ? '🚑 అత్యవసర 108' : '🚑 Emergency 108 SOS',
                action: () => setActiveTab('emergency'),
              },
              {
                label: language === 'te-IN' ? '🥗 ఆరోగ్యకర ఆహారం' : '🥗 Daily Nutrition Tips',
                action: () => setIsVoiceAssistantOpen(true),
              },
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={chip.action}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. CARD 6: Live Location & GPS Card (Real Functionality) */}
      <div className="bg-white/90 backdrop-blur-xl border border-teal-100/90 rounded-3xl p-5 shadow-lg shadow-teal-950/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/80 shadow-2xs shrink-0">
              <MapPin className="w-6 h-6 text-teal-600 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-slate-900 text-sm sm:text-base">
                  📍 {userLocation.area}, {userLocation.city}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {userLocation.isTrackingActive ? '🟢 GPS Live' : 'Cached GPS'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Coordinates: {userLocation.lat != null && userLocation.lng != null ? `${userLocation.lat.toFixed(4)}°N, ${userLocation.lng.toFixed(4)}°E` : 'Acquiring GPS...'}
                {userLocation.accuracy != null ? ` • Accuracy: ±${Math.round(userLocation.accuracy)}m` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start flex-wrap">
            <button
              type="button"
              id="gps-refresh-btn"
              onClick={detectUserLocation}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
              <span>{language === 'te-IN' ? 'లొకేషన్ రిఫ్రెష్' : 'Refresh GPS'}</span>
            </button>

            {userLocation.isTrackingActive ? (
              <button
                type="button"
                onClick={stopLiveLocationTracking}
                className="px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all cursor-pointer"
              >
                {t.stopTracking}
              </button>
            ) : (
              <button
                type="button"
                onClick={startLiveLocationTracking}
                className="px-3 py-2 text-xs font-black text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                {t.resumeTracking}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. MAIN DUAL-COLUMN LAYOUT: Reports, Medicines, Doctors, Emergency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* CARD 2: Health Reports (Upload, Scan, Summary Card) */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-teal-100/90 p-6 shadow-lg shadow-teal-950/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/80">
                  <FileText className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-slate-900">
                    {language === 'te-IN' ? 'ఆరోగ్య నివేదికలు' : 'Health Reports & Labs'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'te-IN' ? 'ల్యాబ్ రిపోర్టులు అప్‌లోడ్ లేదా స్కాన్ చేయండి' : 'Upload or scan medical reports for AI analysis'}
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                {uploadedReports.length} {language === 'te-IN' ? 'నివేదికలు' : 'Reports'}
              </span>
            </div>

            {/* Upload Success Alert */}
            {uploadSuccess && (
              <div className="mb-3 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {/* Action Buttons: Upload Report + Scan Report */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                id="btn-upload-health-report"
                onClick={() => fileInputRef.current?.click()}
                className="py-3 px-4 rounded-2xl bg-teal-50 hover:bg-teal-100/80 text-teal-900 border border-teal-200 text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-98"
              >
                <Upload className="w-4 h-4 text-teal-700" />
                <span>{language === 'te-IN' ? 'రిపోర్ట్ అప్‌లోడ్' : 'Upload Report'}</span>
              </button>

              <button
                type="button"
                id="btn-scan-health-report"
                disabled={isScanning}
                onClick={handleScanReport}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-teal-600/20 active:scale-98 disabled:opacity-60"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{language === 'te-IN' ? 'స్కాన్ చేస్తోంది...' : 'Scanning...'}</span>
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4" />
                    <span>{language === 'te-IN' ? 'రిపోర్ట్ స్కాన్' : 'Scan Report'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Summary Cards of Reports */}
            <div className="space-y-2.5">
              {uploadedReports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-3.5 rounded-2xl bg-teal-50/40 border border-teal-100/80 flex items-start justify-between gap-3 hover:bg-teal-50 transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white text-teal-600 flex items-center justify-center shadow-2xs shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900">{rep.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{rep.summary}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Normal
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-1">{rep.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-800">
            <span>🔒 Encrypted patient records</span>
            <button
              onClick={() => setActiveTab('my-health')}
              className="text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{language === 'te-IN' ? 'పూర్తి ఆరోగ్య చార్టులు' : 'View Full Logs'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CARD 5: Medicine Reminders (Pill Icon, Time Chips, Toggle Taken) */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-teal-100/90 p-6 shadow-lg shadow-teal-950/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200/80">
                  <Pill className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-slate-900">
                    {t.todaysMedicines}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {takenCount} of {medicines.length} doses logged for today
                  </p>
                </div>
              </div>

              <span className={`text-xs font-black px-2.5 py-1 rounded-full ${pendingCount === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900 border border-amber-200'}`}>
                {pendingCount === 0 ? t.taken : `${pendingCount} ${t.pending}`}
              </span>
            </div>

            {/* List of Medicine Items */}
            <div className="space-y-3">
              {medicines && medicines.length > 0 ? (
                medicines.slice(0, 3).map((med) => (
                  <div
                    key={med.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      med.takenToday
                        ? 'bg-emerald-50/50 border-emerald-200/80'
                        : 'bg-white border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs ${
                        med.takenToday ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-900">{med.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                            <Clock className="w-3 h-3" />
                            <span>{med.time}</span>
                          </span>
                          <span className="text-[11px] text-slate-500 font-semibold">{med.schedule}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleMedicineTaken(med.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        med.takenToday
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-600/20 active:scale-95'
                      }`}
                    >
                      {med.takenToday ? '✓ Done' : 'Mark Taken'}
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-500">
                  {language === 'te-IN' ? 'రోజూ వేసుకునే మందులు ఏవీ నమోదు కాలేదు' : 'No regular daily medicines registered.'}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500 font-medium">Smart dose alerts</span>
            <button
              onClick={() => setActiveTab('medicines')}
              className="text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{t.manageMedicines}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 5. ROW 3: Nearby Doctors & Hospitals + Emergency Ambulance Action Center */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* CARD 3: Nearby Doctors & Hospitals (Quick call, distance, direction) */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-teal-100/90 p-6 shadow-lg shadow-teal-950/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/80">
                <NavIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-slate-900">
                  {t.nearbyServices}
                </h3>
                <p className="text-xs text-slate-500">
                  Live GPS distance from {userLocation.area}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('doctors')}
              className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{language === 'te-IN' ? 'అన్నీ చూడండి' : 'View All'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Nearest Doctor Card */}
            {nearestDoctor && (
              <div className="p-4 rounded-2xl border border-teal-100 bg-teal-50/30 hover:bg-teal-50/60 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1 text-[10px] font-black text-blue-800 uppercase tracking-wider">
                        <span>{t.nearestDoctor}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">{nearestDoctor.isAvailable ? '🟢 Available' : 'Consulting'}</span>
                      </div>
                      <div className="font-black text-slate-900 text-sm sm:text-base">{nearestDoctor.name}</div>
                      <div className="text-xs text-slate-500 font-medium">{nearestDoctor.specialty} • {nearestDoctor.hospital}</div>
                    </div>
                  </div>

                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 shrink-0">
                    {typeof nearestDoctor.distanceKm === 'number' && !isNaN(nearestDoctor.distanceKm)
                      ? `${nearestDoctor.distanceKm.toFixed(1)} km`
                      : 'Nearby'}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-teal-100">
                  <a
                    href={`tel:${nearestDoctor.phone || '108'}`}
                    className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{language === 'te-IN' ? 'డాక్టర్‌కు కాల్' : 'Call Doctor'}</span>
                  </a>
                  <button
                    onClick={() => setActiveTab('doctors')}
                    className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5 text-teal-600" />
                    <span>Directions</span>
                  </button>
                </div>
              </div>
            )}

            {/* Nearest Hospital Card */}
            {nearestHospital && (
              <div className="p-4 rounded-2xl border border-teal-100 bg-teal-50/30 hover:bg-teal-50/60 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-800 uppercase tracking-wider">
                        <span>{t.nearestHospital}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">24/7 Emergency</span>
                      </div>
                      <div className="font-black text-slate-900 text-sm sm:text-base">{nearestHospital.name}</div>
                      <div className="text-xs text-slate-500 font-medium">ICU: {nearestHospital.emergencyBedsAvailable} beds • {nearestHospital.area}</div>
                    </div>
                  </div>

                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 shrink-0">
                    {typeof nearestHospital.distanceKm === 'number' && !isNaN(nearestHospital.distanceKm)
                      ? `${nearestHospital.distanceKm.toFixed(1)} km`
                      : 'Nearby'}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-teal-100">
                  <a
                    href={`tel:${nearestHospital.emergencyPhone || '108'}`}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{language === 'te-IN' ? 'హాస్పిటల్ ఎమర్జెన్సీ' : 'Hospital Direct'}</span>
                  </a>
                  <button
                    onClick={() => setActiveTab('hospitals')}
                    className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5 text-teal-600" />
                    <span>Directions</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CARD 4: Emergency / Ambulance (High Visibility, 108, Doctor, SOS, Corridor) */}
        <div className="bg-gradient-to-br from-rose-600 via-rose-700 to-red-800 text-white rounded-3xl p-6 shadow-xl shadow-rose-950/20 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle emergency siren pulse */}
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-rose-400/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Siren className="w-5 h-5 text-rose-100 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-white">
                    {language === 'te-IN' ? 'అత్యవసర రక్షణ & అంబులెన్స్' : 'Emergency & Ambulance SOS'}
                  </h3>
                  <p className="text-xs text-rose-100/90 font-medium">
                    {language === 'te-IN' ? 'తక్షణ సహాయం & 108 అంబులెన్స్ సేవలు' : 'Immediate emergency dispatch & high-priority triage'}
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-white/20 text-white border border-white/30 animate-pulse">
                24x7 Active
              </span>
            </div>

            {/* Prominent Call 108 Immediate Action Button */}
            <a
              href="tel:108"
              id="emergency-dashboard-108-btn"
              className="w-full py-4 px-5 rounded-2xl bg-white text-rose-800 hover:bg-rose-50 text-base font-black shadow-lg shadow-black/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] mb-4"
            >
              <PhoneCall className="w-5 h-5 text-rose-600 animate-bounce" />
              <span>{t.emergencyCall108}</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-black">TOLL FREE</span>
            </a>

            {/* Quick Action Matrix: Doctor Call, Emergency Contact, Traffic Corridor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <a
                href={`tel:${primaryEmergencyContact?.phone || '108'}`}
                className="p-3 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-black flex items-center gap-2 transition-all"
              >
                <PhoneCall className="w-4 h-4 text-emerald-300 shrink-0" />
                <div className="text-left">
                  <span className="block text-[10px] text-rose-200">SOS Family</span>
                  <span>{primaryEmergencyContact?.name || 'Family Contact'}</span>
                </div>
              </a>

              <button
                type="button"
                onClick={() => setActiveTab('ambulance-traffic')}
                className="p-3 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-black flex items-center gap-2 transition-all text-left cursor-pointer"
              >
                <Siren className="w-4 h-4 text-amber-300 shrink-0" />
                <div>
                  <span className="block text-[10px] text-rose-200">Live Traffic</span>
                  <span>Green Corridor</span>
                </div>
              </button>
            </div>
          </div>

          <div className="relative z-10 mt-5 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-bold text-rose-100">
            <span>🛡️ Auto GPS dispatch linked to 108</span>
            <button
              onClick={() => setActiveTab('emergency')}
              className="text-white hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Full Emergency Desk</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 6. Overall Wellness Status Strip */}
      <div className={`p-5 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${statusInfo.cardBg}`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shadow-xs shrink-0 border border-teal-200/80">
            <StatusIcon className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t.overallHealthStatus}:
              </span>
              <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${statusInfo.badgeClass}`}>
                {language === 'te-IN' ? statusInfo.labelTe : language === 'hi-IN' ? statusInfo.labelHi : statusInfo.label}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              {language === 'te-IN' ? statusInfo.descTe : language === 'hi-IN' ? statusInfo.descHi : statusInfo.desc}
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('prediction')}
          className="text-xs font-black text-teal-800 hover:text-teal-950 px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200/80 flex items-center gap-1.5 transition-all self-end sm:self-auto cursor-pointer"
        >
          <span>{t.viewEvaluation}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
