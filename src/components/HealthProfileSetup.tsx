import React, { useState } from 'react';
import {
  Heart,
  Activity,
  Droplets,
  Moon,
  Footprints,
  Dumbbell,
  Smile,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/i18n';
import { HealthProfile, PhysicalActivityLevel, ExerciseFrequency, MoodType, StressLevel, NutritionPattern } from '../types';
import { VoiceFirstRegistration } from './VoiceFirstRegistration';

interface HealthProfileSetupProps {
  initialProfile?: HealthProfile | null;
  onCompleted?: () => void;
  isEditing?: boolean;
}

export const HealthProfileSetup: React.FC<HealthProfileSetupProps> = ({
  initialProfile,
  onCompleted,
  isEditing = false,
}) => {
  const { updateHealthProfile, skipHealthProfile, language } = useApp();
  const t = TRANSLATIONS[language];

  // Default to Voice-First registration unless editing existing profile
  const [useVoiceMode, setUseVoiceMode] = useState<boolean>(!isEditing);

  if (useVoiceMode) {
    return (
      <VoiceFirstRegistration
        onCancel={() => setUseVoiceMode(false)}
        onCompleted={onCompleted}
      />
    );
  }

  // Form states with fallback to initial or defaults
  const [age, setAge] = useState<string>(initialProfile?.age ? String(initialProfile.age) : '26');
  const [height, setHeight] = useState<string>(initialProfile?.height ? String(initialProfile.height) : '168');
  const [weight, setWeight] = useState<string>(initialProfile?.weight ? String(initialProfile.weight) : '64');
  const [typicalSleep, setTypicalSleep] = useState<string>(
    initialProfile?.typicalSleep ? String(initialProfile.typicalSleep) : '7.5'
  );
  const [typicalWater, setTypicalWater] = useState<string>(
    initialProfile?.typicalWater ? String(initialProfile.typicalWater) : '2.5'
  );
  const [physicalActivity, setPhysicalActivity] = useState<PhysicalActivityLevel>(
    initialProfile?.physicalActivity || 'moderate'
  );
  const [averageSteps, setAverageSteps] = useState<string>(
    initialProfile?.averageSteps ? String(initialProfile.averageSteps) : '7500'
  );
  const [exerciseFrequency, setExerciseFrequency] = useState<ExerciseFrequency>(
    initialProfile?.exerciseFrequency || '3-4_days'
  );
  const [currentMood, setCurrentMood] = useState<MoodType>(
    initialProfile?.currentMood || 'good'
  );
  const [typicalStress, setTypicalStress] = useState<StressLevel>(
    initialProfile?.typicalStress || 'moderate'
  );
  const [nutritionPattern, setNutritionPattern] = useState<NutritionPattern>(
    initialProfile?.nutritionPattern || 'balanced'
  );

  // Optional sensitive fields
  const [gender, setGender] = useState<string>(initialProfile?.gender || '');
  const [managesPrescribedMedicines, setManagesPrescribedMedicines] = useState<string>(
    initialProfile?.managesPrescribedMedicines !== undefined && initialProfile?.managesPrescribedMedicines !== null
      ? String(initialProfile.managesPrescribedMedicines)
      : 'true'
  );
  const [existingConditions, setExistingConditions] = useState<string>(
    initialProfile?.existingHealthConditions ? initialProfile.existingHealthConditions.join(', ') : ''
  );
  const [smokingHabit, setSmokingHabit] = useState<string>(initialProfile?.smokingHabit || 'Non-smoker');
  const [alcoholHabit, setAlcoholHabit] = useState<string>(initialProfile?.alcoholHabit || 'Rarely / Never');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedProfile: HealthProfile = {
      age: age ? parseInt(age, 10) : null,
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
      typicalSleep: typicalSleep ? parseFloat(typicalSleep) : null,
      typicalWater: typicalWater ? parseFloat(typicalWater) : null,
      physicalActivity: physicalActivity || null,
      averageSteps: averageSteps ? parseInt(averageSteps, 10) : null,
      exerciseFrequency: exerciseFrequency || null,
      currentMood: currentMood || null,
      typicalStress: typicalStress || null,
      nutritionPattern: nutritionPattern || null,

      // Optional
      gender: gender.trim() || null,
      managesPrescribedMedicines:
        managesPrescribedMedicines === 'true' ? true : managesPrescribedMedicines === 'false' ? false : null,
      existingHealthConditions: existingConditions
        ? existingConditions.split(',').map((s) => s.trim()).filter(Boolean)
        : null,
      smokingHabit: smokingHabit || null,
      alcoholHabit: alcoholHabit || null,

      isCompleted: true,
      updatedAt: new Date().toISOString(),
    };

    updateHealthProfile(parsedProfile);
    if (onCompleted) onCompleted();
  };

  const handleSkip = () => {
    skipHealthProfile();
    if (onCompleted) onCompleted();
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-200">
              MediMitra Personalized Health
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
            {t.setUpHealthProfile}
          </h1>
          <p className="mt-2 text-blue-50 text-sm leading-relaxed max-w-2xl">
            {t.profileExplainer}
          </p>
          <div className="mt-4">
            <button
              type="button"
              id="btn-switch-to-voice-setup"
              onClick={() => setUseVoiceMode(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-900 hover:bg-blue-50 rounded-xl text-xs font-black shadow-md transition-all"
            >
              <span>Switch to Voice-First Guided Setup (Low Literacy / Audio)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Informational Guidance Alert */}
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-3 flex items-start gap-2.5 text-xs text-blue-950">
          <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <span>
            MediMitra uses these baseline markers exclusively to calculate personalized wellness recommendations. Sensitive details are strictly optional.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          
          {/* Section 1: Basic Biometrics */}
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <Activity className="w-4 h-4 text-blue-600" />
              Basic Body Metrics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="input-age" className="block text-xs font-bold text-slate-700 mb-1">
                  {t.age} *
                </label>
                <input
                  id="input-age"
                  type="number"
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 26"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="input-height" className="block text-xs font-bold text-slate-700 mb-1">
                  {t.height} *
                </label>
                <input
                  id="input-height"
                  type="number"
                  min="50"
                  max="250"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="e.g. 168"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="input-weight" className="block text-xs font-bold text-slate-700 mb-1">
                  {t.weight} *
                </label>
                <input
                  id="input-weight"
                  type="number"
                  min="20"
                  max="300"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 64"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Daily Rest & Hydration */}
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <Moon className="w-4 h-4 text-blue-600" />
              Daily Sleep & Hydration
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="input-sleep" className="block text-xs font-bold text-slate-700 mb-1">
                  {t.typicalSleep} *
                </label>
                <div className="relative">
                  <input
                    id="input-sleep"
                    type="number"
                    step="0.5"
                    min="3"
                    max="14"
                    value={typicalSleep}
                    onChange={(e) => setTypicalSleep(e.target.value)}
                    placeholder="e.g. 7.5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-medium">hours</span>
                </div>
              </div>

              <div>
                <label htmlFor="input-water" className="block text-xs font-bold text-slate-700 mb-1">
                  {t.typicalWater} *
                </label>
                <div className="relative">
                  <input
                    id="input-water"
                    type="number"
                    step="0.25"
                    min="0.5"
                    max="8"
                    value={typicalWater}
                    onChange={(e) => setTypicalWater(e.target.value)}
                    placeholder="e.g. 2.5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-medium">liters</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Physical Activity & Steps */}
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <Footprints className="w-4 h-4 text-blue-600" />
              Activity & Movement
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="select-activity" className="block text-xs font-bold text-slate-700 mb-1">
                  {t.physicalActivity} *
                </label>
                <select
                  id="select-activity"
                  value={physicalActivity}
                  onChange={(e) => setPhysicalActivity(e.target.value as PhysicalActivityLevel)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="sedentary">Sedentary (Desk Job)</option>
                  <option value="light">Light (Casual walking)</option>
                  <option value="moderate">Moderate (Active daily)</option>
                  <option value="active">Active (Regular workouts)</option>
                  <option value="very_active">Very Active (High exertion)</option>
                </select>
              </div>

              <div>
                <label htmlFor="input-steps" className="block text-xs font-bold text-slate-700 mb-1">
                  {t.averageSteps} *
                </label>
                <input
                  id="input-steps"
                  type="number"
                  min="500"
                  max="50000"
                  step="500"
                  value={averageSteps}
                  onChange={(e) => setAverageSteps(e.target.value)}
                  placeholder="e.g. 7500"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="select-exercise" className="block text-xs font-bold text-slate-700 mb-1">
                  {t.exerciseFrequency} *
                </label>
                <select
                  id="select-exercise"
                  value={exerciseFrequency}
                  onChange={(e) => setExerciseFrequency(e.target.value as ExerciseFrequency)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="rarely">Rarely / Irregular</option>
                  <option value="1-2_days">1–2 days/week</option>
                  <option value="3-4_days">3–4 days/week</option>
                  <option value="5+_days">5+ days/week</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Mood, Stress & Nutrition */}
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <Smile className="w-4 h-4 text-blue-600" />
              Emotional Wellness & Nutrition
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="select-mood" className="block text-xs font-bold text-slate-700 mb-1">
                  {t.currentMood} *
                </label>
                <select
                  id="select-mood"
                  value={currentMood}
                  onChange={(e) => setCurrentMood(e.target.value as MoodType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="great">Great / Energetic 😊</option>
                  <option value="good">Good / Calm 🙂</option>
                  <option value="neutral">Neutral / Balanced 😐</option>
                  <option value="low">Low / Fatigued 😔</option>
                  <option value="stressed">Stressed / Busy 😣</option>
                </select>
              </div>

              <div>
                <label htmlFor="select-stress" className="block text-xs font-bold text-slate-700 mb-1">
                  {t.typicalStress} *
                </label>
                <select
                  id="select-stress"
                  value={typicalStress}
                  onChange={(e) => setTypicalStress(e.target.value as StressLevel)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="low">Low Stress</option>
                  <option value="moderate">Moderate Stress</option>
                  <option value="high">High Workload/Stress</option>
                </select>
              </div>

              <div>
                <label htmlFor="select-nutrition" className="block text-xs font-bold text-slate-700 mb-1">
                  {t.nutritionPattern} *
                </label>
                <select
                  id="select-nutrition"
                  value={nutritionPattern}
                  onChange={(e) => setNutritionPattern(e.target.value as NutritionPattern)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="balanced">Balanced Home Meals</option>
                  <option value="vegetarian">Vegetarian / Plant-Forward</option>
                  <option value="high_protein">High Protein / Fitness</option>
                  <option value="irregular">Irregular Meal Timings</option>
                  <option value="fast_food_frequent">Frequent Outside Dining</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Optional Sensitive Information */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Optional Health & Lifestyle Information
              </h2>
              <span className="text-xs bg-slate-200 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                Optional
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Skip any fields you prefer not to disclose. Skipped entries are designated as “Not available”.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label htmlFor="input-gender" className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.gender}
                </label>
                <select
                  id="input-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Prefer not to say</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary / Other">Non-binary / Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="select-manages-meds" className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.managesMedicines}
                </label>
                <select
                  id="select-manages-meds"
                  value={managesPrescribedMedicines}
                  onChange={(e) => setManagesPrescribedMedicines(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="true">Yes, I take prescribed medicines</option>
                  <option value="false">No prescribed medicines</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="input-conditions" className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.existingConditions}
                </label>
                <input
                  id="input-conditions"
                  type="text"
                  value={existingConditions}
                  onChange={(e) => setExistingConditions(e.target.value)}
                  placeholder="e.g. Seasonal Allergies, Mild Asthma (comma separated)"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="select-smoking" className="block text-xs font-semibold text-slate-700 mb-1">
                  Smoking Habit
                </label>
                <select
                  id="select-smoking"
                  value={smokingHabit}
                  onChange={(e) => setSmokingHabit(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Non-smoker">Non-smoker</option>
                  <option value="Occasional">Occasional</option>
                  <option value="Regular">Regular</option>
                  <option value="">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label htmlFor="select-alcohol" className="block text-xs font-semibold text-slate-700 mb-1">
                  Alcohol Consumption
                </label>
                <select
                  id="select-alcohol"
                  value={alcoholHabit}
                  onChange={(e) => setAlcoholHabit(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Rarely / Never">Rarely / Never</option>
                  <option value="Social">Social</option>
                  <option value="Moderate">Moderate</option>
                  <option value="">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            {!isEditing && (
              <button
                type="button"
                id="btn-skip-health-profile"
                onClick={handleSkip}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-sm transition-colors"
              >
                {t.skip}
              </button>
            )}

            <button
              type="submit"
              id="btn-save-health-profile"
              className="w-full sm:w-auto ml-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-transform active:scale-98"
            >
              <span>{isEditing ? t.updateProfile : t.saveAndContinue}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
