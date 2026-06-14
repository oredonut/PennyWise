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
import HomeScreen     from './screens/home/HomeScreen';
import { supabase } from './lib/supabase';

// Keep the native splash visible until fonts are loaded
SplashScreen.preventAutoHideAsync().catch(() => {});

type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
};

const Stack = createNativeStackNavigator();

// Module-scope ref so auth-state changes can drive navigation from outside React.
const navigationRef = createNavigationContainerRef<RootStackParamList>();

import { ThemeProvider, useTheme } from './lib/useTheme';

function AppContent({ onLayoutRootView, fontsLoaded }: { onLayoutRootView: () => Promise<void>; fontsLoaded: boolean }) {
  const { tokens, isDark } = useTheme();
  const [initialRoute, setInitialRoute] = useState<'Splash' | 'Login' | 'Home' | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setInitialRoute(session ? 'Home' : 'Splash');
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' && navigationRef.isReady()) {
        navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
      if (event === 'SIGNED_IN' && session && navigationRef.isReady()) {
        navigationRef.reset({ index: 0, routes: [{ name: 'Home' }] });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }} onLayout={onLayoutRootView}>
      {/* Session check in flight — hold on the splash. */}
      {!initialRoute ? (
        <PWSplashScreen onFinish={() => {}} />
      ) : (
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator
            initialRouteName={initialRoute}
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

            {/* ── App screens ────────────────────────────────── */}
            <Stack.Screen name="Home" component={HomeScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      )}
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
