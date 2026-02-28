"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { calcWorkMinutes } from "@/lib/time";

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

/** 評価サイクルが目標時間に達していれば自動でリセット */
export async function checkAndAutoResetCycle(): Promise<void> {
  const settings = await getSettings();
  const fromDate = settings.cycleStartDate;
  const fromYear = fromDate.getFullYear();
  const fromMonth = fromDate.getMonth() + 1;

  const [sessions, aggregates] = await Promise.all([
    prisma.workSession.findMany({ where: { date: { gte: fromDate } } }),
    prisma.monthlyAggregate.findMany({
      where: {
        OR: [
          { year: { gt: fromYear } },
          { year: fromYear, month: { gte: fromMonth } },
        ],
      },
    }),
  ]);

  const sessionMinutes = sessions.reduce(
    (sum: number, s: { startTime: string; endTime: string; breakMinutes: number }) =>
      sum + calcWorkMinutes(s.startTime, s.endTime, s.breakMinutes),
    0
  );
  const aggregateMinutes = aggregates.reduce(
    (sum: number, a: { totalMinutes: number }) => sum + a.totalMinutes,
    0
  );
  const totalMinutes = sessionMinutes + aggregateMinutes;

  if (totalMinutes / 60 >= settings.evaluationCycleHours) {
    await prisma.settings.update({
      where: { id: "default" },
      data: { cycleStartDate: new Date() },
    });
    revalidatePath("/");
    revalidatePath("/settings");
  }
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
