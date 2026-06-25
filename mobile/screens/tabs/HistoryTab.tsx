// ============================================================
// PennyWise — HistoryTab (wired to GET /api/transactions)
// Paginated FlatList with pull-to-refresh, skeleton load, empty state, and
// rows that open the Transaction Detail screen.
// ============================================================

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, DeviceEventEmitter } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { ScribbleLayer } from '../../src/components/ScribbleLayer';
import { ErrorState, SkeletonBox, usePulse } from '../../src/components/states';
import { useTheme } from '../../lib/useTheme';
import { FontFamily } from '../../tokens';
import { formatNaira as fmt } from '../../utils/currency';
import { useTransactions } from '../../hooks/useApi';
import type { Transaction } from '../../types/api';

function HistorySkeleton() {
  const { tokens } = useTheme();
  const pulse = usePulse();
  return (
    <View>
      {Array.from({ length: 7 }).map((_, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: tokens.surface, borderRadius: 14, borderWidth: 1, borderColor: tokens.border, padding: 12, marginBottom: 10 }}>
          <SkeletonBox pulse={pulse} style={{ width: 38, height: 38, borderRadius: 19, marginRight: 12 }} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBox pulse={pulse} style={{ height: 12, width: '55%' }} />
            <SkeletonBox pulse={pulse} style={{ height: 10, width: '35%' }} />
          </View>
          <SkeletonBox pulse={pulse} style={{ height: 14, width: 54 }} />
        </View>
      ))}
    </View>
  );
}

export default function HistoryTab() {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { data, isLoading, error, fetchMore, refetch } = useTransactions();

  const transactions = data?.transactions ?? [];
  const hasMore = data?.hasMore ?? false;

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Reflect edits/deletes/new logs made elsewhere (TxnDetail, Add sheet, OCR).
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('transactionAdded', () => refetch());
    return () => sub.remove();
  }, [refetch]);

  const renderItem = ({ item }: { item: Transaction }) => {
    const isIncome = item.type === 'income';
    const amtColor = isIncome ? tokens.success : tokens.danger;
    const prefix = isIncome ? '+' : '-';
    return (
      <TouchableOpacity
        activeOpacity={0.6}
        onPress={() => navigation.navigate('TxnDetail', { id: item.id })}
        style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: tokens.surface,
          borderRadius: 14, borderWidth: 1, borderColor: tokens.border,
          padding: 12, marginBottom: 10,
        }}
      >
        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: tokens.surfaceTint, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 14, color: tokens.text1, marginBottom: 2 }}>{item.name}</Text>
          <Text style={{ fontFamily: FontFamily.body, fontSize: 11, color: tokens.text3 }}>{item.timeLabel}</Text>
        </View>
        <Text style={{ fontFamily: FontFamily.mono, fontSize: 14, color: amtColor }}>
          {prefix}{fmt(item.amount)}
        </Text>
      </TouchableOpacity>
    );
  };

  // Full-screen error (only when we have nothing to show).
  if (error && transactions.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg }}>
        <ScribbleLayer color={tokens.doodle} />
        <View style={{ flex: 1, paddingTop: insets.top + 16, zIndex: 1 }}>
          <ErrorState message={error} onRetry={refetch} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <ScribbleLayer color={tokens.doodle} />
      <FlatList
        style={{ flex: 1, zIndex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 }}
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        onEndReached={hasMore ? fetchMore : undefined}
        onEndReachedThreshold={0.3}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.teal} colors={[tokens.teal]} />}
        ListHeaderComponent={
          <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 28, color: tokens.text1, marginBottom: 16, paddingLeft: 8 }}>
            History
          </Text>
        }
        ListEmptyComponent={
          isLoading ? (
            <HistorySkeleton />
          ) : (
            <View style={{ paddingTop: 80, alignItems: 'center', paddingHorizontal: 40 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>🧾</Text>
              <Text style={{ fontFamily: FontFamily.body, fontSize: 13, color: tokens.text3, textAlign: 'center', lineHeight: 18 }}>
                No transactions yet. Tap + to log your first one.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          hasMore && transactions.length > 0 ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator color={tokens.teal} />
            </View>
          ) : null
        }
      />
    </View>
  );
}
