import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useBiometricStore } from '@/store/biometricStore';
import { usePatientStore } from '@/store/patientStore';
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
  Timer
} from 'lucide-react';
import { Psychologist } from '@/types';
import { ActiveBreaksSystem } from './ActiveBreaksSystem';

export const PsychologistDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { patients } = usePatientStore();
  const { 
    realTimeData, 
    historicalData, 
    alerts, 
    isMonitoring, 
    startMonitoring, 
    stopMonitoring,
    generateMockData 
  } = useBiometricStore();
  const psychologist = user as Psychologist;

  // Generate mock data on component mount
  useEffect(() => {
    generateMockData();
  }, [generateMockData]);

  // Chart data for heart rate trends
  const heartRateData = historicalData.slice(-20).map((d, index) => ({
    x: index + 1,
    y: d.heartRate
  }));

  // Emotion distribution chart
  const emotionData = [
    { label: 'Alegría', value: 35, color: '#FBBF24' },
    { label: 'Calma', value: 25, color: '#10B981' },
    { label: 'Tristeza', value: 15, color: '#3B82F6' },
    { label: 'Ansiedad', value: 15, color: '#8B5CF6' },
    { label: 'Enojo', value: 10, color: '#EF4444' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenido, {psychologist.name}
          </h1>
          <p className="text-gray-600 mt-1">
            Dashboard Profesional - {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => isMonitoring ? stopMonitoring() : startMonitoring('demo-child')}
            className={`${
              isMonitoring 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {isMonitoring ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Detener Monitoreo
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Iniciar Monitoreo
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="psych-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pacientes Activos</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patients.length}</div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +2 este mes
              </p>
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
              <CardTitle className="text-sm font-medium">Sesiones Hoy</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-blue-600 flex items-center mt-1">
                <Target className="w-3 h-3 mr-1" />
                2 completadas
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
              <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alerts.filter(a => !a.resolved).length}</div>
              <p className="text-xs text-red-600 flex items-center mt-1">
                <Heart className="w-3 h-3 mr-1" />
                Monitoreo activo
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className={`psych-card ${isMonitoring ? 'ring-2 ring-green-500' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado Sistema</CardTitle>
              <Activity className={`h-4 w-4 ${isMonitoring ? 'text-green-600' : 'text-gray-400'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isMonitoring ? 'ACTIVO' : 'INACTIVO'}
              </div>
              <p className={`text-xs flex items-center mt-1 ${
                isMonitoring ? 'text-green-600' : 'text-gray-500'
              }`}>
                <Brain className="w-3 h-3 mr-1" />
                {isMonitoring ? 'Monitoreando' : 'Standby'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Biometric Monitor */}
        <div className="lg:col-span-2">
          <Card className="psych-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Monitor Biométrico en Tiempo Real
              </CardTitle>
              <CardDescription>
                Frecuencia cardíaca y tendencias de los últimos 20 minutos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {historicalData.length > 0 ? (
                  <LineChart
                    data={heartRateData}
                    color="#EF4444"
                    xLabel="Tiempo (min)"
                    yLabel="BPM"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Inicia el monitoreo para ver datos en tiempo real</p>
                    </div>
                  </div>
                )}
              </div>
              
              {realTimeData && (
                <div className="flex justify-between items-center mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">BPM Actual</p>
                      <p className="text-2xl font-bold text-red-600">{realTimeData.heartRate}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Estrés</p>
                      <Badge className={`${
                        realTimeData.stressLevel === 'low' ? 'bg-green-100 text-green-800' :
                        realTimeData.stressLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {realTimeData.stressLevel}
                      </Badge>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Actividad</p>
                      <p className="text-sm font-medium capitalize">{realTimeData.activity}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Patients */}
        <div>
          <Card className="psych-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Pacientes en Sesión
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {patients.map((patient, index) => (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{patient.name}</p>
                    <p className="text-sm text-gray-600">{patient.age} años</p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={
                        patient.status === 'active' ? 'default' :
                        patient.status === 'session' ? 'secondary' : 'outline'
                      }
                      className="mb-1"
                    >
                      {patient.status}
                    </Badge>
                    <p className="text-xs text-gray-500">{patient.heartRate} BPM</p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Row - Emotion Analysis & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emotion Distribution */}
        <Card className="psych-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Distribución Emocional Semanal
            </CardTitle>
            <CardDescription>
              Análisis de estados emocionales de todos los pacientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <DoughnutChart
                data={emotionData}
                showLegend={true}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="psych-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Alertas Recientes
              </CardTitle>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.slice(0, 5).map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-lg border-l-4 ${
                  alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                  alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                  alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{alert.message}</p>
                    <p className="text-xs text-gray-600">
                      {alert.timestamp.toLocaleTimeString('es-ES')}
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
            
            {alerts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay alertas activas</p>
                <p className="text-sm">El sistema está funcionando correctamente</p>
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
    </div>
  );
};