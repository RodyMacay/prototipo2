import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Star, 
  Heart, 
  Zap,
  Target,
  Wind,
  Sparkles,
  Trophy
} from 'lucide-react';
import { EmotionType } from '@/types';

interface GameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
}

// Bubble Pop Game for Joy
export const BubblePopGame: React.FC<GameProps> = ({ onComplete, onClose }) => {
  const [bubbles, setBubbles] = useState<Array<{id: number, x: number, y: number, color: string}>>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(true);

  useEffect(() => {
    // Generate bubbles
    const interval = setInterval(() => {
      if (gameActive && bubbles.length < 8) {
        setBubbles(prev => [...prev, {
          id: Date.now(),
          x: Math.random() * 80 + 10,
          y: Math.random() * 70 + 10,
          color: ['#FBBF24', '#F59E0B', '#FDE047', '#FBCF33'][Math.floor(Math.random() * 4)]
        }]);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameActive, bubbles.length]);

  useEffect(() => {
    // Game timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameActive(false);
          onComplete(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [score, onComplete]);

  const popBubble = (id: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
    setScore(prev => prev + 10);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 z-50 flex flex-col"
    >
      <div className="p-4 flex justify-between items-center">
        <div className="text-white">
          <h2 className="text-2xl font-bold">🫧 Explotar Burbujas Mágicas</h2>
          <p>¡Toca las burbujas doradas!</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge className="bg-white/20 text-white text-lg px-3 py-1">
            <Star className="w-4 h-4 mr-1" />
            {score}
          </Badge>
          <Badge className="bg-white/20 text-white text-lg px-3 py-1">
            ⏰ {timeLeft}s
          </Badge>
          <Button onClick={onClose} variant="secondary" size="sm">
            Salir
          </Button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence>
          {bubbles.map(bubble => (
            <motion.div
              key={bubble.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.2, 1], 
                opacity: 1,
                y: [0, -20, 0]
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                scale: { duration: 0.5 },
                y: { duration: 2, repeat: Infinity }
              }}
              className="absolute w-16 h-16 rounded-full cursor-pointer"
              style={{
                left: `${bubble.x}%`,
                top: `${bubble.y}%`,
                background: `radial-gradient(circle at 30% 30%, white, ${bubble.color})`,
                boxShadow: `0 0 20px ${bubble.color}40`
              }}
              onClick={() => popBubble(bubble.id)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                className="w-full h-full rounded-full flex items-center justify-center text-2xl"
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              >
                ✨
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>

        {!gameActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50"
          >
            <div className="bg-white rounded-3xl p-8 text-center">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">¡Fantástico!</h3>
              <p className="text-gray-600 mb-4">Puntuación final: {score}</p>
              <Button onClick={onClose} className="bg-yellow-500 hover:bg-yellow-600">
                ¡Continuar!
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Breathing Exercise for Anger
export const BreathingGame: React.FC<GameProps> = ({ onComplete, onClose }) => {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [count, setCount] = useState(4);
  const [cycles, setCycles] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const targetCycles = 5;

  useEffect(() => {
    if (isActive) {
      const timer = setInterval(() => {
        setCount(prev => {
          if (prev <= 1) {
            setPhase(current => {
              if (current === 'inhale') return 'hold';
              if (current === 'hold') return 'exhale';
              setCycles(prev => prev + 1);
              return 'inhale';
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isActive]);

  useEffect(() => {
    if (cycles >= targetCycles) {
      setIsActive(false);
      onComplete(100);
    }
  }, [cycles, onComplete]);

  const phaseText = {
    inhale: 'Inhala profundo',
    hold: 'Mantén el aire',
    exhale: 'Exhala lentamente'
  };

  const phaseEmoji = {
    inhale: '🌬️',
    hold: '🫁',
    exhale: '💨'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-gradient-to-br from-red-400 to-orange-600 z-50 flex flex-col items-center justify-center"
    >
      <Button 
        onClick={onClose} 
        className="absolute top-4 right-4 bg-white/20 hover:bg-white/30"
        variant="ghost"
      >
        Salir
      </Button>

      <div className="text-center text-white mb-8">
        <h2 className="text-3xl font-bold mb-2">🔥 Calmar el Volcán</h2>
        <p className="text-xl">Ayuda a Flame a respirar profundo</p>
      </div>

      <div className="relative">
        <motion.div
          className="w-64 h-64 rounded-full border-4 border-white/30 flex items-center justify-center relative"
          animate={{
            scale: phase === 'inhale' ? 1.3 : phase === 'hold' ? 1.2 : 1,
            backgroundColor: phase === 'inhale' ? '#EF444460' : phase === 'hold' ? '#F97316' : '#DC262660'
          }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        >
          <div className="text-center">
            <motion.div
              className="text-6xl mb-4"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {phaseEmoji[phase]}
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-2">{phaseText[phase]}</h3>
            <motion.div
              className="text-4xl font-bold text-white"
              key={count}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
            >
              {count}
            </motion.div>
          </div>
        </motion.div>
      </div>

      <div className="mt-8 text-center">
        <Progress value={(cycles / targetCycles) * 100} className="w-64 mb-4" />
        <p className="text-white text-lg">Ciclo {cycles}/{targetCycles}</p>
        
        {!isActive ? (
          <Button
            onClick={() => setIsActive(true)}
            className="mt-4 bg-white text-red-600 hover:bg-white/90"
            size="lg"
          >
            <Wind className="w-5 h-5 mr-2" />
            Comenzar Respiración
          </Button>
        ) : (
          <Button
            onClick={() => setIsActive(false)}
            className="mt-4 bg-white/20 text-white hover:bg-white/30"
            variant="ghost"
          >
            <Pause className="w-5 h-5 mr-2" />
            Pausar
          </Button>
        )}
      </div>
    </motion.div>
  );
};

// Courage Steps for Fear
export const CourageStepsGame: React.FC<GameProps> = ({ onComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [lightLevel, setLightLevel] = useState(10);
  const steps = [
    { text: "Respira profundo", emoji: "🫁" },
    { text: "Mira hacia adelante", emoji: "👀" },
    { text: "Da un pequeño paso", emoji: "👣" },
    { text: "Sonríe un poquito", emoji: "😊" },
    { text: "¡Eres muy valiente!", emoji: "🦸" }
  ];

  const takeStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setLightLevel(prev => Math.min(100, prev + 20));
    } else {
      onComplete(100);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: `linear-gradient(135deg, 
          rgba(139, 92, 246, ${1 - lightLevel/100}), 
          rgba(124, 58, 237, ${1 - lightLevel/100})
        )`
      }}
    >
      <Button 
        onClick={onClose} 
        className="absolute top-4 right-4 bg-white/20 hover:bg-white/30"
        variant="ghost"
      >
        Salir
      </Button>

      <div className="text-center text-white mb-8">
        <h2 className="text-3xl font-bold mb-2">💜 Pasos de Valentía</h2>
        <p className="text-xl">Camina con Shadow hacia la luz</p>
      </div>

      <motion.div
        className="w-80 h-80 rounded-full flex items-center justify-center relative overflow-hidden"
        style={{
          background: `radial-gradient(circle, rgba(255,255,255,${lightLevel/100}) 0%, transparent 70%)`,
          border: '3px solid rgba(255,255,255,0.3)'
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="text-center">
          <motion.div
            className="text-8xl mb-4"
            animate={{ 
              y: [-5, 5, -5],
              rotate: [-2, 2, -2]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            👻
          </motion.div>
          <h3 className="text-2xl font-bold text-white mb-4">Shadow</h3>
        </div>

        {/* Light particles */}
        {Array.from({ length: lightLevel / 10 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </motion.div>

      <div className="mt-8 text-center">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/20 rounded-2xl p-6 mb-6"
        >
          <div className="text-6xl mb-4">{steps[currentStep].emoji}</div>
          <h3 className="text-2xl font-bold text-white mb-4">{steps[currentStep].text}</h3>
        </motion.div>

        <Progress value={(currentStep / (steps.length - 1)) * 100} className="w-64 mb-4" />
        <p className="text-white text-lg mb-6">Paso {currentStep + 1}/{steps.length}</p>
        
        <Button
          onClick={takeStep}
          className="bg-purple-600 hover:bg-purple-700 text-white text-lg px-8 py-3"
          size="lg"
        >
          {currentStep < steps.length - 1 ? (
            <>
              <Target className="w-5 h-5 mr-2" />
              Dar Paso Valiente
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              ¡Completar!
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

interface GameSelectorProps {
  emotion: EmotionType;
  activityId: string;
  onComplete: (score: number) => void;
  onClose: () => void;
}

export const GameSelector: React.FC<GameSelectorProps> = ({ 
  emotion, 
  activityId, 
  onComplete, 
  onClose 
}) => {
  const gameMap: Record<string, React.FC<GameProps>> = {
    'bubble-pop': BubblePopGame,
    'breath-volcano': BreathingGame,
    'courage-steps': CourageStepsGame,
  };

  const GameComponent = gameMap[activityId];
  
  if (!GameComponent) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-4">Juego en desarrollo</h3>
          <p className="text-gray-600 mb-4">¡Este juego estará disponible pronto!</p>
          <Button onClick={onClose}>Volver</Button>
        </div>
      </div>
    );
  }

  return <GameComponent onComplete={onComplete} onClose={onClose} />;
};