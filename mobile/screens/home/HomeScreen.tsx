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

// @ts-nocheck
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';

import { ScribbleLayer } from '../../src/components/ScribbleLayer';
import { useTheme }       from '../../lib/useTheme';
import { FontFamily }     from '../../tokens';
import { MOCK_HOME_DATA, HomeData, CategoryBudget } from './mockData';

// AMBER RULE — defined once, touched only by score numbers
const AMBER = '#d97706';

// ── Helpers ───────────────────────────────────────────────────
const fmt = (n: number) => `₦${n.toLocaleString('en-NG')}`;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning,' : h < 17 ? 'Good afternoon,' : 'Good evening,';
}

function dateLabel() {
  return new Date()
    .toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })
    .toUpperCase();
}

// ── Card style factory ────────────────────────────────────────
const mkCard = (tokens: any) => ({
  backgroundColor: tokens.surface,
  borderRadius: 16,
  padding: 16,
  marginHorizontal: 16,
  marginBottom: 12,
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
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
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ marginTop: 1 }}>
        <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" fill={tokens.amber} />
        <Path d="M12 9v4M12 17h.01" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      </Svg>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: FontFamily.body, fontSize: 13, color: tokens.text1, lineHeight: 18 }}>
          {alert.message}
        </Text>
        {/* CURRENCY RULE: Mono for the ₦ line */}
        <Text style={{ fontFamily: FontFamily.mono, fontSize: 13, color: tokens.amber, marginTop: 3 }}>
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

// ── Icon paths ─────────────────────────────────────────────────
const ICONS = {
  home:     'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  insights: 'M3 3v18h18M7 16V8M12 16v-5M17 16V3',
  history:  'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm.5 5v5.3l3.8 2.3-.8 1.2L11 13V7h1.5z',
  profile:  'M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z',
};

// ── Bottom Nav ─────────────────────────────────────────────────
// Note: No ScribbleLayer here — bottom nav is a surface, not a screen
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
                fill={isActive ? tokens.teal : 'none'}
                stroke={isActive ? tokens.teal : tokens.text3}
                strokeWidth={isActive ? 0 : 1.6}
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
  const { tokens, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // TODO (backend): replace MOCK_HOME_DATA with real API call
  // const [data, setData] = useState<HomeData>(MOCK_HOME_DATA);
  // useEffect(() => { fetchDashboard(session.access_token).then(setData); }, []);
  const data: HomeData = MOCK_HOME_DATA;

  const [activeTab,  setActiveTab]  = useState('home');
  const [refreshing, setRefreshing] = useState(false);

  // ── Staggered entrance — 5 sections, 110 ms apart ────────────
  const cardAnims = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
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
  }, []);

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
    // TODO (backend): re-fetch dashboard data here, then call setRefreshing(false)
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const navHeight = 64 + insets.bottom + 6;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Scribble — z=0, pointer-events none */}
      <ScribbleLayer color={tokens.doodle} />

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
            <View>
              <Text style={{
                fontFamily: FontFamily.bodySemiBold, fontSize: 11,
                color: tokens.text3, letterSpacing: 0.7, marginBottom: 4,
              }}>
                {dateLabel()}
              </Text>
              <Text style={{
                fontFamily: FontFamily.displayXBold, fontSize: 26,
                color: tokens.text1, lineHeight: 34,
              }}>
                {greeting()}{'\n'}{data.user.firstName} 👋
              </Text>
            </View>

            {/* Streak pill */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: tokens.tealLight,
              borderRadius: 999,
              paddingHorizontal: 12, paddingVertical: 6,
              gap: 5, marginTop: 4,
            }}>
              <Text style={{ fontSize: 13 }}>🔥</Text>
              <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: tokens.teal }}>
                {data.user.streakDays} day streak
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── 1 · Discipline Score ─────────────────────────── */}
        <DisciplineScoreCard
          data={data.disciplineScore}
          tokens={tokens}
          enterAnim={enter(1)}
        />

        {/* ── 2 · Budget Card ──────────────────────────────── */}
        <BudgetCard
          data={data.budget}
          tokens={tokens}
          enterAnim={enter(2)}
        />

        {/* ── 3 · Alert Banner (conditional) ──────────────── */}
        <AlertBanner
          alert={data.alert}
          tokens={tokens}
          enterAnim={enter(3)}
        />

        {/* ── 4 · Category Budgets ─────────────────────────── */}
        <CategoryBudgetsSection
          categories={data.categories}
          tokens={tokens}
          enterAnim={enter(4)}
        />

      </ScrollView>

      {/* ── Bottom Nav (fixed) ───────────────────────────────── */}
      <BottomNav
        active={activeTab}
        onPress={setActiveTab}
        tokens={tokens}
        insets={insets}
      />
    </View>
  );
}
