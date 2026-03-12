import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useGetMachines,
  createMachine,
  updateMachine,
  deleteMachine,
} from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMachinesQueryKey } from "@workspace/api-client-react";
import { Colors } from "@/constants/colors";

type Machine = { id: number; name: string; imageUrl?: string | null };

export default function MachinesScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data: machines, isLoading, refetch } = useGetMachines();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Machine | null>(null);
  const [name, setName] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setName("");
    setImageUri(null);
    setShowForm(true);
  };

  const openEdit = (m: Machine) => {
    setEditing(m);
    setName(m.name);
    setImageUri(m.imageUrl ?? null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setName("");
    setImageUri(null);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow photo library access to upload machine photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (editing) {
        await updateMachine(editing.id, {
          name: name.trim(),
          imageUrl: imageUri ?? null,
        });
      } else {
        await createMachine({
          name: name.trim(),
          imageUrl: imageUri ?? null,
        });
      }
      await qc.invalidateQueries({ queryKey: getGetMachinesQueryKey() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeForm();
    } catch {
      Alert.alert("Error", "Could not save machine.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert("Delete Machine", "Remove this machine?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await deleteMachine(id);
          qc.invalidateQueries({ queryKey: getGetMachinesQueryKey() });
        },
      },
    ]);
  };

  const renderItem = useCallback(
    ({ item }: { item: Machine }) => (
      <View style={styles.machineCard}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.machineImg}
            contentFit="cover"
          />
        ) : (
          <View style={styles.machineImgPlaceholder}>
            <Feather name="activity" size={20} color={Colors.green} />
          </View>
        )}
        <Text style={styles.machineName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.machineActions}>
          <Pressable
            onPress={() => openEdit(item)}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          >
            <Feather name="edit-2" size={16} color={Colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => handleDelete(item.id)}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          >
            <Feather name="trash-2" size={16} color={Colors.red} />
          </Pressable>
        </View>
      </View>
    ),
    []
  );

  return (
    <View style={[styles.root, { backgroundColor: Colors.bg }]}>
      <View
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.title}>Machines</Text>
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
      ) : !machines?.length ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Feather name="activity" size={28} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No machines yet</Text>
          <Text style={styles.emptyText}>Tap Add to create your first machine</Text>
        </View>
      ) : (
        <FlatList
          data={machines}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={showForm}
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
                  {editing ? "Edit Machine" : "New Machine"}
                </Text>

                <Pressable onPress={pickImage} style={styles.imagePicker}>
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.imagePickerImg}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.imagePickerPlaceholder}>
                      <Feather name="camera" size={24} color={Colors.textMuted} />
                      <Text style={styles.imagePickerText}>Upload Photo</Text>
                    </View>
                  )}
                  {imageUri && (
                    <View style={styles.imagePickerOverlay}>
                      <Feather name="camera" size={18} color={Colors.white} />
                    </View>
                  )}
                </Pressable>

                <View style={styles.field}>
                  <Text style={styles.label}>Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Bench Press"
                    placeholderTextColor={Colors.textMuted}
                    value={name}
                    onChangeText={setName}
                    returnKeyType="done"
                    onSubmitEditing={handleSave}
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
                      !name.trim() && styles.saveBtnDisabled,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={handleSave}
                    disabled={!name.trim() || saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Text style={styles.saveBtnText}>
                        {editing ? "Save" : "Create"}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
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
  },
  list: {
    paddingHorizontal: 20,
    gap: 10,
    paddingTop: 8,
  },
  machineCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  machineImg: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  machineImgPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.greenMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  machineName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: Colors.text,
    fontFamily: "Inter_500Medium",
  },
  machineActions: {
    flexDirection: "row",
    gap: 4,
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
  imagePicker: {
    alignSelf: "center",
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.cardAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  imagePickerImg: {
    width: 100,
    height: 100,
  },
  imagePickerPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  imagePickerText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  imagePickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
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
