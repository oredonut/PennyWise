// ============================================================
// CategoryPickerSheet — bottom-sheet list of categories to choose from.
// Extracted from OcrConfirmScreen's inline picker so the OCR confirm flow and
// the Transaction Detail screen share one implementation.
// ============================================================

import React from 'react';
import { Modal, Pressable, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../lib/useTheme';
import { FontFamily, Radius } from '../../tokens';

interface CategoryPickerSheetProps<T extends { id: string; name: string }> {
  visible: boolean;
  categories: T[];
  onSelect: (category: T) => void;
  onClose: () => void;
}

export function CategoryPickerSheet<T extends { id: string; name: string }>({
  visible,
  categories,
  onSelect,
  onClose,
}: CategoryPickerSheetProps<T>) {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable
          style={{ backgroundColor: tokens.bg, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: 20, paddingBottom: insets.bottom + 20 }}
          onPress={() => {}}
        >
          <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 16, color: tokens.text1, marginBottom: 16 }}>Choose category</Text>
          {categories.length === 0 ? (
            <Text style={{ fontFamily: FontFamily.body, fontSize: 13, color: tokens.text3 }}>No categories set up yet.</Text>
          ) : (
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => onSelect(c)}
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
  );
}

export default CategoryPickerSheet;
