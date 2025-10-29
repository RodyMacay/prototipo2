import { create } from 'zustand';
import { Patient, User } from '@/types';
import api from '@/services/api';

// Definimos la estructura de la respuesta del backend para un niño
interface BackendChild {
  id: string; // ID del perfil de niño
  user_id: string; // ID del usuario
  assigned_psychologist: string | null;
  age: number;
  sex?: string;
  date_of_birth?: string; // Viene como string desde JSON
  address?: string;
  guardian_name?: string;
  guardian_phone?: string;
  asd_level?: string;
  diagnosis?: string[] | null;
  guardian_email?: string;
  parent_email?: string;
  email?: string;
  name?: string;
  created_at?: string;
  updated_at?: string;
  preferences?: string | Record<string, unknown> | null;
  current_emotion: string;
  clinical_history_file?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
    created_at: string;
    updated_at: string;
  };
}

// Definimos los datos necesarios para crear un paciente desde el formulario
export interface NewPatientData {
  name: string;
  email: string; // Ahora requerido
  password: string; // Ahora requerido
  age: number;
  sex: string;
  date_of_birth: Date;
  address?: string;
  guardian_name: string;
  guardian_phone: string;
  asd_level: string;
  diagnosis: string[];
  guardian_email: string;
  parent_email?: string;
  preferences?: string | Record<string, unknown> | null;
  clinical_history_file?: File | string;
}

interface PatientState {
  patients: Patient[];
  loading: boolean;
  fetchPatients: () => Promise<void>;
  addPatient: (patientData: NewPatientData) => Promise<boolean>; // Devuelve true si éxito
  getPatientById: (id: string) => Patient | undefined;
}

// Helper para transformar la respuesta del backend al tipo del frontend
const transformBackendChildToPatient = (child: BackendChild): Patient => {
  const user = child.user ?? {
    id: child.user_id,
    name: child.name ?? '',
    email: child.email ?? '',
    role: 'child',
    avatar: null,
    created_at: child.created_at ?? child.updated_at ?? new Date().toISOString(),
    updated_at: child.updated_at ?? child.created_at ?? new Date().toISOString(),
  };

  const diagnosis = (child.diagnosis ?? []).map((item) => String(item));
  const rawPreferences = child.preferences;
  let preferences: Patient['preferences'] = null;

  if (typeof rawPreferences === 'string' || rawPreferences === null || rawPreferences === undefined) {
    preferences = rawPreferences ?? null;
  } else {
    preferences = rawPreferences as Record<string, unknown>;
  }
  const guardianEmail = child.guardian_email ?? child.parent_email;
  const createdAt = user.created_at ? new Date(user.created_at) : new Date();
  const updatedAt = user.updated_at ? new Date(user.updated_at) : createdAt;

  return {
    id: user.id,
    childProfileId: child.id,
    name: user.name || child.name || '',
    email: user.email || child.email || '',
    role: 'patient',
    avatar: user.avatar || undefined,
    createdAt,
    updatedAt,
    age: child.age,
    sex: child.sex,
    date_of_birth: child.date_of_birth ? new Date(child.date_of_birth) : undefined,
    address: child.address,
    guardian_name: child.guardian_name,
    guardian_phone: child.guardian_phone,
    asd_level: child.asd_level,
    diagnosis,
    guardian_email: guardianEmail,
    assignedPsychologist: child.assigned_psychologist || '',
    preferences,
    currentEmotion: child.current_emotion as Patient['currentEmotion'],
    clinical_history_file: child.clinical_history_file || undefined,
  };
};

export const usePatientStore = create<PatientState>()((set, get) => ({
  patients: [],
  loading: false,

  fetchPatients: async () => {
    set({ loading: true });
    try {
      const backendChildren = await api.get<BackendChild[]>('/psychologists/children');
      const patients = backendChildren.map(transformBackendChildToPatient);
      set({ patients, loading: false });
    } catch (error) {
      console.error('Error fetching patients:', error);
      set({ patients: [], loading: false });
    }
  },

  addPatient: async (patientData) => {
    set({ loading: true });
    try {
      const dateOfBirth = patientData.date_of_birth
        ? patientData.date_of_birth.toISOString().split('T')[0]
        : undefined;
      const diagnosis = Array.isArray(patientData.diagnosis) ? patientData.diagnosis : [];
      const preferences =
        typeof patientData.preferences === 'string' || patientData.preferences === null || patientData.preferences === undefined
          ? patientData.preferences ?? null
          : JSON.stringify(patientData.preferences);
      const clinicalHistoryValue =
        typeof patientData.clinical_history_file === 'string'
          ? patientData.clinical_history_file
          : patientData.clinical_history_file?.name;

      const registerResponse = await api.post<{ user: User }>('/auth/register', {
        name: patientData.name,
        email: patientData.email,
        password: patientData.password,
        role: 'child',
        age: patientData.age,
        sex: patientData.sex,
        date_of_birth: dateOfBirth,
        address: patientData.address,
        guardian_name: patientData.guardian_name,
        guardian_phone: patientData.guardian_phone,
        asd_level: patientData.asd_level,
        guardian_email: patientData.guardian_email,
        parent_email: patientData.parent_email ?? patientData.guardian_email,
        diagnosis,
        preferences,
        clinical_history_file: clinicalHistoryValue,
      });

      const newUserId = registerResponse.user.id;
      if (!newUserId) {
        throw new Error("Registration failed to return a user ID.");
      }

      await api.post('/psychologists/me/children', { 
        child_user_id: newUserId 
      });

      await get().fetchPatients();
      
      set({ loading: false });
      return true;

    } catch (error) {
      console.error('Error adding patient:', error);
      set({ loading: false });
      return false;
    }
  },

  getPatientById: (id: string) => {
    return get().patients.find(p => p.id === id);
  },
}));
