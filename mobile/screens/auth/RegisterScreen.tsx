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
import { Colors, Radius, FontFamily } from '@/tokens';

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

function strengthColor(score: number): string {
  if (score === 0) return Colors.border;
  if (score === 1) return Colors.danger;
  if (score === 2) return Colors.amber;
  return Colors.teal;
}

export default function RegisterScreen({ navigation }: Props) {
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
  const color = strengthColor(strength);

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
        <Text style={styles.heading}>Create account</Text>
        <Text style={styles.subtext}>Track your spending. Own your score.</Text>

        {/* Full name */}
        <TextInput
          style={[styles.input, nameFocused && styles.inputFocused]}
          placeholder="Full name"
          placeholderTextColor={Colors.text3}
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          onFocus={() => setNameFocused(true)}
          onBlur={() => setNameFocused(false)}
        />

        {/* Email */}
        <TextInput
          style={[styles.input, emailFocused && styles.inputFocused]}
          placeholder="Email"
          placeholderTextColor={Colors.text3}
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
          style={[styles.input, styles.dropdownTrigger, university !== '' && styles.inputSelected]}
          onPress={() => setShowUniPicker(true)}
          activeOpacity={0.8}
        >
          <Text style={university !== '' ? styles.dropdownValueText : styles.dropdownPlaceholder}>
            {university !== '' ? university : 'University'}
          </Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Monthly budget */}
        <View style={[styles.budgetWrap, budgetFocused && styles.inputFocused]}>
          <Text style={styles.budgetPrefix}>₦</Text>
          <TextInput
            style={styles.budgetInput}
            placeholder="0.00"
            placeholderTextColor={Colors.text3}
            value={monthlyBudget}
            onChangeText={setMonthlyBudget}
            keyboardType="numeric"
            onFocus={() => setBudgetFocused(true)}
            onBlur={() => setBudgetFocused(false)}
          />
        </View>
        <Text style={styles.budgetHint}>we won't judge 👀</Text>

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

        {/* Strength bar */}
        {password.length > 0 && (
          <View style={styles.strengthRow}>
            {[0, 1, 2, 3].map(i => (
              <View
                key={i}
                style={[
                  styles.strengthSegment,
                  { backgroundColor: i < strength ? color : Colors.border },
                ]}
              />
            ))}
          </View>
        )}

        {/* Error */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Primary CTA */}
        <TouchableOpacity
          style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>
            {loading ? 'Creating account…' : 'Create account'}
          </Text>
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
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.footerRow}>
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text style={styles.footerLink}>Log in</Text>
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
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Select University</Text>
          <FlatList
            data={UNIVERSITIES}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  item === university && styles.modalItemSelected,
                ]}
                onPress={() => {
                  setUniversity(item);
                  setShowUniPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    item === university && styles.modalItemTextSelected,
                  ]}
                >
                  {item}
                </Text>
                {item === university && (
                  <Text style={styles.checkmark}>✓</Text>
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
  inputSelected: {
    borderColor: Colors.teal,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownPlaceholder: {
    fontFamily: FontFamily.body,
    fontSize: 15,
    color: Colors.text3,
  },
  dropdownValueText: {
    fontFamily: FontFamily.body,
    fontSize: 15,
    color: Colors.teal,
  },
  chevron: {
    fontSize: 20,
    color: Colors.text3,
    transform: [{ rotate: '90deg' }],
  },
  budgetWrap: {
    height: 52,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  budgetPrefix: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.text2,
    marginRight: 6,
  },
  budgetInput: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: 15,
    color: Colors.text1,
  },
  budgetHint: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.text3,
    marginBottom: 12,
    paddingLeft: 20,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: FontFamily.display,
    fontSize: 17,
    color: Colors.text1,
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
    borderBottomColor: Colors.border,
  },
  modalItemSelected: {
    backgroundColor: Colors.tealLight,
  },
  modalItemText: {
    fontFamily: FontFamily.body,
    fontSize: 15,
    color: Colors.text1,
  },
  modalItemTextSelected: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.teal,
  },
  checkmark: {
    fontSize: 16,
    color: Colors.teal,
  },
});
