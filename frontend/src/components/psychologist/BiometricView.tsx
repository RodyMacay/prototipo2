import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useBiometricStore } from '@/store/biometricStore';
import { usePatientStore } from '@/store/patientStore';
import { CameraAnalysis } from './CameraAnalysis';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import {
  Eye,
  Brain,
  Play,
  Pause,
  Settings,
  AlertTriangle,
  TrendingUp,
  Download,
  Loader2,
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const formatTimeLabel = (date: Date) =>
  date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

export const BiometricView: React.FC = () => {
  const {
    realTimeData,
    historicalData,
    alerts,
    emotionHistory,
    isMonitoring,
    loading,
    startMonitoring,
    stopMonitoring,
  } = useBiometricStore();

  const patients = usePatientStore((state) => state.patients);
  const fetchPatients = usePatientStore((state) => state.fetchPatients);
  const patientsLoading = usePatientStore((state) => state.loading);

  const [selectedChildId, setSelectedChildId] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (selectedChildId) {
      return;
    }
    const candidate = patients.find((patient) => patient.childProfileId);
    if (candidate?.childProfileId) {
      setSelectedChildId(candidate.childProfileId);
    }
  }, [patients, selectedChildId]);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.childProfileId === selectedChildId),
    [patients, selectedChildId],
  );

  const dominantEmotion =
    realTimeData?.dominantEmotion ??
    realTimeData?.microexpression_data?.dominant_emotion ??
    'neutral';
  const dominantConfidence = Number(
    realTimeData?.dominantConfidence ??
      realTimeData?.microexpression_data?.dominant_confidence ??
      0,
  );
  const latestFaceCount = Number(
    realTimeData?.faceCount ??
      realTimeData?.microexpression_data?.face_count ??
      0,
  );
  const faceCount =
    historicalData.length > 0
      ? Math.round(
          historicalData.reduce((sum, record) => {
            const value =
              record.faceCount ??
              record.microexpression_data?.face_count ??
              0;
            return sum + value;
          }, 0) / historicalData.length,
        )
      : latestFaceCount;

  const chartData = useMemo(() => {
    if (historicalData.length === 0) {
      return null;
    }
    const recent = historicalData.slice(0, 30).reverse();
    return {
      labels: recent.map((record) => formatTimeLabel(record.timestamp)),
      datasets: [
        {
          label: 'Confianza dominante (%)',
          data: recent.map((record) => {
            const value =
              record.dominantConfidence ??
              record.microexpression_data?.dominant_confidence ??
              0;
            return typeof value === 'number' ? value : 0;
          }),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }, [historicalData]);

  const emotionDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    historicalData.forEach((record) => {
      const rawEmotion =
        record.dominantEmotion ?? record.microexpression_data?.dominant_emotion;
      const emotion =
        typeof rawEmotion === 'string'
          ? rawEmotion.toLowerCase()
          : rawEmotion
          ? String(rawEmotion).toLowerCase()
          : 'sin datos';
      counts[emotion] = (counts[emotion] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count);
  }, [historicalData]);

  const emotionChartData = useMemo(() => {
    if (emotionDistribution.length === 0) {
      return null;
    }

    const total = emotionDistribution.reduce((sum, entry) => sum + entry.count, 0);
    const labels = emotionDistribution.map((entry) =>
      entry.emotion.charAt(0).toUpperCase() + entry.emotion.slice(1),
    );
    const data = emotionDistribution.map((entry) =>
      total > 0 ? Math.round((entry.count / total) * 100) : 0,
    );
    const palette = [
      '#60a5fa',
      '#f97316',
      '#f472b6',
      '#34d399',
      '#fbbf24',
      '#a78bfa',
      '#fb7185',
    ];

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: labels.map((_, index) => palette[index % palette.length]),
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    };
  }, [emotionDistribution]);

  const emotionChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            boxWidth: 14,
            boxHeight: 14,
            padding: 12,
          },
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.parsed ?? 0;
              return `${label}: ${value}%`;
            },
          },
        },
      },
    }),
    [],
  );

  const recentEmotions = emotionHistory.slice(0, 5);

  const handleToggleMonitoring = async () => {
    if (isMonitoring) {
      stopMonitoring();
      return;
    }
    if (selectedChildId) {
      await startMonitoring(selectedChildId);
    }
  };

  const monitoringDisabled =
    (!selectedChildId && !isMonitoring) || loading || patientsLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analisis de Microexpresiones
          </h1>
          <p className="text-gray-600 mt-1">
            Seguimiento en tiempo real de expresiones faciales y emociones
          </p>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <Select
            value={selectedChildId}
            onValueChange={(value) => setSelectedChildId(value)}
            disabled={patientsLoading || patients.length === 0}
          >
            <SelectTrigger className="w-64">
              <SelectValue
                placeholder={
                  patientsLoading
                    ? 'Cargando pacientes...'
                    : 'Selecciona un paciente'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {patientsLoading && (
                <SelectItem value="loading" disabled>
                  Cargando...
                </SelectItem>
              )}
              {!patientsLoading && patients.length === 0 && (
                <SelectItem value="empty" disabled>
                  Registra un paciente para comenzar
                </SelectItem>
              )}
              {patients
                .filter((patient) => patient.childProfileId)
                .map((patient) => (
                  <SelectItem
                    key={patient.childProfileId}
                    value={patient.childProfileId!}
                  >
                    {patient.name} · {patient.age} años
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar Datos
            </Button>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Configurar
            </Button>
            <Button
              onClick={handleToggleMonitoring}
              disabled={monitoringDisabled}
              className={`${
                isMonitoring
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cargando...
                </>
              ) : isMonitoring ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Detener
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="psych-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Emocion dominante</p>
              <p className="text-3xl font-bold capitalize">{dominantEmotion}</p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {selectedPatient?.name ?? 'Sin paciente'}
            </Badge>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="psych-card p-6"
        >
          <p className="text-sm text-gray-500">Confianza dominante</p>
          <p className="text-3xl font-bold">
            {dominantConfidence.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            Actualizado en tiempo real
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="psych-card p-6"
        >
          <p className="text-sm text-gray-500">Caras detectadas</p>
          <p className="text-3xl font-bold">{faceCount}</p>
          <p className="text-xs text-gray-500 mt-1">
            Promedio por fotograma analizado
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="psych-card p-6"
        >
          <p className="text-sm text-gray-500">Registros capturados</p>
          <p className="text-3xl font-bold">{historicalData.length}</p>
          <p className="text-xs text-gray-500 mt-1">
            Historico conservado para el paciente
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CameraAnalysis childId={selectedChildId ?? null} />

        <Card className="psych-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              Evolucion de confianza
            </CardTitle>
            <CardDescription>
              Intensidad de la emocion dominante en los ultimos registros
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {chartData ? (
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                    },
                  },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Inicia el monitoreo para ver datos</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="psych-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-500" />
              Distribucion de emociones
            </CardTitle>
            <CardDescription>
              Frecuencia de emociones detectadas durante la sesion
            </CardDescription>
          </CardHeader>
        <CardContent>
          {emotionChartData ? (
            <div className="space-y-4">
              <div className="relative h-72">
                <Pie data={emotionChartData} options={emotionChartOptions} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                {emotionDistribution.map(({ emotion, count }) => (
                  <div key={emotion} className="flex items-center justify-between">
                    <span className="capitalize">{emotion}</span>
                    <span>{count} {count === 1 ? 'registro' : 'registros'}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <p>Sin datos suficientes para analizar</p>
            </div>
          )}
        </CardContent>
      </Card>

        <Card className="psych-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Alertas emocionales
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-3 rounded-lg border-l-4 ${
                      alert.severity === 'critical'
                        ? 'border-red-500 bg-red-50'
                        : alert.severity === 'high'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-yellow-500 bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{alert.message}</p>
                        <p className="text-xs text-gray-600">
                          {alert.timestamp.toLocaleString('es-PE')}
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
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay alertas activas</p>
                <p className="text-sm">
                  El analisis biometrico no detecta incidencias
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="psych-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-500" />
            Historial de emociones recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentEmotions.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {recentEmotions.map((record, index) => (
                <motion.div
                  key={`${record.timestamp.toISOString()}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg border text-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="capitalize">
                      {record.emotion}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {record.timestamp.toLocaleString('es-PE')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Intensidad: {record.intensity}%
                  </p>
                  {record.context && (
                    <p className="text-xs text-gray-500 mt-1">
                      Contexto: {record.context}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Aun no hay registros emocionales recientes para este paciente.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
