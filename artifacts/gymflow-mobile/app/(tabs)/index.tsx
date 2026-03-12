import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGetDays, useGetDayMachines } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

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
  const [workoutState, setWorkoutState] = useState<WorkoutState>("active");
  const [streak, setStreak] = useState<StreakData>({
    streak: 0,
    totalWorkouts: 0,
    completedDates: [],
    lastCompletedDate: null,
  });
  const [showDetails, setShowDetails] = useState(false);
  const [currentDaySetting, setCurrentDaySetting] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

  const { data: days, refetch: refetchDays } = useGetDays();
  const todayDay = days?.find(
    (d) => d.dayName.toLowerCase() === currentDaySetting.toLowerCase()
  ) ?? days?.[0];

  const { data: todayMachines } = useGetDayMachines(todayDay?.id ?? 0, {
    query: { enabled: !!todayDay?.id },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [streakRaw, stateRaw, dateRaw, settingsRaw] = await Promise.all([
      AsyncStorage.getItem(STREAK_KEY),
      AsyncStorage.getItem(WORKOUT_STATE_KEY),
      AsyncStorage.getItem(WORKOUT_DATE_KEY),
      AsyncStorage.getItem("gymflow_settings"),
    ]);

    if (streakRaw) setStreak(JSON.parse(streakRaw));

    if (settingsRaw) {
      const s = JSON.parse(settingsRaw);
      setCurrentDaySetting(s.currentDay ?? "");
    }

    const savedDate = dateRaw ?? "";
    const todayStr = today();
    if (savedDate === todayStr && stateRaw) {
      setWorkoutState(stateRaw as WorkoutState);
    } else if (savedDate !== todayStr) {
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
    const newStreak = { ...streak };
    if (!newStreak.completedDates.includes(todayStr)) {
      newStreak.completedDates.push(todayStr);
      newStreak.totalWorkouts += 1;

      if (newStreak.lastCompletedDate) {
        const last = new Date(newStreak.lastCompletedDate);
        const now = new Date(todayStr);
        const diff =
          (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
        newStreak.streak = diff <= 1.5 ? newStreak.streak + 1 : 1;
      } else {
        newStreak.streak = 1;
      }
      newStreak.lastCompletedDate = todayStr;
      setStreak(newStreak);
      await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(newStreak));
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

  const dayLabel = todayDay?.dayName ?? "Today";
  const workoutType = todayDay?.workoutType ?? "Workout";

  return (
    <View style={[styles.root, { backgroundColor: Colors.bg }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.green}
          />
        }
      >
        <View
          style={[
            styles.content,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
          ]}
        >
          <Text style={styles.greeting}>GymFlow</Text>
          <Text style={styles.subGreeting}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>

          <View style={styles.statsRow}>
            <StatCard
              icon="zap"
              iconColor={Colors.orange}
              value={streak.streak}
              label="Day Streak"
              bg={Colors.orangeMuted}
            />
            <StatCard
              icon="award"
              iconColor={Colors.green}
              value={streak.totalWorkouts}
              label="Total Workouts"
              bg={Colors.greenMuted}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Training</Text>
              <View style={styles.dayBadge}>
                <Text style={styles.dayBadgeText}>{dayLabel}</Text>
              </View>
            </View>

            <View style={styles.workoutCard}>
              <View style={styles.workoutInfo}>
                <Feather name="activity" size={20} color={Colors.green} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.workoutType}>{workoutType}</Text>
                  <Text style={styles.workoutSub}>
                    {todayMachines && todayMachines.length > 0
                      ? `${todayMachines.length} machine${todayMachines.length !== 1 ? "s" : ""} planned`
                      : "No machines assigned"}
                  </Text>
                </View>
              </View>

              {workoutState === "active" && (
                <View style={styles.actionRow}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.btnGreen,
                      pressed && styles.btnPressed,
                    ]}
                    onPress={handleDone}
                  >
                    <Feather name="check" size={16} color="#000" />
                    <Text style={styles.btnGreenText}>Done</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.btnGrey,
                      pressed && styles.btnPressed,
                    ]}
                    onPress={handleCancel}
                  >
                    <Feather name="x" size={16} color={Colors.text} />
                    <Text style={styles.btnGreyText}>Cancel</Text>
                  </Pressable>
                  {todayMachines && todayMachines.length > 0 && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.btnDetails,
                        pressed && styles.btnPressed,
                      ]}
                      onPress={() => setShowDetails(true)}
                    >
                      <Feather name="list" size={16} color={Colors.textSecondary} />
                      <Text style={styles.btnDetailsText}>Details</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {workoutState === "done" && (
                <View style={styles.actionRow}>
                  <View style={styles.statusBadge}>
                    <Feather name="check-circle" size={14} color={Colors.green} />
                    <Text style={styles.statusDone}>Completed</Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.btnRedo,
                      pressed && styles.btnPressed,
                    ]}
                    onPress={handleRedo}
                  >
                    <Feather name="refresh-cw" size={14} color={Colors.textSecondary} />
                    <Text style={styles.btnRedoText}>Redo</Text>
                  </Pressable>
                  {todayMachines && todayMachines.length > 0 && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.btnDetails,
                        pressed && styles.btnPressed,
                      ]}
                      onPress={() => setShowDetails(true)}
                    >
                      <Feather name="list" size={16} color={Colors.textSecondary} />
                      <Text style={styles.btnDetailsText}>Details</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {workoutState === "cancelled" && (
                <View style={styles.actionRow}>
                  <View style={[styles.statusBadge, { backgroundColor: Colors.redMuted }]}>
                    <Feather name="x-circle" size={14} color={Colors.red} />
                    <Text style={[styles.statusDone, { color: Colors.red }]}>Cancelled</Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.btnRedo,
                      pressed && styles.btnPressed,
                    ]}
                    onPress={handleRedo}
                  >
                    <Feather name="refresh-cw" size={14} color={Colors.textSecondary} />
                    <Text style={styles.btnRedoText}>Redo</Text>
                  </Pressable>
                  {todayMachines && todayMachines.length > 0 && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.btnDetails,
                        pressed && styles.btnPressed,
                      ]}
                      onPress={() => setShowDetails(true)}
                    >
                      <Feather name="list" size={16} color={Colors.textSecondary} />
                      <Text style={styles.btnDetailsText}>Details</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showDetails}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDetails(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setShowDetails(false)}
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Today's Machines</Text>
          <Text style={styles.sheetSub}>{dayLabel} — {workoutType}</Text>
          {todayMachines && todayMachines.length > 0 ? (
            todayMachines.map((m) => (
              <View key={m.id} style={styles.machineRow}>
                <View style={styles.machineIcon}>
                  <Feather name="activity" size={16} color={Colors.green} />
                </View>
                <Text style={styles.machineName}>{m.name}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No machines assigned for today</Text>
          )}
        </View>
      </Modal>
    </View>
  );
}

function StatCard({
  icon,
  iconColor,
  value,
  label,
  bg,
}: {
  icon: string;
  iconColor: string;
  value: number;
  label: string;
  bg: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: Colors.card }]}>
      <View style={[styles.statIconBg, { backgroundColor: bg }]}>
        <Feather name={icon as any} size={18} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 24 },
  greeting: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
  },
  subGreeting: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: -16,
    fontFamily: "Inter_400Regular",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  section: { gap: 12 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
  },
  dayBadge: {
    backgroundColor: Colors.greenMuted,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dayBadgeText: {
    fontSize: 12,
    color: Colors.green,
    fontFamily: "Inter_500Medium",
    fontWeight: "600",
  },
  workoutCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  workoutInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  workoutType: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
  },
  workoutSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  btnGreen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.green,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  btnGreenText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  btnGrey: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.greyBtn,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnGreyText: {
    color: Colors.text,
    fontWeight: "600",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  btnDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.greyBtn,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  btnDetailsText: {
    color: Colors.textSecondary,
    fontWeight: "600",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  btnRedo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.greyBtn,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnRedoText: {
    color: Colors.textSecondary,
    fontWeight: "500",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  btnPressed: { opacity: 0.7 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.greenMuted,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  statusDone: {
    color: Colors.green,
    fontWeight: "600",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
  },
  sheetSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: -4,
    fontFamily: "Inter_400Regular",
  },
  machineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  machineIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.greenMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  machineName: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 16,
    fontFamily: "Inter_400Regular",
  },
});
