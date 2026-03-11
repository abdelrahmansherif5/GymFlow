import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Modal, TextInput, ActivityIndicator, Alert, Platform } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useDaysList, useDayCreate, useDayUpdate, useDayDelete } from "@/hooks/useApi";
import * as Haptics from "expo-haptics";

export default function DaysScreen() {
  const insets = useSafeAreaInsets();
  const { data: days, isLoading } = useDaysList();
  const createDay = useDayCreate();
  const updateDay = useDayUpdate();
  const deleteDay = useDayDelete();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dayName, setDayName] = useState("");
  const [workoutType, setWorkoutType] = useState("");
  const [orderIndex, setOrderIndex] = useState("0");

  const openAddModal = () => {
    setEditingId(null);
    setDayName("");
    setWorkoutType("");
    setOrderIndex(String(days?.length || 0));
    setModalVisible(true);
  };

  const openEditModal = (day: any) => {
    setEditingId(day.id);
    setDayName(day.dayName);
    setWorkoutType(day.workoutType || "");
    setOrderIndex(String(day.orderIndex));
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!dayName.trim()) {
      Alert.alert("Error", "Day name is required");
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (editingId) {
      updateDay.mutate({
        id: editingId,
        data: {
          dayName,
          workoutType: workoutType || null,
          orderIndex: parseInt(orderIndex, 10) || 0,
        }
      });
    } else {
      createDay.mutate({
        data: {
          dayName,
          workoutType: workoutType || null,
          orderIndex: parseInt(orderIndex, 10) || 0,
        }
      });
    }
    
    setModalVisible(false);
  };

  const handleDelete = (id: number) => {
    Alert.alert("Delete Day", "Are you sure you want to delete this day?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          deleteDay.mutate({ id });
        }
      }
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Text style={styles.title}>Manage Days</Text>
        <Pressable onPress={openAddModal} style={({ pressed }) => [styles.addButton, pressed && styles.btnPressed]}>
          <Feather name="plus" size={24} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={days}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.dayCard}>
            <View style={styles.dayInfo}>
              <Text style={styles.dayName}>{item.dayName}</Text>
              <Text style={styles.workoutType}>{item.workoutType || 'Rest'}</Text>
            </View>
            <View style={styles.actions}>
              <Pressable onPress={() => openEditModal(item)} style={styles.actionBtn}>
                <Feather name="edit-2" size={18} color={Colors.light.muted} />
              </Pressable>
              <Pressable onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
                <Feather name="trash-2" size={18} color={Colors.light.red} />
              </Pressable>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Day' : 'Add Day'}</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={Colors.light.text} />
              </Pressable>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Day Name</Text>
              <TextInput
                style={styles.input}
                value={dayName}
                onChangeText={setDayName}
                placeholder="e.g. Monday"
                placeholderTextColor={Colors.light.muted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Workout Type</Text>
              <TextInput
                style={styles.input}
                value={workoutType}
                onChangeText={setWorkoutType}
                placeholder="e.g. Push, Pull, Legs"
                placeholderTextColor={Colors.light.muted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Order Index</Text>
              <TextInput
                style={styles.input}
                value={orderIndex}
                onChangeText={setOrderIndex}
                keyboardType="numeric"
                placeholder="e.g. 0"
                placeholderTextColor={Colors.light.muted}
              />
            </View>

            <Pressable 
              style={({ pressed }) => [styles.saveBtn, pressed && styles.btnPressed]} 
              onPress={handleSave}
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  dayCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  dayInfo: {},
  dayName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  workoutType: {
    fontSize: 14,
    color: Colors.light.tint,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    padding: 4,
  },
  btnPressed: {
    opacity: 0.8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: Colors.light.muted,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 16,
    color: Colors.light.text,
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
