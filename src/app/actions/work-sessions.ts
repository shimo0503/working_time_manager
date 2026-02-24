"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type WorkSessionInput = {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  breakMinutes: number;
  note?: string;
};

/** 月の勤務記録を取得 */
export async function getWorkSessionsByMonth(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const sessions = await prisma.workSession.findMany({
    where: {
      date: { gte: start, lt: end },
    },
    orderBy: { date: "asc" },
  });

  return sessions;
}

/** 指定日以降の全勤務記録を取得（評価サイクル用） */
export async function getWorkSessionsFromDate(fromDate: Date) {
  const sessions = await prisma.workSession.findMany({
    where: {
      date: { gte: fromDate },
    },
    orderBy: { date: "asc" },
  });

  return sessions;
}

/** 直近N件の勤務記録を取得 */
export async function getRecentWorkSessions(limit: number = 5) {
  return prisma.workSession.findMany({
    orderBy: { date: "desc" },
    take: limit,
  });
}

/** 勤務記録を作成 */
export async function createWorkSession(input: WorkSessionInput) {
  const dateObj = new Date(input.date + "T00:00:00");

  await prisma.workSession.create({
    data: {
      date: dateObj,
      startTime: input.startTime,
      endTime: input.endTime,
      breakMinutes: input.breakMinutes,
      note: input.note ?? null,
    },
  });

  revalidatePath("/");
  revalidatePath("/records");
}

/** 勤務記録を更新 */
export async function updateWorkSession(id: string, input: WorkSessionInput) {
  const dateObj = new Date(input.date + "T00:00:00");

  await prisma.workSession.update({
    where: { id },
    data: {
      date: dateObj,
      startTime: input.startTime,
      endTime: input.endTime,
      breakMinutes: input.breakMinutes,
      note: input.note ?? null,
    },
  });

  revalidatePath("/");
  revalidatePath("/records");
}

/** 勤務記録を削除 */
export async function deleteWorkSession(id: string) {
  await prisma.workSession.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath("/records");
}
