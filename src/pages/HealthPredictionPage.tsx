import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldCheck,
  Moon,
  Droplets,
  Activity,
  Footprints,
  Dumbbell,
  Smile,
  Zap,
  Heart,
  Pill,
  Utensils,
  CalendarCheck,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS, speakText, stopSpeaking } from '../utils/i18n';
import { CategoryScore } from '../types';

export const HealthPredictionPage: React.FC = () => {
  const { prediction, refreshPrediction, language, healthProfile } = useApp();
  const t = TRANSLATIONS[language];

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshPrediction();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleHearPrediction = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    let readoutText = '';
    if (language === 'te-IN') {
      readoutText = `మీ మొత్తం వెల్నెస్ స్కోరు ${prediction.overallScore} లో 100. స్థితి: ${prediction.status}. సానుకూల అంశాలు: ${prediction.positiveInsights.join('. ')}. శ్రద్ధ వహించాల్సిన అంశాలు: ${prediction.areasNeedingAttention.join('. ')}. ఇది వెల్నెస్ సూచన మాత్రమే, వైద్య నిర్ధారణ కాదు.`;
    } else if (language === 'hi-IN') {
      readoutText = `आपका समग्र कल्याण स्कोर 100 में से ${prediction.overallScore} है। स्थिति: ${prediction.status}। सकारात्मक बिंदु: ${prediction.positiveInsights.join('. ')}। ध्यान देने योग्य क्षेत्र: ${prediction.areasNeedingAttention.join('. ')}। यह केवल स्वास्थ्य मार्गदर्शन है, चिकित्सा निदान नहीं।`;
    } else {
      readoutText = `Your overall wellness prediction score is ${prediction.overallScore} out of 100, categorized as ${prediction.status}. Key positive highlights: ${prediction.positiveInsights.join('. ')}. Areas needing attention: ${prediction.areasNeedingAttention.join('. ')}. Remember, these are wellness indicators, not a medical diagnosis.`;
    }

    speakText(readoutText, language);
    setIsSpeaking(true);
  };

  const categoryIcons: Record<string, any> = {
    sleep: Moon,
    hydration: Droplets,
    physicalActivity: Activity,
    dailySteps: Footprints,
    exerciseConsistency: Dumbbell,
    mood: Smile,
    stress: Zap,
    mentalWellness: Heart,
    medicationAdherence: Pill,
    nutritionLifestyle: Utensils,
    generalWellnessConsistency: CalendarCheck,
  };

  const statusColors = {
    Good: 'text-blue-700 bg-blue-50 border-blue-200',
    'Needs Attention': 'text-amber-800 bg-amber-50 border-amber-200',
    'High Attention': 'text-rose-700 bg-rose-50 border-rose-200',
    'Not enough data': 'text-slate-500 bg-slate-100 border-slate-200',
  };

  const categoriesList = Object.entries(prediction.categories) as [string, CategoryScore][];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      
      {/* Header with Title and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-md bg-blue-100 text-blue-800">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-800">
              AI Multi-Source Wellness Scoring
            </span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-blue-950 tracking-tight">
            {t.healthPrediction}
          </h1>
          <p className="mt-1 text-slate-500 text-xs sm:text-sm max-w-2xl font-medium">
            Holistic wellness prediction synthesizing your health profile, daily sleep, hydration, activity, mood, stress, and medication adherence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            id="prediction-refresh-btn"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-colors shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{t.refreshPrediction}</span>
          </button>

          {/* Hear Prediction Button */}
          <button
            id="prediction-hear-btn"
            onClick={handleHearPrediction}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all ${
              isSpeaking
                ? 'bg-rose-600 text-white shadow-rose-600/20 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isSpeaking ? 'Stop Audio' : t.hearPrediction}</span>
          </button>
        </div>
      </div>

      {/* Main Score Hero Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl overflow-hidden relative">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* Circular Visual Gauge */}
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg className="w-36 h-36 -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="58"
                  stroke="#334155"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="58"
                  stroke={
                    prediction.overallScore >= 75
                      ? '#2563eb'
                      : prediction.overallScore >= 50
                      ? '#f59e0b'
                      : '#f43f5e'
                  }
                  strokeWidth="10"
                  strokeDasharray="364"
                  strokeDashoffset={364 - (364 * prediction.overallScore) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="font-display font-black text-4xl text-white">
                  {prediction.overallScore}
                </span>
                <span className="text-xs font-semibold text-slate-400">/ 100</span>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 bg-white/10 border border-white/20">
                <span>{prediction.status}</span>
                <span className={`w-2 h-2 rounded-full ${
                  prediction.overallScore >= 75
                    ? 'bg-blue-400'
                    : prediction.overallScore >= 50
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                }`}></span>
              </div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
                {t.wellnessScore}
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-md">
                Evaluated across 11 integrated health markers • {prediction.completenessPercentage}% metric profile completeness
              </p>
              <p className="text-[11px] text-blue-300 mt-2">
                Last calculated: {prediction.evaluatedAt}
              </p>
            </div>
          </div>

          {/* Quick Score Range Guide */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-xs space-y-2 w-full lg:w-72 shrink-0">
            <div className="font-bold text-white uppercase text-[10px] tracking-wider text-slate-400">
              Score Reference Status
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-400 font-semibold">75–100</span>
              <span className="text-slate-200">Good Wellness Baseline</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-amber-400 font-semibold">50–74</span>
              <span className="text-slate-200">Needs Daily Attention</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-rose-400 font-semibold">0–49</span>
              <span className="text-slate-200">High Attention Required</span>
            </div>
          </div>

        </div>
      </div>

      {/* Safety Notice Mandate */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="font-bold">Medical Safety Notice:</strong> These predictive scores are strictly holistic wellness indicators derived from everyday lifestyle tracking. They are <strong>not clinical medical diagnoses</strong> and do not calculate individual disease risks. Always consult a qualified physician for clinical evaluations.
        </p>
      </div>

      {/* 11 Category Scores Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg sm:text-xl text-blue-950">
            11 Integrated Wellness Categories
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            Complete Holistic Breakdown
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoriesList.map(([key, category]) => {
            const Icon = categoryIcons[key] || Activity;
            const hasData = category.score !== null;

            return (
              <div
                key={key}
                id={`cat-card-${key}`}
                className="bg-white rounded-2xl border border-blue-100 p-5 shadow-xs flex flex-col justify-between hover:border-blue-200 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-sm text-slate-900">
                        {category.label}
                      </h3>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        statusColors[category.status]
                      }`}
                    >
                      {category.status}
                    </span>
                  </div>

                  {/* Score & Progress Bar */}
                  {hasData ? (
                    <div className="space-y-1.5 my-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-display font-black text-lg text-slate-900">
                          {category.score}%
                        </span>
                        <span className="text-slate-400 font-semibold text-[11px]">Score</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            category.score! >= 75
                              ? 'bg-blue-600'
                              : category.score! >= 50
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${category.score}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="my-3 py-2 px-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500 font-medium">
                      {t.notEnoughData}
                    </div>
                  )}

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {category.explanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actionable Insights: Highlights, Attention, Recommendations & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Positive Highlights */}
        <div className="bg-white rounded-3xl border border-blue-100 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="font-display font-bold text-base text-blue-950 flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              {t.positiveHighlights}
            </h2>
            <ul className="space-y-3">
              {prediction.positiveInsights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Areas Needing Attention */}
        <div className="bg-white rounded-3xl border border-blue-100 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="font-display font-bold text-base text-blue-950 flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              {t.attentionAreas}
            </h2>
            <ul className="space-y-3">
              {prediction.areasNeedingAttention.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Personalized Recommendations */}
        <div className="bg-white rounded-3xl border border-blue-100 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="font-display font-bold text-base text-blue-950 flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-blue-600" />
              {t.wellnessSuggestions}
            </h2>
            <ul className="space-y-3">
              {prediction.personalizedSuggestions.map((sug, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span>{sug}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>

      {/* Health Trends Section */}
      <div className="bg-white rounded-3xl border border-blue-100 p-6 shadow-xs">
        <h2 className="font-display font-bold text-base text-blue-950 flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          {t.trends}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {prediction.trends.map((trend, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800">{trend.metric}</span>
                {trend.status === 'improving' ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Improving
                  </span>
                ) : trend.status === 'declining' ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-rose-700">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Low Movement
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                    <Minus className="w-3.5 h-3.5" />
                    Steady
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {trend.description}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
