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
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '@/lib/supabase';
import { Radius, FontFamily } from '@/tokens';
import { useTheme } from '../../lib/useTheme';

type RootStackParamList = { Login: undefined; Register: undefined };
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Register'> };

const UNIVERSITIES = [
  'University of Lagos',
  'University of Ibadan',
  'OAU',
  'UNILORIN',
  'ABU Zaria',
  'FUTA',
  'LASU',
  'Covenant University',
  'Babcock University',
  'Other',
];

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
  const { tokens, isDark, setThemeMode } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [university, setUniversity] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showUniPicker, setShowUniPicker] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [budgetFocused, setBudgetFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const strength = getStrength(password);
  const color = strengthColor(strength, tokens);

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          university,
          monthly_budget: parseFloat(monthlyBudget) || 0,
        },
      },
    });
    setLoading(false);
    if (authError) setError(authError.message);
  };

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
        <Text style={[styles.heading, { color: tokens.text1 }]}>Create account</Text>
        <Text style={[styles.subtext, { color: tokens.text2 }]}>Track your spending. Own your score.</Text>

        {/* Full name */}
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
              color: tokens.text1,
            },
            nameFocused && { borderColor: tokens.teal },
          ]}
          placeholder="Full name"
          placeholderTextColor={tokens.text3}
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          onFocus={() => setNameFocused(true)}
          onBlur={() => setNameFocused(false)}
        />

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

        {/* University dropdown trigger */}
        <TouchableOpacity
          style={[
            styles.input,
            styles.dropdownTrigger,
            {
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
            },
            university !== '' && { borderColor: tokens.teal },
          ]}
          onPress={() => setShowUniPicker(true)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.dropdownPlaceholder,
              university !== '' && { color: tokens.teal },
            ]}
          >
            {university !== '' ? university : 'University'}
          </Text>
          <Text style={[styles.chevron, { color: tokens.text3 }]}>›</Text>
        </TouchableOpacity>

        {/* Monthly budget */}
        <View
          style={[
            styles.budgetWrap,
            {
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
            },
            budgetFocused && { borderColor: tokens.teal },
          ]}
        >
          <Text style={[styles.budgetPrefix, { color: tokens.text2 }]}>₦</Text>
          <TextInput
            style={[styles.budgetInput, { color: tokens.text1 }]}
            placeholder="0.00"
            placeholderTextColor={tokens.text3}
            value={monthlyBudget}
            onChangeText={setMonthlyBudget}
            keyboardType="numeric"
            onFocus={() => setBudgetFocused(true)}
            onBlur={() => setBudgetFocused(false)}
          />
        </View>
        <Text style={[styles.budgetHint, { color: tokens.text3 }]}>we won't judge 👀</Text>

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
          <Text style={[styles.outlinedBtnText, { color: tokens.text1 }]}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Footer */}
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.footerRow}>
          <Text style={[styles.footerText, { color: tokens.text2 }]}>
            Already have an account?{' '}
            <Text style={{ fontFamily: FontFamily.bodySemiBold, color: tokens.teal }}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* University picker modal */}
      <Modal
        visible={showUniPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUniPicker(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowUniPicker(false)} />
        <View style={[styles.modalSheet, { backgroundColor: tokens.surface }]}>
          <View style={[styles.modalHandle, { backgroundColor: tokens.border }]} />
          <Text style={[styles.modalTitle, { color: tokens.text1 }]}>Select University</Text>
          <FlatList
            data={UNIVERSITIES}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  { borderBottomColor: tokens.border },
                  item === university && { backgroundColor: tokens.tealLight },
                ]}
                onPress={() => {
                  setUniversity(item);
                  setShowUniPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    { color: tokens.text1 },
                    item === university && { fontFamily: FontFamily.bodySemiBold, color: tokens.teal },
                  ]}
                >
                  {item}
                </Text>
                {item === university && (
                  <Text style={[styles.checkmark, { color: tokens.teal }]}>✓</Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
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
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownPlaceholder: {
    fontFamily: FontFamily.body,
    fontSize: 15,
  },
  chevron: {
    fontSize: 20,
    transform: [{ rotate: '90deg' }],
  },
  budgetWrap: {
    height: 52,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  budgetPrefix: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    marginRight: 6,
  },
  budgetInput: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: 15,
  },
  budgetHint: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    marginBottom: 12,
    paddingLeft: 20,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: FontFamily.display,
    fontSize: 17,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontFamily: FontFamily.body,
    fontSize: 15,
  },
  checkmark: {
    fontSize: 16,
  },
});
