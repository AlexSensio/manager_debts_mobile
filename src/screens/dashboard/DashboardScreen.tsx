import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { Ionicons } from '@expo/vector-icons';
import { dashboardService } from '../../services/dashboardService';
import { useAuthStore } from '../../store/authStore';
import { MainTabParamList, Installment } from '../../types';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { formatCurrency } from '../../utils/format';

dayjs.locale('pt-br');

type DashboardNav = BottomTabNavigationProp<MainTabParamList, 'Dashboard'>;

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation<DashboardNav>();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getGlobal,
  });

  const greetingHour = dayjs().hour();
  const greeting =
    greetingHour < 12 ? 'Bom dia' : greetingHour < 18 ? 'Boa tarde' : 'Boa noite';

  const renderUpcomingItem = (item: Installment) => {
    const isOverdue = dayjs(item.dueDate).isBefore(dayjs(), 'day');
    const debt = item.debtId as any;
    return (
      <View key={item._id} style={styles.upcomingItem}>
        <View style={[styles.upcomingIcon, { backgroundColor: isOverdue ? `${colors.danger}20` : `${colors.warning}20` }]}>
          <Ionicons
            name="document-text-outline"
            size={20}
            color={isOverdue ? colors.danger : colors.warning}
          />
        </View>
        <View style={styles.upcomingInfo}>
          <Text style={styles.upcomingName} numberOfLines={1}>
            {debt?.description || 'Dívida'}
          </Text>
          <Text style={[styles.upcomingDate, isOverdue && { color: colors.danger }]}>
            {isOverdue
              ? `Vencida há ${Math.abs(dayjs().diff(item.dueDate, 'day'))} dias`
              : `Vence em ${dayjs(item.dueDate).diff(dayjs(), 'day')} dias • ${dayjs(item.dueDate).format('DD/MM/YYYY')}`}
          </Text>
        </View>
        <Text style={[styles.upcomingAmount, isOverdue && { color: colors.danger }]}>
          {formatCurrency(item.amount)}
        </Text>
      </View>
    );
  };

  const totals = data?.totals;
  const totalPending = totals?.totalPending || 0;
  const totalReceived = totals?.totalReceived || 0;
  const totalLent = totals?.totalLent || 0;
  const totalAccruedInterest = totals?.totalAccruedInterest || 0;
  const totalUpdated = totals?.totalUpdated || 0;
  const percentReceived = totalLent > 0 ? (totalReceived / (totalLent + (totals?.totalInterest || 0))) * 100 : 0;

  const navigateNewDebts = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Debts' }],
    });
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[colors.secondary]} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {greeting}, {user?.name?.split(' ')[0]}! 👋
          </Text>
          <Text style={styles.headerSubtitle}>Veja sua situação atual</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Ionicons name="notifications-outline" size={24} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total em aberto</Text>
        <Text style={styles.summaryTotal}>{formatCurrency(totalPending)}</Text>
        <Text style={styles.summaryCount}>
          em {totals?.totalDebts || 0} dívidas • {totals?.totalPeople || 0} pessoas
        </Text>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemLabel}>Total emprestado</Text>
            <Text style={[styles.summaryItemValue, { color: colors.warning }]}>
              {formatCurrency(totalLent)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemLabel}>Total recebido</Text>
            <Text style={[styles.summaryItemValue, { color: colors.secondary }]}>
              {formatCurrency(totalReceived)}
            </Text>
          </View>
        </View>

        {totalAccruedInterest > 0 && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>Juros acumulados (atraso)</Text>
              <Text style={[styles.summaryItemValue, { color: colors.danger }]}>
                {formatCurrency(totalAccruedInterest)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>Total atualizado</Text>
              <Text style={[styles.summaryItemValue, { color: colors.danger }]}>
                {formatCurrency(totalUpdated)}
              </Text>
            </View>
          </View>
        )}

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(percentReceived, 100)}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{percentReceived.toFixed(0)}% recebido</Text>
        </View>
      </View>

      {/* Status Cards */}
      <View style={styles.statusRow}>
        <View style={[styles.statusCard, { borderLeftColor: colors.secondary }]}>
          <Text style={styles.statusValue}>{data?.debtsByStatus?.paid || 0}</Text>
          <Text style={styles.statusLabel}>Quitadas</Text>
        </View>
        <View style={[styles.statusCard, { borderLeftColor: colors.warning }]}>
          <Text style={styles.statusValue}>{data?.debtsByStatus?.active || 0}</Text>
          <Text style={styles.statusLabel}>Ativas</Text>
        </View>
        <View style={[styles.statusCard, { borderLeftColor: colors.danger }]}>
          <Text style={styles.statusValue}>{data?.debtsByStatus?.overdue || 0}</Text>
          <Text style={styles.statusLabel}>Vencidas</Text>
        </View>
      </View>

      {/* Upcoming installments */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximos vencimentos</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Debts')}>
            <Text style={styles.seeAll}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {!isLoading && (!data?.upcomingInstallments || data.upcomingInstallments.length === 0) ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={40} color={colors.secondary} />
            <Text style={styles.emptyText}>Nenhum vencimento próximo</Text>
          </View>
        ) : (
          <View style={styles.upcomingList}>
            {data?.upcomingInstallments?.map(renderUpcomingItem)}
          </View>
        )}
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ações rápidas</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('People')}
          >
            <Ionicons name="person-add-outline" size={24} color={colors.primary} />
            <Text style={styles.quickActionText}>Nova Pessoa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={navigateNewDebts}
          >
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.quickActionText}>Nova Dívida</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('Reports')}
          >
            <Ionicons name="bar-chart-outline" size={24} color={colors.primary} />
            <Text style={styles.quickActionText}>Relatórios</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 56,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
  },
  headerSubtitle: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: colors.primaryLight,
    marginHorizontal: spacing.lg,
    marginTop: -spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.lg,
  },
  summaryLabel: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: typography.weights.medium,
  },
  summaryTotal: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.extrabold,
    color: colors.textLight,
    marginVertical: spacing.xs,
  },
  summaryCount: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.6)',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: spacing.md,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { flex: 1 },
  summaryItemLabel: {
    fontSize: typography.sizes.xs,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  summaryItemValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: typography.sizes.xs,
    color: 'rgba(255,255,255,0.7)',
    minWidth: 70,
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  statusCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    ...shadows.sm,
  },
  statusValue: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  statusLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: typography.sizes.sm,
    color: colors.secondary,
    fontWeight: typography.weights.semibold,
  },
  upcomingList: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    ...shadows.sm,
    overflow: 'hidden',
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  upcomingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  upcomingInfo: { flex: 1, marginRight: spacing.sm },
  upcomingName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  upcomingDate: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  upcomingAmount: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
  },
  emptyText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.sm,
  },
  quickActionText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
