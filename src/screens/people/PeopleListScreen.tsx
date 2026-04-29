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
import { PeopleStackParamList, Person } from '../../types';
import { peopleService } from '../../services/peopleService';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import AppSearchBar from '../../components/common/AppSearchBar';

type Props = {
  navigation: NativeStackNavigationProp<PeopleStackParamList, 'PeopleList'>;
};

export default function PeopleListScreen({ navigation }: Props) {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: people, isLoading, refetch } = useQuery({
    queryKey: ['people', search],
    queryFn: () => peopleService.list(search || undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: peopleService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['people'] }),
  });

  const handleDelete = (person: Person) => {
    Alert.alert(
      'Excluir pessoa',
      `Deseja excluir ${person.name}? Todas as dívidas associadas também serão removidas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(person._id),
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Person }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PersonDetail', { personId: item._id, personName: item.name })}
      activeOpacity={0.7}
    >
      <View style={styles.cardAvatar}>
        <Text style={styles.cardAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardCpf}>{item.cpf}</Text>
        {item.phone && (
          <Text style={styles.cardPhone}>{item.phone}</Text>
        )}
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('AddEditPerson', { personId: item._id, personName: item.name })
          }
          style={styles.iconBtn}
        >
          <Ionicons name="pencil-outline" size={18} color={colors.info} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtn}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppSearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar por nome ou CPF..."
      />

      <FlatList
        data={people}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[colors.secondary]} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={56} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Nenhuma pessoa cadastrada</Text>
              <Text style={styles.emptySubtitle}>Toque no botão + para adicionar</Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddEditPerson', {})}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={colors.textLight} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: 100 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardAvatarText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
  },
  cardInfo: { flex: 1 },
  cardName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  cardCpf: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: 2 },
  cardPhone: { fontSize: typography.sizes.xs, color: colors.textMuted, marginTop: 1 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  iconBtn: { padding: spacing.xs },
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
