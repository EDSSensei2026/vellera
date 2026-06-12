import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.vellera.app/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT auth tokens for secure endpoints
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vellera_auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface BiometricData {
  weight: number;
  heartRate: number;
  caloriesIn: number;
  date: string;
}

export interface WorkoutData {
  name: string;
  exercises: { name: string; sets: number; reps: number; weight: number }[];
}

export const velleraApi = {
  // Log user biometric wellness records
  logBiometrics: async (data: BiometricData) => {
    const response = await api.post('/biometrics', data);
    return response.data;
  },

  // Save custom workout templates
  createWorkout: async (workout: WorkoutData) => {
    const response = await api.post('/workouts', workout);
    return response.data;
  },

  // Securely handshake and sync records to medical databases (FHIR)
  syncWithDoctor: async (providerId: string) => {
    const response = await api.post('/medical/sync', { providerId });
    return response.data;
  }
};
