import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PeopleStackParamList, PersonForm } from '../../types';
import { peopleService } from '../../services/peopleService';
import { colors, spacing, typography } from '../../constants/theme';
import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  cpf: z
    .string()
    .min(11, 'CPF inválido')
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v.length === 11, 'CPF inválido'),
  phone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  address: z
    .object({
      street: z.string().optional(),
      number: z.string().optional(),
      neighborhood: z.string().optional(),
      city: z.string().optional(),
      state: z.string().max(2).optional(),
      zipCode: z.string().optional(),
    })
    .optional(),
});

type Props = {
  navigation: NativeStackNavigationProp<PeopleStackParamList, 'AddEditPerson'>;
  route: RouteProp<PeopleStackParamList, 'AddEditPerson'>;
};

export default function AddEditPersonScreen({ navigation, route }: Props) {
  const { personId } = route.params || {};
  const isEditing = !!personId;
  const queryClient = useQueryClient();

  const { data: person } = useQuery({
    queryKey: ['person', personId],
    queryFn: () => peopleService.getById(personId!),
    enabled: isEditing,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PersonForm>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (person) {
      reset({
        name: person.name,
        cpf: person.cpf,
        phone: person.phone,
        email: person.email,
        address: person.address,
      });
    }
  }, [person, reset]);

  const createMutation = useMutation({
    mutationFn: (data: PersonForm) => peopleService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      navigation.goBack();
    },
    onError: (err: any) => {
      Alert.alert('Erro', err?.response?.data?.message || 'Erro ao salvar.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: PersonForm) => peopleService.update(personId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['person', personId] });
      navigation.goBack();
    },
    onError: (err: any) => {
      Alert.alert('Erro', err?.response?.data?.message || 'Erro ao atualizar.');
    },
  });

  const onSubmit = (data: PersonForm) => {
    if (isEditing) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>DADOS PESSOAIS</Text>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <AppInput
              label="Nome completo *"
              placeholder="Nome da pessoa"
              value={value}
              onChangeText={onChange}
              error={errors.name?.message}
              leftIcon="person-outline"
            />
          )}
        />

        <Controller
          control={control}
          name="cpf"
          render={({ field: { onChange, value } }) => (
            <AppInput
              label="CPF *"
              placeholder="000.000.000-00"
              value={value}
              onChangeText={onChange}
              keyboardType="numeric"
              error={errors.cpf?.message}
              leftIcon="card-outline"
              maxLength={14}
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, value } }) => (
            <AppInput
              label="Telefone"
              placeholder="(00) 00000-0000"
              value={value}
              onChangeText={onChange}
              keyboardType="phone-pad"
              error={errors.phone?.message}
              leftIcon="call-outline"
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <AppInput
              label="E-mail"
              placeholder="email@exemplo.com"
              value={value}
              onChangeText={onChange}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email?.message}
              leftIcon="mail-outline"
            />
          )}
        />

        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>ENDEREÇO</Text>

        <Controller
          control={control}
          name="address.street"
          render={({ field: { onChange, value } }) => (
            <AppInput label="Rua" placeholder="Rua/Avenida" value={value} onChangeText={onChange} leftIcon="location-outline" />
          )}
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="address.number"
              render={({ field: { onChange, value } }) => (
                <AppInput label="Número" placeholder="Nº" value={value} onChangeText={onChange} keyboardType="numeric" />
              )}
            />
          </View>
          <View style={{ flex: 2, marginLeft: spacing.sm }}>
            <Controller
              control={control}
              name="address.neighborhood"
              render={({ field: { onChange, value } }) => (
                <AppInput label="Bairro" placeholder="Bairro" value={value} onChangeText={onChange} />
              )}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 2 }}>
            <Controller
              control={control}
              name="address.city"
              render={({ field: { onChange, value } }) => (
                <AppInput label="Cidade" placeholder="Cidade" value={value} onChangeText={onChange} />
              )}
            />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Controller
              control={control}
              name="address.state"
              render={({ field: { onChange, value } }) => (
                <AppInput label="UF" placeholder="SP" value={value} onChangeText={onChange} maxLength={2} autoCapitalize="characters" />
              )}
            />
          </View>
        </View>

        <Controller
          control={control}
          name="address.zipCode"
          render={({ field: { onChange, value } }) => (
            <AppInput label="CEP" placeholder="00000-000" value={value} onChangeText={onChange} keyboardType="numeric" maxLength={9} />
          )}
        />

        <AppButton
          title={isEditing ? 'Salvar alterações' : 'Cadastrar pessoa'}
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
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
  row: { flexDirection: 'row' },
});
