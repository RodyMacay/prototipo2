import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  SkipForward,
  Headphones,
  Music,
  Wind,
  Waves,
  Zap
} from 'lucide-react';
import { EmotionType } from '@/types';

interface AudioContextType {
  isPlaying: boolean;
  currentTrack: string | null;
  volume: number;
  playTrack: (trackId: string) => void;
  pauseTrack: () => void;
  setVolume: (volume: number) => void;
  playEmotionalSound: (emotion: EmotionType) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
};

// Audio tracks data
const audioTracks = {
  joy: {
    id: 'joy-melody',
    name: 'Melodía de Alegría',
    emotion: 'joy' as EmotionType,
    type: 'melody',
    icon: '🎵',
    color: '#FBBF24',
    description: 'Sonidos brillantes y alegres',
    // Simulated frequency - in real app would be actual audio
    frequency: 'C Major Scale',
    duration: '5:30'
  },
  calm: {
    id: 'calm-nature',
    name: 'Sonidos de la Naturaleza',
    emotion: 'sadness' as EmotionType,
    type: 'nature',
    icon: '🌊',
    color: '#3B82F6',
    description: 'Lluvia suave y naturaleza',
    frequency: 'Pink Noise',
    duration: '∞'
  },
  focus: {
    id: 'focus-white',
    name: 'Ruido Blanco Concentración',
    emotion: 'disgust' as EmotionType,
    type: 'white-noise',
    icon: '🌪️',
    color: '#10B981',
    description: 'Sonido constante para concentrarse',
    frequency: 'White Noise',
    duration: '∞'
  },
  relaxation: {
    id: 'relax-breathing',
    name: 'Respiración Relajante',
    emotion: 'anger' as EmotionType,
    type: 'breathing',
    icon: '🫁',
    color: '#EF4444',
    description: 'Guía de respiración profunda',
    frequency: '4-7-8 Breathing',
    duration: '10:00'
  },
  courage: {
    id: 'courage-ambient',
    name: 'Ambiente Valiente',
    emotion: 'fear' as EmotionType,
    type: 'ambient',
    icon: '⭐',
    color: '#8B5CF6',
    description: 'Sonidos suaves y protectores',
    frequency: 'Low Ambient',
    duration: '8:45'
  }
};

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(50);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Simulated audio context for demo
  const audioContext: AudioContextType = {
    isPlaying,
    currentTrack,
    volume,
    playTrack: (trackId: string) => {
      setCurrentTrack(trackId);
      setIsPlaying(true);
      // In real app: load and play actual audio file
    },
    pauseTrack: () => {
      setIsPlaying(false);
      // In real app: pause actual audio
    },
    setVolume: (newVolume: number) => {
      setVolumeState(newVolume);
      // In real app: adjust actual audio volume
    },
    playEmotionalSound: (emotion: EmotionType) => {
      const emotionTracks = Object.values(audioTracks).filter(track => track.emotion === emotion);
      if (emotionTracks.length > 0) {
        const track = emotionTracks[Math.floor(Math.random() * emotionTracks.length)];
        setCurrentTrack(track.id);
        setIsPlaying(true);
      }
    }
  };

  return (
    <AudioContext.Provider value={audioContext}>
      {children}
    </AudioContext.Provider>
  );
};

interface AudioControlsProps {
  compact?: boolean;
  emotion?: EmotionType;
}

export const AudioControls: React.FC<AudioControlsProps> = ({ compact = false, emotion }) => {
  const { isPlaying, currentTrack, volume, playTrack, pauseTrack, setVolume, playEmotionalSound } = useAudio();
  const [showFullPlayer, setShowFullPlayer] = useState(false);

  const currentTrackData = currentTrack ? Object.values(audioTracks).find(t => t.id === currentTrack) : null;

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => isPlaying ? pauseTrack() : (emotion && playEmotionalSound(emotion))}
          className="text-white hover:bg-white/20"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFullPlayer(!showFullPlayer)}
          className="text-white hover:bg-white/20"
        >
          <Headphones className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showFullPlayer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 z-40"
          >
            <Card className="glass-child border-white/20 w-80">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center">
                    <Music className="w-4 h-4 mr-2" />
                    Centro de Audio
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFullPlayer(false)}
                    className="text-white hover:bg-white/20"
                  >
                    ×
                  </Button>
                </div>

                {currentTrackData && (
                  <motion.div
                    className="mb-4 p-3 rounded-lg"
                    style={{ backgroundColor: `${currentTrackData.color}20` }}
                    animate={{ scale: isPlaying ? [1, 1.02, 1] : 1 }}
                    transition={{ duration: 2, repeat: isPlaying ? Infinity : 0 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{currentTrackData.icon}</div>
                      <div>
                        <h4 className="text-white font-medium text-sm">{currentTrackData.name}</h4>
                        <p className="text-white/60 text-xs">{currentTrackData.description}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex items-center space-x-2 mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => isPlaying ? pauseTrack() : playTrack('calm-nature')}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => playTrack('joy-melody')}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 flex items-center space-x-2">
                    {volume === 0 ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                    <Slider
                      value={[volume]}
                      onValueChange={(value) => setVolume(value[0])}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {Object.values(audioTracks).map((track) => (
                    <Button
                      key={track.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => playTrack(track.id)}
                      className={`text-white hover:bg-white/20 justify-start ${
                        currentTrack === track.id ? 'bg-white/20' : ''
                      }`}
                    >
                      <span className="mr-2">{track.icon}</span>
                      <span className="text-xs truncate">{track.name.split(' ')[0]}</span>
                    </Button>
                  ))}
                </div>

                {isPlaying && (
                  <motion.div
                    className="mt-4 flex justify-center"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      <Zap className="w-3 h-3 mr-1" />
                      Reproduciendo
                    </Badge>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact trigger when not showing full player */}
      {!showFullPlayer && (
        <motion.div
          className="fixed bottom-4 right-4 z-30"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={() => setShowFullPlayer(true)}
            className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg"
          >
            <Headphones className="w-5 h-5" />
          </Button>
        </motion.div>
      )}
    </>
  );
};