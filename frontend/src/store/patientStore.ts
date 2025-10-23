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
  diagnosis: string[];
  guardian_email?: string;
  preferences: any;
  current_emotion: string;
  clinical_history_file?: string;
  user: {
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
  clinical_history_file?: File;
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
  return {
    id: child.user.id, // Usamos el ID de usuario como el ID principal en el frontend
    name: child.user.name,
    email: child.user.email,
    role: 'patient',
    avatar: child.user.avatar || undefined,
    createdAt: new Date(child.user.created_at),
    updatedAt: new Date(child.user.updated_at),
    age: child.age,
    sex: child.sex,
    date_of_birth: child.date_of_birth ? new Date(child.date_of_birth) : undefined,
    address: child.address,
    guardian_name: child.guardian_name,
    guardian_phone: child.guardian_phone,
    asd_level: child.asd_level,
    diagnosis: child.diagnosis,
    guardian_email: child.guardian_email,
    assignedPsychologist: child.assigned_psychologist || '',
    preferences: child.preferences,
    currentEmotion: child.current_emotion as any, // Se puede mejorar el tipado si es necesario
    clinical_history_file: child.clinical_history_file,
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
      const registerResponse = await api.post<{ user: User }>('/auth/register', {
        name: patientData.name,
        email: patientData.email,
        password: patientData.password,
        role: 'child',
        age: patientData.age,
        sex: patientData.sex,
        date_of_birth: patientData.date_of_birth,
        address: patientData.address,
        guardian_name: patientData.guardian_name,
        guardian_phone: patientData.guardian_phone,
        asd_level: patientData.asd_level,
        guardian_email: patientData.guardian_email,
        diagnosis: patientData.diagnosis,
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
