// ============================================================
// PennyWise — HistoryTab
// Placeholder transaction history (moved verbatim from the old
// HomeScreen's HistoryView). Will become a paginated FlatList in 2F.
// ============================================================

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScribbleLayer } from '../../src/components/ScribbleLayer';
import { useTheme } from '../../lib/useTheme';
import { FontFamily } from '../../tokens';

export default function HistoryTab() {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <ScribbleLayer color={tokens.doodle} />
      <ScrollView
        style={{ flex: 1, zIndex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flex: 1, paddingHorizontal: 16, marginTop: 12, alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📜</Text>
          <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 18, color: tokens.text1, marginBottom: 8 }}>
            Transaction History
          </Text>
          <Text style={{ fontFamily: FontFamily.body, fontSize: 13, color: tokens.text3, textAlign: 'center', paddingHorizontal: 40, lineHeight: 18 }}>
            Your full transaction history will appear here once you link your bank account.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
