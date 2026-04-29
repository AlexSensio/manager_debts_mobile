import api from './api';
import { GlobalDashboard, PersonDashboard } from '../types';

export const dashboardService = {
  getGlobal: async (): Promise<GlobalDashboard> => {
    const response = await api.get<GlobalDashboard>('/dashboard');
    return response.data;
  },

  getPerson: async (personId: string): Promise<PersonDashboard> => {
    const response = await api.get<PersonDashboard>(`/people/${personId}/dashboard`);
    return response.data;
  },
};
