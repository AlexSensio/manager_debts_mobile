import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Ionicons } from '@expo/vector-icons';
import { DebtsStackParamList, DebtForm, Person } from '../../types';
import { debtsService } from '../../services/debtsService';
import { peopleService } from '../../services/peopleService';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import { formatCurrency } from '../../utils/format';

dayjs.extend(customParseFormat);

const schema = z.object({
  personId: z.string().min(1, 'Selecione uma pessoa'),
  description: z.string().min(2, 'Descrição obrigatória').max(200),
  totalAmount: z
    .string()
    .min(1, 'Valor obrigatório')
    .transform((v) => parseFloat(v.replace(',', '.')))
    .refine((v) => !isNaN(v) && v > 0, 'Valor inválido'),
  installmentsCount: z.number().min(1).max(360),
  interestRate: z
    .string()
    .transform((v) => parseFloat(v.replace(',', '.') || '0'))
    .refine((v) => !isNaN(v) && v >= 0, 'Taxa inválida'),
  dailyInterestRate: z
    .string()
    .transform((v) => parseFloat(v.replace(',', '.') || '0'))
    .refine((v) => !isNaN(v) && v >= 0, 'Taxa diária inválida'),
});

type Props = {
  navigation: NativeStackNavigationProp<DebtsStackParamList, 'AddDebt'>;
  route: RouteProp<DebtsStackParamList, 'AddDebt'>;
};

// Calcula PMT para preview
const calcPMT = (principal: number, monthlyRate: number, n: number): number => {
  if (monthlyRate === 0 || n === 0) return n > 0 ? principal / n : 0;
  const r = monthlyRate / 100;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
};

const INSTALLMENT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36, 48, 60];

export default function AddDebtScreen({ navigation, route }: Props) {
  const { personId: presetPersonId, personName } = route.params || {};
  const queryClient = useQueryClient();
  const [installmentsCount, setInstallmentsCount] = useState(1);
  const [previewAmount, setPreviewAmount] = useState(0);
  const [previewTotal, setPreviewTotal] = useState(0);

  // Date range state
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const { data: people } = useQuery({
    queryKey: ['people'],
    queryFn: () => peopleService.list(),
    enabled: !presetPersonId,
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      personId: presetPersonId || '',
      description: '',
      totalAmount: '',
      installmentsCount: 1,
      interestRate: '0',
      dailyInterestRate: '0',
    },
  });

  // Preview em tempo real
  const watchAmount = watch('totalAmount');
  const watchRate = watch('interestRate');

  useEffect(() => {
    const amount = parseFloat(String(watchAmount).replace(',', '.'));
    const rate = parseFloat(String(watchRate).replace(',', '.') || '0');
    if (!isNaN(amount) && amount > 0) {
      const pmt = calcPMT(amount, rate, installmentsCount);
      setPreviewAmount(parseFloat(pmt.toFixed(2)));
      setPreviewTotal(parseFloat((pmt * installmentsCount).toFixed(2)));
    } else {
      setPreviewAmount(0);
      setPreviewTotal(0);
    }
  }, [watchAmount, watchRate, installmentsCount]);

  const createMutation = useMutation({
    mutationFn: (data: DebtForm) => debtsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      Alert.alert('Sucesso', 'Dívida criada com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert('Erro', err?.response?.data?.message || 'Erro ao criar dívida.');
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate({
      ...data,
      installmentsCount,
      personId: presetPersonId || data.personId,
      startDate: startDate ? startDate.toISOString() : undefined,
      endDate: endDate ? endDate.toISOString() : undefined,
    });
  };

  const openPicker = (type: 'start' | 'end') => {
    const current = type === 'start' ? startDate : endDate;
    setTempDate(current ?? new Date());
    setActivePicker(type);
  };

  const onDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (selected) setTempDate(selected);
    // No Android o evento é disparado ao selecionar; no iOS aguarda confirmação
    if (Platform.OS === 'android') confirmDate(selected ?? tempDate);
  };

  const confirmDate = (date: Date) => {
    if (activePicker === 'start') {
      setStartDate(date);
      if (endDate && date > endDate) setEndDate(null);
    } else if (activePicker === 'end') {
      setEndDate(date);
    }
    setActivePicker(null);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Pessoa */}
        <Text style={styles.sectionLabel}>DEVEDOR</Text>

        {presetPersonId ? (
          <View style={styles.presetPerson}>
            <Text style={styles.presetPersonName}>{personName}</Text>
          </View>
        ) : (
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Pessoa *</Text>
            <Controller
              control={control}
              name="personId"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.picker, errors.personId && { borderColor: colors.danger }]}>
                  <Picker selectedValue={value} onValueChange={onChange} style={{ color: colors.textPrimary }}>
                    <Picker.Item label="Selecione uma pessoa..." value="" />
                    {people?.map((p: Person) => (
                      <Picker.Item key={p._id} label={p.name} value={p._id} />
                    ))}
                  </Picker>
                </View>
              )}
            />
            {errors.personId && (
              <Text style={styles.errorText}>{String(errors.personId.message)}</Text>
            )}
          </View>
        )}

        {/* Dados da dívida */}
        <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>DADOS DA DÍVIDA</Text>

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <AppInput
              label="Descrição *"
              placeholder="Ex: Empréstimo pessoal"
              value={value}
              onChangeText={onChange}
              error={errors.description?.message as string}
              leftIcon="document-text-outline"
            />
          )}
        />

        <Controller
          control={control}
          name="totalAmount"
          render={({ field: { onChange, value } }) => (
            <AppInput
              label="Valor principal (R$) *"
              placeholder="0,00"
              value={value}
              onChangeText={onChange}
              keyboardType="decimal-pad"
              error={errors.totalAmount?.message as string}
              leftIcon="cash-outline"
            />
          )}
        />

        <Controller
          control={control}
          name="interestRate"
          render={({ field: { onChange, value } }) => (
            <AppInput
              label="Taxa de juros mensal (%)"
              placeholder="0,00"
              value={value}
              onChangeText={onChange}
              keyboardType="decimal-pad"
              error={errors.interestRate?.message as string}
              leftIcon="trending-up-outline"
            />
          )}
        />

        <Controller
          control={control}
          name="dailyInterestRate"
          render={({ field: { onChange, value } }) => (
            <AppInput
              label="Juros diários por atraso (%)"
              placeholder="0,00"
              value={value}
              onChangeText={onChange}
              keyboardType="decimal-pad"
              error={errors.dailyInterestRate?.message as string}
              leftIcon="alert-circle-outline"
            />
          )}
        />

        {/* Datas */}
        <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>PERÍODO DA DÍVIDA</Text>

        <View style={styles.dateRangeRow}>
          <TouchableOpacity
            style={[styles.dateButton, startDate ? styles.dateButtonActive : null]}
            onPress={() => openPicker('start')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={startDate ? colors.primary : colors.textSecondary}
            />
            <View style={styles.dateButtonTexts}>
              <Text style={styles.dateButtonLabel}>Data de início</Text>
              <Text style={[styles.dateButtonValue, !startDate && styles.dateButtonPlaceholder]}>
                {startDate ? dayjs(startDate).format('DD/MM/YYYY') : 'Selecionar'}
              </Text>
            </View>
            {startDate && (
              <TouchableOpacity onPress={() => setStartDate(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <View style={styles.dateRangeArrow}>
            <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
          </View>

          <TouchableOpacity
            style={[styles.dateButton, endDate ? styles.dateButtonActive : null]}
            onPress={() => openPicker('end')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={endDate ? colors.primary : colors.textSecondary}
            />
            <View style={styles.dateButtonTexts}>
              <Text style={styles.dateButtonLabel}>Data de fim</Text>
              <Text style={[styles.dateButtonValue, !endDate && styles.dateButtonPlaceholder]}>
                {endDate ? dayjs(endDate).format('DD/MM/YYYY') : 'Selecionar'}
              </Text>
            </View>
            {endDate && (
              <TouchableOpacity onPress={() => setEndDate(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {startDate && endDate && (
          <Text style={styles.dateRangeSummary}>
            Duração: {dayjs(endDate).diff(dayjs(startDate), 'day')} dias
          </Text>
        )}

        {/* Date Picker — Android nativo direto, iOS via modal */}
        {activePicker !== null && Platform.OS === 'android' && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={activePicker === 'end' && startDate ? startDate : undefined}
          />
        )}

        {activePicker !== null && Platform.OS === 'ios' && (
          <Modal transparent animationType="slide" visible>
            <View style={styles.pickerModalOverlay}>
              <View style={styles.pickerModalContent}>
                <View style={styles.pickerModalHandle} />
                <Text style={styles.pickerModalTitle}>
                  {activePicker === 'start' ? 'Data de início' : 'Data de encerramento'}
                </Text>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={onDateChange}
                  minimumDate={activePicker === 'end' && startDate ? startDate : undefined}
                  locale="pt-BR"
                  style={{ width: '100%' }}
                />
                <View style={styles.pickerModalActions}>
                  <TouchableOpacity style={styles.pickerCancelBtn} onPress={() => setActivePicker(null)}>
                    <Text style={styles.pickerCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.pickerConfirmBtn} onPress={() => confirmDate(tempDate)}>
                    <Text style={styles.pickerConfirmText}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Parcelas select */}
        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Número de parcelas *</Text>
          <View style={styles.picker}>
            <Picker
              selectedValue={installmentsCount}
              onValueChange={(val) => {
                setInstallmentsCount(val);
                setValue('installmentsCount', val);
              }}
              style={{ color: colors.textPrimary }}
            >
              {INSTALLMENT_OPTIONS.map((n) => (
                <Picker.Item key={n} label={`${n}x`} value={n} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Preview */}
        {previewAmount > 0 && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Simulação do plano</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Parcelas</Text>
              <Text style={styles.previewValue}>{installmentsCount}x</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Valor por parcela</Text>
              <Text style={[styles.previewValue, { color: colors.warning }]}>
                {formatCurrency(previewAmount)}
              </Text>
            </View>
            <View style={[styles.previewRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.previewLabel}>Total com juros</Text>
              <Text style={[styles.previewValue, { color: colors.secondary, fontSize: typography.sizes.lg }]}>
                {formatCurrency(previewTotal)}
              </Text>
            </View>
          </View>
        )}

        <AppButton
          title="Criar dívida"
          onPress={handleSubmit(onSubmit)}
          loading={createMutation.isPending}
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  sectionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  presetPerson: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  presetPersonName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  pickerContainer: { marginBottom: spacing.md },
  picker: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  errorText: { fontSize: typography.sizes.xs, color: colors.danger, marginTop: 4 },
  previewCard: {
    backgroundColor: `${colors.primary}12`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  previewTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.primary}15`,
  },
  previewLabel: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  previewValue: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.textPrimary },
  // Date range
  dateRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  dateButtonActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  dateButtonTexts: { flex: 1 },
  dateButtonLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  dateButtonValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  dateButtonPlaceholder: {
    color: colors.textSecondary,
    fontWeight: typography.weights.regular,
  },
  dateRangeArrow: { paddingHorizontal: 2 },
  dateRangeSummary: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  // iOS date picker modal
  pickerModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerModalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: 40,
    alignItems: 'center',
  },
  pickerModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.md,
  },
  pickerModalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  pickerModalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    width: '100%',
  },
  pickerCancelBtn: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerCancelText: { color: colors.textSecondary, fontWeight: typography.weights.semibold },
  pickerConfirmBtn: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  pickerConfirmText: { color: colors.textLight, fontWeight: typography.weights.bold },
});
