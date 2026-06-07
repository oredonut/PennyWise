// @ts-nocheck
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
import { Colors }     from './constants/theme';

// Keep the native splash visible until fonts are loaded
SplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator();

function App() {
  const colorScheme = useColorScheme();
  const bg = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;

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

  // Hide the native Expo splash once fonts are ready
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // Don't render anything until fonts are loaded — keeps native splash on screen
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: bg }} onLayout={onLayoutRootView}>
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
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </View>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);
