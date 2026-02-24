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
      cycleStartDate: new Date(),
    },
    update: {},
  });

  return settings;
}

/** 設定を更新 */
export async function updateSettings(data: {
  hourlyRate?: number;
  evaluationCycleHours?: number;
  cycleStartDate?: string; // ISO string
}) {
  await prisma.settings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      hourlyRate: data.hourlyRate ?? 1000,
      evaluationCycleHours: data.evaluationCycleHours ?? 160,
      cycleStartDate: data.cycleStartDate
        ? new Date(data.cycleStartDate)
        : new Date(),
    },
    update: {
      ...(data.hourlyRate !== undefined && { hourlyRate: data.hourlyRate }),
      ...(data.evaluationCycleHours !== undefined && {
        evaluationCycleHours: data.evaluationCycleHours,
      }),
      ...(data.cycleStartDate !== undefined && {
        cycleStartDate: new Date(data.cycleStartDate),
      }),
    },
  });

  revalidatePath("/");
  revalidatePath("/settings");
}

/** 評価サイクルをリセット（今日から開始） */
export async function resetCycleStartDate() {
  await prisma.settings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      hourlyRate: 1000,
      evaluationCycleHours: 160,
      cycleStartDate: new Date(),
    },
    update: {
      cycleStartDate: new Date(),
    },
  });

  revalidatePath("/");
  revalidatePath("/settings");
}
