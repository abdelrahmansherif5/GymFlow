import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGetDays, useGetDayMachines } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettings } from "@/contexts/SettingsContext";
import type { AppColors } from "@/constants/colors";

type WorkoutState = "active" | "done" | "cancelled";

const STREAK_KEY = "gymflow_streak";
const WORKOUT_STATE_KEY = "gymflow_workout_state";
const WORKOUT_DATE_KEY = "gymflow_workout_date";

function today() {
  return new Date().toISOString().split("T")[0];
}

interface StreakData {
  streak: number;
  totalWorkouts: number;
  completedDates: string[];
  lastCompletedDate: string | null;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, settings, t, isRTL } = useSettings();
  const S = useMemo(() => makeStyles(colors), [colors]);
  const dir = isRTL ? "rtl" : "ltr";

  const [workoutState, setWorkoutState] = useState<WorkoutState>("active");
  const [streak, setStreak] = useState<StreakData>({
    streak: 0,
    totalWorkouts: 0,
    completedDates: [],
    lastCompletedDate: null,
  });
  const [showDetails, setShowDetails] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: days, refetch: refetchDays } = useGetDays();
  const todayDay =
    days?.find(
      (d) => d.dayName.toLowerCase() === settings.currentDay.toLowerCase()
    ) ?? days?.[0];

  const { data: todayMachines } = useGetDayMachines(todayDay?.id ?? 0, {
    query: { enabled: !!todayDay?.id },
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [streakRaw, stateRaw, dateRaw] = await Promise.all([
      AsyncStorage.getItem(STREAK_KEY),
      AsyncStorage.getItem(WORKOUT_STATE_KEY),
      AsyncStorage.getItem(WORKOUT_DATE_KEY),
    ]);
    if (streakRaw) setStreak(JSON.parse(streakRaw));
    const savedDate = dateRaw ?? "";
    if (savedDate === today() && stateRaw) {
      setWorkoutState(stateRaw as WorkoutState);
    } else if (savedDate !== today()) {
      setWorkoutState("active");
    }
  };

  const saveWorkoutState = async (state: WorkoutState) => {
    await AsyncStorage.setItem(WORKOUT_STATE_KEY, state);
    await AsyncStorage.setItem(WORKOUT_DATE_KEY, today());
  };

  const handleDone = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setWorkoutState("done");
    await saveWorkoutState("done");
    const todayStr = today();
    const ns = { ...streak };
    if (!ns.completedDates.includes(todayStr)) {
      ns.completedDates.push(todayStr);
      ns.totalWorkouts += 1;
      if (ns.lastCompletedDate) {
        const diff =
          (new Date(todayStr).getTime() - new Date(ns.lastCompletedDate).getTime()) /
          86400000;
        ns.streak = diff <= 1.5 ? ns.streak + 1 : 1;
      } else {
        ns.streak = 1;
      }
      ns.lastCompletedDate = todayStr;
      setStreak(ns);
      await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(ns));
    }
  }, [streak]);

  const handleCancel = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setWorkoutState("cancelled");
    await saveWorkoutState("cancelled");
  }, []);

  const handleRedo = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWorkoutState("active");
    await saveWorkoutState("active");
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchDays(), loadData()]);
    setRefreshing(false);
  }, [refetchDays]);

  const dayLabel = todayDay?.dayName ?? settings.currentDay;
  const workoutType = todayDay?.workoutType ?? t.todaysTraining;
  const hasMachines = !!todayMachines && todayMachines.length > 0;

  return (
    <View style={[S.root, { direction: dir }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.green}
          />
        }
      >
        <View style={[S.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}>
          <Text style={S.greeting}>{t.appName}</Text>
          <Text style={S.subGreeting}>
            {new Date().toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
              weekday: "long", month: "long", day: "numeric",
            })}
          </Text>

          <View style={S.statsRow}>
            <StatCard icon="zap" iconColor={colors.orange} value={streak.streak}
              label={t.dayStreak} bg={colors.orangeMuted} colors={colors} />
            <StatCard icon="award" iconColor={colors.green} value={streak.totalWorkouts}
              label={t.totalWorkouts} bg={colors.greenMuted} colors={colors} />
          </View>

          <View style={S.section}>
            <View style={S.sectionHeader}>
              <Text style={S.sectionTitle}>{t.todaysTraining}</Text>
              <View style={[S.dayBadge, { backgroundColor: colors.greenMuted }]}>
                <Text style={[S.dayBadgeText, { color: colors.green }]}>{dayLabel}</Text>
              </View>
            </View>

            <View style={S.workoutCard}>
              <View style={S.workoutInfo}>
                <Feather name="activity" size={20} color={colors.green} />
                <View style={{ flex: 1 }}>
                  <Text style={S.workoutType}>{workoutType}</Text>
                  <Text style={S.workoutSub}>
                    {hasMachines
                      ? t.machinesPlanned(todayMachines!.length)
                      : t.noMachinesAssigned}
                  </Text>
                </View>
              </View>

              <View style={S.actionRow}>
                {workoutState === "active" && (
                  <>
                    <Pressable style={({ pressed }) => [S.btnGreen, pressed && S.pressed]}
                      onPress={handleDone}>
                      <Feather name="check" size={16} color="#000" />
                      <Text style={S.btnGreenText}>{t.done}</Text>
                    </Pressable>
                    <Pressable style={({ pressed }) => [S.btnGrey, pressed && S.pressed]}
                      onPress={handleCancel}>
                      <Feather name="x" size={16} color={colors.text} />
                      <Text style={S.btnGreyText}>{t.cancel}</Text>
                    </Pressable>
                  </>
                )}

                {workoutState === "done" && (
                  <View style={[S.statusBadge, { backgroundColor: colors.greenMuted }]}>
                    <Feather name="check-circle" size={14} color={colors.green} />
                    <Text style={[S.statusText, { color: colors.green }]}>{t.completed}</Text>
                  </View>
                )}

                {workoutState === "cancelled" && (
                  <View style={[S.statusBadge, { backgroundColor: colors.redMuted }]}>
                    <Feather name="x-circle" size={14} color={colors.red} />
                    <Text style={[S.statusText, { color: colors.red }]}>{t.cancelled}</Text>
                  </View>
                )}

                {workoutState !== "active" && (
                  <Pressable style={({ pressed }) => [S.btnRedo, pressed && S.pressed]}
                    onPress={handleRedo}>
                    <Feather name="refresh-cw" size={14} color={colors.textSecondary} />
                    <Text style={S.btnRedoText}>{t.redo}</Text>
                  </Pressable>
                )}

                {hasMachines && (
                  <Pressable style={({ pressed }) => [S.btnDetails, pressed && S.pressed]}
                    onPress={() => setShowDetails(true)}>
                    <Feather name="list" size={16} color={colors.textSecondary} />
                    <Text style={S.btnDetailsText}>{t.details}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showDetails} animationType="slide" transparent
        onRequestClose={() => setShowDetails(false)}>
        <Pressable style={S.overlay} onPress={() => setShowDetails(false)} />
        <View style={[S.sheet, { backgroundColor: colors.card, borderTopColor: colors.border,
          paddingBottom: insets.bottom + 24, direction: dir }]}>
          <View style={[S.sheetHandle, { backgroundColor: colors.border }]} />
          <Text style={S.sheetTitle}>{t.todaysMachines}</Text>
          <Text style={S.sheetSub}>{dayLabel} — {workoutType}</Text>
          {todayMachines && todayMachines.length > 0 ? (
            todayMachines.map((m) => (
              <View key={m.id} style={[S.machineRow, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
                <View style={[S.machineIcon, { backgroundColor: colors.greenMuted }]}>
                  <Feather name="activity" size={16} color={colors.green} />
                </View>
                <Text style={S.machineName}>{m.name}</Text>
              </View>
            ))
          ) : (
            <Text style={S.emptyText}>{t.noMachinesForToday}</Text>
          )}
        </View>
      </Modal>
    </View>
  );
}

function StatCard({ icon, iconColor, value, label, bg, colors }: {
  icon: string; iconColor: string; value: number; label: string; bg: string; colors: AppColors;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16,
      gap: 8, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: bg,
        alignItems: "center", justifyContent: "center" }}>
        <Feather name={icon as any} size={18} color={iconColor} />
      </View>
      <Text style={{ fontSize: 28, fontWeight: "700", color: colors.text, fontFamily: "Inter_700Bold" }}>
        {value}
      </Text>
      <Text style={{ fontSize: 12, color: colors.textSecondary, fontFamily: "Inter_400Regular" }}>
        {label}
      </Text>
    </View>
  );
}

function makeStyles(C: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    content: { paddingHorizontal: 20, gap: 24 },
    greeting: { fontSize: 32, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold" },
    subGreeting: { fontSize: 14, color: C.textSecondary, marginTop: -16, fontFamily: "Inter_400Regular" },
    statsRow: { flexDirection: "row", gap: 12 },
    section: { gap: 12 },
    sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    sectionTitle: { fontSize: 18, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold" },
    dayBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    dayBadgeText: { fontSize: 12, fontFamily: "Inter_500Medium", fontWeight: "600" },
    workoutCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, gap: 16, borderWidth: 1, borderColor: C.border },
    workoutInfo: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    workoutType: { fontSize: 16, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold" },
    workoutSub: { fontSize: 12, color: C.textSecondary, marginTop: 2, fontFamily: "Inter_400Regular" },
    actionRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    btnGreen: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.green, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
    btnGreenText: { color: "#000", fontWeight: "700", fontSize: 14, fontFamily: "Inter_700Bold" },
    btnGrey: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.greyBtn, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: C.border },
    btnGreyText: { color: C.text, fontWeight: "600", fontSize: 14, fontFamily: "Inter_600SemiBold" },
    btnDetails: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.greyBtn, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: C.borderLight },
    btnDetailsText: { color: C.textSecondary, fontWeight: "600", fontSize: 14, fontFamily: "Inter_600SemiBold" },
    btnRedo: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.greyBtn, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: C.border },
    btnRedoText: { color: C.textSecondary, fontWeight: "500", fontSize: 13, fontFamily: "Inter_500Medium" },
    pressed: { opacity: 0.7 },
    statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
    statusText: { fontWeight: "600", fontSize: 13, fontFamily: "Inter_600SemiBold" },
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
    sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12, borderTopWidth: 1 },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
    sheetTitle: { fontSize: 20, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold" },
    sheetSub: { fontSize: 13, color: C.textSecondary, marginTop: -4, fontFamily: "Inter_400Regular" },
    machineRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, padding: 14, borderWidth: 1 },
    machineIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    machineName: { fontSize: 14, color: C.text, fontFamily: "Inter_500Medium", fontWeight: "500" },
    emptyText: { color: C.textMuted, fontSize: 14, textAlign: "center", paddingVertical: 16, fontFamily: "Inter_400Regular" },
  });
}
