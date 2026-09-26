import React, { useState } from 'react';
import {
  Activity,
  Moon,
  Droplets,
  Footprints,
  Smile,
  Zap,
  Utensils,
  Plus,
  Minus,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  Info,
  HeartHandshake,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/i18n';
import { MoodType } from '../types';

export const MyHealthPage: React.FC = () => {
  const { todayLog, updateTodayLog, healthProfile, prediction, setActiveTab, language } = useApp();
  const t = TRANSLATIONS[language];

  const [activeSubSection, setActiveSubSection] = useState<'all' | 'sleep' | 'water' | 'activity' | 'mental' | 'nutrition'>('all');

  const handleWaterAdd = (liters: number) => {
    const updated = Math.max(0, Math.min(8, Number((todayLog.waterIntakeLiters + liters).toFixed(2))));
    updateTodayLog({ waterIntakeLiters: updated });
  };

  const handleSleepHours = (delta: number) => {
    const updated = Math.max(2, Math.min(16, Number((todayLog.sleepDuration + delta).toFixed(1))));
    updateTodayLog({ sleepDuration: updated });
  };

  const handleStepsAdd = (stepsDelta: number) => {
    const updated = Math.max(0, Math.min(50000, todayLog.steps + stepsDelta));
    updateTodayLog({ steps: updated });
  };

  const moods: { type: MoodType; label: string; emoji: string }[] = [
    { type: 'great', label: 'Energetic', emoji: '😊' },
    { type: 'good', label: 'Calm & Good', emoji: '🙂' },
    { type: 'neutral', label: 'Neutral', emoji: '😐' },
    { type: 'low', label: 'Low / Tired', emoji: '😔' },
    { type: 'stressed', label: 'Stressed', emoji: '😣' },
    { type: 'anxious', label: 'Anxious', emoji: '😰' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-5 sm:p-8 border border-blue-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-md bg-blue-100 text-blue-800">
              <Activity className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
              Daily Wellness & Vitals Logging
            </span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-blue-950 tracking-tight">
            {t.myHealth}
          </h1>
          <p className="mt-1 text-slate-500 text-xs sm:text-sm max-w-2xl font-medium">
            Update your daily sleep, hydration, movement, and mood. Every entry immediately recalculates your holistic Health Prediction score.
          </p>
        </div>

        {/* Prediction Link Box */}
        <div
          onClick={() => setActiveTab('prediction')}
          className="cursor-pointer bg-slate-900 text-white rounded-2xl p-4 flex items-center gap-4 hover:bg-slate-800 transition-all self-start md:self-auto shadow-md"
        >
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {t.wellnessScore}
            </div>
            <div className="font-display font-black text-2xl text-blue-400">
              {prediction.overallScore}<span className="text-xs text-slate-400 font-normal">/100</span>
            </div>
            <div className="text-xs font-semibold text-slate-300">
              {prediction.status}
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-blue-400" />
        </div>
      </div>

      {/* Tracker Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Trackers' },
          { id: 'sleep', label: t.sleepTracker },
          { id: 'water', label: t.waterTracker },
          { id: 'activity', label: t.activityTracker },
          { id: 'mental', label: t.moodTracker },
          { id: 'nutrition', label: t.nutritionTracker },
        ].map((tab) => (
          <button
            key={tab.id}
            id={`my-health-tab-${tab.id}`}
            onClick={() => setActiveSubSection(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSubSection === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-blue-100 text-slate-600 hover:bg-blue-50/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. SLEEP TRACKER */}
        {(activeSubSection === 'all' || activeSubSection === 'sleep') && (
          <div className="bg-white rounded-3xl border border-blue-100 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg text-blue-950">
                      {t.sleepTracker}
                    </h2>
                    <span className="text-xs text-slate-500">
                      Optimal restorative benchmark: 7.0–9.0 hours
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 capitalize">
                  {todayLog.sleepQuality} quality
                </span>
              </div>

              {/* Sleep Counter */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 my-4 text-center">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Today's Sleep Duration
                </div>
                <div className="font-display font-black text-4xl text-blue-950 mb-4">
                  {todayLog.sleepDuration} <span className="text-lg text-slate-500 font-semibold">hours</span>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    id="sleep-minus-btn"
                    onClick={() => handleSleepHours(-0.5)}
                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 shadow-xs active:scale-95"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-600 px-3 py-1 bg-white rounded-lg border border-slate-200">
                    Adjust ±30 mins
                  </span>
                  <button
                    id="sleep-plus-btn"
                    onClick={() => handleSleepHours(0.5)}
                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 shadow-xs active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quality selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Sleep Restfulness Quality:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['poor', 'fair', 'good', 'excellent'] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => updateTodayLog({ sleepQuality: q })}
                      className={`py-2 text-xs font-bold rounded-xl border capitalize transition-all ${
                        todayLog.sleepQuality === q
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              Tip: Keeping consistent bedtime routines within 30 minutes enhances your immune resilience.
            </div>
          </div>
        )}

        {/* 2. WATER INTAKE TRACKER */}
        {(activeSubSection === 'all' || activeSubSection === 'water') && (
          <div className="bg-white rounded-3xl border border-blue-100 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg text-blue-950">
                      {t.waterTracker}
                    </h2>
                    <span className="text-xs text-slate-500">
                      Daily Target: 2.5–3.0 Liters
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                  {Math.round((todayLog.waterIntakeLiters / 2.5) * 100)}% of Target
                </span>
              </div>

              {/* Visual Water Gauge */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 my-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">Total Consumed Today</span>
                  <span className="font-display font-black text-2xl text-blue-700">
                    {todayLog.waterIntakeLiters.toFixed(2)} / 2.50 L
                  </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (todayLog.waterIntakeLiters / 2.5) * 100)}%` }}
                  />
                </div>

                {/* Quick Add Buttons */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <button
                    id="water-add-250-btn"
                    onClick={() => handleWaterAdd(0.25)}
                    className="py-2.5 bg-white hover:bg-blue-50 border border-blue-200 text-blue-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>250 ml (Glass)</span>
                  </button>
                  <button
                    id="water-add-500-btn"
                    onClick={() => handleWaterAdd(0.5)}
                    className="py-2.5 bg-white hover:bg-blue-50 border border-blue-200 text-blue-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>500 ml (Bottle)</span>
                  </button>
                  <button
                    id="water-reset-btn"
                    onClick={() => updateTodayLog({ waterIntakeLiters: 0 })}
                    className="py-2.5 bg-white hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-700 font-semibold text-xs rounded-xl transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              Proper cellular hydration reduces daytime fatigue, prevents tension headaches, and aids kidney filtration.
            </div>
          </div>
        )}

        {/* 3. ACTIVITY TRACKER */}
        {(activeSubSection === 'all' || activeSubSection === 'activity') && (
          <div className="bg-white rounded-3xl border border-blue-100 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Footprints className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg text-blue-950">
                      {t.activityTracker}
                    </h2>
                    <span className="text-xs text-slate-500">
                      Target: 7,500–10,000 steps daily
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                  {todayLog.activeMinutes} mins active
                </span>
              </div>

              {/* Steps logger */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 my-4 text-center">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Steps Logged Today
                </div>
                <div className="font-display font-black text-3xl sm:text-4xl text-blue-950 mb-3">
                  {todayLog.steps.toLocaleString()}
                </div>

                <div className="flex items-center justify-center gap-2">
                  <button
                    id="steps-add-500-btn"
                    onClick={() => handleStepsAdd(500)}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-800 rounded-xl shadow-xs active:scale-95"
                  >
                    +500 steps
                  </button>
                  <button
                    id="steps-add-1000-btn"
                    onClick={() => handleStepsAdd(1000)}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-800 rounded-xl shadow-xs active:scale-95"
                  >
                    +1,000 steps
                  </button>
                  <button
                    id="steps-add-2500-btn"
                    onClick={() => handleStepsAdd(2500)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs active:scale-95"
                  >
                    +2,500 steps
                  </button>
                </div>
              </div>

              {/* Exercise Log Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Logged Workout / Exercise Today?
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {todayLog.exerciseType || 'Walking, cardio, yoga or gym'}
                  </span>
                </div>
                <button
                  id="toggle-exercise-logged-btn"
                  onClick={() => updateTodayLog({ exerciseLogged: !todayLog.exerciseLogged })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    todayLog.exerciseLogged
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {todayLog.exerciseLogged ? '✓ Logged' : '+ Mark Completed'}
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              Regular daily movement reduces blood pressure and releases mood-elevating endorphins.
            </div>
          </div>
        )}

        {/* 4. MENTAL WELLNESS & STRESS TRACKER */}
        {(activeSubSection === 'all' || activeSubSection === 'mental') && (
          <div className="bg-white rounded-3xl border border-blue-100 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Smile className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg text-blue-950">
                      {t.moodTracker}
                    </h2>
                    <span className="text-xs text-slate-500">
                      Emotional balance & stress awareness
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 capitalize">
                  Current: {todayLog.mood}
                </span>
              </div>

              {/* Mood Selector Grid */}
              <div className="my-3">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  How are you feeling right now?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {moods.map((m) => (
                    <button
                      key={m.type}
                      onClick={() => updateTodayLog({ mood: m.type })}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        todayLog.mood === m.type
                          ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold shadow-xs scale-102'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="text-2xl mb-1">{m.emoji}</div>
                      <div className="text-xs">{m.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stress Slider */}
              <div className="mt-4 bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                  <span>Stress Level</span>
                  <span className="font-display font-extrabold text-sm text-amber-700">
                    {todayLog.stressLevel} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={todayLog.stressLevel}
                  onChange={(e) => updateTodayLog({ stressLevel: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                  <span>1 (Very Calm)</span>
                  <span>5 (Moderate)</span>
                  <span>10 (Overwhelmed)</span>
                </div>
              </div>
            </div>

            {/* Supportive safe guidance note */}
            <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-start gap-2 text-xs text-blue-900">
              <HeartHandshake className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-tight">
                Mental wellness indicators reflect natural emotional fluctuations. If feeling persistent distress, remember you can reach out to trusted friends, family, or healthcare professionals.
              </p>
            </div>
          </div>
        )}

        {/* 5. NUTRITION & LIFESTYLE */}
        {(activeSubSection === 'all' || activeSubSection === 'nutrition') && (
          <div className="bg-white rounded-3xl border border-blue-100 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg text-blue-950">
                      {t.nutritionTracker}
                    </h2>
                    <span className="text-xs text-slate-500">
                      Meal timing regularity & balanced habits
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Today's Meal Timing Consistency:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['regular', 'irregular', 'balanced'] as const).map((pat) => (
                      <button
                        key={pat}
                        onClick={() => updateTodayLog({ nutritionConsistency: pat })}
                        className={`py-2 text-xs font-bold rounded-xl border capitalize transition-all ${
                          todayLog.nutritionConsistency === pat
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {pat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="text-xs font-bold text-slate-800">
                    General Healthy Eating Guidelines:
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside leading-relaxed">
                    <li>Maintain consistent meal times to support steady blood glucose.</li>
                    <li>Incorporate wholesome vegetables, whole grains, and fresh fruits.</li>
                    <li>Avoid extreme food restriction or skipping meals unnecessarily.</li>
                    <li>Drink water 30 minutes before or after meals for optimal digestion.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              MediMitra encourages mindful, balanced nourishment rather than restrictive dieting.
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
