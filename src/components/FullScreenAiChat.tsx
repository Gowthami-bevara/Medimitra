import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  ArrowLeft,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  User as UserIcon,
  ShieldCheck,
  RotateCcw,
  Globe,
  Radio,
  Square,
  AlertCircle,
  PhoneCall,
  Building2,
  Stethoscope,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/i18n';
import { speakNaturalVoice, stopSpeakingAudio } from '../utils/voiceManager';
import { getLocalizedUserName } from '../utils/nameTransliteration';
import { AppLanguage } from '../types';

function cleanAiText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/```(?:xml|html|svg)?[\s\S]*?```/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z0-9]+;/gi, ' ')
    .trim();
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isVoice?: boolean;
}

export const FullScreenAiChat: React.FC = () => {
  const {
    language,
    setLanguage,
    setIsVoiceAssistantOpen,
    setActiveTab,
    user,
    todayLog,
    healthProfile,
    prediction,
    medicines,
    userLocation,
  } = useApp();

  const t = TRANSLATIONS[language];

  // Conversation history (initial welcome greeting tailored to language)
  const getInitialGreeting = (lang: AppLanguage): string => {
    const locName = getLocalizedUserName(user?.name, lang);
    if (lang === 'te-IN') {
      return `నమస్కారం, ${locName} గారు! నేను మీ మెడిమిత్ర. కంగారు పడకండి, మీ ఆరోగ్యం, బీపీ, షుగర్, టాబ్లెట్స్ లేదా ఆహారం గురించి ఏ సందేహం ఉన్నా నాతో చెప్పండి. మాట్లాడటానికి మైక్ నొక్కండి లేదా ఇక్కడ టైప్ చేయండి.`;
    }
    if (lang === 'hi-IN') {
      return `नमस्ते, ${locName} जी! मैं मेडीमित्र हूँ, आपका व्यक्तिगत स्वास्थ्य और सुरक्षा साथी। स्वास्थ्य, दिनचर्या, खान-पान या दवाइयों के बारे में कोई भी प्रश्न हो तो बेझिझक पूछें।`;
    }
    return `Hello, ${locName}! I am MediMitra, your personal health and safety companion. You can ask me about wellness, hydration, sleep, symptom check guidance, or health routines. Tap the microphone to speak or type your question below.`;
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-init',
      sender: 'assistant',
      text: getInitialGreeting(language),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [voiceSpeechEnabled, setVoiceSpeechEnabled] = useState(true);
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeechChunk, setCurrentSpeechChunk] = useState(1);
  const [totalSpeechChunks, setTotalSpeechChunks] = useState(1);
  const [ttsNotice, setTtsNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom whenever messages or status changes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, isListening, interimTranscript]);

  // Clean up speech on unmount
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

  // Suggested quick prompts in selected language
  const quickPrompts = {
    'en-IN': [
      'How much water should I drink today?',
      'Tips to improve my sleep quality',
      'What does my wellness score mean?',
      'I have a mild headache since morning',
      'When should I contact emergency 108?',
    ],
    'te-IN': [
      'ఈ రోజు నేను ఎంత నీరు త్రాగాలి?',
      'మంచి నిద్ర కోసం చిట్కాలు చెప్పండి',
      'నా వెల్నెస్ స్కోరు అర్థం ఏమిటి?',
      'నాకు ఉదయం నుంచి స్వల్ప తలనొప్పిగా ఉంది',
      'అత్యవసర 108 ని ఎప్పుడు సంప్రదించాలి?',
    ],
    'hi-IN': [
      'मुझे आज कितना पानी पीना चाहिए?',
      'अच्छी नींद के लिए सुझाव दीजिए',
      'मेरे स्वास्थ्य स्कोर का क्या अर्थ है?',
      'मुझे सुबह से हल्का सिरदर्द है',
      'आपातकालीन 108 पर कब कॉल करना चाहिए?',
    ],
  }[language] || [];

  // Toggle voice recognition
  const handleToggleVoice = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      setInterimTranscript('');
      return;
    }

    stopSpeakingAudio();
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use the text input below.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        let finalTrans = '';
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
        }

        if (finalTrans) {
          setIsListening(false);
          setInterimTranscript('');
          handleSendMessage(finalTrans, true);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  // Full Natural Voice Playback with chunking & listener callbacks
  const playAiVoice = (msgId: string, text: string) => {
    stopSpeakingAudio();
    setActiveSpeechId(msgId);
    setIsSpeaking(true);
    setCurrentSpeechChunk(1);
    setTotalSpeechChunks(1);
    setTtsNotice(null);

    speakNaturalVoice(text, language, {
      onStart: () => {
        setIsSpeaking(true);
      },
      onChunkStart: (chunkIdx, total) => {
        setIsSpeaking(true);
        setCurrentSpeechChunk(chunkIdx);
        setTotalSpeechChunks(total);
      },
      onEnd: () => {
        setIsSpeaking(false);
        setActiveSpeechId(null);
      },
      onError: (err) => {
        setIsSpeaking(false);
        setActiveSpeechId(null);
        if (err === 'telugu_female_unavailable') {
          setTtsNotice(
            language === 'te-IN'
              ? 'గమనిక: మీ డివైజ్‌లో తెలుగు స్త్రీ వాయిస్ అందుబాటులో లేదు. సమాధానం పూర్తిగా స్క్రీన్‌పై చదవండి.'
              : 'Note: Natural female voice is unavailable on this device. Complete text response is displayed.'
          );
        }
      },
    });
  };

  const handleStopSpeaking = () => {
    stopSpeakingAudio();
    setIsSpeaking(false);
    setActiveSpeechId(null);
  };

  // Replay or toggle message audio
  const handlePlayMessageAudio = (msgId: string, text: string) => {
    if (activeSpeechId === msgId && isSpeaking) {
      handleStopSpeaking();
      return;
    }
    playAiVoice(msgId, text);
  };

  // Send message to server or fallback
  const handleSendMessage = async (textToSend: string, fromVoice = false) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    // Immediately stop any prior voice playback
    handleStopSpeaking();

    // Add user chat bubble immediately
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isVoice: fromVoice,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setInterimTranscript('');
    setIsThinking(true);

    try {
      // Send to server API with full user wellness context
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          messages: [{ role: 'user', content: trimmed }],
          language,
          userContext: {
            name: user?.name,
            age: healthProfile?.age,
            sleepDuration: todayLog.sleepDuration,
            waterIntakeLiters: todayLog.waterIntakeLiters,
            steps: todayLog.steps,
            mood: todayLog.mood,
            stressLevel: todayLog.stressLevel,
            overallScore: prediction.overallScore,
            predictionStatus: prediction.status,
            prescriptionsCount: medicines.length,
            userLocationArea: userLocation?.area || 'Hyderabad, Telangana',
          },
        }),
      });

      let replyText = '';
      if (response.ok) {
        const data = await response.json();
        replyText = cleanAiText(data.reply || data.response || '');
      }

      if (!replyText) {
        // Safe intelligent fallback if offline or no server response
        replyText = cleanAiText(generateSafeFallbackReply(trimmed, language));
      }

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsThinking(false);

      // Speak complete AI response sequentially if voice audio is enabled
      if (voiceSpeechEnabled) {
        playAiVoice(assistantMsg.id, replyText);
      }
    } catch (err) {
      console.warn('Backend chat API failed, using client fallback:', err);
      const fallback = cleanAiText(generateSafeFallbackReply(trimmed, language));
      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: fallback,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsThinking(false);
      if (voiceSpeechEnabled) {
        playAiVoice(assistantMsg.id, fallback);
      }
    }
  };

  // Safe client fallback generator honoring medical safety and multi-language
  const generateSafeFallbackReply = (query: string, lang: AppLanguage): string => {
    const q = query.toLowerCase();

    // Red flag symptoms check
    if (
      q.includes('chest pain') ||
      q.includes('heart attack') ||
      q.includes('can’t breathe') ||
      q.includes('cannot breathe') ||
      q.includes('unconscious') ||
      q.includes('గుండె నొప్పి') ||
      q.includes('ఛాతీ నొప్పి') ||
      q.includes('శ్వాస ఆడటం లేదు') ||
      q.includes('सीने में दर्द') ||
      q.includes('सांस नहीं')
    ) {
      if (lang === 'te-IN') {
        return 'కంగారు పడకండి, కానీ ఛాతీలో నొప్పి లేదా శ్వాస ఆడకపోవడం అత్యవసర పరిస్థితి కావచ్చు. అస్సలు ఆలస్యం చేయకుండా వెంటనే 108 కి కాల్ చేయండి లేదా దగ్గరలోని హాస్పిటల్ కి వెళ్లండి. కుటుంబ సభ్యులని తోడు తీసుకోండి.';
      }
      if (lang === 'hi-IN') {
        return 'चेतावनी: सीने में तेज दर्द या सांस लेने में गंभीर कठिनाई आपातकालीन स्थिति हो सकती है। कृपया तुरंत 108 पर कॉल करें या नजदीकी आपातकालीन अस्पताल जाएं।';
      }
      return 'CRITICAL NOTICE: Severe chest discomfort or acute breathing difficulty requires immediate emergency care. Please dial 108 or 112 immediately or proceed to the nearest emergency trauma department.';
    }

    // Hydration query
    if (q.includes('water') || q.includes('నీరు') || q.includes('నీళ్లు') || q.includes('पानी')) {
      if (lang === 'te-IN') {
        return `రోజూ 2.5 నుండి 3 లీటర్ల మంచి నీళ్లు తాగడం ఆరోగ్యానికి చాలా ముఖ్యం. ఇప్పటివరకు మీరు దాదాపు ${todayLog.waterIntakeLiters.toFixed(1)} లీటర్లు తాగినట్లు నమోదైంది. కొద్ది కొద్దిగా నీళ్లు తాగుతూ హైడ్రేటెడ్‌గా ఉండండి.`;
      }
      if (lang === 'hi-IN') {
        return `एक स्वस्थ वयस्क के लिए रोजाना 2.5 से 3.0 लीटर पानी पीने की सलाह दी जाती है। आज आपका दर्ज पानी लगभग ${todayLog.waterIntakeLiters.toFixed(1)} लीटर है। नियमित रूप से पानी पिएं। यह केवल सामान्य जानकारी है।`;
      }
      return `For healthy adults, a daily fluid intake of 2.5 to 3.0 liters is generally recommended. Today your tracked intake is ${todayLog.waterIntakeLiters.toFixed(1)}L. Stay consistently hydrated throughout your routine.`;
    }

    // Sleep query
    if (q.includes('sleep') || q.includes('నిద్ర') || q.includes('నీంద')) {
      if (lang === 'te-IN') {
        return `రాత్రి 7 నుండి 8 గంటలు హాయిగా నిద్రపోవడం బీపీ నియంత్రణకు మరియు శరీరానికి చాలా అవసరం. పడుకునే అరగంట ముందు మొబైల్ స్క్రీన్ పక్కన పెట్టి ప్రశాంతంగా రెస్ట్ తీసుకోండి.`;
      }
      if (lang === 'hi-IN') {
        return `वयस्कों के लिए प्रति रात 7 से 8 घंटे की अच्छी नींद आवश्यक है। सोने से 30 मिनट पहले मोबाइल और स्क्रीन का उपयोग कम करें।`;
      }
      return `Aim for 7 to 8 hours of restorative sleep each night. Establishing a consistent sleep-wake schedule and winding down away from digital screens 30 minutes prior greatly enhances recovery.`;
    }

    // Default guidance
    if (lang === 'te-IN') {
      return `మీరు చెప్పింది విన్నాను. కంగారు పడకండి. మీ ఆరోగ్యం కోసం సమయానికి ఆహారం, తగినంత రెస్ట్, మరియు రోజూ కాస్త వాకింగ్ చాలా ముఖ్యం. డాక్టర్ రాసిచ్చిన టాబ్లెట్స్ ఏవైనా వేసుకుంటున్నారా? మీ బీపీ లేదా షుగర్ రిపోర్ట్స్ ఎలా ఉన్నాయో చెప్పండి.`;
    }
    if (lang === 'hi-IN') {
      return `आपके प्रश्न के लिए धन्यवाद। मेडीमित्र सामान्य स्वास्थ्य जागरूकता और कल्याण मार्गदर्शन प्रदान करता है। यदि कोई लक्षण बना रहे, तो कृपया किसी योग्य चिकित्सक से परामर्श करें। दवा लेने से पहले डॉक्टर की सलाह आवश्यक है।`;
    }
    return `Thank you for sharing. MediMitra provides personalized wellness insights and health education. Remember that this is guidance rather than a formal diagnosis. If you experience persistent symptoms, always consult a qualified medical practitioner.`;
  };

  return (
    <div
      id="fullscreen-ai-chat-container"
      className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden text-slate-900"
    >
      {/* Top Header Bar */}
      <header className="bg-white border-b border-blue-100 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-to-dashboard"
            onClick={() => {
              stopSpeakingAudio();
              setIsVoiceAssistantOpen(false);
            }}
            className="p-2 -ml-1.5 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-blue-900 transition-colors flex items-center gap-1 text-xs font-bold"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-blue-700" />
            <span className="hidden sm:inline">{t.backToHome}</span>
          </button>

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-base sm:text-lg text-blue-950">
                  Medi<span className="text-blue-600">Mitra</span> AI
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Online
                </span>
                {language === 'te-IN' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200 hidden sm:inline">
                    Female Voice Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Voice & Text Companion • Multilingual Healthcare Assistance
              </p>
            </div>
          </div>
        </div>

        {/* Right Header Controls: Language Selector & Audio Mute/Unmute */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            {(['en-IN', 'te-IN', 'hi-IN'] as AppLanguage[]).map((lang) => (
              <button
                key={lang}
                id={`chat-lang-${lang}`}
                onClick={() => {
                  setLanguage(lang);
                  stopSpeakingAudio();
                }}
                className={`px-2 py-1 rounded-lg transition-all ${
                  language === lang
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-blue-900'
                }`}
              >
                {lang === 'en-IN' ? 'EN' : lang === 'te-IN' ? 'తెలుగు' : 'हिन्दी'}
              </button>
            ))}
          </div>

          {/* Voice Audio Readout Toggle */}
          <button
            id="btn-toggle-chat-audio"
            onClick={() => {
              if (voiceSpeechEnabled) stopSpeakingAudio();
              setVoiceSpeechEnabled(!voiceSpeechEnabled);
            }}
            className={`p-2 rounded-xl border transition-colors ${
              voiceSpeechEnabled
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
            title={voiceSpeechEnabled ? 'AI Voice Response Active (Click to Mute)' : 'AI Voice Response Muted (Click to Unmute)'}
          >
            {voiceSpeechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Safety Notice Strip */}
      <div className="bg-blue-50/80 border-b border-blue-100 px-4 py-2 flex items-center justify-between text-xs text-slate-600 shrink-0">
        <div className="flex items-center gap-2 max-w-4xl">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-[11px] sm:text-xs leading-tight">
            <strong>Medical Safety:</strong> MediMitra provides wellness guidance only. It does not diagnose diseases or prescribe medication. In emergency, call 108/112 immediately.
          </span>
        </div>
        <button
          onClick={() => {
            setMessages([
              {
                id: `reset-${Date.now()}`,
                sender: 'assistant',
                text: getInitialGreeting(language),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
            stopSpeakingAudio();
          }}
          className="text-[11px] font-bold text-slate-500 hover:text-blue-700 flex items-center gap-1 shrink-0 ml-2"
          title="Clear and reset chat history"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Main Visible Chat Messages Area */}
      <div
        id="fullscreen-chat-messages-box"
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5"
      >
        <div className="max-w-3xl mx-auto space-y-4">
          
          {/* Active Voice Speaking Banner */}
          {isSpeaking && (
            <div
              id="active-speaking-banner"
              className="sticky top-0 z-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white px-4 py-2.5 rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-in slide-in-from-top-2"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex items-end gap-1 h-4">
                  <span className="w-1 bg-white rounded-full animate-pulse h-4" />
                  <span className="w-1 bg-white rounded-full animate-ping h-2.5" />
                  <span className="w-1 bg-white rounded-full animate-pulse h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-black block">
                    {language === 'te-IN'
                      ? 'మెడిమిత్ర స్వరం ద్వారా సమాధానం వివరిస్తున్నారు...'
                      : language === 'hi-IN'
                      ? 'मेडिमित्र आवाज़ में समझा रहे हैं...'
                      : 'MediMitra is speaking complete guidance...'}
                  </span>
                  {totalSpeechChunks > 1 && (
                    <span className="text-[10px] text-blue-200 block">
                      Section {currentSpeechChunk} of {totalSpeechChunks}
                    </span>
                  )}
                </div>
              </div>

              <button
                id="btn-stop-active-speech"
                onClick={handleStopSpeaking}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>{language === 'te-IN' ? 'వాయిస్ ఆపు (Stop)' : language === 'hi-IN' ? 'रोकें (Stop)' : 'Stop Voice'}</span>
              </button>
            </div>
          )}

          {ttsNotice && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{ttsNotice}</span>
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSpeakingThis = activeSpeechId === msg.id && isSpeaking;
            const textLower = msg.text.toLowerCase();
            const hasDoctorMention =
              textLower.includes('doctor') ||
              textLower.includes('వైద్యు') ||
              textLower.includes('డాక్టర్') ||
              textLower.includes('डॉक्टर') ||
              textLower.includes('consult');
            const hasEmergencyMention =
              textLower.includes('108') ||
              textLower.includes('112') ||
              textLower.includes('emergency') ||
              textLower.includes('అత్యవసర') ||
              textLower.includes('ఆసుపత్రి') ||
              textLower.includes('आपातकाल');
            const hasOtcMention =
              textLower.includes('otc') ||
              textLower.includes('ఓవర్-ది-కౌంటర్') ||
              textLower.includes('సాధారణ సలహా') ||
              textLower.includes('పారాసిటమాల్') ||
              textLower.includes('paracetamol');

            return (
              <div
                key={msg.id}
                id={`chat-bubble-${msg.id}`}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-xl rounded-3xl p-4 sm:p-5 shadow-xs transition-all ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-white border border-blue-100 text-slate-900 rounded-tl-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5 text-[11px]">
                    <span className={`font-bold ${isUser ? 'text-blue-100' : 'text-blue-950'}`}>
                      {isUser ? user?.name || 'You' : 'MediMitra Assistant'}
                      {msg.isVoice && (
                        <span className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-blue-500/40 text-[9px]">
                          <Mic className="w-2.5 h-2.5" /> Voice
                        </span>
                      )}
                    </span>
                    <span className={isUser ? 'text-blue-200' : 'text-slate-400'}>
                      {msg.timestamp}
                    </span>
                  </div>

                  <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-medium">
                    {msg.text}
                  </p>

                  {/* OTC Non-Prescription Guidance Badge */}
                  {!isUser && hasOtcMention && (
                    <div className="mt-3 p-2 rounded-xl bg-blue-50/70 border border-blue-200 text-[11px] text-blue-900 flex items-start gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span>
                        {language === 'te-IN'
                          ? 'సాధారణ అవగాహన సమాచారం మాత్రమే. ఇది మందుల ప్రిస్క్రిప్షన్ కాదు. సరైన మోతాదు కోసం ఫార్మసిస్ట్ లేదా డాక్టర్‌ను సంప్రదించండి.'
                          : 'General OTC awareness only. MediMitra never prescribes medicines. Always consult a licensed doctor or pharmacist.'}
                      </span>
                    </div>
                  )}

                  {/* Clinical Actions Bar for AI bubbles */}
                  {!isUser && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          id={`btn-play-voice-${msg.id}`}
                          onClick={() => handlePlayMessageAudio(msg.id, msg.text)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isSpeakingThis
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                          }`}
                        >
                          {isSpeakingThis ? (
                            <>
                              <Square className="w-3.5 h-3.5 fill-white" />
                              <span>{language === 'te-IN' ? 'వాయిస్ ఆపు (Stop)' : 'Stop Voice'}</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>{language === 'te-IN' ? 'మళ్ళీ వినండి (Replay)' : t.replayAudio}</span>
                            </>
                          )}
                        </button>

                        <span className="text-[10px] text-slate-400 font-medium">
                          {isSpeakingThis ? 'Speaking...' : 'Complete Voice Audio'}
                        </span>
                      </div>

                      {/* Doctor / Hospital Quick Actions */}
                      {hasDoctorMention && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            onClick={() => {
                              setIsVoiceAssistantOpen(false);
                              setActiveTab('doctors');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[11px] font-bold transition-colors"
                          >
                            <Stethoscope className="w-3 h-3 text-indigo-600" />
                            <span>{language === 'te-IN' ? 'సమీప వైద్యులు' : 'Find Doctors'}</span>
                          </button>

                          <button
                            onClick={() => {
                              setIsVoiceAssistantOpen(false);
                              setActiveTab('hospitals');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-bold transition-colors"
                          >
                            <Building2 className="w-3 h-3 text-blue-600" />
                            <span>{language === 'te-IN' ? 'సమీప ఆసుపత్రులు' : 'Find Hospitals'}</span>
                          </button>
                        </div>
                      )}

                      {/* Emergency Quick Actions */}
                      {hasEmergencyMention && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          <a
                            href="tel:112"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-colors"
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>Call 112 (National Emergency)</span>
                          </a>

                          <a
                            href="tel:108"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold transition-colors"
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>Call 108 (Ambulance)</span>
                          </a>

                          <button
                            onClick={() => {
                              setIsVoiceAssistantOpen(false);
                              setActiveTab('emergency');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-800 text-[11px] font-bold transition-colors"
                          >
                            <span>Emergency Hub</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Thinking Indicator */}
          {isThinking && (
            <div className="flex gap-3 justify-start animate-in fade-in duration-200">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-blue-100 rounded-3xl rounded-tl-xs p-4 shadow-xs flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse delay-150"></span>
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse delay-300"></span>
                </div>
                <span className="text-xs font-bold text-blue-900">
                  {t.thinking}
                </span>
              </div>
            </div>
          )}

          {/* Listening State Bar */}
          {isListening && (
            <div className="flex gap-3 justify-start animate-in fade-in duration-200">
              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                <Radio className="w-4 h-4" />
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-3xl rounded-tl-xs p-4 shadow-xs space-y-1.5 max-w-md">
                <div className="flex items-center gap-2 text-rose-700 text-xs font-extrabold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
                  <span>{t.listeningWave}</span>
                </div>
                <p className="text-xs text-rose-950 font-medium italic">
                  {interimTranscript || (language === 'te-IN' ? 'దయచేసి మాట్లాడండి...' : language === 'hi-IN' ? 'कृपया बोलें...' : 'Please speak clearly now...')}
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="bg-slate-100/80 border-t border-slate-200 px-4 py-2.5 shrink-0 overflow-x-auto">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="text-[11px] font-bold text-slate-500 shrink-0">
            Suggested:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt, false)}
                className="px-3 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-full text-xs font-medium text-slate-700 whitespace-nowrap transition-colors shadow-2xs"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Input Area */}
      <div className="bg-white border-t border-blue-100 p-3 sm:p-4 shrink-0 shadow-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText, false);
          }}
          className="max-w-3xl mx-auto flex items-center gap-2 sm:gap-3"
        >
          {/* Large Accessible Microphone Button */}
          <button
            type="button"
            id="btn-chat-mic-toggle"
            onClick={handleToggleVoice}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md shrink-0 ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse scale-105 shadow-rose-600/30'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/25 active:scale-95'
            }`}
            title={isListening ? 'Click to stop listening' : 'Click to speak'}
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* Text Input Field */}
          <div className="relative flex-1">
            <input
              type="text"
              id="chat-text-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? t.listeningWave : t.typeOrSpeakMessage}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm sm:text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 transition-all font-medium"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            id="btn-chat-send"
            disabled={!inputText.trim() || isThinking}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xs shrink-0 ${
              inputText.trim() && !isThinking
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 active:scale-95'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
