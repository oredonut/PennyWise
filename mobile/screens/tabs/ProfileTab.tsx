// ============================================================
// PennyWise — ProfileTab (Settings)
//
// A standard grouped-list settings screen: compact identity header +
// condensed streak/badge summary, then sectioned cards (Account, Budget,
// Preferences, Support, Account actions). The old "Toggle Limit" placeholder
// is replaced by a real budget editor (PATCH /api/profile → monthly_income),
// and there's a real log-out confirm + soft-delete-account flow.
// ============================================================

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl, Modal, Pressable,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, DeviceEventEmitter,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';

import { ScribbleLayer } from '../../src/components/ScribbleLayer';
import { SkeletonBox, usePulse } from '../../src/components/states';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import { Toggle } from '../../src/components/Toggle';
import { Toast } from '../../src/components/Toast';
import { useTheme } from '../../lib/useTheme';
import { FontFamily, Radius } from '../../tokens';
import { supabase } from '../../lib/supabase';
import { formatNaira } from '../../utils/currency';
import { useProfile, useStreaks, useBadges, useCategories, deleteAccount, updateCategoryBudget } from '../../hooks/useApi';
import { mkCard } from './cardStyle';
import appConfig from '../../app.json';

const APP_VERSION = appConfig.expo?.version ?? '1.0.0';
const NOTIF_KEY = '@pennywise_notifications_enabled';

// Row-list card: like mkCard but no inner padding (rows own their padding so
// dividers can run edge-to-edge) and clipped corners.
const listCard = (tokens: any) => ({
  backgroundColor: tokens.surface,
  borderRadius: Radius.lg,
  marginHorizontal: 16,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: tokens.border,
  overflow: 'hidden' as const,
  shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
});

function formatDigits(d: string): string {
  if (!d) return '';
  const n = Number(d);
  return Number.isFinite(n) ? n.toLocaleString('en-NG') : '';
}

// Category-name → emoji for the budget rows (the API returns no emoji field).
const CAT_EMOJI: ReadonlyArray<readonly [string, string]> = [
  ['food', '🍛'], ['feeding', '🍛'], ['transport', '🚌'], ['data', '📱'], ['airtime', '📱'],
  ['leisure', '🎲'], ['hangout', '🎲'], ['fun', '🎲'], ['groceries', '🛒'], ['rent', '🏠'],
  ['savings', '💰'], ['subscription', '📺'], ['school', '📚'], ['misc', '⚙️'], ['other', '⚙️'],
];
function categoryEmoji(name: string): string {
  const n = (name ?? '').toLowerCase();
  for (const [k, e] of CAT_EMOJI) if (n.includes(k)) return e;
  return '💳';
}

// ── Small primitives ─────────────────────────────────────────
function Chevron({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PencilIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 20h9" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SectionLabel({ children }: { children: string }) {
  const { tokens } = useTheme();
  return (
    <Text style={{
      fontFamily: FontFamily.display, fontSize: 11, letterSpacing: 1.3,
      color: tokens.text3, textTransform: 'uppercase',
      marginLeft: 16, marginBottom: 8, marginTop: 18,
    }}>
      {children}
    </Text>
  );
}

function Divider() {
  const { tokens } = useTheme();
  // Inset past the leading-icon column (14 pad + 30 icon + 12 gap).
  return <View style={{ height: 1, backgroundColor: tokens.border, marginLeft: 56 }} />;
}

// Standard settings row: leading icon chip · label · (value) · trailing.
function SettingsRow({
  emoji, label, value, onPress, right, danger, disabled,
}: {
  emoji: string;
  label: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}) {
  const { tokens } = useTheme();
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 48, paddingVertical: 10, paddingHorizontal: 14, opacity: disabled ? 0.5 : 1 }}>
      <View style={{ width: 30, height: 30, borderRadius: Radius.sm, backgroundColor: danger ? tokens.dangerLight : tokens.surfaceTint, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <Text style={{ fontSize: 15 }}>{emoji}</Text>
      </View>
      <Text style={{ flex: 1, fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: danger ? tokens.danger : tokens.text1 }}>{label}</Text>
      {value ? (
        <Text numberOfLines={1} style={{ fontFamily: FontFamily.body, fontSize: 13, color: tokens.text3, marginRight: 6, maxWidth: 150 }}>{value}</Text>
      ) : null}
      {right ? right : onPress ? <Chevron color={tokens.text3} /> : null}
    </View>
  );
  if (onPress && !disabled) {
    return <TouchableOpacity activeOpacity={0.6} onPress={onPress}>{body}</TouchableOpacity>;
  }
  return body;
}

function StatCell({ emoji, num, label }: { emoji: string; num: string; label: string }) {
  const { tokens } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 18, marginBottom: 2 }}>{emoji}</Text>
      <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 16, color: tokens.text1 }}>{num}</Text>
      <Text style={{ fontFamily: FontFamily.body, fontSize: 11, color: tokens.text3, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function ProfileSkeleton({ tokens }: { tokens: any }) {
  const pulse = usePulse();
  return (
    <View>
      <View style={[mkCard(tokens), { flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
        <SkeletonBox pulse={pulse} style={{ width: 62, height: 62, borderRadius: 31 }} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonBox pulse={pulse} style={{ height: 16, width: '60%' }} />
          <SkeletonBox pulse={pulse} style={{ height: 12, width: '40%' }} />
        </View>
      </View>
      <View style={[mkCard(tokens), { height: 92 }]} />
      <View style={[listCard(tokens), { height: 150 }]} />
      <View style={[listCard(tokens), { height: 100 }]} />
    </View>
  );
}

export default function ProfileTab({ navigation }: any) {
  const { tokens, themeMode, setThemeMode } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useProfile();
  const { data: streaks, refetch: refetchStreaks } = useStreaks();
  const { data: badgesData, refetch: refetchBadges } = useBadges();
  // Same source the dashboard's Category Budgets card is built from.
  const { data: catsData, refetch: refetchCats } = useCategories();

  const [email, setEmail] = useState('');
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Budget editor sheet — one editable digit-string per category id.
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [catBudgets, setCatBudgets] = useState<Record<string, string>>({});
  const [budgetSaving, setBudgetSaving] = useState(false);

  // Delete-account sheet
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const name = profile?.name ?? 'there';
  const university = profile?.university ?? '';
  const grade = profile?.grade ?? '—';
  const gradeLabel = profile?.gradeLabel ?? '';
  const memberSince = profile?.memberSince ?? '';
  const currentStreak = streaks?.currentStreak ?? 0;
  const longestStreak = streaks?.longestStreak ?? 0;
  const badges = badgesData?.badges ?? [];
  const unlocked = badges.filter((b) => b.status === 'Unlocked').length;

  const cats = catsData?.categories ?? [];
  // The Budget row shows the same figure the dashboard shows: Σ category budgets.
  const budgetTotal = cats.reduce((s, c) => s + (Number(c.monthly_budget) || 0), 0);
  const budgetLabel = cats.length > 0 ? formatNaira(budgetTotal) : 'Not set';
  // Live total of the in-progress edits (header of the sheet).
  const editTotal = cats.reduce((s, c) => s + (Number(catBudgets[c.id] || '0') || 0), 0);

  // Email comes from the auth session (not the profile payload).
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? '')).catch(() => {});
  }, []);

  // Notification master switch — persisted locally (does not yet gate server push).
  useEffect(() => {
    AsyncStorage.getItem(NOTIF_KEY).then((v) => { if (v != null) setNotifEnabled(v === '1'); }).catch(() => {});
  }, []);
  const toggleNotif = (v: boolean) => {
    setNotifEnabled(v);
    AsyncStorage.setItem(NOTIF_KEY, v ? '1' : '0').catch(() => {});
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchProfile(), refetchStreaks(), refetchBadges(), refetchCats()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchProfile, refetchStreaks, refetchBadges, refetchCats]);

  // ── Navigation away on session end (shared by log out + delete) ──
  const goToAuth = () => {
    const root = navigation?.getParent?.() ?? navigation;
    root?.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore — reset to Login regardless
    }
    goToAuth();
  };

  const confirmLogout = () => {
    Alert.alert('Log out?', 'You can log back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: handleLogout },
    ]);
  };

  const onConfirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      try { await supabase.auth.signOut(); } catch { /* ignore — still leave */ }
      goToAuth();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Could not delete your account. Try again.');
      setDeleting(false);
    }
  };

  // ── Budget editor (per category) ────────────────────────────
  const openBudget = () => {
    const init: Record<string, string> = {};
    for (const c of cats) init[c.id] = String(Math.round(Number(c.monthly_budget) || 0));
    setCatBudgets(init);
    setBudgetOpen(true);
  };

  const onSaveBudget = async () => {
    // Only PATCH categories whose value actually changed.
    const changed = cats.filter(
      (c) => Number(catBudgets[c.id] || '0') !== Math.round(Number(c.monthly_budget) || 0)
    );
    if (changed.length === 0) {
      setBudgetOpen(false);
      return;
    }
    // Each edited budget must be > 0 (the API rejects 0/empty).
    const invalid = changed.find((c) => !(Number(catBudgets[c.id] || '0') > 0));
    if (invalid) {
      Toast.show(`Enter an amount greater than ₦0 for ${invalid.name}`, 'error');
      return;
    }

    setBudgetSaving(true);
    const results = await Promise.allSettled(
      changed.map((c) => updateCategoryBudget(c.id, Number(catBudgets[c.id])))
    );
    const failed = changed.filter((_, i) => results[i].status === 'rejected');
    const anySucceeded = results.some((r) => r.status === 'fulfilled');

    // Reflect whatever landed — locally (Budget row total) and on the dashboard
    // (Home listens for 'transactionAdded' and refetches its dashboard query).
    if (anySucceeded) {
      refetchCats();
      DeviceEventEmitter.emit('transactionAdded');
    }

    if (failed.length > 0) {
      // Don't roll back the successes — surface only what failed, keep the
      // sheet open so the user can retry those rows.
      Toast.show(`Couldn't update: ${failed.map((c) => c.name).join(', ')}`, 'error');
      setBudgetSaving(false);
      return;
    }

    Toast.show('Budget updated', 'success');
    setBudgetSaving(false);
    setBudgetOpen(false);
  };

  // Stub destinations (no screens yet — surface a toast rather than dead taps).
  const comingSoon = () => Toast.show('Coming soon', 'info');
  const onAbout = () => Alert.alert('PennyWise', `Version ${APP_VERSION}`);

  const showSkeleton = profileLoading && !profile;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <ScribbleLayer color={tokens.doodle} />
      <ScrollView
        style={{ flex: 1, zIndex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.teal} colors={[tokens.teal]} />}
      >
        <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 28, color: tokens.text1, marginHorizontal: 16, marginTop: 12, marginBottom: 16 }}>
          Settings
        </Text>

        {showSkeleton ? (
          <ProfileSkeleton tokens={tokens} />
        ) : (
          <>
            {/* ── Identity header (tappable → edit) ── */}
            <TouchableOpacity
              onPress={comingSoon}
              activeOpacity={0.7}
              style={[mkCard(tokens), { flexDirection: 'row', alignItems: 'center', gap: 14 }]}
            >
              <View style={{
                width: 62, height: 62, borderRadius: 31,
                backgroundColor: tokens.tealLight, alignItems: 'center', justifyContent: 'center',
                borderWidth: 2, borderColor: tokens.teal,
              }}>
                <Text style={{ fontSize: 30 }}>🎓</Text>
                {/* Grade badge — neutral (no amber-creep), token letter (no '#fff'). */}
                <View style={{
                  position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: 11,
                  backgroundColor: tokens.surfaceTint, alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1.5, borderColor: tokens.surface,
                }}>
                  <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 11, color: tokens.text1 }}>{grade}</Text>
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 18, color: tokens.text1, marginBottom: 2 }}>{name}</Text>
                {university ? (
                  <Text style={{ fontFamily: FontFamily.body, fontSize: 13, color: tokens.text2 }}>{university}</Text>
                ) : null}
                <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 11, color: tokens.teal, marginTop: 4 }}>
                  {[gradeLabel, memberSince ? `Member since ${memberSince}` : ''].filter(Boolean).join(' · ')}
                </Text>
              </View>

              <PencilIcon color={tokens.teal} />
            </TouchableOpacity>

            {/* ── Condensed streak + badge summary ── */}
            <View style={mkCard(tokens)}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <StatCell emoji="🔥" num={`${currentStreak}`} label="Day streak" />
                <View style={{ width: 1, height: 30, backgroundColor: tokens.border }} />
                <StatCell emoji="🏆" num={`${longestStreak}`} label="Longest" />
                <View style={{ width: 1, height: 30, backgroundColor: tokens.border }} />
                <StatCell emoji="🏅" num={`${unlocked}/${badges.length}`} label="Badges" />
              </View>
              {badges.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                  {badges.map((b) => (
                    <View
                      key={b.id}
                      style={{
                        width: 34, height: 34, borderRadius: Radius.sm,
                        backgroundColor: tokens.surfaceTint, alignItems: 'center', justifyContent: 'center',
                        opacity: b.status === 'Unlocked' ? 1 : 0.3,
                      }}
                    >
                      <Text style={{ fontSize: 18 }}>{b.emoji}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            {/* ── Account ── */}
            <SectionLabel>Account</SectionLabel>
            <View style={listCard(tokens)}>
              <SettingsRow emoji="👤" label="Edit profile" onPress={comingSoon} />
              <Divider />
              <SettingsRow emoji="🔒" label="Change password" onPress={comingSoon} />
              <Divider />
              <SettingsRow emoji="✉️" label="Email" value={email || '—'} onPress={comingSoon} />
            </View>

            {/* ── Budget ── */}
            <SectionLabel>Budget</SectionLabel>
            <View style={listCard(tokens)}>
              <SettingsRow emoji="💸" label="Monthly Budget Limit" value={budgetLabel} onPress={openBudget} />
            </View>

            {/* ── Preferences ── */}
            <SectionLabel>Preferences</SectionLabel>
            <View style={listCard(tokens)}>
              <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12 }}>
                <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: tokens.text2, marginBottom: 10 }}>Theme</Text>
                <SegmentedControl<'light' | 'dark' | 'system'>
                  options={[
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' },
                    { value: 'system', label: 'System' },
                  ]}
                  value={themeMode}
                  onChange={setThemeMode}
                  fullWidth
                />
              </View>
              <Divider />
              <SettingsRow emoji="🔔" label="Notifications" right={<Toggle value={notifEnabled} onChange={toggleNotif} />} />
            </View>

            {/* ── Support ── */}
            <SectionLabel>Support</SectionLabel>
            <View style={listCard(tokens)}>
              <SettingsRow emoji="💬" label="Help & FAQ" onPress={comingSoon} />
              <Divider />
              <SettingsRow emoji="ℹ️" label="About" value={`v${APP_VERSION}`} onPress={onAbout} />
            </View>

            {/* ── Account actions (danger, separated) ── */}
            <SectionLabel>Account actions</SectionLabel>
            <View style={listCard(tokens)}>
              <SettingsRow emoji="🚪" label="Log out" danger onPress={confirmLogout} />
              <Divider />
              <SettingsRow emoji="🗑️" label="Delete account" danger onPress={() => { setDeleteError(null); setDeleteOpen(true); }} />
            </View>
          </>
        )}
      </ScrollView>

      {/* ── Budget editor sheet ── */}
      <Modal visible={budgetOpen} transparent animationType="slide" onRequestClose={() => !budgetSaving && setBudgetOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => !budgetSaving && setBudgetOpen(false)} />
          <View style={{ backgroundColor: tokens.bg, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: 20, paddingBottom: insets.bottom + 20 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: tokens.border, alignSelf: 'center', marginBottom: 16 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
              <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 18, color: tokens.text1 }}>Category budgets</Text>
              <Text style={{ fontFamily: FontFamily.mono, fontSize: 18, color: tokens.teal }}>{formatNaira(editTotal)}</Text>
            </View>
            <Text style={{ fontFamily: FontFamily.body, fontSize: 13, color: tokens.text2, marginBottom: 16 }}>
              Set a monthly cap per category. The total updates as you type.
            </Text>

            <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {cats.length === 0 ? (
                <Text style={{ fontFamily: FontFamily.body, fontSize: 13, color: tokens.text3, paddingVertical: 8 }}>
                  No categories to budget yet.
                </Text>
              ) : (
                cats.map((c) => (
                  <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <View style={{ width: 30, height: 30, borderRadius: Radius.sm, backgroundColor: tokens.surfaceTint, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Text style={{ fontSize: 15 }}>{categoryEmoji(c.name)}</Text>
                    </View>
                    <Text style={{ flex: 1, fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: tokens.text1 }} numberOfLines={1}>{c.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', width: 140, height: 44, borderRadius: Radius.pill, borderWidth: 1, borderColor: tokens.border, backgroundColor: tokens.surface, paddingHorizontal: 14 }}>
                      <Text style={{ fontFamily: FontFamily.mono, fontSize: 14, color: tokens.text2 }}>₦</Text>
                      <TextInput
                        value={formatDigits(catBudgets[c.id] ?? '')}
                        onChangeText={(t) => setCatBudgets((prev) => ({ ...prev, [c.id]: t.replace(/[^0-9]/g, '').slice(0, 9) }))}
                        placeholder="0"
                        placeholderTextColor={tokens.text3}
                        keyboardType="number-pad"
                        style={{ flex: 1, fontFamily: FontFamily.mono, fontSize: 14, color: tokens.text1, padding: 0, marginLeft: 4, textAlign: 'right' }}
                      />
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity onPress={onSaveBudget} disabled={budgetSaving || cats.length === 0} activeOpacity={0.85} style={{ height: 52, borderRadius: Radius.pill, backgroundColor: tokens.teal, alignItems: 'center', justifyContent: 'center', marginTop: 16, opacity: budgetSaving || cats.length === 0 ? 0.6 : 1 }}>
              {budgetSaving ? <ActivityIndicator color={tokens.surface} /> : (
                <Text style={{ fontFamily: FontFamily.display, fontSize: 16, color: tokens.surface }}>Save budget</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Delete-account confirm sheet ── */}
      <Modal visible={deleteOpen} transparent animationType="slide" onRequestClose={() => !deleting && setDeleteOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => !deleting && setDeleteOpen(false)} />
        <View style={{ backgroundColor: tokens.bg, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: 20, paddingBottom: insets.bottom + 20 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: tokens.border, alignSelf: 'center', marginBottom: 16 }} />
          <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 18, color: tokens.danger, marginBottom: 8 }}>Delete account</Text>
          <Text style={{ fontFamily: FontFamily.body, fontSize: 14, color: tokens.text2, lineHeight: 20, marginBottom: 18 }}>
            This permanently deletes your account and data. This can't be undone.
          </Text>
          {deleteError ? (
            <Text style={{ fontFamily: FontFamily.body, fontSize: 13, color: tokens.danger, marginBottom: 14, textAlign: 'center' }}>{deleteError}</Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => !deleting && setDeleteOpen(false)} disabled={deleting} activeOpacity={0.85} style={{ flex: 1, height: 50, borderRadius: Radius.pill, borderWidth: 1, borderColor: tokens.border, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: tokens.text1 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirmDelete} disabled={deleting} activeOpacity={0.85} style={{ flex: 1, height: 50, borderRadius: Radius.pill, backgroundColor: tokens.danger, alignItems: 'center', justifyContent: 'center', opacity: deleting ? 0.7 : 1 }}>
              {deleting ? <ActivityIndicator color={tokens.surface} /> : (
                <Text style={{ fontFamily: FontFamily.display, fontSize: 15, color: tokens.surface }}>Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
