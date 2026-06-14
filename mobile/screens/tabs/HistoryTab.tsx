// ============================================================
// PennyWise — HistoryTab (wired to GET /api/transactions)
// Paginated FlatList (cursor-based) with empty + load-more states.
// ============================================================

import React from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScribbleLayer } from '../../src/components/ScribbleLayer';
import { ErrorState } from '../../src/components/states';
import { useTheme } from '../../lib/useTheme';
import { FontFamily } from '../../tokens';
import { formatNaira as fmt } from '../../utils/currency';
import { useTransactions } from '../../hooks/useApi';
import type { Transaction } from '../../types/api';

export default function HistoryTab() {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const { data, isLoading, error, fetchMore } = useTransactions();

  const transactions = data?.transactions ?? [];
  const hasMore = data?.hasMore ?? false;

  const renderItem = ({ item }: { item: Transaction }) => {
    const isIncome = item.type === 'income';
    const amtColor = isIncome ? tokens.success : tokens.danger;
    const prefix = isIncome ? '+' : '-';
    return (
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: tokens.surface,
        borderRadius: 14, borderWidth: 1, borderColor: tokens.border,
        padding: 12, marginBottom: 10,
      }}>
        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: tokens.surfaceTint, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 14, color: tokens.text1, marginBottom: 2 }}>{item.name}</Text>
          <Text style={{ fontFamily: FontFamily.body, fontSize: 11, color: tokens.text3 }}>{item.timeLabel}</Text>
        </View>
        <Text style={{ fontFamily: FontFamily.mono, fontSize: 14, color: amtColor, fontWeight: '700' }}>
          {prefix}{fmt(item.amount)}
        </Text>
      </View>
    );
  };

  // Full-screen error (only when we have nothing to show).
  if (error && transactions.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg }}>
        <ScribbleLayer color={tokens.doodle} />
        <View style={{ flex: 1, paddingTop: insets.top + 16, zIndex: 1 }}>
          <ErrorState message={error} onRetry={fetchMore} />
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
        ListHeaderComponent={
          <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 28, color: tokens.text1, marginBottom: 16, paddingLeft: 8 }}>
            History
          </Text>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingTop: 80, alignItems: 'center' }}>
              <ActivityIndicator color={tokens.teal} />
            </View>
          ) : (
            <View style={{ paddingTop: 80, alignItems: 'center', paddingHorizontal: 40 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>🧾</Text>
              <Text style={{ fontFamily: FontFamily.body, fontSize: 13, color: tokens.text3, textAlign: 'center', lineHeight: 18 }}>
                No transactions yet.
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
