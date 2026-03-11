import { Router, type IRouter } from "express";
import { db, machinesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  GetMachinesResponse,
  CreateMachineBody,
  UpdateMachineBody,
  UpdateMachineParams,
  DeleteMachineParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/machines", async (_req, res) => {
  const machines = await db.select().from(machinesTable).orderBy(machinesTable.id);
  const parsed = GetMachinesResponse.parse(machines);
  res.json(parsed);
});

router.post("/machines", async (req, res) => {
  const body = CreateMachineBody.parse(req.body);
  const [machine] = await db.insert(machinesTable).values(body).returning();
  res.status(201).json(machine);
});

router.put("/machines/:id", async (req, res) => {
  const { id } = UpdateMachineParams.parse({ id: req.params.id });
  const body = UpdateMachineBody.parse(req.body);
  const [updated] = await db
    .update(machinesTable)
    .set(body)
    .where(eq(machinesTable.id, id))
    .returning();
  res.json(updated);
});

router.delete("/machines/:id", async (req, res) => {
  const { id } = DeleteMachineParams.parse({ id: req.params.id });
  await db.delete(machinesTable).where(eq(machinesTable.id, id));
  res.status(204).send();
});

export default router;
