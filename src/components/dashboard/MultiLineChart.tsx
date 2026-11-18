import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { formatNumber } from '../../utils/units';
import { colors } from '../../theme/theme';

export interface ChartSeries {
  id: string;
  color: string;
  /** t = marca de tiempo (ms), v = valor. En orden cronológico. */
  points: { t: number; v: number }[];
}

interface Props {
  series: ChartSeries[];
  formatDate: (t: number) => string;
  height?: number;
}

const PAD = { l: 46, r: 14, t: 14, b: 26 };

export function MultiLineChart({ series, formatDate, height = 200 }: Props) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const all = series.flatMap((s) => s.points);
  if (all.length === 0) return <Text style={styles.empty}>Selecciona al menos un ejercicio en la leyenda.</Text>;

  const tMin = Math.min(...all.map((p) => p.t));
  const tMax = Math.max(...all.map((p) => p.t));
  let lo = Math.min(...all.map((p) => p.v));
  let hi = Math.max(...all.map((p) => p.v));
  if (lo === hi) { lo -= 1; hi += 1; }
  const margin = (hi - lo) * 0.08;
  lo -= margin;
  hi += margin;

  const plotW = Math.max(0, width - PAD.l - PAD.r);
  const plotH = height - PAD.t - PAD.b;
  const x = (t: number) => (tMax === tMin ? PAD.l + plotW / 2 : PAD.l + ((t - tMin) / (tMax - tMin)) * plotW);
  const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * plotH;
  const grid = [lo + margin, (lo + hi) / 2, hi - margin];

  return (
    <View onLayout={onLayout} style={{ height }}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {grid.map((g, i) => (
            <G key={i}>
              <Line x1={PAD.l} x2={width - PAD.r} y1={y(g)} y2={y(g)} stroke={colors.border} strokeWidth={1} />
              <SvgText x={PAD.l - 6} y={y(g) + 4} fill={colors.textMuted} fontSize={11} textAnchor="end">
                {formatNumber(g, 1)}
              </SvgText>
            </G>
          ))}
          {series.map((s) => (
            <G key={s.id}>
              {s.points.length > 1 && (
                <Polyline
                  points={s.points.map((p) => `${x(p.t)},${y(p.v)}`).join(' ')}
                  fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"
                />
              )}
              {s.points.map((p, i) => (
                <Circle key={i} cx={x(p.t)} cy={y(p.v)} r={s.points.length === 1 ? 5 : 3.5} fill={s.color} />
              ))}
            </G>
          ))}
          <SvgText x={x(tMin)} y={height - 6} fill={colors.textMuted} fontSize={11} textAnchor={tMax === tMin ? 'middle' : 'start'}>
            {formatDate(tMin)}
          </SvgText>
          {tMax !== tMin && (
            <SvgText x={x(tMax)} y={height - 6} fill={colors.textMuted} fontSize={11} textAnchor="end">
              {formatDate(tMax)}
            </SvgText>
          )}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.textMuted, paddingVertical: 20, textAlign: 'center' },
});
