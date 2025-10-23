import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Play, Pause, User, Calendar, Activity } from 'lucide-react';

export const SessionsView: React.FC = () => {
  const activeSessions = [
    {
      id: '1',
      patient: 'Sofia González',
      startTime: new Date(Date.now() - 1800000), // 30 min ago
      duration: 30,
      type: 'Terapia Emocional',
      status: 'active',
      heartRate: 92,
      emotionalState: 'anxiety'
    },
    {
      id: '2',
      patient: 'Lucas Martínez',
      startTime: new Date(Date.now() - 900000), // 15 min ago
      duration: 15,
      type: 'Juego Interactivo',
      status: 'paused',
      heartRate: 85,
      emotionalState: 'joy'
    }
  ];

  const upcomingSessions = [
    {
      id: '3',
      patient: 'Diego Rivera',
      scheduledTime: new Date(Date.now() + 3600000), // 1 hour from now
      duration: 45,
      type: 'Análisis TEA',
      status: 'scheduled'
    },
    {
      id: '4',
      patient: 'Ana López',
      scheduledTime: new Date(Date.now() + 7200000), // 2 hours from now
      duration: 30,
      type: 'Seguimiento',
      status: 'scheduled'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sesiones Activas</h1>
          <p className="text-gray-600 mt-1">
            Monitoreo en tiempo real de sesiones terapéuticas
          </p>
        </div>
        <Button>
          <Play className="w-4 h-4 mr-2" />
          Nueva Sesión
        </Button>
      </div>

      {/* Active Sessions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Sesiones en Curso</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeSessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className={`psych-card ${
                session.status === 'active' ? 'ring-2 ring-green-500' : 'ring-2 ring-yellow-500'
              }`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        {session.patient}
                      </CardTitle>
                      <CardDescription>{session.type}</CardDescription>
                    </div>
                    <Badge 
                      variant={session.status === 'active' ? 'default' : 'secondary'}
                      className={session.status === 'active' ? 'bg-green-600' : 'bg-yellow-600'}
                    >
                      {session.status === 'active' ? 'ACTIVA' : 'PAUSADA'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>Duración: {session.duration} min</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-red-500" />
                      <span>{session.heartRate} BPM</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Estado Emocional</span>
                    <Badge variant="outline" className="capitalize">
                      {session.emotionalState}
                    </Badge>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant={session.status === 'active' ? 'secondary' : 'default'}
                      className="flex-1"
                    >
                      {session.status === 'active' ? (
                        <>
                          <Pause className="w-4 h-4 mr-1" />
                          Pausar
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Reanudar
                        </>
                      )}
                    </Button>
                    <Button size="sm" variant="outline">
                      Detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Próximas Sesiones</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcomingSessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="psych-card">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{session.patient}</h3>
                      <p className="text-sm text-gray-600">{session.type}</p>
                      <div className="flex items-center space-x-2 mt-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{session.scheduledTime.toLocaleTimeString('es-ES', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</span>
                        <Clock className="w-4 h-4 ml-2" />
                        <span>{session.duration} min</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Preparar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};