// ============================================================
// PennyWise — Add Transaction (bottom-sheet style)
//
// Presented as a transparentModal stack screen with a custom
// slide-up animation (no bottom-sheet/datepicker native deps).
// On success it emits 'transactionAdded' so HomeTab refetches.
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Pressable,
  Animated, Easing, Dimensions, KeyboardAvoidingView, Platform,
  ActivityIndicator, StyleSheet, DeviceEventEmitter,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../lib/useTheme';
import { FontFamily, Radius } from '../tokens';
import { apiGet, apiPost } from '../hooks/useApi';
import { SkeletonBox, usePulse } from '../src/components/states';

type ApiCategory = { id: string; name: string; color?: string | null };
type SubmitResult = { score?: number; brokeScore?: number; streak?: number };

const SCREEN_H = Dimensions.get('window').height;

// Category-name → emoji (mirrors the backend lib/format map; /api/categories
// returns no emoji field, so we derive one client-side for the chips).
const EMOJI_MAP: ReadonlyArray<readonly [string, string]> = [
  ['food', '🍛'], ['feeding', '🍛'], ['transport', '🚌'], ['data', '📱'], ['airtime', '📱'],
  ['leisure', '🎲'], ['hangout', '🎲'], ['fun', '🎲'], ['groceries', '🛒'], ['rent', '🏠'],
  ['savings', '💰'], ['subscription', '📺'], ['school', '📚'], ['misc', '⚙️'], ['other', '⚙️'],
];
function emojiForCategory(name: string): string {
  const n = (name ?? '').toLowerCase();
  for (const [k, e] of EMOJI_MAP) if (n.includes(k)) return e;
  return '💳';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function dateLabel(d: Date): string {
  const diff = Math.round((startOfDay(new Date()).getTime() - startOfDay(d).getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function formatDigits(digits: string): string {
  if (!digits) return '';
  const n = Number(digits);
  return Number.isFinite(n) ? n.toLocaleString('en-NG') : '';
}

export default function AddTransactionScreen({ navigation }: any) {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const pulse = usePulse();

  // ── Slide-up animation ──────────────────────────────────────
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  useEffect(() => {
    Animated.timing(translateY, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);
  const close = () => {
    Animated.timing(translateY, { toValue: SCREEN_H, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true })
      .start(() => navigation.goBack());
  };

  // ── Form state ──────────────────────────────────────────────
  const [activeType, setActiveType] = useState<'expense' | 'income'>('expense');
  const [amountDigits, setAmountDigits] = useState('');
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDays, setShowDays] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'weekly' | 'monthly'>('monthly');

  const amount = Number(amountDigits || '0');
  const amountInput = useRef<TextInput>(null);

  // ── Categories ──────────────────────────────────────────────
  const [cats, setCats] = useState<ApiCategory[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [catsError, setCatsError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ApiCategory | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet<{ categories: ApiCategory[] }>('/api/categories');
        setCats(res?.categories ?? []);
      } catch (e) {
        setCatsError(e instanceof Error ? e.message : 'Failed to load categories');
      } finally {
        setCatsLoading(false);
      }
    })();
  }, []);

  const dayOptions = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d;
  });

  // ── Submit ──────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const canSubmit = amount > 0 && !!selectedCategory && !submitting;

  const handleSubmit = async () => {
    if (!selectedCategory || amount <= 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await apiPost<SubmitResult>('/api/transactions', {
        name: merchant.trim() || selectedCategory.name,
        amount,
        type: activeType,
        categoryId: selectedCategory.id,
        occurredAt: selectedDate.toISOString(),
      });

      if (recurring) {
        await apiPost('/api/recurring', {
          categoryId: selectedCategory.id,
          amount,
          note: merchant,
          frequency: recurringFrequency,
        });
      }

      // Signal the dashboard to refresh (carries fresh score/brokeScore/streak).
      DeviceEventEmitter.emit('transactionAdded', result);
      close();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Could not log transaction');
      setSubmitting(false);
    }
  };

  const segActive = (on: boolean) => ({
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center' as const,
    backgroundColor: on ? tokens.teal : 'transparent',
  });

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} onPress={close} />

      <Animated.View
        style={{
          backgroundColor: tokens.bg,
          borderTopLeftRadius: Radius.xl,
          borderTopRightRadius: Radius.xl,
          maxHeight: '92%',
          transform: [{ translateY }],
          paddingBottom: insets.bottom + 16,
        }}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.handle, { backgroundColor: tokens.border }]} />

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
            {/* ── Header: title + type toggle ── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 20, color: tokens.text1 }}>Add transaction</Text>
              <TouchableOpacity onPress={close} hitSlop={10}>
                <Text style={{ fontSize: 20, color: tokens.text3 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', backgroundColor: tokens.surfaceTint, borderRadius: 10, padding: 3, marginBottom: 22 }}>
              <TouchableOpacity style={segActive(activeType === 'expense')} onPress={() => setActiveType('expense')} activeOpacity={0.85}>
                <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: activeType === 'expense' ? tokens.surface : tokens.text2 }}>Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity style={segActive(activeType === 'income')} onPress={() => setActiveType('income')} activeOpacity={0.85}>
                <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: activeType === 'income' ? tokens.surface : tokens.text2 }}>Income</Text>
              </TouchableOpacity>
            </View>

            {/* ── Amount ── */}
            <TouchableOpacity activeOpacity={1} onPress={() => amountInput.current?.focus()} style={{ alignItems: 'center', marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontFamily: FontFamily.mono, fontSize: 40, color: tokens.text1, fontWeight: '700' }}>₦</Text>
                <TextInput
                  ref={amountInput}
                  value={formatDigits(amountDigits)}
                  onChangeText={(t) => setAmountDigits(t.replace(/[^0-9]/g, '').slice(0, 9))}
                  placeholder="0"
                  placeholderTextColor={tokens.text3}
                  keyboardType="number-pad"
                  style={{ fontFamily: FontFamily.mono, fontSize: 40, color: tokens.text1, fontWeight: '700', minWidth: 60, padding: 0 }}
                />
              </View>
            </TouchableOpacity>

            {/* ── Category picker ── */}
            <Text style={styles.label(tokens)}>Category</Text>
            {catsLoading ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
                {[0, 1, 2, 3].map((i) => (
                  <SkeletonBox key={i} pulse={pulse} style={{ width: 90, height: 40, borderRadius: 999, marginRight: 8 }} />
                ))}
              </ScrollView>
            ) : catsError ? (
              <Text style={{ fontFamily: FontFamily.body, fontSize: 12, color: tokens.danger, marginBottom: 18 }}>{catsError}</Text>
            ) : cats.length === 0 ? (
              <Text style={{ fontFamily: FontFamily.body, fontSize: 12, color: tokens.text3, marginBottom: 18 }}>
                No categories yet — set them up first.
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }} contentContainerStyle={{ gap: 8 }}>
                {cats.map((c) => {
                  const selected = selectedCategory?.id === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setSelectedCategory(c)}
                      activeOpacity={0.8}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                        paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999,
                        backgroundColor: tokens.surface,
                        borderWidth: selected ? 2 : 1,
                        borderColor: selected ? tokens.teal : tokens.border,
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>{emojiForCategory(c.name)}</Text>
                      <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: selected ? tokens.teal : tokens.text1 }}>{c.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* ── Merchant ── */}
            <Text style={styles.label(tokens)}>Merchant</Text>
            <TextInput
              value={merchant}
              onChangeText={setMerchant}
              placeholder="Where did you spend?"
              placeholderTextColor={tokens.text3}
              style={styles.input(tokens)}
            />

            {/* ── Note ── */}
            <Text style={styles.label(tokens)}>Note</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a note (optional)"
              placeholderTextColor={tokens.text3}
              style={styles.input(tokens)}
            />

            {/* ── Date ── */}
            <Text style={styles.label(tokens)}>Date</Text>
            <TouchableOpacity onPress={() => setShowDays((v) => !v)} activeOpacity={0.8} style={[styles.input(tokens), { justifyContent: 'center' }]}>
              <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: tokens.text1 }}>{dateLabel(selectedDate)}</Text>
            </TouchableOpacity>
            {showDays && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }} contentContainerStyle={{ gap: 8 }}>
                {dayOptions.map((d) => {
                  const selected = startOfDay(d).getTime() === startOfDay(selectedDate).getTime();
                  return (
                    <TouchableOpacity
                      key={d.toISOString()}
                      onPress={() => { setSelectedDate(d); setShowDays(false); }}
                      activeOpacity={0.8}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
                        backgroundColor: selected ? tokens.teal : tokens.surface,
                        borderWidth: 1, borderColor: selected ? tokens.teal : tokens.border,
                      }}
                    >
                      <Text style={{ fontFamily: FontFamily.body, fontSize: 12, color: selected ? tokens.surface : tokens.text1 }}>{dateLabel(d)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* ── Recurring ── */}
            <TouchableOpacity
              onPress={() => setRecurring((v) => !v)}
              activeOpacity={0.8}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}
            >
              <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: tokens.text1 }}>Repeat this?</Text>
              <View style={{ width: 46, height: 28, borderRadius: 999, backgroundColor: recurring ? tokens.teal : tokens.surfaceTint, padding: 3, justifyContent: 'center' }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: tokens.surface, alignSelf: recurring ? 'flex-end' : 'flex-start' }} />
              </View>
            </TouchableOpacity>
            {recurring && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                {(['weekly', 'monthly'] as const).map((f) => {
                  const selected = recurringFrequency === f;
                  return (
                    <TouchableOpacity
                      key={f}
                      onPress={() => setRecurringFrequency(f)}
                      activeOpacity={0.8}
                      style={{
                        flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                        backgroundColor: selected ? tokens.tealLight : tokens.surface,
                        borderWidth: selected ? 2 : 1, borderColor: selected ? tokens.teal : tokens.border,
                      }}
                    >
                      <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: selected ? tokens.teal : tokens.text2, textTransform: 'capitalize' }}>{f}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* ── Error ── */}
            {submitError ? (
              <Text style={{ fontFamily: FontFamily.body, fontSize: 13, color: tokens.danger, textAlign: 'center', marginTop: 16 }}>{submitError}</Text>
            ) : null}

            {/* ── Submit ── */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!canSubmit}
              activeOpacity={0.85}
              style={{
                height: 52, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center',
                backgroundColor: tokens.teal, marginTop: 22, opacity: canSubmit ? 1 : 0.5,
              }}
            >
              {submitting ? (
                <ActivityIndicator color={tokens.surface} />
              ) : (
                <Text style={{ fontFamily: FontFamily.display, fontSize: 16, color: tokens.surface, letterSpacing: 0.2 }}>
                  {activeType === 'income' ? 'Log income' : 'Log it'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = {
  handle: {
    width: 40, height: 4, borderRadius: 2, alignSelf: 'center' as const, marginTop: 10, marginBottom: 8,
  } as any,
  label: (tokens: any) => ({
    fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: tokens.text3, marginBottom: 8,
  }),
  input: (tokens: any) => ({
    height: 48, borderRadius: Radius.pill, borderWidth: 1, borderColor: tokens.border,
    backgroundColor: tokens.surface, paddingHorizontal: 18, marginBottom: 14,
    fontFamily: FontFamily.body, fontSize: 15, color: tokens.text1,
  }),
};
