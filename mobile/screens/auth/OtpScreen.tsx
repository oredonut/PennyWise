// ============================================================
// OTP Verification (screen 05).
//
// Reached after Signup. Email confirmation is required on this project
// (mailer_autoconfirm = false), so signUp returns no session — the user must
// enter the 6-digit code from their email. verifyOtp({ type: 'signup' })
// returns a session on success, which then unlocks Profile Setup.
//
// design.md has no copy spec for this screen (only the §8 inventory row + a
// "pw-shake on wrong OTP" motion note), so copy is sourced from the same brand
// tone as Onboarding, and the wrong-code shake follows that motion note.
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Pressable,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '../../lib/supabase';
import { Radius, FontFamily } from '../../tokens';
import { useTheme } from '../../lib/useTheme';
import { ScribbleLayer } from '../../src/components/ScribbleLayer';
import { SubHeader } from '../../src/components/SubHeader';

type RootStackParamList = {
  Otp: { email: string };
  ProfileSetup: undefined;
  Login: undefined;
};
type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Otp'>;
  route: RouteProp<RootStackParamList, 'Otp'>;
};

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 30; // seconds

export default function OtpScreen({ navigation, route }: Props) {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const email = route.params?.email ?? '';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const inputRef = useRef<TextInput>(null);
  const shake = useRef(new Animated.Value(0)).current;

  // Resend cooldown ticker.
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  // ±6px horizontal shake, ~0.32s — matches design.md's pw-shake spec.
  const runShake = () => {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 6, duration: 80, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -6, duration: 80, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 4, duration: 80, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 80, easing: Easing.linear, useNativeDriver: true }),
    ]).start();
  };

  const handleVerify = async (submitted: string) => {
    if (submitted.length !== CODE_LENGTH || loading) return;
    setError('');
    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: submitted,
        type: 'signup',
      });
      if (verifyError) {
        setError(verifyError.message);
        setCode('');
        runShake();
        return;
      }
      // Session now exists → on to Profile Setup. Reset so the verified user
      // can't navigate back into Signup/OTP.
      navigation.reset({ index: 0, routes: [{ name: 'ProfileSetup' }] });
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
      runShake();
    } finally {
      setLoading(false);
    }
  };

  const onChangeCode = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (error) setError('');
    if (digits.length === CODE_LENGTH) handleVerify(digits);
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    setError('');
    try {
      const { error: resendError } = await supabase.auth.resend({ type: 'signup', email });
      if (resendError) {
        setError(resendError.message);
        return;
      }
      setResendIn(RESEND_COOLDOWN);
    } catch (e: any) {
      setError(e?.message ?? 'Could not resend the code. Try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: tokens.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScribbleLayer color={tokens.doodle} />

      <View style={[styles.content, { paddingTop: insets.top + 48 }]}>
        {/* Back */}
        <SubHeader onBack={() => navigation.goBack()} style={{ marginBottom: 24 }} />

        {/* Heading */}
        <Text style={[styles.heading, { color: tokens.text1 }]}>Check your inbox 📬</Text>
        <Text style={[styles.subtext, { color: tokens.text2 }]}>
          We sent a 6-digit code to{' '}
          <Text style={{ fontFamily: FontFamily.bodySemiBold, color: tokens.text1 }}>
            {email || 'your email'}
          </Text>
          . Pop it in to verify.
        </Text>

        {/* Code cells (tap anywhere focuses the hidden input) */}
        <Pressable onPress={() => inputRef.current?.focus()}>
          <Animated.View style={[styles.cellsRow, { transform: [{ translateX: shake }] }]}>
            {Array.from({ length: CODE_LENGTH }).map((_, i) => {
              const char = code[i] ?? '';
              const isActive = i === code.length;
              return (
                <View
                  key={i}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: tokens.surface,
                      borderColor: error ? tokens.danger : isActive ? tokens.teal : tokens.border,
                    },
                  ]}
                >
                  <Text style={[styles.cellText, { color: tokens.text1 }]}>{char}</Text>
                </View>
              );
            })}
          </Animated.View>

          {/* Hidden capture input */}
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={onChangeCode}
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            autoFocus
            caretHidden
            textContentType="oneTimeCode"
            style={styles.hiddenInput}
          />
        </Pressable>

        {/* Error */}
        {error ? <Text style={[styles.errorText, { color: tokens.danger }]}>{error}</Text> : null}

        {/* Verify */}
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            { backgroundColor: tokens.teal },
            (loading || code.length !== CODE_LENGTH) && styles.primaryBtnDisabled,
          ]}
          onPress={() => handleVerify(code)}
          disabled={loading || code.length !== CODE_LENGTH}
          activeOpacity={0.85}
        >
          <Text style={[styles.primaryBtnText, { color: tokens.surface }]}>
            {loading ? 'Verifying…' : 'Verify'}
          </Text>
        </TouchableOpacity>

        {/* Resend */}
        <TouchableOpacity onPress={handleResend} disabled={resendIn > 0} style={styles.resendRow}>
          <Text style={[styles.resendText, { color: resendIn > 0 ? tokens.text3 : tokens.teal }]}>
            {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Didn’t get it? Resend code'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, zIndex: 1 },
  heading: {
    fontFamily: FontFamily.display,
    fontSize: 26,
    marginBottom: 8,
  },
  subtext: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 32,
  },
  cellsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  cell: {
    flex: 1,
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontFamily: FontFamily.displayXBold,
    fontSize: 22,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: 56,
  },
  errorText: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
  },
  primaryBtn: {
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
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
  resendRow: {
    alignItems: 'center',
  },
  resendText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
  },
});
