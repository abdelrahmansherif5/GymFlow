import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateSettings, useGetSettings } from "@workspace/api-client-react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Alert } from "react-native";
import { AppColors, DarkColors, LightColors } from "@/constants/colors";
import { translations, type Lang, type Translations } from "@/constants/translations";

const SETTINGS_CACHE_KEY = "gymflow_settings";

type SettingsState = {
  currentDay: string;
  language: Lang;
  theme: "dark" | "light";
};

type SettingsContextValue = {
  settings: SettingsState;
  colors: AppColors;
  isRTL: boolean;
  t: Translations;
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
  t: translations.en,
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
        language: (apiSettings.language as Lang) ?? "en",
        theme: (apiSettings.theme as "dark" | "light") ?? "dark",
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
      const next = { ...settings, [field]: value } as SettingsState;
      setSettings(next);
      await AsyncStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(next));

      try {
        await updateSettings({
          currentDay: next.currentDay,
          language: next.language,
          theme: next.theme,
        });
      } catch {
        Alert.alert(
          translations[next.language].error,
          translations[next.language].couldNotSaveSettings
        );
      }
    },
    [settings]
  );

  const colors: AppColors = settings.theme === "light" ? LightColors : DarkColors;
  const isRTL = settings.language === "ar";
  const t = translations[settings.language];

  return (
    <SettingsContext.Provider value={{ settings, colors, isRTL, t, updateSetting, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
