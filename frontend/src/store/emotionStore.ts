import { create } from 'zustand';
import { EmotionType, EmotionalIsland, IslandActivity, EmotionRecord } from '@/types';

interface EmotionStoreState {
  currentEmotion: EmotionType;
  emotionHistory: EmotionRecord[];
  selectedIsland: EmotionalIsland | null;
  unlockedIslands: EmotionalIsland[];
  islandProgress: Record<string, number>;
  
  // Actions
  setCurrentEmotion: (emotion: EmotionType, intensity?: number, context?: string) => void;
  selectIsland: (island: EmotionalIsland) => void;
  unlockIsland: (islandId: string) => void;
  completeActivity: (islandId: string, activityId: string, score?: number) => void;
  updateIslandProgress: (islandId: string, progress: number) => void;
  resetSelection: () => void;
}

// Mock Emotional Islands Data
const createMockIslands = (): EmotionalIsland[] => [
  {
    id: 'joy-island',
    emotion: 'joy',
    name: 'Isla de la Alegría',
    character: 'Spark',
    color: '#FBBF24',
    gradient: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
    activities: [
      {
        id: 'bubble-pop',
        name: 'Explotar Burbujas Mágicas',
        type: 'game',
        description: 'Toca las burbujas doradas que flotan en el aire',
        duration: 5,
        difficulty: 'easy',
        completed: false,
        unlocked: true
      },
      {
        id: 'star-collect',
        name: 'Recolector de Estrellas',
        type: 'game',
        description: 'Recoge estrellas saltarinas por toda la isla',
        duration: 8,
        difficulty: 'medium',
        completed: false,
        unlocked: true
      },
      {
        id: 'dance-party',
        name: 'Fiesta de Baile',
        type: 'music',
        description: 'Baila con Spark al ritmo de melodías alegres',
        duration: 10,
        difficulty: 'easy',
        completed: false,
        unlocked: false
      }
    ],
    unlocked: true,
    visitCount: 0
  },
  {
    id: 'sadness-island',
    emotion: 'sadness',
    name: 'Isla de la Tristeza',
    character: 'Blue',
    color: '#3B82F6',
    gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    activities: [
      {
        id: 'rain-walk',
        name: 'Caminar bajo la Lluvia Gentil',
        type: 'story',
        description: 'Acompaña a Blue en un paseo relajante',
        duration: 7,
        difficulty: 'easy',
        completed: false,
        unlocked: true
      },
      {
        id: 'emotion-diary',
        name: 'Diario de Emociones',
        type: 'art',
        description: 'Dibuja y escribe sobre tus sentimientos',
        duration: 12,
        difficulty: 'medium',
        completed: false,
        unlocked: true
      },
      {
        id: 'comfort-story',
        name: 'Cuentos de Consuelo',
        type: 'story',
        description: 'Escucha historias que ayudan a sentirse mejor',
        duration: 15,
        difficulty: 'easy',
        completed: false,
        unlocked: false
      }
    ],
    unlocked: true,
    visitCount: 0
  },
  {
    id: 'anger-island',
    emotion: 'anger',
    name: 'Isla del Enojo',
    character: 'Flame',
    color: '#EF4444',
    gradient: 'linear-gradient(135deg, #EF4444, #DC2626)',
    activities: [
      {
        id: 'breath-volcano',
        name: 'Respirar el Volcán',
        type: 'breathing',
        description: 'Ayuda a Flame a calmar el volcán con respiración',
        duration: 6,
        difficulty: 'medium',
        completed: false,
        unlocked: true
      },
      {
        id: 'anger-art',
        name: 'Arte de la Calma',
        type: 'art',
        description: 'Transforma el enojo en hermosos colores',
        duration: 10,
        difficulty: 'medium',
        completed: false,
        unlocked: false
      }
    ],
    unlocked: false,
    visitCount: 0
  },
  {
    id: 'fear-island',
    emotion: 'fear',
    name: 'Isla del Miedo',
    character: 'Shadow',
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
    activities: [
      {
        id: 'courage-steps',
        name: 'Pasos de Valentía',
        type: 'game',
        description: 'Da pequeños pasos valientes con Shadow',
        duration: 8,
        difficulty: 'hard',
        completed: false,
        unlocked: true
      },
      {
        id: 'light-gathering',
        name: 'Recolectar Luz',
        type: 'game',
        description: 'Encuentra luces para iluminar lugares oscuros',
        duration: 12,
        difficulty: 'medium',
        completed: false,
        unlocked: false
      }
    ],
    unlocked: false,
    visitCount: 0
  },
  {
    id: 'disgust-island',
    emotion: 'disgust',
    name: 'Isla del Desagrado',
    character: 'Leaf',
    color: '#10B981',
    gradient: 'linear-gradient(135deg, #10B981, #059669)',
    activities: [
      {
        id: 'organization-game',
        name: 'Juego de Organización',
        type: 'game',
        description: 'Ayuda a Leaf a organizar y limpiar la isla',
        duration: 9,
        difficulty: 'easy',
        completed: false,
        unlocked: true
      },
      {
        id: 'pattern-match',
        name: 'Emparejar Patrones',
        type: 'game',
        description: 'Encuentra patrones hermosos y ordenados',
        duration: 11,
        difficulty: 'medium',
        completed: false,
        unlocked: false
      }
    ],
    unlocked: false,
    visitCount: 0
  }
];

export const useEmotionStore = create<EmotionStoreState>((set, get) => ({
  currentEmotion: 'joy',
  emotionHistory: [],
  selectedIsland: null,
  unlockedIslands: createMockIslands(),
  islandProgress: {
    'joy-island': 25,
    'sadness-island': 10,
    'anger-island': 0,
    'fear-island': 0,
    'disgust-island': 5
  },

  setCurrentEmotion: (emotion: EmotionType, intensity = 50, context) => {
    const emotionState: EmotionRecord = {
      emotion,
      intensity,
      timestamp: new Date(),
      context
    };

    set(state => ({
      currentEmotion: emotion,
      emotionHistory: [...state.emotionHistory.slice(-49), emotionState] // Keep last 50 states
    }));

    // Auto-unlock islands based on emotion usage
    const state = get();
    const targetIsland = state.unlockedIslands.find(island => island.emotion === emotion);
    if (targetIsland && !targetIsland.unlocked) {
      set(prevState => ({
        unlockedIslands: prevState.unlockedIslands.map(island =>
          island.emotion === emotion ? { ...island, unlocked: true } : island
        )
      }));
    }
  },

  selectIsland: (island: EmotionalIsland) => {
    set(state => ({
      selectedIsland: island,
      unlockedIslands: state.unlockedIslands.map(i =>
        i.id === island.id ? { ...i, visitCount: i.visitCount + 1, lastVisit: new Date() } : i
      )
    }));
  },

  unlockIsland: (islandId: string) => {
    set(state => ({
      unlockedIslands: state.unlockedIslands.map(island =>
        island.id === islandId ? { ...island, unlocked: true } : island
      )
    }));
  },

  completeActivity: (islandId: string, activityId: string, score = 100) => {
    set(state => ({
      unlockedIslands: state.unlockedIslands.map(island => {
        if (island.id === islandId) {
          const updatedActivities = island.activities.map(activity => {
            if (activity.id === activityId) {
              return { ...activity, completed: true, score };
            }
            return activity;
          });

          // Unlock next activity if current one is completed
          const currentIndex = island.activities.findIndex(a => a.id === activityId);
          if (currentIndex < island.activities.length - 1) {
            updatedActivities[currentIndex + 1] = {
              ...updatedActivities[currentIndex + 1],
              unlocked: true
            };
          }

          return { ...island, activities: updatedActivities };
        }
        return island;
      })
    }));

    // Update progress
    const state = get();
    const island = state.unlockedIslands.find(i => i.id === islandId);
    if (island) {
      const completedCount = island.activities.filter(a => a.completed).length;
      const progress = (completedCount / island.activities.length) * 100;
      
      set(prevState => ({
        islandProgress: {
          ...prevState.islandProgress,
          [islandId]: progress
        }
      }));
    }
  },

  updateIslandProgress: (islandId: string, progress: number) => {
    set(state => ({
      islandProgress: {
        ...state.islandProgress,
        [islandId]: Math.max(0, Math.min(100, progress))
      }
    }));
  },

  resetSelection: () => {
    set({ selectedIsland: null });
  }
}));