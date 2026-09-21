import React, { useState, useEffect } from 'react';
import { HeartPulse, Phone, KeyRound, ArrowRight, ShieldCheck, RefreshCw, Edit3, Globe, Sparkles, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/i18n';
import { getApiUrl } from '../utils/api';

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
    const apiUrl = getApiUrl('/api/auth/send-otp');

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ phone: cleaned }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any;

      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch {
          data = { message: `Unable to parse server JSON response (HTTP ${res.status}).` };
        }
      } else {
        const text = await res.text().catch(() => '');
        data = {
          message: `Backend returned non-JSON response (HTTP ${res.status} ${res.statusText || ''}). Make sure API server is running on port 5000.`,
          details: text.slice(0, 200),
        };
      }

      if (!res.ok || !data.success) {
        // Always display the REAL backend error message
        const realError =
          data.message ||
          (data.error ? `Error: ${data.error}` : null) ||
          `Failed to request OTP (HTTP ${res.status}).`;
        setError(realError);
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
      console.error('Error sending OTP to', apiUrl, err);
      const isConnectionIssue =
        err?.message?.includes('Failed to fetch') ||
        err?.name === 'TypeError' ||
        err?.message?.includes('NetworkError');

      const realMessage = isConnectionIssue
        ? `Cannot connect to backend service at ${apiUrl}. Please verify the Express server is running (e.g. http://localhost:5000) and CORS is enabled for ${window.location.origin}.`
        : (err?.message || 'Network error communicating with authentication service.');

      setError(realMessage);
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
    const apiUrl = getApiUrl('/api/auth/verify-otp');

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          phone: phone.replace(/\D/g, ''),
          otp: cleanedOtp,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any;

      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch {
          data = { message: `Unable to parse server JSON response (HTTP ${res.status}).` };
        }
      } else {
        const text = await res.text().catch(() => '');
        data = {
          message: `Backend returned non-JSON response (HTTP ${res.status}).`,
          details: text.slice(0, 200),
        };
      }

      if (!res.ok || !data.success) {
        setError(data.message || (data.error ? `Error: ${data.error}` : 'Incorrect or expired OTP.'));
        return;
      }

      // OTP verified successfully
      registerWithPhone(`+91 ${phone.replace(/\D/g, '')}`);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error verifying OTP at', apiUrl, err);
      const isConnectionIssue =
        err?.message?.includes('Failed to fetch') ||
        err?.name === 'TypeError' ||
        err?.message?.includes('NetworkError');

      const realMessage = isConnectionIssue
        ? `Cannot connect to backend service at ${apiUrl}. Please verify the Express server is running and CORS is enabled.`
        : (err?.message || 'Verification communication failed. Please try again.');

      setError(realMessage);
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
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-8 relative">
      {/* Subtle floating medical ambiance badges around card */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2 max-w-md pointer-events-none select-none">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50/90 backdrop-blur-md border border-teal-200/80 text-[11px] font-bold text-teal-800 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Hospital Network Secure Portal
        </span>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 text-[11px] font-bold text-slate-600 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          End-to-End Encrypted
        </span>
      </div>

      <div className="bg-white/92 backdrop-blur-2xl border border-teal-200/90 rounded-3xl shadow-2xl shadow-teal-950/10 max-w-md w-full overflow-hidden transition-all relative z-10">
        
        {/* Brand Header */}
        <div className="bg-gradient-to-br from-teal-700 via-cyan-800 to-blue-900 p-6 text-white text-center relative overflow-hidden">
          {/* Subtle background glow circle */}
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none"></div>

          {/* Language Selector Header */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-1.5 text-xs text-teal-100 font-semibold">
              <Globe className="w-3.5 h-3.5" />
              <span>{t.language}</span>
            </div>
            <div className="inline-flex bg-black/25 p-1 rounded-2xl backdrop-blur-md border border-white/20">
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

          <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md border border-white/25 shadow-lg relative z-10">
            <HeartPulse className="w-8 h-8 text-emerald-300 animate-pulse" />
          </div>
          <h1 className="font-display font-black text-2xl text-white tracking-tight relative z-10">
            Medi<span className="text-teal-300">Mitra</span>
          </h1>
          <p className="text-xs text-teal-100/90 font-medium mt-1 relative z-10">
            {t.tagline}
          </p>
        </div>

        {/* Step Content */}
        <div className="p-6 sm:p-7 space-y-6">

          {/* Registration Flow Indicator */}
          <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${step === 'phone' ? 'bg-teal-600 text-white shadow-xs' : 'bg-emerald-600 text-white'}`}>
                {step === 'otp' ? '✓' : '1'}
              </span>
              <span className={step === 'phone' ? 'text-teal-800 font-black' : 'text-slate-700'}>{t.phone}</span>
            </div>
            <div className={`h-1 flex-1 mx-3 rounded-full transition-all ${step === 'otp' ? 'bg-gradient-to-r from-teal-500 to-emerald-500' : 'bg-slate-200'}`}></div>
            <div className="flex items-center gap-1.5">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${step === 'otp' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-200 text-slate-600'}`}>
                2
              </span>
              <span className={step === 'otp' ? 'text-teal-800 font-black' : 'text-slate-500'}>OTP</span>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold shadow-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Info Banner */}
          {infoMessage && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold shadow-xs">
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
                  <span className="absolute left-3.5 flex items-center gap-1.5 text-slate-700 text-sm font-black border-r border-teal-100 pr-2.5">
                    <Phone className="w-4 h-4 text-teal-600" />
                    <span>🇮🇳 +91</span>
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
                    className="w-full pl-26 pr-4 py-3.5 text-base font-black bg-white border border-teal-300/90 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-600 text-slate-900 tracking-wider transition-all shadow-2xs"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  {language === 'te-IN'
                    ? 'మీ 10 అంకెల మొబైల్ నంబర్‌కు రహస్య ఓటీపీ పంపబడుతుంది.'
                    : language === 'hi-IN'
                    ? 'आपके 10 अंकों के मोबाइल नंबर पर सुरक्षित ओटीपी भेजा जाएगा।'
                    : 'A secure 6-digit verification code will be sent to your phone.'}
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-60 text-white font-black text-sm rounded-2xl shadow-md shadow-teal-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{language === 'te-IN' ? 'ఓటీపీ పంపుతోంది...' : 'Sending OTP...'}</span>
                  </div>
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
              <div className="flex items-center justify-between bg-teal-50/50 border border-teal-200/80 rounded-2xl px-4 py-3">
                <div>
                  <div className="text-[11px] text-teal-800 font-bold">{t.phone}</div>
                  <div className="text-sm font-black text-slate-800 tracking-wider">
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
                  className="flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
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
                    className="w-full px-4 py-3.5 text-2xl font-mono font-black tracking-[0.4em] bg-white border-2 border-teal-300 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-600 text-slate-900 text-center transition-all shadow-2xs"
                  />
                </div>
                {/* Visual OTP Boxes Indicator */}
                <div className="flex items-center justify-center gap-2 mt-3">
                  {[0, 1, 2, 3, 4, 5].map((idx) => {
                    const digit = otp[idx];
                    const isFilled = digit !== undefined && digit !== '';
                    const isCurrent = otp.length === idx;
                    return (
                      <div
                        key={idx}
                        className={`w-9 h-10 rounded-xl border flex items-center justify-center font-mono font-black text-base transition-all ${
                          isFilled
                            ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-2xs'
                            : isCurrent
                            ? 'border-teal-600 bg-white ring-2 ring-teal-200'
                            : 'border-slate-200 bg-slate-50/60 text-slate-400'
                        }`}
                      >
                        {isFilled ? '•' : ''}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 text-white font-black text-sm rounded-2xl shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{language === 'te-IN' ? 'ఓటీపీ ధృవీకరిస్తోంది...' : 'Verifying OTP...'}</span>
                  </div>
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
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-teal-700 disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                >
                  {cooldown > 0 ? (
                    <>
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>{t.resendOtp} ({cooldown}s)</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
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
              className="w-full py-2.5 px-4 bg-teal-50 hover:bg-teal-100/80 text-teal-900 border border-teal-200 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>{t.demoAccount}</span>
            </button>
          </div>

        </div>

        {/* Privacy Note */}
        <div className="bg-teal-50/40 px-6 py-3 border-t border-teal-100/60 text-center text-[11px] text-teal-900/80 font-medium flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Privacy protected • Encrypted health session</span>
        </div>

      </div>
    </div>
  );
};
