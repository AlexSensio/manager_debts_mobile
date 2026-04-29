export const colors = {
  // Brand
  primary: '#1A1F3A',       // Navy escuro — fundo de cards e header
  primaryLight: '#2D3561',  // Navy médio
  secondary: '#4CAF50',     // Verde — ações positivas, botões principais
  secondaryDark: '#388E3C',

  // Status
  danger: '#F44336',        // Vermelho — vencidos
  warning: '#FF9800',       // Laranja — a vencer em breve
  success: '#4CAF50',       // Verde — pago
  info: '#2196F3',          // Azul — informativo

  // Backgrounds
  background: '#F0F2F7',
  card: '#FFFFFF',
  surface: '#F8F9FB',

  // Texto
  textPrimary: '#1A1F3A',
  textSecondary: '#6B7280',
  textLight: '#FFFFFF',
  textMuted: '#9CA3AF',

  // Bordas
  border: '#E5E7EB',
  divider: '#F3F4F6',

  // Overlay
  overlay: 'rgba(0,0,0,0.5)',
  shadow: '#000000',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
