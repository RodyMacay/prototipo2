import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Brain, 
  Heart, 
  Activity, 
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PatientDetailProps {
  patient: any;
  onBack: () => void;
}

export const PatientDetail: React.FC<PatientDetailProps> = ({ patient, onBack }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const generatePDF = async () => {
    setIsGeneratingPdf(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const logoY = 20;
      
      // Header
      pdf.setFontSize(24);
      pdf.setTextColor(51, 65, 85);
      pdf.text('LUMINOVA', 20, logoY);
      
      pdf.setFontSize(12);
      pdf.setTextColor(100, 116, 139);
      pdf.text('Análisis Profesional TEA - Reporte Clínico', 20, logoY + 10);
      
      // Patient Info
      pdf.setFontSize(16);
      pdf.setTextColor(51, 65, 85);
      pdf.text('Información del Paciente', 20, 50);
      
      pdf.setFontSize(11);
      pdf.text(`Nombre: ${patient.name}`, 20, 60);
      pdf.text(`Edad: ${patient.age} años`, 20, 67);
      pdf.text(`Diagnóstico: ${patient.diagnosis}`, 20, 74);
      pdf.text(`Fecha del reporte: ${new Date().toLocaleDateString('es-ES')}`, 20, 81);
      
      // Progress Analysis
      pdf.setFontSize(16);
      pdf.setTextColor(51, 65, 85);
      pdf.text('Análisis de Progreso', 20, 100);
      
      pdf.setFontSize(11);
      pdf.text(`Progreso general: ${patient.progress}%`, 20, 110);
      
      const progressAreas = [
        { area: 'Comunicación Social', score: 85, recommendation: 'Continuar con ejercicios de interacción social estructurada' },
        { area: 'Comportamientos Repetitivos', score: 70, recommendation: 'Implementar estrategias de redirección conductual' },
        { area: 'Procesamiento Sensorial', score: 78, recommendation: 'Mantener terapia de integración sensorial' },
        { area: 'Habilidades Adaptativas', score: 88, recommendation: 'Reforzar autonomía en actividades de vida diaria' }
      ];
      
      let yPos = 120;
      progressAreas.forEach((area) => {
        pdf.setFontSize(12);
        pdf.setTextColor(51, 65, 85);
        pdf.text(`${area.area}: ${area.score}%`, 25, yPos);
        
        pdf.setFontSize(10);
        pdf.setTextColor(100, 116, 139);
        const lines = pdf.splitTextToSize(`Recomendación: ${area.recommendation}`, 160);
        pdf.text(lines, 25, yPos + 7);
        
        yPos += 20;
      });
      
      // Biometric Analysis
      pdf.setFontSize(16);
      pdf.setTextColor(51, 65, 85);
      pdf.text('Análisis Biométrico', 20, yPos + 10);
      
      yPos += 20;
      pdf.setFontSize(11);
      pdf.text(`Frecuencia cardíaca promedio: ${patient.heartRate} BPM`, 20, yPos);
      pdf.text(`Nivel de estrés: Bajo-Moderado`, 20, yPos + 7);
      pdf.text(`Patrón de actividad: Regular`, 20, yPos + 14);
      
      // Recommendations
      yPos += 30;
      pdf.setFontSize(16);
      pdf.setTextColor(51, 65, 85);
      pdf.text('Recomendaciones Profesionales', 20, yPos);
      
      const recommendations = [
        '• Continuar con sesiones de terapia conductual 3 veces por semana',
        '• Implementar programa de habilidades sociales en grupo pequeño',
        '• Mantener rutinas estructuradas con apoyos visuales',
        '• Evaluación nutricional para optimizar función cognitiva',
        '• Seguimiento mensual del progreso biométrico'
      ];
      
      yPos += 10;
      pdf.setFontSize(11);
      recommendations.forEach((rec) => {
        const lines = pdf.splitTextToSize(rec, 170);
        pdf.text(lines, 20, yPos);
        yPos += lines.length * 5 + 2;
      });
      
      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text('Este reporte ha sido generado automáticamente por el sistema LUMINOVA', 20, 280);
      pdf.text('Para consultas profesionales, contacte con el equipo clínico', 20, 285);
      
      pdf.save(`Reporte_${patient.name.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const mockSessionHistory = [
    { date: '2024-01-15', duration: '45 min', focus: 'Comunicación social', progress: 'Mejoría notable' },
    { date: '2024-01-12', duration: '45 min', focus: 'Habilidades adaptativas', progress: 'Progreso estable' },
    { date: '2024-01-10', duration: '30 min', focus: 'Integración sensorial', progress: 'Avance significativo' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{patient.name}</h1>
            <p className="text-gray-600">{patient.age} años • {patient.diagnosis}</p>
          </div>
        </div>
        
        <Button 
          onClick={generatePDF}
          disabled={isGeneratingPdf}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          {isGeneratingPdf ? 'Generando...' : 'Descargar Reporte PDF'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <Card className="psych-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Progreso General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{patient.progress}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${patient.progress}%` }}
              />
            </div>
            <Badge variant="secondary">Mejorando</Badge>
          </CardContent>
        </Card>

        <Card className="psych-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Estado Biométrico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{patient.heartRate} <span className="text-lg">BPM</span></div>
            <p className="text-sm text-gray-600 mb-3">Frecuencia cardíaca</p>
            <Badge variant="secondary">Estable</Badge>
          </CardContent>
        </Card>

        <Card className="psych-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              Sesiones Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">12</div>
            <p className="text-sm text-gray-600 mb-3">Este mes</p>
            <Badge variant="outline">3/semana</Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analysis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analysis">Análisis TEA</TabsTrigger>
          <TabsTrigger value="sessions">Sesiones</TabsTrigger>
          <TabsTrigger value="biometrics">Biométricos</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { area: 'Comunicación Social', score: 85, trend: 'up' },
              { area: 'Comportamientos Repetitivos', score: 70, trend: 'stable' },
              { area: 'Procesamiento Sensorial', score: 78, trend: 'up' },
              { area: 'Habilidades Adaptativas', score: 88, trend: 'up' }
            ].map((area, index) => (
              <motion.div
                key={area.area}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="psych-card">
                  <CardHeader>
                    <CardTitle className="text-lg">{area.area}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold">{area.score}%</span>
                      <Badge variant={area.trend === 'up' ? 'default' : 'secondary'}>
                        {area.trend === 'up' ? '↗ Mejorando' : '→ Estable'}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${area.score}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card className="psych-card">
            <CardHeader>
              <CardTitle>Historial de Sesiones</CardTitle>
              <CardDescription>Registro detallado de sesiones terapéuticas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSessionHistory.map((session, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{session.date}</span>
                          <Badge variant="outline">{session.duration}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Enfoque: {session.focus}</p>
                        <p className="text-sm mt-1">{session.progress}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="biometrics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="psych-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Frecuencia Cardíaca
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patient.heartRate} BPM</div>
                <p className="text-sm text-gray-600">Promedio últimas 24h</p>
              </CardContent>
            </Card>
            
            <Card className="psych-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Nivel de Estrés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Bajo</div>
                <p className="text-sm text-gray-600">Estado actual</p>
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
                <div className="text-2xl font-bold">0</div>
                <p className="text-sm text-gray-600">Últimas 24h</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card className="psych-card">
            <CardHeader>
              <CardTitle>Generar Reportes</CardTitle>
              <CardDescription>Crea reportes profesionales detallados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={generatePDF}
                  disabled={isGeneratingPdf}
                  className="h-20 flex-col bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <FileText className="w-6 h-6 mb-2" />
                  Reporte TEA Completo
                </Button>
                
                <Button variant="outline" className="h-20 flex-col">
                  <Heart className="w-6 h-6 mb-2" />
                  Análisis Biométrico
                </Button>
                
                <Button variant="outline" className="h-20 flex-col">
                  <Calendar className="w-6 h-6 mb-2" />
                  Historial Sesiones
                </Button>
                
                <Button variant="outline" className="h-20 flex-col">
                  <TrendingUp className="w-6 h-6 mb-2" />
                  Progreso Mensual
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};