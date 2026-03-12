import {
  useGetMachines, createMachine, updateMachine, deleteMachine, getGetMachinesQueryKey,
} from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, Keyboard, KeyboardAvoidingView,
  Modal, Platform, Pressable, StyleSheet, Text, TextInput,
  TouchableWithoutFeedback, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { useSettings } from "@/contexts/SettingsContext";
import type { AppColors } from "@/constants/colors";

type Machine = { id: number; name: string; imageUrl?: string | null };

export default function MachinesScreen() {
  const insets = useSafeAreaInsets();
  const { colors, t, isRTL } = useSettings();
  const S = useMemo(() => makeStyles(colors), [colors]);
  const dir = isRTL ? "rtl" : "ltr";

  const qc = useQueryClient();
  const { data: machines, isLoading } = useGetMachines();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Machine | null>(null);
  const [name, setName] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setEditing(null); setName(""); setImageUri(null); setShowForm(true); };
  const openEdit = (m: Machine) => { setEditing(m); setName(m.name); setImageUri(m.imageUrl ?? null); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); setName(""); setImageUri(null); };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t.permissionRequired, t.permissionMsg);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
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
        await updateMachine(editing.id, { name: name.trim(), imageUrl: imageUri ?? null });
      } else {
        await createMachine({ name: name.trim(), imageUrl: imageUri ?? null });
      }
      await qc.invalidateQueries({ queryKey: getGetMachinesQueryKey() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeForm();
    } catch {
      Alert.alert(t.error, t.couldNotSaveMachine);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert(t.deleteMachine, t.deleteMachineMsg, [
      { text: t.deleteCancel, style: "cancel" },
      {
        text: t.deleteConfirm, style: "destructive",
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
      <View style={S.machineCard}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={S.machineImg} contentFit="cover" />
        ) : (
          <View style={S.machineImgPlaceholder}>
            <Feather name="activity" size={20} color={colors.green} />
          </View>
        )}
        <Text style={S.machineName} numberOfLines={1}>{item.name}</Text>
        <View style={S.machineActions}>
          <Pressable onPress={() => openEdit(item)} style={({ pressed }) => [S.iconBtn, pressed && { opacity: 0.6 }]}>
            <Feather name="edit-2" size={16} color={colors.textSecondary} />
          </Pressable>
          <Pressable onPress={() => handleDelete(item.id)} style={({ pressed }) => [S.iconBtn, pressed && { opacity: 0.6 }]}>
            <Feather name="trash-2" size={16} color={colors.red} />
          </Pressable>
        </View>
      </View>
    ),
    [S, colors]
  );

  return (
    <View style={[S.root, { direction: dir }]}>
      <View style={[S.header, { paddingTop: insets.top + 16 }]}>
        <Text style={S.title}>{t.machines}</Text>
        <Pressable onPress={openAdd} style={({ pressed }) => [S.addBtn, pressed && { opacity: 0.7 }]}>
          <Feather name="plus" size={18} color="#000" />
          <Text style={S.addBtnText}>{t.add}</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={S.center}><ActivityIndicator color={colors.green} /></View>
      ) : !machines?.length ? (
        <View style={S.center}>
          <View style={S.emptyIcon}><Feather name="activity" size={28} color={colors.textMuted} /></View>
          <Text style={S.emptyTitle}>{t.noMachinesYet}</Text>
          <Text style={S.emptyHint}>{t.noMachinesHint}</Text>
        </View>
      ) : (
        <FlatList data={machines} keyExtractor={(item) => String(item.id)} renderItem={renderItem}
          contentContainerStyle={[S.list, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false} />
      )}

      <Modal visible={showForm} animationType="slide" transparent onRequestClose={closeForm}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={[S.overlay, { direction: dir }]}>
            <Pressable style={S.overlayBg} onPress={closeForm} />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={S.sheetWrap}>
              <View style={[S.sheet, { paddingBottom: insets.bottom + 16 }]}>
                <View style={S.sheetHandle} />
                <Text style={S.sheetTitle}>{editing ? t.editMachine : t.newMachine}</Text>

                <Pressable onPress={pickImage} style={S.imagePicker}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={S.imagePickerImg} contentFit="cover" />
                  ) : (
                    <View style={S.imagePickerPlaceholder}>
                      <Feather name="camera" size={24} color={colors.textMuted} />
                      <Text style={S.imagePickerText}>{t.uploadPhoto}</Text>
                    </View>
                  )}
                  {imageUri && (
                    <View style={S.imagePickerOverlay}>
                      <Feather name="camera" size={18} color="#fff" />
                    </View>
                  )}
                </Pressable>

                <View style={S.field}>
                  <Text style={S.label}>{t.name}</Text>
                  <TextInput style={S.input} placeholder={t.namePlaceholder}
                    placeholderTextColor={colors.textMuted} value={name}
                    onChangeText={setName} returnKeyType="done" onSubmitEditing={handleSave}
                    textAlign={isRTL ? "right" : "left"} />
                </View>

                <View style={S.formActions}>
                  <Pressable style={({ pressed }) => [S.cancelBtn, pressed && { opacity: 0.7 }]} onPress={closeForm}>
                    <Text style={S.cancelBtnText}>{t.cancel}</Text>
                  </Pressable>
                  <Pressable style={({ pressed }) => [S.saveBtn, !name.trim() && S.saveBtnDisabled, pressed && { opacity: 0.8 }]}
                    onPress={handleSave} disabled={!name.trim() || saving}>
                    {saving ? <ActivityIndicator size="small" color="#000" /> :
                      <Text style={S.saveBtnText}>{editing ? t.save : t.create}</Text>}
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

function makeStyles(C: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16 },
    title: { fontSize: 28, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold" },
    addBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.green, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
    addBtnText: { color: "#000", fontWeight: "700", fontSize: 14, fontFamily: "Inter_700Bold" },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
    emptyIcon: { width: 60, height: 60, borderRadius: 16, backgroundColor: C.card, alignItems: "center", justifyContent: "center", marginBottom: 8 },
    emptyTitle: { fontSize: 18, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold" },
    emptyHint: { fontSize: 14, color: C.textSecondary, fontFamily: "Inter_400Regular" },
    list: { paddingHorizontal: 20, gap: 10, paddingTop: 8 },
    machineCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.border },
    machineImg: { width: 44, height: 44, borderRadius: 10 },
    machineImgPlaceholder: { width: 44, height: 44, borderRadius: 10, backgroundColor: C.greenMuted, alignItems: "center", justifyContent: "center" },
    machineName: { flex: 1, fontSize: 15, fontWeight: "500", color: C.text, fontFamily: "Inter_500Medium" },
    machineActions: { flexDirection: "row", gap: 4 },
    iconBtn: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: C.cardAlt },
    overlay: { flex: 1, justifyContent: "flex-end" },
    overlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
    sheetWrap: { justifyContent: "flex-end" },
    sheet: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16, borderTopWidth: 1, borderTopColor: C.border },
    sheetHandle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
    sheetTitle: { fontSize: 20, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold" },
    imagePicker: { alignSelf: "center", width: 100, height: 100, borderRadius: 16, overflow: "hidden", backgroundColor: C.cardAlt, borderWidth: 1.5, borderColor: C.border, borderStyle: "dashed" },
    imagePickerImg: { width: 100, height: 100 },
    imagePickerPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
    imagePickerText: { fontSize: 11, color: C.textMuted, fontFamily: "Inter_400Regular" },
    imagePickerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
    field: { gap: 8 },
    label: { fontSize: 13, color: C.textSecondary, fontFamily: "Inter_500Medium", fontWeight: "500" },
    input: { backgroundColor: C.cardAlt, borderRadius: 12, padding: 14, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border, fontFamily: "Inter_400Regular" },
    formActions: { flexDirection: "row", gap: 10, marginTop: 4 },
    cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: C.greyBtn, alignItems: "center", borderWidth: 1, borderColor: C.border },
    cancelBtnText: { color: C.text, fontWeight: "600", fontSize: 15, fontFamily: "Inter_600SemiBold" },
    saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: C.green, alignItems: "center" },
    saveBtnDisabled: { opacity: 0.4 },
    saveBtnText: { color: "#000", fontWeight: "700", fontSize: 15, fontFamily: "Inter_700Bold" },
  });
}
