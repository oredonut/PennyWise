// ============================================================
// MainTabs — the authenticated bottom-tab navigator. Replaces the
// old in-screen tab state in HomeScreen. The centre FAB is wired
// through the custom tab bar's onFabPress.
// ============================================================

import React from 'react';
import { Alert } from 'react-native';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';

import HomeTab from '../screens/tabs/HomeTab';
import InsightsTab from '../screens/tabs/InsightsTab';
import HistoryTab from '../screens/tabs/HistoryTab';
import ProfileTab from '../screens/tabs/ProfileTab';
import BottomTabBar from '../src/components/BottomTabBar';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const handleFabPress = () => {
    // TODO(2E): open the Add Transaction screen / quick-add bottom sheet.
    Alert.alert('Coming soon');
  };

  return (
    <Tab.Navigator
      // 'none' → Android hardware back from any tab backgrounds the app instead
      // of navigating between tabs (tabs are not a back-stack).
      backBehavior="none"
      screenOptions={{ headerShown: false }}
      tabBar={(props: BottomTabBarProps) => <BottomTabBar {...props} onFabPress={handleFabPress} />}
    >
      <Tab.Screen name="HomeTab" component={HomeTab} />
      <Tab.Screen name="InsightsTab" component={InsightsTab} />
      <Tab.Screen name="HistoryTab" component={HistoryTab} />
      <Tab.Screen name="ProfileTab" component={ProfileTab} />
    </Tab.Navigator>
  );
}
