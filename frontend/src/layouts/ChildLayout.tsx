import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useEmotionStore } from '@/store/emotionStore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Sparkles, 
  Heart, 
  Star, 
  LogOut,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Settings
} from 'lucide-react';
import { Child, EmotionType } from '@/types';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { SystemStatus } from '@/components/shared/SystemStatus';

interface ChildLayoutProps {
  children: React.ReactNode;
}

// Floating Islands Preview Component
const FloatingIslands: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <ambientLight intensity={0.4} />
      </Canvas>
    </div>
  );
};

// Emotion Indicator Component
const EmotionIndicator: React.FC<{ emotion: EmotionType }> = ({ emotion }) => {
  const emotionConfig = {
    joy: { emoji: '😊', color: 'text-yellow-400', bgColor: 'bg-yellow-400/20', label: 'Alegría' },
    sadness: { emoji: '😢', color: 'text-blue-400', bgColor: 'bg-blue-400/20', label: 'Tristeza' },
    anger: { emoji: '😠', color: 'text-red-400', bgColor: 'bg-red-400/20', label: 'Enojo' },
    fear: { emoji: '😨', color: 'text-purple-400', bgColor: 'bg-purple-400/20', label: 'Miedo' },
    disgust: { emoji: '🤢', color: 'text-green-400', bgColor: 'bg-green-400/20', label: 'Desagrado' },
    neutral: { emoji: '😐', color: 'text-gray-400', bgColor: 'bg-gray-400/20', label: 'Tranquilo' }
  };

  const config = emotionConfig[emotion];

  return (
    <motion.div
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      className={`flex items-center space-x-2 ${config.bgColor} px-4 py-2 rounded-full border border-white/20`}
    >
      <span className="text-2xl">{config.emoji}</span>
      <span className={`text-sm font-medium ${config.color}`}>
        Siento {config.label}
      </span>
    </motion.div>
  );
};

export const ChildLayout: React.FC<ChildLayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const { currentEmotion, unlockedIslands } = useEmotionStore();
  const child = user as Child;

  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [isPaused, setIsPaused] = React.useState(false);
  const [showSystemStatus, setShowSystemStatus] = useState(false);

  // Get unlocked islands count
  const unlockedCount = unlockedIslands.filter(island => island.unlocked).length;

  const navigationItems = [
    { 
      icon: Home, 
      label: 'Mi Mundo', 
      emoji: '🌍',
      active: true,
      gradient: 'from-blue-400 to-purple-500'
    },
    { 
      icon: Sparkles, 
      label: 'Islas Mágicas', 
      emoji: '🏝️',
      active: false, 
      badge: unlockedCount,
      gradient: 'from-purple-400 to-pink-500'
    },
    { 
      icon: Star, 
      label: 'Mis Logros', 
      emoji: '⭐',
      active: false, 
      badge: '5',
      gradient: 'from-yellow-400 to-orange-500'
    },
    { 
      icon: Heart, 
      label: 'Mi Avatar', 
      emoji: '👤',
      active: false,
      gradient: 'from-pink-400 to-red-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 child-theme relative">
      {/* Floating 3D Background */}
      <FloatingIslands />

      {/* Header */}
      <header className="relative z-10 glass-child border-b border-white/10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Mágico */}
            <motion.div 
              className="flex items-center space-x-4"
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full flex items-center justify-center"
                >
                  <Sparkles className="w-6 h-6 text-white" />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full"
                />
              </div>
              <div className="text-white">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
                  Mi Mundo Mágico
                </h1>
                <p className="text-sm text-white/70">¡Hola {child.name}! ✨</p>
              </div>
            </motion.div>

            {/* Emotion Status */}
            <div className="hidden md:block">
              <EmotionIndicator emotion={currentEmotion} />
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4">
              {/* System Status */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSystemStatus(true)}
                className="text-white hover:bg-white/20 rounded-full w-12 h-12"
              >
                <Settings className="w-5 h-5" />
              </Button>

              {/* Sound Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-white hover:bg-white/20 rounded-full w-12 h-12"
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>

              {/* Pause Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
                className="text-white hover:bg-white/20 rounded-full w-12 h-12"
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </Button>

              {/* Avatar */}
              <div className="flex items-center space-x-3">
                <div className="text-right text-white hidden sm:block">
                  <p className="text-sm font-medium">{child.name}</p>
                  <p className="text-xs text-white/70">{child.age} años</p>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Avatar className="w-12 h-12 border-2 border-white/30">
                    <AvatarImage src={child.avatar} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-400 to-pink-500 text-white">
                      {child.name[0]}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              </div>

              {/* Exit Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="text-white hover:bg-white/20 rounded-full w-12 h-12"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative z-10">
        {/* Magical Sidebar */}
        <aside className="w-80 glass-child border-r border-white/10 min-h-[calc(100vh-5rem)]">
          <nav className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-white mb-6">🌟 Navegación Mágica</h2>
            
            {navigationItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Button
                  variant="ghost"
                  className={`w-full justify-start space-x-4 h-16 rounded-2xl transition-all duration-300 ${
                    item.active 
                      ? `bg-gradient-to-r ${item.gradient} text-white shadow-2xl transform scale-105` 
                      : 'hover:bg-white/10 text-white/80 hover:text-white hover:scale-102'
                  }`}
                >
                  <div className="text-2xl">{item.emoji}</div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs opacity-70">
                      {item.active ? 'Estás aquí' : 'Explorar'}
                    </p>
                  </div>
                  {item.badge && (
                    <Badge 
                      className="bg-white/20 text-white border-white/30"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </motion.div>
            ))}
          </nav>

          {/* Progress Section */}
          <div className="p-6 mt-8">
            <h3 className="text-lg font-semibold text-white mb-4">✨ Mi Progreso</h3>
            <div className="space-y-4">
              <div className="glass-child p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80">Islas Desbloqueadas</span>
                  <Badge className="bg-yellow-400/20 text-yellow-300 border-yellow-400/30">
                    {unlockedCount}/5
                  </Badge>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(unlockedCount / 5) * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full"
                  />
                </div>
              </div>

              <div className="glass-child p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80">Estrellas Ganadas</span>
                  <Badge className="bg-purple-400/20 text-purple-300 border-purple-400/30">
                    47 ⭐
                  </Badge>
                </div>
                <div className="text-xs text-white/60">¡Sigue así, campeón!</div>
              </div>
            </div>
          </div>

          {/* Magic Mood Helper */}
          <div className="p-6">
            <div className="glass-child p-4 rounded-xl border border-white/20">
              <h4 className="font-medium text-white mb-2">🎭 ¿Cómo te sientes?</h4>
              <div className="grid grid-cols-3 gap-2">
                {(['joy', 'sadness', 'anger', 'fear', 'disgust'] as EmotionType[]).map(emotion => {
                  const emojis = {
                    joy: '😊',
                    sadness: '😢', 
                    anger: '😠',
                    fear: '😨',
                    disgust: '🤢'
                  };
                  
                  return (
                    <motion.button
                      key={emotion}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-2 rounded-lg text-xl transition-all ${
                        currentEmotion === emotion 
                          ? 'bg-white/20 shadow-lg' 
                          : 'hover:bg-white/10'
                      }`}
                    >
                      {emojis[emotion]}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Magical Content */}
        <main className="flex-1 overflow-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5 }}
              className="p-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* System Status Modal */}
      {showSystemStatus && (
        <SystemStatus onClose={() => setShowSystemStatus(false)} />
      )}
    </div>
  );
};