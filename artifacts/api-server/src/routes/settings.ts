import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";
import {
  GetSettingsResponse,
  UpdateSettingsBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function ensureSettings() {
  const existing = await db.select().from(settingsTable).limit(1);
  if (existing.length === 0) {
    await db.insert(settingsTable).values({
      id: 1,
      currentDay: "Wednesday",
      language: "en",
      theme: "dark",
    });
  }
  return db.select().from(settingsTable).limit(1).then((r) => r[0]);
}

router.get("/settings", async (_req, res) => {
  const settings = await ensureSettings();
  const parsed = GetSettingsResponse.parse(settings);
  res.json(parsed);
});

router.put("/settings", async (req, res) => {
  const body = UpdateSettingsBody.parse(req.body);
  await ensureSettings();
  const [updated] = await db
    .update(settingsTable)
    .set(body)
    .returning();
  res.json(updated);
});

export default router;
