// ============================================================
// Custom bottom tab bar — matches the old in-screen BottomNav
// design exactly, but driven by React Navigation. The centre FAB
// is NOT a tab; it calls props.onFabPress (passed by the navigator).
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Pressable, Animated, Easing,
  Dimensions, DeviceEventEmitter,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { useTheme } from '../../lib/useTheme';
import { FontFamily } from '../../tokens';
import { getQueue, QUEUE_CHANGED_EVENT } from '../../lib/offlineQueue';

const ICONS = {
  home:     'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  insights: 'M3 3v18h18M7 16V8M12 16v-5M17 16V3',
  history:  'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm.5 5v5.3l3.8 2.3-.8 1.2L11 13V7h1.5z',
  profile:  'M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z',
};

type TabDef = { route: string; label: string; icon: string };
const LEFT_TABS: TabDef[] = [
  { route: 'HomeTab',     label: 'Home',     icon: ICONS.home },
  { route: 'InsightsTab', label: 'Insights', icon: ICONS.insights },
];
const RIGHT_TABS: TabDef[] = [
  { route: 'HistoryTab', label: 'History', icon: ICONS.history },
  { route: 'ProfileTab', label: 'Profile', icon: ICONS.profile },
];

type Props = BottomTabBarProps & {
  onSnapReceipt: () => void;
  onTypeItIn: () => void;
};

const SCREEN_H = Dimensions.get('window').height;

export default function BottomTabBar({ state, navigation, onSnapReceipt, onTypeItIn }: Props) {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const activeRoute = state.routes[state.index]?.name;

  // Pending offline-transaction count → red badge on the FAB. Seeded on
  // mount and kept live via the queue's change event (enqueue / flush).
  const [pendingCount, setPendingCount] = useState(0);
  useEffect(() => {
    getQueue().then((q) => setPendingCount(q.length));
    const sub = DeviceEventEmitter.addListener(QUEUE_CHANGED_EVENT, (len: number) =>
      setPendingCount(len)
    );
    return () => sub.remove();
  }, []);

  // ── FAB menu (Snap receipt / Type it in) ─────────────────────
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;

  const closeMenu = () => {
    Animated.timing(menuAnim, {
      toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true,
    }).start(() => setMenuOpen(false));
  };

  const openMenu = () => {
    setMenuOpen(true);
    Animated.timing(menuAnim, {
      toValue: 1, duration: 240, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true,
    }).start();
  };

  const toggleMenu = () => (menuOpen ? closeMenu() : openMenu());

  // Close the menu, then fire the chosen action on the next frame so the
  // navigation transition and the menu's exit animation don't fight.
  const select = (action: () => void) => {
    closeMenu();
    requestAnimationFrame(action);
  };

  const MENU_ITEMS = [
    { key: 'snap', emoji: '📷', label: 'Snap receipt', onPress: onSnapReceipt },
    { key: 'type', emoji: '📝', label: 'Type it in', onPress: onTypeItIn },
  ];

  const fabRotate = menuAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '135deg'] });

  const renderTab = (tab: TabDef) => {
    const isActive = activeRoute === tab.route;
    const onPress = () => {
      const target = state.routes.find((r) => r.name === tab.route);
      if (!target) return;
      const event = navigation.emit({ type: 'tabPress', target: target.key, canPreventDefault: true });
      if (!isActive && !event.defaultPrevented) {
        navigation.navigate(tab.route as never);
      }
    };

    return (
      <TouchableOpacity
        key={tab.route}
        style={{ flex: 1, alignItems: 'center', gap: 3 }}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d={tab.icon}
            // Insights icon is line-art only — never filled (matches original).
            fill={isActive && tab.route !== 'InsightsTab' ? tokens.teal : 'none'}
            stroke={isActive ? tokens.teal : tokens.text3}
            strokeWidth={isActive ? 2 : 1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
        <Text style={{
          fontFamily: isActive ? FontFamily.bodySemiBold : FontFamily.body,
          fontSize: 10,
          color: isActive ? tokens.teal : tokens.text3,
        }}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{
      paddingBottom: insets.bottom + 6,
      paddingTop: 10, paddingHorizontal: 8,
      backgroundColor: tokens.surface,
      borderTopWidth: 1, borderTopColor: tokens.border,
      flexDirection: 'row', alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: -4 },
      elevation: 10,
    }}>
      {/* Tap-outside-to-close scrim — extends up over the screen above the bar */}
      {menuOpen ? (
        <Pressable
          onPress={closeMenu}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: SCREEN_H, zIndex: 20 }}
        >
          <Animated.View
            style={{
              flex: 1,
              backgroundColor: '#000',
              opacity: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] }),
            }}
          />
        </Pressable>
      ) : null}

      {LEFT_TABS.map(renderTab)}

      {/* Centre FAB — floating button, not a tab */}
      <View style={{ flex: 1, alignItems: 'center', zIndex: 30 }}>
        {/* Menu — floats above the FAB; centred over it via symmetric insets */}
        {menuOpen ? (
          <View style={{ position: 'absolute', bottom: 66, left: -110, right: -110, alignItems: 'center', gap: 10 }}>
            {MENU_ITEMS.map((item) => (
              <Animated.View
                key={item.key}
                style={{
                  opacity: menuAnim,
                  transform: [
                    { translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
                    { scale: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
                  ],
                }}
              >
                <TouchableOpacity
                  onPress={() => select(item.onPress)}
                  activeOpacity={0.85}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    backgroundColor: tokens.surface,
                    borderWidth: 1, borderColor: tokens.border,
                    borderRadius: 999, paddingHorizontal: 16, paddingVertical: 11,
                    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8,
                    shadowOffset: { width: 0, height: 3 }, elevation: 6,
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{item.emoji}</Text>
                  <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: tokens.text1 }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        ) : null}

        <TouchableOpacity
          style={{
            width: 54, height: 54, borderRadius: 27,
            backgroundColor: tokens.teal,
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 4,
            shadowColor: tokens.teal, shadowOpacity: 0.4,
            shadowRadius: 12, shadowOffset: { width: 0, height: 5 },
            elevation: 8,
          }}
          activeOpacity={0.82}
          onPress={toggleMenu}
        >
          <Animated.View style={{ transform: [{ rotate: fabRotate }] }}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            </Svg>
          </Animated.View>

          {/* Pending offline transactions waiting to sync */}
          {pendingCount > 0 ? (
            <View
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                paddingHorizontal: 5,
                backgroundColor: tokens.danger,
                borderWidth: 2,
                borderColor: tokens.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 10, color: '#fff' }}>
                {pendingCount > 9 ? '9+' : pendingCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {RIGHT_TABS.map(renderTab)}
    </View>
  );
}
