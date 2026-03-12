import { Router, type IRouter } from "express";
import { db, dayMachinesTable, machinesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  GetDayMachinesParams,
  AddDayMachineParams,
  AddDayMachineBody,
  RemoveDayMachineParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/days/:id/machines", async (req, res) => {
  const { id } = GetDayMachinesParams.parse({ id: req.params.id });
  const rows = await db
    .select({ machine: machinesTable })
    .from(dayMachinesTable)
    .innerJoin(machinesTable, eq(dayMachinesTable.machineId, machinesTable.id))
    .where(eq(dayMachinesTable.dayId, id));
  res.json(rows.map((r) => r.machine));
});

router.post("/days/:id/machines", async (req, res) => {
  const { id } = AddDayMachineParams.parse({ id: req.params.id });
  const { machineId } = AddDayMachineBody.parse(req.body);
  const [row] = await db
    .insert(dayMachinesTable)
    .values({ dayId: id, machineId })
    .onConflictDoNothing()
    .returning();
  res.status(201).json(row ?? { dayId: id, machineId });
});

router.delete("/days/:id/machines/:machineId", async (req, res) => {
  const { id, machineId } = RemoveDayMachineParams.parse({
    id: req.params.id,
    machineId: req.params.machineId,
  });
  await db
    .delete(dayMachinesTable)
    .where(
      and(
        eq(dayMachinesTable.dayId, id),
        eq(dayMachinesTable.machineId, machineId)
      )
    );
  res.status(204).send();
});

export default router;
