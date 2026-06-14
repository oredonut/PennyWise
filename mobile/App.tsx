import { useCallback, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  BricolageGrotesque_400Regular,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import { View, useColorScheme } from 'react-native';
import { registerRootComponent } from 'expo';

import { SplashScreen as PWSplashScreen } from './screens/auth/splashScreen';
import LoginScreen    from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import MainTabs        from './navigation/MainTabs';
import AddTransactionScreen from './screens/AddTransactionScreen';

// Keep the native splash visible until fonts are loaded
SplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator();

import { ThemeProvider, useTheme } from './lib/useTheme';

function AppContent({ onLayoutRootView, fontsLoaded }: { onLayoutRootView: () => Promise<void>; fontsLoaded: boolean }) {
  const { tokens, isDark } = useTheme();

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }} onLayout={onLayoutRootView}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{ headerShown: false, animation: 'fade' }}
        >
          {/* ── Auth flow ──────────────────────────────────── */}
          <Stack.Screen name="Splash">
            {({ navigation }) => (
              <PWSplashScreen
                onFinish={() =>
                  navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
                }
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="Login"    component={LoginScreen}    />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />

          {/* ── App (bottom tabs) ──────────────────────────── */}
          {/* TODO (backend): gate this behind Supabase session check */}
          <Stack.Screen name="MainTabs" component={MainTabs} />

          {/* Add Transaction — transparent modal with a custom slide-up sheet */}
          <Stack.Screen
            name="AddTransaction"
            component={AddTransactionScreen}
            options={{ presentation: 'transparentModal', animation: 'fade' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
}

function App() {
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent onLayoutRootView={onLayoutRootView} fontsLoaded={fontsLoaded} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);
