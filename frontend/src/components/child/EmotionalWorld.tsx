import React, { Suspense, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
import { useAuthStore } from '@/store/authStore';
import { useEmotionStore } from '@/store/emotionStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EmotionParade } from './EmotionCharacters';
import { GameSelector } from './InteractiveGames';
import { AudioControls, useAudio } from '@/components/shared/AudioSystem';
import { 
  Sparkles, 
  Heart, 
  Star, 
  Play, 
  Lock,
  Trophy,
  Zap,
  Cloud,
  Volume2,
  Gamepad2
} from 'lucide-react';
import { Child, EmotionalIsland, EmotionType } from '@/types';

// 3D Floating Island Component
const Island3D: React.FC<{ 
  island: EmotionalIsland;
  position: [number, number, number];
  onClick: () => void;
}> = ({ island, position, onClick }) => {
  const meshRef = useRef<any>();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.1;
    }
  });

  const getIslandColor = (emotion: EmotionType) => {
    const colors = {
      joy: '#FBBF24',
      sadness: '#3B82F6',
      anger: '#EF4444',
      fear: '#8B5CF6',
      disgust: '#10B981'
    };
    return colors[emotion];
  };

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh
        ref={meshRef}
        position={position}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.1 : 1}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <MeshDistortMaterial
          color={getIslandColor(island.emotion)}
          distort={0.3}
          speed={2}
          roughness={0.4}
          metalness={0.1}
        />
        {/* Character indicator - using a glowing sphere instead of 3D text */}
        {island.unlocked && (
          <Sphere args={[0.15]} position={[0, 1.3, 0]}>
            <meshBasicMaterial color="white" />
          </Sphere>
        )}
        
        {!island.unlocked && (
          <Sphere args={[1.2]} position={[0, 0, 0]}>
            <meshBasicMaterial color="#666666" opacity={0.3} transparent />
          </Sphere>
        )}
      </mesh>
    </Float>
  );
};

// Main 3D Scene Component
const EmotionalWorldScene: React.FC<{ 
  islands: EmotionalIsland[];
  onIslandClick: (island: EmotionalIsland) => void;
}> = ({ islands, onIslandClick }) => {
  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {islands.map((island, index) => (
        <Island3D
          key={island.id}
          island={island}
          position={[
            Math.cos((index / islands.length) * Math.PI * 2) * 4,
            Math.sin((index / islands.length) * Math.PI) * 2,
            Math.sin((index / islands.length) * Math.PI * 2) * 4
          ]}
          onClick={() => island.unlocked && onIslandClick(island)}
        />
      ))}
      
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
    </>
  );
};

// Island Detail Modal
const IslandDetailModal: React.FC<{
  island: EmotionalIsland;
  onClose: () => void;
  onActivityStart: (activityId: string) => void;
}> = ({ island, onClose, onActivityStart }) => {
  const { islandProgress } = useEmotionStore();
  const progress = islandProgress[island.id] || 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-child rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        style={{ background: `linear-gradient(135deg, ${island.color}20, ${island.color}10)` }}
      >
        <div className="text-center mb-6">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl mb-4"
          >
            {island.emotion === 'joy' ? '😊' :
             island.emotion === 'sadness' ? '😢' :
             island.emotion === 'anger' ? '😠' :
             island.emotion === 'fear' ? '😨' : '🤢'}
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-2">{island.name}</h2>
          <p className="text-white/80">Conoce a {island.character}</p>
          
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm">Progreso de la Isla</span>
              <span className="text-white font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white mb-4">🎮 Actividades Disponibles</h3>
          
          {island.activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass-child p-4 rounded-xl border ${
                activity.unlocked 
                  ? 'border-white/20 hover:border-white/40' 
                  : 'border-gray-500/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">
                      {activity.type === 'game' ? '🎮' :
                       activity.type === 'art' ? '🎨' :
                       activity.type === 'music' ? '🎵' :
                       activity.type === 'breathing' ? '🫁' : '📖'}
                    </span>
                    <h4 className="font-semibold text-white">{activity.name}</h4>
                    {activity.completed && (
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        <Trophy className="w-3 h-3 mr-1" />
                        Completado
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-white/70 text-sm mb-2">{activity.description}</p>
                  
                  <div className="flex items-center space-x-4 text-xs text-white/60">
                    <span>⏱️ {activity.duration} min</span>
                    <span>📊 {activity.difficulty}</span>
                    {activity.score && <span>⭐ {activity.score}/100</span>}
                  </div>
                </div>
                
                <div className="ml-4">
                  {activity.unlocked ? (
                    <Button
                      onClick={() => onActivityStart(activity.id)}
                      disabled={activity.completed}
                      className={`${
                        activity.completed 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                      } text-white`}
                    >
                      {activity.completed ? (
                        <>
                          <Trophy className="w-4 h-4 mr-2" />
                          ¡Hecho!
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Jugar
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button disabled className="bg-gray-600 text-gray-300">
                      <Lock className="w-4 h-4 mr-2" />
                      Bloqueado
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-white hover:bg-white/20"
          >
            Volver al Mundo Mágico
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const EmotionalWorld: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    currentEmotion, 
    unlockedIslands, 
    selectedIsland, 
    selectIsland, 
    resetSelection,
    completeActivity,
    setCurrentEmotion
  } = useEmotionStore();
  const { playEmotionalSound } = useAudio();
  const child = user as Child;
  const [activeGame, setActiveGame] = useState<{activityId: string, emotion: EmotionType} | null>(null);

  const handleIslandClick = (island: EmotionalIsland) => {
    selectIsland(island);
  };

  const handleActivityStart = (activityId: string) => {
    if (selectedIsland) {
      // Play emotional sound
      playEmotionalSound(selectedIsland.emotion);
      
      // Start interactive game
      setActiveGame({ activityId, emotion: selectedIsland.emotion });
      resetSelection();
    }
  };

  const handleGameComplete = (score: number) => {
    if (activeGame) {
      // Find the island that contains this activity
      const island = unlockedIslands.find(i => 
        i.activities.some(a => a.id === activeGame.activityId)
      );
      
      if (island) {
        completeActivity(island.id, activeGame.activityId, score);
      }
    }
    setActiveGame(null);
  };

  const handleEmotionSelect = (emotion: EmotionType) => {
    setCurrentEmotion(emotion);
    playEmotionalSound(emotion);
  };

  const unlockedCount = unlockedIslands.filter(island => island.unlocked).length;

  return (
    <div className="h-full min-h-[600px] relative">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2">
          ¡Bienvenido a tu Mundo Emocional! 
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block ml-2"
          >
            ✨
          </motion.span>
        </h1>
        <p className="text-white/80 text-lg">
          Explora las islas mágicas y conoce a tus emociones, {child.name}
        </p>
        
        <div className="flex justify-center items-center space-x-6 mt-4">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <span className="text-white">Islas desbloqueadas: {unlockedCount}/5</span>
          </div>
          <div className="flex items-center space-x-2">
            <Volume2 className="w-5 h-5 text-blue-400" />
            <AudioControls compact emotion={currentEmotion} />
          </div>
          <div className="flex items-center space-x-2">
            <Gamepad2 className="w-5 h-5 text-green-400" />
            <span className="text-white">Juegos disponibles</span>
          </div>
        </div>
      </motion.div>

      {/* Emotion Characters Parade */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <EmotionParade 
          currentEmotion={currentEmotion}
          onEmotionSelect={handleEmotionSelect}
        />
      </motion.div>

      {/* 3D World Canvas */}
      <div className="h-[500px] rounded-3xl overflow-hidden glass-child border border-white/20">
        <Suspense fallback={
          <div className="h-full flex items-center justify-center text-white">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-12 h-12 mx-auto mb-4" />
              </motion.div>
              <p>Cargando tu mundo mágico...</p>
            </div>
          </div>
        }>
          <Canvas 
            camera={{ position: [0, 5, 10], fov: 60 }}
            gl={{ 
              antialias: true, 
              alpha: true, 
              preserveDrawingBuffer: false,
              powerPreference: "high-performance"
            }}
            onCreated={({ gl }) => {
              gl.setClearColor('#000000', 0);
            }}
            fallback={
              <div className="h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-4" />
                  <p>Mundo 3D no disponible</p>
                </div>
              </div>
            }
          >
            <EmotionalWorldScene 
              islands={unlockedIslands}
              onIslandClick={handleIslandClick}
            />
          </Canvas>
        </Suspense>
      </div>

      {/* Island Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {unlockedIslands.map((island, index) => (
          <motion.div
            key={island.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`cursor-pointer ${!island.unlocked ? 'opacity-50' : ''}`}
            onClick={() => island.unlocked && handleIslandClick(island)}
          >
            <Card className={`glass-child border-white/20 hover:border-white/40 transition-all ${
              island.unlocked ? 'hover:scale-105' : ''
            }`}>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-4xl mb-3">
                    {island.emotion === 'joy' ? '😊' :
                     island.emotion === 'sadness' ? '😢' :
                     island.emotion === 'anger' ? '😠' :
                     island.emotion === 'fear' ? '😨' : '🤢'}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{island.name}</h3>
                  <p className="text-white/70 text-sm mb-4">Conoce a {island.character}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Actividades</span>
                      <span className="text-white">
                        {island.activities.filter(a => a.completed).length}/{island.activities.length}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Visitas</span>
                      <span className="text-white">{island.visitCount}</span>
                    </div>

                    {island.unlocked ? (
                      <Badge className="w-full bg-green-500/20 text-green-300 border-green-500/30">
                        <Zap className="w-3 h-3 mr-1" />
                        Disponible
                      </Badge>
                    ) : (
                      <Badge className="w-full bg-gray-500/20 text-gray-400 border-gray-500/30">
                        <Lock className="w-3 h-3 mr-1" />
                        Bloqueada
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tips and Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 text-center"
      >
        <Card className="glass-child border-white/20 inline-block">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-white/80">
              <Cloud className="w-5 h-5" />
              <span className="text-sm">
                💡 Haz clic en las islas brillantes para explorarlas. 
                Completa actividades para desbloquear nuevas aventuras.
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Island Detail Modal */}
      <AnimatePresence>
        {selectedIsland && (
          <IslandDetailModal
            island={selectedIsland}
            onClose={resetSelection}
            onActivityStart={handleActivityStart}
          />
        )}
      </AnimatePresence>

      {/* Interactive Games */}
      <AnimatePresence>
        {activeGame && (
          <GameSelector
            emotion={activeGame.emotion}
            activityId={activeGame.activityId}
            onComplete={handleGameComplete}
            onClose={() => setActiveGame(null)}
          />
        )}
      </AnimatePresence>

      {/* Audio Controls */}
      <AudioControls />
    </div>
  );
};