import {
  useGetDays,
  useGetDayMachines,
  useGetMachines,
  createDay,
  updateDay,
  deleteDay,
  addDayMachine,
  removeDayMachine,
  getGetDaysQueryKey,
  getGetDayMachinesQueryKey,
} from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { useSettings } from "@/contexts/SettingsContext";
import type { AppColors } from "@/constants/colors";

type Day = {
  id: number;
  dayName: string;
  workoutType?: string | null;
  workoutIcon?: string | null;
  orderIndex: number;
};
type Machine = { id: number; name: string; imageUrl?: string | null };

export default function DaysScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useSettings();
  const S = useMemo(() => makeStyles(colors), [colors]);
  const qc = useQueryClient();

  const { data: days, isLoading } = useGetDays();

  const [showDayForm, setShowDayForm] = useState(false);
  const [editingDay, setEditingDay] = useState<Day | null>(null);
  const [dayName, setDayName] = useState("");
  const [workoutType, setWorkoutType] = useState("");
  const [savingDay, setSavingDay] = useState(false);

  const [managingDay, setManagingDay] = useState<Day | null>(null);

  const openAdd = () => {
    setEditingDay(null);
    setDayName("");
    setWorkoutType("");
    setShowDayForm(true);
  };

  const openEdit = (d: Day) => {
    setEditingDay(d);
    setDayName(d.dayName);
    setWorkoutType(d.workoutType ?? "");
    setShowDayForm(true);
  };

  const closeForm = () => {
    setShowDayForm(false);
    setEditingDay(null);
    setDayName("");
    setWorkoutType("");
  };

  const handleSaveDay = async () => {
    if (!dayName.trim()) return;
    setSavingDay(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (editingDay) {
        await updateDay(editingDay.id, {
          dayName: dayName.trim(),
          workoutType: workoutType.trim() || null,
        });
      } else {
        const maxOrder =
          days?.reduce((m, d) => Math.max(m, d.orderIndex), 0) ?? 0;
        await createDay({
          dayName: dayName.trim(),
          workoutType: workoutType.trim() || null,
          orderIndex: maxOrder + 1,
        });
      }
      await qc.invalidateQueries({ queryKey: getGetDaysQueryKey() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeForm();
    } catch {
      Alert.alert("Error", "Could not save day.");
    } finally {
      setSavingDay(false);
    }
  };

  const handleDeleteDay = async (id: number) => {
    Alert.alert("Delete Day", "Remove this day?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await deleteDay(id);
          qc.invalidateQueries({ queryKey: getGetDaysQueryKey() });
        },
      },
    ]);
  };

  const renderDay = useCallback(
    ({ item }: { item: Day }) => (
      <View style={S.dayCard}>
        <View style={S.dayInfo}>
          <View style={S.dayIconBg}>
            <Feather name="calendar" size={16} color={colors.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.dayName}>{item.dayName}</Text>
            {!!item.workoutType && (
              <Text style={S.dayWorkout}>{item.workoutType}</Text>
            )}
          </View>
        </View>
        <View style={S.dayActions}>
          <Pressable
            onPress={() => setManagingDay(item)}
            style={({ pressed }) => [S.machinesBtn, pressed && { opacity: 0.7 }]}
          >
            <Feather name="plus-circle" size={14} color={colors.green} />
            <Text style={S.machinesBtnText}>Machines</Text>
          </Pressable>
          <Pressable
            onPress={() => openEdit(item)}
            style={({ pressed }) => [S.iconBtn, pressed && { opacity: 0.6 }]}
          >
            <Feather name="edit-2" size={15} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => handleDeleteDay(item.id)}
            style={({ pressed }) => [S.iconBtn, pressed && { opacity: 0.6 }]}
          >
            <Feather name="trash-2" size={15} color={colors.red} />
          </Pressable>
        </View>
      </View>
    ),
    [S, colors]
  );

  return (
    <View style={S.root}>
      <View style={[S.header, { paddingTop: insets.top + 16 }]}>
        <Text style={S.title}>Days</Text>
        <Pressable
          onPress={openAdd}
          style={({ pressed }) => [S.addBtn, pressed && { opacity: 0.7 }]}
        >
          <Feather name="plus" size={18} color="#000" />
          <Text style={S.addBtnText}>Add</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={S.center}>
          <ActivityIndicator color={colors.green} />
        </View>
      ) : !days?.length ? (
        <View style={S.center}>
          <View style={S.emptyIcon}>
            <Feather name="calendar" size={28} color={colors.textMuted} />
          </View>
          <Text style={S.emptyTitle}>No days yet</Text>
          <Text style={S.emptyHint}>Tap Add to create your first training day</Text>
        </View>
      ) : (
        <FlatList
          data={days}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderDay}
          contentContainerStyle={[
            S.list,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={showDayForm}
        animationType="slide"
        transparent
        onRequestClose={closeForm}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={S.overlay}>
            <Pressable style={S.overlayBg} onPress={closeForm} />
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={S.sheetWrap}
            >
              <View style={[S.sheet, { paddingBottom: insets.bottom + 16 }]}>
                <View style={S.sheetHandle} />
                <Text style={S.sheetTitle}>
                  {editingDay ? "Edit Day" : "New Day"}
                </Text>

                <View style={S.field}>
                  <Text style={S.label}>Day Name</Text>
                  <TextInput
                    style={S.input}
                    placeholder="e.g. Monday"
                    placeholderTextColor={colors.textMuted}
                    value={dayName}
                    onChangeText={setDayName}
                    returnKeyType="next"
                  />
                </View>

                <View style={S.field}>
                  <Text style={S.label}>Workout Type (optional)</Text>
                  <TextInput
                    style={S.input}
                    placeholder="e.g. Chest & Triceps"
                    placeholderTextColor={colors.textMuted}
                    value={workoutType}
                    onChangeText={setWorkoutType}
                    returnKeyType="done"
                    onSubmitEditing={handleSaveDay}
                  />
                </View>

                <View style={S.formActions}>
                  <Pressable
                    style={({ pressed }) => [
                      S.cancelBtn,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={closeForm}
                  >
                    <Text style={S.cancelBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      S.saveBtn,
                      !dayName.trim() && S.saveBtnDisabled,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={handleSaveDay}
                    disabled={!dayName.trim() || savingDay}
                  >
                    {savingDay ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Text style={S.saveBtnText}>
                        {editingDay ? "Save" : "Create"}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {managingDay && (
        <ManageMachinesModal
          day={managingDay}
          colors={colors}
          onClose={() => setManagingDay(null)}
        />
      )}
    </View>
  );
}

function ManageMachinesModal({
  day,
  colors,
  onClose,
}: {
  day: Day;
  colors: AppColors;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const MM = useMemo(() => makeMMStyles(colors), [colors]);
  const { data: allMachines } = useGetMachines();
  const { data: dayMachines, isLoading } = useGetDayMachines(day.id);
  const [toggling, setToggling] = useState<number | null>(null);

  const assignedIds = new Set(dayMachines?.map((m) => m.id) ?? []);

  const handleToggle = async (machine: Machine) => {
    setToggling(machine.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (assignedIds.has(machine.id)) {
        await removeDayMachine(day.id, machine.id);
      } else {
        await addDayMachine(day.id, { machineId: machine.id });
      }
      await qc.invalidateQueries({
        queryKey: getGetDayMachinesQueryKey(day.id),
      });
    } catch {
      Alert.alert("Error", "Could not update machines.");
    } finally {
      setToggling(null);
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={MM.overlay}>
        <Pressable style={MM.overlayBg} onPress={onClose} />
        <View
          style={[
            MM.sheet,
            { paddingBottom: insets.bottom + 16, maxHeight: "80%" },
          ]}
        >
          <View style={MM.sheetHandle} />
          <View style={MM.sheetHeader}>
            <View>
              <Text style={MM.sheetTitle}>Add Machines</Text>
              <Text style={MM.sheetSub}>{day.dayName}</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [MM.closeBtn, pressed && { opacity: 0.6 }]}
            >
              <Feather name="x" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          {isLoading ? (
            <View style={MM.center}>
              <ActivityIndicator color={colors.green} />
            </View>
          ) : !allMachines?.length ? (
            <View style={MM.center}>
              <Text style={MM.emptyText}>
                No machines found. Go to Machines tab to add some.
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}>
              {allMachines.map((machine) => {
                const isAssigned = assignedIds.has(machine.id);
                const isToggling = toggling === machine.id;
                return (
                  <Pressable
                    key={machine.id}
                    style={({ pressed }) => [
                      MM.machineRow,
                      isAssigned && MM.machineRowActive,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => handleToggle(machine)}
                    disabled={!!isToggling}
                  >
                    <View
                      style={[
                        MM.checkbox,
                        isAssigned && MM.checkboxActive,
                      ]}
                    >
                      {isToggling ? (
                        <ActivityIndicator size="small" color={colors.green} />
                      ) : isAssigned ? (
                        <Feather name="check" size={14} color="#000" />
                      ) : null}
                    </View>
                    <Text
                      style={[
                        MM.machineName,
                        isAssigned && MM.machineNameActive,
                      ]}
                    >
                      {machine.name}
                    </Text>
                    <View
                      style={[
                        MM.badge,
                        isAssigned ? MM.badgeActive : MM.badgeInactive,
                      ]}
                    >
                      <Text
                        style={[MM.badgeText, isAssigned && MM.badgeTextActive]}
                      >
                        {isAssigned ? "Added" : "Add"}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <View style={MM.footer}>
            <Text style={MM.footerText}>
              {assignedIds.size} machine{assignedIds.size !== 1 ? "s" : ""}{" "}
              assigned
            </Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [MM.doneBtn, pressed && { opacity: 0.8 }]}
            >
              <Text style={MM.doneBtnText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(C: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
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
    addBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: C.green,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 10,
    },
    addBtnText: {
      color: "#000",
      fontWeight: "700",
      fontSize: 14,
      fontFamily: "Inter_700Bold",
    },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
    emptyIcon: {
      width: 60,
      height: 60,
      borderRadius: 16,
      backgroundColor: C.card,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: C.text,
      fontFamily: "Inter_600SemiBold",
    },
    emptyHint: {
      fontSize: 14,
      color: C.textSecondary,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      paddingHorizontal: 32,
    },
    list: { paddingHorizontal: 20, gap: 10, paddingTop: 8 },
    dayCard: {
      backgroundColor: C.card,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: C.border,
      gap: 12,
    },
    dayInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
    dayIconBg: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: C.greenMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    dayName: {
      fontSize: 16,
      fontWeight: "600",
      color: C.text,
      fontFamily: "Inter_600SemiBold",
    },
    dayWorkout: {
      fontSize: 12,
      color: C.textSecondary,
      marginTop: 2,
      fontFamily: "Inter_400Regular",
    },
    dayActions: { flexDirection: "row", alignItems: "center", gap: 8 },
    machinesBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: C.greenMuted,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.green + "40",
    },
    machinesBtnText: {
      color: C.green,
      fontWeight: "600",
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: C.cardAlt,
    },
    overlay: { flex: 1, justifyContent: "flex-end" },
    overlayBg: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.6)",
    },
    sheetWrap: { justifyContent: "flex-end" },
    sheet: {
      backgroundColor: C.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      gap: 16,
      borderTopWidth: 1,
      borderTopColor: C.border,
    },
    sheetHandle: {
      width: 40,
      height: 4,
      backgroundColor: C.border,
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: 4,
    },
    sheetTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: C.text,
      fontFamily: "Inter_700Bold",
    },
    field: { gap: 8 },
    label: {
      fontSize: 13,
      color: C.textSecondary,
      fontFamily: "Inter_500Medium",
      fontWeight: "500",
    },
    input: {
      backgroundColor: C.cardAlt,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      color: C.text,
      borderWidth: 1,
      borderColor: C.border,
      fontFamily: "Inter_400Regular",
    },
    formActions: { flexDirection: "row", gap: 10, marginTop: 4 },
    cancelBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: C.greyBtn,
      alignItems: "center",
      borderWidth: 1,
      borderColor: C.border,
    },
    cancelBtnText: {
      color: C.text,
      fontWeight: "600",
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
    },
    saveBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: C.green,
      alignItems: "center",
    },
    saveBtnDisabled: { opacity: 0.4 },
    saveBtnText: {
      color: "#000",
      fontWeight: "700",
      fontSize: 15,
      fontFamily: "Inter_700Bold",
    },
  });
}

function makeMMStyles(C: AppColors) {
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: "flex-end" },
    overlayBg: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.6)",
    },
    sheet: {
      backgroundColor: C.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: C.border,
    },
    sheetHandle: {
      width: 40,
      height: 4,
      backgroundColor: C.border,
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: 4,
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    sheetTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: C.text,
      fontFamily: "Inter_700Bold",
    },
    sheetSub: {
      fontSize: 13,
      color: C.textSecondary,
      marginTop: 2,
      fontFamily: "Inter_400Regular",
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: C.cardAlt,
      alignItems: "center",
      justifyContent: "center",
    },
    center: {
      paddingVertical: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyText: {
      color: C.textSecondary,
      fontSize: 14,
      textAlign: "center",
      paddingHorizontal: 24,
      fontFamily: "Inter_400Regular",
    },
    machineRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderRadius: 12,
      backgroundColor: C.cardAlt,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: C.border,
    },
    machineRowActive: {
      borderColor: C.green + "60",
      backgroundColor: C.greenMuted,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: C.border,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxActive: { backgroundColor: C.green, borderColor: C.green },
    machineName: {
      flex: 1,
      fontSize: 15,
      color: C.textSecondary,
      fontFamily: "Inter_500Medium",
      fontWeight: "500",
    },
    machineNameActive: { color: C.text },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    badgeActive: { backgroundColor: C.green + "20" },
    badgeInactive: { backgroundColor: C.greyBtn },
    badgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: C.textMuted,
      fontFamily: "Inter_600SemiBold",
    },
    badgeTextActive: { color: C.green },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: C.border,
      paddingTop: 12,
      marginTop: 4,
    },
    footerText: {
      fontSize: 13,
      color: C.textSecondary,
      fontFamily: "Inter_400Regular",
    },
    doneBtn: {
      backgroundColor: C.green,
      paddingVertical: 10,
      paddingHorizontal: 24,
      borderRadius: 10,
    },
    doneBtnText: {
      color: "#000",
      fontWeight: "700",
      fontSize: 14,
      fontFamily: "Inter_700Bold",
    },
  });
}
