import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { Radius, FontFamily } from '../../tokens';
import { useTheme } from '../../lib/useTheme';

type RootStackParamList = { Login: undefined; Register: undefined; Home: undefined };
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Login'> };

export default function LoginScreen({ navigation }: Props) {
  const { tokens, isDark, setThemeMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    // ── TODO (backend): uncomment the block below when Supabase is ready ──
    // const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    // setLoading(false);
    // if (authError) {
    //   setError(authError.message);
    //   return;
    // }
    // ──────────────────────────────────────────────────────────────────────

    // DEV: skip auth, go straight to Home
    setLoading(false);
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const goHomeNow = () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] });

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: tokens.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Dynamic Theme Toggle in Top Right */}
      <View style={{ position: 'absolute', top: Platform.OS === 'ios' ? 54 : 16, right: 24, zIndex: 10 }}>
        <TouchableOpacity
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: tokens.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: tokens.border,
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 5,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
          onPress={() => setThemeMode(isDark ? 'light' : 'dark')}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 18 }}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.brandRow}>
          <View style={[styles.logomark, { backgroundColor: tokens.tealLight }]}>
            <Text style={[styles.logomarkSymbol, { color: tokens.teal }]}>₦</Text>
          </View>
          <Text style={styles.wordmark}>
            <Text style={[styles.wordmarkPenny, { color: tokens.text1 }]}>Penny</Text>
            <Text style={{ color: tokens.teal }}>Wise</Text>
          </Text>
        </View>

        {/* Heading */}
        <Text style={[styles.heading, { color: tokens.text1 }]}>Welcome back 👋</Text>
        <Text style={[styles.subtext, { color: tokens.text2 }]}>Log in to check your score</Text>

        {/* Email */}
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
              color: tokens.text1,
            },
            emailFocused && { borderColor: tokens.teal },
          ]}
          placeholder="tunde@gmail.com"
          placeholderTextColor={tokens.text3}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setEmailFocused(true)}
          onBlur={() => setEmailFocused(false)}
        />

        {/* Password */}
        <View
          style={[
            styles.passwordWrap,
            {
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
            },
            passFocused && { borderColor: tokens.teal },
          ]}
        >
          <TextInput
            style={[styles.passwordInput, { color: tokens.text1 }]}
            placeholder="Password"
            placeholderTextColor={tokens.text3}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            onFocus={() => setPassFocused(true)}
            onBlur={() => setPassFocused(false)}
          />
          <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={8}>
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        </View>

        {/* Forgot */}
        <TouchableOpacity style={styles.forgotRow}>
          <Text style={[styles.forgotText, { color: tokens.teal }]}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Error */}
        {error ? <Text style={[styles.errorText, { color: tokens.danger }]}>{error}</Text> : null}

        {/* Primary CTA */}
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            { backgroundColor: tokens.teal },
            loading && styles.primaryBtnDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={[styles.primaryBtnText, { color: tokens.surface }]}>
            {loading ? 'Logging in…' : 'Log in'}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: tokens.border }]} />
          <Text style={[styles.dividerLabel, { color: tokens.text3 }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: tokens.border }]} />
        </View>

        {/* Google */}
        <TouchableOpacity
          style={[
            styles.outlinedBtn,
            {
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
            },
          ]}
          activeOpacity={0.8}
        >
          <Text style={[styles.googleG, { color: tokens.text1 }]}>G</Text>
          <Text style={[styles.outlinedBtnText, { color: tokens.text1 }]}>
            Continue with Google
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          style={styles.footerRow}
        >
          <Text style={[styles.footerText, { color: tokens.text2 }]}>
            New here?{' '}
            <Text style={{ fontFamily: FontFamily.bodySemiBold, color: tokens.teal }}>Sign up</Text>
          </Text>
        </TouchableOpacity>

        {/* ── DEV ONLY — remove before production ────────────────── */}
        <TouchableOpacity
          onPress={goHomeNow}
          style={[styles.devBypass, { borderColor: tokens.border }]}
        >
          <Text style={[styles.devBypassText, { color: tokens.text3 }]}>
            ⚡ Preview Home (dev bypass)
          </Text>
        </TouchableOpacity>
        {/* ─────────────────────────────────────────────────────────── */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    gap: 10,
  },
  logomark: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logomarkSymbol: {
    fontFamily: FontFamily.displayXBold,
    fontSize: 22,
  },
  wordmark: {
    fontFamily: FontFamily.displayXBold,
    fontSize: 22,
  },
  wordmarkPenny: {
    fontWeight: '800',
  },
  heading: {
    fontFamily: FontFamily.display,
    fontSize: 26,
    marginBottom: 6,
  },
  subtext: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    marginBottom: 32,
  },
  input: {
    height: 52,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 20,
    fontFamily: FontFamily.body,
    fontSize: 15,
    marginBottom: 12,
  },
  inputFocused: {
    borderColor: '#0f766e',
  },
  passwordWrap: {
    height: 52,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: 15,
  },
  eyeIcon: {
    fontSize: 18,
    paddingLeft: 8,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    fontFamily: FontFamily.body,
    fontSize: 13,
  },
  errorText: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  primaryBtn: {
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    fontFamily: FontFamily.display,
    fontSize: 16,
    letterSpacing: 0.2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    fontFamily: FontFamily.body,
    fontSize: 13,
  },
  outlinedBtn: {
    height: 52,
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
  },
  googleG: {
    fontFamily: FontFamily.displayXBold,
    fontSize: 16,
  },
  outlinedBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
  },
  footerRow: {
    alignItems: 'center',
  },
  footerText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
  },
  devBypass: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
  },
  devBypassText: {
    fontFamily: FontFamily.body,
    fontSize: 13,
  },
});
