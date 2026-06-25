// ============================================================
// MainTabs — the authenticated bottom-tab navigator. Replaces the
// old in-screen tab state in HomeScreen. The centre FAB is wired
// through the custom tab bar's onFabPress.
// ============================================================

import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';

import HomeTab from '../screens/tabs/HomeTab';
import InsightsTab from '../screens/tabs/InsightsTab';
import HistoryTab from '../screens/tabs/HistoryTab';
import ProfileTab from '../screens/tabs/ProfileTab';
import BottomTabBar from '../src/components/BottomTabBar';
import ErrorBoundary from '../src/components/ErrorBoundary';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const navigation = useNavigation<any>();
  // FAB now opens a small menu; each option routes to a parent-stack screen.
  const handleSnapReceipt = () => navigation.navigate('OcrScreen');
  const handleTypeItIn = () => navigation.navigate('AddTransaction');

  return (
    <Tab.Navigator
      id="MainTabs"
      // 'initialRoute' → Android hardware/gesture back from a non-Home tab
      // (Insights/History/Profile) returns to Home first, then exits — matching
      // standard Android navigation instead of backgrounding the app immediately.
      backBehavior="initialRoute"
      screenOptions={{ headerShown: false }}
      tabBar={(props: BottomTabBarProps) => (
        <BottomTabBar {...props} onSnapReceipt={handleSnapReceipt} onTypeItIn={handleTypeItIn} />
      )}
    >
      {/* Each tab is isolated so a crash in one can't white-screen the app. */}
      <Tab.Screen name="HomeTab">
        {() => <ErrorBoundary key="home"><HomeTab /></ErrorBoundary>}
      </Tab.Screen>
      <Tab.Screen name="InsightsTab">
        {() => <ErrorBoundary key="insights"><InsightsTab /></ErrorBoundary>}
      </Tab.Screen>
      <Tab.Screen name="HistoryTab">
        {() => <ErrorBoundary key="history"><HistoryTab /></ErrorBoundary>}
      </Tab.Screen>
      <Tab.Screen name="ProfileTab">
        {() => <ErrorBoundary key="profile"><ProfileTab /></ErrorBoundary>}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
