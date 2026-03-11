import { useState, useEffect } from "react";
import { useDaysList, useSettings } from "@/hooks/use-gymflow";
import { useTranslation } from "@/lib/i18n";
import { BottomNavLayout } from "@/components/layout";
import { CheckCircle2, XCircle, Activity, Sparkles, ChevronRight, Flame, Trophy, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "gymflow_streak";

interface StreakData {
  streak: number;
  lastCompletedDate: string | null;
  completedDates: string[];
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { streak: 0, lastCompletedDate: null, completedDates: [] };
}

function saveStreak(data: StreakData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function markDoneAndCalcStreak(current: StreakData): StreakData {
  const today = getTodayKey();
  if (current.completedDates.includes(today)) return current;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  const newStreak =
    current.lastCompletedDate === yesterdayKey || current.lastCompletedDate === today
      ? current.streak + (current.lastCompletedDate === today ? 0 : 1)
      : 1;

  return {
    streak: newStreak,
    lastCompletedDate: today,
    completedDates: [...current.completedDates, today],
  };
}

type WorkoutState = "idle" | "active" | "done" | "cancelled";

export default function Home() {
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: days = [], isLoading: daysLoading } = useDaysList();
  const [workoutState, setWorkoutState] = useState<WorkoutState>("idle");
  const [streakData, setStreakData] = useState<StreakData>(() => loadStreak());

  const lang = settings?.language || "en";
  const t = useTranslation(lang);
  const todayStr = settings?.currentDay;
  const todayWorkout = days.find((d) => d.dayName === todayStr) || days[0];
  const sortedDays = [...days].sort((a, b) => a.orderIndex - b.orderIndex);
  const todayKey = getTodayKey();
  const todayAlreadyDone = streakData.completedDates.includes(todayKey);

  useEffect(() => {
    if (todayAlreadyDone) setWorkoutState("done");
  }, [todayAlreadyDone]);

  function handleStart() {
    setWorkoutState("active");
  }

  function handleDone() {
    const updated = markDoneAndCalcStreak(streakData);
    saveStreak(updated);
    setStreakData(updated);
    setWorkoutState("done");
  }

  function handleCancel() {
    setWorkoutState("idle");
  }

  if (settingsLoading || daysLoading) {
    return (
      <BottomNavLayout>
        <div className="flex h-full items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </BottomNavLayout>
    );
  }

  return (
    <BottomNavLayout>
      <div className="p-6 pt-12 space-y-6">

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

        {/* Streak Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3"
        >
          <div className="flex-1 rounded-2xl bg-card border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Flame size={20} className="text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground leading-none">{streakData.streak}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === "ar" ? "أيام متتالية" : "Day Streak"}
              </p>
            </div>
          </div>

          <div className="flex-1 rounded-2xl bg-card border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Trophy size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground leading-none">
                {streakData.completedDates.length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === "ar" ? "إجمالي التمارين" : "Total Workouts"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Hero Card - Today's Workout */}
        {todayWorkout ? (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative overflow-hidden rounded-3xl bg-card border border-white/5 shadow-2xl p-6 group"
          >
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

              <AnimatePresence mode="wait">

                {/* IDLE → Start Workout */}
                {workoutState === "idle" && (
                  <motion.button
                    key="start"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    onClick={handleStart}
                    className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-primary to-primary/80 text-black shadow-[0_0_20px_rgba(22,163,74,0.4)] hover:shadow-[0_0_30px_rgba(22,163,74,0.6)] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Play fill="currentColor" size={20} />
                    {t("startWorkout")}
                  </motion.button>
                )}

                {/* ACTIVE → Done or Cancel */}
                {workoutState === "active" && (
                  <motion.div
                    key="active"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-3"
                  >
                    <p className="text-center text-sm text-muted-foreground mb-2 tracking-wide uppercase">
                      {lang === "ar" ? "التمرين جارٍ..." : "Workout in progress..."}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancel}
                        className="flex-1 py-4 rounded-xl font-bold text-base border border-red-500/40 text-red-400 bg-red-500/10 hover:bg-red-500/20 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <XCircle size={20} />
                        {lang === "ar" ? "إلغاء التمرين" : "Cancel Workout"}
                      </button>
                      <button
                        onClick={handleDone}
                        className="flex-1 py-4 rounded-xl font-bold text-base bg-gradient-to-r from-primary to-primary/80 text-black shadow-[0_0_20px_rgba(22,163,74,0.4)] hover:shadow-[0_0_30px_rgba(22,163,74,0.6)] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={20} />
                        {lang === "ar" ? "أتممت التمرين" : "Done Workout"}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* DONE */}
                {workoutState === "done" && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-2 py-3"
                  >
                    <div className="flex items-center gap-2 text-primary font-bold text-lg">
                      <CheckCircle2 size={24} className="text-primary" />
                      {lang === "ar" ? "أحسنت! تمرين اليوم مكتمل 🔥" : "Great job! Today's workout complete 🔥"}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {lang === "ar" ? `سلسلة: ${streakData.streak} يوم` : `Streak: ${streakData.streak} day${streakData.streak !== 1 ? "s" : ""}`}
                    </p>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <div className="p-6 rounded-3xl border border-dashed border-border text-center">
            <p className="text-muted-foreground">{t("noDays")}</p>
          </div>
        )}

        {/* All Week Days */}
        <div>
          <h3 className="text-xl font-display font-bold mb-4">{t("allDays")}</h3>
          <div className="space-y-3">
            {sortedDays.map((day, i) => {
              const isToday = day.dayName === todayStr;
              const dateForDay = null;
              const isDone = false;
              return (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  key={day.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${
                    isToday
                      ? "bg-primary/5 border-primary/30 shadow-[0_0_15px_rgba(22,163,74,0.1)]"
                      : "bg-card border-border hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        isToday ? "bg-primary text-black" : "bg-secondary"
                      }`}
                    >
                      {day.workoutIcon || "📅"}
                    </div>
                    <div>
                      <h4 className={`font-semibold ${isToday ? "text-primary" : "text-foreground"}`}>
                        {day.dayName}
                        {isToday && (
                          <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                            {lang === "ar" ? "اليوم" : "Today"}
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground">{day.workoutType || "Rest"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isToday && workoutState === "done" && (
                      <CheckCircle2 size={18} className="text-primary" />
                    )}
                    <ChevronRight size={18} className="text-muted-foreground" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </BottomNavLayout>
  );
}
