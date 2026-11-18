import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button } from "../components/common/Button";
import { useUserStore } from "../store/userStore";
import { colors, radius, spacing } from "../theme/theme";

export default function Welcome() {
  const router = useRouter();
  const setName = useUserStore((s) => s.setName);
  const [value, setValue] = useState("");
  const canContinue = value.trim().length > 0;

  const submit = async () => {
    if (!canContinue) return;
    await setName(value);
    router.replace("/dashboard");
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.logo}>
        <Text style={styles.logoMark}>FT</Text>
      </View>
      <Text style={styles.title}>Fitness Tracker</Text>
      <Text style={styles.subtitle}>
        Registra cada serie, compara con tu última sesión y mira cómo avanzas.
      </Text>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder="¿Cómo te llamas?"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        returnKeyType="done"
        onSubmitEditing={submit}
        autoCapitalize="words"
      />
      <Button label="Empezar" onPress={submit} disabled={!canContinue} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  logoMark: { color: "#0C0C0E", fontSize: 24, fontWeight: "900" },
  title: { color: colors.text, fontSize: 34, fontWeight: "800" },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  input: {
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
