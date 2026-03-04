"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

/** 設定を取得（なければデフォルトで作成） */
export async function getSettings() {
  const settings = await prisma.settings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      hourlyRate: 1000,
      evaluationCycleHours: 160,
    },
    update: {},
  });

  return settings;
}

/** 設定を更新 */
export async function updateSettings(data: {
  hourlyRate?: number;
  evaluationCycleHours?: number;
}) {
  await prisma.settings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      hourlyRate: data.hourlyRate ?? 1000,
      evaluationCycleHours: data.evaluationCycleHours ?? 160,
    },
    update: {
      ...(data.hourlyRate !== undefined && { hourlyRate: data.hourlyRate }),
      ...(data.evaluationCycleHours !== undefined && {
        evaluationCycleHours: data.evaluationCycleHours,
      }),
    },
  });

  revalidatePath("/");
  revalidatePath("/settings");
}
