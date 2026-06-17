// ============================================================
// Profile Setup (screen 06).
//
// Only reachable after verifyOtp succeeds, so a session already exists — no
// extra auth gate here. Collects the identity/budget fields that used to live
// inline on Signup, and persists them via PATCH /api/profile
// (fullName/university → user_metadata, monthlyBudget → users.monthly_income).
// ============================================================

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
import { Radius, FontFamily } from '../../tokens';
import { useTheme } from '../../lib/useTheme';
import { apiPatch } from '../../hooks/useApi';

type RootStackParamList = { ProfileSetup: undefined; MainTabs: undefined };
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'ProfileSetup'> };

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

export default function ProfileSetupScreen({ navigation }: Props) {
  const { tokens, isDark, setThemeMode } = useTheme();
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [showUniPicker, setShowUniPicker] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [nameFocused, setNameFocused] = useState(false);
  const [budgetFocused, setBudgetFocused] = useState(false);

  const handleSubmit = async () => {
    setError('');

    // Client-side validation before hitting the API.
    if (!fullName.trim()) {
      setError('Please enter your name.');
      return;
    }
    const budgetNum = parseFloat(monthlyBudget);
    if (!Number.isFinite(budgetNum) || budgetNum <= 0) {
      setError('Enter a monthly budget greater than ₦0.');
      return;
    }

    setLoading(true);
    try {
      await apiPatch('/api/profile', {
        fullName: fullName.trim(),
        university: university || null,
        monthlyBudget: budgetNum,
      });
      // Reset so the back-button can't return into the auth/setup stack.
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (e: any) {
      setError(e?.message ?? 'Could not save your profile. Please try again.');
    } finally {
      setLoading(false);
    }
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
        <Text style={[styles.heading, { color: tokens.text1 }]}>Set up your profile</Text>
        <Text style={[styles.subtext, { color: tokens.text2 }]}>Almost there — tell us a bit about you.</Text>

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

        {/* Error */}
        {error ? <Text style={[styles.errorText, { color: tokens.danger }]}>{error}</Text> : null}

        {/* Primary CTA */}
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            { backgroundColor: tokens.teal },
            loading && styles.primaryBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={[styles.primaryBtnText, { color: tokens.surface }]}>
            {loading ? 'Saving…' : 'Finish setup'}
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
