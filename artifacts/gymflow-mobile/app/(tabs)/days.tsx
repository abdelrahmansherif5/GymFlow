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
import React, { useCallback, useState } from "react";
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
import { Colors } from "@/constants/colors";

type Day = { id: number; dayName: string; workoutType?: string | null; workoutIcon?: string | null; orderIndex: number };
type Machine = { id: number; name: string; imageUrl?: string | null };

export default function DaysScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const { data: days, isLoading, refetch } = useGetDays();

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
        const maxOrder = days?.reduce((m, d) => Math.max(m, d.orderIndex), 0) ?? 0;
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
      <View style={styles.dayCard}>
        <View style={styles.dayInfo}>
          <View style={styles.dayIconBg}>
            <Feather name="calendar" size={16} color={Colors.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.dayName}>{item.dayName}</Text>
            {item.workoutType ? (
              <Text style={styles.dayWorkout}>{item.workoutType}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.dayActions}>
          <Pressable
            onPress={() => setManagingDay(item)}
            style={({ pressed }) => [
              styles.machinesBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Feather name="plus-circle" size={14} color={Colors.green} />
            <Text style={styles.machinesBtnText}>Machines</Text>
          </Pressable>
          <Pressable
            onPress={() => openEdit(item)}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          >
            <Feather name="edit-2" size={15} color={Colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => handleDeleteDay(item.id)}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          >
            <Feather name="trash-2" size={15} color={Colors.red} />
          </Pressable>
        </View>
      </View>
    ),
    []
  );

  return (
    <View style={[styles.root, { backgroundColor: Colors.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Days</Text>
        <Pressable
          onPress={openAdd}
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}
        >
          <Feather name="plus" size={18} color="#000" />
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.green} />
        </View>
      ) : !days?.length ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Feather name="calendar" size={28} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No days yet</Text>
          <Text style={styles.emptyText}>Tap Add to create your first training day</Text>
        </View>
      ) : (
        <FlatList
          data={days}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderDay}
          contentContainerStyle={[
            styles.list,
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
          <View style={styles.overlay}>
            <Pressable style={styles.overlayBg} onPress={closeForm} />
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.sheetWrap}
            >
              <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetTitle}>
                  {editingDay ? "Edit Day" : "New Day"}
                </Text>

                <View style={styles.field}>
                  <Text style={styles.label}>Day Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Monday"
                    placeholderTextColor={Colors.textMuted}
                    value={dayName}
                    onChangeText={setDayName}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Workout Type (optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Chest & Triceps"
                    placeholderTextColor={Colors.textMuted}
                    value={workoutType}
                    onChangeText={setWorkoutType}
                    returnKeyType="done"
                    onSubmitEditing={handleSaveDay}
                  />
                </View>

                <View style={styles.formActions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.cancelBtn,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={closeForm}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.saveBtn,
                      !dayName.trim() && styles.saveBtnDisabled,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={handleSaveDay}
                    disabled={!dayName.trim() || savingDay}
                  >
                    {savingDay ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Text style={styles.saveBtnText}>
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
          onClose={() => setManagingDay(null)}
        />
      )}
    </View>
  );
}

function ManageMachinesModal({
  day,
  onClose,
}: {
  day: Day;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
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
    <Modal
      visible
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={mmStyles.overlay}>
        <Pressable style={mmStyles.overlayBg} onPress={onClose} />
        <View
          style={[
            mmStyles.sheet,
            { paddingBottom: insets.bottom + 16, maxHeight: "80%" },
          ]}
        >
          <View style={mmStyles.sheetHandle} />
          <View style={mmStyles.sheetHeader}>
            <View>
              <Text style={mmStyles.sheetTitle}>Add Machines</Text>
              <Text style={mmStyles.sheetSub}>{day.dayName}</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                mmStyles.closeBtn,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Feather name="x" size={18} color={Colors.textSecondary} />
            </Pressable>
          </View>

          {isLoading ? (
            <View style={mmStyles.center}>
              <ActivityIndicator color={Colors.green} />
            </View>
          ) : !allMachines?.length ? (
            <View style={mmStyles.center}>
              <Text style={mmStyles.emptyText}>
                No machines found. Go to Machines tab to add some.
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}>
              {allMachines.map((machine) => {
                const isAssigned = assignedIds.has(machine.id);
                const isLoading = toggling === machine.id;
                return (
                  <Pressable
                    key={machine.id}
                    style={({ pressed }) => [
                      mmStyles.machineRow,
                      isAssigned && mmStyles.machineRowActive,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => handleToggle(machine)}
                    disabled={!!isLoading}
                  >
                    <View
                      style={[
                        mmStyles.checkbox,
                        isAssigned && mmStyles.checkboxActive,
                      ]}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color={Colors.green} />
                      ) : isAssigned ? (
                        <Feather name="check" size={14} color="#000" />
                      ) : null}
                    </View>
                    <View style={mmStyles.machineInfo}>
                      <Text
                        style={[
                          mmStyles.machineName,
                          isAssigned && mmStyles.machineNameActive,
                        ]}
                      >
                        {machine.name}
                      </Text>
                    </View>
                    <View
                      style={[
                        mmStyles.statusBadge,
                        isAssigned
                          ? mmStyles.statusBadgeActive
                          : mmStyles.statusBadgeInactive,
                      ]}
                    >
                      <Text
                        style={[
                          mmStyles.statusText,
                          isAssigned && mmStyles.statusTextActive,
                        ]}
                      >
                        {isAssigned ? "Added" : "Add"}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <View style={mmStyles.footer}>
            <Text style={mmStyles.footerText}>
              {assignedIds.size} machine{assignedIds.size !== 1 ? "s" : ""} assigned
            </Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                mmStyles.doneBtn,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={mmStyles.doneBtnText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.green,
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  list: {
    paddingHorizontal: 20,
    gap: 10,
    paddingTop: 8,
  },
  dayCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  dayInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dayIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.greenMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  dayName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
  },
  dayWorkout: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
  dayActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  machinesBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.greenMuted,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.green + "40",
  },
  machinesBtnText: {
    color: Colors.green,
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
    backgroundColor: Colors.cardAlt,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheetWrap: {
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
  },
  field: { gap: 8 },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  input: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    fontFamily: "Inter_400Regular",
  },
  formActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.greyBtn,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    color: Colors.text,
    fontWeight: "600",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.green,
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

const mmStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
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
    color: Colors.text,
    fontFamily: "Inter_700Bold",
  },
  sheetSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.cardAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: Colors.textSecondary,
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
    backgroundColor: Colors.cardAlt,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  machineRowActive: {
    borderColor: Colors.green + "60",
    backgroundColor: Colors.greenMuted,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: Colors.green,
    borderColor: Colors.green,
  },
  machineInfo: {
    flex: 1,
  },
  machineName: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  machineNameActive: {
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeActive: {
    backgroundColor: Colors.green + "20",
  },
  statusBadgeInactive: {
    backgroundColor: Colors.greyBtn,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
    fontFamily: "Inter_600SemiBold",
  },
  statusTextActive: {
    color: Colors.green,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  footerText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  doneBtn: {
    backgroundColor: Colors.green,
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
