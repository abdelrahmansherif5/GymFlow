import { BottomNavLayout } from "@/components/layout";
import { useSettings, useSettingsUpdate, useDaysList } from "@/hooks/use-gymflow";
import { useTranslation } from "@/lib/i18n";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Globe, Moon, Sun, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function Settings() {
  const { data: settings, isLoading } = useSettings();
  const { data: days = [] } = useDaysList();
  const updateSettings = useSettingsUpdate();
  
  const [localSettings, setLocalSettings] = useState({
    currentDay: "",
    language: "en" as "en" | "ar",
    theme: "dark" as "dark" | "light"
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        currentDay: settings.currentDay,
        language: settings.language,
        theme: settings.theme
      });
    }
  }, [settings]);

  const t = useTranslation(localSettings.language);

  const handleSave = () => {
    updateSettings.mutate({ data: localSettings });
  };

  const hasChanges = settings && (
    settings.currentDay !== localSettings.currentDay ||
    settings.language !== localSettings.language ||
    settings.theme !== localSettings.theme
  );

  if (isLoading) return <BottomNavLayout><div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div></BottomNavLayout>;

  return (
    <BottomNavLayout>
      <div className="p-6 pt-12 pb-32">
        <h1 className="text-3xl font-display font-bold mb-8">{t("settings")}</h1>

        <div className="space-y-10">
          
          {/* Today Selection */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Calendar size={20} />
              <Label className="text-base">{t("currentDay")}</Label>
            </div>
            <Select 
              value={localSettings.currentDay} 
              onValueChange={(val) => setLocalSettings(p => ({ ...p, currentDay: val }))}
              dir={localSettings.language === 'ar' ? 'rtl' : 'ltr'}
            >
              <SelectTrigger className="h-14 bg-card border-border rounded-xl text-lg px-4">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border rounded-xl">
                {days.map(day => (
                  <SelectItem key={day.id} value={day.dayName} className="text-base py-3">
                    {day.dayName} {day.workoutType ? `— ${day.workoutType}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          {/* Language Selection */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Globe size={20} />
              <Label className="text-base">{t("language")}</Label>
            </div>
            <RadioGroup 
              value={localSettings.language} 
              onValueChange={(val: "en"|"ar") => setLocalSettings(p => ({ ...p, language: val }))}
              className="grid grid-cols-2 gap-4"
              dir="ltr" // keep radio layout consistent physically
            >
              <Label className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${localSettings.language === 'en' ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
                <RadioGroupItem value="en" className="sr-only" />
                <span className="text-2xl mb-2">🇺🇸</span>
                <span className="font-semibold">English</span>
              </Label>
              <Label className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${localSettings.language === 'ar' ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
                <RadioGroupItem value="ar" className="sr-only" />
                <span className="text-2xl mb-2">🇸🇦</span>
                <span className="font-semibold">العربية</span>
              </Label>
            </RadioGroup>
          </motion.div>

          {/* Theme Selection */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold">
              {localSettings.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              <Label className="text-base">{t("theme")}</Label>
            </div>
            <RadioGroup 
              value={localSettings.theme} 
              onValueChange={(val: "light"|"dark") => setLocalSettings(p => ({ ...p, theme: val }))}
              className="grid grid-cols-2 gap-4"
              dir="ltr"
            >
              <Label className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${localSettings.theme === 'dark' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'}`}>
                <RadioGroupItem value="dark" className="sr-only" />
                <Moon size={28} className="mb-2" />
                <span className="font-semibold">Dark</span>
              </Label>
              <Label className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${localSettings.theme === 'light' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'}`}>
                <RadioGroupItem value="light" className="sr-only" />
                <Sun size={28} className="mb-2" />
                <span className="font-semibold">Light</span>
              </Label>
            </RadioGroup>
          </motion.div>

        </div>

        {/* Save Bar (floats above nav) */}
        <div className={`fixed bottom-[90px] left-1/2 -translate-x-1/2 w-full max-w-md px-6 transition-transform duration-300 ${hasChanges ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
          <Button 
            onClick={handleSave} 
            disabled={updateSettings.isPending}
            className="w-full h-14 text-lg font-bold shadow-[0_10px_30px_rgba(22,163,74,0.3)] rounded-2xl"
          >
            {updateSettings.isPending ? t("saving") : (
              <span className="flex items-center gap-2"><CheckCircle2 /> {t("save")}</span>
            )}
          </Button>
        </div>

      </div>
    </BottomNavLayout>
  );
}
