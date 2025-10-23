// LUMINOVA Types - Complete Type System

export type UserRole = 'psychologist' | 'patient';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Psychologist extends User {
  role: 'psychologist';
  licenseNumber: string;
  specializations: string[];
  assignedChildren: string[];
  hospital?: string;
  yearsExperience: number;
}

export interface Patient extends User {
  role: 'patient';
  age: number;
  sex?: string;
  date_of_birth?: Date;
  address?: string;
  guardian_name?: string;
  guardian_phone?: string;
  asd_level?: string;
  diagnosis: string[];
  guardian_email?: string;
  assignedPsychologist: string;
  preferences: PatientPreferences;
  currentEmotion: EmotionType;
  biometricData?: BiometricData;
  clinical_history_file?: string;
}

// Legacy type alias for compatibility
export interface Child extends Patient {
  role: 'patient';
  clinical_history_file?: string;
}

export interface PatientPreferences {
  favoriteColors: string[];
  preferredActivities: string[];
  sensitivity: {
    sound: 'low' | 'medium' | 'high';
    light: 'low' | 'medium' | 'high';
    touch: 'low' | 'medium' | 'high';
  };
  avatarCustomization: AvatarSettings;
}

// Legacy type alias for compatibility
export type ChildPreferences = PatientPreferences;

export interface AvatarSettings {
  skinTone: string;
  hairColor: string;
  eyeColor: string;
  clothing: string;
  accessories: string[];
}

export type EmotionType = 'joy' | 'sadness' | 'anger' | 'fear' | 'disgust' | 'neutral';

export interface EmotionRecord {
  emotion: EmotionType;
  intensity: number; // 0-100
  timestamp: Date;
  triggers?: string[];
  context?: string;
}

export interface BiometricData {
  heartRate: number;
  stressLevel: 'low' | 'medium' | 'high';
  skinTemperature: number;
  activity: 'resting' | 'active' | 'excited' | 'agitated';
  timestamp: Date;
}

export interface TherapySession {
  id: string;
  childId: string;
  psychologistId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  objectives: string[];
  activities: SessionActivity[];
  biometricLogs: BiometricData[];
  emotionLogs: EmotionRecord[];
  notes: string;
  pauseBreaks: PauseBreak[];
}

export interface SessionActivity {
  id: string;
  type: 'game' | 'breathing' | 'music' | 'conversation' | 'movement';
  name: string;
  duration: number; // minutes
  effectiveness: number; // 0-100
  childResponse: 'positive' | 'neutral' | 'negative';
  notes?: string;
}

export interface PauseBreak {
  id: string;
  type: 'breathing' | 'movement' | 'sensory' | 'visual';
  duration: number; // seconds
  trigger: 'automatic' | 'manual' | 'biometric_alert';
  effectiveness: number; // 0-100
  timestamp: Date;
}

export interface SoundTherapy {
  id: string;
  name: string;
  type: 'white' | 'pink' | 'brown' | 'nature' | 'musical';
  frequency: number;
  volume: number;
  duration?: number;
  emotionTarget: EmotionType[];
  effectiveness: Record<string, number>; // childId -> effectiveness score
}

export interface EmotionalIsland {
  id: string;
  emotion: EmotionType;
  name: string;
  character: string;
  color: string;
  gradient: string;
  activities: IslandActivity[];
  unlocked: boolean;
  visitCount: number;
  lastVisit?: Date;
}

export interface IslandActivity {
  id: string;
  name: string;
  type: 'game' | 'story' | 'breathing' | 'art' | 'music';
  description: string;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  completed: boolean;
  score?: number;
  unlocked: boolean;
}

export interface NotificationData {
  id: string;
  type: 'biometric_alert' | 'session_reminder' | 'achievement' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  timestamp: Date;
  userId: string;
  actionRequired?: boolean;
  data?: Record<string, unknown>;
}

export interface AnalyticsData {
  childId: string;
  period: 'day' | 'week' | 'month';
  emotionDistribution: Record<EmotionType, number>;
  averageStressLevel: number;
  sessionCount: number;
  averageSessionDuration: number;
  improvementTrends: {
    emotion: EmotionType;
    trend: 'improving' | 'stable' | 'declining';
    percentage: number;
  }[];
  biometricTrends: {
    metric: 'heartRate' | 'stressLevel' | 'activity';
    values: { date: string; value: number }[];
  }[];
  recommendedActivities: string[];
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface BiometricAlert {
  id: string;
  childId: string;
  type: 'high_stress' | 'rapid_heartrate' | 'emotional_distress' | 'inactivity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  actionTaken?: string;
}

// UI State Types
export interface AppState {
  currentUser: User | null;
  theme: 'psychologist' | 'patient';
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface BiometricState {
  realTimeData: BiometricData | null;
  historicalData: BiometricData[];
  alerts: BiometricAlert[];
  isMonitoring: boolean;
}

export interface SessionState {
  currentSession: TherapySession | null;
  activeSessions: TherapySession[];
  sessionHistory: TherapySession[];
  isRecording: boolean;
}

export interface EmotionUIState {
  currentEmotion: EmotionType;
  emotionHistory: EmotionRecord[];
  selectedIsland: EmotionalIsland | null;
  unlockedIslands: EmotionalIsland[];
}

// Mock Data Types for Development
export interface MockBiometricReading {
  heartRate: number;
  stressLevel: 'low' | 'medium' | 'high';
  timestamp: Date;
  synthetic: boolean; // Flag for mock data
}

export interface MockEmotionReading {
  emotion: EmotionType;
  confidence: number;
  facialExpression: string;
  timestamp: Date;
  synthetic: boolean;
}