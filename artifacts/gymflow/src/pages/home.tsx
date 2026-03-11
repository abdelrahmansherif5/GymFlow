import { useDaysList, useSettings } from "@/hooks/use-gymflow";
import { useTranslation } from "@/lib/i18n";
import { BottomNavLayout } from "@/components/layout";
import { Play, Activity, Sparkles, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: days = [], isLoading: daysLoading } = useDaysList();
  
  const lang = settings?.language || "en";
  const t = useTranslation(lang);

  const todayStr = settings?.currentDay;
  const todayWorkout = days.find(d => d.dayName === todayStr) || days[0];

  const sortedDays = [...days].sort((a, b) => a.orderIndex - b.orderIndex);

  if (settingsLoading || daysLoading) {
    return (
      <BottomNavLayout>
        <div className="flex h-full items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </BottomNavLayout>
    );
  }

  return (
    <BottomNavLayout>
      <div className="p-6 pt-12 space-y-8">
        
        {/* Header */}
        <header>
          <h1 className="text-3xl font-display font-bold">
            {lang === "ar" ? "أهلاً بك، جاهز للتمرين؟" : "Hello, ready to crush it?"}
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            {t("today")}
          </p>
        </header>

        {/* Hero Card - Today's Workout */}
        {todayWorkout ? (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative overflow-hidden rounded-3xl bg-card border border-white/5 shadow-2xl p-6 group"
          >
            {/* Background Image Effect */}
            <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen group-hover:opacity-60 transition-opacity duration-500">
              <img 
                src={`${import.meta.env.BASE_URL}images/hero-mesh.png`} 
                alt="mesh" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
            </div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-4xl font-display font-black text-white">{todayWorkout.dayName}</h2>
                  <p className="text-lg text-primary font-medium mt-1 uppercase tracking-wider flex items-center gap-2">
                    {todayWorkout.workoutIcon && <span>{todayWorkout.workoutIcon}</span>}
                    {todayWorkout.workoutType || "Rest Day"}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Activity className="text-primary" size={24} />
                </div>
              </div>

              <button className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-primary to-primary/80 text-black shadow-[0_0_20px_rgba(22,163,74,0.4)] hover:shadow-[0_0_30px_rgba(22,163,74,0.6)] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2">
                <Play fill="currentColor" size={20} />
                {t("startWorkout")}
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="p-6 rounded-3xl border border-dashed border-border text-center">
            <p className="text-muted-foreground">{t("noDays")}</p>
          </div>
        )}

        {/* This Week List */}
        <div>
          <h3 className="text-xl font-display font-bold mb-4">{t("allDays")}</h3>
          
          <div className="space-y-3">
            {sortedDays.map((day, i) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={day.id}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${
                  day.dayName === todayStr 
                    ? 'bg-primary/5 border-primary/30 shadow-[0_0_15px_rgba(22,163,74,0.1)]' 
                    : 'bg-card border-border hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    day.dayName === todayStr ? 'bg-primary text-black' : 'bg-secondary'
                  }`}>
                    {day.workoutIcon || "📅"}
                  </div>
                  <div>
                    <h4 className={`font-semibold ${day.dayName === todayStr ? 'text-primary' : 'text-foreground'}`}>
                      {day.dayName}
                    </h4>
                    <p className="text-sm text-muted-foreground">{day.workoutType || "Rest"}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-muted-foreground" />
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </BottomNavLayout>
  );
}
