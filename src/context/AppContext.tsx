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
  GpsTrackingStatus,
  EmergencyContact,
  MedicineReminderSettings,
} from '../types';
import { getApiUrl } from '../utils/api';
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
  getNearbyHospitalsWithLiveDistance,
  calculateDistanceKm,
} from '../utils/locationService';

interface AppContextType {
  user: User | null;
  healthProfile: HealthProfile | null;
  todayLog: DailyHealthLog;
  historyLogs: DailyHealthLog[];
  medicines: MedicineItem[];
  symptoms: SymptomReport[];
  doctors: Doctor[];
  nearbyDoctorsLoading: boolean;
  nearbyDoctorsError: string | null;
  nearbyDoctorsConfigRequired: {
    apiRequired: string;
    envVariable: string;
    message: string;
    osmAvailable?: boolean;
    userCoordinates?: { lat: number; lng: number };
  } | null;
  nearbyDoctorsProvider: 'google' | 'osm';
  hospitals: Hospital[];
  nearbyHospitalsLoading: boolean;
  nearbyHospitalsError: string | null;
  nearbyHospitalsConfigRequired: {
    apiRequired: string;
    envVariable: string;
    message: string;
    userCoordinates?: { lat: number; lng: number };
  } | null;
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
  setNearbyDoctorsProvider: (provider: 'google' | 'osm') => void;
  fetchNearbyDoctors: (lat?: number, lng?: number, provider?: 'google' | 'osm', force?: boolean) => Promise<void>;
  refreshNearbyDoctors: () => Promise<void>;
  fetchNearbyHospitals: (lat?: number | null, lng?: number | null, force?: boolean) => Promise<void>;
  refreshNearbyHospitals: () => Promise<void>;
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

  // User Location State - Real-time device GPS (No hard-coded or fake coordinates)
  const [userLocation, setUserLocation] = useState<UserLocationState>(() => {
    return {
      city: 'Awaiting Location',
      area: 'Device GPS not yet calibrated',
      lat: null,
      lng: null,
      accuracy: null,
      isGpsDetected: false,
      isTrackingActive: false,
      trackingStatus: 'idle',
      trackingError: null,
      permissionDenied: false,
      lastUpdated: undefined,
    };
  });

  // Dynamic Doctors and Hospitals computed from user coordinates
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [nearbyDoctorsLoading, setNearbyDoctorsLoading] = useState<boolean>(false);
  const [nearbyDoctorsError, setNearbyDoctorsError] = useState<string | null>(null);
  const [nearbyDoctorsConfigRequired, setNearbyDoctorsConfigRequired] = useState<{
    apiRequired: string;
    envVariable: string;
    message: string;
    osmAvailable?: boolean;
    userCoordinates?: { lat: number; lng: number };
  } | null>(null);
  const [nearbyDoctorsProvider, setNearbyDoctorsProvider] = useState<'google' | 'osm'>('google');

  // Real Hospital state queried from Google Places API
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [nearbyHospitalsLoading, setNearbyHospitalsLoading] = useState<boolean>(false);
  const [nearbyHospitalsError, setNearbyHospitalsError] = useState<string | null>(null);
  const [nearbyHospitalsConfigRequired, setNearbyHospitalsConfigRequired] = useState<{
    apiRequired: string;
    envVariable: string;
    message: string;
    userCoordinates?: { lat: number; lng: number };
  } | null>(null);

  const lastSearchedCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastSearchedProviderRef = useRef<'google' | 'osm'>('google');
  const lastSearchedHospitalCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  const fetchNearbyDoctors = async (
    targetLat?: number | null,
    targetLng?: number | null,
    provider?: 'google' | 'osm',
    force = false
  ) => {
    const lat = targetLat ?? userLocation.lat;
    const lng = targetLng ?? userLocation.lng;

    if (lat == null || lng == null || typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      return;
    }

    const activeProvider = provider ?? nearbyDoctorsProvider;

    // Avoid duplicate requests if moved <300m and provider didn't change
    if (!force && lastSearchedCoordsRef.current && lastSearchedProviderRef.current === activeProvider) {
      const dist = calculateDistanceKm(lastSearchedCoordsRef.current.lat, lastSearchedCoordsRef.current.lng, lat, lng);
      if (dist < 0.3) {
        return;
      }
    }

    setNearbyDoctorsLoading(true);
    setNearbyDoctorsError(null);

    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: '5000',
        provider: activeProvider,
      });

      const res = await fetch(getApiUrl(`/api/places/nearby-doctors?${params.toString()}`));
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setDoctors(data.data);
        setNearbyDoctorsConfigRequired(null);
        lastSearchedCoordsRef.current = { lat, lng };
        lastSearchedProviderRef.current = activeProvider;
      } else if (data.error === 'API_KEY_REQUIRED') {
        // STRICTLY DO NOT SHOW FAKE DOCTORS! Tell the user what API & key are required.
        setDoctors([]);
        setNearbyDoctorsConfigRequired({
          apiRequired: data.apiRequired || 'Google Places API (New) / Google Maps Platform',
          envVariable: data.envVariable || 'GOOGLE_MAPS_API_KEY',
          message: data.message || 'Google Places API key is required to query live nearby doctors.',
          osmAvailable: Boolean(data.osmAvailable),
          userCoordinates: data.userCoordinates || { lat, lng },
        });
        lastSearchedCoordsRef.current = { lat, lng };
        lastSearchedProviderRef.current = activeProvider;
      } else {
        setDoctors([]);
        setNearbyDoctorsError(data.message || data.error || 'Failed to retrieve nearby healthcare providers.');
      }
    } catch (err: any) {
      console.error('Error fetching nearby doctors:', err);
      setDoctors([]);
      setNearbyDoctorsError('Network error connecting to nearby healthcare provider API.');
    } finally {
      setNearbyDoctorsLoading(false);
    }
  };

  const refreshNearbyDoctors = async () => {
    if (userLocation.lat != null && userLocation.lng != null) {
      await fetchNearbyDoctors(userLocation.lat, userLocation.lng, nearbyDoctorsProvider, true);
    } else {
      const freshLoc = await detectUserLocation();
      if (freshLoc.lat != null && freshLoc.lng != null) {
        await fetchNearbyDoctors(freshLoc.lat, freshLoc.lng, nearbyDoctorsProvider, true);
      }
    }
  };

  const fetchNearbyHospitals = async (
    targetLat?: number | null,
    targetLng?: number | null,
    force = false
  ) => {
    const lat = targetLat ?? userLocation.lat;
    const lng = targetLng ?? userLocation.lng;

    if (lat == null || lng == null || typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      return;
    }

    if (!force && lastSearchedHospitalCoordsRef.current) {
      const dist = calculateDistanceKm(lastSearchedHospitalCoordsRef.current.lat, lastSearchedHospitalCoordsRef.current.lng, lat, lng);
      if (dist < 0.3) {
        return;
      }
    }

    setNearbyHospitalsLoading(true);
    setNearbyHospitalsError(null);

    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: '10000',
      });

      const res = await fetch(getApiUrl(`/api/places/nearby-hospitals?${params.toString()}`));
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setHospitals(data.data);
        setNearbyHospitalsConfigRequired(null);
        lastSearchedHospitalCoordsRef.current = { lat, lng };
      } else if (data.error === 'API_KEY_REQUIRED') {
        // STRICT REQUIREMENT: If Google API key is missing, do NOT display fake hospitals!
        setHospitals([]);
        setNearbyHospitalsConfigRequired({
          apiRequired: data.apiRequired || 'Google Places API (New) / Google Maps Platform',
          envVariable: data.envVariable || 'GOOGLE_MAPS_API_KEY',
          message: data.message || 'Google Places API key is required to query live verified emergency hospitals.',
          userCoordinates: data.userCoordinates || { lat, lng },
        });
        lastSearchedHospitalCoordsRef.current = { lat, lng };
      } else {
        setHospitals([]);
        setNearbyHospitalsError(data.message || data.error || 'Failed to retrieve nearby emergency hospitals.');
      }
    } catch (err: any) {
      console.error('Error fetching nearby hospitals:', err);
      setHospitals([]);
      setNearbyHospitalsError('Network error connecting to nearby hospitals API.');
    } finally {
      setNearbyHospitalsLoading(false);
    }
  };

  const refreshNearbyHospitals = async () => {
    if (userLocation.lat != null && userLocation.lng != null) {
      await fetchNearbyHospitals(userLocation.lat, userLocation.lng, true);
    } else {
      const freshLoc = await detectUserLocation();
      if (freshLoc.lat != null && freshLoc.lng != null) {
        await fetchNearbyHospitals(freshLoc.lat, freshLoc.lng, true);
      }
    }
  };

  // Re-fetch when user GPS coordinates change significantly (>= 300m) or on first coordinate fix
  useEffect(() => {
    if (userLocation.lat != null && userLocation.lng != null && userLocation.isGpsDetected) {
      if (!lastSearchedCoordsRef.current) {
        fetchNearbyDoctors(userLocation.lat, userLocation.lng, nearbyDoctorsProvider);
      } else {
        const dist = calculateDistanceKm(lastSearchedCoordsRef.current.lat, lastSearchedCoordsRef.current.lng, userLocation.lat, userLocation.lng);
        if (dist >= 0.3) {
          fetchNearbyDoctors(userLocation.lat, userLocation.lng, nearbyDoctorsProvider);
        }
      }

      if (!lastSearchedHospitalCoordsRef.current) {
        fetchNearbyHospitals(userLocation.lat, userLocation.lng);
      } else {
        const distH = calculateDistanceKm(lastSearchedHospitalCoordsRef.current.lat, lastSearchedHospitalCoordsRef.current.lng, userLocation.lat, userLocation.lng);
        if (distH >= 0.3) {
          fetchNearbyHospitals(userLocation.lat, userLocation.lng);
        }
      }
    }
  }, [userLocation.lat, userLocation.lng, userLocation.isGpsDetected]);

  const watchIdRef = useRef<number | null>(null);

  const startLiveLocationTracking = () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setUserLocation((prev) => ({
        ...prev,
        isTrackingActive: false,
        trackingStatus: 'unsupported',
        trackingError: 'Geolocation is not supported by your browser. Please use Chrome, Safari, or Edge.',
      }));
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setUserLocation((prev) => ({
      ...prev,
      isTrackingActive: true,
      trackingStatus: 'requesting',
      trackingError: null,
      permissionDenied: false,
    }));

    try {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy, speed, heading } = pos.coords;
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const newLoc: UserLocationState = {
            city: 'Live Device GPS',
            area: `GPS: ${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E`,
            lat: latitude,
            lng: longitude,
            accuracy: accuracy != null ? Math.round(accuracy) : null,
            isGpsDetected: true,
            isTrackingActive: true,
            trackingStatus: 'tracking',
            trackingError: null,
            permissionDenied: false,
            lastUpdated: nowStr,
            speed: speed ?? null,
            heading: heading ?? null,
          };
          setUserLocation(newLoc);
        },
        (err: GeolocationPositionError) => {
          console.warn('Geolocation watchPosition error:', err);
          let status: GpsTrackingStatus = 'unavailable';
          let message = 'Unable to determine your GPS location.';
          if (err.code === err.PERMISSION_DENIED) {
            status = 'denied';
            message = 'Location permission was denied. Please allow location access in your browser settings to find doctors, clinics, and hospitals near you.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            status = 'unavailable';
            message = 'GPS position is unavailable. Please check that your device GPS/location service is enabled and has a clear signal.';
          } else if (err.code === err.TIMEOUT) {
            status = 'timeout';
            message = 'GPS acquisition timed out while waiting for a location fix. Tap "Retry GPS" or move to an open area.';
          }

          setUserLocation((prev) => ({
            ...prev,
            lat: prev.isGpsDetected ? prev.lat : null,
            lng: prev.isGpsDetected ? prev.lng : null,
            isTrackingActive: false,
            trackingStatus: status,
            permissionDenied: status === 'denied',
            trackingError: message,
            lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          }));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 3000,
        }
      );
      watchIdRef.current = id;
    } catch (e: any) {
      console.error('Failed to start watchPosition:', e);
      setUserLocation((prev) => ({
        ...prev,
        isTrackingActive: false,
        trackingStatus: 'unavailable',
        trackingError: e?.message || 'Failed to start GPS tracking.',
      }));
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
      trackingStatus: 'idle',
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
    startLiveLocationTracking();
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('geolocation' in navigator)) {
        const unsupported: UserLocationState = {
          city: 'Browser Unsupported',
          area: 'Geolocation not supported',
          lat: null,
          lng: null,
          accuracy: null,
          isGpsDetected: false,
          isTrackingActive: false,
          trackingStatus: 'unsupported',
          trackingError: 'Your browser does not support Geolocation. Please use Chrome, Safari, or Edge.',
          permissionDenied: false,
          lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
        setUserLocation(unsupported);
        resolve(unsupported);
        return;
      }

      setUserLocation((prev) => ({
        ...prev,
        trackingStatus: 'requesting',
        trackingError: null,
      }));

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy, speed, heading } = pos.coords;
          const loc: UserLocationState = {
            city: 'Live Device GPS',
            area: `GPS: ${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E`,
            lat: latitude,
            lng: longitude,
            accuracy: accuracy != null ? Math.round(accuracy) : null,
            isGpsDetected: true,
            isTrackingActive: true,
            trackingStatus: 'tracking',
            permissionDenied: false,
            trackingError: null,
            lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            speed: speed ?? null,
            heading: heading ?? null,
          };
          setUserLocation(loc);
          resolve(loc);
        },
        (err) => {
          let status: GpsTrackingStatus = 'unavailable';
          let message = 'Unable to determine GPS location.';
          if (err.code === err.PERMISSION_DENIED) {
            status = 'denied';
            message = 'Location permission was denied. Please allow location access in your browser settings to find local doctors.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            status = 'unavailable';
            message = 'GPS position is unavailable. Please verify device location service is enabled.';
          } else if (err.code === err.TIMEOUT) {
            status = 'timeout';
            message = 'GPS request timed out waiting for satellite fix. Please retry.';
          }

          const errorLoc: UserLocationState = {
            city: status === 'denied' ? 'Permission Denied' : 'GPS Unavailable',
            area: message,
            lat: null,
            lng: null,
            accuracy: null,
            isGpsDetected: false,
            isTrackingActive: false,
            trackingStatus: status,
            permissionDenied: status === 'denied',
            trackingError: message,
            lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          };
          setUserLocation(errorLoc);
          resolve(errorLoc);
        },
        { timeout: 15000, enableHighAccuracy: true, maximumAge: 3000 }
      );
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
        nearbyDoctorsLoading,
        nearbyDoctorsError,
        nearbyDoctorsConfigRequired,
        nearbyDoctorsProvider,
        setNearbyDoctorsProvider,
        fetchNearbyDoctors,
        refreshNearbyDoctors,
        hospitals,
        nearbyHospitalsLoading,
        nearbyHospitalsError,
        nearbyHospitalsConfigRequired,
        fetchNearbyHospitals,
        refreshNearbyHospitals,
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
