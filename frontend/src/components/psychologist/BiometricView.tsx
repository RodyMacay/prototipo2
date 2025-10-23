import React from 'react';
import { motion } from 'framer-motion';
import { useBiometricStore } from '@/store/biometricStore';
import { CameraAnalysis } from './CameraAnalysis';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  Download
} from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const BiometricView: React.FC = () => {
  const { 
    realTimeData, 
    historicalData, 
    alerts, 
    isMonitoring, 
    startMonitoring, 
    stopMonitoring 
  } = useBiometricStore();

  // Mock microexpression data
  const microexpressionMetrics = {
    facialExpressions: 12,
    emotionIntensity: 7.5,
    recognitionAccuracy: 94,
    processingTime: 0.3,
    dominantEmotion: 'neutral'
  };

  const microexpressionData = {
    labels: historicalData.slice(-30).map((_, index) => `${index + 1}min`),
    datasets: [
      {
        label: 'Intensidad Emocional',
        data: historicalData.slice(-30).map(d => Math.random() * 10), // Mock data for now
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Análisis de Microexpresiones</h1>
          <p className="text-gray-600 mt-1">
            Seguimiento en tiempo real de expresiones faciales y emociones
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar Datos
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
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

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className={`psych-card ${isMonitoring ? 'ring-2 ring-blue-500' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-500" />
                Expresiones Detectadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {microexpressionMetrics.facialExpressions}
                <span className="text-sm font-normal text-gray-500 ml-1">/min</span>
              </div>
              {isMonitoring && (
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  En tiempo real
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="psych-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-500" />
                Intensidad Emocional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {microexpressionMetrics.emotionIntensity}
                <span className="text-sm font-normal text-gray-500 ml-1">/10</span>
              </div>
              <Badge variant="secondary" className="text-xs mt-1">
                Moderada
              </Badge>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="psych-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-green-500" />
                Precisión de Reconocimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {microexpressionMetrics.recognitionAccuracy}
                <span className="text-sm font-normal text-gray-500 ml-1">%</span>
              </div>
              <Badge variant="secondary" className="text-xs mt-1">
                Excelente
              </Badge>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="psych-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-orange-500" />
                Emoción Dominante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold capitalize">
                {microexpressionMetrics.dominantEmotion}
              </div>
              <Badge variant="outline" className="text-xs mt-1">
                {microexpressionMetrics.processingTime}s procesamiento
              </Badge>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Camera Analysis */}
      <CameraAnalysis />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="psych-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-500" />
              Tendencia Emocional (30 min)
            </CardTitle>
            <CardDescription>
              Monitoreo continuo de intensidad emocional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {historicalData.length > 0 ? (
                <Line
                  data={microexpressionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: false,
                        min: 0,
                        max: 10,
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
            </div>
          </CardContent>
        </Card>

        <Card className="psych-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-500" />
              Distribución de Emociones
            </CardTitle>
            <CardDescription>
              Frecuencia de emociones detectadas en la sesión
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {historicalData.length > 0 ? (
                <div className="space-y-4">
                  {[
                    { emotion: 'Felicidad', count: 15, color: 'bg-yellow-400' },
                    { emotion: 'Tristeza', count: 8, color: 'bg-blue-400' },
                    { emotion: 'Ira', count: 5, color: 'bg-red-400' },
                    { emotion: 'Miedo', count: 3, color: 'bg-purple-400' },
                    { emotion: 'Sorpresa', count: 7, color: 'bg-green-400' },
                    { emotion: 'Neutral', count: 22, color: 'bg-gray-400' }
                  ].map((item) => (
                    <div key={item.emotion} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.emotion}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${item.color}`}
                            style={{ width: `${(item.count / 60) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 w-6">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Datos insuficientes para análisis</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card className="psych-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Alertas Emocionales
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.slice(0, 3).map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg border-l-4 ${
                    alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                    alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                    'border-yellow-500 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{alert.message}</p>
                      <p className="text-xs text-gray-600">
                        {alert.timestamp.toLocaleString('es-ES')}
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
              <p>No hay alertas emocionales activas</p>
              <p className="text-sm">Las expresiones faciales están dentro de rangos normales</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};