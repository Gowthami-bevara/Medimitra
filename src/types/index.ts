export type AppLanguage = 'en-IN' | 'te-IN' | 'hi-IN';

export interface User {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  avatar?: string;
  registeredAt: string;
}

export type PhysicalActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type ExerciseFrequency = 'rarely' | '1-2_days' | '3-4_days' | '5+_days';
export type MoodType = 'great' | 'good' | 'neutral' | 'low' | 'stressed' | 'anxious';
export type StressLevel = 'low' | 'moderate' | 'high';
export type NutritionPattern = 'balanced' | 'vegetarian' | 'irregular' | 'high_protein' | 'fast_food_frequent';

export interface HealthProfile {
  // Required / Basic
  age: number | null;
  height: number | null; // cm
  weight: number | null; // kg
  typicalSleep: number | null; // hours
  typicalWater: number | null; // liters
  physicalActivity: PhysicalActivityLevel | null;
  averageSteps: number | null;
  exerciseFrequency: ExerciseFrequency | null;
  currentMood: MoodType | null;
  typicalStress: StressLevel | null;
  nutritionPattern: NutritionPattern | null;

  // Optional sensitive
  gender: string | null;
  managesPrescribedMedicines: boolean | null;
  existingHealthConditions: string[] | null;
  smokingHabit: string | null;
  alcoholHabit: string | null;

  isCompleted: boolean;
  updatedAt: string;
}

export interface DailyHealthLog {
  date: string; // YYYY-MM-DD
  sleepDuration: number; // hours
  sleepQuality: 'poor' | 'fair' | 'good' | 'excellent';
  waterIntakeLiters: number; // e.g. 2.25
  steps: number;
  activeMinutes: number;
  exerciseLogged: boolean;
  exerciseType: string;
  mood: MoodType;
  stressLevel: number; // 1-10
  moodNotes?: string;
  nutritionConsistency: 'regular' | 'irregular' | 'balanced';
}

export interface MedicineItem {
  id: string;
  name: string;
  dosage?: string;
  schedule: 'Morning' | 'Afternoon' | 'Night' | 'Morning & Night' | 'Three times daily';
  time: string;
  durationDays?: number;
  startDate?: string;
  endDate?: string;
  totalTablets: number;
  takenTablets: number;
  remainingTablets: number;
  isCompleted: boolean;
  prescribedBy?: string;
  purpose?: string;
  takenToday: boolean;
  skippedToday: boolean;
  lastTakenDate?: string;
  snoozedUntil?: string | null;
  adherenceHistory: {
    date: string;
    status: 'taken' | 'skipped' | 'missed';
    timestamp?: string;
  }[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary?: boolean;
}

export interface MedicineReminderSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  snoozeMinutes: number;
}

export interface HealthReminder {
  id: string;
  title: string;
  type: 'medicine' | 'water' | 'sleep' | 'activity' | 'wellness';
  time: string;
  enabled: boolean;
  repeat: string;
}

export interface CategoryScore {
  score: number | null;
  status: 'Good' | 'Needs Attention' | 'High Attention' | 'Not enough data';
  label: string;
  explanation: string;
}

export interface HealthPredictionResult {
  overallScore: number; // 0-100
  status: 'Good' | 'Needs Attention' | 'High Attention';
  completenessPercentage: number;
  evaluatedAt: string;
  categories: {
    sleep: CategoryScore;
    hydration: CategoryScore;
    physicalActivity: CategoryScore;
    dailySteps: CategoryScore;
    exerciseConsistency: CategoryScore;
    mood: CategoryScore;
    stress: CategoryScore;
    mentalWellness: CategoryScore;
    medicationAdherence: CategoryScore;
    nutritionLifestyle: CategoryScore;
    generalWellnessConsistency: CategoryScore;
  };
  positiveInsights: string[];
  areasNeedingAttention: string[];
  personalizedSuggestions: string[];
  trends: {
    metric: string;
    description: string;
    status: 'improving' | 'steady' | 'declining';
  }[];
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experienceYears?: number;
  clinic: string;
  distanceKm: number;
  rating?: number;
  phone?: string;
  address: string;
  availableToday?: boolean;
  languages?: string[];
  lat?: number;
  lng?: number;
  type?: string;
  directionsUrl?: string;
  source?: string;
  isOpenNow?: boolean | null;
}

export interface Hospital {
  id: string;
  name: string;
  distanceKm: number;
  emergency24x7: boolean;
  icuBedsAvailable: number;
  ambulanceContact: string;
  emergencyHelpline: string;
  address: string;
  traumaLevel: string;
  lat?: number;
  lng?: number;
}

export interface TrafficJunction {
  id: string;
  name: string;
  distanceKm: number;
  status: 'Clear' | 'Priority Green Corridor' | 'Preparing' | 'Congested (Rerouting)';
  signalState: 'GREEN' | 'CLEARING' | 'STANDBY' | 'YELLOW' | 'RED';
  crossingTimeSec: number;
  preempted?: boolean;
}

export interface AmbulanceSimulation {
  id: string;
  ambulanceCode: string;
  vehicleId?: string;
  driverName: string;
  paramedicTeam: string;
  hospitalName: string;
  destinationHospital?: string;
  distanceRemainingKm: number;
  totalDistanceKm?: number;
  etaMinutes: number;
  currentSpeedKmH: number;
  speedKmH?: number;
  trafficCondition: 'Light' | 'Moderate' | 'Heavy';
  greenCorridorActive: boolean;
  greenWaveActive?: boolean;
  priorityLevel: 'Critical' | 'Urgent' | 'Standard' | 'Critical / Code Red';
  currentJunctionIndex: number;
  junctions: TrafficJunction[];
  intersections?: TrafficJunction[];
  hospitalPreparationStatus: 'Trauma Bay Prepared' | 'Doctors Mobilized' | 'Arrival Bay Clear';
  isRunning: boolean;
  status?: 'idle' | 'dispatched' | 'en_route' | 'preempting' | 'green_wave_active' | 'arrived';
  progressPercentage?: number;
  logs?: string[];
}

export type GpsTrackingStatus =
  | 'idle'
  | 'requesting'
  | 'tracking'
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'unsupported';

export interface UserLocationState {
  city: string;
  area: string;
  lat: number | null;
  lng: number | null;
  accuracy?: number | null; // meters
  isGpsDetected: boolean;
  lastUpdated?: string;
  isTrackingActive?: boolean;
  trackingStatus: GpsTrackingStatus;
  trackingError?: string | null;
  permissionDenied?: boolean;
  speed?: number | null;
  heading?: number | null;
}

export interface SymptomReport {
  id: string;
  reportedAt: string;
  symptoms: string[];
  duration: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  notes?: string;
  guidanceSummary?: string;
}
