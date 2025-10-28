import { create } from 'zustand';
import api from '@/services/api';
import {
  BiometricAlert,
  BiometricData,
  EmotionRecord,
  MicroexpressionFrameData,
} from '@/types';

interface BiometricState {
  realTimeData: BiometricData | null;
  historicalData: BiometricData[];
  alerts: BiometricAlert[];
  emotionHistory: EmotionRecord[];
  isMonitoring: boolean;
  loading: boolean;

  startMonitoring: (childId: string) => Promise<void>;
  stopMonitoring: () => void;
  resolveAlert: (alertId: string) => Promise<void>;
  ingestRealtimeFrame: (frame: BiometricData) => void;
}

interface BackendBiometricData {
  id: string;
  child_id: string;
  timestamp: string;
  heart_rate?: number | null;
  stress_level?: string | null;
  skin_temperature?: number | null;
  activity?: string | null;
  face_count?: number | null;
  dominant_emotion?: string | null;
  dominant_confidence?: number | null;
  microexpression_data?: MicroexpressionFrameData | null;
}

interface BackendBiometricAlert {
  id: string;
  child_id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
  action_taken?: string | null;
}

interface BackendEmotionRecord {
  id: string;
  child_id: string;
  emotion: string;
  intensity: number;
  timestamp: string;
  triggers?: string[] | null;
  context?: string | null;
}

export const useBiometricStore = create<BiometricState>((set, get) => ({
  realTimeData: null,
  historicalData: [],
  alerts: [],
  emotionHistory: [],
  isMonitoring: false,
  loading: false,

  startMonitoring: async (childId: string) => {
    if (!childId) {
      console.warn('startMonitoring called without childId');
      return;
    }

    set({ isMonitoring: true, loading: true });

    try {
      const [history, alerts, emotions] = await Promise.all([
        api.get<BackendBiometricData[]>(
          `/biometric-data/history?limit=100&child_id=${childId}`
        ),
        api.get<BackendBiometricAlert[]>(
          `/alerts?child_id=${childId}`
        ),
        api.get<BackendEmotionRecord[]>(
          `/emotion-records/history?limit=50&child_id=${childId}`
        ),
      ]);

      const historicalData: BiometricData[] = (history ?? []).map((item) => ({
        timestamp: new Date(item.timestamp),
        heartRate: item.heart_rate ?? undefined,
        stressLevel: (item.stress_level as BiometricData['stressLevel']) ?? undefined,
        skinTemperature: item.skin_temperature ?? undefined,
        activity: (item.activity as BiometricData['activity']) ?? undefined,
        faceCount: item.face_count ?? undefined,
        dominantEmotion: item.dominant_emotion ?? undefined,
        dominantConfidence: item.dominant_confidence ?? undefined,
        microexpression_data: item.microexpression_data ?? undefined,
      }));

      const realTimeData = historicalData.length > 0 ? historicalData[0] : null;

      const mappedAlerts: BiometricAlert[] = (alerts ?? []).map((alert) => ({
        id: alert.id,
        childId: alert.child_id,
        type: alert.type as BiometricAlert['type'],
        severity: alert.severity,
        message: alert.message,
        timestamp: new Date(alert.timestamp),
        resolved: alert.resolved,
        actionTaken: alert.action_taken ?? undefined,
      }));

      const emotionHistory: EmotionRecord[] = (emotions ?? []).map((record) => ({
        emotion: record.emotion as EmotionRecord['emotion'],
        intensity: record.intensity,
        timestamp: new Date(record.timestamp),
        triggers: record.triggers ?? undefined,
        context: record.context ?? undefined,
      }));

      set({
        historicalData,
        realTimeData,
        alerts: mappedAlerts,
        emotionHistory,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching biometric information:', error);
      set({
        historicalData: [],
        realTimeData: null,
        alerts: [],
        emotionHistory: [],
        isMonitoring: false,
        loading: false,
      });
    }
  },

  stopMonitoring: () => {
    set({
      isMonitoring: false,
      realTimeData: null,
      loading: false,
    });
  },

  resolveAlert: async (alertId: string) => {
    try {
      await api.put(`/alerts/${alertId}/resolve`, {});

      set((state) => ({
        alerts: state.alerts.map((alert) =>
          alert.id === alertId ? { ...alert, resolved: true } : alert
        ),
      }));
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  },

  ingestRealtimeFrame: (frame: BiometricData) => {
    set((state) => {
      const updatedHistory = [frame, ...state.historicalData].slice(0, 240);
      return {
        realTimeData: frame,
        historicalData: updatedHistory,
        isMonitoring: true,
      };
    });
  },
}));
