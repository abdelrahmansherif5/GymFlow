import { useGetDays } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettings } from "@/contexts/SettingsContext";
import type { AppColors } from "@/constants/colors";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, settings, updateSetting, loading } = useSettings();
  const S = useMemo(() => makeStyles(colors), [colors]);
  const { data: days } = useGetDays();

  const dayOptions = days?.map((d) => d.dayName) ?? [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
  ];

  const handleUpdate = async (
    field: "currentDay" | "language" | "theme",
    value: string
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateSetting(field, value);
  };

  if (loading) {
    return (
      <View style={[S.root, S.center]}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }

  return (
    <View style={S.root}>
      <View style={[S.header, { paddingTop: insets.top + 16 }]}>
        <Text style={S.title}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          S.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Today's Day" colors={colors}>
          <View style={S.pillGroup}>
            {dayOptions.map((d) => (
              <Pressable
                key={d}
                style={({ pressed }) => [
                  S.pill,
                  settings.currentDay === d && S.pillActive,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => handleUpdate("currentDay", d)}
              >
                <Text
                  style={[
                    S.pillText,
                    settings.currentDay === d && S.pillTextActive,
                  ]}
                >
                  {d.slice(0, 3)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section title="Language" colors={colors}>
          <View style={S.optionGroup}>
            {(["en", "ar"] as const).map((lang) => {
              const active = settings.language === lang;
              return (
                <Pressable
                  key={lang}
                  style={({ pressed }) => [
                    S.optionRow,
                    active && S.optionRowActive,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => handleUpdate("language", lang)}
                >
                  <Text style={S.optionFlag}>
                    {lang === "en" ? "🇺🇸" : "🇸🇦"}
                  </Text>
                  <Text style={[S.optionText, active && S.optionTextActive]}>
                    {lang === "en" ? "English" : "العربية"}
                  </Text>
                  {active && (
                    <Feather name="check" size={16} color={colors.green} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="Theme" colors={colors}>
          <View style={S.optionGroup}>
            {(["dark", "light"] as const).map((theme) => {
              const active = settings.theme === theme;
              return (
                <Pressable
                  key={theme}
                  style={({ pressed }) => [
                    S.optionRow,
                    active && S.optionRowActive,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => handleUpdate("theme", theme)}
                >
                  <Feather
                    name={theme === "dark" ? "moon" : "sun"}
                    size={18}
                    color={active ? colors.green : colors.textSecondary}
                  />
                  <Text style={[S.optionText, active && S.optionTextActive]}>
                    {theme === "dark" ? "Dark" : "Light"}
                  </Text>
                  {active && (
                    <Feather name="check" size={16} color={colors.green} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Section>

        <View style={S.versionCard}>
          <Text style={S.versionText}>GymFlow v1.0.0</Text>
          <Text style={S.versionSub}>Built with love for your gains</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: AppColors;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          fontFamily: "Inter_600SemiBold",
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {children}
      </View>
    </View>
  );
}

function makeStyles(C: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    center: { alignItems: "center", justifyContent: "center" },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: C.text,
      fontFamily: "Inter_700Bold",
    },
    content: { paddingHorizontal: 20, gap: 20, paddingTop: 8 },
    pillGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    pill: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: C.cardAlt,
      borderWidth: 1,
      borderColor: C.border,
    },
    pillActive: { backgroundColor: C.greenMuted, borderColor: C.green },
    pillText: {
      fontSize: 13,
      color: C.textSecondary,
      fontFamily: "Inter_500Medium",
      fontWeight: "500",
    },
    pillTextActive: {
      color: C.green,
      fontWeight: "700",
      fontFamily: "Inter_700Bold",
    },
    optionGroup: { gap: 8 },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderRadius: 12,
      backgroundColor: C.cardAlt,
      borderWidth: 1,
      borderColor: C.border,
    },
    optionRowActive: { borderColor: C.green, backgroundColor: C.greenMuted },
    optionFlag: { fontSize: 18 },
    optionText: {
      flex: 1,
      fontSize: 15,
      color: C.textSecondary,
      fontFamily: "Inter_500Medium",
      fontWeight: "500",
    },
    optionTextActive: {
      color: C.text,
      fontFamily: "Inter_600SemiBold",
      fontWeight: "600",
    },
    versionCard: {
      alignItems: "center",
      paddingVertical: 24,
      gap: 4,
    },
    versionText: {
      fontSize: 14,
      color: C.textMuted,
      fontFamily: "Inter_500Medium",
    },
    versionSub: {
      fontSize: 12,
      color: C.textMuted,
      fontFamily: "Inter_400Regular",
    },
  });
}
