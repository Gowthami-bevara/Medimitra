import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  User,
  HealthProfile,
  DailyHealthLog,
  MedicineItem,
  SymptomReport,
  HealthPredictionResult,
  AppLanguage,
  AmbulanceSimulation,
  Doctor,
  Hospital,
  UserLocationState,
  EmergencyContact,
  MedicineReminderSettings,
} from '../types';
import {
  SEED_PROFILE,
  SEED_TODAY_LOG,
  SEED_HISTORY_LOGS,
  SEED_MEDICINES,
  SEED_DOCTORS,
  SEED_HOSPITALS,
  SEED_EMERGENCY_CONTACTS,
  INITIAL_AMBULANCE_SIMULATION,
} from '../data/seedData';
import { HealthPredictionService } from '../services/healthPredictionService';
import {
  getNearbyDoctorsWithLiveDistance,
  getNearbyHospitalsWithLiveDistance,
} from '../utils/locationService';

interface AppContextType {
  user: User | null;
  healthProfile: HealthProfile | null;
  todayLog: DailyHealthLog;
  historyLogs: DailyHealthLog[];
  medicines: MedicineItem[];
  symptoms: SymptomReport[];
  doctors: Doctor[];
  hospitals: Hospital[];
  prediction: HealthPredictionResult;
  language: AppLanguage;
  easyMode: boolean;
  activeTab: string;
  isVoiceAssistantOpen: boolean;
  ambulanceSim: AmbulanceSimulation;
  userLocation: UserLocationState;
  onboardingStep: 'auth' | 'profile-setup' | 'completed';
  emergencyContacts: EmergencyContact[];
  medicineSettings: MedicineReminderSettings;
  activeMedicineAlarm: MedicineItem | null;

  // Actions
  setLanguage: (lang: AppLanguage) => void;
  setEasyMode: (val: boolean) => void;
  setActiveTab: (tab: string) => void;
  setIsVoiceAssistantOpen: (open: boolean) => void;
  setUserLocation: (loc: UserLocationState) => void;
  detectUserLocation: () => Promise<UserLocationState>;
  startLiveLocationTracking: () => void;
  stopLiveLocationTracking: () => void;
  login: (email: string, name?: string) => void;
  register: (email: string, name: string) => void;
  registerWithPhone: (phone: string) => void;
  updateUserName: (name: string) => void;
  loginDemoUser: () => void;
  logout: () => void;
  updateHealthProfile: (profile: HealthProfile) => void;
  skipHealthProfile: () => void;
  updateTodayLog: (patch: Partial<DailyHealthLog>) => void;
  toggleMedicineTaken: (id: string) => void;
  toggleMedicineSkipped: (id: string) => void;
  recordMedicineDose: (id: string, action: 'taken' | 'skipped') => void;
  snoozeMedicine: (id: string, minutes?: number) => void;
  addMedicine: (med: Partial<MedicineItem> & { name: string; schedule: MedicineItem['schedule']; time: string }) => void;
  editMedicine: (id: string, updated: Partial<MedicineItem>) => void;
  deleteMedicine: (id: string) => void;
  addEmergencyContact: (contact: Omit<EmergencyContact, 'id'>) => void;
  editEmergencyContact: (id: string, updated: Partial<EmergencyContact>) => void;
  deleteEmergencyContact: (id: string) => void;
  updateMedicineSettings: (settings: Partial<MedicineReminderSettings>) => void;
  triggerMedicineAlarm: (med: MedicineItem) => void;
  dismissActiveAlarm: () => void;
  testMedicineAlarmAudio: () => void;
  addSymptomReport: (report: SymptomReport) => void;
  refreshPrediction: () => void;

  // Ambulance Sim actions
  startAmbulanceSimulation: () => void;
  toggleAmbulanceSimulation: () => void;
  resetAmbulanceSimulation: () => void;
  advanceAmbulanceStep: () => void;
  toggleGreenCorridor: () => void;
  triggerSignalPreemption: () => void;
  dispatchEmergencyAmbulance: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'medimitra_app_state_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with saved state or demo seed
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('medimitra_user');
      return saved ? JSON.parse(saved) : {
        id: 'user-demo-1',
        name: 'Rohini Varma',
        email: 'rohini@medimitra.health',
        registeredAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  });

  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(() => {
    try {
      const saved = localStorage.getItem('medimitra_profile');
      return saved ? JSON.parse(saved) : SEED_PROFILE;
    } catch {
      return SEED_PROFILE;
    }
  });

  const [todayLog, setTodayLog] = useState<DailyHealthLog>(() => {
    try {
      const saved = localStorage.getItem('medimitra_today_log');
      return saved ? JSON.parse(saved) : SEED_TODAY_LOG;
    } catch {
      return SEED_TODAY_LOG;
    }
  });

  const [historyLogs, setHistoryLogs] = useState<DailyHealthLog[]>(SEED_HISTORY_LOGS);

  const [medicines, setMedicines] = useState<MedicineItem[]>(() => {
    try {
      const saved = localStorage.getItem('medimitra_medicines');
      return saved ? JSON.parse(saved) : SEED_MEDICINES;
    } catch {
      return SEED_MEDICINES;
    }
  });

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(() => {
    try {
      const saved = localStorage.getItem('medimitra_emergency_contacts');
      return saved ? JSON.parse(saved) : SEED_EMERGENCY_CONTACTS;
    } catch {
      return SEED_EMERGENCY_CONTACTS;
    }
  });

  const [medicineSettings, setMedicineSettings] = useState<MedicineReminderSettings>(() => {
    try {
      const saved = localStorage.getItem('medimitra_med_settings');
      return saved
        ? JSON.parse(saved)
        : {
            soundEnabled: true,
            vibrationEnabled: true,
            snoozeMinutes: 10,
            notificationsEnabled: true,
          };
    } catch {
      return {
        soundEnabled: true,
        vibrationEnabled: true,
        snoozeMinutes: 10,
        notificationsEnabled: true,
      };
    }
  });

  const [activeMedicineAlarm, setActiveMedicineAlarm] = useState<MedicineItem | null>(null);

  const [symptoms, setSymptoms] = useState<SymptomReport[]>([]);

  // User Location State (Default: Hyderabad, Telangana)
  const [userLocation, setUserLocation] = useState<UserLocationState>(() => {
    try {
      const saved = localStorage.getItem('medimitra_location');
      return saved ? JSON.parse(saved) : {
        city: 'Hyderabad',
        area: 'HITEC City & Banjara Hills, Hyderabad, Telangana',
        lat: 17.4482,
        lng: 78.3915,
        isGpsDetected: false,
        isTrackingActive: false,
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    } catch {
      return {
        city: 'Hyderabad',
        area: 'HITEC City & Banjara Hills, Hyderabad, Telangana',
        lat: 17.4482,
        lng: 78.3915,
        isGpsDetected: false,
        isTrackingActive: false,
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }
  });

  // Dynamic Doctors and Hospitals computed from user coordinates
  const [doctors, setDoctors] = useState<Doctor[]>(() =>
    getNearbyDoctorsWithLiveDistance(SEED_DOCTORS, userLocation)
  );
  const [hospitals, setHospitals] = useState<Hospital[]>(() =>
    getNearbyHospitalsWithLiveDistance(SEED_HOSPITALS, userLocation)
  );

  // Recalculate nearby distances whenever user GPS location updates
  useEffect(() => {
    setDoctors(getNearbyDoctorsWithLiveDistance(SEED_DOCTORS, userLocation));
    setHospitals(getNearbyHospitalsWithLiveDistance(SEED_HOSPITALS, userLocation));
  }, [userLocation.lat, userLocation.lng]);

  const watchIdRef = useRef<number | null>(null);

  const startLiveLocationTracking = () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setUserLocation((prev) => ({
        ...prev,
        isTrackingActive: false,
        trackingError: 'Geolocation is not supported by your browser',
      }));
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setUserLocation((prev) => ({
      ...prev,
      isTrackingActive: true,
      trackingError: null,
      permissionDenied: false,
    }));

    try {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const newLoc: UserLocationState = {
            city: 'Live Device GPS',
            area: `GPS: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E (±${Math.round(accuracy)}m)`,
            lat: latitude,
            lng: longitude,
            accuracy,
            isGpsDetected: true,
            isTrackingActive: true,
            trackingError: null,
            permissionDenied: false,
            lastUpdated: nowStr,
          };
          setUserLocation(newLoc);
        },
        (err) => {
          console.warn('Geolocation watchPosition error:', err);
          const isDenied = err.code === err.PERMISSION_DENIED;
          setUserLocation((prev) => ({
            ...prev,
            isTrackingActive: false,
            permissionDenied: isDenied,
            trackingError: isDenied
              ? 'Location permission denied by user'
              : 'Unable to retrieve GPS coordinates',
          }));
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 10000,
        }
      );
      watchIdRef.current = id;
    } catch (e) {
      console.error('Failed to start watchPosition:', e);
    }
  };

  const stopLiveLocationTracking = () => {
    if (watchIdRef.current !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setUserLocation((prev) => ({
      ...prev,
      isTrackingActive: false,
    }));
  };

  // Cleanup watchPosition on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem('medimitra_lang');
      return (saved as AppLanguage) || 'en-IN';
    } catch {
      return 'en-IN';
    }
  });

  const [easyMode, setEasyModeState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('medimitra_easymode') === 'true';
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<string>('home');
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState<boolean>(false);
  const [onboardingStep, setOnboardingStep] = useState<'auth' | 'profile-setup' | 'completed'>('completed');

  // Ambulance Simulation State
  const [ambulanceSim, setAmbulanceSim] = useState<AmbulanceSimulation>(INITIAL_AMBULANCE_SIMULATION);

  const detectUserLocation = async (): Promise<UserLocationState> => {
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const loc: UserLocationState = {
              city: 'Current Location',
              area: `GPS: ${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E (Telangana)`,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              isGpsDetected: true,
              isTrackingActive: userLocation.isTrackingActive,
              lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setUserLocation(loc);
            resolve(loc);
          },
          () => {
            // Graceful fallback to Hyderabad, Telangana
            const fallback: UserLocationState = {
              city: 'Hyderabad',
              area: 'Banjara Hills / Jubilee Hills, Hyderabad (Default)',
              lat: 17.4123,
              lng: 78.4354,
              accuracy: 100,
              isGpsDetected: false,
              isTrackingActive: false,
              lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setUserLocation(fallback);
            resolve(fallback);
          },
          { timeout: 8000, enableHighAccuracy: true }
        );
      } else {
        resolve(userLocation);
      }
    });
  };

  // Prediction calculation (centralized service)
  const [prediction, setPrediction] = useState<HealthPredictionResult>(() =>
    HealthPredictionService.calculatePrediction(healthProfile, todayLog, historyLogs, medicines, symptoms)
  );

  // Re-calculate prediction when relevant state changes
  useEffect(() => {
    const updated = HealthPredictionService.calculatePrediction(
      healthProfile,
      todayLog,
      historyLogs,
      medicines,
      symptoms
    );
    setPrediction(updated);
  }, [healthProfile, todayLog, historyLogs, medicines, symptoms]);

  // Ambulance animation ticker when simulation is running
  useEffect(() => {
    let timer: any = null;
    if (ambulanceSim.isRunning) {
      timer = setInterval(() => {
        setAmbulanceSim((prev) => {
          if (prev.distanceRemainingKm <= 0.2) {
            return {
              ...prev,
              isRunning: false,
              distanceRemainingKm: 0,
              etaMinutes: 0,
              hospitalPreparationStatus: 'Arrival Bay Clear',
            };
          }

          const nextDistance = Math.max(0, Number((prev.distanceRemainingKm - 0.2).toFixed(1)));
          const nextEta = Math.max(1, Math.ceil(nextDistance * 1.4));
          const junctionIndex = Math.min(
            prev.junctions.length - 1,
            Math.floor(((4.8 - nextDistance) / 4.8) * prev.junctions.length)
          );

          const updatedJunctions = prev.junctions.map((j, i) => {
            if (i < junctionIndex) {
              return { ...j, status: 'Clear' as const, signalState: 'GREEN' as const };
            } else if (i === junctionIndex) {
              return { ...j, status: 'Priority Green Corridor' as const, signalState: 'GREEN' as const };
            } else {
              return { ...j, status: 'Preparing' as const, signalState: 'CLEARING' as const };
            }
          });

          return {
            ...prev,
            distanceRemainingKm: nextDistance,
            etaMinutes: nextEta,
            currentJunctionIndex: junctionIndex,
            junctions: updatedJunctions,
          };
        });
      }, 1500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [ambulanceSim.isRunning]);

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('medimitra_lang', lang);
    } catch {}
  };

  const setEasyMode = (val: boolean) => {
    setEasyModeState(val);
    try {
      localStorage.setItem('medimitra_easymode', String(val));
    } catch {}
  };

  const login = (email: string, name?: string) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      name: name || email.split('@')[0],
      registeredAt: new Date().toISOString(),
    };
    setUser(newUser);
    try {
      localStorage.setItem('medimitra_user', JSON.stringify(newUser));
    } catch {}
    setOnboardingStep('completed');
    setActiveTab('home');
  };

  const register = (email: string, name: string) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      name: name || 'Health Seeker',
      registeredAt: new Date().toISOString(),
    };
    setUser(newUser);
    try {
      localStorage.setItem('medimitra_user', JSON.stringify(newUser));
    } catch {}
    // Post-registration requirement:
    // REGISTER -> SET UP YOUR HEALTH PROFILE -> PERSONALIZED HOME
    setOnboardingStep('profile-setup');
    setActiveTab('profile-setup');
  };

  const registerWithPhone = (phone: string) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      phone,
      name: 'Rohini',
      registeredAt: new Date().toISOString(),
    };
    setUser(newUser);
    try {
      localStorage.setItem('medimitra_user', JSON.stringify(newUser));
    } catch {}

    const freshProfile: HealthProfile = {
      age: null,
      height: null,
      weight: null,
      typicalSleep: null,
      typicalWater: null,
      physicalActivity: null,
      averageSteps: null,
      exerciseFrequency: null,
      currentMood: null,
      typicalStress: null,
      nutritionPattern: null,
      gender: null,
      managesPrescribedMedicines: null,
      existingHealthConditions: null,
      smokingHabit: null,
      alcoholHabit: null,
      isCompleted: false,
      updatedAt: new Date().toISOString(),
    };
    setHealthProfile(freshProfile);
    try {
      localStorage.setItem('medimitra_profile', JSON.stringify(freshProfile));
    } catch {}

    // Transition immediately to Voice-First Health Profile setup!
    setOnboardingStep('profile-setup');
    setActiveTab('profile-setup');
  };

  const updateUserName = (name: string) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, name };
      try {
        localStorage.setItem('medimitra_user', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const loginDemoUser = () => {
    const demoUser: User = {
      id: 'demo-user-rohini',
      name: 'Rohini Varma',
      email: 'rohinimarshmellow@gmail.com',
      registeredAt: '2026-09-01T08:00:00.000Z',
    };
    setUser(demoUser);
    setHealthProfile(SEED_PROFILE);
    setTodayLog(SEED_TODAY_LOG);
    setMedicines(SEED_MEDICINES);
    setOnboardingStep('completed');
    setActiveTab('home');
    try {
      localStorage.setItem('medimitra_user', JSON.stringify(demoUser));
      localStorage.setItem('medimitra_profile', JSON.stringify(SEED_PROFILE));
    } catch {}
  };

  const logout = () => {
    setUser(null);
    setOnboardingStep('auth');
    try {
      localStorage.removeItem('medimitra_user');
    } catch {}
  };

  const updateHealthProfile = (profile: HealthProfile) => {
    setHealthProfile(profile);
    try {
      localStorage.setItem('medimitra_profile', JSON.stringify(profile));
    } catch {}

    // Ensure registration data flows into My Health and Health Prediction calculation
    setTodayLog((prev) => {
      const synced: DailyHealthLog = {
        ...prev,
        sleepDuration: profile.typicalSleep ?? prev.sleepDuration,
        waterIntakeLiters: profile.typicalWater ?? prev.waterIntakeLiters,
        steps: profile.averageSteps ?? prev.steps,
        mood: (profile.currentMood as any) || prev.mood,
        stressLevel:
          profile.typicalStress === 'high'
            ? 8
            : profile.typicalStress === 'moderate'
            ? 5
            : profile.typicalStress === 'low'
            ? 3
            : prev.stressLevel,
      };
      try {
        localStorage.setItem('medimitra_today_log', JSON.stringify(synced));
      } catch {}
      return synced;
    });

    setOnboardingStep('completed');
    setActiveTab('home');
  };

  const skipHealthProfile = () => {
    const defaultIncomplete: HealthProfile = {
      age: null,
      height: null,
      weight: null,
      typicalSleep: null,
      typicalWater: null,
      physicalActivity: null,
      averageSteps: null,
      exerciseFrequency: null,
      currentMood: null,
      typicalStress: null,
      nutritionPattern: null,
      gender: null,
      managesPrescribedMedicines: null,
      existingHealthConditions: null,
      smokingHabit: null,
      alcoholHabit: null,
      isCompleted: false,
      updatedAt: new Date().toISOString(),
    };
    setHealthProfile(defaultIncomplete);
    try {
      localStorage.setItem('medimitra_profile', JSON.stringify(defaultIncomplete));
    } catch {}
    setOnboardingStep('completed');
    setActiveTab('home');
  };

  const updateTodayLog = (patch: Partial<DailyHealthLog>) => {
    setTodayLog((prev) => {
      const updated = { ...prev, ...patch };
      try {
        localStorage.setItem('medimitra_today_log', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Sound Chime for Medicine Alarms
  const playChimeSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const playTone = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.35, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      };
      playTone(587.33, 0, 0.22); // D5
      playTone(739.99, 0.24, 0.22); // F#5
      playTone(880.00, 0.48, 0.45); // A5
    } catch (e) {
      console.warn('Audio chime notice:', e);
    }
  };

  const triggerVibration = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([350, 150, 350]);
      } catch {}
    }
  };

  const triggerNotification = (med: MedicineItem) => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(`Time to take your medicine: ${med.name}`, {
            body: `Scheduled: ${med.time} (${med.schedule}). ${med.remainingTablets ?? 0} tablets remaining.`,
            icon: '/favicon.ico',
          });
        } catch {}
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().catch(() => {});
      }
    }
  };

  const triggerMedicineAlarm = (med: MedicineItem) => {
    if (med.isCompleted || (med.remainingTablets !== undefined && med.remainingTablets <= 0)) {
      return; // Never alert for completed medicine courses
    }
    setActiveMedicineAlarm(med);
    if (medicineSettings.soundEnabled) {
      playChimeSound();
    }
    if (medicineSettings.vibrationEnabled) {
      triggerVibration();
    }
    if (medicineSettings.notificationsEnabled) {
      triggerNotification(med);
    }
  };

  const dismissActiveAlarm = () => {
    setActiveMedicineAlarm(null);
  };

  const testMedicineAlarmAudio = () => {
    playChimeSound();
    triggerVibration();
  };

  const toggleMedicineTaken = (id: string) => {
    recordMedicineDose(id, 'taken');
  };

  const toggleMedicineSkipped = (id: string) => {
    recordMedicineDose(id, 'skipped');
  };

  const recordMedicineDose = (id: string, action: 'taken' | 'skipped') => {
    setMedicines((prev) => {
      const todayDate = new Date().toISOString().split('T')[0];
      const updated = prev.map((m) => {
        if (m.id !== id) return m;

        if (action === 'taken') {
          const newTaken = (m.takenTablets ?? 0) + 1;
          const total = m.totalTablets ?? 10;
          const newRemaining = Math.max(0, total - newTaken);
          const completed = newRemaining === 0;

          return {
            ...m,
            takenTablets: newTaken,
            remainingTablets: newRemaining,
            isCompleted: completed,
            takenToday: true,
            skippedToday: false,
            lastTakenDate: todayDate,
            adherenceHistory: [
              { date: todayDate, status: 'taken' as const, timestamp: new Date().toISOString() },
              ...(m.adherenceHistory || []),
            ],
          };
        } else {
          return {
            ...m,
            skippedToday: true,
            takenToday: false,
            adherenceHistory: [
              { date: todayDate, status: 'skipped' as const, timestamp: new Date().toISOString() },
              ...(m.adherenceHistory || []),
            ],
          };
        }
      });

      try {
        localStorage.setItem('medimitra_medicines', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (activeMedicineAlarm?.id === id) {
      dismissActiveAlarm();
    }
  };

  const snoozeMedicine = (id: string, minutes: number = 10) => {
    const snoozeUntil = new Date(Date.now() + minutes * 60000).toISOString();
    setMedicines((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, snoozedUntil: snoozeUntil } : m));
      try {
        localStorage.setItem('medimitra_medicines', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (activeMedicineAlarm?.id === id) {
      dismissActiveAlarm();
    }
  };

  const addMedicine = (
    med: Partial<MedicineItem> & { name: string; schedule: MedicineItem['schedule']; time: string }
  ) => {
    const total = med.totalTablets ?? (med.durationDays ? med.durationDays * 1 : 10);
    const newMed: MedicineItem = {
      id: `med-${Date.now()}`,
      name: med.name,
      schedule: med.schedule,
      time: med.time,
      durationDays: med.durationDays ?? 14,
      totalTablets: total,
      takenTablets: 0,
      remainingTablets: total,
      isCompleted: false,
      dosage: med.dosage || '1 Tablet',
      prescribedBy: med.prescribedBy || 'Physician',
      purpose: med.purpose || 'General health maintenance',
      startDate: new Date().toISOString(),
      takenToday: false,
      skippedToday: false,
      adherenceHistory: [],
    };
    setMedicines((prev) => {
      const updated = [newMed, ...prev];
      try {
        localStorage.setItem('medimitra_medicines', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const editMedicine = (id: string, patch: Partial<MedicineItem>) => {
    setMedicines((prev) => {
      const updated = prev.map((m) => {
        if (m.id !== id) return m;
        const total = patch.totalTablets !== undefined ? patch.totalTablets : (m.totalTablets ?? 10);
        const taken = patch.takenTablets !== undefined ? patch.takenTablets : (m.takenTablets ?? 0);
        const remaining = patch.remainingTablets !== undefined ? patch.remainingTablets : Math.max(0, total - taken);
        const isCompleted = patch.isCompleted !== undefined ? patch.isCompleted : remaining <= 0;

        return {
          ...m,
          ...patch,
          totalTablets: total,
          takenTablets: taken,
          remainingTablets: remaining,
          isCompleted,
        };
      });
      try {
        localStorage.setItem('medimitra_medicines', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const deleteMedicine = (id: string) => {
    setMedicines((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      try {
        localStorage.setItem('medimitra_medicines', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (activeMedicineAlarm?.id === id) {
      dismissActiveAlarm();
    }
  };

  // Emergency Contacts CRUD
  const addEmergencyContact = (contact: Omit<EmergencyContact, 'id'>) => {
    const newContact: EmergencyContact = {
      ...contact,
      id: `ec-${Date.now()}`,
    };
    setEmergencyContacts((prev) => {
      const updated = [newContact, ...prev];
      try {
        localStorage.setItem('medimitra_emergency_contacts', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const editEmergencyContact = (id: string, updatedFields: Partial<EmergencyContact>) => {
    setEmergencyContacts((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...updatedFields } : c));
      try {
        localStorage.setItem('medimitra_emergency_contacts', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const deleteEmergencyContact = (id: string) => {
    setEmergencyContacts((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      try {
        localStorage.setItem('medimitra_emergency_contacts', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const updateMedicineSettings = (settings: Partial<MedicineReminderSettings>) => {
    setMedicineSettings((prev) => {
      const updated = { ...prev, ...settings };
      try {
        localStorage.setItem('medimitra_med_settings', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Scheduled Reminder Checking Loop (runs every 20s)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const nowTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

      medicines.forEach((med) => {
        if (med.isCompleted || (med.remainingTablets !== undefined && med.remainingTablets <= 0)) {
          return;
        }

        // Check snoozed timers
        if (med.snoozedUntil && new Date(med.snoozedUntil).getTime() <= now.getTime()) {
          triggerMedicineAlarm(med);
          // clear snooze once fired
          editMedicine(med.id, { snoozedUntil: undefined });
          return;
        }

        // Check standard time match if not taken today
        if (!med.takenToday && med.time && med.time.trim().toLowerCase() === nowTimeStr.toLowerCase()) {
          if (!activeMedicineAlarm) {
            triggerMedicineAlarm(med);
          }
        }
      });
    }, 20000);

    return () => clearInterval(interval);
  }, [medicines, medicineSettings, activeMedicineAlarm]);

  const addSymptomReport = (report: SymptomReport) => {
    setSymptoms((prev) => [report, ...prev]);
  };

  const refreshPrediction = () => {
    const updated = HealthPredictionService.calculatePrediction(
      healthProfile,
      todayLog,
      historyLogs,
      medicines,
      symptoms
    );
    setPrediction(updated);
  };

  const startAmbulanceSimulation = () => {
    setAmbulanceSim((prev) => ({
      ...prev,
      isRunning: true,
      status: 'en_route',
      logs: [
        `[${new Date().toLocaleTimeString()}] Emergency dispatch initialized. ALS unit en route.`,
        ...(prev.logs || []),
      ],
    }));
  };

  const toggleAmbulanceSimulation = () => {
    setAmbulanceSim((prev) => ({
      ...prev,
      isRunning: !prev.isRunning,
      status: !prev.isRunning ? 'en_route' : 'idle',
    }));
  };

  const resetAmbulanceSimulation = () => {
    setAmbulanceSim(INITIAL_AMBULANCE_SIMULATION);
  };

  const advanceAmbulanceStep = () => {
    setAmbulanceSim((prev) => {
      const nextDistance = Math.max(0, Number((prev.distanceRemainingKm - 1.0).toFixed(1)));
      const nextEta = Math.max(1, Math.ceil(nextDistance * 1.4));
      const nextJunction = Math.min(prev.junctions.length - 1, prev.currentJunctionIndex + 1);

      return {
        ...prev,
        distanceRemainingKm: nextDistance,
        etaMinutes: nextEta,
        currentJunctionIndex: nextJunction,
        junctions: prev.junctions.map((j, idx) => ({
          ...j,
          status: idx < nextJunction ? 'Clear' : idx === nextJunction ? 'Priority Green Corridor' : 'Preparing',
          signalState: idx <= nextJunction ? 'GREEN' : 'CLEARING',
        })),
        hospitalPreparationStatus:
          nextDistance <= 1.0 ? 'Arrival Bay Clear' : 'Trauma Bay Prepared',
      };
    });
  };

  const toggleGreenCorridor = () => {
    setAmbulanceSim((prev) => ({
      ...prev,
      greenCorridorActive: !prev.greenCorridorActive,
      greenWaveActive: !prev.greenCorridorActive,
      trafficCondition: !prev.greenCorridorActive ? 'Light' : 'Heavy',
    }));
  };

  const triggerSignalPreemption = () => {
    setAmbulanceSim((prev) => {
      const nextDistance = Math.max(0, Number((prev.distanceRemainingKm - 0.8).toFixed(1)));
      const nextEta = Math.max(1, Math.ceil(nextDistance * 1.1));
      const newSpeed = 82;
      const updatedJunctions = prev.junctions.map((j) => ({
        ...j,
        signalState: 'GREEN' as const,
        status: 'Priority Green Corridor' as const,
        preempted: true,
      }));
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newLogs = [
        `[${timestamp}] [GREEN WAVE ACTIVATED] Emergency preemption beacon broadcasted to route signals`,
        `[${timestamp}] [SIGNAL OVERRIDE] Upcoming corridor signals switched from RED/YELLOW to PRIORITY GREEN`,
        `[${timestamp}] [TRAFFIC REDIRECTED] Cross-traffic held at red lights. Transit speed increased to ${newSpeed} km/h`,
        `[${timestamp}] [RESUSCITATION BAY PREPARED] Apollo City Trauma Team ready for immediate handover`,
        ...(prev.logs || []),
      ].slice(0, 15);

      return {
        ...prev,
        isRunning: true,
        greenCorridorActive: true,
        greenWaveActive: true,
        trafficCondition: 'Light',
        speedKmH: newSpeed,
        currentSpeedKmH: newSpeed,
        etaMinutes: nextEta,
        distanceRemainingKm: nextDistance,
        junctions: updatedJunctions,
        intersections: updatedJunctions,
        status: 'green_wave_active',
        logs: newLogs,
      };
    });
  };

  const dispatchEmergencyAmbulance = () => {
    setActiveTab('ambulance-traffic');
    setAmbulanceSim({
      ...INITIAL_AMBULANCE_SIMULATION,
      isRunning: true,
      status: 'en_route',
    });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        healthProfile,
        todayLog,
        historyLogs,
        medicines,
        symptoms,
        doctors,
        hospitals,
        prediction,
        language,
        easyMode,
        activeTab,
        isVoiceAssistantOpen,
        ambulanceSim,
        userLocation,
        onboardingStep,
        emergencyContacts,
        medicineSettings,
        activeMedicineAlarm,
        setLanguage,
        setEasyMode,
        setActiveTab,
        setIsVoiceAssistantOpen,
        setUserLocation,
        detectUserLocation,
        startLiveLocationTracking,
        stopLiveLocationTracking,
        login,
        register,
        registerWithPhone,
        updateUserName,
        loginDemoUser,
        logout,
        updateHealthProfile,
        skipHealthProfile,
        updateTodayLog,
        toggleMedicineTaken,
        toggleMedicineSkipped,
        recordMedicineDose,
        snoozeMedicine,
        addMedicine,
        editMedicine,
        deleteMedicine,
        addEmergencyContact,
        editEmergencyContact,
        deleteEmergencyContact,
        updateMedicineSettings,
        triggerMedicineAlarm,
        dismissActiveAlarm,
        testMedicineAlarmAudio,
        addSymptomReport,
        refreshPrediction,
        startAmbulanceSimulation,
        toggleAmbulanceSimulation,
        resetAmbulanceSimulation,
        advanceAmbulanceStep,
        toggleGreenCorridor,
        triggerSignalPreemption,
        dispatchEmergencyAmbulance,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
