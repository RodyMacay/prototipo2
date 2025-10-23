import { create } from 'zustand';
import { EmotionType, EmotionRecord, EmotionalIsland, IslandActivity } from '@/types';
import { SupabaseService } from '@/services/supabaseService';

interface EmotionStoreState {
  currentEmotion: EmotionType;
  emotionHistory: EmotionRecord[];
  selectedIsland: EmotionalIsland | null;
  unlockedIslands: EmotionalIsland[];
  islandProgress: Record<string, number>;
  
  // Actions
  setCurrentEmotion: (emotion: EmotionType, childId: string) => void;
  selectIsland: (island: EmotionalIsland) => void;
  unlockIsland: (emotion: EmotionType) => void;
  completeActivity: (islandId: string, activityId: string) => void;
  updateIslandProgress: (islandId: string, progress: number) => void;
  resetSelection: () => void;
  loadChildData: (childId: string) => void;
}

// Create mock islands data (same as before but stored in database)
const createMockIslands = (): EmotionalIsland[] => {
  return [
    {
      id: 'joy-island',
      emotion: 'joy',
      name: 'La Isla de la Alegría',
      character: '😊',
      color: '#FFD700',
      gradient: 'from-yellow-400 to-orange-500',
      unlocked: true,
      visitCount: 0,
      activities: [
        {
          id: 'joy-1',
          name: 'Jardín de Sonrisas',
          type: 'game',
          description: 'Planta flores mágicas que crecen con tu felicidad',
          duration: 10,
          difficulty: 'easy',
          completed: false,
          unlocked: true,
        },
        {
          id: 'joy-2',
          name: 'Danza de las Mariposas',
          type: 'music',
          description: 'Baila con mariposas coloridas al ritmo de melodías alegres',
          duration: 15,
          difficulty: 'medium',
          completed: false,
          unlocked: false,
        },
      ],
    },
    {
      id: 'calm-island',
      emotion: 'neutral',
      name: 'La Isla de la Calma',
      character: '😌',
      color: '#87CEEB',
      gradient: 'from-blue-300 to-blue-500',
      unlocked: true,
      visitCount: 0,
      activities: [
        {
          id: 'calm-1',
          name: 'Respiración del Océano',
          type: 'breathing',
          description: 'Respira profundo siguiendo el ritmo de las olas',
          duration: 8,
          difficulty: 'easy',
          completed: false,
          unlocked: true,
        },
      ],
    },
    {
      id: 'courage-island',
      emotion: 'fear',
      name: 'La Isla del Valor',
      character: '🦁',
      color: '#FF6B6B',
      gradient: 'from-red-400 to-pink-500',
      unlocked: false,
      visitCount: 0,
      activities: [
        {
          id: 'courage-1',
          name: 'El Rugido del León',
          type: 'game',
          description: 'Ayuda al león valiente a encontrar su rugido perdido',
          duration: 12,
          difficulty: 'medium',
          completed: false,
          unlocked: true,
        },
      ],
    },
  ];
};

export const useEmotionStoreSupabase = create<EmotionStoreState>((set, get) => ({
  currentEmotion: 'neutral',
  emotionHistory: [],
  selectedIsland: null,
  unlockedIslands: createMockIslands().filter(island => island.unlocked),
  islandProgress: {},

  loadChildData: async (childId: string) => {
    try {
      const emotionHistory = await SupabaseService.getEmotionHistory(childId);
      const currentEmotion = emotionHistory[0]?.emotion || 'neutral';
      
      set({
        currentEmotion,
        emotionHistory,
      });
    } catch (error) {
      console.error('Error loading child emotion data:', error);
    }
  },

  setCurrentEmotion: async (emotion: EmotionType, childId: string) => {
    const emotionRecord: EmotionRecord = {
      emotion,
      intensity: 70 + Math.random() * 30, // Random intensity between 70-100
      timestamp: new Date(),
      context: 'Manual selection',
    };

    try {
      await SupabaseService.saveEmotionRecord(childId, emotionRecord);
      
      set(state => ({
        currentEmotion: emotion,
        emotionHistory: [emotionRecord, ...state.emotionHistory.slice(0, 99)],
      }));

      // Auto-unlock islands based on emotion
      get().unlockIsland(emotion);
    } catch (error) {
      console.error('Error saving emotion record:', error);
      // Still update local state if database fails
      set(state => ({
        currentEmotion: emotion,
        emotionHistory: [emotionRecord, ...state.emotionHistory.slice(0, 99)],
      }));
    }
  },

  selectIsland: (island: EmotionalIsland) => {
    set({ selectedIsland: island });
  },

  unlockIsland: (emotion: EmotionType) => {
    const mockIslands = createMockIslands();
    const islandToUnlock = mockIslands.find(island => 
      island.emotion === emotion && !get().unlockedIslands.find(ui => ui.id === island.id)
    );

    if (islandToUnlock) {
      set(state => ({
        unlockedIslands: [...state.unlockedIslands, { ...islandToUnlock, unlocked: true }],
      }));
    }
  },

  completeActivity: (islandId: string, activityId: string) => {
    set(state => {
      const updatedIslands = state.unlockedIslands.map(island => {
        if (island.id === islandId) {
          const updatedActivities = island.activities.map((activity, index) => {
            if (activity.id === activityId) {
              const nextActivity = island.activities[index + 1];
              if (nextActivity) {
                nextActivity.unlocked = true;
              }
              return { ...activity, completed: true };
            }
            return activity;
          });
          return { ...island, activities: updatedActivities };
        }
        return island;
      });

      // Update selected island if it matches
      const updatedSelectedIsland = state.selectedIsland?.id === islandId
        ? updatedIslands.find(island => island.id === islandId) || null
        : state.selectedIsland;

      // Calculate progress
      const island = updatedIslands.find(i => i.id === islandId);
      if (island) {
        const completedActivities = island.activities.filter(a => a.completed).length;
        const totalActivities = island.activities.length;
        const progress = Math.round((completedActivities / totalActivities) * 100);
        
        return {
          unlockedIslands: updatedIslands,
          selectedIsland: updatedSelectedIsland,
          islandProgress: {
            ...state.islandProgress,
            [islandId]: progress,
          },
        };
      }

      return {
        unlockedIslands: updatedIslands,
        selectedIsland: updatedSelectedIsland,
      };
    });
  },

  updateIslandProgress: (islandId: string, progress: number) => {
    set(state => ({
      islandProgress: {
        ...state.islandProgress,
        [islandId]: progress,
      },
    }));
  },

  resetSelection: () => {
    set({ selectedIsland: null });
  },
}));