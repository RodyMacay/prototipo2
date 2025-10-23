import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Play, 
  Pause, 
  Timer, 
  RotateCcw, 
  Settings,
  Wind,
  Activity,
  Eye,
  Heart,
  Target,
  CheckCircle,
  AlertCircle,
  Zap,
  Clock
} from 'lucide-react';

interface ActiveBreak {
  id: string;
  name: string;
  type: 'breathing' | 'movement' | 'visual' | 'mindfulness';
  duration: number; // in seconds
  instructions: string[];
  icon: React.ReactNode;
  color: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const breakActivities: ActiveBreak[] = [
  {
    id: 'deep-breathing',
    name: 'Respiración Profunda',
    type: 'breathing',
    duration: 120,
    instructions: [
      'Siéntate cómodamente',
      'Inhala por 4 segundos',
      'Mantén por 4 segundos', 
      'Exhala por 6 segundos',
      'Repite el ciclo'
    ],
    icon: <Wind className="w-5 h-5" />,
    color: '#3B82F6',
    difficulty: 'easy'
  },
  {
    id: 'shoulder-rolls',
    name: 'Rotación de Hombros',
    type: 'movement',
    duration: 90,
    instructions: [
      'Siéntate derecho',
      'Levanta los hombros',
      'Rota hacia atrás 5 veces',
      'Rota hacia adelante 5 veces',
      'Relaja los hombros'
    ],
    icon: <Activity className="w-5 h-5" />,
    color: '#10B981',
    difficulty: 'easy'
  },
  {
    id: 'eye-exercise',
    name: 'Descanso Visual',
    type: 'visual',
    duration: 60,
    instructions: [
      'Mira un punto lejano',
      'Parpadea lentamente 10 veces',
      'Mueve los ojos en círculos',
      'Cierra los ojos por 10 segundos',
      'Abre y enfoca suavemente'
    ],
    icon: <Eye className="w-5 h-5" />,
    color: '#8B5CF6',
    difficulty: 'easy'
  },
  {
    id: 'heart-coherence',
    name: 'Coherencia Cardíaca',
    type: 'breathing',
    duration: 180,
    instructions: [
      'Pon una mano en el corazón',
      'Respira lenta y profundamente',
      'Inhala por 5 segundos',
      'Exhala por 5 segundos',
      'Siente los latidos del corazón'
    ],
    icon: <Heart className="w-5 h-5" />,
    color: '#EF4444',
    difficulty: 'medium'
  },
  {
    id: 'mindful-moment',
    name: 'Momento Consciente',
    type: 'mindfulness',
    duration: 150,
    instructions: [
      'Observa tu entorno',
      'Nombra 5 cosas que ves',
      '4 cosas que puedes tocar',
      '3 sonidos que escuchas',
      '2 olores que percibes',
      '1 sabor en tu boca'
    ],
    icon: <Target className="w-5 h-5" />,
    color: '#F59E0B',
    difficulty: 'medium'
  }
];

interface ActiveBreakConfig {
  enabled: boolean;
  interval: number; // minutes
  duration: number; // seconds
  preferredTypes: string[];
  autoStart: boolean;
}

export const ActiveBreaksSystem: React.FC = () => {
  const [config, setConfig] = useState<ActiveBreakConfig>({
    enabled: true,
    interval: 15,
    duration: 120,
    preferredTypes: ['breathing', 'movement'],
    autoStart: false
  });

  const [activeBreak, setActiveBreak] = useState<ActiveBreak | null>(null);
  const [breakTimer, setBreakTimer] = useState(0);
  const [nextBreakTimer, setNextBreakTimer] = useState(0);
  const [isBreakActive, setIsBreakActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedBreaks, setCompletedBreaks] = useState<string[]>([]);

  // Timer for next break
  useEffect(() => {
    if (config.enabled && !isBreakActive) {
      const interval = setInterval(() => {
        setNextBreakTimer(prev => {
          if (prev <= 1) {
            if (config.autoStart) {
              startRandomBreak();
            }
            return config.interval * 60; // Reset timer
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [config.enabled, config.interval, config.autoStart, isBreakActive]);

  // Timer for active break
  useEffect(() => {
    if (isBreakActive && activeBreak) {
      const interval = setInterval(() => {
        setBreakTimer(prev => {
          if (prev <= 1) {
            completeBreak();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isBreakActive, activeBreak]);

  // Step progression during break
  useEffect(() => {
    if (isBreakActive && activeBreak) {
      const stepDuration = activeBreak.duration / activeBreak.instructions.length;
      const currentStepIndex = Math.floor((activeBreak.duration - breakTimer) / stepDuration);
      setCurrentStep(Math.min(currentStepIndex, activeBreak.instructions.length - 1));
    }
  }, [breakTimer, activeBreak, isBreakActive]);

  const startBreak = (breakId: string) => {
    const selectedBreak = breakActivities.find(b => b.id === breakId);
    if (selectedBreak) {
      setActiveBreak(selectedBreak);
      setBreakTimer(selectedBreak.duration);
      setIsBreakActive(true);
      setCurrentStep(0);
      setNextBreakTimer(config.interval * 60);
    }
  };

  const startRandomBreak = () => {
    const availableBreaks = breakActivities.filter(b => 
      config.preferredTypes.length === 0 || config.preferredTypes.includes(b.type)
    );
    
    if (availableBreaks.length > 0) {
      const randomBreak = availableBreaks[Math.floor(Math.random() * availableBreaks.length)];
      startBreak(randomBreak.id);
    }
  };

  const completeBreak = () => {
    if (activeBreak) {
      setCompletedBreaks(prev => [...prev, activeBreak.id]);
    }
    setIsBreakActive(false);
    setActiveBreak(null);
    setBreakTimer(0);
    setCurrentStep(0);
  };

  const skipBreak = () => {
    setIsBreakActive(false);
    setActiveBreak(null);
    setBreakTimer(0);
    setCurrentStep(0);
    setNextBreakTimer(config.interval * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const nextBreakMinutes = Math.floor(nextBreakTimer / 60);
  const nextBreakSeconds = nextBreakTimer % 60;

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <Card className="psych-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-blue-600" />
            Sistema de Pausas Activas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Pausas Activas Habilitadas</p>
              <p className="text-sm text-gray-600">Recordatorios automáticos para el bienestar</p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) => setConfig(prev => ({ ...prev, enabled }))}
            />
          </div>

          {config.enabled && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Intervalo de Pausas</span>
                  <Badge variant="outline">{config.interval} minutos</Badge>
                </div>
                <Slider
                  value={[config.interval]}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, interval: value[0] }))}
                  min={5}
                  max={60}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Duración por Defecto</span>
                  <Badge variant="outline">{formatTime(config.duration)}</Badge>
                </div>
                <Slider
                  value={[config.duration]}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, duration: value[0] }))}
                  min={30}
                  max={300}
                  step={30}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Inicio Automático</p>
                  <p className="text-sm text-gray-600">Comenzar pausas sin intervención</p>
                </div>
                <Switch
                  checked={config.autoStart}
                  onCheckedChange={(autoStart) => setConfig(prev => ({ ...prev, autoStart }))}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Status Dashboard */}
      {config.enabled && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="psych-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Próxima Pausa</p>
                  <p className="text-xl font-bold">
                    {nextBreakMinutes}:{nextBreakSeconds.toString().padStart(2, '0')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="psych-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pausas Completadas Hoy</p>
                  <p className="text-xl font-bold">{completedBreaks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="psych-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${isBreakActive ? 'bg-orange-100' : 'bg-gray-100'}`}>
                  <Zap className={`w-5 h-5 ${isBreakActive ? 'text-orange-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <p className="text-xl font-bold">
                    {isBreakActive ? 'En Pausa' : 'Activo'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Manual Break Selector */}
      <Card className="psych-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Actividades de Pausa</span>
            <Button
              onClick={startRandomBreak}
              disabled={isBreakActive}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Pausa Aleatoria
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {breakActivities.map((breakActivity) => (
              <motion.div
                key={breakActivity.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className={`cursor-pointer transition-all border-2 ${
                    isBreakActive && activeBreak?.id === breakActivity.id
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => !isBreakActive && startBreak(breakActivity.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${breakActivity.color}20` }}
                      >
                        {breakActivity.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{breakActivity.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {formatTime(breakActivity.duration)}
                        </p>
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{ borderColor: breakActivity.color }}
                        >
                          {breakActivity.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Break Modal */}
      <AnimatePresence>
        {isBreakActive && activeBreak && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full text-center"
            >
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${activeBreak.color}20` }}
              >
                {activeBreak.icon}
              </div>

              <h2 className="text-2xl font-bold mb-2">{activeBreak.name}</h2>
              
              <div className="mb-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {formatTime(breakTimer)}
                </div>
                <Progress 
                  value={((activeBreak.duration - breakTimer) / activeBreak.duration) * 100} 
                  className="h-2 mb-4"
                />
              </div>

              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className="text-lg font-medium mb-2">
                  Paso {currentStep + 1} de {activeBreak.instructions.length}
                </div>
                <p className="text-gray-600">
                  {activeBreak.instructions[currentStep]}
                </p>
              </motion.div>

              <div className="flex space-x-3">
                <Button
                  onClick={completeBreak}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Completar
                </Button>
                <Button
                  onClick={skipBreak}
                  variant="outline"
                  className="flex-1"
                >
                  Saltar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};