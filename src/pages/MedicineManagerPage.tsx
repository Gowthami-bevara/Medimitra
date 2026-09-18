import React, { useState } from 'react';
import {
  Pill,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Edit3,
  Trash2,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCheck,
  Bell,
  Play,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/i18n';
import { MedicineItem } from '../types';

interface CommonMedicine {
  name: string;
  dosage: string;
  schedule: MedicineItem['schedule'];
  time: string;
  purpose: string;
  totalTablets: number;
}

const COMMON_MEDICINES: CommonMedicine[] = [
  { name: 'Paracetamol', dosage: '500mg', schedule: 'Morning & Night', time: '08:30 AM', purpose: 'Fever & pain relief', totalTablets: 10 },
  { name: 'Metformin', dosage: '500mg', schedule: 'Morning & Night', time: '08:30 AM', purpose: 'Blood sugar / Diabetes management', totalTablets: 30 },
  { name: 'Telmisartan', dosage: '40mg', schedule: 'Morning', time: '08:00 AM', purpose: 'Blood pressure / Hypertension', totalTablets: 30 },
  { name: 'Pantoprazole', dosage: '40mg', schedule: 'Morning', time: '07:30 AM', purpose: 'Acidity & gastric acid control', totalTablets: 15 },
  { name: 'Atorvastatin', dosage: '10mg', schedule: 'Night', time: '09:30 PM', purpose: 'Cholesterol & heart protection', totalTablets: 30 },
  { name: 'Amlodipine', dosage: '5mg', schedule: 'Morning', time: '08:30 AM', purpose: 'Blood pressure regulation', totalTablets: 30 },
  { name: 'Cetirizine', dosage: '10mg', schedule: 'Night', time: '09:00 PM', purpose: 'Allergy, cold & sneezing relief', totalTablets: 10 },
  { name: 'Vitamin D3', dosage: '60000 IU', schedule: 'Morning', time: '09:00 AM', purpose: 'Bone health & immunity booster', totalTablets: 4 },
  { name: 'Azithromycin', dosage: '500mg', schedule: 'Morning', time: '08:30 AM', purpose: 'Antibiotic therapy', totalTablets: 5 },
  { name: 'B-Complex with Zinc', dosage: '1 Capsule', schedule: 'Morning', time: '08:30 AM', purpose: 'Vitamin supplement & energy', totalTablets: 15 },
];

export const MedicineManagerPage: React.FC = () => {
  const {
    medicines,
    recordMedicineDose,
    snoozeMedicine,
    addMedicine,
    editMedicine,
    deleteMedicine,
    medicineSettings,
    updateMedicineSettings,
    triggerMedicineAlarm,
    testMedicineAlarmAudio,
    language,
  } = useApp();

  const t = TRANSLATIONS[language];

  // Filtering state
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'completed'>('all');

  // Add Medicine Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addDosage, setAddDosage] = useState('1 Tablet');
  const [addSchedule, setAddSchedule] = useState<MedicineItem['schedule']>('Morning');
  const [addTime, setAddTime] = useState('08:30 AM');
  const [addTotalTablets, setAddTotalTablets] = useState('10');
  const [addDoctor, setAddDoctor] = useState('Dr. A. Sharma');
  const [addPurpose, setAddPurpose] = useState('Doctor-prescribed treatment');

  // Edit Medicine Modal State
  const [editingMed, setEditingMed] = useState<MedicineItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editDosage, setEditDosage] = useState('');
  const [editSchedule, setEditSchedule] = useState<MedicineItem['schedule']>('Morning');
  const [editTime, setEditTime] = useState('');
  const [editTotalTablets, setEditTotalTablets] = useState('10');
  const [editTakenTablets, setEditTakenTablets] = useState('0');
  const [editDoctor, setEditDoctor] = useState('');
  const [editPurpose, setEditPurpose] = useState('');

  // Delete Confirmation State
  const [deletingMedId, setDeletingMedId] = useState<string | null>(null);

  // Quick Time Presets
  const timePresets = ['07:30 AM', '08:30 AM', '01:00 PM', '02:00 PM', '08:00 PM', '09:30 PM'];

  // Handle Add Medicine Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) return;

    const total = parseInt(addTotalTablets, 10) || 10;
    addMedicine({
      name: addName.trim(),
      dosage: addDosage.trim() || '1 Tablet',
      schedule: addSchedule,
      time: addTime.trim() || '08:30 AM',
      durationDays: Math.ceil(total / 1),
      totalTablets: total,
      prescribedBy: addDoctor.trim() || 'Prescribed by Physician',
      purpose: addPurpose.trim() || 'General health maintenance',
    });

    setAddName('');
    setAddDosage('1 Tablet');
    setAddTotalTablets('10');
    setIsAddModalOpen(false);
  };

  // Open Edit Modal
  const handleOpenEdit = (med: MedicineItem) => {
    setEditingMed(med);
    setEditName(med.name);
    setEditDosage(med.dosage || '1 Tablet');
    setEditSchedule(med.schedule);
    setEditTime(med.time);
    setEditTotalTablets(String(med.totalTablets ?? 10));
    setEditTakenTablets(String(med.takenTablets ?? 0));
    setEditDoctor(med.prescribedBy || '');
    setEditPurpose(med.purpose || '');
  };

  // Handle Edit Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMed || !editName.trim()) return;

    const total = parseInt(editTotalTablets, 10) || 10;
    const taken = parseInt(editTakenTablets, 10) || 0;
    const remaining = Math.max(0, total - taken);
    const isCompleted = remaining === 0;

    editMedicine(editingMed.id, {
      name: editName.trim(),
      dosage: editDosage.trim() || '1 Tablet',
      schedule: editSchedule,
      time: editTime.trim() || '08:30 AM',
      totalTablets: total,
      takenTablets: taken,
      remainingTablets: remaining,
      isCompleted,
      prescribedBy: editDoctor.trim(),
      purpose: editPurpose.trim(),
    });

    setEditingMed(null);
  };

  // Handle Refill / Reset Completed Course
  const handleRefillMedicine = (med: MedicineItem) => {
    const refillCount = med.totalTablets || 10;
    editMedicine(med.id, {
      takenTablets: 0,
      remainingTablets: refillCount,
      isCompleted: false,
      takenToday: false,
      skippedToday: false,
    });
  };

  // Filter medicines based on active tab
  const filteredMedicines = medicines.filter((m) => {
    if (filterTab === 'active') return !m.isCompleted && (m.remainingTablets === undefined || m.remainingTablets > 0);
    if (filterTab === 'completed') return m.isCompleted || (m.remainingTablets !== undefined && m.remainingTablets <= 0);
    return true;
  });

  // Calculate adherence and tablet counts
  const totalMeds = medicines.length;
  const activeMeds = medicines.filter((m) => !m.isCompleted && (m.remainingTablets ?? 1) > 0);
  const completedMeds = medicines.filter((m) => m.isCompleted || (m.remainingTablets ?? 0) <= 0);
  const totalTakenToday = activeMeds.filter((m) => m.takenToday).length;
  const adherenceRate = activeMeds.length > 0 ? Math.round((totalTakenToday / activeMeds.length) * 100) : 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-md bg-blue-100 text-blue-800">
              <Pill className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-800">
              Prescription Adherence & Mobile Alarms
            </span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-blue-950 tracking-tight">
            {t.medicineManager}
          </h1>
          <p className="mt-1 text-slate-500 text-xs sm:text-sm max-w-2xl font-medium">
            Track daily tablet doses, manage remaining stock, receive audible chime & vibration alerts, and automatically complete courses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            id="btn-test-alarm"
            onClick={testMedicineAlarmAudio}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs sm:text-sm transition-colors border border-indigo-200"
            title="Test audible chime and phone vibration"
          >
            <Play className="w-4 h-4 text-indigo-600" />
            <span>Test Alarm</span>
          </button>

          <button
            id="btn-open-add-med"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addMedicine}</span>
          </button>
        </div>
      </div>

      {/* Safety Compliance Alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold block mb-0.5">
            Prescription Management Safety Policy:
          </strong>
          <p className="leading-relaxed">
            MediMitra tracks medicines prescribed by your licensed healthcare provider. MediMitra <strong>never independently prescribes medications</strong> or alters prescribed dosages. When a tablet course reaches 0 remaining tablets, it is automatically marked complete.
          </p>
        </div>
      </div>

      {/* Mobile Alarm Audio & Vibration Settings Card */}
      <div className="bg-white rounded-3xl border border-blue-100 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-sm sm:text-base text-blue-950">
                Mobile Reminder Alarm & Audio Chime
              </h2>
              <p className="text-xs text-slate-500">
                Play pleasant harmonic chimes and trigger mobile device vibrations at scheduled times.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Sound Toggle */}
            <button
              onClick={() => updateMedicineSettings({ soundEnabled: !medicineSettings.soundEnabled })}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border ${
                medicineSettings.soundEnabled
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
            >
              {medicineSettings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-blue-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
              <span>Chime: {medicineSettings.soundEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Vibration Toggle */}
            <button
              onClick={() => updateMedicineSettings({ vibrationEnabled: !medicineSettings.vibrationEnabled })}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border ${
                medicineSettings.vibrationEnabled
                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
            >
              <Bell className="w-4 h-4 text-purple-600" />
              <span>Vibrate: {medicineSettings.vibrationEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Snooze Minutes selector */}
            <div className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Snooze:</span>
              <select
                value={medicineSettings.snoozeMinutes || 10}
                onChange={(e) => updateMedicineSettings({ snoozeMinutes: Number(e.target.value) })}
                className="bg-transparent font-bold text-blue-700 outline-none cursor-pointer"
              >
                <option value={5}>5m</option>
                <option value={10}>10m</option>
                <option value={15}>15m</option>
                <option value={30}>30m</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Adherence Overview Bar */}
      <div className="bg-white rounded-3xl border border-blue-100 p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center font-display font-black text-xl">
            {adherenceRate}%
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Today's Adherence Rate
            </div>
            <div className="font-display font-extrabold text-blue-950 text-base">
              {totalTakenToday} of {activeMeds.length} Active Prescriptions Logged Today
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {completedMeds.length > 0 && `${completedMeds.length} course(s) successfully completed.`}
            </p>
          </div>
        </div>

        <div className="w-full sm:w-64 bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${adherenceRate}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs & Medicines List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl self-start">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterTab === 'all'
                  ? 'bg-white text-blue-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Prescriptions ({totalMeds})
            </button>
            <button
              onClick={() => setFilterTab('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterTab === 'active'
                  ? 'bg-white text-blue-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({activeMeds.length})
            </button>
            <button
              onClick={() => setFilterTab('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterTab === 'completed'
                  ? 'bg-white text-blue-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedMeds.length})
            </button>
          </div>
        </div>

        {filteredMedicines.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500 space-y-3">
            <Pill className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="font-bold text-slate-700">
              {filterTab === 'completed'
                ? 'No completed prescription courses yet'
                : 'No Prescriptions in this view'}
            </div>
            <p className="text-xs max-w-sm mx-auto">
              Add your daily prescribed tablets to track dosage count, receive alarm rings, and track adherence.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
            >
              + Add Medicine
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMedicines.map((med) => {
              const total = med.totalTablets ?? 10;
              const taken = med.takenTablets ?? 0;
              const remaining = med.remainingTablets ?? Math.max(0, total - taken);
              const isCompleted = med.isCompleted || remaining === 0;

              return (
                <div
                  key={med.id}
                  id={`med-card-${med.id}`}
                  className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                    isCompleted
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : med.takenToday
                      ? 'border-blue-300 bg-blue-50/20'
                      : med.skippedToday
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-blue-100'
                  }`}
                >
                  <div>
                    {/* Header Row: Name, Time, and Actions */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-display font-bold text-base text-blue-950 truncate">
                            {med.name}
                          </h3>
                          {med.dosage && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-bold text-slate-700">
                              {med.dosage}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{med.schedule} • {med.time}</span>
                        </div>
                      </div>

                      {/* Edit & Delete Action Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEdit(med)}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors"
                          title="Edit Medicine"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingMedId(med.id)}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                          title="Delete Medicine"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Tablet Count & Remaining Stock Bar */}
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">
                          Stock: {remaining} of {total} tablets left
                        </span>
                        <span className={`font-black ${isCompleted ? 'text-emerald-700' : 'text-blue-700'}`}>
                          {isCompleted ? 'Finished' : `${Math.round((remaining / total) * 100)}% left`}
                        </span>
                      </div>
                      
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCompleted
                              ? 'bg-emerald-500'
                              : remaining <= 3
                              ? 'bg-amber-500'
                              : 'bg-blue-600'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, (remaining / total) * 100))}%` }}
                        />
                      </div>
                    </div>

                    {/* Course Completed Notification Banner */}
                    {isCompleted ? (
                      <div className="mt-3 p-2.5 rounded-xl bg-emerald-100 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2 animate-in fade-in">
                        <CheckCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-black block">Course Completed!</span>
                          <span className="text-[11px] text-emerald-800">
                            All {total} tablets have been taken. Alarms stopped.
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Daily Dose Status Tag */
                      <div className="mt-2.5 flex items-center justify-between">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            med.takenToday
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : med.skippedToday
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          Today: {med.takenToday ? 'Taken' : med.skippedToday ? 'Skipped' : 'Pending'}
                        </span>

                        {/* Test Alarm For This Tablet */}
                        <button
                          onClick={() => triggerMedicineAlarm(med)}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                          title="Ring alarm for this tablet"
                        >
                          <Bell className="w-3 h-3" />
                          <span>Ring Alarm</span>
                        </button>
                      </div>
                    )}

                    {/* Purpose & Prescriber */}
                    <div className="mt-3 py-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                      {med.purpose && (
                        <div className="text-[11px] truncate">
                          <span className="text-slate-400 font-semibold">Purpose: </span>
                          <span>{med.purpose}</span>
                        </div>
                      )}
                      {med.prescribedBy && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{med.prescribedBy}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Taken / Skipped / Refill Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    {isCompleted ? (
                      <button
                        onClick={() => handleRefillMedicine(med)}
                        className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                        <span>Refill / Restart Course ({total} tabs)</span>
                      </button>
                    ) : (
                      <>
                        <button
                          id={`btn-taken-${med.id}`}
                          onClick={() => recordMedicineDose(med.id, 'taken')}
                          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                            med.takenToday
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{med.takenToday ? 'Dose Taken' : 'Mark Dose Taken'}</span>
                        </button>

                        <button
                          id={`btn-skip-${med.id}`}
                          onClick={() => recordMedicineDose(med.id, 'skipped')}
                          className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                            med.skippedToday
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-amber-50 text-slate-600'
                          }`}
                          title="Skip today's dose"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Skip</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Prescribed Medicine Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-blue-600" />
                <h3 className="font-display font-bold text-lg text-blue-950">
                  {t.addMedicine}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div className="relative">
                <label className="block font-bold text-slate-700 mb-1">
                  Medicine Name *
                </label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Type name (e.g. Paracetamol, Metformin, Telmisartan)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-semibold"
                />

                {/* Auto-complete suggestions when typing */}
                {addName.trim().length >= 2 && (
                  <div className="mt-1 flex flex-wrap gap-1.5 p-2 bg-blue-50/70 border border-blue-100 rounded-xl">
                    <span className="text-[10px] font-bold text-blue-800 w-full mb-0.5">
                      Suggested Medicines (Click to auto-fill dosage & purpose):
                    </span>
                    {COMMON_MEDICINES.filter((cm) =>
                      cm.name.toLowerCase().includes(addName.toLowerCase())
                    ).map((cm) => (
                      <button
                        key={cm.name}
                        type="button"
                        onClick={() => {
                          setAddName(cm.name);
                          setAddDosage(cm.dosage);
                          setAddSchedule(cm.schedule);
                          setAddTime(cm.time);
                          setAddPurpose(cm.purpose);
                          setAddTotalTablets(String(cm.totalTablets));
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-blue-600 hover:text-white text-blue-900 border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        {cm.name} ({cm.dosage})
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick Selection Presets when input is empty */}
                {!addName && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <span className="text-[10px] text-slate-500 font-medium mr-1 self-center">Popular:</span>
                    {COMMON_MEDICINES.slice(0, 5).map((cm) => (
                      <button
                        key={cm.name}
                        type="button"
                        onClick={() => {
                          setAddName(cm.name);
                          setAddDosage(cm.dosage);
                          setAddSchedule(cm.schedule);
                          setAddTime(cm.time);
                          setAddPurpose(cm.purpose);
                          setAddTotalTablets(String(cm.totalTablets));
                        }}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        {cm.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Dosage / Strength
                  </label>
                  <input
                    type="text"
                    value={addDosage}
                    onChange={(e) => setAddDosage(e.target.value)}
                    placeholder="e.g. 1 Tablet, 500mg, 40mg"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Total Tablets in Strip *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    required
                    value={addTotalTablets}
                    onChange={(e) => setAddTotalTablets(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Schedule *
                  </label>
                  <select
                    value={addSchedule}
                    onChange={(e) => setAddSchedule(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Night">Night</option>
                    <option value="Morning & Night">Morning & Night</option>
                    <option value="Three times daily">Three times daily</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Reminder Time *
                  </label>
                  <input
                    type="text"
                    value={addTime}
                    onChange={(e) => setAddTime(e.target.value)}
                    placeholder="e.g. 08:30 AM"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Time Presets */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {timePresets.map((tPreset) => (
                  <button
                    key={tPreset}
                    type="button"
                    onClick={() => setAddTime(tPreset)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                      addTime === tPreset
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {tPreset}
                  </button>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Prescribing Physician / Hospital
                </label>
                <input
                  type="text"
                  value={addDoctor}
                  onChange={(e) => setAddDoctor(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Rao, Care Clinic"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Purpose
                </label>
                <input
                  type="text"
                  value={addPurpose}
                  onChange={(e) => setAddPurpose(e.target.value)}
                  placeholder="e.g. Blood pressure regulation, sugar control"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20"
                >
                  Save & Set Alarm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Prescribed Medicine Modal */}
      {editingMed && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <h3 className="font-display font-bold text-lg text-blue-950">
                  Edit Medicine: {editingMed.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingMed(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Medicine Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Dosage / Strength
                  </label>
                  <input
                    type="text"
                    value={editDosage}
                    onChange={(e) => setEditDosage(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Schedule *
                  </label>
                  <select
                    value={editSchedule}
                    onChange={(e) => setEditSchedule(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Night">Night</option>
                    <option value="Morning & Night">Morning & Night</option>
                    <option value="Three times daily">Three times daily</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Reminder Time *
                  </label>
                  <input
                    type="text"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Total Tablets in Course
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editTotalTablets}
                    onChange={(e) => setEditTotalTablets(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tablets Already Taken
                </label>
                <input
                  type="number"
                  min="0"
                  max={editTotalTablets}
                  value={editTakenTablets}
                  onChange={(e) => setEditTakenTablets(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Prescribing Physician
                </label>
                <input
                  type="text"
                  value={editDoctor}
                  onChange={(e) => setEditDoctor(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Prescription Purpose
                </label>
                <input
                  type="text"
                  value={editPurpose}
                  onChange={(e) => setEditPurpose(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMed(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingMedId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-display font-bold text-lg text-slate-900">
                Delete Medicine?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to remove this prescription? This will stop upcoming reminder alarms.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setDeletingMedId(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteMedicine(deletingMedId);
                  setDeletingMedId(null);
                }}
                className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
