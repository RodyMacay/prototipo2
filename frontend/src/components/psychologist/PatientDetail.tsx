import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  Brain,
  Heart,
  Activity,
  Calendar,
  AlertCircle,
  Download,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { differenceInHours, differenceInMinutes, format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '@/services/api';
import {
  Patient,
  TherapySession,
  BiometricData,
  EmotionRecord,
  BiometricAlert,
} from '@/types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import type { TooltipProps } from 'recharts';

interface BackendTherapySession {
  id: string;
  child_id: string;
  psychologist_id: string;
  start_time: string;
  end_time?: string | null;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  objectives?: string[] | null;
  notes?: string | null;
}

interface BackendBiometricData {
  id: string;
  child_id: string;
  timestamp: string;
  heart_rate?: number | null;
  stress_level?: string | null;
  face_count?: number | null;
  dominant_emotion?: string | null;
  dominant_confidence?: number | null;
}

interface BackendEmotionRecord {
  id: string;
  child_id: string;
  emotion: string;
  intensity: number;
  timestamp: string;
  context?: string | null;
}

interface BackendBiometricAlert {
  id: string;
  child_id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

const mapSession = (session: BackendTherapySession): TherapySession => ({
  id: session.id,
  childId: session.child_id,
  psychologistId: session.psychologist_id,
  startTime: new Date(session.start_time),
  endTime: session.end_time ? new Date(session.end_time) : undefined,
  status: session.status,
  objectives: session.objectives ?? [],
  notes: session.notes ?? '',
  activities: [],
  biometricLogs: [],
  emotionLogs: [],
  pauseBreaks: [],
});

const mapBiometric = (item: BackendBiometricData): BiometricData => ({
  timestamp: new Date(item.timestamp),
  heartRate: item.heart_rate ?? undefined,
  stressLevel: (item.stress_level as BiometricData['stressLevel']) ?? undefined,
  faceCount: item.face_count ?? undefined,
  dominantEmotion: item.dominant_emotion ?? undefined,
  dominantConfidence: item.dominant_confidence ?? undefined,
});

const mapEmotion = (item: BackendEmotionRecord): EmotionRecord => ({
  emotion: item.emotion as EmotionRecord['emotion'],
  intensity: item.intensity,
  timestamp: new Date(item.timestamp),
  context: item.context ?? undefined,
});

const mapAlert = (item: BackendBiometricAlert): BiometricAlert => ({
  id: item.id,
  childId: item.child_id,
  type: item.type as BiometricAlert['type'],
  severity: item.severity,
  message: item.message,
  timestamp: new Date(item.timestamp),
  resolved: item.resolved,
});

const capitalize = (value?: string | null) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Sin datos';

const EMOTION_COLORS = [
  '#22c55e',
  '#3b82f6',
  '#f97316',
  '#a855f7',
  '#ef4444',
  '#14b8a6',
  '#f59e0b',
  '#0ea5e9',
];

const STRESS_LABELS: Record<string, string> = {
  low: 'Bajo',
  medium: 'Medio',
  high: 'Alto',
};

const formatStressLevel = (value?: BiometricData['stressLevel']) => {
  if (!value) return 'Sin datos';
  const normalized = value.toString().toLowerCase();
  return STRESS_LABELS[normalized] ?? capitalize(value);
};

const formatDominantEmotion = (emotion?: string, confidence?: number) => {
  const label = emotion ? capitalize(emotion) : 'Sin datos';
  const confidenceValue = confidence ?? 0;
  const rounded = Math.round(confidenceValue);
  return `${label} (${rounded}%)`;
};

const formatFullDateTime = (timestamp: Date) =>
  format(timestamp, "d 'de' MMMM yyyy HH:mm", { locale: es });

const EmotionTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0];
  const entry = (data.payload as { name: string; value: number }) ?? { name: '', value: 0 };

  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold capitalize text-gray-800">{entry.name}</p>
      <p className="text-gray-500">{entry.value} registro{entry.value === 1 ? '' : 's'}</p>
    </div>
  );
};

interface PatientDetailProps {
  patient: Patient;
  onBack: () => void;
}

export const PatientDetail: React.FC<PatientDetailProps> = ({ patient, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [biometrics, setBiometrics] = useState<BiometricData[]>([]);
  const [emotions, setEmotions] = useState<EmotionRecord[]>([]);
  const [alerts, setAlerts] = useState<BiometricAlert[]>([]);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      if (!patient.childProfileId) {
        setError('Este paciente aún no tiene un perfil biométrico asociado.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [sessionsRes, biometricsRes, emotionsRes, alertsRes] = await Promise.all([
          api.get<BackendTherapySession[]>(`/therapy-sessions/child/${patient.childProfileId}`),
          api.get<BackendBiometricData[]>(
            `/biometric-data/history?limit=60&child_id=${patient.childProfileId}`,
          ),
          api.get<BackendEmotionRecord[]>(
            `/emotion-records/history?limit=40&child_id=${patient.childProfileId}`,
          ),
          api.get<BackendBiometricAlert[]>(`/alerts?child_id=${patient.childProfileId}`),
        ]);
        console.log(biometricsRes)

        if (!active) return;

        setSessions(
          (sessionsRes ?? [])
            .map(mapSession)
            .sort((a, b) => b.startTime.getTime() - a.startTime.getTime()),
        );
        setBiometrics(
          (biometricsRes ?? [])
            .map(mapBiometric)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
        );
        setEmotions(
          (emotionsRes ?? [])
            .map(mapEmotion)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
        );
        setAlerts(
          (alertsRes ?? [])
            .map(mapAlert)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
        );
      } catch (err) {
        console.error('Error loading patient detail', err);
        if (active) {
          setError(
            err instanceof Error ? err.message : 'No se pudo cargar la información del paciente.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [patient.childProfileId, refreshKey]);

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((session) => session.status === 'completed').length;
  const progress = totalSessions ? Math.round((completedSessions / totalSessions) * 100) : 0;

  const activeSessions = sessions.filter((session) => session.status === 'active').length;
  const lastSession = sessions[0];

  const alertsLast24h = alerts.filter(
    (alert) => differenceInHours(new Date(), alert.timestamp) <= 24,
  ).length;
  const unresolvedAlerts = alerts.filter((alert) => !alert.resolved).length;

  const dominantEmotionEntry = useMemo(() => {
    const counts: Record<string, number> = {};
    emotions.forEach((record) => {
      const key = record.emotion.toLowerCase();
      counts[key] = (counts[key] ?? 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0] ?? [patient.currentEmotion.toLowerCase(), 0];
  }, [emotions, patient.currentEmotion]);

  const dominantEmotion = capitalize(dominantEmotionEntry[0]);
  const emotionSamples = emotions.length || dominantEmotionEntry[1];
  const emotionShare = emotionSamples
    ? Math.round((dominantEmotionEntry[1] / emotionSamples) * 100)
    : 0;

  const recentEmotions = emotions.slice(0, 5);
  const recentBiometrics = biometrics.slice(0, 6);
  const emotionDistributionData = useMemo(() => {
    if (!emotions.length) return [];
    const counts = emotions.reduce<Record<string, number>>((acc, record) => {
      const key = (record.emotion ?? 'sin datos').toLowerCase();
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([name, value], index) => ({
      name,
      value,
      color: EMOTION_COLORS[index % EMOTION_COLORS.length],
    }));
  }, [emotions]);
  const totalEmotionSamples = emotionDistributionData.reduce((acc, item) => acc + item.value, 0);

  const averageHeartRate = useMemo(() => {
    const values = biometrics
      .map((record) => record.heartRate)
      .filter((value): value is number => typeof value === 'number');
    return values.length
      ? Math.round(values.reduce((acc, value) => acc + value, 0) / values.length)
      : null;
  }, [biometrics]);

  const latestBiometric = recentBiometrics[0];
  const summaryHeartRate = latestBiometric?.heartRate ?? averageHeartRate ?? null;
  const averageFaceCount = recentBiometrics.length
    ? Math.round(
        recentBiometrics.reduce(
          (acc, record) => acc + (record.faceCount ?? 0),
          0,
        ) / recentBiometrics.length,
      )
    : 0;

  const generatePDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdf = new jsPDF();
      const today = new Date();

      pdf.setFontSize(16);
      pdf.text('Reporte de monitoreo', 14, 20);

      pdf.setFontSize(11);
      pdf.text(`Paciente: ${patient.name}`, 14, 32);
      pdf.text(`Edad: ${patient.age} años`, 14, 38);
      pdf.text(`Diagnóstico: ${diagnosisText}`, 14, 44);
      pdf.text(`Fecha: ${format(today, 'PPP', { locale: es })}`, 14, 50);

      pdf.setFontSize(13);
      pdf.text('Resumen', 14, 64);
      pdf.setFontSize(11);
      pdf.text(`• Progreso terapéutico: ${progress}%`, 14, 72);
      pdf.text(`• Emoción predominante: ${dominantEmotion} (${emotionShare}%)`, 14, 78);
      pdf.text(
        `• Frecuencia cardíaca promedio: ${
          averageHeartRate !== null ? `${averageHeartRate} BPM` : 'Sin datos'
        }`,
        14,
        84,
      );
      pdf.text(
        `• Alertas últimas 24h: ${alertsLast24h} (pendientes: ${unresolvedAlerts})`,
        14,
        90,
      );

      if (lastSession) {
        pdf.text(
          `Última sesión: ${format(lastSession.startTime, 'PPP p', { locale: es })}`,
          14,
          100,
        );
      }

      pdf.setFontSize(9);
      pdf.text(
        'Reporte generado automáticamente con datos agregados desde Luminova.',
        14,
        114,
      );

      pdf.save(
        `reporte_${patient.name.replace(/\\s+/g, '_')}_${format(today, 'yyyyMMdd')}.pdf`,
      );
    } catch (err) {
      console.error('Error generating PDF', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleRefresh = () => setRefreshKey((value) => value + 1);

  const diagnosisText = patient.diagnosis.length
    ? patient.diagnosis.join(', ')
    : 'Sin diagnóstico registrado';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{patient.name}</h1>
            <p className="text-gray-600">
              {patient.age} años • {diagnosisText}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={generatePDF}
            disabled={loading || isGeneratingPdf}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            {isGeneratingPdf ? 'Generando…' : 'Descargar PDF'}
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            Actualizar datos
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-600">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
          <p className="mt-3 text-sm">Cargando información del paciente…</p>
        </div>
      ) : error ? (
        <Card className="psych-card border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              No se pudo cargar la información
            </CardTitle>
            <CardDescription className="text-red-500">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRefresh}>Reintentar</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="psych-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Progreso terapéutico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{progress}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2 my-3">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  {completedSessions} de {totalSessions} sesiones completadas.
                </p>
              </CardContent>
            </Card>

            <Card className="psych-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  Estado emocional
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold capitalize">{dominantEmotion}</div>
                <Badge variant="secondary" className="mt-2">
                  {emotionShare}% de {emotionSamples} registros
                </Badge>
                <p className="text-sm text-gray-600 mt-2">
                  Última lectura:{' '}
                  {emotions[0]
                    ? format(emotions[0].timestamp, "PPP p", { locale: es })
                    : 'Sin registros'}
                </p>
              </CardContent>
            </Card>

            <Card className="psych-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  Alertas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{alertsLast24h}</div>
                <p className="text-sm text-gray-600">
                  En las últimas 24h • {unresolvedAlerts} sin resolver
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="summary" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">Resumen</TabsTrigger>
              <TabsTrigger value="sessions">Sesiones</TabsTrigger>
              <TabsTrigger value="biometrics">Biométricos</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="psych-card">
                <CardHeader>
                  <CardTitle>Distribución emocional</CardTitle>
                  <CardDescription>
                    Emociones registradas en las últimas mediciones.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {emotionDistributionData.length ? (
                    <div className="grid gap-6 md:grid-cols-[minmax(0,220px)_1fr] md:items-center">
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={emotionDistributionData}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={55}
                              outerRadius={85}
                              paddingAngle={3}
                              stroke="#ffffff"
                              strokeWidth={1}
                            >
                              {emotionDistributionData.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<EmotionTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-3">
                        {emotionDistributionData.map((entry) => {
                          const percentage = totalEmotionSamples
                            ? Math.round((entry.value / totalEmotionSamples) * 100)
                            : 0;
                          return (
                            <div key={entry.name} className="flex items-center gap-3">
                              <span
                                className="h-3 w-3 flex-shrink-0 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <div className="flex-1">
                                <p className="text-sm font-semibold capitalize text-gray-800">
                                  {entry.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {percentage}% · {entry.value} registro{entry.value === 1 ? '' : 's'}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Aún no se registran emociones para este paciente.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="psych-card">
                <CardHeader>
                  <CardTitle>Emociones recientes</CardTitle>
                  <CardDescription>Últimos registros capturados.</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentEmotions.length ? (
                    <div className="space-y-3">
                      {recentEmotions.map((record) => (
                        <div key={record.timestamp.getTime()} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between text-sm">
                            <Badge variant="outline" className="capitalize">
                              {record.emotion}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {format(record.timestamp, "PPP p", { locale: es })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            Intensidad: {Math.round(record.intensity)}%
                          </p>
                          {record.context && (
                            <p className="text-xs text-gray-500 mt-1">Contexto: {record.context}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No hay registros emocionales recientes para mostrar.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sessions">
              <Card className="psych-card">
                <CardHeader>
                  <CardTitle>Sesiones terapéuticas</CardTitle>
                  <CardDescription>
                    Registro de sesiones programadas con duración y estado.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sessions.length ? (
                    <div className="space-y-4">
                      {sessions.map((session) => {
                        const duration =
                          session.endTime &&
                          Math.max(1, differenceInMinutes(session.endTime, session.startTime));
                        return (
                          <div key={session.id} className="border rounded-lg p-4">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span>{format(session.startTime, "PPP p", { locale: es })}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="capitalize">
                                  {session.status}
                                </Badge>
                                {duration && <Badge variant="outline">{duration} min</Badge>}
                              </div>
                            </div>
                            {session.notes && (
                              <p className="text-sm text-gray-600 mt-2">{session.notes}</p>
                            )}
                            {session.objectives.length > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                Objetivos: {session.objectives.join(', ')}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Aún no se han registrado sesiones para este paciente.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="biometrics">
              <Card className="psych-card">
                <CardHeader>
                  <CardTitle>Biometría reciente</CardTitle>
                  <CardDescription>
                    Resumen de las últimas capturas agregadas por el sistema.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentBiometrics.length ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-4 py-3">
                          <p className="text-xs uppercase tracking-wide text-emerald-600">
                            Frecuencia cardíaca
                          </p>
                          <p className="text-2xl font-semibold text-emerald-700">
                            {summaryHeartRate !== null ? `${summaryHeartRate} BPM` : '--'}
                          </p>
                          <p className="text-xs text-emerald-600/80 mt-1">
                            Última captura registrada
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-200 px-4 py-3">
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Mediciones almacenadas
                          </p>
                          <p className="text-2xl font-semibold text-slate-900">{biometrics.length}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Registros disponibles para este paciente
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-200 px-4 py-3">
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Caras detectadas
                          </p>
                          <p className="text-2xl font-semibold text-slate-900">{averageFaceCount}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Promedio de las últimas mediciones
                          </p>
                        </div>
                      </div>

                      {latestBiometric && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-4">
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-500">
                                Última captura registrada
                              </p>
                              <p className="text-sm font-semibold text-slate-900">
                                {formatFullDateTime(latestBiometric.timestamp)}
                              </p>
                            </div>
                            <Badge variant="secondary" className="capitalize">
                              {formatDominantEmotion(
                                latestBiometric.dominantEmotion,
                                latestBiometric.dominantConfidence,
                              )}
                            </Badge>
                          </div>
                          <div className="mt-3 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-500">
                                Frecuencia cardíaca
                              </p>
                              <p className="text-base font-semibold">
                                {latestBiometric.heartRate ?? '--'} BPM
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-500">
                                Estrés estimado
                              </p>
                              <p className="text-base font-semibold">
                                {formatStressLevel(latestBiometric.stressLevel)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-500">
                                Caras detectadas
                              </p>
                              <p className="text-base font-semibold">
                                {latestBiometric.faceCount ?? 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        {recentBiometrics.map((record) => (
                          <div
                            key={record.timestamp.getTime()}
                            className="rounded-lg border border-slate-200 px-4 py-3"
                          >
                            <p className="text-sm font-semibold text-slate-800">
                              {formatFullDateTime(record.timestamp)}
                            </p>
                            <p className="text-xs text-slate-600 mt-1">
                              Emoción dominante:{' '}
                              <span className="font-semibold text-emerald-600">
                                {formatDominantEmotion(record.dominantEmotion, record.dominantConfidence)}
                              </span>
                            </p>
                            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                              <span>FC: {record.heartRate ?? '--'} BPM</span>
                              <span>Estrés: {formatStressLevel(record.stressLevel)}</span>
                              <span>Caras: {record.faceCount ?? 0}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No hay mediciones biométricas registradas todavía.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};
