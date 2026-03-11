import { pgTable, text, integer, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const daysTable = pgTable("days", {
  id: serial("id").primaryKey(),
  dayName: text("day_name").notNull(),
  workoutType: text("workout_type"),
  workoutIcon: text("workout_icon"),
  orderIndex: integer("order_index").notNull().default(0),
});

export const insertDaySchema = createInsertSchema(daysTable).omit({ id: true });
export type InsertDay = z.infer<typeof insertDaySchema>;
export type Day = typeof daysTable.$inferSelect;
