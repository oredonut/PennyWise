// ============================================================
// PennyWise — OCR Confirm
//
// Receives a ParseResult (from OcrScreen) and turns its line items into
// editable transaction rows. Each row is auto-categorized client-side
// (mirror of the backend engine), shows a low-confidence amber flag, and
// can be edited inline. "Save all" posts them in one bulk request.
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Image, Modal,
  Pressable, ActivityIndicator, ScrollView, DeviceEventEmitter,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '../lib/useTheme';
import { FontFamily, Radius } from '../tokens';
import { formatNaira } from '../utils/currency';
import { apiGet, apiPost } from '../hooks/useApi';
import { isNetworkError } from '../lib/offlineQueue';
import { Toast } from '../src/components/Toast';
import { categorize } from '../lib/merchantCategories';
import type { ParseResult } from '../lib/ocr';

type ApiCategory = { id: string; name: string; color?: string | null };
type TxType = 'expense' | 'income';
type Confidence = 'high' | 'low';
type SubmitResult = { score?: number; brokeScore?: number; streak?: number };

type Row = {
  id: string;
  merchant: string;
  amountDigits: string; // raw digits backing the formatted input
  amount: number;
  type: TxType;
  categoryId: string | null;
  categoryName: string | null;
  confidence: Confidence;
  date: string | null;
};

const LOW_CONFIDENCE_NOTE =
  "We're not 100% sure about this one — double-check before saving.";

const BUCKET_EMOJI: Record<string, string> = {
  food: '🍛', transport: '🚌', data: '📱', leisure: '🎲', misc: '⚙️',
};

// Apps/banks we recognise in the OCR text → "Read from X" badge.
const KNOWN_APPS = [
  'OPay', 'PalmPay', 'Kuda', 'Moniepoint', 'Paga', 'Carbon', 'FairMoney',
  'GTBank', 'GTWorld', 'Access', 'Zenith', 'UBA', 'First Bank', 'Wema',
  'ALAT', 'Stanbic', 'Sterling',
];

function detectApp(rawText: string): string {
  const lower = (rawText ?? '').toLowerCase();
  for (const app of KNOWN_APPS) if (lower.includes(app.toLowerCase())) return app;
  return 'generic';
}

function formatDigits(digits: string): string {
  if (!digits) return '';
  const n = Number(digits);
  return Number.isFinite(n) ? n.toLocaleString('en-NG') : '';
}

// Auto-categorize: keyword bucket → the user's matching category (for its id).
function resolveCategory(merchant: string, cats: ApiCategory[]): ApiCategory | null {
  const bucket = categorize(merchant);
  const match = cats.find((c) => {
    const n = c.name.toLowerCase();
    return n === bucket || n.includes(bucket) || bucket.includes(n);
  });
  return match ?? null;
}

function buildRows(result: ParseResult, cats: ApiCategory[]): Row[] {
  const base = result.lineItems.length
    ? result.lineItems.map((li) => ({ merchant: li.description, amount: li.amount }))
    : [{ merchant: result.merchant ?? '', amount: result.total ?? 0 }];

  return base.map((b, i) => {
    const cat = resolveCategory(b.merchant, cats);
    const cleanRead = /[a-z]/i.test(b.merchant) && b.amount > 0;
    return {
      id: `row-${i}`,
      merchant: b.merchant,
      amountDigits: b.amount > 0 ? String(Math.round(b.amount)) : '',
      amount: Math.round(b.amount),
      type: 'expense' as TxType,
      categoryId: cat?.id ?? null,
      categoryName: cat?.name ?? null,
      confidence: (cleanRead ? 'high' : 'low') as Confidence,
      date: result.date,
    };
  });
}

export default function OcrConfirmScreen({ navigation, route }: any) {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();

  const result: ParseResult | undefined = route?.params?.result;
  const imageUri: string | undefined = route?.params?.imageUri;

  const [cats, setCats] = useState<ApiCategory[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);
  const [pickerRow, setPickerRow] = useState<string | null>(null);
  const builtRef = useRef(false);

  const app = useMemo(() => detectApp(result?.rawText ?? ''), [result]);

  // Load categories, then build the (auto-categorized) rows once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let loaded: ApiCategory[] = [];
      try {
        const res = await apiGet<{ categories: ApiCategory[] }>('/api/categories');
        loaded = res?.categories ?? [];
      } catch {
        loaded = [];
      }
      if (cancelled) return;
      setCats(loaded);
      if (!builtRef.current && result) {
        setRows(buildRows(result, loaded));
        builtRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [result]);

  // ── Row mutations ────────────────────────────────────────────
  const updateRow = (id: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const deleteRow = (id: string) => setRows((rs) => rs.filter((r) => r.id !== id));

  const onChangeAmount = (id: string, text: string) => {
    const digits = text.replace(/[^0-9]/g, '').slice(0, 9);
    updateRow(id, { amountDigits: digits, amount: Number(digits || '0') });
  };

  const toggleType = (id: string, current: TxType) =>
    updateRow(id, { type: current === 'expense' ? 'income' : 'expense' });

  const pickCategory = (id: string, cat: ApiCategory) => {
    updateRow(id, { categoryId: cat.id, categoryName: cat.name });
    setPickerRow(null);
  };

  const debitTotal = rows
    .filter((r) => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);

  // ── Save (bulk) ──────────────────────────────────────────────
  const handleSave = async () => {
    if (rows.length === 0) return;

    // Every row needs a positive amount…
    if (rows.some((r) => !(r.amount > 0))) {
      Toast.show('Every transaction needs an amount greater than ₦0', 'error');
      return;
    }
    // …and a category (the API requires categoryId).
    if (rows.some((r) => !r.categoryId)) {
      Toast.show('Pick a category for every transaction', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await apiPost<SubmitResult>('/api/transactions/bulk', {
        transactions: rows.map((r) => ({
          name: r.merchant,
          amount: r.amount,
          type: r.type,
          categoryId: r.categoryId, // from auto-categorization
          occurredAt: r.date ?? new Date().toISOString(),
        })),
      });

      // Same signal AddTransactionScreen emits — HomeTab refetches the dashboard.
      DeviceEventEmitter.emit('transactionAdded', res);
      Toast.show(`${rows.length} transactions logged.`, 'success');
      navigation.navigate('MainTabs', { screen: 'HomeTab' });
    } catch (e) {
      setSaving(false);
      if (isNetworkError(e)) {
        Toast.show("You're offline — reconnect and try again", 'error');
      } else {
        Toast.show(e instanceof Error ? e.message : 'Could not save transactions', 'error');
      }
    }
  };

  // ── Row renderer ─────────────────────────────────────────────
  const renderRow = ({ item }: { item: Row }) => {
    const emoji = BUCKET_EMOJI[categorize(item.merchant)] ?? '💳';
    const lowConf = item.confidence !== 'high';

    return (
      <View style={{ backgroundColor: tokens.surface, borderWidth: 1, borderColor: tokens.border, borderRadius: Radius.lg, padding: 14, marginBottom: 12 }}>
        {/* Line 1 — flag · emoji · merchant · delete */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {lowConf ? (
            <TouchableOpacity onPress={() => Toast.show(LOW_CONFIDENCE_NOTE, 'info')} hitSlop={10}>
              <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: tokens.amber }} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 9 }} />
          )}
          <Text style={{ fontSize: 18 }}>{emoji}</Text>
          <TextInput
            value={item.merchant}
            onChangeText={(t) => updateRow(item.id, { merchant: t })}
            placeholder="Merchant"
            placeholderTextColor={tokens.text3}
            style={{ flex: 1, fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: tokens.text1, padding: 0 }}
          />
          <TouchableOpacity onPress={() => deleteRow(item.id)} hitSlop={8}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" stroke={tokens.text3} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Line 2 — amount · type · category */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: tokens.surfaceTint, borderRadius: 10, paddingHorizontal: 10, height: 38, minWidth: 110 }}>
            <Text style={{ fontFamily: FontFamily.mono, fontSize: 14, color: tokens.text2 }}>₦</Text>
            <TextInput
              value={formatDigits(item.amountDigits)}
              onChangeText={(t) => onChangeAmount(item.id, t)}
              placeholder="0"
              placeholderTextColor={tokens.text3}
              keyboardType="number-pad"
              style={{ flex: 1, fontFamily: FontFamily.mono, fontSize: 14, color: tokens.text1, padding: 0, marginLeft: 4 }}
            />
          </View>

          {/* Small expense/income toggle */}
          <TouchableOpacity
            onPress={() => toggleType(item.id, item.type)}
            activeOpacity={0.8}
            style={{
              height: 38, paddingHorizontal: 12, borderRadius: 10, justifyContent: 'center',
              backgroundColor: item.type === 'income' ? tokens.successLight : tokens.surfaceTint,
            }}
          >
            <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: item.type === 'income' ? tokens.success : tokens.text2 }}>
              {item.type === 'income' ? 'Income' : 'Expense'}
            </Text>
          </TouchableOpacity>

          {/* Category chip / pick prompt */}
          <TouchableOpacity
            onPress={() => setPickerRow(item.id)}
            activeOpacity={0.8}
            style={{
              flex: 1, height: 38, borderRadius: 10, justifyContent: 'center', paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: item.categoryId ? tokens.teal : tokens.amber,
              backgroundColor: item.categoryId ? tokens.tealLight : tokens.amberLight,
            }}
          >
            <Text numberOfLines={1} style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: item.categoryId ? tokens.teal : tokens.amber }}>
              {item.categoryName ?? 'Pick category'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ── Header / Footer ──────────────────────────────────────────
  const ListHeader = (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={{ fontSize: 22, color: tokens.text2 }}>‹</Text>
        </TouchableOpacity>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={{ width: 80, height: 80, borderRadius: Radius.md, backgroundColor: tokens.surfaceTint }} resizeMode="cover" />
        ) : null}
      </View>

      <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 20, color: tokens.text1, marginBottom: 8 }}>
        We found {rows.length} transaction{rows.length === 1 ? '' : 's'} — correct?
      </Text>

      {app !== 'generic' ? (
        <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: tokens.tealLight, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 16 }}>
          <Text style={{ fontSize: 13 }}>✨</Text>
          <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: tokens.teal }}>Read from {app}</Text>
        </View>
      ) : (
        <View style={{ height: 8 }} />
      )}
    </View>
  );

  const ListFooter = (
    <View style={{ marginTop: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <Text style={{ fontFamily: FontFamily.body, fontSize: 13, color: tokens.text3 }}>Total</Text>
        <Text style={{ fontFamily: FontFamily.mono, fontSize: 18, color: tokens.text1, fontWeight: '700' }}>{formatNaira(debitTotal)}</Text>
      </View>

      <TouchableOpacity
        onPress={handleSave}
        disabled={saving || rows.length === 0}
        activeOpacity={0.85}
        style={{ height: 52, borderRadius: Radius.pill, backgroundColor: tokens.teal, alignItems: 'center', justifyContent: 'center', opacity: saving || rows.length === 0 ? 0.5 : 1 }}
      >
        {saving ? (
          <ActivityIndicator color={tokens.surface} />
        ) : (
          <Text style={{ fontFamily: FontFamily.display, fontSize: 16, color: tokens.surface }}>Looks right, save all</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('AddTransaction')} activeOpacity={0.7} style={{ alignSelf: 'center', marginTop: 16 }}>
        <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: tokens.teal }}>Edit manually</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        renderItem={renderRow}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }}
      />

      {/* Category picker */}
      <Modal visible={!!pickerRow} transparent animationType="fade" onRequestClose={() => setPickerRow(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }} onPress={() => setPickerRow(null)}>
          <Pressable
            style={{ backgroundColor: tokens.bg, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: 20, paddingBottom: insets.bottom + 20 }}
            onPress={() => {}}
          >
            <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 16, color: tokens.text1, marginBottom: 16 }}>Choose category</Text>
            {cats.length === 0 ? (
              <Text style={{ fontFamily: FontFamily.body, fontSize: 13, color: tokens.text3 }}>No categories set up yet.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {cats.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => pickerRow && pickCategory(pickerRow, c)}
                      activeOpacity={0.8}
                      style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: tokens.border, backgroundColor: tokens.surface }}
                    >
                      <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: tokens.text1 }}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
