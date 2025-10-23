import { supabase } from '@/lib/supabase';
import { BiometricData, BiometricAlert, EmotionRecord, User, Psychologist, Child } from '@/types';

export class SupabaseService {
  // Auth methods
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  static async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  // User profile methods
  static async createUserProfile(profileData: Record<string, unknown>) {
    const { error } = await supabase
      .from('users')
      .insert(profileData);
    if (error) throw error;
  }

  static async createPsychologistProfile(profileData: Record<string, unknown>) {
    const { error } = await supabase
      .from('psychologists')
      .insert(profileData);
    if (error) throw error;
  }

  static async createPatientProfile(profileData: Record<string, unknown>) {
    const { error } = await supabase
      .from('children')
      .insert(profileData);
    if (error) throw error;
  }

  static async getUserProfile(userId: string, role?: string): Promise<User | null> {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) return null;

    let profile: Partial<User> = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      avatar: userData.avatar,
      createdAt: new Date(userData.created_at),
      updatedAt: new Date(userData.updated_at),
    };

    // Get role-specific data
    if (userData.role === 'psychologist') {
      const { data: psychData } = await supabase
        .from('psychologists')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (psychData) {
        profile = {
          ...profile,
          licenseNumber: psychData.license_number,
          specializations: psychData.specializations,
          assignedChildren: psychData.assigned_children,
          hospital: psychData.hospital,
          yearsExperience: psychData.years_experience
        };
      }
    } else if (userData.role === 'patient' || userData.role === 'child') {
      const { data: childData } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (childData) {
        profile = {
          ...profile,
          age: childData.age,
          diagnosis: childData.diagnosis,
          parentEmail: childData.parent_email,
          assignedPsychologist: childData.assigned_psychologist,
          preferences: childData.preferences,
          currentEmotion: childData.current_emotion
        };
      }
    }

    return profile as User | null;
  }

  static async getPatientsForPsychologist(psychologistId: string): Promise<Patient[]> {
    const { data, error } = await supabase
      .from('children')
      .select(`
        *,
        user:users(*)
      `)
      .eq('assigned_psychologist', psychologistId);

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.user.id,
      name: item.user.name,
      email: item.user.email,
      role: 'patient',
      age: item.age,
      diagnosis: item.diagnosis,
      parentEmail: item.parent_email,
      assignedPsychologist: item.assigned_psychologist,
      currentEmotion: item.current_emotion,
      avatar: item.user.avatar,
      preferences: item.preferences,
      createdAt: new Date(item.user.created_at),
      updatedAt: new Date(item.user.updated_at),
    } as Patient));
  }

  // Biometric data methods
  static async saveBiometricReading(childId: string, data: BiometricData) {
    const { error } = await supabase
      .from('biometric_data')
      .insert({
        child_id: childId,
        heart_rate: data.heartRate,
        stress_level: data.stressLevel,
        skin_temperature: data.skinTemperature,
        activity: data.activity,
        timestamp: data.timestamp.toISOString(),
      });
    
    if (error) throw error;
  }

  static async getBiometricHistory(childId: string, limit = 100): Promise<BiometricData[]> {
    const { data, error } = await supabase
      .from('biometric_data')
      .select('*')
      .eq('child_id', childId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return (data || []).map(item => ({
      heartRate: item.heart_rate,
      stressLevel: item.stress_level,
      skinTemperature: item.skin_temperature,
      activity: item.activity,
      timestamp: new Date(item.timestamp),
    }));
  }

  static async getLatestBiometricReading(childId: string): Promise<BiometricData | null> {
    const { data, error } = await supabase
      .from('biometric_data')
      .select('*')
      .eq('child_id', childId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) return null;
    
    return {
      heartRate: data.heart_rate,
      stressLevel: data.stress_level,
      skinTemperature: data.skin_temperature,
      activity: data.activity,
      timestamp: new Date(data.timestamp),
    };
  }

  // Alert methods
  static async saveAlert(alert: BiometricAlert) {
    const { error } = await supabase
      .from('biometric_alerts')
      .insert({
        id: alert.id,
        child_id: alert.childId,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        timestamp: alert.timestamp.toISOString(),
        resolved: alert.resolved,
        action_taken: alert.actionTaken,
      });
    
    if (error) throw error;
  }

  static async getAlerts(childId: string): Promise<BiometricAlert[]> {
    const { data, error } = await supabase
      .from('biometric_alerts')
      .select('*')
      .eq('child_id', childId)
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      childId: item.child_id,
      type: item.type,
      severity: item.severity,
      message: item.message,
      timestamp: new Date(item.timestamp),
      resolved: item.resolved,
      actionTaken: item.action_taken,
    }));
  }

  static async resolveAlert(alertId: string) {
    const { error } = await supabase
      .from('biometric_alerts')
      .update({ resolved: true })
      .eq('id', alertId);
    
    if (error) throw error;
  }

  // Emotion data methods
  static async saveEmotionRecord(childId: string, emotion: EmotionRecord) {
    const { error } = await supabase
      .from('emotion_records')
      .insert({
        child_id: childId,
        emotion: emotion.emotion,
        intensity: emotion.intensity,
        timestamp: emotion.timestamp.toISOString(),
        triggers: emotion.triggers,
        context: emotion.context,
      });
    
    if (error) throw error;
  }

  static async getEmotionHistory(childId: string, limit = 100): Promise<EmotionRecord[]> {
    const { data, error } = await supabase
      .from('emotion_records')
      .select('*')
      .eq('child_id', childId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return (data || []).map(item => ({
      emotion: item.emotion,
      intensity: item.intensity,
      timestamp: new Date(item.timestamp),
      triggers: item.triggers,
      context: item.context,
    }));
  }

  // Real-time subscriptions
  static subscribeToBiometricData(childId: string, callback: (data: BiometricData) => void) {
    return supabase
      .channel('biometric_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'biometric_data',
          filter: `child_id=eq.${childId}`,
        },
        (payload) => {
          const data = payload.new;
          callback({
            heartRate: data.heart_rate,
            stressLevel: data.stress_level,
            skinTemperature: data.skin_temperature,
            activity: data.activity,
            timestamp: new Date(data.timestamp),
          });
        }
      )
      .subscribe();
  }

  static subscribeToAlerts(childId: string, callback: (alert: BiometricAlert) => void) {
    return supabase
      .channel('alert_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'biometric_alerts',
          filter: `child_id=eq.${childId}`,
        },
        (payload) => {
          const data = payload.new;
          callback({
            id: data.id,
            childId: data.child_id,
            type: data.type,
            severity: data.severity,
            message: data.message,
            timestamp: new Date(data.timestamp),
            resolved: data.resolved,
            actionTaken: data.action_taken,
          });
        }
      )
      .subscribe();
  }
}