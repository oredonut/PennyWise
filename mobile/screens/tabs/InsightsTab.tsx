// ============================================================
// PennyWise — InsightsTab
// Owns the 7d/30d range (drives useInsights refetch), handles
// loading / error, and renders the controlled InsightsView.
// ============================================================

import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScribbleLayer } from '../../src/components/ScribbleLayer';
import { ErrorState, SkeletonBox, usePulse } from '../../src/components/states';
import { useTheme } from '../../lib/useTheme';
import { useInsights } from '../../hooks/useApi';
import InsightsView from '../home/InsightsView';

function InsightsSkeleton() {
  const pulse = usePulse();
  return (
    <View style={{ paddingHorizontal: 16 }}>
      <SkeletonBox pulse={pulse} style={{ height: 28, width: '45%', borderRadius: 8, marginBottom: 20, marginTop: 12 }} />
      <SkeletonBox pulse={pulse} style={{ height: 170, borderRadius: 16, marginBottom: 12 }} />
      <SkeletonBox pulse={pulse} style={{ height: 160, borderRadius: 16, marginBottom: 12 }} />
      <SkeletonBox pulse={pulse} style={{ height: 90, borderRadius: 16 }} />
    </View>
  );
}

export default function InsightsTab() {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();

  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const { data, isLoading, error, refetch } = useInsights(range);

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <ScribbleLayer color={tokens.doodle} />
      <ScrollView
        style={{ flex: 1, zIndex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 24, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : isLoading && !data ? (
          <InsightsSkeleton />
        ) : data ? (
          <InsightsView data={data} tokens={tokens} range={range} onRangeChange={setRange} />
        ) : null}
      </ScrollView>
    </View>
  );
}
