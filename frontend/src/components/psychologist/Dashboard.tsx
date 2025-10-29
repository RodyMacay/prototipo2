import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthStore } from '@/store/authStore';
import { useBiometricStore } from '@/store/biometricStore';
import { usePatientStore } from '@/store/patientStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart } from '../charts/LineChart';
import { DoughnutChart } from '../charts/DoughnutChart';
import {
  Activity,
  Heart,
  Users,
  TrendingUp,
  AlertTriangle,
  Play,
  Pause,
  Settings,
  Brain,
  Clock,
  Target,
} from 'lucide-react';
import { Psychologist } from '@/types';
import { ActiveBreaksSystem } from './ActiveBreaksSystem';

const capitalize = (value: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

const emotionColors: Record<string, string> = {
  happy: '#FACC15',
  joy: '#FBBF24',
  sadness: '#3B82F6',
  sad: '#2563EB',
  anger: '#EF4444',
  angry: '#DC2626',
  fear: '#8B5CF6',
  disgust: '#0EA5E9',
  surprise: '#F97316',
  neutral: '#14B8A6',
};

const severityStyles: Record<string, string> = {
  critical: 'border-red-500 bg-red-50',
  high: 'border-orange-500 bg-orange-50',
  medium: 'border-yellow-500 bg-yellow-50',
  low: 'border-blue-500 bg-blue-50',
};

export const PsychologistDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { patients, fetchPatients } = usePatientStore();
  const { metrics, loading: dashboardLoading, error: dashboardError, fetchDashboard } =
    useDashboardStore();
  const {
    realTimeData,
    historicalData,
    emotionHistory,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
  } = useBiometricStore();
  const psychologist = user as Psychologist;
  const defaultChildId = patients[0]?.childProfileId || patients[0]?.id || '';

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (patients.length > 0) {
      fetchDashboard();
    }
  }, [patients.length, fetchDashboard]);

  useEffect(() => {
    if (isMonitoring || patients.length === 0) return;

    const targetChildId = patients[0].childProfileId || patients[0].id;
    if (targetChildId) {
      void startMonitoring(targetChildId);
    }
  }, [isMonitoring, patients, startMonitoring]);

  const heartRateData = useMemo(() => {
    if (historicalData.length > 0) {
      return historicalData.slice(-20).map((record, index) => ({
        x: index + 1,
        y: record.heartRate ?? 0,
      }));
    }
    if (metrics?.recentBiometrics?.length) {
      const reversed = [...metrics.recentBiometrics].reverse();
      return reversed.map((entry, index) => ({
        x: index + 1,
        y: entry.heartRate ?? 0,
      }));
    }
    return [];
  }, [historicalData, metrics?.recentBiometrics]);

  const emotionData = useMemo(() => {
    if (metrics?.emotionDistribution?.length) {
      return metrics.emotionDistribution.map((slice) => ({
        label: capitalize(slice.emotion),
        value: slice.count,
        color: emotionColors[slice.emotion] || undefined,
      }));
    }
    if (emotionHistory.length) {
      const counts = emotionHistory.reduce<Record<string, number>>((acc, record) => {
        const key = record.emotion.toLowerCase();
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {});
      return Object.entries(counts).map(([emotion, count]) => ({
        label: capitalize(emotion),
        value: count,
        color: emotionColors[emotion] || undefined,
      }));
    }
    return [];
  }, [metrics?.emotionDistribution, emotionHistory]);

  const stressSummary = useMemo(() => {
    if (!metrics) return 'Sin datos';
    const entries = Object.entries(metrics.stressDistribution || {}).filter(([, value]) => value > 0);
    if (!entries.length) return 'Sin datos';
    return entries.map(([level, count]) => `${capitalize(level)} ${count}`).join(' · ');
  }, [metrics]);

  const upcomingSessions = metrics?.upcomingSessions ?? [];
  const recentBiometrics = metrics?.recentBiometrics ?? [];
  const nextSession = upcomingSessions[0];
  const recentAlerts = metrics?.alerts ?? [];

  const displayHeartRate =
    realTimeData?.heartRate ?? recentBiometrics[0]?.heartRate ?? undefined;
  const displayStressLevel =
    realTimeData?.stressLevel ?? recentBiometrics[0]?.stressLevel ?? undefined;
  const displayActivity = realTimeData?.activity;

  const monitoringButtonDisabled = !defaultChildId && !isMonitoring;

  return (
    <div className="space-y-6">
      {dashboardError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {dashboardError}
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenido, {psychologist.name}
          </h1>
          <p className="text-gray-600 mt-1">
            Dashboard Profesional —{' '}
            {format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              if (isMonitoring) {
                stopMonitoring();
              } else if (defaultChildId) {
                void startMonitoring(defaultChildId);
              }
            }}
            className={`${
              isMonitoring ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            } text-white`}
            disabled={monitoringButtonDisabled}
          >
            {isMonitoring ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Detener monitoreo
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Iniciar monitoreo
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="psych-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pacientes activos</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.totalPatients ?? patients.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Asignados a tu perfil</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="psych-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sesiones hoy</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.sessionsToday ?? 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                {nextSession
                  ? `Próxima: ${format(new Date(nextSession.startTime), 'p', { locale: es })}`
                  : 'Sin sesiones agendadas'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="psych-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas activas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.unresolvedAlerts ?? 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                {recentAlerts.length
                  ? `${recentAlerts.length} registradas recientemente`
                  : 'Sin alertas registradas'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="psych-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio cardíaco</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.averageHeartRate != null
                  ? `${Math.round(metrics.averageHeartRate)} BPM`
                  : '--'}
              </div>
              <p className="text-xs text-gray-500 mt-1">{stressSummary}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Real-time Biometric Monitor */}
        <div className="lg:col-span-2">
          <Card className="psych-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Monitor biométrico en tiempo real
              </CardTitle>
              <CardDescription>
                Frecuencia cardíaca y tendencias recientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {heartRateData.length ? (
                  <LineChart
                    data={heartRateData}
                    color="#EF4444"
                    xLabel="Tiempo (orden cronológico)"
                    yLabel="BPM"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-gray-500">
                    <Activity className="w-12 h-12 mb-2 opacity-50" />
                    <p>Inicia el monitoreo para visualizar la actividad cardiaca</p>
                  </div>
                )}
              </div>

              {(displayHeartRate != null || displayStressLevel) && (
                <div className="mt-4 flex flex-col gap-4 rounded-lg bg-blue-50 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">BPM actual</p>
                      <p className="text-2xl font-bold text-red-600">
                        {displayHeartRate ?? '--'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Estrés</p>
                      <Badge
                        className={`${
                          displayStressLevel === 'low'
                            ? 'bg-green-100 text-green-800'
                            : displayStressLevel === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : displayStressLevel === 'high'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {displayStressLevel ? capitalize(displayStressLevel) : 'Sin datos'}
                      </Badge>
                    </div>
                  </div>
                  {displayActivity && (
                    <div className="text-center md:text-right">
                      <p className="text-sm text-gray-600">Actividad</p>
                      <p className="text-sm font-medium capitalize text-gray-800">
                        {displayActivity}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Sessions */}
        <div>
          <Card className="psych-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Próximas sesiones
              </CardTitle>
              <CardDescription>Agenda inmediata de tus pacientes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {upcomingSessions.length ? (
                upcomingSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {session.childName ?? 'Paciente sin nombre'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(session.startTime), 'PPP p', { locale: es })}
                      </p>
                    </div>
                    <Badge
                      variant={
                        session.status === 'completed'
                          ? 'secondary'
                          : session.status === 'cancelled'
                          ? 'destructive'
                          : 'outline'
                      }
                    >
                      {capitalize(session.status)}
                    </Badge>
                  </motion.div>
                ))
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <p>No hay sesiones agendadas en los próximos días.</p>
                  <p className="text-sm">Programa una nueva terapia para tus pacientes.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Row - Emotion Analysis & Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Emotion Distribution */}
        <Card className="psych-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Distribución emocional semanal
            </CardTitle>
            <CardDescription>
              Análisis de los estados emocionales registrados recientemente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emotionData.length ? (
              <div className="h-64">
                <DoughnutChart data={emotionData} showLegend />
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-center text-sm text-gray-500">
                Aún no se registran suficientes datos emocionales.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="psych-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Alertas recientes
              </CardTitle>
              <CardDescription>Últimos eventos detectados por el sistema</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAlerts.length ? (
              recentAlerts.slice(0, 6).map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className={`rounded-lg border-l-4 p-3 ${
                    severityStyles[alert.severity] ?? 'border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{alert.message}</p>
                      <p className="text-xs text-gray-600">
                        {alert.childName ?? 'Paciente sin nombre'} ·{' '}
                        {format(new Date(alert.timestamp), "d MMM '·' p", { locale: es })}
                      </p>
                    </div>
                    <Badge
                      variant={alert.resolved ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {alert.resolved ? 'Resuelto' : alert.severity.toUpperCase()}
                    </Badge>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-8 text-center text-gray-500">
                <AlertTriangle className="mx-auto mb-2 h-12 w-12 opacity-50" />
                <p>No hay alertas activas.</p>
                <p className="text-sm">El sistema está funcionando correctamente.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Breaks System */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <ActiveBreaksSystem />
      </motion.div>

      {dashboardLoading && (
        <div className="text-xs text-gray-500">Actualizando métricas del dashboard…</div>
      )}
    </div>
  );
};
