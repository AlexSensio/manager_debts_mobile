import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../types';
import { colors } from '../constants/theme';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import MoreScreen from '../screens/more/MoreScreen';
import { PeopleNavigator } from './PeopleNavigator';
import { DebtsNavigator } from './DebtsNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const tabIcons: Record<keyof MainTabParamList, { active: IoniconsName; inactive: IoniconsName }> = {
  Dashboard: { active: 'home', inactive: 'home-outline' },
  People: { active: 'people', inactive: 'people-outline' },
  Debts: { active: 'wallet', inactive: 'wallet-outline' },
  Reports: { active: 'bar-chart', inactive: 'bar-chart-outline' },
  More: { active: 'ellipsis-horizontal-circle', inactive: 'ellipsis-horizontal-circle-outline' },
};

export default function MainNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: insets.bottom,
          height: 60 + insets.bottom,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarIcon: ({ focused, color, size }) => {
          const iconConfig = tabIcons[route.name as keyof MainTabParamList];
          const iconName = focused ? iconConfig.active : iconConfig.inactive;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="People" component={PeopleNavigator} options={{ title: 'Pessoas' }} />
      <Tab.Screen name="Debts" component={DebtsNavigator} options={{ title: 'Dívidas' }} />
      <Tab.Screen name="Reports" component={ReportsScreen} options={{ title: 'Relatórios', headerShown: true, headerStyle: { backgroundColor: colors.primary }, headerTintColor: colors.textLight, headerTitleStyle: { fontWeight: '700' } }} />
      <Tab.Screen name="More" component={MoreScreen} options={{ title: 'Mais', headerShown: true, headerStyle: { backgroundColor: colors.primary }, headerTintColor: colors.textLight, headerTitleStyle: { fontWeight: '700' } }} />
    </Tab.Navigator>
  );
}
