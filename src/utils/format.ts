import { DebtStatus } from '../types';
import { colors } from '../constants/theme';

export const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const debtStatusLabel = (status: DebtStatus): string => {
  const labels: Record<DebtStatus, string> = {
    active: 'A vencer',
    paid: 'Quitada',
    overdue: 'Vencida',
  };
  return labels[status] || status;
};

export const debtStatusColor = (status: DebtStatus): string => {
  const statusColors: Record<DebtStatus, string> = {
    active: colors.warning,
    paid: colors.secondary,
    overdue: colors.danger,
  };
  return statusColors[status] || colors.textSecondary;
};
