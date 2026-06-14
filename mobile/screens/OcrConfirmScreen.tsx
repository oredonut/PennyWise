// ============================================================
// PennyWise — OCR Confirm (STUB)
//
// Minimal review screen that the OCR flow navigates to with the parsed
// ParseResult. It surfaces what the parser found so the happy path
// doesn't dead-end, and hands off to manual entry to actually create the
// transaction (the parser can't infer a categoryId, which the API
// requires). This is intentionally lean — flesh out into a proper
// review/edit-and-submit screen when its behaviour is specced.
// ============================================================

import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../lib/useTheme';
import { FontFamily, Radius } from '../tokens';
import { formatNaira } from '../utils/currency';
import type { ParseResult } from '../lib/ocr';

export default function OcrConfirmScreen({ navigation, route }: any) {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();

  const result: ParseResult | undefined = route?.params?.result;
  const imageUri: string | undefined = route?.params?.imageUri;

  const Field = ({ label, value }: { label: string; value: string }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: tokens.border }}>
      <Text style={{ fontFamily: FontFamily.body, fontSize: 13, color: tokens.text3 }}>{label}</Text>
      <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: tokens.text1 }}>{value}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
            <Text style={{ fontSize: 22, color: tokens.text2 }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 20, color: tokens.text1 }}>Review</Text>
        </View>

        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: 96, height: 96, borderRadius: Radius.lg, backgroundColor: tokens.surfaceTint, alignSelf: 'center', marginBottom: 18 }}
            resizeMode="cover"
          />
        ) : null}

        <View style={{ backgroundColor: tokens.surface, borderWidth: 1, borderColor: tokens.border, borderRadius: Radius.lg, paddingHorizontal: 16, marginBottom: 8 }}>
          <Field label="Merchant" value={result?.merchant ?? '—'} />
          <Field label="Total" value={result?.total != null ? formatNaira(result.total) : '—'} />
          <Field label="Date" value={result?.date ?? '—'} />
          <Field label="Items found" value={String(result?.lineItems?.length ?? 0)} />
        </View>

        <Text style={{ fontFamily: FontFamily.body, fontSize: 12, color: tokens.text3, marginBottom: 22, marginTop: 10 }}>
          Pick a category and confirm the details on the next screen.
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('AddTransaction')}
          activeOpacity={0.85}
          style={{ height: 52, borderRadius: Radius.pill, backgroundColor: tokens.teal, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: FontFamily.display, fontSize: 16, color: tokens.surface }}>Continue to add</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.popToTop?.() ?? navigation.goBack()} activeOpacity={0.7} style={{ alignSelf: 'center', marginTop: 16 }}>
          <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: tokens.text3 }}>Discard</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
