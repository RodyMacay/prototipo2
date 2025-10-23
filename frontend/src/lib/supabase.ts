import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://adzuddupoarpfjlfkhac.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkenVkZHVwb2FycGZqbGZraGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNDgxMTIsImV4cCI6MjA3MzgyNDExMn0.RWMYnkr6NnOEVs-C_u2uEgDuz5e1Io8laT9isBRHqG4';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database Schema Types
export interface DBUser {
  id: string;
  name: string;
  email: string;
  role: 'psychologist' | 'child';
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface DBPsychologist {
  id: string;
  user_id: string;
  license_number: string;
  specializations: string[];
  assigned_children: string[];
  hospital?: string;
  years_experience: number;
}

export interface DBChild {
  id: string;
  user_id: string;
  age: number;
  diagnosis: string[];
  parent_email: string;
  assigned_psychologist: string;
  preferences: any;
  current_emotion: string;
}

export interface DBBiometricData {
  id: string;
  child_id: string;
  heart_rate: number;
  stress_level: 'low' | 'medium' | 'high';
  skin_temperature: number;
  activity: 'resting' | 'active' | 'excited' | 'agitated';
  timestamp: string;
}

export interface DBEmotionRecord {
  id: string;
  child_id: string;
  emotion: string;
  intensity: number;
  timestamp: string;
  triggers?: string[];
  context?: string;
}

export interface DBBiometricAlert {
  id: string;
  child_id: string;
  type: 'high_stress' | 'rapid_heartrate' | 'emotional_distress' | 'inactivity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
  action_taken?: string;
}