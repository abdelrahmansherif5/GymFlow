import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView, Modal, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useSettings, useSettingsUpdate, useDaysList } from "@/hooks/useApi";
import { SettingsLanguage, SettingsTheme } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { data: settings, isLoading: isSettingsLoading } = useSettings();
  const { data: days, isLoading: isDaysLoading } = useDaysList();
  const updateSettings = useSettingsUpdate();

  const [dayPickerVisible, setDayPickerVisible] = useState(false);

  const handleUpdate = (updates: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateSettings.mutate({
      data: {
        ...settings,
        ...updates
      }
    });
  };

  const OptionRow = ({ label, selected, onPress, showCheck }: { label: string, selected: boolean, onPress: () => void, showCheck?: boolean }) => (
    <Pressable style={styles.optionRow} onPress={onPress}>
      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
      {showCheck && selected && <Feather name="check" size={20} color={Colors.light.tint} />}
    </Pressable>
  );

  if (isSettingsLoading || isDaysLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TODAY'S DAY</Text>
          <Pressable style={styles.pickerRow} onPress={() => setDayPickerVisible(true)}>
            <Text style={styles.pickerLabel}>{settings?.currentDay || 'Select a day'}</Text>
            <Feather name="chevron-down" size={20} color={Colors.light.muted} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LANGUAGE</Text>
          <View style={styles.cardGroup}>
            <OptionRow 
              label="English" 
              selected={settings?.language === SettingsLanguage.en} 
              onPress={() => handleUpdate({ language: SettingsLanguage.en })} 
              showCheck 
            />
            <View style={styles.divider} />
            <OptionRow 
              label="Arabic" 
              selected={settings?.language === SettingsLanguage.ar} 
              onPress={() => handleUpdate({ language: SettingsLanguage.ar })} 
              showCheck 
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THEME</Text>
          <View style={styles.cardGroup}>
            <OptionRow 
              label="Dark" 
              selected={settings?.theme === SettingsTheme.dark} 
              onPress={() => handleUpdate({ theme: SettingsTheme.dark })} 
              showCheck 
            />
            <View style={styles.divider} />
            <OptionRow 
              label="Light" 
              selected={settings?.theme === SettingsTheme.light} 
              onPress={() => handleUpdate({ theme: SettingsTheme.light })} 
              showCheck 
            />
          </View>
        </View>
      </ScrollView>

      <Modal visible={dayPickerVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Day</Text>
              <Pressable onPress={() => setDayPickerVisible(false)}>
                <Feather name="x" size={24} color={Colors.light.text} />
              </Pressable>
            </View>
            <FlatList
              data={days}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <Pressable 
                  style={styles.modalRow} 
                  onPress={() => {
                    handleUpdate({ currentDay: item.dayName });
                    setDayPickerVisible(false);
                  }}
                >
                  <Text style={styles.modalRowText}>{item.dayName}</Text>
                  {settings?.currentDay === item.dayName && (
                    <Feather name="check" size={20} color={Colors.light.tint} />
                  )}
                </Pressable>
              )}
            />
          </View>
        </View>
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: Colors.light.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.muted,
    marginBottom: 8,
    letterSpacing: 1,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  pickerLabel: {
    fontSize: 16,
    color: Colors.light.text,
  },
  cardGroup: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionLabel: {
    fontSize: 16,
    color: Colors.light.text,
  },
  optionLabelSelected: {
    color: Colors.light.tint,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginLeft: 16,
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
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalRowText: {
    fontSize: 16,
    color: Colors.light.text,
  },
});
