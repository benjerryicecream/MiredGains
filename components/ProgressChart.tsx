import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  LayoutChangeEvent,
  Pressable,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';
import C from '../constants/colors';

export interface ChartDataPoint {
  dateStr: string; // ISO or "YYYY-MM-DD" or formatted date
  label: string;   // Display label on X-axis (e.g. "Sep 5" or "09/05")
  value: number;   // Weight value
  subtext?: string; // Optional (e.g. "3 sets × 10 reps @ 185 lbs")
}

export interface ChartSeries {
  id: string;
  name: string;
  color: string;
  data: ChartDataPoint[];
}

interface ProgressChartProps {
  series?: ChartSeries[];
  data?: ChartDataPoint[];
  unit: string;
  height?: number;
  color?: string;
}

export default function ProgressChart({
  series: rawSeries,
  data: rawData,
  unit,
  height = 220,
  color = C.emerald,
}: ProgressChartProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [selectedPointKey, setSelectedPointKey] = useState<string | null>(null);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) {
      setContainerWidth(w);
    }
  };

  // Convert single `data` prop into series format if provided
  const activeSeries: ChartSeries[] = rawSeries
    ? rawSeries.filter((s) => s.data && s.data.length > 0)
    : rawData && rawData.length > 0
    ? [{ id: 'single', name: 'Weight', color, data: rawData }]
    : [];

  if (activeSeries.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>No data available for selected range</Text>
      </View>
    );
  }

  // Padding inside chart canvas
  const paddingLeft = 42;
  const paddingRight = 20;
  const paddingTop = 28;
  const paddingBottom = 36;

  const chartWidth = Math.max(containerWidth - paddingLeft - paddingRight, 10);
  const chartHeight = Math.max(height - paddingTop - paddingBottom, 10);

  // Collect all unique dates across all series for X-axis scaling
  const allDateMap = new Map<string, string>(); // dateStr -> label
  activeSeries.forEach((s) => {
    s.data.forEach((d) => {
      allDateMap.set(d.dateStr, d.label);
    });
  });

  const timelineDates = Array.from(allDateMap.keys()).sort((a, b) => a.localeCompare(b));

  // Compute Min and Max values for Y axis across ALL active series
  const allValues = activeSeries.flatMap((s) => s.data.map((d) => d.value));
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const range = rawMax - rawMin;

  // Add 15% vertical margin buffer
  const margin = range === 0 ? Math.max(rawMax * 0.1, 5) : range * 0.15;
  const minY = Math.floor(rawMin - margin);
  const maxY = Math.ceil(rawMax + margin);
  const yRange = Math.max(maxY - minY, 1);

  // Compute screen coordinates for points in each series
  const seriesPointsMap = activeSeries.map((s) => {
    const points = s.data.map((d) => {
      const dateIndex = timelineDates.indexOf(d.dateStr);
      const x =
        timelineDates.length === 1
          ? paddingLeft + chartWidth / 2
          : paddingLeft + (dateIndex / (timelineDates.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - ((d.value - minY) / yRange) * chartHeight;
      const pointKey = `${s.id}-${d.dateStr}`;
      return { x, y, point: d, seriesName: s.name, seriesColor: s.color, key: pointKey };
    });

    // Path calculation
    let pathD = '';
    if (points.length === 1) {
      pathD = `M ${points[0].x - 15} ${points[0].y} L ${points[0].x + 15} ${points[0].y}`;
    } else if (points.length > 1) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        pathD += ` L ${points[i].x} ${points[i].y}`;
      }
    }

    // Gradient fill calculation (only for single series for visual clarity)
    let areaD = '';
    if (activeSeries.length === 1 && points.length > 1) {
      const bottomY = paddingTop + chartHeight;
      areaD = `${pathD} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
    }

    return { series: s, points, pathD, areaD };
  });

  // Find selected point details
  let selectedPointDetail: {
    x: number;
    y: number;
    point: ChartDataPoint;
    seriesName: string;
    seriesColor: string;
    key: string;
  } | null = null;

  if (selectedPointKey) {
    for (const sp of seriesPointsMap) {
      const p = sp.points.find((pt) => pt.key === selectedPointKey);
      if (p) {
        selectedPointDetail = p;
        break;
      }
    }
  }

  // Y-axis grid ticks (3 ticks: min, mid, max)
  const yTicks = [minY, Math.round(minY + yRange / 2), maxY];

  // X-axis label display logic
  const step = Math.ceil(timelineDates.length / 5);
  const xLabelsToDraw = timelineDates.filter((_, i) => i === 0 || i === timelineDates.length - 1 || i % step === 0);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Legend bar for multi-series */}
      {activeSeries.length > 1 && (
        <View style={styles.legendRow}>
          {activeSeries.map((s) => (
            <View key={s.id} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: s.color }]} />
              <Text style={styles.legendText}>{s.name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Selected tooltip details floating header */}
      <View style={styles.tooltipHeader}>
        {selectedPointDetail ? (
          <View style={styles.activeTooltip}>
            <View style={styles.tooltipTitleRow}>
              <View style={[styles.tooltipDot, { backgroundColor: selectedPointDetail.seriesColor }]} />
              <Text style={styles.tooltipSeriesName}>{selectedPointDetail.seriesName}</Text>
              <Text style={styles.tooltipDate}>• {selectedPointDetail.point.dateStr}</Text>
            </View>
            <Text style={styles.tooltipVal}>
              {selectedPointDetail.point.value} <Text style={styles.tooltipUnit}>{unit}</Text>
            </Text>
            {selectedPointDetail.point.subtext ? (
              <Text style={styles.tooltipSubtext}>{selectedPointDetail.point.subtext}</Text>
            ) : null}
          </View>
        ) : (
          <Text style={styles.hintText}>Tap any data point to inspect details</Text>
        )}
      </View>

      {containerWidth > 0 && (
        <Svg width={containerWidth} height={height}>
          <Defs>
            <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={activeSeries[0]?.color || color} stopOpacity="0.35" />
              <Stop offset="100%" stopColor={activeSeries[0]?.color || color} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Grid lines & Y-axis labels */}
          {yTicks.map((val, idx) => {
            const y = paddingTop + chartHeight - ((val - minY) / yRange) * chartHeight;
            return (
              <G key={`y-grid-${idx}`}>
                <Line
                  x1={paddingLeft}
                  y1={y}
                  x2={containerWidth - paddingRight}
                  y2={y}
                  stroke={C.border}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <SvgText
                  x={paddingLeft - 8}
                  y={y + 4}
                  fill={C.textMuted}
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="end"
                >
                  {val}
                </SvgText>
              </G>
            );
          })}

          {/* Render Area fill for single series */}
          {seriesPointsMap[0]?.areaD ? (
            <Path d={seriesPointsMap[0].areaD} fill="url(#chartGradient)" />
          ) : null}

          {/* Render Line paths for all series */}
          {seriesPointsMap.map((sp) =>
            sp.pathD ? (
              <Path
                key={`path-${sp.series.id}`}
                d={sp.pathD}
                stroke={sp.series.color}
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null
          )}

          {/* X-axis labels */}
          {xLabelsToDraw.map((dateStr, i) => {
            const dateIndex = timelineDates.indexOf(dateStr);
            const x =
              timelineDates.length === 1
                ? paddingLeft + chartWidth / 2
                : paddingLeft + (dateIndex / (timelineDates.length - 1)) * chartWidth;
            const label = allDateMap.get(dateStr) || dateStr;
            return (
              <SvgText
                key={`x-label-${i}`}
                x={x}
                y={height - 8}
                fill={C.textMuted}
                fontSize="10"
                fontWeight="500"
                textAnchor="middle"
              >
                {label}
              </SvgText>
            );
          })}

          {/* Data points (circles & touch targets) across all series */}
          {seriesPointsMap.flatMap((sp) =>
            sp.points.map((p) => {
              const isSelected = selectedPointKey === p.key;
              return (
                <G key={`pt-${p.key}`}>
                  {/* Visual Circle */}
                  <Circle
                    cx={p.x}
                    cy={p.y}
                    r={isSelected ? 6 : 4}
                    fill={isSelected ? '#fff' : p.seriesColor}
                    stroke={isSelected ? p.seriesColor : C.bgCard}
                    strokeWidth={isSelected ? 3 : 1.5}
                  />
                  {/* Touch target overlay */}
                  <Circle
                    cx={p.x}
                    cy={p.y}
                    r={18}
                    fill="transparent"
                    onPress={() => setSelectedPointKey(p.key)}
                  />
                </G>
              );
            })
          )}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bgInput,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    padding: 16,
  },
  emptyText: {
    color: C.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textSecondary,
  },
  tooltipHeader: {
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  activeTooltip: {
    backgroundColor: C.bgElevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 2,
  },
  tooltipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tooltipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tooltipSeriesName: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textPrimary,
  },
  tooltipDate: {
    fontSize: 10,
    fontWeight: '600',
    color: C.textMuted,
  },
  tooltipVal: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textPrimary,
  },
  tooltipUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: C.emerald,
  },
  tooltipSubtext: {
    fontSize: 11,
    color: C.textSecondary,
    fontWeight: '500',
  },
  hintText: {
    fontSize: 11,
    color: C.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
