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
import { getApiUrl } from '../utils/api';
import { AppLanguage } from '../types';
import { HospitalAmbienceBackground } from './HospitalAmbienceBackground';

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

  // Suggested quick prompts in selected language (Both general conversation & health queries)
  const quickPrompts = {
    'en-IN': [
      'Hello! How are you doing today?',
      'How much water should I drink today?',
      'Tips for better sleep (explain in detail)',
      'I have a mild headache since morning',
      'What can you help me with?',
    ],
    'te-IN': [
      'నమస్కారం! ఎలా ఉన్నారు?',
      'ఈ రోజు నేను ఎంత నీరు త్రాగాలి?',
      'మంచి నిద్ర కోసం చిట్కాలు వివరంగా చెప్పు',
      'నాకు ఉదయం నుంచి తలనొప్పిగా ఉంది',
      'మీరు నాకు ఎలా సహాయపడగలరు?',
    ],
    'hi-IN': [
      'नमस्ते! आप कैसे हैं?',
      'मुझे आज कितना पानी पीना चाहिए?',
      'अच्छी नींद के उपाय विस्तार से बताओ',
      'मुझे सुबह से हल्का सिरदर्द है',
      'आप मेरी किस प्रकार मदद कर सकते हैं?',
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

    // Build multi-turn conversation payload for context memory
    const chatHistoryPayload = [
      ...messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text,
      })),
      { role: 'user', content: trimmed },
    ];

    try {
      // Send to server API with full conversation history & wellness context
      const response = await fetch(getApiUrl('/api/assistant/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          messages: chatHistoryPayload,
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
        replyText = cleanAiText(generateSafeFallbackReply(trimmed, language, messages));
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
      const fallback = cleanAiText(generateSafeFallbackReply(trimmed, language, messages));
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

  // Safe client fallback generator honoring conversational behavior, dual modes, and detail requests
  const generateSafeFallbackReply = (query: string, lang: AppLanguage, priorMessages: ChatMessage[] = []): string => {
    const q = query.toLowerCase().trim();

    // 0. Arithmetic / Math (e.g., 25 + 37)
    const mathMatch = q.match(/^(\d+(?:\.\d+)?)\s*([\+\-\*\/])\s*(\d+(?:\.\d+)?)$/) ||
                      q.match(/(?:what is|calculate)?\s*(\d+(?:\.\d+)?)\s*([\+\-\*\/])\s*(\d+(?:\.\d+)?)/i);
    if (mathMatch) {
      const n1 = parseFloat(mathMatch[1]);
      const op = mathMatch[2];
      const n2 = parseFloat(mathMatch[3]);
      let ans = 0;
      if (op === '+') ans = n1 + n2;
      else if (op === '-') ans = n1 - n2;
      else if (op === '*') ans = n1 * n2;
      else if (op === '/') ans = n2 !== 0 ? Math.round((n1 / n2) * 100) / 100 : 0;
      return `${ans}`;
    }

    // 1. Conversation Context Memory / "What did I ask you earlier?"
    if (
      q.includes('what did i ask') ||
      q.includes('previous question') ||
      q.includes('earlier') ||
      q.includes('ముందు ఏం అడిగాను') ||
      q.includes('గత ప్రశ్న') ||
      q.includes('पिछला सवाल')
    ) {
      const userMsgs = priorMessages.filter((m) => m.sender === 'user');
      if (userMsgs.length > 0) {
        const lastQuestion = userMsgs[userMsgs.length - 1].text;
        if (lang === 'te-IN') return `మీరు ఇంతకుముందు అడిగిన ప్రశ్న: "${lastQuestion}".`;
        if (lang === 'hi-IN') return `आपने पहले यह सवाल पूछा था: "${lastQuestion}".`;
        return `Earlier you asked: "${lastQuestion}".`;
      }
      if (lang === 'te-IN') return 'మీతో మాట్లాడుతున్న వివరాలు నాకు గుర్తున్నాయి. మీరు దేని గురించి తెలుసుకోవాలనుకుంటున్నారు?';
      if (lang === 'hi-IN') return 'मुझे आपके पिछले सवाल याद हैं। आप आगे क्या जानना चाहते हैं?';
      return 'I have our conversation context in mind. What would you like to follow up on?';
    }

    // 2. General Knowledge / Prime Minister of India
    if (
      q.includes('prime minister') ||
      q.includes('pm of india') ||
      q.includes('ప్రధాన మంత్రి') ||
      q.includes('प्रधान मंत्री')
    ) {
      if (lang === 'te-IN') return 'భారతదేశ ప్రస్తుత ప్రధాన మంత్రి శ్రీ నరేంద్ర మోదీ.';
      if (lang === 'hi-IN') return 'भारत के वर्तमान प्रधानमंत्री श्री नरेंद्र मोदी हैं।';
      return 'The Prime Minister of India is Narendra Modi.';
    }

    // 3. Joke
    if (q.includes('joke') || q.includes('జోక్') || q.includes('చురుకు') || q.includes('चुटकुला')) {
      if (lang === 'te-IN') {
        return 'ఒక చిన్న సరదా జోక్:\nపేషెంట్: డాక్టర్ గారు, రోజూ ఆపిల్ తింటే డాక్టర్ దగ్గరకు వెళ్లక్కర్లేదా?\nడాక్టర్: అవును, కానీ ఆ ఆపిల్‌ను సరిగ్గా విసరడం మీకు వచ్చి ఉండాలి!';
      }
      if (lang === 'hi-IN') {
        return 'एक छोटा चुटकुला:\nमरीज: डॉक्टर साहब, क्या रोज एक सेब खाने से डॉक्टर दूर रहता है?\nडॉक्टर: हाँ, यदि आपका निशाना सही हो!';
      }
      return 'Why did the scarecrow win an award? Because he was outstanding in his field!';
    }

    // Check if user requested detailed explanation
    const isDetailed =
      q.includes('explain in detail') ||
      q.includes('in detail') ||
      q.includes('long answer') ||
      q.includes('tell me more') ||
      q.includes('detailed ga cheppu') ||
      q.includes('inka explain cheyyi') ||
      q.includes('inka cheppu') ||
      q.includes('వివరంగా చెప్పు') ||
      q.includes('విస్తారంగా') ||
      q.includes('మరింత చెప్పు') ||
      q.includes('వివరించు') ||
      q.includes('विस्तार से बताओ') ||
      q.includes('डिटेल में बताओ') ||
      q.includes('और बताओ');

    // 4. Red flag symptoms check
    if (
      q.includes('chest pain') ||
      q.includes('heart attack') ||
      q.includes('can’t breathe') ||
      q.includes('cannot breathe') ||
      q.includes('unconscious') ||
      q.includes('గుండె నొప్పి') ||
      q.includes('ఛాతీ నొప్పి') ||
      q.includes('శ్వాస ఆడటం లేదు') ||
      q.includes('సీనే మే దర్ద్') ||
      q.includes('सांस नहीं')
    ) {
      if (lang === 'te-IN') {
        return '⚠️ అత్యవసర హెచ్చరిక: ఛాతీలో నొప్పి లేదా శ్వాస ఆడకపోవడం అత్యవసర పరిస్థితి కావచ్చు. ప్రశాంతంగా కూర్చోండి. అస్సలు ఆలస్యం చేయకుండా వెంటనే 108 కి కాల్ చేయండి లేదా దగ్గరలోని ఎమర్జెన్సీ హాస్పిటల్ కి వెళ్లండి.';
      }
      if (lang === 'hi-IN') {
        return '⚠️ आपातकालीन चेतावनी: सीने में तेज दर्द या सांस लेने में गंभीर कठिनाई आपातकालीन स्थिति हो सकती है। कृपया शांत बैठें और तुरंत 108 पर कॉल करें या नजदीकी आपातकालीन अस्पताल जाएं।';
      }
      return '⚠️ EMERGENCY NOTICE: Severe chest discomfort or acute breathing difficulty requires immediate emergency medical evaluation. Please dial 108 or proceed to the nearest emergency trauma center immediately.';
    }

    // 5. Fever query ("What is fever?")
    if (q.includes('fever') || q.includes('జ్వరం') || q.includes('బుఖార్') || q.includes('बुखार')) {
      if (isDetailed) {
        if (lang === 'te-IN') {
          return `జ్వరం (Fever) గురించి పూర్తి వివరాలు:
1. జ్వరం అంటే ఏమిటి: శరీర ఉష్ణోగ్రత సాధారణ స్థాయి (98.6°F) కంటే పెరిగి 100.4°F దాటితే దానిని జ్వరం అంటారు. ఇది శరీర రోగనిరోధక వ్యవస్థ ఇన్ఫెక్షన్‌తో పోరాడుతోందనడానికి సహజ సంకేతం.
2. హోమ్ కేర్: పుష్కలంగా నీరు, సూప్ లేదా కొబ్బరి నీళ్లు తాగి డీహైడ్రేషన్ రాకుండా చూసుకోండి. కాటన్ దుస్తులు ధరించి విశ్రాంతి తీసుకోండి.
3. సాధారణ OTC సమాచారం: శరీర నొప్పులు మరియు జ్వరానికి పారాసిటమాల్ సాధారణంగా వాడతారు (లేబుల్ మోతాదు పాటించండి).
4. డాక్టర్‌ని ఎప్పుడు కలవాలి: ఉష్ణోగ్రత 102°F దాటినా, 3 రోజులకు మించి కొనసాగినా లేదా తీవ్ర తలనొప్పి, మెడ పట్టేయడం, శ్వాస ఇబ్బంది ఉంటే వెంటనే డాక్టర్‌ను సంప్రదించండి.`;
        }
        if (lang === 'hi-IN') {
          return `बुखार (Fever) पर विस्तृत जानकारी:
1. बुखार क्या है: जब शरीर का तापमान 98.6°F से बढ़कर 100.4°F से अधिक हो जाता है, तो इसे बुखार कहते हैं। यह शरीर की प्रतिरक्षा प्रणाली द्वारा संक्रमण से लड़ने की स्वाभाविक प्रतिक्रिया है।
2. घरेलू देखभाल: पर्याप्त पानी, ओआरएस या सूप पिएं ताकि शरीर में पानी की कमी न हो। भरपूर आराम करें।
3. OTC जानकारी: सामान्य बुखार में पैरासिटामोल जैसी दवाएं उपयोग की जाती हैं (लेबल निर्देश पढ़ें)।
4. डॉक्टर को कब दिखाएं: यदि बुखार 102°F से अधिक हो, 3 दिनों से अधिक रहे, या तेज सिरदर्द और सांस फूलने की समस्या हो तो डॉक्टर से परामर्श लें।`;
        }
        return `Detailed Overview of Fever:
1. What it is: A fever is a temporary rise in body temperature above 100.4°F (38°C), indicating that your immune system is actively fighting off an infection.
2. Home Management: Drink abundant fluids (water, oral rehydration, warm broths) to prevent dehydration. Prioritize bed rest and wear loose, breathable cotton clothing.
3. OTC Information: Over-the-counter antipyretics like Paracetamol are commonly used to ease discomfort (always follow packaging instructions).
4. When to See a Doctor: Consult a healthcare professional if fever exceeds 102°F, lasts longer than 72 hours, or is accompanied by stiff neck, shortness of breath, or confusion.`;
      } else {
        if (lang === 'te-IN') {
          return 'జ్వరం అనేది మన రోగనిరోధక వ్యవస్థ ఏదైనా ఇన్ఫెక్షన్ లేదా వైరస్‌తో పోరాడుతున్నప్పుడు శరీర ఉష్ణోగ్రత పెరిగే సహజ ప్రక్రియ (100.4°F దాటితే). తగినంత నీరు తాగి, బాగా విశ్రాంతి తీసుకోండి. ఉష్ణోగ్రత 102°F దాటినా లేదా 3 రోజుల కంటే ఎక్కువ కొనసాగినా డాక్టర్‌ను సంప్రదించండి.';
        }
        if (lang === 'hi-IN') {
          return 'बुखार शरीर की एक स्वाभाविक प्रतिक्रिया है, जब हमारी प्रतिरक्षा प्रणाली किसी संक्रमण से लड़ रही होती है (तापमान 100.4°F से ऊपर)। पर्याप्त पानी पिएं और आराम करें। यदि बुखार 102°F से अधिक हो या 3 दिन से अधिक रहे, तो डॉक्टर से सलाह लें।';
        }
        return "Fever is your body's natural immune response to fighting off an infection, defined as a temperature above 100.4°F (38°C). Stay well-hydrated, rest, and consult a doctor if it exceeds 102°F or lasts more than 3 days.";
      }
    }

    // 6. Cold & Cough query ("What should I do for a mild cold?")
    if (q.includes('cold') || q.includes('దగ్గు') || q.includes('జలుబు') || q.includes('సర్దీ') || q.includes('जुकाम') || q.includes('cough')) {
      if (isDetailed) {
        if (lang === 'te-IN') {
          return `తేలికపాటి జలుబు మరియు దగ్గుకు సూచనలు:
1. ఆవిరి పట్టడం: రోజుకు 1-2 సార్లు వేడి నీటి ఆవిరి పట్టడం ముక్కు దిబ్బడ మరియు గొంతు నొప్పిని తగ్గిస్తుంది.
2. వెచ్చని ద్రవాలు: అల్లం టీ, వేడి సూప్ లేదా తేనెతో కూడిన గోరువెచ్చని నీరు తాగండి.
3. విశ్రాంతి: శరీర రోగనిరోధక శక్తి పెరగడానికి తగినంత నిద్ర తీసుకోండి.
4. హెచ్చరిక సంకేతాలు: ఛాతీ నొప్పి, తీవ్ర శ్వాస సమస్య, లేదా రక్తంతో కూడిన దగ్గు ఉంటే వెంటనే డాక్టర్‌ను సంప్రదించండి.`;
        }
        if (lang === 'hi-IN') {
          return `हल्की सर्दी और जुकाम पर विस्तृत मार्गदर्शन:
1. भाप लें: दिन में 1-2 बार गर्म पानी की भाप लें, इससे बंद नाक और गले की खराश में आराम मिलता है।
2. गर्म तरल पदार्थ: अदरक वाली चाय, गर्म सूप या शहद-गुनगुना पानी पिएं।
3. विश्राम: शरीर को ठीक होने के लिए भरपूर नींद लें।
4. डॉक्टर को कब दिखाएं: यदि सांस लेने में परेशानी हो, सीने में दर्द हो या 7 दिनों से अधिक खांसी रहे, तो डॉक्टर को दिखाएं।`;
        }
        return `Guidance for Mild Cold & Cough:
1. Hydration & Warm Liquids: Drink warm herbal teas, ginger infusions, or warm broths to soothe mucous membranes.
2. Steam Inhalation: Gently inhaling warm steam helps clear nasal passages and relieve sinus congestion.
3. Rest: Allow your body plenty of restorative sleep to support immune defense.
4. Warning Signs: Seek clinical care if you develop breathing difficulty, sharp chest pain, high fever, or symptoms lasting over 10 days.`;
      } else {
        if (lang === 'te-IN') {
          return 'తేలికపాటి జలుబుకు గోరువెచ్చని నీరు లేదా సూప్ తాగడం, ఆవిరి పట్టడం మరియు తగినంత విశ్రాంతి తీసుకోవడం చాలా మంచిది. శ్వాస తీసుకోవడంలో ఇబ్బంది లేదా అధిక జ్వరం ఉంటే డాక్టర్‌ను సంప్రదించండి.';
        }
        if (lang === 'hi-IN') {
          return 'हल्के जुकाम में गर्म पानी पिएं, भाप लें और आराम करें। यदि सांस लेने में परेशानी या तेज बुखार हो, तो डॉक्टर से सलाह लें।';
        }
        return 'For a mild cold, drink warm fluids like ginger tea, try steam inhalation, and get plenty of rest. If you experience shortness of breath, severe chest discomfort, or a high persistent fever, consult a healthcare professional.';
      }
    }

    // 2. Greetings & Casual Conversation (Do not force back to health/symptoms)
    if (
      q === 'hi' ||
      q === 'hello' ||
      q === 'hey' ||
      q.includes('good morning') ||
      q.includes('good afternoon') ||
      q.includes('good evening') ||
      q.includes('how are you') ||
      q.includes('బాగున్నారా') ||
      q.includes('నమస్కారం') ||
      q.includes('ఎలా ఉన్నారు') ||
      q.includes('శుభోదయం') ||
      q.includes('नमस्ते') ||
      q.includes('कैसे हैं') ||
      q.includes('सुप्रभात')
    ) {
      if (lang === 'te-IN') {
        return 'నమస్కారం! నేను బాగున్నాను, ధన్యవాదాలు. మీరు ఎలా ఉన్నారు? ఈ రోజు మీకు ఎలా సహాయపడగలను?';
      }
      if (lang === 'hi-IN') {
        return 'नमस्ते! मैं अच्छा हूँ, धन्यवाद। आप कैसे हैं? आज मैं आपकी किस प्रकार मदद कर सकता हूँ?';
      }
      return "Hello! I'm doing well, thank you. How are you doing today? How can I help you?";
    }

    if (
      q.includes('who are you') ||
      q.includes('what can you do') ||
      q.includes('what can you help') ||
      q.includes('మీరెవరు') ||
      q.includes('ఎలా సహాయపడగలరు') ||
      q.includes('आप कौन हैं') ||
      q.includes('मदद कर सकते हैं')
    ) {
      if (lang === 'te-IN') {
        return 'నేను మెడిమిత్ర (MediMitra) – మీ వ్యక్తిగత సహాయకుడిని మరియు ఆరోగ్య సహచరుడిని. మీరు నాతో సాధారణ కబుర్లు చెప్పుకోవచ్చు, లేదా ఆరోగ్యం, ఆహారం, నిద్ర, మరియు బీపీ/షుగర్ గురించి ఏవైనా సందేహాలు అడగవచ్చు.';
      }
      if (lang === 'hi-IN') {
        return 'मैं मेडीमित्र (MediMitra) हूँ – आपका दैनिक साथी और स्वास्थ्य मार्गदर्शक। आप मुझसे सामान्य बातें कर सकते हैं या सेहत, पोषण और दिनचर्या से जुड़े सवाल पूछ सकते हैं।';
      }
      return 'I am MediMitra – your daily companion and healthcare assistant. You can chat with me naturally about general everyday topics or ask questions about wellness, nutrition, symptoms, and health routines.';
    }

    if (q.includes('thank') || q.includes('ధన్యవాదాలు') || q.includes('థాంక్స్') || q.includes('धन्यवाद') || q.includes('शुक्रिया')) {
      if (lang === 'te-IN') {
        return 'చాలా సంతోషం! మీకు ఎప్పుడు ఏ సందేహం వచ్చినా నన్ను అడగవచ్చు. మీ రోజు ఆనందంగా గడవాలి!';
      }
      if (lang === 'hi-IN') {
        return 'आपका बहुत-बहुत स्वागत है! जब भी सहायता चाहिए, बेझिझक पूछें। आपका दिन मंगलमय हो!';
      }
      return "You're very welcome! Feel free to reach out anytime. Wishing you a wonderful day!";
    }

    // 3. Hydration query
    if (q.includes('water') || q.includes('నీరు') || q.includes('నీళ్లు') || q.includes('पानी')) {
      const loggedWater = typeof todayLog?.waterIntakeLiters === 'number' ? todayLog.waterIntakeLiters.toFixed(1) : '1.5';
      if (lang === 'te-IN') {
        return `సాధారణంగా ఒక ఆరోగ్యకరమైన వ్యక్తి రోజూ 2.5 నుండి 3 లీటర్ల మంచి నీళ్లు తాగడం మంచిది. ఇప్పటివరకు మీ యాప్‌లో సుమారు ${loggedWater} లీటర్లు నమోదైంది. రోజంతా కొద్ది కొద్దిగా నీరు తాగుతూ హైడ్రేటెడ్‌గా ఉండండి.`;
      }
      if (lang === 'hi-IN') {
        return `एक स्वस्थ वयस्क के लिए रोजाना 2.5 से 3.0 लीटर पानी पीने की सलाह दी जाती है। आज आपका दर्ज पानी लगभग ${loggedWater} लीटर है। दिनभर थोड़ा-थोड़ा पानी पीते रहें।`;
      }
      return `For healthy adults, drinking approximately 2.5 to 3.0 liters of water daily is generally recommended. Today your tracked intake is ${loggedWater}L. Keep sipping consistently to stay hydrated.`;
    }

    // 4. Sleep query
    if (q.includes('sleep') || q.includes('నిద్ర') || q.includes('నీంద') || q.includes('insomnia')) {
      if (isDetailed) {
        if (lang === 'te-IN') {
          return `మంచి నిద్ర కోసం సమగ్ర చిట్కాలు:
1. సమయపాలన: ప్రతిరోజూ ఒకే సమయానికి పడుకుని, ఒకే సమయానికి మేల్కొనే అలవాటు చేసుకోండి.
2. డిజిటల్ డిటాక్స్: పడుకునే 30-45 నిమిషాల ముందు మొబైల్ ఫోన్, టీవీ, కంప్యూటర్ స్క్రీన్లను చూడటం ఆపండి.
3. వాతావరణం: పడకగదిని చల్లగా, నిశ్శబ్దంగా, కాంతి తక్కువగా ఉండేలా చూసుకోండి.
4. ఆహారం: రాత్రి పూట తేలికపాటి భోజనం చేయండి. పడుకునే ముందు కాఫీ, టీ లేదా భారీ మసాలా ఆహారాలు తీసుకోకండి.
5. సడలింపు: నిద్రకు ముందు లోతైన శ్వాస లేదా ప్రశాంతమైన ఆలోచనలతో రిలాక్స్ అవ్వండి.`;
        }
        if (lang === 'hi-IN') {
          return `गहरी नींद के लिए उपयोगी मार्गदर्शन:
1. नियमित समय: रोज एक ही समय पर सोने और जागने का नियम बनाएं।
2. स्क्रीन से दूरी: सोने से 30-45 मिनट पहले मोबाइल और टीवी का उपयोग बंद कर दें।
3. शांत वातावरण: बेडरूम को ठंडा, अंधेरा और शांत रखें।
4. हल्का भोजन: रात का खाना हल्का रखें और देर रात चाय-कॉफी न पिएं।
5. ध्यान/विश्राम: सोने से पहले गहरी सांस लेने से मन शांत होता है।`;
        }
        return `Comprehensive Sleep Quality Guidance:
1. Regular Schedule: Go to bed and wake up at consistent times every day to set your circadian rhythm.
2. Screen Curfew: Avoid phones, tablets, and TV screens at least 30 to 45 minutes before sleep.
3. Bedroom Atmosphere: Keep your room dark, quiet, and pleasantly cool.
4. Dietary Habits: Eat a light evening meal and avoid caffeine or heavy fatty foods after evening.
5. Calming Routine: A 5-minute deep breathing or relaxation exercise signals your nervous system that it is time for rest.`;
      } else {
        if (lang === 'te-IN') {
          return 'రాత్రి 7 నుండి 8 గంటలు హాయిగా నిద్రపోవడం శరీరానికి మరియు మనస్సుకు ఎంతో అవసరం. పడుకునే అరగంట ముందు మొబైల్ స్క్రీన్ పక్కన పెట్టి ప్రశాంతమైన వాతావరణంలో విశ్రాంతి తీసుకోండి.';
        }
        if (lang === 'hi-IN') {
          return 'अच्छे स्वास्थ्य के लिए 7 से 8 घंटे की नींद आवश्यक है। सोने से 30 मिनट पहले मोबाइल का उपयोग न करें और कमरे में शांत माहौल रखें।';
        }
        return 'Aim for 7 to 8 hours of restful sleep each night. Setting your phone aside 30 minutes before bed and keeping your room quiet will noticeably enhance sleep quality.';
      }
    }

    // 5. Headache query
    if (q.includes('headache') || q.includes('తలనొప్పి') || q.includes('सिरदर्द')) {
      if (isDetailed) {
        if (lang === 'te-IN') {
          return `తలనొప్పిపై సమగ్ర సమాచారం:
1. సాధారణ కారణాలు: అలసట, నీరు తక్కువ తాగడం (డీహైడ్రేషన్), మానసిక ఒత్తిడి, లేదా స్క్రీన్ సమయం ఎక్కువ కావడం.
2. తక్షణ చర్య: ఒక గ్లాసు నీరు తాగి, మొబైల్ పక్కనపెట్టి చీకటి గదిలో 20-30 నిమిషాలు రెస్ట్ తీసుకోండి.
3. OTC సమాచారం: సాధారణ తలనొప్పికి పారాసిటమాల్ వంటివి సాధారణంగా ఉపయోగిస్తారు (లేబుల్ సూచనలు పాటించండి).
4. డాక్టర్‌ని ఎప్పుడు కలవాలి: నొప్పి 2 రోజుల కంటే ఎక్కువ ఉన్నా లేదా కంటిచూపు మందగించడం, వాంతులు ఉంటే డాక్టర్‌ను సంప్రదించండి.`;
        }
        if (lang === 'hi-IN') {
          return `सिरदर्द पर विस्तृत जानकारी:
1. सामान्य कारण: तनाव, पानी की कमी, आंखों में खिंचाव या नींद की कमी।
2. त्वरित आराम: एक गिलास पानी पिएं और शांत कमरे में विश्राम करें।
3. OTC जानकारी: हल्के दर्द में पैरासिटामोल जैसी दवाएं उपयोग में आती हैं (पैकेट निर्देश पढ़ें)।
4. डॉक्टर से कब मिलें: यदि दर्द 2 दिनों से अधिक रहे या बहुत तेज हो, तो डॉक्टर को दिखाएं।`;
        }
        return `Detailed Headache Overview:
1. Common Triggers: Dehydration, mental strain, lack of rest, or extended screen glare.
2. Immediate Steps: Drink a large glass of water and rest in a dark, quiet space for 20 minutes.
3. OTC Information: Mild tension headaches often respond to simple over-the-counter Paracetamol (follow package label directions).
4. When to See a Doctor: If headaches persist beyond 48 hours, worsen rapidly, or involve nausea, stiff neck, or fever, see a physician.`;
      } else {
        if (lang === 'te-IN') {
          return 'స్వల్ప తలనొప్పి ఉంటే ఒక గ్లాసు నీరు తాగి, స్క్రీన్ చూడటం ఆపి కొద్దిసేపు ప్రశాంతంగా విశ్రాంతి తీసుకోండి. నొప్పి 2 రోజుల కంటే ఎక్కువ కొనసాగితే వైద్యులను సంప్రదించండి.';
        }
        if (lang === 'hi-IN') {
          return 'हल्के सिरदर्द में एक गिलास पानी पिएं, स्क्रीन से दूरी बनाएं और कुछ देर शांत बैठें। यदि दर्द 2 दिनों से अधिक रहे तो डॉक्टर से जांच कराएं।';
        }
        return 'For mild headache, drink a tall glass of water and rest in a quiet room away from screens. If it persists beyond two days, consult a healthcare provider.';
      }
    }

    // 6. Diabetes / Sugar query
    if (q.includes('sugar') || q.includes('diabetes') || q.includes('షుగర్') || q.includes('డయాబెటిస్') || q.includes('मधुमेह')) {
      if (lang === 'te-IN') {
        return 'రక్తంలో గ్లూకోజ్ స్థాయిలు పెరగడాన్ని మధుమేహం లేదా షుగర్ అంటారు. తీపి పదార్థాలు తగ్గించి, ఆకుకూరలు, తృణధాన్యాలు తింటూ రోజూ 30 నిమిషాలు వాకింగ్ చేయడం ద్వారా షుగర్‌ను అదుపులో ఉంచుకోవచ్చు.';
      }
      if (lang === 'hi-IN') {
        return 'रक्त में शुगर का स्तर बढ़ना डायबिटीज कहलाता है। मीठे से परहेज, फाइबर युक्त भोजन और नियमित व्यायाम से इसे आसानी से नियंत्रित रखा जा सकता है।';
      }
      return 'Diabetes occurs when blood sugar levels remain higher than normal. It is managed with a high-fiber, low-refined-sugar diet, daily physical activity, and prescribed medication.';
    }

    // 7. Stomach Ache / Acidity
    if (q.includes('stomach') || q.includes('acidity') || q.includes('gas') || q.includes('కడుపు') || q.includes('ఎసిడిటీ') || q.includes('पेट दर्द')) {
      if (lang === 'te-IN') {
        return 'కడుపులో మంట లేదా గ్యాస్ ఉంటే గోరువెచ్చని నీరు తాగండి, కాస్త మజ్జిగ తీసుకోండి మరియు నూనె, మసాలా ఆహారాలకు దూరంగా ఉండండి. నొప్పి తీవ్రంగా ఉంటే డాక్టర్‌ను సంప్రదించండి.';
      }
      if (lang === 'hi-IN') {
        return 'पेट दर्द या एसिडिटी के लिए गुनगुना पानी पिएं, छाछ लें और तैलीय भोजन से बचें। अधिक दर्द में डॉक्टर की सलाह लें।';
      }
      return 'For mild stomach ache or acidity, sip warm water or buttermilk, and avoid spicy foods. If pain is severe or prolonged, seek medical advice.';
    }

    // 8. Cough / Cold
    if (q.includes('cold') || q.includes('cough') || q.includes('జలుబు') || q.includes('దగ్గు') || q.includes('जुकाम') || q.includes('खांसी')) {
      if (lang === 'te-IN') {
        return 'స్వల్ప జలుబు, దగ్గుకు గోరువెచ్చని నీరు, ఆవిరి పట్టడం (స్టీమ్ ఇన్హేలేషన్) మరియు విశ్రాంతి మంచి ఉపశమనం ఇస్తాయి. తీవ్ర జ్వరం లేదా శ్వాస ఇబ్బంది ఉంటే డాక్టర్‌ను సంప్రదించండి.';
      }
      if (lang === 'hi-IN') {
        return 'हल्के जुकाम में गर्म पानी पिएं, भाप लें और पर्याप्त आराम करें। यदि बुखार तेज हो तो डॉक्टर को दिखाएं।';
      }
      return 'For a mild cold, stay hydrated with warm fluids, take steam inhalation, and get plenty of rest. If high fever or breathing distress develops, consult a doctor.';
    }

    // 9. Greetings
    if (q.startsWith('hi') || q.startsWith('hello') || q.startsWith('hey') || q.includes('నమస్కారం') || q.includes('नमस्ते')) {
      if (lang === 'te-IN') {
        return 'నమస్కారం! నేను మీకు ఎలా సహాయపడగలను? ఏదైనా ప్రశ్న ఉంటే స్వేచ్ఛగా అడగండి.';
      }
      if (lang === 'hi-IN') {
        return 'नमस्ते! मैं आपकी क्या सहायता कर सकता हूँ? आप मुझसे कोई भी प्रश्न पूछ सकते हैं।';
      }
      return 'Hello! How can I assist you today? Feel free to ask any question.';
    }

    // 10. Default direct response
    if (lang === 'te-IN') {
      return isDetailed
        ? 'మీరు అడిగిన అంశంపై సమగ్ర వివరణ: ఆరోగ్యకరమైన జీవనశైలి కోసం సమతుల్య ఆహారం, రోజూ తేలికపాటి వ్యాయామం మరియు తగినంత సమయం విశ్రాంతి తీసుకోవడం చాలా ముఖ్యం.'
        : 'ఖచ్చితంగా! మీరు అడిగిన ప్రశ్నకు సహాయం చేయడానికి సిద్ధంగా ఉన్నాను. మరింత సమాచారం కావాలంటే అడగండి.';
    }
    if (lang === 'hi-IN') {
      return isDetailed
        ? 'आपके प्रश्न पर विस्तृत जानकारी: स्वस्थ जीवनशैली के लिए संतुलित खानपान, नियमित व्यायाम और पर्याप्त नींद जरूरी है।'
        : 'जी हाँ! मैं आपके सवाल का जवाब देने के लिए यहाँ हूँ। और जानकारी के लिए कृपया पूछें।';
    }
    return isDetailed
      ? 'Regarding your query: Daily balance, wholesome nutrition, adequate hydration, and consistent rest are key elements to well-being.'
      : 'I am here to help answer your question directly. Feel free to ask for any additional details.';
  };

  return (
    <div
      id="fullscreen-ai-chat-container"
      className="fixed inset-0 z-50 flex flex-col overflow-hidden text-slate-900 relative"
    >
      {/* Subtle Hospital Ambience in Chat */}
      <HospitalAmbienceBackground variant="chat" />

      {/* Top Header Bar */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-teal-100/90 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-to-dashboard"
            onClick={() => {
              stopSpeakingAudio();
              setIsVoiceAssistantOpen(false);
            }}
            className="p-2 -ml-1.5 rounded-xl hover:bg-teal-50 text-slate-700 hover:text-teal-900 transition-colors flex items-center gap-1 text-xs font-black cursor-pointer"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-teal-700" />
            <span className="hidden sm:inline">{t.backToHome}</span>
          </button>

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-base sm:text-lg text-slate-900">
                  Medi<span className="text-teal-600">Mitra</span> AI
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ● Online
                </span>
                {language === 'te-IN' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-50 text-teal-800 border border-teal-200 hidden sm:inline">
                    తెలుగు వాయిస్ సిద్ధం
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-semibold hidden sm:block">
                Multilingual AI Health Companion • Voice & Text Consultation
              </p>
            </div>
          </div>
        </div>

        {/* Right Header Controls: Language Selector & Audio Mute/Unmute */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-black">
            {(['en-IN', 'te-IN', 'hi-IN'] as AppLanguage[]).map((lang) => (
              <button
                key={lang}
                id={`chat-lang-${lang}`}
                onClick={() => {
                  setLanguage(lang);
                  stopSpeakingAudio();
                }}
                className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                  language === lang
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-teal-900'
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
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
              voiceSpeechEnabled
                ? 'bg-teal-50 border-teal-200 text-teal-800 shadow-2xs'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
            title={voiceSpeechEnabled ? 'AI Voice Response Active (Click to Mute)' : 'AI Voice Response Muted (Click to Unmute)'}
          >
            {voiceSpeechEnabled ? <Volume2 className="w-4 h-4 text-teal-700" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Safety Notice Strip */}
      <div className="bg-teal-50/60 border-b border-teal-100 px-4 py-2 flex items-center justify-between text-xs text-slate-600 shrink-0">
        <div className="flex items-center gap-2 max-w-4xl">
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
          <span className="text-[11px] sm:text-xs font-medium leading-tight">
            <strong className="text-teal-900">Medical Safety:</strong> MediMitra provides wellness guidance only. It does not diagnose diseases or prescribe medication. In emergency, call 108/112 immediately.
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
          className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
          title="Clear and reset chat history"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Main Visible Chat Messages Area */}
      <div
        id="fullscreen-chat-messages-box"
        className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-5"
      >
        <div className="max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto space-y-4">
          
          {/* Active Voice Speaking Banner */}
          {isSpeaking && (
            <div
              id="active-speaking-banner"
              className="sticky top-0 z-20 bg-gradient-to-r from-teal-600 via-cyan-700 to-teal-800 text-white px-4 py-2.5 rounded-2xl shadow-lg shadow-teal-950/20 flex items-center justify-between gap-3 animate-in slide-in-from-top-2"
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
                    <span className="text-[10px] text-teal-100 block">
                      Section {currentSpeechChunk} of {totalSpeechChunks}
                    </span>
                  )}
                </div>
              </div>

              <button
                id="btn-stop-active-speech"
                onClick={handleStopSpeaking}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-black text-xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
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
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-md shadow-teal-600/20">
                    <Bot className="w-5 h-5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-xl rounded-3xl p-4 sm:p-5 transition-all ${
                    isUser
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-700 text-white rounded-tr-xs shadow-lg shadow-teal-900/10'
                      : 'bg-white/95 backdrop-blur-md border border-teal-100/90 text-slate-900 rounded-tl-xs shadow-lg shadow-teal-950/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2 text-[11px]">
                    <span className={`font-black ${isUser ? 'text-teal-100' : 'text-teal-950'}`}>
                      {isUser ? user?.name || 'You' : 'MediMitra Assistant'}
                      {msg.isVoice && (
                        <span className="ml-1.5 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-bold">
                          <Mic className="w-2.5 h-2.5" /> Voice
                        </span>
                      )}
                    </span>
                    <span className={isUser ? 'text-teal-200' : 'text-slate-400 font-medium'}>
                      {msg.timestamp}
                    </span>
                  </div>

                  <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-medium">
                    {msg.text}
                  </p>

                  {/* OTC Non-Prescription Guidance Badge */}
                  {!isUser && hasOtcMention && (
                    <div className="mt-3 p-2.5 rounded-2xl bg-teal-50/70 border border-teal-200 text-[11px] text-teal-900 flex items-start gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <span>
                        {language === 'te-IN'
                          ? 'సాధారణ అవగాహన సమాచారం మాత్రమే. ఇది మందుల ప్రిస్క్రిప్షన్ కాదు. సరైన మోతాదు కోసం ఫార్మసిస్ట్ లేదా డాక్టర్‌ను సంప్రదించండి.'
                          : 'General OTC awareness only. MediMitra never prescribes medicines. Always consult a licensed doctor or pharmacist.'}
                      </span>
                    </div>
                  )}

                  {/* Clinical Actions & Voice Bar for AI bubbles */}
                  {!isUser && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          id={`btn-play-voice-${msg.id}`}
                          onClick={() => handlePlayMessageAudio(msg.id, msg.text)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            isSpeakingThis
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/80 shadow-2xs'
                          }`}
                        >
                          {isSpeakingThis ? (
                            <>
                              <Square className="w-3.5 h-3.5 fill-white" />
                              <span>{language === 'te-IN' ? 'వాయిస్ ఆపు (Stop)' : 'Stop Voice'}</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-teal-600" />
                              <span>{language === 'te-IN' ? '🔊 మళ్ళీ వినండి (Repeat Voice)' : '🔊 Repeat Voice'}</span>
                            </>
                          )}
                        </button>

                        <span className="text-[10px] text-slate-400 font-medium">
                          {isSpeakingThis ? 'Speaking...' : 'Voice Readout Ready'}
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
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 text-[11px] font-black transition-colors cursor-pointer border border-teal-200/80"
                          >
                            <Stethoscope className="w-3 h-3 text-teal-700" />
                            <span>{language === 'te-IN' ? 'సమీప వైద్యులు' : 'Find Doctors'}</span>
                          </button>

                          <button
                            onClick={() => {
                              setIsVoiceAssistantOpen(false);
                              setActiveTab('hospitals');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-900 text-[11px] font-black transition-colors cursor-pointer border border-cyan-200/80"
                          >
                            <Building2 className="w-3 h-3 text-cyan-700" />
                            <span>{language === 'te-IN' ? 'సమీప ఆసుపత్రులు' : 'Find Hospitals'}</span>
                          </button>
                        </div>
                      )}

                      {/* Emergency Quick Actions */}
                      {hasEmergencyMention && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          <a
                            href="tel:108"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-colors shadow-xs"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Call 108 (Ambulance)</span>
                          </a>

                          <button
                            onClick={() => {
                              setIsVoiceAssistantOpen(false);
                              setActiveTab('emergency');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-black transition-colors border border-rose-200 cursor-pointer"
                          >
                            <span>Emergency Hub</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-9 h-9 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-1 shadow-2xs font-bold">
                    <UserIcon className="w-5 h-5" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Thinking / Loading Indicator */}
          {isThinking && (
            <div className="flex gap-3 justify-start animate-in fade-in duration-200">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-600/20">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-white/95 backdrop-blur-md border border-teal-200 rounded-3xl rounded-tl-xs p-4 shadow-md shadow-teal-950/5 flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 animate-pulse delay-150"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse delay-300"></span>
                </div>
                <span className="text-xs font-black text-teal-950">
                  {language === 'te-IN' ? 'సమాధానం విశ్లేషిస్తోంది...' : t.thinking}
                </span>
              </div>
            </div>
          )}

          {/* Listening State Bar */}
          {isListening && (
            <div className="flex gap-3 justify-start animate-in fade-in duration-200">
              <div className="w-9 h-9 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/30 animate-pulse">
                <Radio className="w-5 h-5" />
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-3xl rounded-tl-xs p-4 shadow-sm space-y-1.5 max-w-md">
                <div className="flex items-center gap-2 text-rose-700 text-xs font-black">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
                  <span>{language === 'te-IN' ? 'వింటున్నాము... దయచేసి మాట్లాడండి' : t.listeningWave}</span>
                </div>
                <p className="text-xs text-rose-950 font-semibold italic">
                  {interimTranscript || (language === 'te-IN' ? 'తెలుగు లేదా ఇంగ్లీషులో మాట్లాడండి...' : language === 'hi-IN' ? 'कृपया बोलें...' : 'Please speak clearly now...')}
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="bg-white/80 backdrop-blur-md border-t border-teal-100/80 px-3 sm:px-4 py-2 sm:py-2.5 shrink-0 overflow-x-auto">
        <div className="max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
          <span className="text-[11px] font-black text-teal-900 shrink-0">
            {language === 'te-IN' ? 'సూచనలు:' : 'Suggested:'}
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {quickPrompts[language]?.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt, false)}
                className="px-3 sm:px-3.5 py-1 bg-white hover:bg-teal-50 border border-teal-200 hover:border-teal-400 rounded-full text-xs font-bold text-slate-700 hover:text-teal-900 whitespace-nowrap transition-all shadow-2xs cursor-pointer hover:scale-105 active:scale-95"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Input Area */}
      <div className="bg-white/90 backdrop-blur-xl border-t border-teal-100/90 p-2.5 sm:p-4 shrink-0 shadow-lg shadow-teal-950/5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText, false);
          }}
          className="max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto flex items-center gap-2 sm:gap-3"
        >
          {/* Large Accessible Microphone Button with Voice Pulse */}
          <button
            type="button"
            id="btn-chat-mic-toggle"
            onClick={handleToggleVoice}
            className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center transition-all shadow-md shrink-0 cursor-pointer ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse scale-105 shadow-rose-600/40 ring-4 ring-rose-300'
                : 'bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white shadow-teal-600/30 active:scale-95'
            }`}
            title={isListening ? 'Click to stop listening' : 'Click to speak'}
          >
            {isListening ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Text Input Field */}
          <div className="relative flex-1">
            <input
              type="text"
              id="chat-text-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? t.listeningWave : t.typeOrSpeakMessage}
              className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3.5 bg-slate-50 border border-teal-100 rounded-2xl text-xs sm:text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 transition-all font-semibold shadow-inner"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            id="btn-chat-send"
            disabled={!inputText.trim() || isThinking}
            className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center transition-all shadow-xs shrink-0 cursor-pointer ${
              inputText.trim() && !isThinking
                ? 'bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white shadow-teal-600/25 active:scale-95'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
            title="Send message"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
