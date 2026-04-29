import api from './api';
import { Person, PersonForm } from '../types';

export const peopleService = {
  list: async (search?: string): Promise<Person[]> => {
    const response = await api.get<Person[]>('/people', {
      params: search ? { search } : undefined,
    });
    return response.data;
  },

  getById: async (id: string): Promise<Person> => {
    const response = await api.get<Person>(`/people/${id}`);
    return response.data;
  },

  create: async (data: PersonForm): Promise<Person> => {
    const response = await api.post<Person>('/people', data);
    return response.data;
  },

  update: async (id: string, data: Partial<PersonForm>): Promise<Person> => {
    const response = await api.put<Person>(`/people/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/people/${id}`);
  },
};
