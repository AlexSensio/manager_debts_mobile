import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RouteProp } from '@react-navigation/native';
import dayjs from 'dayjs';
import { Ionicons } from '@expo/vector-icons';
import { DebtsStackParamList, Installment } from '../../types';
import { debtsService } from '../../services/debtsService';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { formatCurrency, debtStatusLabel, debtStatusColor } from '../../utils/format';

type Props = {
  route: RouteProp<DebtsStackParamList, 'DebtDetail'>;
};

export default function DebtDetailScreen({ route }: Props) {
  const { debtId } = route.params;
  const queryClient = useQueryClient();
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [payModalVisible, setPayModalVisible] = useState(false);

  const { data: debt, isLoading: debtLoading, refetch: refetchDebt } = useQuery({
    queryKey: ['debt', debtId],
    queryFn: () => debtsService.getById(debtId),
  });

  const { data: installments, isLoading: instLoading, refetch: refetchInst } = useQuery({
    queryKey: ['installments', debtId],
    queryFn: () => debtsService.getInstallments(debtId),
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => debtsService.payInstallment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installments', debtId] });
      queryClient.invalidateQueries({ queryKey: ['debt', debtId] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setPayModalVisible(false);
      setSelectedInstallment(null);
    },
    onError: (err: any) => {
      Alert.alert('Erro', err?.response?.data?.message || 'Erro ao quitar parcela.');
      setPayModalVisible(false);
    },
  });

  const openPayModal = (inst: Installment) => {
    setSelectedInstallment(inst);
    setPayModalVisible(true);
  };

  const isLoading = debtLoading || instLoading;
  const refetch = () => { refetchDebt(); refetchInst(); };
  const person = debt?.personId as any;
  const statusColor = debt ? debtStatusColor(debt.status) : colors.textSecondary;
  const paidCount = installments?.filter((i) => i.status === 'paid').length || 0;

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[colors.secondary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Debt info */}
        {debt && (
          <View style={styles.debtCard}>
            <View style={styles.debtHeader}>
              <Text style={styles.debtDescription}>{debt.description}</Text>
              <View style={[styles.badge, { backgroundColor: `${statusColor}20` }]}>
                <Text style={[styles.badgeText, { color: statusColor }]}>{debtStatusLabel(debt.status)}</Text>
              </View>
            </View>

            {person?.name && (
              <View style={styles.personRow}>
                <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.personName}>{person.name}</Text>
              </View>
            )}

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Valor original</Text>
                <Text style={styles.statValue}>{formatCurrency(debt.totalAmount)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total com juros</Text>
                <Text style={[styles.statValue, { color: colors.warning }]}>
                  {formatCurrency(debt.totalWithInterest)}
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Taxa mensal</Text>
                <Text style={styles.statValue}>{debt.interestRate}%</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Parcelas</Text>
                <Text style={styles.statValue}>{paidCount}/{debt.installmentsCount} pagas</Text>
              </View>
            </View>

            {/* Progress */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${debt.installmentsCount > 0 ? (paidCount / debt.installmentsCount) * 100 : 0}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressLabel}>
                {formatCurrency((installments?.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)) || 0)} recebido
              </Text>
            </View>
          </View>
        )}

        {/* Installments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parcelas</Text>
          <View style={styles.installmentList}>
            {installments?.map((inst) => {
              const isOverdue = inst.status === 'pending' && dayjs(inst.dueDate).isBefore(dayjs(), 'day');
              const color = inst.status === 'paid' ? colors.secondary : isOverdue ? colors.danger : colors.warning;
              return (
                <View key={inst._id} style={styles.installmentItem}>
                  <View style={[styles.instIcon, { backgroundColor: `${color}15` }]}>
                    <Ionicons
                      name={inst.status === 'paid' ? 'checkmark-circle' : isOverdue ? 'alert-circle' : 'time-outline'}
                      size={20}
                      color={color}
                    />
                  </View>
                  <View style={styles.instInfo}>
                    <Text style={styles.instNumber}>Parcela {inst.number}</Text>
                    <Text style={[styles.instDate, isOverdue && { color: colors.danger }]}>
                      {inst.status === 'paid'
                        ? `Pago em ${dayjs(inst.paidAt).format('DD/MM/YYYY')}`
                        : dayjs(inst.dueDate).format('DD/MM/YYYY')}
                    </Text>
                  </View>
                  <Text style={[styles.instAmount, { color }]}>{formatCurrency(inst.amount)}</Text>
                  {inst.status === 'pending' && (
                    <TouchableOpacity
                      style={styles.payBtn}
                      onPress={() => openPayModal(inst)}
                    >
                      <Text style={styles.payBtnText}>Pagar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Pay Modal */}
      <Modal
        visible={payModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPayModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Confirmar pagamento</Text>

            {selectedInstallment && (
              <>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalLabel}>Parcela</Text>
                  <Text style={styles.modalValue}>{selectedInstallment.number}</Text>
                </View>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalLabel}>Vencimento</Text>
                  <Text style={styles.modalValue}>
                    {dayjs(selectedInstallment.dueDate).format('DD/MM/YYYY')}
                  </Text>
                </View>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalLabel}>Valor</Text>
                  <Text style={[styles.modalValue, styles.modalAmount]}>
                    {formatCurrency(selectedInstallment.amount)}
                  </Text>
                </View>

                <Text style={styles.modalNote}>Confirmar o recebimento desta parcela?</Text>

                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => payMutation.mutate(selectedInstallment._id)}
                  disabled={payMutation.isPending}
                >
                  <Text style={styles.confirmBtnText}>
                    {payMutation.isPending ? 'Processando...' : 'Confirmar pagamento'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setPayModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  debtCard: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.lg,
  },
  debtHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  debtDescription: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
    flex: 1,
    marginRight: spacing.sm,
  },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full },
  badgeText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  personName: { fontSize: typography.sizes.md, color: 'rgba(255,255,255,0.8)' },
  statsRow: { flexDirection: 'row', marginBottom: spacing.sm },
  statItem: { flex: 1 },
  statLabel: { fontSize: typography.sizes.xs, color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  statValue: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textLight },
  progressContainer: { marginTop: spacing.md },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: { height: '100%', backgroundColor: colors.secondary, borderRadius: 4 },
  progressLabel: { fontSize: typography.sizes.xs, color: 'rgba(255,255,255,0.7)' },
  section: { paddingHorizontal: spacing.lg },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  installmentList: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  installmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: spacing.sm,
  },
  instIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  instInfo: { flex: 1 },
  instNumber: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.textPrimary },
  instDate: { fontSize: typography.sizes.xs, color: colors.textSecondary },
  instAmount: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
  payBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  payBtnText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.textLight },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  modalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalLabel: { fontSize: typography.sizes.md, color: colors.textSecondary },
  modalValue: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.textPrimary },
  modalAmount: { fontSize: typography.sizes.lg, color: colors.secondary },
  modalNote: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginVertical: spacing.md,
    textAlign: 'center',
  },
  confirmBtn: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  confirmBtnText: { color: colors.textLight, fontWeight: typography.weights.bold, fontSize: typography.sizes.md },
  cancelBtn: { padding: spacing.md, alignItems: 'center' },
  cancelBtnText: { color: colors.textSecondary, fontSize: typography.sizes.md },
});
