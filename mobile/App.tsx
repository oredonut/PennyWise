import 'react-native-url-polyfill/auto'
import { useCallback, useEffect, useState } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
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
import OtpScreen      from './screens/auth/OtpScreen';
import ProfileSetupScreen from './screens/auth/ProfileSetupScreen';
import OnboardingScreen, { ONBOARDED_KEY } from './screens/OnboardingScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MainTabs        from './navigation/MainTabs';
import AddTransactionScreen from './screens/AddTransactionScreen';
import OcrScreen from './screens/OcrScreen';
import OcrConfirmScreen from './screens/OcrConfirmScreen';
import * as Notifications from 'expo-notifications';
import { apiPost } from './hooks/useApi';
import { useNetworkSync } from './lib/netInfo';
import { ToastViewport, Toast } from './src/components/Toast';
import { supabase } from './lib/supabase';

// Keep the native splash visible until fonts are loaded
SplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator();

// Foreground notification presentation.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    // Required by expo-notifications (SDK 54) — replaces shouldShowAlert.
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Ref so the notification-tap handler can navigate from outside React.
const navigationRef = createNavigationContainerRef();

import { ThemeProvider, useTheme } from './lib/useTheme';

function AppContent({ onLayoutRootView, fontsLoaded }: { onLayoutRootView: () => Promise<void>; fontsLoaded: boolean }) {
  const { tokens, isDark } = useTheme();

  // Drain the offline transaction queue whenever connectivity returns.
  useNetworkSync();

  // Catch otherwise-unhandled JS errors so the user gets a toast instead of
  // a silent failure (or, for fatals, the default red-box in dev). We chain
  // the previous handler so React Native's default reporting still runs.
  useEffect(() => {
    const errorUtils = (globalThis as any).ErrorUtils;
    if (!errorUtils?.setGlobalHandler) return;
    const previous = errorUtils.getGlobalHandler?.();
    errorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      console.error('Global error:', error);
      if (!isFatal) Toast.show(error?.message ?? 'Something went wrong', 'error');
      previous?.(error, isFatal);
    });
    return () => {
      if (previous) errorUtils.setGlobalHandler(previous);
    };
  }, []);

  // Session expiry: useApi signs the user out on a persistent 401. React to
  // that here by resetting navigation back to the auth flow.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && navigationRef.isReady()) {
        (navigationRef as any).reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Ask for permission on first launch, then register the Expo push token.
    (async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          const token = await Notifications.getExpoPushTokenAsync();
          await apiPost('/api/push-token', { token: token.data });
        }
      } catch {
        // Best-effort (e.g. no session yet, or running in Expo Go) — never fatal.
      }
    })();

    // Deep-link notification taps to the relevant tab.
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { route?: string };
      if (data?.route === 'Insights' && navigationRef.isReady()) {
        // Nested navigate into the tab navigator (untyped ref → cast).
        (navigationRef as any).navigate('MainTabs', { screen: 'InsightsTab' });
      }
    });
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }} onLayout={onLayoutRootView}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{ headerShown: false, animation: 'fade' }}
        >
          {/* ── Auth flow ──────────────────────────────────── */}
          <Stack.Screen name="Splash">
            {({ navigation }) => (
              <PWSplashScreen
                onFinish={async () => {
                  // First-run users see Onboarding; returning users (flag set on
                  // "Get Started") skip straight to Login.
                  let onboarded = false;
                  try {
                    onboarded = (await AsyncStorage.getItem(ONBOARDED_KEY)) === '1';
                  } catch {
                    // ignore — default to showing onboarding
                  }
                  navigation.reset({
                    index: 0,
                    routes: [{ name: onboarded ? 'Login' : 'Onboarding' }],
                  });
                }}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="Login"    component={LoginScreen}    />
          <Stack.Screen name="Register" component={RegisterScreen} />
          {/* Signup → Otp → ProfileSetup → MainTabs (verify-then-setup chain) */}
          <Stack.Screen name="Otp" component={OtpScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ animation: 'slide_from_right' }} />
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

          {/* Snap receipt — OCR capture → review */}
          <Stack.Screen name="OcrScreen" component={OcrScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="OcrConfirm" component={OcrConfirmScreen} options={{ animation: 'slide_from_right' }} />
        </Stack.Navigator>
      </NavigationContainer>
      <ToastViewport />
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
