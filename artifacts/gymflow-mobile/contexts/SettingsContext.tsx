import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateSettings, useGetSettings } from "@workspace/api-client-react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Alert, I18nManager } from "react-native";
import * as Updates from "expo";
import { AppColors, DarkColors, LightColors } from "@/constants/colors";

const SETTINGS_CACHE_KEY = "gymflow_settings";

type SettingsState = {
  currentDay: string;
  language: "en" | "ar";
  theme: "dark" | "light";
};

type SettingsContextValue = {
  settings: SettingsState;
  colors: AppColors;
  isRTL: boolean;
  updateSetting: (field: keyof SettingsState, value: string) => Promise<void>;
  loading: boolean;
};

const defaultSettings: SettingsState = {
  currentDay: "Monday",
  language: "en",
  theme: "dark",
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: defaultSettings,
  colors: DarkColors,
  isRTL: false,
  updateSetting: async () => {},
  loading: true,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const { data: apiSettings } = useGetSettings();

  useEffect(() => {
    loadCachedSettings();
  }, []);

  useEffect(() => {
    if (apiSettings) {
      const s: SettingsState = {
        currentDay: apiSettings.currentDay,
        language: apiSettings.language as "en" | "ar",
        theme: apiSettings.theme as "dark" | "light",
      };
      setSettings(s);
      AsyncStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(s));
      setLoading(false);
    }
  }, [apiSettings]);

  const loadCachedSettings = async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_CACHE_KEY);
      if (raw) {
        setSettings(JSON.parse(raw));
      }
    } catch {}
    setLoading(false);
  };

  const updateSetting = useCallback(
    async (field: keyof SettingsState, value: string) => {
      const next = { ...settings, [field]: value };
      setSettings(next);
      await AsyncStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(next));

      try {
        await updateSettings({
          currentDay: next.currentDay,
          language: next.language,
          theme: next.theme,
        });
      } catch {
        Alert.alert("Error", "Could not save settings.");
      }

      if (field === "language") {
        const wantRTL = value === "ar";
        if (I18nManager.isRTL !== wantRTL) {
          I18nManager.forceRTL(wantRTL);
          Alert.alert(
            "Restart Required",
            "Please close and reopen the app to apply the language change.",
            [{ text: "OK" }]
          );
        }
      }
    },
    [settings]
  );

  const colors: AppColors =
    settings.theme === "light" ? LightColors : DarkColors;
  const isRTL = settings.language === "ar";

  return (
    <SettingsContext.Provider
      value={{ settings, colors, isRTL, updateSetting, loading }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
