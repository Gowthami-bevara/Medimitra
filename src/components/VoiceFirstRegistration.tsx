import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Edit3,
  AlertTriangle,
  HeartPulse,
  Globe,
  UserCheck,
  Activity,
  Droplets,
  Pill,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/i18n';
import { speakNaturalVoice, stopSpeakingAudio } from '../utils/voiceManager';
import {
  parseName,
  parseAge,
  parseGender,
  parseSleep,
  parseWater,
  parseMedicines,
  parseConditions,
  ParsedVoiceResult,
} from '../utils/speechParsers';
import { HealthProfile, AppLanguage } from '../types';

interface VoiceFirstRegistrationProps {
  onCancel?: () => void;
  onCompleted?: () => void;
}

interface QuestionDef {
  id: number;
  key: string;
  stepNum: number;
  questionEn: string;
  questionTe: string;
  questionHi: string;
  promptEn: string;
  promptTe: string;
  promptHi: string;
  subEn: string;
  subTe: string;
  subHi: string;
  icon: any;
  quickOptions: { labelEn: string; labelTe: string; labelHi: string; spoken: string; payload?: any }[];
  parse: (spoken: string) => ParsedVoiceResult;
}

export const VoiceFirstRegistration: React.FC<VoiceFirstRegistrationProps> = ({
  onCancel,
  onCompleted,
}) => {
  const {
    updateHealthProfile,
    updateUserName,
    language,
    setLanguage,
    setActiveTab,
  } = useApp();

  const t = TRANSLATIONS[language];

  // Exactly 4 Streamlined, Human-Centric Questions
  const QUESTIONS: QuestionDef[] = [
    {
      id: 1,
      stepNum: 1,
      key: 'name',
      questionEn: 'What is your name?',
      questionTe: 'మీ పేరు ఏమిటి?',
      questionHi: 'आपका नाम क्या है?',
      promptEn: 'What is your name? Please tap the microphone and speak your name clearly.',
      promptTe: 'మీ పేరు ఏమిటి? మైక్ నొక్కి మీ పేరు స్పష్టంగా చెప్పండి.',
      promptHi: 'आपका नाम क्या है? कृपया माइक दबाकर अपना नाम बोलें।',
      subEn: 'Speak your full name or select a quick profile',
      subTe: 'మీ పూర్తి పేరు చెప్పండి లేదా ఒకదాన్ని ఎంచుకోండి',
      subHi: 'अपना नाम बोलें या एक प्रोफ़ाइल चुनें',
      icon: UserCheck,
      quickOptions: [
        { labelEn: 'Rohini (రోహిణి)', labelTe: 'రోహిణి', labelHi: 'रोहिणी', spoken: 'Rohini' },
        { labelEn: 'Ramesh (రమేష్)', labelTe: 'రమేష్', labelHi: 'रमेश', spoken: 'Ramesh' },
        { labelEn: 'Sita (సీత)', labelTe: 'సీత', labelHi: 'सीता', spoken: 'Sita' },
        { labelEn: 'Suresh (సురేష్)', labelTe: 'సురేష్', labelHi: 'सुरेश', spoken: 'Suresh' },
      ],
      parse: parseName,
    },
    {
      id: 2,
      stepNum: 2,
      key: 'demographics',
      questionEn: 'What is your age and gender?',
      questionTe: 'మీ వయస్సు మరియు లింగం ఎంత?',
      questionHi: 'आपकी उम्र और लिंग क्या है?',
      promptEn: 'What is your age and gender? For example, twenty eight years female.',
      promptTe: 'మీ వయస్సు మరియు లింగం ఎంత? ఉదాహరణకు: 28 ఏళ్లు మహిళ.',
      promptHi: 'आपकी उम्र और लिंग क्या है? जैसे: 28 वर्ष, महिला।',
      subEn: 'E.g., "28 years, female" or "45 years, male"',
      subTe: 'ఉదా: "28 ఏళ్లు, మహిళ" లేదా "45 ఏళ్లు, పురుషుడు"',
      subHi: 'उदा: "28 साल, महिला" या "45 साल, पुरुष"',
      icon: Activity,
      quickOptions: [
        { labelEn: '28 Yrs, Female', labelTe: '28 ఏళ్లు, మహిళ', labelHi: '28 वर्ष, महिला', spoken: '28 years female', payload: { age: 28, gender: 'female' } },
        { labelEn: '35 Yrs, Male', labelTe: '35 ఏళ్లు, పురుషుడు', labelHi: '35 वर्ष, पुरुष', spoken: '35 years male', payload: { age: 35, gender: 'male' } },
        { labelEn: '45 Yrs, Female', labelTe: '45 ఏళ్లు, మహిళ', labelHi: '45 वर्ष, महिला', spoken: '45 years female', payload: { age: 45, gender: 'female' } },
        { labelEn: '52 Yrs, Male', labelTe: '52 ఏళ్లు, పురుషుడు', labelHi: '52 वर्ष, पुरुष', spoken: '52 years male', payload: { age: 52, gender: 'male' } },
      ],
      parse: (spoken: string) => {
        const parsedAge = parseAge(spoken);
        const parsedGender = parseGender(spoken);
        const ageVal = parsedAge.parsedValue || 28;
        const genderVal = parsedGender.parsedValue || 'female';
        return {
          rawSpoken: spoken,
          structuredDisplay: `${ageVal} Years (${genderVal})`,
          parsedValue: { age: ageVal, gender: genderVal },
          confidence: 'high',
        };
      },
    },
    {
      id: 3,
      stepNum: 3,
      key: 'habits',
      questionEn: 'How many hours do you sleep and water intake?',
      questionTe: 'రోజూ ఎన్ని గంటలు నిద్రపోతారు & నీళ్లు తాగుతారు?',
      questionHi: 'रोज़ कितने घंटे सोते हैं और कितना पानी पीते हैं?',
      promptEn: 'How many hours do you sleep at night and how much water do you drink daily?',
      promptTe: 'రాత్రికి ఎన్ని గంటలు నిద్రపోతారు మరియు రోజూ ఎన్ని లీటర్ల నీరు తాగుతారు?',
      promptHi: 'रात में कितने घंटे सोते हैं और रोज़ कितना पानी पीते हैं?',
      subEn: 'E.g., "7 hours of sleep and 2.5 litres of water"',
      subTe: 'ఉదా: "7 గంటల నిద్ర మరియు 2.5 లీటర్ల నీరు"',
      subHi: 'उदा: "7 घंटे की नींद और 2.5 लीटर पानी"',
      icon: Droplets,
      quickOptions: [
        { labelEn: '7 hrs sleep, 2.5L water', labelTe: '7 గంటల నిద్ర, 2.5 లీటర్లు', labelHi: '7 घंटे नींद, 2.5L पानी', spoken: '7 hours sleep and 2.5 litres water', payload: { sleep: 7, water: 2.5 } },
        { labelEn: '8 hrs sleep, 3L water', labelTe: '8 గంటల నిద్ర, 3 లీటర్లు', labelHi: '8 घंटे नींद, 3L पानी', spoken: '8 hours sleep and 3 litres water', payload: { sleep: 8, water: 3.0 } },
        { labelEn: '6 hrs sleep, 2L water', labelTe: '6 గంటల నిద్ర, 2 లీటర్లు', labelHi: '6 घंटे नींद, 2L पानी', spoken: '6 hours sleep and 2 litres water', payload: { sleep: 6, water: 2.0 } },
        { labelEn: '7.5 hrs sleep, 2L water', labelTe: '7.5 గంటల నిద్ర, 2 లీటర్లు', labelHi: '7.5 घंटे नींद, 2L पानी', spoken: '7.5 hours sleep and 2 litres water', payload: { sleep: 7.5, water: 2.0 } },
      ],
      parse: (spoken: string) => {
        const parsedSleep = parseSleep(spoken);
        const parsedWater = parseWater(spoken);
        const sleepVal = parsedSleep.parsedValue || 7.5;
        const waterVal = parsedWater.parsedValue || 2.5;
        return {
          rawSpoken: spoken,
          structuredDisplay: `${sleepVal} hrs sleep • ${waterVal}L water`,
          parsedValue: { sleep: sleepVal, water: waterVal },
          confidence: 'high',
        };
      },
    },
    {
      id: 4,
      stepNum: 4,
      key: 'health_status',
      questionEn: 'Do you take regular medicines or have health conditions?',
      questionTe: 'రోజూ వేసుకునే మందులు లేదా ఇతర ఆరోగ్య సమస్యలు ఉన్నాయా?',
      questionHi: 'क्या आपको कोई नियमित दवा या स्वास्थ्य समस्या है?',
      promptEn: 'Do you take any regular medicines or have conditions like diabetes or blood pressure?',
      promptTe: 'మీకు షుగర్, బీపీ వంటి సమస్యలు లేదా రోజూ వేసుకునే మందులు ఉన్నాయా?',
      promptHi: 'क्या आपको बीपी, शुगर जैसी बीमारी या रोज़ की दवाइयां हैं?',
      subEn: 'E.g., "No issues, healthy" or "Blood pressure tablet"',
      subTe: 'ఉదా: "ఏమీ లేవు, ఆరోగ్యం బాగుంది" లేదా "బీపీ మందులు"',
      subHi: 'उदा: "कोई बीमारी नहीं" या "बीपी की दवा"',
      icon: Pill,
      quickOptions: [
        { labelEn: 'Healthy / No Conditions', labelTe: 'ఏ సమస్యలు లేవు (ఆరోగ్యంగా ఉన్నాను)', labelHi: 'कोई बीमारी नहीं', spoken: 'No health conditions, healthy', payload: { conditions: [], medicines: false } },
        { labelEn: 'BP & Daily Tablet', labelTe: 'బీపీ ఉంది, రోజూ టాబ్లెట్', labelHi: 'बीपी और रोज़ की दवा', spoken: 'Blood pressure and regular tablet', payload: { conditions: ['Hypertension (BP)'], medicines: true } },
        { labelEn: 'Sugar (Diabetes)', labelTe: 'షుగర్ (మధుమేహం)', labelHi: 'शुगर (डायबिटीज)', spoken: 'Diabetes sugar', payload: { conditions: ['Diabetes Type 2'], medicines: true } },
        { labelEn: 'Thyroid / Asthma', labelTe: 'థైరాయిడ్ లేదా ఆస్తమా', labelHi: 'थायराइड / अस्थमा', spoken: 'Thyroid condition', payload: { conditions: ['Thyroid'], medicines: true } },
      ],
      parse: (spoken: string) => {
        const parsedConditions = parseConditions(spoken);
        const parsedMeds = parseMedicines(spoken);
        const hasConditions = parsedConditions.parsedValue?.length > 0;
        const hasMeds = Boolean(parsedMeds.parsedValue);
        return {
          rawSpoken: spoken,
          structuredDisplay: hasConditions
            ? `${parsedConditions.structuredDisplay} ${hasMeds ? '• Regular Medicines' : ''}`
            : 'Healthy • No active conditions',
          parsedValue: {
            conditions: parsedConditions.parsedValue || [],
            medicines: hasMeds,
          },
          confidence: 'high',
        };
      },
    },
  ];

  const [stepIndex, setStepIndex] = useState<number>(0);
  const currentQ = QUESTIONS[stepIndex];

  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechTranscript, setSpeechTranscript] = useState<string>('');
  const [currentResult, setCurrentResult] = useState<ParsedVoiceResult | null>(null);
  const [isManualEditing, setIsManualEditing] = useState<boolean>(false);
  const [manualEditText, setManualEditText] = useState<string>('');
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const recognitionRef = useRef<any>(null);

  // Stop TTS on unmount
  useEffect(() => {
    return () => {
      stopSpeakingAudio();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // When step changes, read prompt aloud automatically
  useEffect(() => {
    stopSpeakingAudio();
    setCurrentResult(null);
    setSpeechTranscript('');
    setIsManualEditing(false);

    const promptText =
      language === 'te-IN'
        ? currentQ.promptTe
        : language === 'hi-IN'
        ? currentQ.promptHi
        : currentQ.promptEn;

    const timer = setTimeout(() => {
      speakNaturalVoice(promptText, language);
    }, 400);

    return () => clearTimeout(timer);
  }, [stepIndex, language]);

  // Read current question again
  const handleListenQuestion = () => {
    const promptText =
      language === 'te-IN'
        ? currentQ.promptTe
        : language === 'hi-IN'
        ? currentQ.promptHi
        : currentQ.promptEn;
    speakNaturalVoice(promptText, language);
  };

  // Start / Stop Speech Recognition
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    stopSpeakingAudio();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use the quick option buttons.');
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = language;

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join(' ');
        setSpeechTranscript(transcript);

        if (event.results[0].isFinal) {
          const parsed = currentQ.parse(transcript);
          setCurrentResult(parsed);
          setManualEditText(parsed.structuredDisplay);
        }
      };

      rec.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      setIsListening(false);
    }
  };

  // Handle Quick Option Tap
  const handleQuickOptionSelect = (opt: { spoken: string; labelEn: string; labelTe: string; labelHi: string; payload?: any }) => {
    stopSpeakingAudio();
    const spoken = opt.spoken;
    setSpeechTranscript(spoken);
    const parsed = currentQ.parse(spoken);
    if (opt.payload) {
      parsed.parsedValue = opt.payload;
      parsed.structuredDisplay = language === 'te-IN' ? opt.labelTe : language === 'hi-IN' ? opt.labelHi : opt.labelEn;
    }
    setCurrentResult(parsed);
    setManualEditText(parsed.structuredDisplay);
  };

  // Confirm Answer and Proceed
  const handleConfirmAnswer = () => {
    if (!currentResult && !manualEditText) {
      // Default to quick option 1 if empty
      const defaultOpt = currentQ.quickOptions[0];
      handleQuickOptionSelect(defaultOpt);
      return;
    }

    const valueToSave = isManualEditing
      ? manualEditText
      : currentResult?.parsedValue;

    const updatedAnswers = {
      ...answers,
      [currentQ.key]: valueToSave,
    };
    setAnswers(updatedAnswers);

    // If this was Question 1 (Name), update name immediately in state
    if (currentQ.key === 'name') {
      const rawName = String(valueToSave || 'Rohini');
      updateUserName(rawName);
    }

    // Check if finished 4 questions
    if (stepIndex < QUESTIONS.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      finalizeProfile(updatedAnswers);
    }
  };

  // Skip current question
  const handleSkipQuestion = () => {
    if (stepIndex < QUESTIONS.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      finalizeProfile(answers);
    }
  };

  // Finalize Health Profile and Navigate to Dashboard
  const finalizeProfile = (finalAnswers: Record<string, any>) => {
    stopSpeakingAudio();

    const canonicalName = finalAnswers.name || 'Rohini';
    updateUserName(canonicalName);

    const demo = finalAnswers.demographics || {};
    const habits = finalAnswers.habits || {};
    const health = finalAnswers.health_status || {};

    const fullProfile: HealthProfile = {
      age: demo.age ? Number(demo.age) : 28,
      gender: demo.gender || 'female',
      height: 165,
      weight: 62,
      typicalSleep: habits.sleep ? Number(habits.sleep) : 7.5,
      typicalWater: habits.water ? Number(habits.water) : 2.5,
      physicalActivity: 'moderate',
      averageSteps: 7000,
      exerciseFrequency: '3-4_days',
      currentMood: 'good',
      typicalStress: 'moderate',
      nutritionPattern: 'balanced',
      managesPrescribedMedicines: Boolean(health.medicines),
      existingHealthConditions: Array.isArray(health.conditions) ? health.conditions : [],
      smokingHabit: 'Non-smoker',
      alcoholHabit: 'Rarely / Never',
      isCompleted: true,
      updatedAt: new Date().toISOString(),
    };

    updateHealthProfile(fullProfile);
    setActiveTab('home');
    if (onCompleted) onCompleted();
  };

  const questionTitle =
    language === 'te-IN'
      ? currentQ.questionTe
      : language === 'hi-IN'
      ? currentQ.questionHi
      : currentQ.questionEn;

  const questionSub =
    language === 'te-IN'
      ? currentQ.subTe
      : language === 'hi-IN'
      ? currentQ.subHi
      : currentQ.subEn;

  const progressPercent = Math.round(((stepIndex + 1) / QUESTIONS.length) * 100);

  // SVG Circular Gauge calculation
  const circleRadius = 24;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (progressPercent / 100) * circleCircumference;

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="bg-white/95 backdrop-blur-xl border border-teal-100/90 rounded-3xl shadow-xl shadow-teal-950/5 overflow-hidden transition-all">
        
        {/* Top Header with Glassmorphism & Language Pill */}
        <div className="bg-gradient-to-br from-teal-700 via-cyan-800 to-blue-900 p-6 text-white relative overflow-hidden">
          {/* Subtle glowing accents */}
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-md">
                <HeartPulse className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <span className="font-display font-black text-base text-white tracking-tight">MediMitra</span>
                <span className="block text-[11px] text-teal-200 font-bold uppercase tracking-wider">
                  {language === 'te-IN' ? 'వాయిస్ రిజిస్ట్రేషన్' : language === 'hi-IN' ? 'आवाज़ पंजीकरण' : 'Voice Registration'}
                </span>
              </div>
            </div>

            {/* Pill-Style Language Selector */}
            <div className="inline-flex bg-black/25 p-1 rounded-2xl backdrop-blur-md border border-white/15">
              <button
                type="button"
                onClick={() => setLanguage('te-IN')}
                className={`px-3 py-1 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  language === 'te-IN' ? 'bg-white text-teal-900 shadow-md scale-[1.02]' : 'text-teal-100 hover:text-white'
                }`}
              >
                తెలుగు
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi-IN')}
                className={`px-3 py-1 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  language === 'hi-IN' ? 'bg-white text-teal-900 shadow-md scale-[1.02]' : 'text-teal-100 hover:text-white'
                }`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en-IN')}
                className={`px-3 py-1 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  language === 'en-IN' ? 'bg-white text-teal-900 shadow-md scale-[1.02]' : 'text-teal-100 hover:text-white'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Modern Progress Bar & Circle for Question X of 4 */}
          <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center justify-between gap-4">
            
            {/* Circular Gauge */}
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-14 h-14 transform -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r={circleRadius}
                    className="stroke-white/20 fill-none"
                    strokeWidth="4"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r={circleRadius}
                    className="stroke-emerald-300 fill-none transition-all duration-500 ease-out"
                    strokeWidth="4"
                    strokeDasharray={circleCircumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-[11px] font-black text-white">{progressPercent}%</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-black text-teal-200 uppercase tracking-wider block">
                  {language === 'te-IN'
                    ? `ప్రశ్న ${stepIndex + 1} / 4`
                    : language === 'hi-IN'
                    ? `प्रश्न ${stepIndex + 1} / 4`
                    : `Question ${stepIndex + 1} of 4`}
                </span>
                <span className="text-sm font-bold text-white">
                  {stepIndex === 0
                    ? (language === 'te-IN' ? 'మీ వ్యక్తిగత వివరాలు' : 'Basic Profile')
                    : stepIndex === 1
                    ? (language === 'te-IN' ? 'వయస్సు & వివరాలు' : 'Demographics')
                    : stepIndex === 2
                    ? (language === 'te-IN' ? 'నిద్ర & నీటి అలవాట్లు' : 'Daily Habits')
                    : (language === 'te-IN' ? 'ఆరోగ్యం & మందులు' : 'Health Conditions')}
                </span>
              </div>
            </div>

            {/* Step Checkpoints */}
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3].map((idx) => {
                const isDone = idx < stepIndex;
                const isCurr = idx === stepIndex;
                return (
                  <div
                    key={idx}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
                      isDone
                        ? 'bg-emerald-400 text-teal-950 shadow-xs'
                        : isCurr
                        ? 'bg-white text-teal-900 shadow-md ring-2 ring-emerald-300 scale-105'
                        : 'bg-white/20 text-white/70'
                    }`}
                  >
                    {isDone ? '✓' : idx + 1}
                  </div>
                );
              })}
            </div>

          </div>

        </div>

        {/* Main Question Area */}
        <div className="p-6 space-y-6">

          {/* Large Question Title with Clean Subtitle */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200/80 shadow-xs mb-1">
              <currentQ.icon className="w-7 h-7" />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {questionTitle}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 max-w-sm mx-auto">
              {questionSub}
            </p>

            {/* Prominent Speaker Button */}
            <div className="pt-1 flex items-center justify-center">
              <button
                type="button"
                id="voice-read-question-btn"
                onClick={handleListenQuestion}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-teal-50 hover:bg-teal-100/80 text-teal-800 border border-teal-200/80 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Volume2 className="w-4 h-4 text-teal-600 animate-pulse" />
                <span>
                  {language === 'te-IN'
                    ? 'ప్రశ్న వినండి'
                    : language === 'hi-IN'
                    ? 'प्रश्न सुनें'
                    : 'Listen Question'}
                </span>
              </button>
            </div>
          </div>

          {/* Prominent Microphone Button */}
          <div className="flex flex-col items-center justify-center py-3">
            <div className="relative">
              {isListening && (
                <>
                  <div className="absolute -inset-3 rounded-full bg-rose-400/30 animate-ping pointer-events-none"></div>
                  <div className="absolute -inset-6 rounded-full bg-rose-400/20 animate-pulse pointer-events-none"></div>
                </>
              )}
              <button
                type="button"
                id="voice-mic-main-btn"
                onClick={toggleListening}
                className={`relative w-28 h-28 rounded-full flex items-center justify-center shadow-xl transition-all transform active:scale-95 cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 text-white ring-8 ring-rose-200 shadow-rose-600/30'
                    : 'bg-gradient-to-tr from-teal-600 via-teal-700 to-emerald-600 text-white hover:scale-105 shadow-teal-600/30 hover:shadow-2xl'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-12 h-12" />
                ) : (
                  <Mic className="w-12 h-12 text-teal-50" />
                )}
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <span className={`text-sm font-black tracking-wide ${isListening ? 'text-rose-600 animate-pulse' : 'text-slate-700'}`}>
                {isListening
                  ? (language === 'te-IN' ? 'వింటోంది... ఇప్పుడు మాట్లాడండి' : language === 'hi-IN' ? 'सुन रहा है... अब बोलें' : 'Listening... Speak now')
                  : (language === 'te-IN' ? 'మాట్లాడటానికి మైక్ నొక్కండి' : language === 'hi-IN' ? 'बोलने के लिए माइक दबाएं' : 'Tap to Speak')}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {language === 'te-IN' ? 'తెలుగులో స్పష్టంగా మాట్లాడండి' : 'Speak clearly in your language'}
              </p>
            </div>
          </div>

          {/* Confirmation Box when spoken */}
          {(speechTranscript || currentResult) && (
            <div className="bg-teal-50/50 border-2 border-teal-300/80 rounded-2xl p-4 space-y-3 shadow-sm">
              
              {/* YOU SAID */}
              <div className="border-b border-teal-200/60 pb-2.5">
                <span className="block text-[11px] font-black uppercase tracking-wider text-teal-800">
                  {language === 'te-IN' ? 'మీరు చెప్పింది:' : language === 'hi-IN' ? 'आपने कहा:' : 'You Said:'}
                </span>
                <p className="text-base font-bold text-slate-800 italic mt-0.5">
                  "{speechTranscript || currentResult?.rawSpoken}"
                </p>
              </div>

              {/* REGISTERING AS */}
              <div className="border-b border-teal-200/60 pb-2.5">
                <span className="block text-[11px] font-black uppercase tracking-wider text-teal-900">
                  {language === 'te-IN' ? 'నమోదు వివరాలు:' : language === 'hi-IN' ? 'दर्ज विवरण:' : 'Registering As:'}
                </span>
                {isManualEditing ? (
                  <input
                    type="text"
                    value={manualEditText}
                    onChange={(e) => setManualEditText(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-white border border-teal-400 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <div className="text-lg font-black text-emerald-800 mt-0.5 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>{currentResult?.structuredDisplay || manualEditText}</span>
                  </div>
                )}
              </div>

              {/* Edit / Retry Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmAnswer}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-black rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {stepIndex === QUESTIONS.length - 1
                      ? (language === 'te-IN' ? 'నమోదు పూర్తి చేయండి' : 'Complete Registration')
                      : (language === 'te-IN' ? 'ధృవీకరించి ముందుకు' : 'Confirm & Next')}
                  </span>
                </button>

                <button
                  type="button"
                  title="Edit text manually"
                  onClick={() => setIsManualEditing(!isManualEditing)}
                  className="py-3 px-3.5 bg-white border border-teal-200 hover:bg-teal-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-teal-700" />
                </button>

                <button
                  type="button"
                  title="Retry speech"
                  onClick={toggleListening}
                  className="py-3 px-3.5 bg-white border border-teal-200 hover:bg-teal-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-teal-700" />
                </button>
              </div>

            </div>
          )}

          {/* Quick Choice Pills */}
          <div>
            <span className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2.5 text-center">
              {language === 'te-IN'
                ? 'లేదా ఒక సులభమైన ఎంపికను తాకండి:'
                : language === 'hi-IN'
                ? 'या त्वरित विकल्प चुनें:'
                : 'Or tap a quick choice:'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentQ.quickOptions.map((opt, idx) => {
                const label =
                  language === 'te-IN'
                    ? opt.labelTe
                    : language === 'hi-IN'
                    ? opt.labelHi
                    : opt.labelEn;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickOptionSelect(opt)}
                    className="px-4 py-2.5 rounded-2xl bg-teal-50/40 hover:bg-teal-50 text-slate-800 hover:text-teal-950 border border-teal-200/70 text-xs sm:text-sm font-bold transition-all text-left flex items-center justify-between group cursor-pointer shadow-2xs"
                  >
                    <span>{label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-teal-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls: Previous and Next / Complete Registration */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {stepIndex > 0 ? (
              <button
                type="button"
                id="voice-reg-prev-btn"
                onClick={() => setStepIndex((prev) => prev - 1)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>
                  {language === 'te-IN' ? 'మునుపటి ప్రశ్న' : language === 'hi-IN' ? 'पिछला प्रश्न' : 'Previous'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onCancel}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {language === 'te-IN' ? 'రద్దు చేయండి' : 'Cancel'}
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSkipQuestion}
                className="px-3 py-2 text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {language === 'te-IN' ? 'దాటవేయండి' : 'Skip'}
              </button>

              <button
                type="button"
                id="voice-reg-complete-or-next-btn"
                onClick={handleConfirmAnswer}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs sm:text-sm font-black shadow-md shadow-teal-600/20 transition-all cursor-pointer active:scale-98"
              >
                <span>
                  {stepIndex === QUESTIONS.length - 1
                    ? (language === 'te-IN' ? 'నమోదు పూర్తి చేయండి' : language === 'hi-IN' ? 'पंजीकरण पूरा करें' : 'Complete Registration')
                    : (language === 'te-IN' ? 'తదుపరి ప్రశ్న' : language === 'hi-IN' ? 'अगला प्रश्न' : 'Next Question')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
