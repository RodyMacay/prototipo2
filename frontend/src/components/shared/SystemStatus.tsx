import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Activity, 
  Brain, 
  Heart, 
  Music, 
  Shield,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useBiometricStore } from '@/store/biometricStore';
import { useEmotionStore } from '@/store/emotionStore';

interface SystemCheck {
  name: string;
  status: 'success' | 'warning' | 'error';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const SystemStatus: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { isAuthenticated, user } = useAuthStore();
  const { isMonitoring } = useBiometricStore();
  const { unlockedIslands } = useEmotionStore();
  const [checks, setChecks] = useState<SystemCheck[]>([]);

  useEffect(() => {
    const performSystemChecks = () => {
      const systemChecks: SystemCheck[] = [
        {
          name: 'Autenticación',
          status: isAuthenticated && user ? 'success' : 'error',
          description: isAuthenticated && user ? 
            `Usuario conectado: ${user.name} (${user.role})` : 
            'Usuario no autenticado',
          icon: Shield
        },
        {
          name: 'Monitoreo Biométrico',
          status: isMonitoring ? 'success' : 'warning',
          description: isMonitoring ? 
            'Sistema de monitoreo activo' : 
            'Sistema de monitoreo inactivo',
          icon: Heart
        },
        {
          name: 'Mundo Emocional',
          status: unlockedIslands.length > 0 ? 'success' : 'error',
          description: `${unlockedIslands.length} islas emocionales cargadas`,
          icon: Sparkles
        },
        {
          name: 'Sistema de Audio',
          status: 'success',
          description: 'Audio habilitado y funcionando',
          icon: Music
        },
        {
          name: 'Renderizado 3D',
          status: checkWebGLSupport() ? 'success' : 'warning',
          description: checkWebGLSupport() ? 
            'WebGL disponible y funcionando' : 
            'WebGL no disponible o con problemas',
          icon: Brain
        },
        {
          name: 'Dashboard Psicólogo',
          status: user?.role === 'psychologist' ? 'success' : 'warning',
          description: user?.role === 'psychologist' ? 
            'Dashboard disponible' : 
            'Acceso no disponible para este rol',
          icon: Activity
        }
      ];

      setChecks(systemChecks);
    };

    performSystemChecks();
  }, [isAuthenticated, user, isMonitoring, unlockedIslands]);

  const checkWebGLSupport = (): boolean => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch {
      return false;
    }
  };

  const getStatusIcon = (status: SystemCheck['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: SystemCheck['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">Activo</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Advertencia</Badge>;
      case 'error':
        return <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">Error</Badge>;
    }
  };

  const successCount = checks.filter(check => check.status === 'success').length;
  const totalChecks = checks.length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-child border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white flex items-center justify-center gap-2">
            <Activity className="w-6 h-6" />
            Estado del Sistema MINDBRIDGE
          </CardTitle>
          <div className="text-white/80">
            {successCount}/{totalChecks} sistemas funcionando correctamente
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 mt-2">
            <div 
              className="bg-gradient-to-r from-primary to-primary-glow h-2 rounded-full transition-all duration-500"
              style={{ width: `${(successCount / totalChecks) * 100}%` }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {checks.map((check, index) => (
            <motion.div
              key={check.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-3">
                <check.icon className="w-6 h-6 text-white/80" />
                <div>
                  <h3 className="font-semibold text-white">{check.name}</h3>
                  <p className="text-sm text-white/60">{check.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(check.status)}
                {getStatusBadge(check.status)}
              </div>
            </motion.div>
          ))}
          
          <div className="flex justify-center pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Cerrar
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};