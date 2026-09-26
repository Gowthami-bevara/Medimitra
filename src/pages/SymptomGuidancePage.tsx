import React, { useState, useRef, useEffect } from 'react';
import {
  Stethoscope,
  Mic,
  MicOff,
  Send,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS, speakText } from '../utils/i18n';
import { getApiUrl } from '../utils/api';

interface SymptomGuidanceResult {
  summary: string;
  possibleGeneralExplanations: string[];
  recommendedNextSteps: string[];
  followUpQuestions: string[];
  urgencyLevel: 'Low' | 'Moderate' | 'High' | 'Emergency';
  disclaimer: string;
}

export const SymptomGuidancePage: React.FC = () => {
  const { addSymptomReport, setActiveTab, language } = useApp();
  const t = TRANSLATIONS[language];

  const [symptomInput, setSymptomInput] = useState('');
  const [duration, setDuration] = useState('2 days');
  const [severity, setSeverity] = useState<'Mild' | 'Moderate' | 'Severe'>('Moderate');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [result, setResult] = useState<SymptomGuidanceResult | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = language;
        rec.onresult = (e: any) => {
          const transcript = e.results[0][0].transcript;
          if (transcript) {
            setSymptomInput((prev) => (prev ? `${prev}, ${transcript}` : transcript));
          }
        };
        rec.onend = () => setIsListening(false);
        rec.onerror = () => setIsListening(false);
        recognitionRef.current = rec;
      } catch (err) {
        console.warn('Speech recognition error:', err);
      }
    }
  }, [language]);

  const toggleSpeech = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = language;
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.warn('Speech start error', e);
        }
      }
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomInput.trim()) return;

    setIsLoading(true);

    try {
      const res = await fetch(getApiUrl('/api/symptom/check'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: symptomInput,
          duration,
          severity,
          notes: additionalNotes,
          language,
        }),
      });

      const data = await res.json();
      setResult(data);

      // Add contextual report to app context so Health Prediction can factor it in
      addSymptomReport({
        id: `sym-${Date.now()}`,
        reportedAt: new Date().toISOString(),
        symptoms: symptomInput.split(',').map((s) => s.trim()).filter(Boolean),
        duration,
        severity,
        notes: additionalNotes,
        guidanceSummary: data.summary,
      });
    } catch (err) {
      console.error('Error analyzing symptoms:', err);
      // Fallback
      setResult({
        summary: `Guidance regarding: "${symptomInput}"`,
        possibleGeneralExplanations: [
          'Mild physiological fatigue or seasonal irritation',
          'Muscular tension or everyday stress response',
        ],
        recommendedNextSteps: [
          'Rest in a comfortable environment and maintain adequate hydration (2.5L+)',
          'Schedule an in-person consultation with a general physician if symptoms persist beyond 48 hours',
        ],
        followUpQuestions: [
          'Are symptoms accompanied by fever, dizziness, or sharp localized pain?',
        ],
        urgencyLevel: severity === 'Severe' ? 'High' : 'Moderate',
        disclaimer:
          'This information is for general guidance and is not a medical diagnosis. Consult a physician.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sampleSymptoms = [
    'Mild headache & afternoon fatigue',
    'Dry throat and nasal congestion',
    'Muscle soreness after workout',
    'Acid reflux after late dinner',
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-8">
      
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 border border-blue-100 shadow-xs">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="p-1 rounded-md bg-blue-100 text-blue-800">
            <Stethoscope className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-blue-800">
            Symptom Guidance & Organization
          </span>
        </div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-blue-950 tracking-tight">
          {t.checkSymptomsTitle}
        </h1>
        <p className="mt-1 text-slate-500 text-xs sm:text-sm max-w-2xl font-medium">
          Organize your symptoms to understand general physiological factors, prepare informed questions for your physician, and receive appropriate next-step wellness guidance.
        </p>
      </div>

      {/* Prominent Mandatory Safety Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-950">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold block mb-0.5">
            Important Medical Disclaimer:
          </strong>
          <p className="leading-relaxed">
            {t.disclaimerMedical} This tool provides educational wellness context and symptom organization. It <strong>never provides a medical diagnosis</strong>. If you experience severe chest pain, shortness of breath, severe bleeding, or loss of consciousness, immediately tap Emergency Support or call 108.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input Form Column */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-blue-100 p-6 shadow-xs space-y-5">
          <h2 className="font-display font-bold text-lg text-blue-950">
            Describe Your Symptoms
          </h2>

          <form onSubmit={handleAnalyze} className="space-y-4 text-xs">
            {/* Symptom Input + Voice Mic */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-700">
                  Primary Symptoms *
                </label>
                <button
                  type="button"
                  onClick={toggleSpeech}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isListening ? 'Stop Mic' : 'Voice Input'}</span>
                </button>
              </div>

              <textarea
                rows={3}
                required
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                placeholder={t.symptomInputPlaceholder}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Quick Sample Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold text-slate-400">Quick Samples:</span>
              {sampleSymptoms.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSymptomInput(sample)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Few hours">Few hours</option>
                  <option value="1 day">1 day</option>
                  <option value="2-3 days">2–3 days</option>
                  <option value="1 week">1 week</option>
                  <option value="Over a week">Over a week</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Perceived Severity
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Mild">Mild (Noticeable but functional)</option>
                  <option value="Moderate">Moderate (Impacting daily work)</option>
                  <option value="Severe">Severe (Significant discomfort)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Additional Observations (Optional)
              </label>
              <input
                type="text"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="e.g. Worse in the evening, relieved by drinking warm water"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              id="btn-analyze-symptoms"
              disabled={isLoading || !symptomInput.trim()}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Organizing Clinical Symptoms...</span>
                </>
              ) : (
                <>
                  <span>{t.analyzeSymptoms}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Guidance Results Column */}
        <div className="lg:col-span-6 space-y-4">
          {result ? (
            <div className="bg-white rounded-3xl border border-blue-100 p-6 shadow-xs space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <h2 className="font-display font-bold text-base sm:text-lg text-blue-950">
                    Guidance Summary
                  </h2>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    result.urgencyLevel === 'Emergency'
                      ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                      : result.urgencyLevel === 'High'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-blue-100 text-blue-900 border-blue-300'
                  }`}
                >
                  {result.urgencyLevel} Urgency
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-sm text-slate-800 font-medium leading-relaxed">
                {result.summary}
              </div>

              {/* Possible General Explanations */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  General Potential Factors (Informational)
                </h3>
                <ul className="space-y-2">
                  {result.possibleGeneralExplanations.map((exp, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <span>{exp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Next Steps */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Recommended Next Steps
                </h3>
                <ul className="space-y-2">
                  {result.recommendedNextSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Follow-up Questions */}
              {result.followUpQuestions && result.followUpQuestions.length > 0 && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-700" />
                    Helpful Questions for Your Doctor:
                  </span>
                  <ul className="text-xs text-blue-950 space-y-1 pl-4 list-disc">
                    {result.followUpQuestions.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Find Doctor Link */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Connect with a verified practitioner:
                </span>
                <button
                  onClick={() => setActiveTab('doctors')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <span>Find a Doctor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-400 space-y-3">
              <Stethoscope className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-700">No Active Analysis</div>
              <p className="text-xs max-w-sm mx-auto leading-relaxed">
                Enter your symptoms on the left to receive structured general explanations, follow-up questions, and next steps.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
