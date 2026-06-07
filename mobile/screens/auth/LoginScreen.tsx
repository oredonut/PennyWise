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
import { supabase } from '@/lib/supabase';
import { Colors, Radius, FontFamily } from '@/tokens';

type RootStackParamList = { Login: undefined; Register: undefined; Home: undefined };
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Login'> };

export default function LoginScreen({ navigation }: Props) {
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
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.brandRow}>
          <View style={styles.logomark}>
            <Text style={styles.logomarkSymbol}>₦</Text>
          </View>
          <Text style={styles.wordmark}>
            <Text style={styles.wordmarkPenny}>Penny</Text>
            <Text style={styles.wordmarkWise}>Wise</Text>
          </Text>
        </View>

        {/* Heading */}
        <Text style={styles.heading}>Welcome back 👋</Text>
        <Text style={styles.subtext}>Log in to check your score</Text>

        {/* Email */}
        <TextInput
          style={[styles.input, emailFocused && styles.inputFocused]}
          placeholder="tunde@gmail.com"
          placeholderTextColor={Colors.text3}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setEmailFocused(true)}
          onBlur={() => setEmailFocused(false)}
        />

        {/* Password */}
        <View style={[styles.passwordWrap, passFocused && styles.inputFocused]}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor={Colors.text3}
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
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Error */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Primary CTA */}
        <TouchableOpacity
          style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>{loading ? 'Logging in…' : 'Log in'}</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google */}
        <TouchableOpacity style={styles.outlinedBtn} activeOpacity={0.8}>
          <Text style={styles.googleG}>G</Text>
          <Text style={styles.outlinedBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Footer */}
        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.footerRow}>
          <Text style={styles.footerText}>
            New here?{' '}
            <Text style={styles.footerLink}>Sign up</Text>
          </Text>
        </TouchableOpacity>

        {/* ── DEV ONLY — remove before production ────────────────── */}
        <TouchableOpacity onPress={goHomeNow} style={styles.devBypass}>
          <Text style={styles.devBypassText}>⚡ Preview Home (dev bypass)</Text>
        </TouchableOpacity>
        {/* ─────────────────────────────────────────────────────────── */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
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
    backgroundColor: Colors.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logomarkSymbol: {
    fontFamily: FontFamily.displayXBold,
    fontSize: 22,
    color: Colors.teal,
  },
  wordmark: {
    fontFamily: FontFamily.displayXBold,
    fontSize: 22,
  },
  wordmarkPenny: {
    color: Colors.text1,
  },
  wordmarkWise: {
    color: Colors.teal,
  },
  heading: {
    fontFamily: FontFamily.display,
    fontSize: 26,
    color: Colors.text1,
    marginBottom: 6,
  },
  subtext: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    color: Colors.text2,
    marginBottom: 32,
  },
  input: {
    height: 52,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    fontFamily: FontFamily.body,
    fontSize: 15,
    color: Colors.text1,
    marginBottom: 12,
  },
  inputFocused: {
    borderColor: Colors.teal,
  },
  passwordWrap: {
    height: 52,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: 15,
    color: Colors.text1,
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
    color: Colors.teal,
  },
  errorText: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    color: Colors.danger,
    marginBottom: 12,
    textAlign: 'center',
  },
  primaryBtn: {
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: Colors.teal,
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
    color: Colors.surface,
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
    backgroundColor: Colors.border,
  },
  dividerLabel: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    color: Colors.text3,
  },
  outlinedBtn: {
    height: 52,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
  },
  googleG: {
    fontFamily: FontFamily.displayXBold,
    fontSize: 16,
    color: Colors.text1,
  },
  outlinedBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.text1,
  },
  footerRow: {
    alignItems: 'center',
  },
  footerText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    color: Colors.text2,
  },
  footerLink: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.teal,
  },
  // DEV ONLY — remove before production
  devBypass: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 10,
  },
  devBypassText: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    color: Colors.text3,
  },
});
