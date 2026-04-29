import api from './api';
import { LoginForm, RegisterForm, User } from '../types';

interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export const authService = {
  login: async (data: LoginForm): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: Omit<RegisterForm, 'confirmPassword'>): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },
};
