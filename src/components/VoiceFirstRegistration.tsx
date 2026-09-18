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
  Moon,
  Pill,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/i18n';
import { speakNaturalVoice, stopSpeakingAudio } from '../utils/voiceManager';
import {
  parseName,
  parseAge,
  parseGender,
  parseHeight,
  parseWeight,
  parseSleep,
  parseWater,
  parseDailyActivity,
  parseExerciseFrequency,
  parseMedicines,
  parseConditions,
  parseHabits,
  ParsedVoiceResult,
} from '../utils/speechParsers';
import { getLocalizedUserName } from '../utils/nameTransliteration';
import { HealthProfile, AppLanguage } from '../types';

interface VoiceFirstRegistrationProps {
  onCancel?: () => void;
  onCompleted?: () => void;
}

interface QuestionDef {
  id: number;
  key: string;
  questionEn: string;
  questionTe: string;
  questionHi: string;
  promptEn: string;
  promptTe: string;
  promptHi: string;
  icon: any;
  quickOptions: { labelEn: string; labelTe: string; labelHi: string; spoken: string }[];
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

  // 12 Exact Questions Mandated by Requirement 2
  const QUESTIONS: QuestionDef[] = [
    {
      id: 1,
      key: 'name',
      questionEn: 'What is your name?',
      questionTe: 'మీ పేరు ఏమిటి?',
      questionHi: 'आपका नाम क्या है?',
      promptEn: 'What is your name? Please speak your name clearly.',
      promptTe: 'మీ పేరు ఏమిటి? మైక్ నొక్కి మీ పేరు చెప్పండి.',
      promptHi: 'आपका नाम क्या है? कृपया स्पष्ट आवाज़ में बोलें।',
      icon: UserCheck,
      quickOptions: [
        { labelEn: 'Rohini', labelTe: 'రోహిణి', labelHi: 'रोहिणी', spoken: 'Rohini' },
        { labelEn: 'Ramesh', labelTe: 'రమేష్', labelHi: 'रमेश', spoken: 'Ramesh' },
        { labelEn: 'Sita', labelTe: 'సీత', labelHi: 'सीता', spoken: 'Sita' },
        { labelEn: 'Ananya', labelTe: 'అనన్య', labelHi: 'अनन्या', spoken: 'Ananya' },
      ],
      parse: parseName,
    },
    {
      id: 2,
      key: 'age',
      questionEn: 'What is your age?',
      questionTe: 'మీ వయస్సు ఎంత?',
      questionHi: 'आपकी आयु (उम्र) कितनी है?',
      promptEn: 'What is your age in years?',
      promptTe: 'మీ వయస్సు ఎన్ని సంవత్సరాలు?',
      promptHi: 'आपकी उम्र कितने वर्ष है?',
      icon: Activity,
      quickOptions: [
        { labelEn: '25 Yrs', labelTe: '25 ఏళ్లు', labelHi: '25 वर्ष', spoken: '25' },
        { labelEn: '35 Yrs', labelTe: '35 ఏళ్లు', labelHi: '35 वर्ष', spoken: 'ముప్పై ఐదు' },
        { labelEn: '45 Yrs', labelTe: '45 ఏళ్లు', labelHi: '45 वर्ष', spoken: '45' },
        { labelEn: '55 Yrs', labelTe: '55 ఏళ్లు', labelHi: '55 वर्ष', spoken: '55' },
      ],
      parse: parseAge,
    },
    {
      id: 3,
      key: 'gender',
      questionEn: 'Are you male or female?',
      questionTe: 'మీరు పురుషులా లేక మహిళా?',
      questionHi: 'आप पुरुष हैं या महिला?',
      promptEn: 'Are you male or female?',
      promptTe: 'మీరు పురుషులా లేక మహిళా?',
      promptHi: 'आप पुरुष हैं या महिला?',
      icon: UserCheck,
      quickOptions: [
        { labelEn: 'Female', labelTe: 'మహిళ', labelHi: 'महिला', spoken: 'మహిళ' },
        { labelEn: 'Male', labelTe: 'పురుషుడు', labelHi: 'पुरुष', spoken: 'పురుషుడు' },
        { labelEn: 'Prefer not to say', labelTe: 'చెప్పడానికి ఇష్టం లేదు', labelHi: 'कहना नहीं चाहते', spoken: 'other' },
      ],
      parse: parseGender,
    },
    {
      id: 4,
      key: 'height',
      questionEn: 'What is your height?',
      questionTe: 'మీ ఎత్తు ఎంత?',
      questionHi: 'आपकी ऊंचाई कितनी है?',
      promptEn: 'What is your height in centimeters or feet?',
      promptTe: 'మీ ఎత్తు ఎంత? సెంటీమీటర్లు లేదా అడుగుల్లో చెప్పండి.',
      promptHi: 'आपकी ऊंचाई कितनी है?',
      icon: Activity,
      quickOptions: [
        { labelEn: '155 cm (5 ft 1)', labelTe: '155 సెం.మీ', labelHi: '155 सेमी', spoken: '155 cm' },
        { labelEn: '165 cm (5 ft 5)', labelTe: '165 సెం.మీ', labelHi: '165 सेमी', spoken: '165' },
        { labelEn: '172 cm (5 ft 8)', labelTe: '172 సెం.మీ', labelHi: '172 सेमी', spoken: '172 cm' },
      ],
      parse: parseHeight,
    },
    {
      id: 5,
      key: 'weight',
      questionEn: 'What is your weight?',
      questionTe: 'మీ బరువు ఎంత?',
      questionHi: 'आपका वजन कितना है?',
      promptEn: 'What is your weight in kilograms?',
      promptTe: 'మీ బరువు ఎన్ని కిలోలు?',
      promptHi: 'आपका वजन कितने किलो है?',
      icon: Activity,
      quickOptions: [
        { labelEn: '55 kg', labelTe: '55 కిలోలు', labelHi: '55 किलो', spoken: '55 kg' },
        { labelEn: '62 kg', labelTe: '62 కిలోలు', labelHi: '62 किलो', spoken: 'అరవై రెండు కిలోలు' },
        { labelEn: '70 kg', labelTe: '70 కిలోలు', labelHi: '70 किलो', spoken: '70 kg' },
        { labelEn: '78 kg', labelTe: '78 కిలోలు', labelHi: '78 किलो', spoken: '78 kg' },
      ],
      parse: parseWeight,
    },
    {
      id: 6,
      key: 'sleep',
      questionEn: 'How many hours do you usually sleep at night?',
      questionTe: 'రాత్రికి సాధారణంగా ఎన్ని గంటలు నిద్రపోతారు?',
      questionHi: 'रात में आप आमतौर पर कितने घंटे सोते हैं?',
      promptEn: 'How many hours do you usually sleep at night?',
      promptTe: 'రాత్రికి సాధారణంగా ఎన్ని గంటలు నిద్రపోతారు?',
      promptHi: 'रात में आप आमतौर पर कितने घंटे सोते हैं?',
      icon: Moon,
      quickOptions: [
        { labelEn: '6 Hours', labelTe: '6 గంటలు', labelHi: '6 घंटे', spoken: 'ఒక ఆరు గంటలు పడుకుంటాను' },
        { labelEn: '7 Hours', labelTe: '7 గంటలు', labelHi: '7 घंटे', spoken: '7 hours' },
        { labelEn: '8 Hours', labelTe: '8 గంటలు', labelHi: '8 घंटे', spoken: '8 hours' },
      ],
      parse: parseSleep,
    },
    {
      id: 7,
      key: 'water',
      questionEn: 'How many glasses or liters of water do you drink in a day?',
      questionTe: 'రోజుకు ఎన్ని గ్లాసులు లేదా లీటర్ల నీళ్లు తాగుతారు?',
      questionHi: 'दिन में कितने गिलास या लीटर पानी पीते हैं?',
      promptEn: 'How many glasses or liters of water do you drink in a day?',
      promptTe: 'రోజుకు ఎన్ని గ్లాసులు లేదా లీటర్ల నీళ్లు తాగుతారు?',
      promptHi: 'दिन में कितने गिलास या लीटर पानी पीते हैं?',
      icon: Droplets,
      quickOptions: [
        { labelEn: '2 Liters (8 glasses)', labelTe: '2 లీటర్లు', labelHi: '2 लीटर', spoken: '2 liters' },
        { labelEn: '2.5 Liters (10 glasses)', labelTe: '2.5 లీటర్లు', labelHi: '2.5 लीटर', spoken: 'రోజుకు రెండున్నర లీటర్లు' },
        { labelEn: '3 Liters (12 glasses)', labelTe: '3 లీటర్లు', labelHi: '3 लीटर', spoken: '3 liters' },
      ],
      parse: parseWater,
    },
    {
      id: 8,
      key: 'activity',
      questionEn: 'Do you go for walks or do daily physical work?',
      questionTe: 'మీరు రోజూ నడవడం లేదా శారీరక శ్రమ చేస్తారా?',
      questionHi: 'क्या आप रोज़ टहलते हैं या शारीरिक श्रम करते हैं?',
      promptEn: 'Do you go for walks or do daily physical work?',
      promptTe: 'మీరు రోజూ నడవడం లేదా శారీరక శ్రమ చేస్తారా?',
      promptHi: 'क्या आप रोज़ टहलते हैं या शारीरिक श्रम करते हैं?',
      icon: Activity,
      quickOptions: [
        { labelEn: 'Daily Walking', labelTe: 'రోజూ నడుస్తాను', labelHi: 'रोज़ टहलता हूँ', spoken: 'రోజు వాకింగ్ చేస్తాను' },
        { labelEn: 'Moderate Work', labelTe: 'సాధారణ శ్రమ', labelHi: 'मध्यम श्रम', spoken: 'moderate physical work' },
        { labelEn: 'Light / Minimal', labelTe: 'తక్కువ శ్రమ', labelHi: 'कम श्रम', spoken: 'light activity' },
      ],
      parse: parseDailyActivity,
    },
    {
      id: 9,
      key: 'exercise',
      questionEn: 'How many days a week do you do physical exercise?',
      questionTe: 'వారంలో ఎన్ని రోజులు వ్యాయామం చేస్తారు?',
      questionHi: 'हफ्ते में कितने दिन व्यायाम करते हैं?',
      promptEn: 'How many days a week do you do physical exercise?',
      promptTe: 'వారంలో ఎన్ని రోజులు వ్యాయామం చేస్తారు?',
      promptHi: 'हफ्ते में कितने दिन व्यायाम करते हैं?',
      icon: Activity,
      quickOptions: [
        { labelEn: 'Rarely / None', labelTe: 'చేయను', labelHi: 'नहीं करता', spoken: 'rarely' },
        { labelEn: '1-2 Days', labelTe: '1-2 రోజులు', labelHi: '1-2 दिन', spoken: '1-2 days' },
        { labelEn: '3-4 Days', labelTe: '3-4 రోజులు', labelHi: '3-4 दिन', spoken: '3-4 days' },
        { labelEn: '5+ Days', labelTe: '5+ రోజులు', labelHi: '5+ दिन', spoken: 'daily exercise' },
      ],
      parse: parseExerciseFrequency,
    },
    {
      id: 10,
      key: 'medicines',
      questionEn: 'Do you take any regular medicines every day?',
      questionTe: 'రోజూ వేసుకునే మందులు ఏవైనా ఉన్నాయా?',
      questionHi: 'क्या आप रोज़ कोई दवाइयाँ लेते हैं?',
      promptEn: 'Do you take any regular medicines every day?',
      promptTe: 'మీరు రోజూ ఏవైనా మందులు వేసుకుంటారా?',
      promptHi: 'क्या आप रोज़ कोई दवाइयाँ लेते हैं?',
      icon: Pill,
      quickOptions: [
        { labelEn: 'No Medicines', labelTe: 'మందులు లేవు', labelHi: 'दवाइयाँ नहीं हैं', spoken: 'లేదు' },
        { labelEn: 'Yes, Daily Medicines', labelTe: 'అవును, రోజూ వేసుకుంటాను', labelHi: 'हाँ, रोज़ लेता हूँ', spoken: 'అవును రోజూ వేసుకుంటాను' },
      ],
      parse: parseMedicines,
    },
    {
      id: 11,
      key: 'conditions',
      questionEn: 'Do you have any health problems like sugar, BP, or asthma?',
      questionTe: 'షుగర్, బీపీ లేదా ఆస్తమా వంటి ఏవైనా సమస్యలు ఉన్నాయా?',
      questionHi: 'क्या आपको शुगर, बीपी या अस्थमा जैसी कोई समस्या है?',
      promptEn: 'Do you have any health problems like sugar, BP, or asthma?',
      promptTe: 'షుగర్, బీపీ లేదా ఆస్తమా వంటి ఏవైనా సమస్యలు ఉన్నాయా?',
      promptHi: 'क्या आपको शुगर, बीपी या अस्थमा जैसी कोई समस्या है?',
      icon: HeartPulse,
      quickOptions: [
        { labelEn: 'None / Healthy', labelTe: 'ఏమీ లేవు', labelHi: 'कोई नहीं', spoken: 'ఏమీ లేవు' },
        { labelEn: 'Sugar & BP', labelTe: 'షుగర్ & బీపీ', labelHi: 'शुगर और बीपी', spoken: 'షుగర్ ఉంది బీపీ ఉంది' },
        { labelEn: 'Asthma', labelTe: 'ఆస్తమా', labelHi: 'अस्थमा', spoken: 'ఆస్తమా ఉంది' },
        { labelEn: 'Thyroid', labelTe: 'థైరాయిడ్', labelHi: 'थायराइड', spoken: 'థైరాయిడ్' },
      ],
      parse: parseConditions,
    },
    {
      id: 12,
      key: 'habits',
      questionEn: 'Do you smoke or drink alcohol?',
      questionTe: 'పొగతాగడం లేదా ఆల్కహాల్ అలవాటు ఉందా?',
      questionHi: 'क्या आपको धूम्रपान या शराब पीने की आदत है?',
      promptEn: 'Do you smoke or drink alcohol?',
      promptTe: 'పొగతాగడం లేదా ఆల్కహాల్ అలవాటు ఉందా?',
      promptHi: 'क्या आपको धूम्रपान या शराब पीने की आदत है?',
      icon: ShieldCheck,
      quickOptions: [
        { labelEn: 'No Habits / Never', labelTe: 'ఏ అలవాటు లేదు', labelHi: 'कोई आदत नहीं', spoken: 'ఏ అలవాటు లేదు' },
        { labelEn: 'Occasional Alcohol', labelTe: 'అప్పుడప్పుడు ఆల్కహాల్', labelHi: 'कभी-कभार शराब', spoken: 'occasional alcohol' },
        { labelEn: 'Smoker', labelTe: 'పొగతాగడం ఉంది', labelHi: 'धूम्रपान करता हूँ', spoken: 'smoking' },
      ],
      parse: parseHabits,
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

  // Stop TTS on unmount or step switch
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

  // When step changes, read prompt aloud automatically in female voice
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

    // Small delay to let UI render before speech starts
    const timer = setTimeout(() => {
      speakNaturalVoice(promptText, language);
    }, 350);

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
  const handleQuickOptionSelect = (opt: { spoken: string; labelEn: string; labelTe: string; labelHi: string }) => {
    stopSpeakingAudio();
    const spoken = opt.spoken;
    setSpeechTranscript(spoken);
    const parsed = currentQ.parse(spoken);
    setCurrentResult(parsed);
    setManualEditText(parsed.structuredDisplay);
  };

  // Confirm Answer and Proceed to Next Question
  const handleConfirmAnswer = () => {
    if (!currentResult && !manualEditText) return;

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

    // Check if finished 12 questions
    if (stepIndex < QUESTIONS.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      // Completed all 12 questions! Finalize Health Profile
      finalizeProfile(updatedAnswers);
    }
  };

  // Skip current question with default
  const handleSkipQuestion = () => {
    if (stepIndex < QUESTIONS.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      finalizeProfile(answers);
    }
  };

  // Finalize Health Profile and Navigate to Personalized Home
  const finalizeProfile = (finalAnswers: Record<string, any>) => {
    stopSpeakingAudio();

    const canonicalName = finalAnswers.name || 'Rohini';
    updateUserName(canonicalName);

    const fullProfile: HealthProfile = {
      age: finalAnswers.age ? Number(finalAnswers.age) : 28,
      gender: finalAnswers.gender || 'female',
      height: finalAnswers.height ? Number(finalAnswers.height) : 165,
      weight: finalAnswers.weight ? Number(finalAnswers.weight) : 62,
      typicalSleep: finalAnswers.sleep ? Number(finalAnswers.sleep) : 7.5,
      typicalWater: finalAnswers.water ? Number(finalAnswers.water) : 2.5,
      physicalActivity: (finalAnswers.activity as any) || 'moderate',
      averageSteps: 7000,
      exerciseFrequency: (finalAnswers.exercise as any) || '3-4_days',
      currentMood: 'good',
      typicalStress: 'moderate',
      nutritionPattern: 'balanced',
      managesPrescribedMedicines: Boolean(finalAnswers.medicines),
      existingHealthConditions: Array.isArray(finalAnswers.conditions) ? finalAnswers.conditions : [],
      smokingHabit: finalAnswers.habits?.smoking || 'Non-smoker',
      alcoholHabit: finalAnswers.habits?.alcohol || 'Rarely / Never',
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

  const progressPercent = Math.round(((stepIndex + 1) / QUESTIONS.length) * 100);

  return (
    <div className="max-w-xl mx-auto px-4 py-4">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
        
        {/* Top Header & Language Selector */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
                <HeartPulse className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-display font-black text-sm text-white">MediMitra</span>
                <span className="block text-[10px] text-blue-200 font-bold uppercase tracking-wider">
                  {t.voiceFirstRegistration}
                </span>
              </div>
            </div>

            {/* Language Switcher */}
            <div className="inline-flex bg-white/15 p-0.5 rounded-xl backdrop-blur-xs border border-white/20">
              <button
                type="button"
                onClick={() => setLanguage('te-IN')}
                className={`px-2 py-0.5 text-xs font-bold rounded-lg transition-colors ${
                  language === 'te-IN' ? 'bg-white text-blue-900' : 'text-blue-100'
                }`}
              >
                తెలుగు
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi-IN')}
                className={`px-2 py-0.5 text-xs font-bold rounded-lg transition-colors ${
                  language === 'hi-IN' ? 'bg-white text-blue-900' : 'text-blue-100'
                }`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en-IN')}
                className={`px-2 py-0.5 text-xs font-bold rounded-lg transition-colors ${
                  language === 'en-IN' ? 'bg-white text-blue-900' : 'text-blue-100'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-blue-100 mb-1.5">
              <span>
                {language === 'te-IN'
                  ? `ప్రశ్న ${stepIndex + 1} / 12`
                  : language === 'hi-IN'
                  ? `प्रश्न ${stepIndex + 1} / 12`
                  : `Question ${stepIndex + 1} of 12`}
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Main Question Area (One question at a time) */}
        <div className="p-6 space-y-6">

          {/* Large Question Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mb-1 border border-blue-100 shadow-xs">
              <currentQ.icon className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 leading-tight">
              {questionTitle}
            </h2>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleListenQuestion}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{t.repeat}</span>
              </button>
            </div>
          </div>

          {/* Large "Tap to Speak" Microphone Button */}
          <div className="flex flex-col items-center justify-center py-2">
            <button
              type="button"
              onClick={toggleListening}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all transform active:scale-95 cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white ring-8 ring-rose-200 animate-pulse'
                  : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/30'
              }`}
            >
              {isListening ? (
                <MicOff className="w-10 h-10" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
            </button>
            <span className="text-xs font-bold text-slate-600 mt-3">
              {isListening
                ? t.listeningWave
                : language === 'te-IN'
                ? 'మాట్లాడటానికి మైక్ నొక్కండి'
                : language === 'hi-IN'
                ? 'बोलने के लिए माइक दबाएं'
                : 'Tap to Speak'}
            </span>
          </div>

          {/* MANDATORY CONFIRMATION BOX (Requirement 3) */}
          {(speechTranscript || currentResult) && (
            <div className="bg-slate-50 border-2 border-blue-200 rounded-2xl p-4 space-y-3">
              
              {/* YOU SAID: [exact speech transcription] */}
              <div className="border-b border-slate-200 pb-2.5">
                <span className="block text-[11px] font-black uppercase tracking-wider text-slate-500">
                  {t.youSaid}
                </span>
                <p className="text-base font-bold text-slate-800 italic mt-0.5">
                  "{speechTranscript || currentResult?.rawSpoken}"
                </p>
              </div>

              {/* REGISTERING AS: [structured value] */}
              <div className="border-b border-slate-200 pb-2.5">
                <span className="block text-[11px] font-black uppercase tracking-wider text-blue-700">
                  {t.registeringAs}
                </span>
                {isManualEditing ? (
                  <input
                    type="text"
                    value={manualEditText}
                    onChange={(e) => setManualEditText(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-white border border-blue-400 rounded-lg text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-lg font-black text-emerald-700 mt-0.5 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>{currentResult?.structuredDisplay || manualEditText}</span>
                  </div>
                )}
              </div>

              {/* Low Confidence Warning Notice */}
              {currentResult?.confidence === 'low' && (
                <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{t.pleaseCheckThis}</span>
                </div>
              )}

              {/* Confirmation Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmAnswer}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.confirm}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsManualEditing(!isManualEditing)}
                  className="py-3 px-3.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={toggleListening}
                  className="py-3 px-3.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* Quick Choice Pills (Fallback to avoid voice-only trap) */}
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
              {language === 'te-IN'
                ? 'లేదా ఒకదాన్ని ఎంచుకోండి:'
                : language === 'hi-IN'
                ? 'या विकल्प चुनें:'
                : 'Or tap a quick choice:'}
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
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
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls: Back, Skip */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {stepIndex > 0 ? (
              <button
                type="button"
                onClick={() => setStepIndex((prev) => prev - 1)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{language === 'te-IN' ? 'వెనక్కి' : language === 'hi-IN' ? 'पीछे' : 'Back'}</span>
              </button>
            ) : (
              <div></div>
            )}

            <button
              type="button"
              onClick={handleSkipQuestion}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              {t.skipStep}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
