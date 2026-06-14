// ============================================================
// PennyWise — Snap Receipt (OCR capture)
//
// Reached from the FAB menu ("Snap receipt 📷"). A small state machine
// walks the user from picking an image → extracting on-device → the
// confirm screen (or a typed error). The pure parse lives in lib/ocr;
// this screen only orchestrates picking, the loading affordance, and
// error recovery.
//
//   idle → picked → extracting → done (navigates to OcrConfirm)
//                              ↘ error
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, ScrollView, Animated, Easing, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '../lib/useTheme';
import { FontFamily, Radius } from '../tokens';
import { extractFromImage } from '../lib/ocr';
import type { ParseResult } from '../lib/ocr';
import { isNetworkError } from '../lib/offlineQueue';
import { Toast } from '../src/components/Toast';

type OcrState = 'idle' | 'picked' | 'extracting' | 'done' | 'error';
type ErrorKind = 'empty' | 'ocr_unavailable' | 'network' | 'generic';

const EXTRACTING_MESSAGES = [
  'Reading your receipt...',
  'Finding transactions...',
  'Almost done...',
];

// A parse with nothing actionable in it → treat as "no transactions found".
function isResultEmpty(r: ParseResult): boolean {
  return !r.merchant && r.total == null && r.lineItems.length === 0;
}

function classifyError(e: unknown): ErrorKind {
  const msg = e instanceof Error ? e.message.toLowerCase() : '';
  if (msg.includes('not available')) return 'ocr_unavailable';
  if (isNetworkError(e)) return 'network';
  return 'generic';
}

// ── Indeterminate spinner — rotating teal arc (on-brand vs. stock spinner) ──
function Spinner({ color, size = 44 }: { color: string; size?: number }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const R = 18;
  const C = 2 * Math.PI * R;

  return (
    <Animated.View style={{ width: size, height: size, transform: [{ rotate }] }}>
      <Svg width={size} height={size} viewBox="0 0 44 44">
        <Circle cx={22} cy={22} r={R} stroke={color + '33'} strokeWidth={4} fill="none" />
        <Circle
          cx={22} cy={22} r={R} stroke={color} strokeWidth={4} fill="none"
          strokeLinecap="round" strokeDasharray={`${C * 0.28} ${C}`}
        />
      </Svg>
    </Animated.View>
  );
}

export default function OcrScreen({ navigation }: any) {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();

  const [state, setState] = useState<OcrState>('idle');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<ErrorKind>('generic');
  const [messageIndex, setMessageIndex] = useState(0);

  // Pulse the thumbnail while extracting (mirrors the app's skeleton pulse).
  const pulse = useRef(new Animated.Value(0.5)).current;

  // Rotate the loading copy + run the pulse only while extracting.
  useEffect(() => {
    if (state !== 'extracting') return;
    setMessageIndex(0);
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % EXTRACTING_MESSAGES.length);
    }, 2000);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => {
      clearInterval(interval);
      loop.stop();
    };
  }, [state, pulse]);

  // ── Pickers ──────────────────────────────────────────────────
  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Toast.show('Allow photo access to pick a receipt', 'error');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: false,
    });
    if (!res.canceled && res.assets?.[0]) {
      setImageUri(res.assets[0].uri);
      setState('picked');
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Toast.show('Allow camera access to snap a receipt', 'error');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.[0]) {
      setImageUri(res.assets[0].uri);
      setState('picked');
    }
  };

  // ── Extract ──────────────────────────────────────────────────
  const runExtract = async () => {
    if (!imageUri) return;
    setState('extracting');
    try {
      const result = await extractFromImage(imageUri);
      if (isResultEmpty(result)) {
        setErrorKind('empty');
        setState('error');
        return;
      }
      setState('done');
      navigation.navigate('OcrConfirm', { result, imageUri });
    } catch (e) {
      setErrorKind(classifyError(e));
      setState('error');
    }
  };

  const reset = () => {
    setImageUri(null);
    setState('idle');
  };

  // ── Header ───────────────────────────────────────────────────
  const Header = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 }}>
      <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
        <Text style={{ fontSize: 22, color: tokens.text2 }}>‹</Text>
      </TouchableOpacity>
      <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 20, color: tokens.text1 }}>
        Snap receipt
      </Text>
    </View>
  );

  // ── Per-state bodies ─────────────────────────────────────────
  const renderIdle = () => (
    <View style={{ gap: 14 }}>
      <Text style={{ fontFamily: FontFamily.body, fontSize: 14, color: tokens.text2, marginBottom: 6 }}>
        Snap or pick a photo of a receipt or your transaction history and we'll pull the numbers out.
      </Text>
      <OptionCard emoji="📷" label="Pick from gallery" sub="Choose an existing screenshot" onPress={pickFromGallery} tokens={tokens} />
      <OptionCard emoji="📸" label="Take a photo" sub="Use your camera now" onPress={takePhoto} tokens={tokens} />
    </View>
  );

  const renderPicked = () => (
    <View>
      <Image
        source={{ uri: imageUri ?? undefined }}
        style={{ width: '100%', height: 300, borderRadius: Radius.lg, backgroundColor: tokens.surfaceTint }}
        resizeMode="cover"
      />
      <TouchableOpacity
        onPress={runExtract}
        activeOpacity={0.85}
        style={{ height: 52, borderRadius: Radius.pill, backgroundColor: tokens.teal, alignItems: 'center', justifyContent: 'center', marginTop: 22 }}
      >
        <Text style={{ fontFamily: FontFamily.display, fontSize: 16, color: tokens.surface, letterSpacing: 0.2 }}>
          Extract transactions
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={reset} activeOpacity={0.7} style={{ alignSelf: 'center', marginTop: 16 }}>
        <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: tokens.teal }}>
          Choose different image
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderExtracting = () => (
    <View style={{ alignItems: 'center', paddingTop: 24 }}>
      <Animated.Image
        source={{ uri: imageUri ?? undefined }}
        style={{ width: 120, height: 120, borderRadius: Radius.lg, backgroundColor: tokens.surfaceTint, opacity: pulse }}
        resizeMode="cover"
      />
      <View style={{ marginTop: 28 }}>
        <Spinner color={tokens.teal} />
      </View>
      <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: tokens.text1, marginTop: 20 }}>
        {EXTRACTING_MESSAGES[messageIndex]}
      </Text>
    </View>
  );

  const renderDone = () => (
    <View style={{ alignItems: 'center', paddingTop: 40, gap: 12 }}>
      <Spinner color={tokens.teal} />
      <Text style={{ fontFamily: FontFamily.body, fontSize: 13, color: tokens.text3 }}>Opening review…</Text>
    </View>
  );

  const renderError = () => {
    const message =
      errorKind === 'empty'
        ? 'Try a clearer screenshot of your transaction history.'
        : errorKind === 'ocr_unavailable'
          ? 'OCR requires a development build.'
          : errorKind === 'network'
            ? "You appear to be offline. Check your connection and try again."
            : 'Something went wrong reading that image.';

    return (
      <View style={{ alignItems: 'center', paddingTop: 24 }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: tokens.amberLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" fill="none" stroke={tokens.amber} strokeWidth={1.8} strokeLinejoin="round" />
            <Path d="M12 9v4M12 17h.01" stroke={tokens.amber} strokeWidth={1.8} strokeLinecap="round" />
          </Svg>
        </View>
        <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 18, color: tokens.text1, marginBottom: 6, textAlign: 'center' }}>
          Couldn't read this image
        </Text>
        <Text style={{ fontFamily: FontFamily.body, fontSize: 13, color: tokens.text3, textAlign: 'center', marginBottom: 22 }}>
          {message}
        </Text>

        <TouchableOpacity
          onPress={() => setState(imageUri ? 'picked' : 'idle')}
          activeOpacity={0.85}
          style={{ height: 50, borderRadius: Radius.pill, backgroundColor: tokens.teal, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' }}
        >
          <Text style={{ fontFamily: FontFamily.display, fontSize: 15, color: tokens.surface }}>Try again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddTransaction')}
          activeOpacity={0.85}
          style={{ height: 50, borderRadius: Radius.pill, borderWidth: 1, borderColor: tokens.border, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', marginTop: 12 }}
        >
          <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: tokens.text1 }}>Enter manually</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, paddingHorizontal: 20, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Header />
        {state === 'idle' && renderIdle()}
        {state === 'picked' && renderPicked()}
        {state === 'extracting' && renderExtracting()}
        {state === 'done' && renderDone()}
        {state === 'error' && renderError()}
      </ScrollView>
    </View>
  );
}

// ── Idle option card ───────────────────────────────────────────
function OptionCard({ emoji, label, sub, onPress, tokens }: { emoji: string; label: string; sub: string; onPress: () => void; tokens: any }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: tokens.surface,
        borderWidth: 1, borderColor: tokens.border,
        borderRadius: Radius.lg, padding: 18,
      }}
    >
      <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: tokens.tealLight, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 22 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 15, color: tokens.text1, marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontFamily: FontFamily.body, fontSize: 12, color: tokens.text3 }}>{sub}</Text>
      </View>
      <Text style={{ fontSize: 18, color: tokens.text3 }}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({});
