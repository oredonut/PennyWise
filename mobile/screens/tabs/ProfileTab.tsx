// ============================================================
// PennyWise — ProfileTab
// Moved verbatim from the old HomeScreen's ProfileView. Now reads
// theme state from useTheme() directly instead of via props.
// ============================================================

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScribbleLayer } from '../../src/components/ScribbleLayer';
import { useTheme } from '../../lib/useTheme';
import { FontFamily } from '../../tokens';
import { mkCard } from './cardStyle';

export default function ProfileTab() {
  const { tokens, themeMode, setThemeMode } = useTheme();
  const insets = useSafeAreaInsets();

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
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <ScribbleLayer color={tokens.doodle} />
      <ScrollView
        style={{ flex: 1, zIndex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
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
                  onPress={() => setThemeMode(mode.id as 'light' | 'dark' | 'system')}
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
      </ScrollView>
    </View>
  );
}
