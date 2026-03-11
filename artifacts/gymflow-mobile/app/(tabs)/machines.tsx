import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Modal, TextInput, ActivityIndicator, Alert, Platform } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useMachinesList, useMachineCreate, useMachineUpdate, useMachineDelete } from "@/hooks/useApi";
import * as Haptics from "expo-haptics";

export default function MachinesScreen() {
  const insets = useSafeAreaInsets();
  const { data: machines, isLoading } = useMachinesList();
  const createMachine = useMachineCreate();
  const updateMachine = useMachineUpdate();
  const deleteMachine = useMachineDelete();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const openAddModal = () => {
    setEditingId(null);
    setName("");
    setImageUrl("");
    setModalVisible(true);
  };

  const openEditModal = (machine: any) => {
    setEditingId(machine.id);
    setName(machine.name);
    setImageUrl(machine.imageUrl || "");
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Machine name is required");
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (editingId) {
      updateMachine.mutate({
        id: editingId,
        data: {
          name,
          imageUrl: imageUrl || null,
        }
      });
    } else {
      createMachine.mutate({
        data: {
          name,
          imageUrl: imageUrl || null,
        }
      });
    }
    
    setModalVisible(false);
  };

  const handleDelete = (id: number) => {
    Alert.alert("Delete Machine", "Are you sure you want to delete this machine?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          deleteMachine.mutate({ id });
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
        <Text style={styles.title}>Machines</Text>
        <Pressable onPress={openAddModal} style={({ pressed }) => [styles.addButton, pressed && styles.btnPressed]}>
          <Feather name="plus" size={24} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={machines}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="barbell" size={24} color={Colors.light.tint} />
              </View>
              <Text style={styles.machineName}>{item.name}</Text>
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
              <Text style={styles.modalTitle}>{editingId ? 'Edit Machine' : 'Add Machine'}</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={Colors.light.text} />
              </Pressable>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Machine Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Leg Press"
                placeholderTextColor={Colors.light.muted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Image URL (optional)</Text>
              <TextInput
                style={styles.input}
                value={imageUrl}
                onChangeText={setImageUrl}
                placeholder="https://..."
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
  card: {
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
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  machineName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
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
