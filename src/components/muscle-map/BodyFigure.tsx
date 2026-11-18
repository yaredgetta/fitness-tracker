import { View } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";
import {
  BODY_BACK,
  BODY_BASE,
  BODY_FRONT,
  BODY_VIEWBOX,
  HEAD,
} from "../../constants/bodyPaths";
import type { MuscleGroup } from "../../models/muscle";
import type { IntensityLevel } from "../../services/muscleService";
import { BODY_BASE_COLOR, HEAT_COLORS, colors } from "../../theme/theme";
import { mirrorPath } from "../../utils/svgPath";

interface Props {
  view: "front" | "back";
  levels: Record<MuscleGroup, IntensityLevel>;
  selected: MuscleGroup | null;
  onSelect: (muscle: MuscleGroup) => void;
}

export function BodyFigure({ view, levels, selected, onSelect }: Props) {
  const shapes = view === "front" ? BODY_FRONT : BODY_BACK;
  // El músculo seleccionado se dibuja al final para que su contorno no quede tapado.
  const entries = (Object.entries(shapes) as [MuscleGroup, string[]][]).sort(
    ([a], [b]) => Number(a === selected) - Number(b === selected),
  );

  return (
    <View
      style={{
        width: "100%",
        aspectRatio: BODY_VIEWBOX.width / BODY_VIEWBOX.height,
      }}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${BODY_VIEWBOX.width} ${BODY_VIEWBOX.height}`}
      >
        <Circle cx={HEAD.cx} cy={HEAD.cy} r={HEAD.r} fill={BODY_BASE_COLOR} />
        {BODY_BASE.map((d) => (
          <G key={d}>
            <Path d={d} fill={BODY_BASE_COLOR} />
            <Path d={mirrorPath(d)} fill={BODY_BASE_COLOR} />
          </G>
        ))}
        {entries.map(([muscle, paths]) =>
          paths.map((d) => {
            const isSelected = muscle === selected;
            const common = {
              fill: HEAT_COLORS[levels[muscle]],
              stroke: isSelected ? colors.text : colors.background,
              strokeWidth: isSelected ? 2.5 : 1.5,
              onPress: () => onSelect(muscle),
            };
            return (
              <G key={`${muscle}-${d}`}>
                <Path d={d} {...common} />
                <Path d={mirrorPath(d)} {...common} />
              </G>
            );
          }),
        )}
      </Svg>
    </View>
  );
}
