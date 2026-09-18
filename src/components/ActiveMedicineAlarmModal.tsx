import React from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  Pill,
  Volume2,
  X,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ActiveMedicineAlarmModal: React.FC = () => {
  const {
    activeMedicineAlarm,
    dismissActiveAlarm,
    recordMedicineDose,
    snoozeMedicine,
    medicineSettings,
    testMedicineAlarmAudio,
    language,
  } = useApp();

  if (!activeMedicineAlarm) return null;

  const total = activeMedicineAlarm.totalTablets || 10;
  const remaining = activeMedicineAlarm.remainingTablets ?? Math.max(0, total - (activeMedicineAlarm.takenTablets || 0));

  const labels = {
    'en-IN': {
      alertTitle: 'Medicine Reminder Alert',
      timeToTake: 'Time to take your scheduled dose:',
      dosage: 'Dosage',
      remainingText: `${remaining} tablets remaining of ${total}`,
      markTaken: 'Mark as Taken',
      snooze: `Snooze (${medicineSettings.snoozeMinutes || 10}m)`,
      skipDose: 'Skip This Dose',
      dismiss: 'Dismiss',
      soundPlaying: 'Audible reminder sound playing',
      prescribedBy: 'Prescribed by',
    },
    'te-IN': {
      alertTitle: 'మందుల రిమైండర్ అలారం',
      timeToTake: 'మీరు మందు వేసుకోవాల్సిన సమయం అయింది:',
      dosage: 'మోతాదు',
      remainingText: `మిగిలిన టాబ్లెట్స్: ${remaining} / ${total}`,
      markTaken: 'వేసుకున్నాను (Taken)',
      snooze: `స్నూజ్ (${medicineSettings.snoozeMinutes || 10}ని)`,
      skipDose: 'ఇప్పుడు వేసుకోలేకపోయాను (Skip)',
      dismiss: 'తర్వాత',
      soundPlaying: 'రిమైండర్ శబ్దం వినిపిస్తోంది',
      prescribedBy: 'వైద్యులు',
    },
    'hi-IN': {
      alertTitle: 'दवा रिमाइंडर अलार्म',
      timeToTake: 'आपकी दवा लेने का समय हो गया है:',
      dosage: 'खुराक',
      remainingText: `शेष टैबलेट: ${remaining} में से ${total}`,
      markTaken: 'दवा ले ली (Taken)',
      snooze: `स्नूज़ (${medicineSettings.snoozeMinutes || 10} मिनट)`,
      skipDose: 'इस बार छोड़ें (Skip)',
      dismiss: 'बंद करें',
      soundPlaying: 'रिमाइंडर ध्वनि बज रही है',
      prescribedBy: 'चिकित्सक',
    },
  }[language] || {
    alertTitle: 'Medicine Reminder Alert',
    timeToTake: 'Time to take your scheduled dose:',
    dosage: 'Dosage',
    remainingText: `${remaining} tablets remaining of ${total}`,
    markTaken: 'Mark as Taken',
    snooze: `Snooze (${medicineSettings.snoozeMinutes || 10}m)`,
    skipDose: 'Skip This Dose',
    dismiss: 'Dismiss',
    soundPlaying: 'Audible reminder sound playing',
    prescribedBy: 'Prescribed by',
  };

  return (
    <div
      id="active-medicine-alarm-dialog"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl border-2 border-blue-500 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center animate-bounce">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-blue-200 block">
                {labels.alertTitle}
              </span>
              <h2 className="font-display font-black text-xl text-white">
                {activeMedicineAlarm.time} • {activeMedicineAlarm.schedule}
              </h2>
            </div>
          </div>

          <button
            onClick={dismissActiveAlarm}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            title={labels.dismiss}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alarm Body */}
        <div className="p-6 space-y-5">
          
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
              <Pill className="w-7 h-7" />
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-xs text-slate-500 font-medium block">
                {labels.timeToTake}
              </span>
              <h3 className="font-display font-black text-2xl text-blue-950 truncate">
                {activeMedicineAlarm.name}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-700">
                  {activeMedicineAlarm.dosage || '1 Tablet'}
                </span>
                {activeMedicineAlarm.purpose && (
                  <span className="truncate text-slate-500">
                    • {activeMedicineAlarm.purpose}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Remaining Tablets Progress Card */}
          <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-blue-950">
              <span>{labels.remainingText}</span>
              <span className="text-blue-700">
                {Math.round((remaining / total) * 100)}% Left
              </span>
            </div>
            <div className="w-full bg-blue-200/50 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, (remaining / total) * 100))}%` }}
              />
            </div>
            {activeMedicineAlarm.prescribedBy && (
              <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
                <User className="w-3 h-3 text-slate-400" />
                <span>{labels.prescribedBy}: {activeMedicineAlarm.prescribedBy}</span>
              </div>
            )}
          </div>

          {/* Audio Chime Notice & Replay */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <div className="flex items-center gap-1.5 text-blue-600 font-medium">
              <Volume2 className="w-4 h-4 animate-pulse" />
              <span className="text-[11px]">{labels.soundPlaying}</span>
            </div>
            <button
              onClick={testMedicineAlarmAudio}
              className="text-[11px] font-bold text-slate-600 hover:text-blue-600 underline"
            >
              Replay Sound
            </button>
          </div>

          {/* Large Action Buttons (Touch friendly 48px+) */}
          <div className="space-y-2.5 pt-2">
            {/* 1. Taken Button (Primary Action) */}
            <button
              id="alarm-btn-taken"
              onClick={() => recordMedicineDose(activeMedicineAlarm.id, 'taken')}
              className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base flex items-center justify-center gap-2.5 shadow-md shadow-emerald-600/20 active:scale-98 transition-all min-h-[48px]"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{labels.markTaken}</span>
            </button>

            {/* 2. Snooze and Skip Buttons Row */}
            <div className="grid grid-cols-2 gap-3">
              <button
                id="alarm-btn-snooze"
                onClick={() => snoozeMedicine(activeMedicineAlarm.id, medicineSettings.snoozeMinutes || 10)}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
              >
                <Clock className="w-4 h-4 text-blue-600" />
                <span>{labels.snooze}</span>
              </button>

              <button
                id="alarm-btn-skip"
                onClick={() => recordMedicineDose(activeMedicineAlarm.id, 'skipped')}
                className="py-3 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
              >
                <X className="w-4 h-4 text-amber-700" />
                <span>{labels.skipDose}</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
