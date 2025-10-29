import { create } from 'zustand';
import api from '@/services/api';
import { DashboardSummary } from '@/types';

interface DashboardState {
  metrics: DashboardSummary | null;
  loading: boolean;
  error: string | null;
  fetchDashboard: () => Promise<void>;
}

const mapDashboardResponse = (data: any): DashboardSummary => {
  const emotionDistribution = (data?.emotion_distribution ?? []).map((slice: any) => ({
    emotion: String(slice?.emotion ?? '').toLowerCase(),
    count: Number(slice?.count ?? 0),
  }));

  const recentBiometrics = (data?.recent_biometrics ?? []).map((entry: any) => ({
    childId: String(entry?.child_id ?? ''),
    childName: entry?.child_name ?? undefined,
    timestamp: entry?.timestamp ?? '',
    heartRate: entry?.heart_rate ?? undefined,
    stressLevel: entry?.stress_level ?? undefined,
    faceCount: entry?.face_count ?? undefined,
    dominantEmotion: entry?.dominant_emotion ?? undefined,
    dominantConfidence: entry?.dominant_confidence ?? undefined,
  }));

  const upcomingSessions = (data?.upcoming_sessions ?? []).map((session: any) => ({
    id: String(session?.id ?? ''),
    childId: String(session?.child_id ?? ''),
    childName: session?.child_name ?? undefined,
    startTime: session?.start_time ?? '',
    status: session?.status ?? 'scheduled',
  }));

  const alerts = (data?.alerts ?? []).map((alert: any) => ({
    id: String(alert?.id ?? ''),
    childId: String(alert?.child_id ?? ''),
    childName: alert?.child_name ?? undefined,
    type: alert?.type ?? '',
    severity: alert?.severity ?? 'low',
    message: alert?.message ?? '',
    timestamp: alert?.timestamp ?? '',
    resolved: Boolean(alert?.resolved),
  }));

  const stressSource = data?.stress_distribution ?? {};
  const stressDistribution: Record<string, number> = {};
  Object.entries(stressSource).forEach(([key, value]) => {
    stressDistribution[key] = Number(value ?? 0);
  });

  return {
    totalPatients: Number(data?.total_patients ?? 0),
    sessionsToday: Number(data?.sessions_today ?? 0),
    unresolvedAlerts: Number(data?.unresolved_alerts ?? 0),
    averageHeartRate:
      data?.average_heart_rate === null || data?.average_heart_rate === undefined
        ? null
        : Number(data?.average_heart_rate),
    stressDistribution,
    emotionDistribution,
    recentBiometrics,
    upcomingSessions,
    alerts,
  };
};

export const useDashboardStore = create<DashboardState>((set) => ({
  metrics: null,
  loading: false,
  error: null,

  fetchDashboard: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<DashboardSummary>('/psychologists/dashboard');
      set({
        metrics: mapDashboardResponse(response),
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error:
          error instanceof Error ? error.message : 'No se pudo cargar la información del dashboard.',
      });
    }
  },
}));
