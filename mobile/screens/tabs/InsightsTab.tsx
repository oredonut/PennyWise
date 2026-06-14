// ============================================================
// PennyWise — InsightsTab
// Wraps the existing InsightsView in the screen-level scroll +
// scribble container the old HomeScreen used to provide.
// ============================================================

import React from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScribbleLayer } from '../../src/components/ScribbleLayer';
import { useTheme } from '../../lib/useTheme';
import { MOCK_HOME_DATA } from '../home/mockData';
import InsightsView from '../home/InsightsView';

export default function InsightsTab() {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();

  // TODO(api): GET /api/insights?range=7d|30d — replace with fetched InsightsData.
  const data = MOCK_HOME_DATA;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <ScribbleLayer color={tokens.doodle} />
      <ScrollView
        style={{ flex: 1, zIndex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <InsightsView data={data.insights} tokens={tokens} />
      </ScrollView>
    </View>
  );
}
