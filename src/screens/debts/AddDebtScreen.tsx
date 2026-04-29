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
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Picker } from '@react-native-picker/picker';
import { DebtsStackParamList, DebtForm, Person } from '../../types';
import { debtsService } from '../../services/debtsService';
import { peopleService } from '../../services/peopleService';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import { formatCurrency } from '../../utils/format';

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
    });
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
});
