import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmotionType } from '@/types';

interface EmotionCharacterProps {
  emotion: EmotionType;
  isActive: boolean;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

const emotionData = {
  joy: {
    name: 'Alegría',
    character: 'Spark',
    color: '#FBBF24',
    emoji: '😊',
    personality: 'energética y brillante',
    greeting: '¡Hola! ¿Listos para brillar juntos?',
    phrases: [
      '¡Qué día tan maravilloso!',
      '¡Vamos a divertirnos!',
      '¡Todo es posible!',
      '¡Sonríe, la vida es bella!'
    ]
  },
  sadness: {
    name: 'Tristeza',
    character: 'Blue',
    color: '#3B82F6',
    emoji: '😢',
    personality: 'gentil y comprensiva',
    greeting: 'Hola... está bien sentirse triste a veces.',
    phrases: [
      'Es normal sentirse así...',
      'Llorar puede ayudar.',
      'No estás solo en esto.',
      'Los sentimientos pasan.'
    ]
  },
  anger: {
    name: 'Enojo',
    character: 'Flame',
    color: '#EF4444',
    emoji: '😠',
    personality: 'intensa pero protectora',
    greeting: '¡Ey! ¿Algo te molesta?',
    phrases: [
      '¡Respira profundo!',
      '¡Cuenta hasta 10!',
      'El enojo pasa.',
      '¡Podemos calmarnos!'
    ]
  },
  fear: {
    name: 'Miedo',
    character: 'Shadow',
    color: '#8B5CF6',
    emoji: '😨',
    personality: 'cautelosa pero valiente',
    greeting: 'H-hola... ¿todo está bien?',
    phrases: [
      'Podemos ser valientes juntos.',
      'Un paso a la vez.',
      'Estás seguro aquí.',
      'El miedo nos protege.'
    ]
  },
  disgust: {
    name: 'Desagrado',
    character: 'Leaf',
    color: '#10B981',
    emoji: '🤢',
    personality: 'ordenada y selectiva',
    greeting: 'Hmm... necesitamos orden aquí.',
    phrases: [
      'Mejor organizamos esto.',
      'Las cosas limpias son mejores.',
      '¡Qué desorden!',
      'Podemos arreglarlo.'
    ]
  }
};

export const EmotionCharacter: React.FC<EmotionCharacterProps> = ({ 
  emotion, 
  isActive, 
  size = 'medium',
  onClick 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const data = emotionData[emotion];

  const sizes = {
    small: 'w-16 h-16 text-3xl',
    medium: 'w-24 h-24 text-5xl',
    large: 'w-32 h-32 text-7xl'
  };

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setCurrentPhrase((prev) => (prev + 1) % data.phrases.length);
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 2000);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isActive, data.phrases.length]);

  return (
    <div className="relative">
      <motion.div
        className={`${sizes[size]} rounded-full flex items-center justify-center cursor-pointer relative overflow-hidden`}
        style={{ 
          background: `linear-gradient(135deg, ${data.color}, ${data.color}dd)`,
          boxShadow: `0 0 20px ${data.color}40`
        }}
        animate={{
          scale: isActive ? [1, 1.1, 1] : 1,
          rotate: isAnimating ? [0, 5, -5, 0] : 0,
        }}
        transition={{
          scale: { duration: 2, repeat: isActive ? Infinity : 0 },
          rotate: { duration: 0.5 }
        }}
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.span
          className="text-white"
          animate={{
            y: isAnimating ? [-2, 2, -2, 0] : 0,
          }}
          transition={{ duration: 0.5 }}
        >
          {data.emoji}
        </motion.span>
        
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: `linear-gradient(45deg, ${data.color}20, transparent)` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </motion.div>

      {/* Character Name */}
      <motion.div
        className="text-center mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-white font-medium text-sm">{data.character}</p>
        <p className="text-white/60 text-xs">{data.name}</p>
      </motion.div>

      {/* Speech Bubble */}
      <AnimatePresence>
        {isActive && isAnimating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-10"
          >
            <div 
              className="px-3 py-2 rounded-lg text-white text-xs font-medium whitespace-nowrap max-w-32 text-center"
              style={{ backgroundColor: data.color }}
            >
              {data.phrases[currentPhrase]}
              <div 
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent"
                style={{ borderTopColor: data.color }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface EmotionParadeProps {
  currentEmotion: EmotionType;
  onEmotionSelect: (emotion: EmotionType) => void;
}

export const EmotionParade: React.FC<EmotionParadeProps> = ({ 
  currentEmotion, 
  onEmotionSelect 
}) => {
  const emotions: EmotionType[] = ['joy', 'sadness', 'anger', 'fear', 'disgust'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-center items-center space-x-6 p-6 glass-child rounded-2xl border border-white/20"
    >
      <h3 className="text-white font-semibold mr-4">Mis Emociones:</h3>
      {emotions.map((emotion, index) => (
        <motion.div
          key={emotion}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <EmotionCharacter
            emotion={emotion}
            isActive={currentEmotion === emotion}
            size="medium"
            onClick={() => onEmotionSelect(emotion)}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};