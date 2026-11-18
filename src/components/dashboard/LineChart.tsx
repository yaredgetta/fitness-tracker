import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { colors } from '../../theme/theme';

interface Props {
  values: number[];
  /** Una etiqueta por valor (solo se muestran la primera y la última). */
  labels: string[];
  height?: number;
}

const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
const PAD = { l: 44, r: 14, t: 14, b: 26 };

export function LineChart({ values, labels, height = 170 }: Props) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (values.length === 0) return <Text style={styles.empty}>Sin datos para esta métrica.</Text>;

  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (lo === hi) { lo -= 1; hi += 1; }
  const plotW = Math.max(0, width - PAD.l - PAD.r);
  const plotH = height - PAD.t - PAD.b;
  const x = (i: number) => (values.length === 1 ? PAD.l + plotW / 2 : PAD.l + (i * plotW) / (values.length - 1));
  const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * plotH;
  const grid = [lo, (lo + hi) / 2, hi];

  return (
    <View onLayout={onLayout} style={{ height }}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {grid.map((g) => (
            <G key={g}>
              <Line x1={PAD.l} x2={width - PAD.r} y1={y(g)} y2={y(g)} stroke={colors.border} strokeWidth={1} />
              <SvgText x={PAD.l - 6} y={y(g) + 4} fill={colors.textMuted} fontSize={11} textAnchor="end">
                {fmt(g)}
              </SvgText>
            </G>
          ))}
          <Polyline
            points={values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
            fill="none" stroke={colors.accent} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round"
          />
          {values.map((v, i) => (
            <Circle key={i} cx={x(i)} cy={y(v)} r={4} fill={colors.accent} />
          ))}
          <SvgText x={x(0)} y={height - 6} fill={colors.textMuted} fontSize={11} textAnchor={values.length === 1 ? 'middle' : 'start'}>
            {labels[0]}
          </SvgText>
          {values.length > 1 && (
            <SvgText x={x(values.length - 1)} y={height - 6} fill={colors.textMuted} fontSize={11} textAnchor="end">
              {labels[labels.length - 1]}
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
