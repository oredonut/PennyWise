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
import { EyeIcon } from './EyeIcon';

// design.md §inputs — full focus treatment: teal border + tinted background
// + 3px ring (vs. the previous border-colour-only change).
const focusStyle = {
  borderColor: '#0f766e',
  backgroundColor: 'rgba(204,251,241,0.18)',
  boxShadow: '0 0 0 3px rgba(15,118,110,0.12)',
} as const;

type RootStackParamList = { Login: undefined; Register: undefined; Otp: { email: string } };
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Register'> };

function getStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/\d/.test(pw)) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

function strengthColor(score: number, tokens: any): string {
  if (score === 0) return tokens.border;
  if (score === 1) return tokens.danger;
  if (score === 2) return tokens.amber;
  return tokens.teal;
}

export default function RegisterScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const strength = getStrength(password);
  const color = strengthColor(strength, tokens);

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      // Email/password only — profile fields (name/university/budget) are
      // collected on Profile Setup, after OTP verification.
      const { error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) {
        setError(authError.message);
        return;
      }
      // Email confirmation is required (mailer_autoconfirm = false), so signUp
      // returns no session — the user must verify a code. Pass the email along
      // for verifyOtp on the next screen.
      navigation.navigate('Otp', { email });
    } catch (e: any) {
      // Network / unexpected failure — surface instead of an unhandled rejection.
      setError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: tokens.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
        <Text style={[styles.heading, { color: tokens.text1 }]}>Create account</Text>
        <Text style={[styles.subtext, { color: tokens.text2 }]}>Track your spending. Own your score.</Text>

        {/* Email */}
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
              color: tokens.text1,
            },
            emailFocused && focusStyle,
          ]}
          placeholder="Email"
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
            passFocused && focusStyle,
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
          <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={8} style={{ paddingLeft: 8 }}>
            <EyeIcon off={showPassword} color={tokens.text3} />
          </TouchableOpacity>
        </View>

        {/* Strength bar */}
        {password.length > 0 && (
          <View style={styles.strengthRow}>
            {[0, 1, 2, 3].map(i => (
              <View
                key={i}
                style={[
                  styles.strengthSegment,
                  { backgroundColor: i < strength ? color : tokens.border },
                ]}
              />
            ))}
          </View>
        )}

        {/* Error */}
        {error ? <Text style={[styles.errorText, { color: tokens.danger }]}>{error}</Text> : null}

        {/* Primary CTA */}
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            { backgroundColor: tokens.teal },
            loading && styles.primaryBtnDisabled,
          ]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={[styles.primaryBtnText, { color: tokens.surface }]}>
            {loading ? 'Creating account…' : 'Create account'}
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.footerRow}>
          <Text style={[styles.footerText, { color: tokens.text2 }]}>
            Already have an account?{' '}
            <Text style={{ fontFamily: FontFamily.bodySemiBold, color: tokens.teal }}>Log in</Text>
          </Text>
        </TouchableOpacity>
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
  strengthRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
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
  footerRow: {
    alignItems: 'center',
  },
  footerText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
  },
});
