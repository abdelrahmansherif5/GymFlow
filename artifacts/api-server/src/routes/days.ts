import { Router, type IRouter } from "express";
import { db, daysTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  GetDaysResponse,
  CreateDayBody,
  UpdateDayBody,
  UpdateDayParams,
  DeleteDayParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/days", async (_req, res) => {
  const days = await db.select().from(daysTable).orderBy(daysTable.orderIndex);
  const parsed = GetDaysResponse.parse(days);
  res.json(parsed);
});

router.post("/days", async (req, res) => {
  const body = CreateDayBody.parse(req.body);
  const [day] = await db.insert(daysTable).values(body).returning();
  res.status(201).json(day);
});

router.put("/days/:id", async (req, res) => {
  const { id } = UpdateDayParams.parse({ id: req.params.id });
  const body = UpdateDayBody.parse(req.body);
  const [updated] = await db
    .update(daysTable)
    .set(body)
    .where(eq(daysTable.id, id))
    .returning();
  res.json(updated);
});

router.delete("/days/:id", async (req, res) => {
  const { id } = DeleteDayParams.parse({ id: req.params.id });
  await db.delete(daysTable).where(eq(daysTable.id, id));
  res.status(204).send();
});

export default router;
