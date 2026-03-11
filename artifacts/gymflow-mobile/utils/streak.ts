import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StreakData {
  streak: number;
  lastCompletedDate: string | null;
  completedDates: string[];
}

const STREAK_KEY = 'gymflow_streak_data';

export const getTodayKey = () => new Date().toISOString().slice(0, 10);

export const loadStreak = async (): Promise<StreakData> => {
  try {
    const data = await AsyncStorage.getItem(STREAK_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading streak:', error);
  }
  return { streak: 0, lastCompletedDate: null, completedDates: [] };
};

export const saveStreak = async (data: StreakData): Promise<void> => {
  try {
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving streak:', error);
  }
};

export const markDoneAndCalcStreak = async (current: StreakData): Promise<StreakData> => {
  const today = getTodayKey();
  
  if (current.lastCompletedDate === today) {
    return current; // already completed today
  }

  let newStreak = current.streak;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  if (current.lastCompletedDate === yesterdayKey) {
    newStreak += 1;
  } else if (current.lastCompletedDate !== today) {
    newStreak = 1;
  }

  const updatedDates = [...current.completedDates, today];
  const newData: StreakData = {
    streak: newStreak,
    lastCompletedDate: today,
    completedDates: updatedDates,
  };

  await saveStreak(newData);
  return newData;
};
