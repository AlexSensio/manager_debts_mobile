import api from './api';
import { Debt, DebtForm, Installment } from '../types';

interface CreateDebtResponse {
  debt: Debt;
  installments: Installment[];
}

export const debtsService = {
  list: async (filters?: { status?: string; personId?: string }): Promise<Debt[]> => {
    const response = await api.get<Debt[]>('/debts', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Debt> => {
    const response = await api.get<Debt>(`/debts/${id}`);
    return response.data;
  },

  getByPerson: async (personId: string): Promise<Debt[]> => {
    const response = await api.get<Debt[]>(`/people/${personId}/debts`);
    return response.data;
  },

  create: async (data: DebtForm): Promise<CreateDebtResponse> => {
    const response = await api.post<CreateDebtResponse>('/debts', data);
    return response.data;
  },

  update: async (id: string, data: Partial<{ description: string; status: string }>): Promise<Debt> => {
    const response = await api.put<Debt>(`/debts/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/debts/${id}`);
  },

  getInstallments: async (debtId: string): Promise<Installment[]> => {
    const response = await api.get<Installment[]>(`/debts/${debtId}/installments`);
    return response.data;
  },

  payInstallment: async (installmentId: string): Promise<Installment> => {
    const response = await api.patch<{ installment: Installment }>(`/installments/${installmentId}/pay`);
    return response.data.installment;
  },
};
