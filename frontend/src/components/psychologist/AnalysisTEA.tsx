import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, FileText, Download } from 'lucide-react';
import { D3LineChart } from '@/components/charts/D3LineChart';
import { D3BarChart } from '@/components/charts/D3BarChart';
import { usePatientStore } from '@/store/patientStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const AnalysisTEAView: React.FC = () => {
  const { patients } = usePatientStore();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Mock analysis data
  const analysisResults = [
    {
      patientId: '1',
      patient: 'Lucas Martínez',
      date: '2024-01-15',
      score: 85,
      areas: {
        communication: 90,
        social: 80,
        behavioral: 85,
        sensory: 88
      },
      severity: 'Leve',
      recommendations: 3
    },
    {
      patientId: '2',
      patient: 'Sofia González',
      date: '2024-01-14',
      score: 72,
      areas: {
        communication: 70,
        social: 65,
        behavioral: 75,
        sensory: 78
      },
      severity: 'Moderado',
      recommendations: 5
    }
  ];

  const filteredAnalysisResults = analysisResults.filter(
    result => !selectedPatientId || result.patientId === selectedPatientId
  );

  const progressData = {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
    datasets: [
      {
        label: 'Comunicación',
        data: [65, 70, 75, 78, 82, 85],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
      },
      {
        label: 'Social',
        data: [60, 65, 68, 72, 75, 78],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
      },
      {
        label: 'Conductual',
        data: [70, 72, 75, 78, 80, 82],
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
      }
    ]
  };

  const comparisonData = {
    labels: ['Comunicación', 'Social', 'Conductual', 'Sensorial'],
    datasets: [
      {
        label: 'Lucas',
        data: [90, 80, 85, 88],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
      {
        label: 'Sofia',
        data: [70, 65, 75, 78],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Análisis TEA</h1>
          <p className="text-gray-600 mt-1">
            Evaluación y seguimiento del Trastorno del Espectro Autista
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            Nuevo Análisis
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtro por Paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={setSelectedPatientId} value={selectedPatientId || ''}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Seleccionar un paciente" />
            </SelectTrigger>
            <SelectContent>
              {patients.map(patient => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAnalysisResults.map((result, index) => (
          <motion.div
            key={result.patient}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="psych-card">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-600" />
                      {result.patient}
                    </CardTitle>
                    <CardDescription>Evaluación del {result.date}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">{result.score}</div>
                    <Badge 
                      variant={result.severity === 'Leve' ? 'secondary' : 'destructive'}
                      className="mt-1"
                    >
                      {result.severity}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {Object.entries(result.areas).map(([area, score]) => (
                    <div key={area}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium capitalize">{area}</span>
                        <span className="text-sm text-gray-600">{score}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            score >= 80 ? 'bg-green-500' : 
                            score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{result.recommendations} recomendaciones</span>
                  </div>
                  <Button size="sm" variant="outline">
                    Ver Detalles
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Progress Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="psych-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Progreso Temporal
            </CardTitle>
            <CardDescription>
              Evolución de habilidades a lo largo del tiempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex justify-center items-center">
              <D3LineChart data={progressData} />
            </div>
          </CardContent>
        </Card>

        <Card className="psych-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Comparación de Pacientes
            </CardTitle>
            <CardDescription>
              Análisis comparativo por áreas de desarrollo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex justify-center items-center">
              <D3BarChart data={comparisonData} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Insights */}
      <Card className="psych-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Insights y Recomendaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900">Fortalezas Identificadas</h3>
              <p className="text-sm text-blue-700 mt-1">
                Excelente progreso en comunicación verbal y comprensión de instrucciones
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-semibold text-yellow-900">Áreas de Mejora</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Necesita apoyo en habilidades sociales y regulación emocional
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900">Próximos Pasos</h3>
              <p className="text-sm text-green-700 mt-1">
                Implementar estrategias de juego cooperativo y mindfulness
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};