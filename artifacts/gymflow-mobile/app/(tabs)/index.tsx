import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { loadStreak, saveStreak, markDoneAndCalcStreak, getTodayKey, StreakData } from "@/utils/streak";
import { useDaysList, useSettings } from "@/hooks/useApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

type WorkoutState = 'active' | 'done' | 'cancelled';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [workoutState, setWorkoutState] = useState<WorkoutState>('active');
  const todayKey = getTodayKey();

  const { data: days, isLoading: isDaysLoading } = useDaysList();
  const { data: settings, isLoading: isSettingsLoading } = useSettings();

  useEffect(() => {
    const initData = async () => {
      const data = await loadStreak();
      setStreakData(data);

      const savedState = await AsyncStorage.getItem(`gymflow_workout_state_${todayKey}`);
      if (savedState) {
        setWorkoutState(savedState as WorkoutState);
      }
    };
    initData();
  }, [todayKey]);

  const updateWorkoutState = async (newState: WorkoutState) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setWorkoutState(newState);
    await AsyncStorage.setItem(`gymflow_workout_state_${todayKey}`, newState);

    if (newState === 'done' && streakData) {
      const newStreakData = await markDoneAndCalcStreak(streakData);
      setStreakData(newStreakData);
    }
  };

  const todayDayObj = days?.find(d => d.dayName === settings?.currentDay) || days?.[0];

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
      <Text style={styles.title}>GymFlow</Text>
      <Feather name="zap" size={24} color={Colors.light.orange} />
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsRow}>
      <View style={styles.statCard}>
        <Feather name="zap" size={20} color={Colors.light.orange} />
        <View style={styles.statTexts}>
          <Text style={styles.statValue}>{streakData?.streak || 0}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>
      <View style={styles.statCard}>
        <Feather name="award" size={20} color={Colors.light.tint} />
        <View style={styles.statTexts}>
          <Text style={styles.statValue}>{streakData?.completedDates.length || 0}</Text>
          <Text style={styles.statLabel}>Total Workouts</Text>
        </View>
      </View>
    </View>
  );

  const renderHero = () => {
    if (!todayDayObj) return null;

    return (
      <View style={styles.heroCard}>
        <Text style={styles.heroDayName}>{todayDayObj.dayName}</Text>
        <Text style={styles.heroWorkoutType}>{todayDayObj.workoutType || 'Rest Day'}</Text>

        <View style={styles.heroActions}>
          {workoutState === 'active' && (
            <View style={styles.activeActionsRow}>
              <Pressable
                style={({ pressed }) => [styles.btnCancel, pressed && styles.btnPressed]}
                onPress={() => updateWorkoutState('cancelled')}
              >
                <Feather name="x-circle" size={20} color={Colors.light.red} />
                <Text style={styles.btnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.btnDone, pressed && styles.btnPressed]}
                onPress={() => updateWorkoutState('done')}
              >
                <Feather name="check-circle" size={20} color="#fff" />
                <Text style={styles.btnDoneText}>Done</Text>
              </Pressable>
            </View>
          )}

          {workoutState === 'done' && (
            <View style={styles.stateContainer}>
              <View style={styles.stateSuccessRow}>
                <Feather name="check-circle" size={24} color={Colors.light.tint} />
                <Text style={styles.stateSuccessText}>Workout Complete!</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.btnRedo, pressed && styles.btnPressed]}
                onPress={() => updateWorkoutState('active')}
              >
                <Feather name="rotate-ccw" size={16} color={Colors.light.muted} />
                <Text style={styles.btnRedoText}>Redo</Text>
              </Pressable>
            </View>
          )}

          {workoutState === 'cancelled' && (
            <View style={styles.stateContainer}>
              <View style={styles.stateErrorRow}>
                <Feather name="x-circle" size={24} color={Colors.light.red} />
                <Text style={styles.stateErrorText}>Workout Cancelled</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.btnRedo, pressed && styles.btnPressed]}
                onPress={() => updateWorkoutState('active')}
              >
                <Feather name="rotate-ccw" size={16} color={Colors.light.muted} />
                <Text style={styles.btnRedoText}>Redo</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderDayItem = ({ item }: { item: any }) => {
    const isToday = item.dayName === settings?.currentDay;
    return (
      <View style={[styles.dayRow, isToday && styles.dayRowActive]}>
        <View style={styles.dayRowLeft}>
          <Text style={[styles.dayRowName, isToday && styles.dayRowNameActive]}>{item.dayName}</Text>
          <Text style={[styles.dayRowType, isToday && styles.dayRowTypeActive]}>{item.workoutType || 'Rest'}</Text>
        </View>
        {isToday && <Feather name="chevron-right" size={20} color={Colors.light.tint} />}
      </View>
    );
  };

  if (isDaysLoading || isSettingsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={days}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <>
            {renderStats()}
            <Text style={styles.sectionTitle}>Today's Plan</Text>
            {renderHero()}
            <Text style={styles.sectionTitle}>Weekly Routine</Text>
          </>
        }
        renderItem={renderDayItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: Colors.light.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statTexts: {
    marginLeft: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.muted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  heroCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  heroDayName: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: 4,
  },
  heroWorkoutType: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.tint,
    marginBottom: 24,
  },
  heroActions: {
    marginTop: 8,
  },
  activeActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.red,
    gap: 8,
  },
  btnCancelText: {
    color: Colors.light.red,
    fontSize: 16,
    fontWeight: '600',
  },
  btnDone: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.light.tint,
    gap: 8,
  },
  btnDoneText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  btnPressed: {
    opacity: 0.8,
  },
  stateContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 16,
    borderRadius: 16,
  },
  stateSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  stateSuccessText: {
    color: Colors.light.tint,
    fontSize: 18,
    fontWeight: '600',
  },
  stateErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  stateErrorText: {
    color: Colors.light.red,
    fontSize: 18,
    fontWeight: '600',
  },
  btnRedo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  btnRedoText: {
    color: Colors.light.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  dayRowActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderBottomColor: 'transparent',
  },
  dayRowLeft: {},
  dayRowName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  dayRowNameActive: {
    color: Colors.light.tint,
    fontWeight: '600',
  },
  dayRowType: {
    fontSize: 14,
    color: Colors.light.muted,
  },
  dayRowTypeActive: {
    color: Colors.light.text,
  },
});
