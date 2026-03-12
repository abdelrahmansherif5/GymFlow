import { pgTable, integer, primaryKey } from "drizzle-orm/pg-core";
import { daysTable } from "./days";
import { machinesTable } from "./machines";

export const dayMachinesTable = pgTable(
  "day_machines",
  {
    dayId: integer("day_id")
      .notNull()
      .references(() => daysTable.id, { onDelete: "cascade" }),
    machineId: integer("machine_id")
      .notNull()
      .references(() => machinesTable.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.dayId, t.machineId] })]
);

export type DayMachine = typeof dayMachinesTable.$inferSelect;
