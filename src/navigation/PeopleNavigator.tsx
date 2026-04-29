import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PeopleStackParamList } from '../types';
import PeopleListScreen from '../screens/people/PeopleListScreen';
import PersonDetailScreen from '../screens/people/PersonDetailScreen';
import AddEditPersonScreen from '../screens/people/AddEditPersonScreen';
import { colors } from '../constants/theme';

const Stack = createNativeStackNavigator<PeopleStackParamList>();

export function PeopleNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textLight,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="PeopleList" component={PeopleListScreen} options={{ title: 'Pessoas' }} />
      <Stack.Screen
        name="PersonDetail"
        component={PersonDetailScreen}
        options={({ route }) => ({ title: route.params.personName })}
      />
      <Stack.Screen
        name="AddEditPerson"
        component={AddEditPersonScreen}
        options={({ route }) => ({ title: route.params?.personId ? 'Editar Pessoa' : 'Nova Pessoa' })}
      />
    </Stack.Navigator>
  );
}
