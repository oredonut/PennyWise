import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { FontFamily, Colors, Radius } from '../../tokens';
import { InsightsData, ScoreTrendPoint } from '../../types/api';
import { useTheme } from '../../lib/useTheme';
import { formatNaira as fmt } from '../../utils/currency';
import { SegmentedControl } from '../../src/components/SegmentedControl';

// Discipline-Score amber is the only sanctioned amber (score-threshold colouring).
const AMBER = Colors.amber;

interface InsightsViewProps {
  data: InsightsData;
  tokens: any;
  range: '7d' | '30d';
  onRangeChange: (r: '7d' | '30d') => void;
}

export default function InsightsView({ data, tokens, range, onRangeChange }: InsightsViewProps) {
  const { isDark, setThemeMode } = useTheme();
  const points = (range === '7d' ? data.scoreTrend7d : data.scoreTrend30d) ?? [];

  // Animation values for entering
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Chart line drawing animation
  const lineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset and trigger page animation
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    lineAnim.setValue(0);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(lineAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [range]);

  // Color point indicator based on Score
  const getScoreColor = (score: number) => {
    if (score >= 60) return tokens.teal;
    if (score >= 30) return AMBER;
    return tokens.danger;
  };

  // Score Trend SVG Line Chart calculations
  const chartHeight = 110;
  const chartWidth = 280;
  const paddingLeft = 30;
  const paddingRight = 15;
  const paddingTop = 10;
  const paddingBottom = 20;

  const graphHeight = chartHeight - paddingTop - paddingBottom;
  const graphWidth = chartWidth - paddingLeft - paddingRight;

  const maxScore = 100;
  const minScore = 0;

  const getCoordinates = (pointsList: ScoreTrendPoint[]) => {
    return pointsList.map((pt, i) => {
      const x = paddingLeft + (i / (pointsList.length - 1)) * graphWidth;
      const y = paddingTop + graphHeight - ((pt.score - minScore) / (maxScore - minScore)) * graphHeight;
      return { x, y, ...pt };
    });
  };

  const coords = getCoordinates(points);

  // Generate SVG path description d="M x0 y0 L x1 y1..."
  let pathD = '';
  if (coords.length > 0) {
    pathD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      pathD += ` L ${coords[i].x} ${coords[i].y}`;
    }
  }

  // May Breakdown Donut Chart calculations
  const donutRadius = 45;
  const donutCirc = 2 * Math.PI * donutRadius;
  const strokeWidth = 14;
  const donutSize = 120;

  let currentOffset = 0;

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {/* ── Header ────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 16, marginBottom: 16, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 28, color: tokens.text1, lineHeight: 34 }}>
            Insights
          </Text>
          <Text style={{ fontFamily: FontFamily.body, fontSize: 13, color: tokens.text3, marginTop: 4 }}>
            {data.monthYear} · {data.weekLabel}
          </Text>
        </View>

        {/* Theme Toggle Button */}
        <TouchableOpacity
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: tokens.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: tokens.border,
          }}
          onPress={() => setThemeMode(isDark ? 'light' : 'dark')}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 16 }}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Score Trend Card ─────────────────────────────── */}
      <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 15, color: tokens.text1 }}>
            Score Trend
          </Text>
          <SegmentedControl<'7d' | '30d'>
            options={[{ value: '7d', label: '7d' }, { value: '30d', label: '30d' }]}
            value={range}
            onChange={onRangeChange}
          />
        </View>

        {/* Score Trend SVG Line Chart */}
        <View style={{ height: chartHeight, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((level, idx) => {
              const yVal = paddingTop + graphHeight - (level / 100) * graphHeight;
              return (
                <React.Fragment key={idx}>
                  {/* Grid Line */}
                  <Line
                    x1={paddingLeft}
                    y1={yVal}
                    x2={chartWidth - paddingRight}
                    y2={yVal}
                    stroke={tokens.border}
                    strokeWidth={0.8}
                    strokeDasharray="3, 3"
                  />
                  {/* Y-axis Label */}
                  <Line
                    x1={paddingLeft}
                    y1={yVal}
                    x2={paddingLeft - 3}
                    y2={yVal}
                    stroke={tokens.text3}
                    strokeWidth={1}
                  />
                </React.Fragment>
              );
            })}

            {/* Custom SVG Text elements for Y axis (0, 25, 50, 75, 100) */}
            {[0, 25, 50, 75, 100].map((level, idx) => {
              const yVal = paddingTop + graphHeight - (level / 100) * graphHeight;
              return (
                <SvgText
                  key={idx}
                  x={paddingLeft - 8}
                  y={yVal + 3}
                  fill={tokens.text3}
                  fontSize="8"
                  textAnchor="end"
                  fontFamily={FontFamily.body}
                >
                  {level}
                </SvgText>
              );
            })}

            {/* The trendline */}
            {pathD !== '' && (
              <Path
                d={pathD}
                fill="none"
                stroke={tokens.teal}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Plotted score points with color indicators */}
            {coords.map((c, i) => (
              <React.Fragment key={i}>
                <Circle
                  cx={c.x}
                  cy={c.y}
                  r={3.8}
                  fill={getScoreColor(c.score)}
                  stroke={tokens.surface}
                  strokeWidth={1.2}
                />
                {/* X-axis labels */}
                <SvgText
                  x={c.x}
                  y={chartHeight - 4}
                  fill={tokens.text3}
                  fontSize="9"
                  textAnchor="middle"
                  fontFamily={FontFamily.body}
                >
                  {c.label}
                </SvgText>
              </React.Fragment>
            ))}
          </Svg>
        </View>

        {/* Legend */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, borderTopWidth: 1, borderTopColor: tokens.border, paddingTop: 10 }}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: tokens.teal }]} />
            <Text style={[styles.legendText, { color: tokens.text2 }]}>&gt;= 60 On track</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: AMBER }]} />
            <Text style={[styles.legendText, { color: tokens.text2 }]}>30-59 Needs work</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: tokens.danger }]} />
            <Text style={[styles.legendText, { color: tokens.text2 }]}>&lt; 30 Broke</Text>
          </View>
        </View>
      </View>

      {/* ── May Breakdown Card (Donut Chart) ──────────────── */}
      <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
        <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 15, color: tokens.text1, marginBottom: 14 }}>
          May Breakdown
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          {/* Donut Graphic */}
          <View style={{ width: donutSize, height: donutSize, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={donutSize} height={donutSize} viewBox={`0 0 ${donutSize} ${donutSize}`}>
              {/* Render background circle track */}
              <Circle
                cx={donutSize / 2}
                cy={donutSize / 2}
                r={donutRadius}
                stroke={tokens.surfaceTint}
                strokeWidth={strokeWidth}
                fill="none"
              />

              {/* Render segment circle rings */}
              {(data.breakdown ?? []).map((item, index) => {
                const percentage = item.percentage;
                const strokeDashValue = (percentage / 100) * donutCirc;
                const strokeOffset = donutCirc - strokeDashValue + currentOffset;

                // Add to cumulative offset for next segment
                currentOffset -= strokeDashValue;

                return (
                  <Circle
                    key={item.id}
                    cx={donutSize / 2}
                    cy={donutSize / 2}
                    r={donutRadius}
                    stroke={item.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={donutCirc}
                    strokeDashoffset={strokeOffset}
                    fill="none"
                    rotation="-90"
                    origin={`${donutSize / 2}, ${donutSize / 2}`}
                  />
                );
              })}
            </Svg>

            {/* Total Text Overlay inside the donut - Currency Rule: JetBrains Mono */}
            <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: FontFamily.mono, fontSize: 13, color: tokens.text1 }}>
                {fmt(data.totalSpent)}
              </Text>
              <Text style={{ fontFamily: FontFamily.body, fontSize: 8, color: tokens.text3, letterSpacing: 0.5 }}>
                total
              </Text>
            </View>
          </View>

          {/* Breakdown percentages lists */}
          <View style={{ flex: 1, paddingLeft: 12 }}>
            {(data.breakdown ?? []).map((item) => (
              <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
                  <Text style={{ fontFamily: FontFamily.body, fontSize: 11, color: tokens.text2 }}>
                    {item.name}
                  </Text>
                </View>
                {/* Currency values aligned with Cabinets */}
                <Text style={{ fontFamily: FontFamily.mono, fontSize: 11, color: tokens.text1 }}>
                  {item.percentage}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── Observations (hidden when empty) ─────────────── */}
      {(data.observations ?? []).length > 0 && (
        <View style={{ paddingHorizontal: 16, marginBottom: 6 }}>
          <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 15, color: tokens.text1, marginBottom: 10 }}>
            Observations
          </Text>
          {data.observations.map((obs) => (
            <View
              key={obs.id}
              style={[
                styles.observationCard,
                {
                  backgroundColor: tokens.surface,
                  borderColor: tokens.border,
                },
              ]}
            >
              <View style={[styles.obsIconWrapper, { backgroundColor: tokens.tealLight }]}>
                <Text style={{ fontSize: 18 }}>{obs.emoji}</Text>
              </View>
              <Text style={[styles.obsText, { color: tokens.text1 }]}>
                {obs.text}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* ── vs Last Month ────────────────────────────────── */}
      <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
        <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 15, color: tokens.text1, marginBottom: 14 }}>
          vs Last Month
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* April */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FontFamily.body, fontSize: 11, color: tokens.text3, marginBottom: 4 }}>
              {data.comparison.lastMonthName}
            </Text>
            <Text style={{ fontFamily: FontFamily.mono, fontSize: 16, color: tokens.text2 }}>
              {fmt(data.comparison.lastMonthSpent)}
            </Text>
          </View>

          {/* Change pill */}
          <View style={{ alignItems: 'center', paddingHorizontal: 10 }}>
            <Text style={{ fontSize: 16, color: tokens.success, marginBottom: 2 }}>↓</Text>
            <Text style={{ fontFamily: FontFamily.mono, fontSize: 12, color: tokens.success }}>
              {fmt(data.comparison.difference)}
            </Text>
            <Text style={{ fontFamily: FontFamily.body, fontSize: 10, color: tokens.success }}>
              {data.comparison.percentage}% less
            </Text>
          </View>

          {/* May so far */}
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={{ fontFamily: FontFamily.body, fontSize: 11, color: tokens.text3, marginBottom: 4 }}>
              {data.comparison.currentMonthName}
            </Text>
            <Text style={{ fontFamily: FontFamily.mono, fontSize: 16, color: tokens.teal }}>
              {fmt(data.comparison.currentMonthSpent)}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Monthly Roast (hidden when null) ──────────────── */}
      {data.roast && (
        <View style={[styles.roastCard, { backgroundColor: tokens.amberLight, borderColor: tokens.amber + '55' }]}>
          <View style={[styles.roastBadge, { backgroundColor: tokens.amber }]}>
            <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 22, color: tokens.surface }}>
              {data.roast.grade}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 14, color: tokens.text1, marginBottom: 4 }}>
              Monthly Roast — {data.roast.month}
            </Text>
            <Text style={{ fontFamily: FontFamily.body, fontSize: 12, color: tokens.text2, lineHeight: 17 }}>
              {data.roast.message}
            </Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

// Wrapper for SVG texts
function SvgText(props: any) {
  // SVG Text needs react-native-svg Text import.
  // In our SVG, we can import Text as SvgText to avoid clash with React Native's Text element.
  const { Text: SVGText } = require('react-native-svg');
  return <SVGText {...props} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontFamily: FontFamily.body,
    fontSize: 9,
  },
  observationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  obsIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  obsText: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: 12,
    lineHeight: 17,
  },
  roastCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  roastBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
