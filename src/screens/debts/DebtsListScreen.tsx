import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { DebtsStackParamList, Debt } from '../../types';
import { debtsService } from '../../services/debtsService';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { formatCurrency, debtStatusLabel, debtStatusColor } from '../../utils/format';

type Props = {
  navigation: NativeStackNavigationProp<DebtsStackParamList, 'DebtsList'>;
};

const FILTERS = [
  { label: 'Todas', value: '' },
  { label: 'A vencer', value: 'active' },
  { label: 'Vencidas', value: 'overdue' },
  { label: 'Quitadas', value: 'paid' },
];

export default function DebtsListScreen({ navigation }: Props) {
  const [activeFilter, setActiveFilter] = useState('');
  const queryClient = useQueryClient();

  const { data: debts, isLoading, refetch } = useQuery({
    queryKey: ['debts', activeFilter],
    queryFn: () => debtsService.list(activeFilter ? { status: activeFilter } : undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: debtsService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['debts'] }),
  });

  const handleDelete = (debt: Debt) => {
    Alert.alert(
      'Excluir dívida',
      `Excluir "${debt.description}"? Todas as parcelas serão removidas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => deleteMutation.mutate(debt._id) },
      ]
    );
  };

  const renderItem = ({ item }: { item: Debt }) => {
    const statusColor = debtStatusColor(item.status);
    const person = item.personId as any;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('DebtDetail', { debtId: item._id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardDescription} numberOfLines={1}>{item.description}</Text>
            <View style={[styles.badge, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.badgeText, { color: statusColor }]}>{debtStatusLabel(item.status)}</Text>
            </View>
          </View>
          {person?.name && (
            <Text style={styles.personName}>{person.name}</Text>
          )}
          <View style={styles.cardFooter}>
            <Text style={styles.installmentInfo}>
              {item.installmentsCount}x de {formatCurrency(item.installmentAmount)}
            </Text>
            <Text style={styles.totalAmount}>{formatCurrency(item.totalWithInterest)}</Text>
          </View>
          <Text style={styles.dateText}>{dayjs(item.startDate).format('DD/MM/YYYY')}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter tabs */}
      <View style={styles.filterContainer}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterTab, activeFilter === f.value && styles.filterTabActive]}
            onPress={() => setActiveFilter(f.value)}
          >
            <Text style={[styles.filterText, activeFilter === f.value && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={debts}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[colors.secondary]} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={56} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Nenhuma dívida encontrada</Text>
              <Text style={styles.emptySubtitle}>Toque em + para adicionar</Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddDebt', {})}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={colors.textLight} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  filterTabActive: { backgroundColor: colors.primary },
  filterText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium, color: colors.textSecondary },
  filterTextActive: { color: colors.textLight },
  list: { padding: spacing.lg, paddingBottom: 100 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardLeft: {
    width: 6,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  statusDot: { width: 6, height: '100%' },
  cardBody: { flex: 1, padding: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardDescription: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  badgeText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold },
  personName: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  installmentInfo: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  totalAmount: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary },
  dateText: { fontSize: typography.sizes.xs, color: colors.textMuted, marginTop: 2 },
  deleteBtn: { padding: spacing.md, justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtitle: { fontSize: typography.sizes.md, color: colors.textMuted, marginTop: spacing.xs },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
});
