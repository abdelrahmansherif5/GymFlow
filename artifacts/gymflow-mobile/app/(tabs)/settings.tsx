import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useGetSettings,
  updateSettings,
} from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { getGetSettingsQueryKey, useGetDays } from "@workspace/api-client-react";
import { Colors } from "@/constants/colors";

const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data: settings, isLoading } = useGetSettings();
  const { data: days } = useGetDays();
  const [saving, setSaving] = useState(false);

  const dayOptions = days?.map((d) => d.dayName) ?? DAYS_EN;

  const handleUpdate = async (field: string, value: string) => {
    if (!settings) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const updated = await updateSettings({
        currentDay: settings.currentDay,
        language: settings.language as "en" | "ar",
        theme: settings.theme as "light" | "dark",
        [field]: value,
      });
      qc.setQueryData(getGetSettingsQueryKey(), updated);
      if (field === "currentDay") {
        await AsyncStorage.setItem(
          "gymflow_settings",
          JSON.stringify({ currentDay: value, language: updated.language, theme: updated.theme })
        );
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Error", "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (settings) {
      AsyncStorage.setItem(
        "gymflow_settings",
        JSON.stringify({
          currentDay: settings.currentDay,
          language: settings.language,
          theme: settings.theme,
        })
      );
    }
  }, [settings]);

  if (isLoading) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: Colors.bg }]}>
        <ActivityIndicator color={Colors.green} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: Colors.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Settings</Text>
        {saving && <ActivityIndicator size="small" color={Colors.green} />}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Today's Day">
          <View style={styles.pillGroup}>
            {dayOptions.map((d) => (
              <Pressable
                key={d}
                style={({ pressed }) => [
                  styles.pill,
                  settings?.currentDay === d && styles.pillActive,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => handleUpdate("currentDay", d)}
              >
                <Text
                  style={[
                    styles.pillText,
                    settings?.currentDay === d && styles.pillTextActive,
                  ]}
                >
                  {d.slice(0, 3)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section title="Language">
          <View style={styles.toggleRow}>
            {(["en", "ar"] as const).map((lang) => (
              <Pressable
                key={lang}
                style={({ pressed }) => [
                  styles.toggleOption,
                  settings?.language === lang && styles.toggleOptionActive,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => handleUpdate("language", lang)}
              >
                <Text style={styles.langFlag}>
                  {lang === "en" ? "🇺🇸" : "🇸🇦"}
                </Text>
                <Text
                  style={[
                    styles.toggleText,
                    settings?.language === lang && styles.toggleTextActive,
                  ]}
                >
                  {lang === "en" ? "English" : "العربية"}
                </Text>
                {settings?.language === lang && (
                  <Feather name="check" size={14} color={Colors.green} />
                )}
              </Pressable>
            ))}
          </View>
        </Section>

        <Section title="Theme">
          <View style={styles.toggleRow}>
            {(["dark", "light"] as const).map((theme) => (
              <Pressable
                key={theme}
                style={({ pressed }) => [
                  styles.toggleOption,
                  settings?.theme === theme && styles.toggleOptionActive,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => handleUpdate("theme", theme)}
              >
                <Feather
                  name={theme === "dark" ? "moon" : "sun"}
                  size={16}
                  color={
                    settings?.theme === theme
                      ? Colors.green
                      : Colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.toggleText,
                    settings?.theme === theme && styles.toggleTextActive,
                  ]}
                >
                  {theme === "dark" ? "Dark" : "Light"}
                </Text>
                {settings?.theme === theme && (
                  <Feather name="check" size={14} color={Colors.green} />
                )}
              </Pressable>
            ))}
          </View>
        </Section>

        <View style={styles.versionCard}>
          <Text style={styles.versionText}>GymFlow v1.0.0</Text>
          <Text style={styles.versionSub}>Built with love for your gains</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
    color: Colors.text,
    fontFamily: "Inter_700Bold",
  },
  content: { paddingHorizontal: 20, gap: 20, paddingTop: 8 },
  section: { gap: 10 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Inter_600SemiBold",
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: Colors.greenMuted,
    borderColor: Colors.green,
  },
  pillText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  pillTextActive: {
    color: Colors.green,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  toggleRow: {
    gap: 8,
  },
  toggleOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleOptionActive: {
    borderColor: Colors.green,
    backgroundColor: Colors.greenMuted,
  },
  toggleText: {
    flex: 1,
    fontSize: 15,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  toggleTextActive: {
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  langFlag: {
    fontSize: 18,
  },
  versionCard: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 4,
  },
  versionText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
  },
  versionSub: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
});
