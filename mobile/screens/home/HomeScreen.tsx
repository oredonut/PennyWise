// ============================================================
// PennyWise — HomeScreen
//
// Animations:
//   • Staggered card entrance  — fade + slide-up, 110 ms apart
//   • Score ring draws itself  — strokeDashoffset 0 → target
//   • Score number counts up   — 0 → 73 as ring fills
//   • Bar chart grows up       — each bar from height 0 with spring
//   • Progress bars fill left  — 0% → target% with ease-out
//
// Design rules:
//   AMBER RULE    — #d97706 used ONLY on score + brokeScore numbers
//   CURRENCY RULE — every ₦ uses FontFamily.mono (JetBrains Mono)
//   DARK MODE     — token swap via useTheme(), zero layout changes
//   SCRIBBLE      — z=0, pointerEvents none, absent from bottom nav
// ============================================================

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, Animated, Easing, StyleSheet, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';

import { ScribbleLayer } from '../../src/components/ScribbleLayer';
import { useTheme }       from '../../lib/useTheme';
import { FontFamily, Colors } from '../../tokens';
import { formatNaira as fmt } from '../../utils/currency';
import { greeting, dateLabel } from '../../utils/date';
import { MOCK_HOME_DATA, HomeData, CategoryBudget } from './mockData';
import InsightsView       from './InsightsView';

// AMBER RULE — sourced from the token, used ONLY on score + brokeScore numbers
const AMBER = Colors.amber;

// ── Card style factory ────────────────────────────────────────
const mkCard = (tokens: any) => ({
  backgroundColor: tokens.surface,
  borderRadius: 16,
  padding: 16,
  marginHorizontal: 16,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: tokens.border,
  shadowColor: '#000',
  shadowOpacity: 0.04,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
});

// ── Score Ring — draws + counts up ────────────────────────────
function ScoreRing({ score, tokens, delay = 350 }: { score: number; tokens: any; delay?: number }) {
  const SIZE = 82;
  const SW   = 7;
  const R    = (SIZE - SW) / 2;
  const CIRC = 2 * Math.PI * R;

  const anim   = useRef(new Animated.Value(0)).current;
  const [offset, setOffset] = useState(CIRC);
  const [shown,  setShown]  = useState(0);

  useEffect(() => {
    const id = anim.addListener(({ value }) => {
      setOffset(CIRC * (1 - value / 100));
      setShown(Math.round(value));
    });
    Animated.timing(anim, {
      toValue: score,
      duration: 1400,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(id);
  }, [score]);

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ position: 'absolute' }}>
        {/* Background track */}
        <Circle cx={SIZE/2} cy={SIZE/2} r={R} stroke={tokens.tealLight} strokeWidth={SW} fill="none" />
        {/* Animated progress arc — starts at 12 o'clock */}
        <Circle
          cx={SIZE/2} cy={SIZE/2} r={R}
          stroke={tokens.teal} strokeWidth={SW} fill="none"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${SIZE/2}, ${SIZE/2}`}
        />
      </Svg>
      {/* AMBER RULE: score number only */}
      <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 24, color: AMBER, lineHeight: 28 }}>
        {shown}
      </Text>
      <Text style={{ fontFamily: FontFamily.body, fontSize: 8, color: tokens.text3, letterSpacing: 1 }}>
        SCORE
      </Text>
    </View>
  );
}

// ── Discipline Score Card ─────────────────────────────────────
function DisciplineScoreCard({ data, tokens, enterAnim }: any) {
  return (
    <Animated.View style={[mkCard(tokens), { flexDirection: 'row', alignItems: 'center', gap: 18 }, enterAnim]}>
      <ScoreRing score={data.score} tokens={tokens} delay={400} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 16, color: tokens.text1, marginBottom: 4 }}>
          Discipline Score
        </Text>
        <Text style={{ fontFamily: FontFamily.body, fontSize: 13, color: tokens.text2, marginBottom: 10 }}>
          Broke Score:{' '}
          {/* AMBER RULE: brokeScore number */}
          <Text style={{ fontFamily: FontFamily.displayXBold, color: AMBER }}>{data.brokeScore}</Text>
        </Text>
        <View style={{
          alignSelf: 'flex-start',
          backgroundColor: tokens.tealLight,
          borderRadius: 999,
          paddingHorizontal: 10, paddingVertical: 4,
        }}>
          <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: tokens.teal }}>
            {data.badge}
          </Text>
        </View>
      </View>

      {/* Right side hand-drawn doodle trend line */}
      <View style={{ width: 62, height: 40, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={60} height={30} viewBox="0 0 60 30">
          <Path
            d="M 5 20 Q 15 10 22 18 T 40 8 T 55 12"
            fill="none"
            stroke={tokens.teal}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
          <Circle cx={55} cy={12} r={2.5} fill={tokens.teal} />
          {/* Sparkle star */}
          <Path
            d="M 23 2 L 24.2 3.8 L 26.2 3.8 L 24.6 4.8 L 25.2 6.8 L 23 5.5 L 20.8 6.8 L 21.4 4.8 L 19.8 3.8 L 21.8 3.8 Z"
            fill={tokens.amber}
          />
        </Svg>
      </View>
    </Animated.View>
  );
}

// ── Animated bar for weekly chart ─────────────────────────────
function ChartBar({ day, amount, maxAmt, isToday, tokens, delay }: any) {
  const CHART_H = 52;
  const targetH = Math.max((amount / maxAmt) * CHART_H, 5);
  const anim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: targetH,
      duration: 620,
      delay,
      easing: Easing.out(Easing.back(1.15)),
      useNativeDriver: false,
    }).start();
  }, [targetH]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: CHART_H + 20 }}>
      <Animated.View style={{
        width: '100%',
        height: anim,
        backgroundColor: isToday ? tokens.teal : tokens.tealLight,
        borderRadius: 5,
      }} />
      <Text style={{
        fontFamily: isToday ? FontFamily.bodySemiBold : FontFamily.body,
        fontSize: 10,
        color: isToday ? tokens.teal : tokens.text3,
        marginTop: 5,
      }}>
        {day}
      </Text>
    </View>
  );
}

// ── Budget Card ───────────────────────────────────────────────
function BudgetCard({ data, tokens, enterAnim }: any) {
  const maxAmt = Math.max(...data.weeklySpend.map((d: any) => d.amount), 1);

  return (
    <Animated.View style={[mkCard(tokens), enterAnim]}>
      <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 15, color: tokens.text1, marginBottom: 14 }}>
        {data.monthLabel}
      </Text>

      {/* Three amount columns — CURRENCY RULE: all in Mono */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontFamily: FontFamily.mono, fontSize: 17, color: tokens.text1, fontWeight: '700' }}>
            {fmt(data.total)}
          </Text>
          <Text style={{ fontFamily: FontFamily.body, fontSize: 11, color: tokens.text3, marginTop: 2 }}>
            Budget
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontFamily: FontFamily.mono, fontSize: 17, color: tokens.text1, fontWeight: '700' }}>
            {fmt(data.spent)}
          </Text>
          <Text style={{ fontFamily: FontFamily.body, fontSize: 11, color: tokens.text3, marginTop: 2 }}>
            Spent
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: FontFamily.mono, fontSize: 17, color: tokens.teal, fontWeight: '700' }}>
            {fmt(data.left)}
          </Text>
          <Text style={{ fontFamily: FontFamily.body, fontSize: 11, color: tokens.text3, marginTop: 2 }}>
            Left
          </Text>
        </View>
      </View>

      {/* Animated bar chart */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5, marginTop: 16 }}>
        {data.weeklySpend.map((d: any, i: number) => (
          <ChartBar
            key={i}
            day={d.day}
            amount={d.amount}
            maxAmt={maxAmt}
            isToday={d.isToday}
            tokens={tokens}
            delay={600 + i * 55}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// ── Alert Banner ──────────────────────────────────────────────
function AlertBanner({ alert, tokens, enterAnim }: any) {
  if (!alert) return null;
  return (
    <Animated.View style={[{
      marginHorizontal: 16, marginBottom: 12,
      backgroundColor: tokens.amberLight,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: tokens.amber + '55',
      padding: 14,
      flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    }, enterAnim]}>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ marginTop: 2 }}>
        <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" fill={tokens.amber} />
        <Path d="M12 9v4M12 17h.01" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      </Svg>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: FontFamily.body, fontSize: 13, color: tokens.text1, lineHeight: 18 }}>
          {alert.message}
        </Text>
        {/* CURRENCY RULE: Mono for the ₦ line */}
        <Text style={{ fontFamily: FontFamily.mono, fontSize: 13, color: tokens.amber, marginTop: 3, fontWeight: '600' }}>
          {alert.amountLine}
        </Text>
      </View>
    </Animated.View>
  );
}

// ── Category Row with animated progress bar ───────────────────
function CategoryRow({ cat, tokens, isLast, delay = 0 }: any) {
  const pct        = Math.min(cat.spent / cat.budget, 1);
  const isRed      = cat.status !== 'on_track';
  const barColor   = isRed ? tokens.danger : tokens.teal;
  const labelColor = isRed ? tokens.danger : tokens.teal;
  const statusLabel = cat.status === 'on_track'   ? 'On track'
                    : cat.status === 'near_limit'  ? 'Near limit'
                    : 'Over budget';

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: pct,
      duration: 950,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const barWidth = progressAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0%', `${Math.round(pct * 100)}%`],
  });

  return (
    <View style={{ marginBottom: isLast ? 0 : 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        {/* Emoji bubble */}
        <View style={{
          width: 38, height: 38, borderRadius: 10,
          backgroundColor: tokens.surfaceTint,
          alignItems: 'center', justifyContent: 'center',
          marginRight: 10,
        }}>
          <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
        </View>

        {/* Name */}
        <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 14, color: tokens.text1, flex: 1 }}>
          {cat.name}
        </Text>

        {/* Status */}
        <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 11, color: labelColor, marginRight: 8 }}>
          {statusLabel}
        </Text>

        {/* CURRENCY RULE: Mono for ₦ amounts */}
        <Text style={{ fontFamily: FontFamily.mono, fontSize: 11, color: tokens.text3 }}>
          {fmt(cat.spent)} {fmt(cat.budget)}
        </Text>
      </View>

      {/* Animated fill */}
      <View style={{ height: 5, backgroundColor: tokens.surfaceTint, borderRadius: 999, overflow: 'hidden' }}>
        <Animated.View style={{ width: barWidth, height: '100%', backgroundColor: barColor, borderRadius: 999 }} />
      </View>
    </View>
  );
}

// ── Category Budgets Section ──────────────────────────────────
function CategoryBudgetsSection({ categories, tokens, enterAnim }: any) {
  return (
    <Animated.View style={enterAnim}>
      <Text style={{
        fontFamily: FontFamily.displayXBold, fontSize: 15, color: tokens.text1,
        marginHorizontal: 16, marginBottom: 10,
      }}>
        Category Budgets
      </Text>
      <View style={mkCard(tokens)}>
        {categories.map((cat: CategoryBudget, i: number) => (
          <CategoryRow
            key={cat.id}
            cat={cat}
            tokens={tokens}
            isLast={i === categories.length - 1}
            delay={800 + i * 160}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// ── Recent Transactions Section ───────────────────────────────
function RecentTransactionsSection({ transactions, tokens, enterAnim }: any) {
  return (
    <Animated.View style={enterAnim}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 10,
        marginTop: 8
      }}>
        <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 15, color: tokens.text1 }}>
          Recent
        </Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: tokens.teal }}>
            See all →
          </Text>
        </TouchableOpacity>
      </View>
      <View style={mkCard(tokens)}>
        {transactions.map((tx: any, i: number) => {
          const isIncome = tx.type === 'income';
          const amtColor = isIncome ? tokens.success : tokens.danger;
          const prefix = isIncome ? '+' : '-';
          return (
            <View
              key={tx.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: i === transactions.length - 1 ? 0 : 16,
              }}
            >
              {/* Icon bubble */}
              <View style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: tokens.surfaceTint,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                <Text style={{ fontSize: 18 }}>{tx.emoji}</Text>
              </View>
              {/* Name / Info */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 14, color: tokens.text1, marginBottom: 2 }}>
                  {tx.name}
                </Text>
                <Text style={{ fontFamily: FontFamily.body, fontSize: 11, color: tokens.text3 }}>
                  {tx.timeLabel}
                </Text>
              </View>
              {/* Amount - Currency Rule: JetBrains Mono */}
              <Text style={{
                fontFamily: FontFamily.mono,
                fontSize: 14,
                color: amtColor,
                fontWeight: '700',
              }}>
                {prefix}{fmt(tx.amount)}
              </Text>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

// ── Profile Settings View ─────────────────────────────────────
function ProfileView({ tokens, themeMode, setThemeMode }: any) {
  // TODO(api): GET /api/profile/budget — monthly spending cap (number, naira).
  const [budgetVal, setBudgetVal] = useState('25,000');

  const modes = [
    { id: 'light', label: 'Light Mode', icon: '☀️' },
    { id: 'dark', label: 'Dark Mode', icon: '🌙' },
    { id: 'system', label: 'System Default', icon: '⚙️' },
  ];

  // TODO(api): GET /api/profile/badges — discipline badges with locked/unlocked state.
  const badges = [
    { id: 'b1', name: 'Shawarma Slayer', emoji: '🍔', status: 'Unlocked', desc: 'Avoided food bankruptcy.' },
    { id: 'b2', name: 'Bolt Walker', emoji: '🚶‍♂️', status: 'Unlocked', desc: 'Walked instead of ride booking.' },
    { id: 'b3', name: 'Data Saver', emoji: '📱', status: 'Locked', desc: 'Stayed 15% under data budget.' },
    { id: 'b4', name: 'Roast Survivor', emoji: '💀', status: 'Locked', desc: 'Improved grade after a roast.' },
  ];

  return (
    <View style={{ flex: 1, paddingHorizontal: 16, marginTop: 12 }}>
      {/* Page Title */}
      <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 28, color: tokens.text1, marginBottom: 16, paddingLeft: 8 }}>
        Profile
      </Text>

      {/* ── 1. Student Identity Header ── */}
      <View style={[mkCard(tokens), { flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
        {/* Avatar bubble */}
        <View style={{
          width: 62, height: 62, borderRadius: 31,
          backgroundColor: tokens.tealLight,
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 2, borderColor: tokens.teal,
          position: 'relative'
        }}>
          <Text style={{ fontSize: 32 }}>🎓</Text>
          {/* Grade Badge */}
          <View style={{
            position: 'absolute', bottom: -4, right: -4,
            width: 22, height: 22, borderRadius: 11,
            backgroundColor: tokens.amber,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1.5, borderColor: tokens.surface
          }}>
            <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 11, color: '#fff' }}>B</Text>
          </View>
        </View>

        {/* TODO(api): GET /api/profile — name, university, grade, memberSince. */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 18, color: tokens.text1, marginBottom: 2 }}>
            Tunde
          </Text>
          <Text style={{ fontFamily: FontFamily.body, fontSize: 13, color: tokens.text2 }}>
            Covenant University
          </Text>
          <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 11, color: tokens.teal, marginTop: 4 }}>
            Grade B Saver · Member since May 2025
          </Text>
        </View>
      </View>

      {/* ── 2. Streaks & Stats ── */}
      {/* TODO(api): GET /api/profile/streaks — currentStreak & longestStreak (days). */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 4 }}>
        <View style={[mkCard(tokens), { flex: 1, alignItems: 'center', paddingVertical: 12, marginRight: 0 }]}>
          <Text style={{ fontSize: 20, marginBottom: 4 }}>🔥</Text>
          <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 16, color: tokens.text1 }}>
            12 days
          </Text>
          <Text style={{ fontFamily: FontFamily.body, fontSize: 10, color: tokens.text3 }}>
            Current Streak
          </Text>
        </View>
        <View style={[mkCard(tokens), { flex: 1, alignItems: 'center', paddingVertical: 12, marginLeft: 0 }]}>
          <Text style={{ fontSize: 20, marginBottom: 4 }}>🏆</Text>
          <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 16, color: tokens.text1 }}>
            28 days
          </Text>
          <Text style={{ fontFamily: FontFamily.body, fontSize: 10, color: tokens.text3 }}>
            Longest Streak
          </Text>
        </View>
      </View>

      {/* ── 3. Discipline Badges ── */}
      <View style={mkCard(tokens)}>
        <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 15, color: tokens.text1, marginBottom: 12 }}>
          Discipline Badges
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
          {badges.map((b) => {
            const isUnlocked = b.status === 'Unlocked';
            return (
              <View key={b.id} style={{
                width: '47%',
                backgroundColor: tokens.surfaceTint + '40',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: tokens.border,
                padding: 10,
                alignItems: 'center',
                opacity: isUnlocked ? 1 : 0.55
              }}>
                <Text style={{ fontSize: 26, marginBottom: 4 }}>{b.emoji}</Text>
                <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 11, color: tokens.text1, textAlign: 'center', marginBottom: 2 }}>
                  {b.name}
                </Text>
                <Text style={{ fontFamily: FontFamily.body, fontSize: 8, color: tokens.text3, textAlign: 'center' }}>
                  {b.desc}
                </Text>
                <View style={{
                  marginTop: 6,
                  paddingHorizontal: 6, paddingVertical: 2,
                  borderRadius: 4,
                  backgroundColor: isUnlocked ? tokens.tealLight : tokens.border
                }}>
                  <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 8, color: isUnlocked ? tokens.teal : tokens.text3 }}>
                    {b.status}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── 4. Financial Controls ── */}
      <View style={mkCard(tokens)}>
        <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 15, color: tokens.text1, marginBottom: 8 }}>
          Monthly Budget Limit
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontFamily: FontFamily.body, fontSize: 12, color: tokens.text2 }}>
              Your current spending cap:
            </Text>
            <Text style={{ fontFamily: FontFamily.mono, fontSize: 18, color: tokens.teal, fontWeight: '700', marginTop: 2 }}>
              ₦{budgetVal}
            </Text>
          </View>
          <TouchableOpacity
            style={{
              backgroundColor: tokens.surfaceTint,
              paddingHorizontal: 12, paddingVertical: 6,
              borderRadius: 8, borderWidth: 1, borderColor: tokens.border
            }}
            onPress={() => {
              const newVal = budgetVal === '25,000' ? '30,000' : '25,000';
              setBudgetVal(newVal);
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: tokens.text1 }}>
              Toggle Limit
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 5. Theme Settings ── */}
      <View style={mkCard(tokens)}>
        <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 15, color: tokens.text1, marginBottom: 6 }}>
          Theme Override
        </Text>
        <Text style={{ fontFamily: FontFamily.body, fontSize: 13, color: tokens.text2, marginBottom: 16 }}>
          Choose how PennyWise displays.
        </Text>

        {modes.map(mode => {
          const isActive = themeMode === mode.id;
          return (
            <TouchableOpacity
              key={mode.id}
              onPress={() => setThemeMode(mode.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 14,
                borderBottomWidth: mode.id === 'system' ? 0 : 1,
                borderBottomColor: tokens.border,
              }}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 18 }}>{mode.icon}</Text>
                <Text style={{
                  fontFamily: isActive ? FontFamily.bodySemiBold : FontFamily.body,
                  fontSize: 15,
                  color: tokens.text1
                }}>
                  {mode.label}
                </Text>
              </View>
              {isActive && (
                <Text style={{ color: tokens.teal, fontSize: 16, fontFamily: FontFamily.displayXBold }}>✓</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── 6. Log Out Button ── */}
      <TouchableOpacity
        style={{
          marginHorizontal: 16,
          marginBottom: 32,
          paddingVertical: 14,
          borderRadius: 12,
          backgroundColor: tokens.danger + '15',
          borderWidth: 1,
          borderColor: tokens.danger + '40',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        activeOpacity={0.7}
      >
        <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 15, color: tokens.danger }}>
          Log Out
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── History Placeholder View ──────────────────────────────────
function HistoryView({ tokens }: any) {
  return (
    <View style={{ flex: 1, paddingHorizontal: 16, marginTop: 12, alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>📜</Text>
      <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 18, color: tokens.text1, marginBottom: 8 }}>
        Transaction History
      </Text>
      <Text style={{ fontFamily: FontFamily.body, fontSize: 13, color: tokens.text3, textAlign: 'center', paddingHorizontal: 40, lineHeight: 18 }}>
        Your full transaction history will appear here once you link your bank account.
      </Text>
    </View>
  );
}

// ── Icon paths ─────────────────────────────────────────────────
const ICONS = {
  home:     'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  insights: 'M3 3v18h18M7 16V8M12 16v-5M17 16V3',
  history:  'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm.5 5v5.3l3.8 2.3-.8 1.2L11 13V7h1.5z',
  profile:  'M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z',
};

// ── Bottom Nav ─────────────────────────────────────────────────
function BottomNav({ active, onPress, tokens, insets }: any) {
  const tabs = [
    { id: 'home',     label: 'Home',     icon: ICONS.home     },
    { id: 'insights', label: 'Insights', icon: ICONS.insights  },
    { id: 'fab',      label: '',         icon: ''              },
    { id: 'history',  label: 'History',  icon: ICONS.history   },
    { id: 'profile',  label: 'Profile',  icon: ICONS.profile   },
  ];

  return (
    <View style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingBottom: insets.bottom + 6,
      paddingTop: 10, paddingHorizontal: 8,
      backgroundColor: tokens.surface,
      borderTopWidth: 1, borderTopColor: tokens.border,
      flexDirection: 'row', alignItems: 'center',
      zIndex: 10,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: -4 },
      elevation: 10,
    }}>
      {tabs.map(tab => {
        if (tab.id === 'fab') {
          return (
            <View key="fab" style={{ flex: 1, alignItems: 'center' }}>
              <TouchableOpacity
                style={{
                  width: 54, height: 54, borderRadius: 27,
                  backgroundColor: tokens.teal,
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 4,
                  shadowColor: tokens.teal, shadowOpacity: 0.4,
                  shadowRadius: 12, shadowOffset: { width: 0, height: 5 },
                  elevation: 8,
                }}
                activeOpacity={0.82}
                onPress={() => onPress('fab')}
              >
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
                </Svg>
              </TouchableOpacity>
            </View>
          );
        }

        const isActive = active === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={{ flex: 1, alignItems: 'center', gap: 3 }}
            onPress={() => onPress(tab.id)}
            activeOpacity={0.7}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path
                d={tab.icon}
                fill={isActive && tab.id !== 'insights' ? tokens.teal : 'none'}
                stroke={isActive ? tokens.teal : tokens.text3}
                strokeWidth={isActive ? 2 : 1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={{
              fontFamily: isActive ? FontFamily.bodySemiBold : FontFamily.body,
              fontSize: 10,
              color: isActive ? tokens.teal : tokens.text3,
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────
export default function HomeScreen({ navigation }: any) {
  const { tokens, isDark, themeMode, setThemeMode } = useTheme();
  const insets = useSafeAreaInsets();

  // TODO(api): GET /api/home/dashboard — replace MOCK_HOME_DATA with the
  // fetched HomeData (add loading / error / empty states before shipping).
  const data: HomeData = MOCK_HOME_DATA;

  const [activeTab,  setActiveTab]  = useState('home');
  const [refreshing, setRefreshing] = useState(false);

  // Bottom-nav handler. The centre FAB has no destination yet (Add Transaction
  // screen is unbuilt) — guard against switching to a 'fab' tab that renders
  // nothing, which would blank the screen.
  const handleTab = useCallback((id: string) => {
    if (id === 'fab') {
      // TODO(nav): open AddTransactionScreen / quick-add bottom sheet.
      return;
    }
    setActiveTab(id);
  }, []);

  // Weekday selection
  const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const activeDayIndex = 6; // Sunday active

  // ── Staggered entrance — 7 sections, 110 ms apart ────────────
  const cardAnims = useRef(
    Array.from({ length: 7 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Reset and trigger entrance animation
    cardAnims.forEach(anim => anim.setValue(0));
    Animated.stagger(
      110,
      cardAnims.map(anim =>
        Animated.timing(anim, {
          toValue:         1,
          duration:        520,
          easing:          Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      )
    ).start();
  }, [activeTab]);

  const enter = (i: number) => ({
    opacity: cardAnims[i],
    transform: [{
      translateY: cardAnims[i].interpolate({
        inputRange:  [0, 1],
        outputRange: [28, 0],
      }),
    }],
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const navHeight = 64 + insets.bottom + 6;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Scribble — z=0, pointer-events none */}
      <ScribbleLayer color={tokens.doodle} />

      {activeTab === 'home' && (
        <ScrollView
          style={{ flex: 1, zIndex: 1 }}
          contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: navHeight + 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={tokens.teal}
              colors={[tokens.teal]}
            />
          }
        >
          {/* ── 0 · Header ───────────────────────────────────── */}
          <Animated.View style={[{ paddingHorizontal: 16, marginBottom: 16 }, enter(0)]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontFamily: FontFamily.bodySemiBold, fontSize: 11,
                  color: tokens.text3, letterSpacing: 0.7, marginBottom: 4,
                }}>
                  {dateLabel()}
                </Text>
                <Text style={{
                  fontFamily: FontFamily.displayXBold, fontSize: 26,
                  color: tokens.text1, lineHeight: 32,
                }}>
                  {greeting()}{'\n'}{data.user.firstName} 👋
                </Text>
              </View>

              {/* Theme Toggle & Streak Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                {/* Theme Toggle Button */}
                <TouchableOpacity
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: tokens.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: tokens.border,
                  }}
                  onPress={() => setThemeMode(isDark ? 'light' : 'dark')}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 16 }}>{isDark ? '☀️' : '🌙'}</Text>
                </TouchableOpacity>

                {/* Streak pill */}
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: tokens.tealLight,
                  borderRadius: 999,
                  paddingHorizontal: 10, paddingVertical: 6,
                  gap: 4,
                }}>
                  <Text style={{ fontSize: 13 }}>🔥</Text>
                  <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: tokens.teal }}>
                    {data.user.streakDays}d
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* ── Weekday Strip Tracker Selector ────────────────── */}
          <Animated.View style={[{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 }, enter(1)]}>
            {DAYS.map((d, idx) => {
              const isToday = idx === activeDayIndex;
              return (
                <View
                  key={idx}
                  style={{
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: isToday ? tokens.teal : tokens.tealLight + '40',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    marginHorizontal: 3,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FontFamily.bodySemiBold,
                      fontSize: 13,
                      color: isToday ? '#fff' : tokens.teal,
                    }}
                  >
                    {d}
                  </Text>
                </View>
              );
            })}
          </Animated.View>

          {/* ── 2 · Discipline Score Card ─────────────────────── */}
          <DisciplineScoreCard
            data={data.disciplineScore}
            tokens={tokens}
            enterAnim={enter(2)}
          />

          {/* ── 3 · Budget Card ──────────────────────────────── */}
          <BudgetCard
            data={data.budget}
            tokens={tokens}
            enterAnim={enter(3)}
          />

          {/* ── 4 · Alert Banner ────────────────────────────── */}
          <AlertBanner
            alert={data.alert}
            tokens={tokens}
            enterAnim={enter(4)}
          />

          {/* ── 5 · Category Budgets ─────────────────────────── */}
          <CategoryBudgetsSection
            categories={data.categories}
            tokens={tokens}
            enterAnim={enter(5)}
          />

          {/* ── 6 · Recent Transactions List ─────────────────── */}
          <RecentTransactionsSection
            transactions={data.recentTransactions}
            tokens={tokens}
            enterAnim={enter(6)}
          />

        </ScrollView>
      )}

      {activeTab === 'insights' && (
        <ScrollView
          style={{ flex: 1, zIndex: 1 }}
          contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: navHeight + 16 }}
          showsVerticalScrollIndicator={false}
        >
          <InsightsView data={data.insights} tokens={tokens} />
        </ScrollView>
      )}

      {activeTab === 'history' && (
        <ScrollView
          style={{ flex: 1, zIndex: 1 }}
          contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: navHeight + 16 }}
          showsVerticalScrollIndicator={false}
        >
          <HistoryView tokens={tokens} />
        </ScrollView>
      )}

      {activeTab === 'profile' && (
        <ScrollView
          style={{ flex: 1, zIndex: 1 }}
          contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: navHeight + 16 }}
          showsVerticalScrollIndicator={false}
        >
          <ProfileView tokens={tokens} themeMode={themeMode} setThemeMode={setThemeMode} />
        </ScrollView>
      )}

      {/* ── Bottom Nav (fixed) ───────────────────────────────── */}
      <BottomNav
        active={activeTab}
        onPress={handleTab}
        tokens={tokens}
        insets={insets}
      />
    </View>
  );
}
