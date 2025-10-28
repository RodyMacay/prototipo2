import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthApiError } from '@supabase/supabase-js';
import { User, Psychologist, Patient, UserRole } from '@/types';
import { SupabaseService } from '@/services/supabaseService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  theme: 'psychologist' | 'patient';
  accessToken: string | null;

  // Actions
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (userData: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
  switchProfile: (userId: string) => Promise<void>;
}

// Mock Users Database
const mockPsychologists: Psychologist[] = [
  {
    id: 'psych-1',
    name: 'Dr. Ana Martínez',
    email: 'ana.martinez@luminova.com',
    role: 'psychologist',
    licenseNumber: 'PSY-2024-001',
    specializations: ['TEA', 'Terapia Cognitivo-Conductual', 'Mindfulness Infantil'],
    assignedChildren: ['child-1', 'child-2', 'child-3'],
    hospital: 'Hospital Infantil Madrid',
    yearsExperience: 8,
    avatar: '/avatars/dr-ana.jpg',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2025-01-03'),
  },
  {
    id: 'psych-2',
    name: 'Dr. Carlos Ruiz',
    email: 'carlos.ruiz@luminova.com',
    role: 'psychologist',
    licenseNumber: 'PSY-2024-002',
    specializations: ['TEA', 'Terapia de Juego', 'Intervención Temprana'],
    assignedChildren: ['child-4', 'child-5'],
    hospital: 'Centro TEA Barcelona',
    yearsExperience: 12,
    avatar: '/avatars/dr-carlos.jpg',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2025-01-03'),
  }
];

const mockPatients: Patient[] = [
  {
    id: 'child-1',
    name: 'Lucas',
    email: 'lucas@familia.com',
    role: 'patient',
    age: 7,
    diagnosis: ['TEA Nivel 1', 'Hipersensibilidad auditiva'],
    guardian_email: 'maria.lopez@email.com',
    assignedPsychologist: 'psych-1',
    currentEmotion: 'joy',
    avatar: '/avatars/lucas.jpg',
    preferences: {
      favoriteColors: ['blue', 'green'],
      preferredActivities: ['drawing', 'music', 'puzzles'],
      sensitivity: {
        sound: 'high',
        light: 'medium',
        touch: 'low'
      },
      avatarCustomization: {
        skinTone: 'light',
        hairColor: 'brown',
        eyeColor: 'green',
        clothing: 'casual',
        accessories: ['glasses']
      }
    },
    biometricData: {
      heartRate: 85,
      stressLevel: 'low',
      skinTemperature: 36.5,
      activity: 'resting',
      timestamp: new Date()
    },
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2025-01-03'),
  },
  {
    id: 'child-2',
    name: 'Sofia',
    email: 'sofia@familia.com',
    role: 'patient',
    age: 9,
    diagnosis: ['TEA Nivel 2', 'Ansiedad social'],
    guardian_email: 'pedro.garcia@email.com',
    assignedPsychologist: 'psych-1',
    currentEmotion: 'sadness',
    avatar: '/avatars/sofia.jpg',
    preferences: {
      favoriteColors: ['purple', 'pink'],
      preferredActivities: ['stories', 'breathing', 'nature sounds'],
      sensitivity: {
        sound: 'medium',
        light: 'high',
        touch: 'high'
      },
      avatarCustomization: {
        skinTone: 'medium',
        hairColor: 'black',
        eyeColor: 'brown',
        clothing: 'comfortable',
        accessories: ['headband']
      }
    },
    biometricData: {
      heartRate: 92,
      stressLevel: 'medium',
      skinTemperature: 36.8,
      activity: 'active',
      timestamp: new Date()
    },
    createdAt: new Date('2024-04-05'),
    updatedAt: new Date('2025-01-03'),
  }
];

const mockUsers = {
  psychologist: mockPsychologists,
  patient: mockPatients
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      theme: 'psychologist',
      accessToken: null,

      login: async (email: string, password: string, role: UserRole) => {
        set({ loading: true, error: null });

        try {
          let authResult;
          try {
            authResult = await SupabaseService.signIn(email, password);
          } catch (signInError) {
            if (
              signInError instanceof AuthApiError &&
              signInError.message === 'Email not confirmed'
            ) {
              const response = await fetch('http://localhost:8000/auth/confirm-email', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
              });

              if (!response.ok) {
                let detail = 'No se pudo confirmar el correo electrónico';
                try {
                  const data = await response.json();
                  if (data?.detail) {
                    detail = data.detail;
                  }
                } catch (parseError) {
                  // ignore parse errors and use default detail
                }
                throw new Error(detail);
              }

              authResult = await SupabaseService.signIn(email, password);
            } else {
              throw signInError;
            }
          }

          const token = authResult.session?.access_token;

          if (!token) {
            throw new Error('Supabase no devolvió un token de acceso.');
          }

          localStorage.setItem('access_token', token);
          set({ accessToken: token });

          // Try to hydrate the user from the backend using the Supabase JWT
          const userResponse = await fetch('http://localhost:8000/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (userResponse.ok) {
            const userData = await userResponse.json();

            set({
              user: {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                avatar: userData.avatar,
                createdAt: new Date(userData.created_at),
                updatedAt: new Date(userData.updated_at),
              },
              isAuthenticated: true,
              theme: userData.role === 'child' ? 'patient' : 'psychologist',
              loading: false
            });
            return;
          }

          // Fallback to Supabase profile if backend profile is unavailable
          if (authResult.user) {
            const profile = await SupabaseService.getUserProfile(authResult.user.id, role);
            if (profile) {
              set({
                user: profile,
                isAuthenticated: true,
                theme: profile.role === 'patient' ? 'patient' : 'psychologist',
                loading: false
              });
              return;
            }
          }
        } catch (supabaseError) {
          console.error('Supabase auth failed:', supabaseError);
          set({
            user: null,
            isAuthenticated: false,
            loading: false,
            error: supabaseError instanceof Error ? supabaseError.message : 'Error de autenticación',
            theme: 'psychologist',
            accessToken: null
          });
          return;
        }

        // Fallback to mock authentication for demo
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));

          let user: User | null = null;

          if (role === 'psychologist') {
            user = mockPsychologists.find(p => p.email === email) || null;
          } else if (role === 'patient') {
            user = mockPatients.find(c => c.email === email) || null;
          }

          if (!user) {
            throw new Error('Usuario no encontrado');
          }

          set({
            user,
            isAuthenticated: true,
            loading: false,
            theme: role === 'patient' ? 'patient' : 'psychologist',
            error: null
          });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Error de autenticación'
          });
        }
      },

      register: async (userData: any) => {
        set({ loading: true, error: null });

        try {
          // Try Supabase registration first
          const authResult = await SupabaseService.signUp(
            userData.email,
            userData.password
          );

          if (authResult?.user) {
            const userId = authResult.user.id;

            // Create user profile in database
            const profileData = {
              id: userId,
              name: userData.name,
              email: userData.email,
              role: userData.role,
              avatar: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            await SupabaseService.createUserProfile(profileData);

            // Create psychologist profile
            await SupabaseService.createPsychologistProfile({
              id: crypto.randomUUID(),
              user_id: userId,
              license_number: userData.licenseNumber,
              date_of_birth: userData.date_of_birth,
              sex: userData.sex,
              phone_number: userData.phone_number,
              address: userData.address,
              specializations: userData.specializations,
              assigned_children: [],
              hospital: userData.hospital || null,
              years_experience: userData.yearsExperience
            });

            // Get complete profile
            const profile = await SupabaseService.getUserProfile(userId, userData.role);

            set({
              user: profile,
              isAuthenticated: true,
              loading: false,
              theme: 'psychologist'
            });
            return;
          }
        } catch (supabaseError) {
          console.log('Supabase registration failed, using mock data:', supabaseError);
        }

        // Fallback to mock registration
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Check if psychologist already exists
          const existingPsych = mockPsychologists.find(p => p.email === userData.email);
          if (existingPsych) {
            throw new Error('Ya existe una cuenta con este email');
          }

          // Create mock psychologist
          const newPsych: Psychologist = {
            id: `psych-${Date.now()}`,
            name: userData.name,
            email: userData.email,
            role: 'psychologist',
            licenseNumber: userData.licenseNumber,
            specializations: userData.specializations,
            assignedChildren: [],
            hospital: userData.hospital,
            yearsExperience: userData.yearsExperience,
            avatar: '/avatars/default-psych.jpg',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Add to mock data
          mockPsychologists.push(newPsych);

          set({
            user: newPsych,
            isAuthenticated: true,
            loading: false,
            theme: 'psychologist',
            error: null
          });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Error al crear la cuenta'
          });
        }
      },

      logout: async () => {
        try {
          await SupabaseService.signOut();
        } catch (error) {
          console.log('Supabase signout failed:', error);
        }

        // Clear token from localStorage and state
        localStorage.removeItem('access_token');

        set({
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null,
          theme: 'psychologist',
          accessToken: null
        });
      },

      setUser: (user: User) => {
        set({
          user,
          isAuthenticated: true,
          theme: user.role === 'patient' ? 'patient' : 'psychologist',
          error: null
        });
      },

      clearError: () => {
        set({ error: null });
      },

      switchProfile: async (userId: string) => {
        set({ loading: true });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const user = [...mockPsychologists, ...mockPatients].find(u => u.id === userId);
          
          if (!user) {
            throw new Error('Usuario no encontrado');
          }
          
          set({
            user,
            theme: user.role === 'patient' ? 'patient' : 'psychologist',
            loading: false,
            error: null
          });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Error al cambiar perfil'
          });
        }
      }
    }),
    {
      name: 'luminova-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
        accessToken: state.accessToken
      })
    }
  )
);
