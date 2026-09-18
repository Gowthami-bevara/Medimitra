import React, { useState, useEffect } from 'react';
import { HeartPulse, Phone, KeyRound, ArrowRight, ShieldCheck, RefreshCw, Edit3, Globe, Sparkles, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/i18n';

interface AuthModalProps {
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const { registerWithPhone, loginDemoUser, language, setLanguage } = useApp();
  const t = TRANSLATIONS[language];

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setError(
        language === 'te-IN'
          ? 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.'
          : language === 'hi-IN'
          ? 'कृपया मान्य 10 अंकों का मोबाइल नंबर दर्ज करें।'
          : 'Please enter a valid 10-digit mobile number.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleaned }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.error === 'COOLDOWN_ACTIVE') {
          setError(data.message);
        } else if (data.error === 'SMS_PROVIDER_NOT_CONFIGURED') {
          setError(
            language === 'te-IN'
              ? 'మొబైల్ ఫోన్లకు నేరుగా ఎస్ఎంఎస్ ఓటీపీ పంపడానికి Twilio SMS గేట్‌వే సెట్టింగ్స్ అవసరం (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER).'
              : language === 'hi-IN'
              ? 'मोबाइल फोन पर सीधे एसएमएस ओटीपी भेजने के लिए Twilio SMS क्रेडेंशियल्स की आवश्यकता है (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)।'
              : 'SMS Provider not configured. To deliver real SMS to mobile devices, please configure TWILIO credentials in environment variables.'
          );
        } else {
          setError(data.message || 'Failed to send OTP. Please try again.');
        }
        return;
      }

      // Success: mask phone and switch to OTP step
      setMaskedPhone(data.maskedPhone || `******${cleaned.slice(-4)}`);
      setStep('otp');
      setCooldown(30); // 30-second cooldown
      setOtp('');
      setInfoMessage(
        language === 'te-IN'
          ? `ఓటీపీ మీ మొబైల్ నంబర్ (${data.maskedPhone}) కు పంపబడింది. దయచేసి నమోదు చేయండి.`
          : language === 'hi-IN'
          ? `ओटीपी आपके मोबाइल नंबर (${data.maskedPhone}) पर भेजा गया है।`
          : `Verification code sent to ${data.maskedPhone}. Please enter the 6-digit code.`
      );
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      setError(
        language === 'te-IN'
          ? 'సర్వర్ కనెక్ట్ కావడం లేదు. దయచేసి మీ నెట్‌వర్క్ తనిఖీ చేయండి.'
          : language === 'hi-IN'
          ? 'सर्वर से संपर्क नहीं हो सका। कृपया नेटवर्क जांचें।'
          : 'Network error communicating with authentication service.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const cleanedOtp = otp.trim();
    if (cleanedOtp.length !== 6) {
      setError(
        language === 'te-IN'
          ? 'దయచేసి 6 అంకెల ఓటీపీ నమోదు చేయండి.'
          : language === 'hi-IN'
          ? 'कृपया 6 अंकों का ओटीपी दर्ज करें।'
          : 'Please enter the complete 6-digit OTP code.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.replace(/\D/g, ''),
          otp: cleanedOtp,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Incorrect or expired OTP.');
        return;
      }

      // OTP verified successfully
      registerWithPhone(`+91 ${phone.replace(/\D/g, '')}`);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      setError(
        language === 'te-IN'
          ? 'ధృవీకరణ విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి.'
          : language === 'hi-IN'
          ? 'सत्यापन विफल रहा। कृपया पुनः प्रयास करें।'
          : 'Verification failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = () => {
    if (cooldown > 0) return;
    handleSendOtp();
  };

  const handleDemoPatient = () => {
    loginDemoUser();
    if (onSuccess) onSuccess();
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xl max-w-md w-full overflow-hidden">
        
        {/* Brand Header */}
        <div className="bg-gradient-to-br from-blue-700 to-indigo-900 p-6 text-white text-center relative">
          
          {/* Language Selector Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5 text-xs text-blue-200 font-medium">
              <Globe className="w-3.5 h-3.5" />
              <span>{t.language}</span>
            </div>
            <div className="inline-flex bg-white/15 p-0.5 rounded-xl backdrop-blur-xs border border-white/20">
              <button
                type="button"
                onClick={() => setLanguage('te-IN')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  language === 'te-IN' ? 'bg-white text-blue-900 shadow-xs' : 'text-blue-100 hover:text-white'
                }`}
              >
                తెలుగు
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi-IN')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  language === 'hi-IN' ? 'bg-white text-blue-900 shadow-xs' : 'text-blue-100 hover:text-white'
                }`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en-IN')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  language === 'en-IN' ? 'bg-white text-blue-900 shadow-xs' : 'text-blue-100 hover:text-white'
                }`}
              >
                English
              </button>
            </div>
          </div>

          <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-xs border border-white/20 shadow-md">
            <HeartPulse className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h1 className="font-display font-black text-2xl text-white">
            Medi<span className="text-blue-200">Mitra</span>
          </h1>
          <p className="text-xs text-blue-100 font-medium mt-1">
            {t.tagline}
          </p>
        </div>

        {/* Step Content */}
        <div className="p-6 space-y-6">

          {/* Registration Flow Indicator */}
          <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'phone' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>
                1
              </span>
              <span className={step === 'phone' ? 'text-blue-700' : 'text-slate-700'}>{t.phone}</span>
            </div>
            <div className="h-0.5 flex-1 mx-2 bg-slate-200"></div>
            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'otp' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                2
              </span>
              <span className={step === 'otp' ? 'text-blue-700' : 'text-slate-500'}>OTP</span>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Info Banner */}
          {infoMessage && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{infoMessage}</span>
            </div>
          )}

          {step === 'phone' ? (
            /* STEP 1: PHONE NUMBER ONLY */
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {t.phone}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 flex items-center gap-1 text-slate-600 text-sm font-bold border-r border-slate-200 pr-2">
                    <Phone className="w-4 h-4 text-blue-600" />
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    autoFocus
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setPhone(val);
                      setError(null);
                    }}
                    placeholder="9876543210"
                    className="w-full pl-22 pr-4 py-3 text-base font-bold bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 tracking-wider"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  {language === 'te-IN'
                    ? 'మీ 10 అంకెల మొబైల్ నంబర్‌కు రహస్య ఓటీపీ పంపబడుతుంది.'
                    : language === 'hi-IN'
                    ? 'आपके 10 अंकों के मोबाइल नंबर पर सुरक्षित ओटीपी भेजा जाएगा।'
                    : 'A secure 6-digit OTP will be sent to your mobile number.'}
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{t.sendOtp}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: OTP VERIFICATION */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              
              {/* Masked Mobile Number Summary with Edit Option */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
                <div>
                  <div className="text-[11px] text-slate-500 font-semibold">{t.phone}</div>
                  <div className="text-sm font-bold text-slate-800">
                    +91 {maskedPhone || `******${phone.slice(-4)}`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setError(null);
                    setInfoMessage(null);
                  }}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{t.changeNumber}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {t.enterOtp}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ''));
                      setError(null);
                    }}
                    placeholder="••••••"
                    className="w-full pl-10 pr-4 py-3 text-xl font-mono font-bold tracking-widest bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>{t.verifyOtp}</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  disabled={cooldown > 0 || isLoading}
                  onClick={handleResendOtp}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-700 disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                >
                  {cooldown > 0 ? (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{t.resendOtp} ({cooldown}s)</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{t.resendOtp}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setError(null);
                    setInfoMessage(null);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  {t.changeNumber}
                </button>
              </div>
            </form>
          )}

          {/* Quick Demo Login Option for Judges & Evaluators */}
          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDemoPatient}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>{t.demoAccount}</span>
            </button>
          </div>

        </div>

        {/* Privacy Note */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Privacy protected • Encrypted health session</span>
        </div>

      </div>
    </div>
  );
};
