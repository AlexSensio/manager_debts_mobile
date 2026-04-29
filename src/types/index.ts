// ============================================================
// Entidades do domínio
// ============================================================

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Address {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface Person {
  _id: string;
  name: string;
  cpf: string;
  address: Address;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export type DebtStatus = 'active' | 'paid' | 'overdue';
export type InstallmentStatus = 'pending' | 'paid';

export interface Debt {
  _id: string;
  personId: Person | string;
  description: string;
  totalAmount: number;
  installmentsCount: number;
  interestRate: number;
  installmentAmount: number;
  totalWithInterest: number;
  status: DebtStatus;
  startDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Installment {
  _id: string;
  debtId: string;
  number: number;
  dueDate: string;
  amount: number;
  status: InstallmentStatus;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Dashboard
// ============================================================

export interface GlobalDashboard {
  totals: {
    totalLent: number;
    totalReceived: number;
    totalInterest: number;
    totalPending: number;
    totalPeople: number;
    totalDebts: number;
  };
  debtsByStatus: {
    active?: number;
    paid?: number;
    overdue?: number;
  };
  monthlyData: {
    monthlyDebts: MonthlyDebt[];
    monthlyReceived: MonthlyReceived[];
  };
  upcomingInstallments: Installment[];
}

export interface MonthlyDebt {
  _id: { year: number; month: number };
  totalLent: number;
  count: number;
}

export interface MonthlyReceived {
  _id: { year: number; month: number };
  totalReceived: number;
}

export interface PersonDashboard {
  totalPaid: number;
  totalPending: number;
  totalDebts: number;
  nextInstallments: Installment[];
}

// ============================================================
// Formulários
// ============================================================

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface PersonForm {
  name: string;
  cpf: string;
  phone?: string;
  email?: string;
  address?: Address;
}

export interface DebtForm {
  personId: string;
  description: string;
  totalAmount: number;
  installmentsCount: number;
  interestRate: number;
  startDate?: string;
}

// ============================================================
// Navegação
// ============================================================

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  People: undefined;
  Debts: undefined;
  Reports: undefined;
  More: undefined;
};

export type PeopleStackParamList = {
  PeopleList: undefined;
  PersonDetail: { personId: string; personName: string };
  AddEditPerson: { personId?: string; personName?: string };
};

export type DebtsStackParamList = {
  DebtsList: undefined;
  DebtDetail: { debtId: string };
  AddDebt: { personId?: string; personName?: string };
};
