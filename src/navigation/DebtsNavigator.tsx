import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DebtsStackParamList } from '../types';
import DebtsListScreen from '../screens/debts/DebtsListScreen';
import DebtDetailScreen from '../screens/debts/DebtDetailScreen';
import AddDebtScreen from '../screens/debts/AddDebtScreen';
import { colors } from '../constants/theme';

const Stack = createNativeStackNavigator<DebtsStackParamList>();

export function DebtsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textLight,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="DebtsList" component={DebtsListScreen} options={{ title: 'Dívidas' }} />
      <Stack.Screen name="DebtDetail" component={DebtDetailScreen} options={{ title: 'Detalhes da Dívida' }} />
      <Stack.Screen
        name="AddDebt"
        component={AddDebtScreen}
        options={{ title: 'Nova Dívida' }}
      />
    </Stack.Navigator>
  );
}
