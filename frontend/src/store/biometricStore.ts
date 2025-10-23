import { create } from 'zustand';
import { BiometricData, BiometricAlert, MockBiometricReading } from '@/types';
import { SupabaseService } from '@/services/supabaseService';

interface BiometricState {
  realTimeData: BiometricData | null;
  historicalData: BiometricData[];
  alerts: BiometricAlert[];
  isMonitoring: boolean;
  connectedDevices: string[];
  
  // Actions
  startMonitoring: (childId: string) => void;
  stopMonitoring: () => void;
  addBiometricReading: (data: BiometricData) => void;
  addAlert: (alert: BiometricAlert) => void;
  resolveAlert: (alertId: string) => void;
  clearAlerts: () => void;
  generateMockData: () => void;
}

// Mock data generator for demonstration
const generateMockBiometricData = (childId: string): BiometricData => {
  const baseHeartRate = 80 + Math.random() * 20; // 80-100 BPM
  const stressLevels = ['low', 'medium', 'high'] as const;
  const activities = ['resting', 'active', 'excited', 'agitated'] as const;
  
  return {
    heartRate: Math.round(baseHeartRate + (Math.random() - 0.5) * 10),
    stressLevel: stressLevels[Math.floor(Math.random() * stressLevels.length)],
    skinTemperature: 36.5 + (Math.random() - 0.5) * 1,
    activity: activities[Math.floor(Math.random() * activities.length)],
    timestamp: new Date()
  };
};

const generateMockAlert = (childId: string): BiometricAlert => {
  const types = ['high_stress', 'rapid_heartrate', 'emotional_distress', 'inactivity'] as const;
  const severities = ['low', 'medium', 'high', 'critical'] as const;
  const type = types[Math.floor(Math.random() * types.length)];
  
  const messages = {
    high_stress: 'Nivel de estrés elevado detectado',
    rapid_heartrate: 'Frecuencia cardíaca por encima del rango normal',
    emotional_distress: 'Indicadores de malestar emocional',
    inactivity: 'Período prolongado de inactividad detectado'
  };
  
  return {
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    childId,
    type,
    severity: severities[Math.floor(Math.random() * severities.length)],
    message: messages[type],
    timestamp: new Date(),
    resolved: false
  };
};

export const useBiometricStore = create<BiometricState>((set, get) => ({
  realTimeData: null,
  historicalData: [],
  alerts: [],
  isMonitoring: false,
  connectedDevices: [],

  startMonitoring: async (childId: string) => {
    set({ isMonitoring: true, connectedDevices: ['Apple Watch Series 9', 'Fitbit Sense 2'] });
    
    // Load historical data from Supabase
    try {
      const historicalData = await SupabaseService.getBiometricHistory(childId, 100);
      const alerts = await SupabaseService.getAlerts(childId);
      const latestReading = await SupabaseService.getLatestBiometricReading(childId);
      
      set({ 
        historicalData, 
        alerts: alerts.filter(a => !a.resolved), 
        realTimeData: latestReading 
      });
    } catch (error) {
      console.error('Error loading biometric data:', error);
    }
    
    // Set up real-time subscription
    const subscription = SupabaseService.subscribeToBiometricData(childId, (data) => {
      set(state => ({
        realTimeData: data,
        historicalData: [...state.historicalData.slice(-99), data]
      }));
    });
    
    // Set up alert subscription
    const alertSubscription = SupabaseService.subscribeToAlerts(childId, (alert) => {
      set(state => ({
        alerts: [...state.alerts, alert]
      }));
    });
    
    // Simulate real-time data generation for demo
    const interval = setInterval(async () => {
      const mockData = generateMockBiometricData(childId);
      
      try {
        await SupabaseService.saveBiometricReading(childId, mockData);
        
        // Generate alerts randomly (5% chance)
        if (Math.random() < 0.05) {
          const alert = generateMockAlert(childId);
          await SupabaseService.saveAlert(alert);
        }
      } catch (error) {
        console.error('Error saving biometric data:', error);
      }
    }, 5000); // Update every 5 seconds
    
    // Store subscriptions and interval for cleanup
    (window as any).biometricSubscription = subscription;
    (window as any).alertSubscription = alertSubscription;
    (window as any).biometricInterval = interval;
  },

  stopMonitoring: () => {
    set({ isMonitoring: false, realTimeData: null });
    
    // Clean up subscriptions and intervals
    if ((window as any).biometricSubscription) {
      (window as any).biometricSubscription.unsubscribe();
      delete (window as any).biometricSubscription;
    }
    
    if ((window as any).alertSubscription) {
      (window as any).alertSubscription.unsubscribe();
      delete (window as any).alertSubscription;
    }
    
    if ((window as any).biometricInterval) {
      clearInterval((window as any).biometricInterval);
      delete (window as any).biometricInterval;
    }
  },

  addBiometricReading: (data: BiometricData) => {
    set(state => ({
      realTimeData: data,
      historicalData: [...state.historicalData.slice(-99), data]
    }));
  },

  addAlert: (alert: BiometricAlert) => {
    set(state => ({
      alerts: [...state.alerts, alert]
    }));
  },

  resolveAlert: async (alertId: string) => {
    try {
      await SupabaseService.resolveAlert(alertId);
      set(state => ({
        alerts: state.alerts.map(alert =>
          alert.id === alertId ? { ...alert, resolved: true } : alert
        )
      }));
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  },

  clearAlerts: () => {
    set({ alerts: [] });
  },

  generateMockData: () => {
    const historicalData: BiometricData[] = [];
    const now = new Date();
    
    // Generate last 24 hours of data
    for (let i = 24 * 60; i > 0; i -= 5) { // Every 5 minutes
      const timestamp = new Date(now.getTime() - i * 60 * 1000);
      historicalData.push({
        ...generateMockBiometricData('demo-child'),
        timestamp
      });
    }
    
    set({ historicalData });
  }
}));