import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { elapsedSeconds, formatDuration } from '../../utils/dates';
import { colors } from '../../theme/theme';

export function SessionTimer({ startedAt }: { startedAt: string }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <Text style={{ color: colors.accent, fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
      {formatDuration(elapsedSeconds(startedAt))}
    </Text>
  );
}
