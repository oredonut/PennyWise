// ============================================================
// PennyWise — Transaction Detail
//
// Fetches one transaction by id (GET /api/transactions/[id]). View mode shows
// identity + category + note; Edit mode lets the user change category (shared
// CategoryPickerSheet) and note, then PATCHes only the changed fields. Delete
// soft-confirms inline, then DELETEs. Any mutation emits 'transactionAdded' so
// History and Home refetch. Amount is NOT editable (the endpoint doesn't allow
// it), and there's no receipt / payment-method / score-impact data to show.
// ============================================================

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator,
  DeviceEventEmitter, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { SubHeader } from '../src/components/SubHeader';
import { CategoryPickerSheet } from '../src/components/CategoryPickerSheet';
import { ErrorState } from '../src/components/states';
import { Toast } from '../src/components/Toast';
import { useTheme } from '../lib/useTheme';
import { FontFamily, Radius } from '../tokens';
import { formatNaira } from '../utils/currency';
import { apiGet, apiPatch, apiDelete, useCategories } from '../hooks/useApi';
import type { TransactionDetail } from '../types/api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Category-name → emoji (the API returns no emoji field).
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

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} · ${h}:${mm} ${ampm}`;
}

function Chevron({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function TxnDetailScreen({ navigation, route }: any) {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const id: string = route?.params?.id;

  const { data: catsData } = useCategories();
  const cats = catsData?.categories ?? [];

  const [txn, setTxn] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [editNote, setEditNote] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<TransactionDetail>(`/api/transactions/${id}`);
      setTxn(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load transaction');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // ── Derived view-model ───────────────────────────────────────
  const activeCategoryId = editing ? editCategoryId : txn?.category_id;
  const category = cats.find((c) => c.id === activeCategoryId) ?? null;
  const categoryName = category?.name ?? 'Uncategorised';
  // Same fallback chain the History list / dashboard Recent use.
  const merchant =
    (txn?.merchant_raw && txn.merchant_raw.trim()) ||
    (txn?.note && txn.note.trim()) ||
    categoryName;
  const isIncome = txn?.type === 'income';
  const amountNum = Math.abs(Number(txn?.amount ?? 0)) || 0;
  const amtColor = isIncome ? tokens.success : tokens.danger;

  const enterEdit = () => {
    setEditNote(txn?.note ?? '');
    setEditCategoryId(txn?.category_id ?? null);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!txn) return;
    const patch: { note?: string | null; category_id?: string | null } = {};
    if ((editNote ?? '') !== (txn.note ?? '')) patch.note = editNote.trim() ? editNote.trim() : null;
    if (editCategoryId !== txn.category_id) patch.category_id = editCategoryId;

    if (Object.keys(patch).length === 0) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const updated = await apiPatch<TransactionDetail>(`/api/transactions/${id}`, patch);
      setTxn(updated);
      DeviceEventEmitter.emit('transactionAdded'); // History/Home refetch
      setEditing(false);
      Toast.show('Changes saved', 'success');
    } catch (e) {
      Toast.show(e instanceof Error ? e.message : 'Could not save changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiDelete(`/api/transactions/${id}`);
      DeviceEventEmitter.emit('transactionAdded');
      navigation.goBack();
    } catch (e) {
      setDeleting(false);
      setConfirmDelete(false);
      Toast.show(e instanceof Error ? e.message : 'Could not delete transaction', 'error');
    }
  };

  const headerRight = txn ? (
    <TouchableOpacity onPress={editing ? handleSave : enterEdit} disabled={saving} hitSlop={8} activeOpacity={0.7}>
      <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: tokens.teal }}>
        {editing ? (saving ? 'Saving…' : 'Done') : 'Edit'}
      </Text>
    </TouchableOpacity>
  ) : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SubHeader title="Transaction" onBack={() => navigation.goBack()} right={headerRight} style={{ marginBottom: 8 }} />

          {loading ? (
            <View style={{ paddingTop: 80, alignItems: 'center' }}>
              <ActivityIndicator color={tokens.teal} />
            </View>
          ) : error || !txn ? (
            <View style={{ paddingTop: 40 }}>
              <ErrorState message={error ?? 'Transaction not found'} onRetry={load} />
            </View>
          ) : (
            <>
              {/* ── Identity ── */}
              <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 24 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: tokens.surfaceTint, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 30 }}>{categoryEmoji(categoryName)}</Text>
                </View>
                <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 20, color: tokens.text1, textAlign: 'center', marginBottom: 6 }} numberOfLines={2}>
                  {merchant}
                </Text>
                <Text style={{ fontFamily: FontFamily.mono, fontSize: 36, color: amtColor }}>
                  {isIncome ? '+' : '-'}{formatNaira(amountNum)}
                </Text>
                <Text style={{ fontFamily: FontFamily.body, fontSize: 13, color: tokens.text3, marginTop: 8 }}>
                  {formatDateTime(txn.occurred_at ?? txn.created_at)}
                </Text>
              </View>

              {/* ── Detail card ── */}
              <View style={{ backgroundColor: tokens.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: tokens.border }}>
                {/* Category row */}
                <TouchableOpacity
                  disabled={!editing}
                  onPress={() => editing && setPickerOpen(true)}
                  activeOpacity={editing ? 0.6 : 1}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}
                >
                  <View style={{ width: 30, height: 30, borderRadius: Radius.sm, backgroundColor: tokens.surfaceTint, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 15 }}>{categoryEmoji(categoryName)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FontFamily.body, fontSize: 11, color: tokens.text3, marginBottom: 2 }}>Category</Text>
                    <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: tokens.text1 }}>{categoryName}</Text>
                  </View>
                  {editing ? <Chevron color={tokens.text3} /> : null}
                </TouchableOpacity>

                <View style={{ height: 1, backgroundColor: tokens.border, marginLeft: 16 }} />

                {/* Note row */}
                <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
                  <Text style={{ fontFamily: FontFamily.body, fontSize: 11, color: tokens.text3, marginBottom: 6 }}>Note</Text>
                  {editing ? (
                    <TextInput
                      value={editNote}
                      onChangeText={setEditNote}
                      placeholder="Add a note"
                      placeholderTextColor={tokens.text3}
                      multiline
                      style={{ fontFamily: FontFamily.body, fontSize: 15, color: tokens.text1, padding: 0, minHeight: 22 }}
                    />
                  ) : (
                    <Text style={{ fontFamily: FontFamily.body, fontSize: 15, color: txn.note ? tokens.text1 : tokens.text3 }}>
                      {txn.note?.trim() ? txn.note : 'No note'}
                    </Text>
                  )}
                </View>
              </View>

              {/* ── Save changes (edit mode) ── */}
              {editing ? (
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  activeOpacity={0.85}
                  style={{ height: 52, borderRadius: Radius.pill, backgroundColor: tokens.teal, alignItems: 'center', justifyContent: 'center', marginTop: 20, opacity: saving ? 0.6 : 1 }}
                >
                  {saving ? <ActivityIndicator color={tokens.surface} /> : (
                    <Text style={{ fontFamily: FontFamily.display, fontSize: 16, color: tokens.surface }}>Save changes</Text>
                  )}
                </TouchableOpacity>
              ) : null}

              {/* ── Delete + inline confirm ── */}
              {!editing ? (
                confirmDelete ? (
                  <View style={{ marginTop: 24, backgroundColor: tokens.dangerLight, borderRadius: Radius.lg, padding: 16 }}>
                    <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: tokens.text1, marginBottom: 12, textAlign: 'center' }}>
                      Sure? This will adjust your score.
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <TouchableOpacity onPress={() => setConfirmDelete(false)} disabled={deleting} activeOpacity={0.85} style={{ flex: 1, height: 48, borderRadius: Radius.pill, borderWidth: 1, borderColor: tokens.border, backgroundColor: tokens.surface, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: tokens.text1 }}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleDelete} disabled={deleting} activeOpacity={0.85} style={{ flex: 1, height: 48, borderRadius: Radius.pill, backgroundColor: tokens.danger, alignItems: 'center', justifyContent: 'center', opacity: deleting ? 0.7 : 1 }}>
                        {deleting ? <ActivityIndicator color={tokens.surface} /> : (
                          <Text style={{ fontFamily: FontFamily.display, fontSize: 15, color: tokens.surface }}>Yes, delete</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setConfirmDelete(true)}
                    activeOpacity={0.85}
                    style={{ height: 50, borderRadius: Radius.pill, borderWidth: 1.5, borderColor: tokens.danger, alignItems: 'center', justifyContent: 'center', marginTop: 24 }}
                  >
                    <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: tokens.danger }}>Delete transaction</Text>
                  </TouchableOpacity>
                )
              ) : null}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <CategoryPickerSheet
        visible={pickerOpen}
        categories={cats}
        onSelect={(c) => { setEditCategoryId(c.id); setPickerOpen(false); }}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}
