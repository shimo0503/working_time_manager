"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

/** 指定月の月次集計を取得 */
export async function getMonthlyAggregateByMonth(year: number, month: number) {
  return prisma.monthlyAggregate.findUnique({
    where: { year_month: { year, month } },
  });
}

/** 指定日以降の月次集計をすべて取得（評価サイクル計算用） */
export async function getMonthlyAggregatesFromDate(fromDate: Date) {
  const fromYear = fromDate.getFullYear();
  const fromMonth = fromDate.getMonth() + 1;

  return prisma.monthlyAggregate.findMany({
    where: {
      OR: [
        { year: { gt: fromYear } },
        { year: fromYear, month: { gte: fromMonth } },
      ],
    },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });
}

export type MonthlyAggregateInput = {
  year: number;
  month: number;
  totalMinutes: number;
  note?: string;
};

/** 月次集計を作成または更新 */
export async function upsertMonthlyAggregate(input: MonthlyAggregateInput) {
  await prisma.monthlyAggregate.upsert({
    where: { year_month: { year: input.year, month: input.month } },
    create: {
      year: input.year,
      month: input.month,
      totalMinutes: input.totalMinutes,
      note: input.note,
    },
    update: {
      totalMinutes: input.totalMinutes,
      note: input.note ?? null,
    },
  });

  revalidatePath("/");
  revalidatePath("/records");
}

/** 月次集計を削除 */
export async function deleteMonthlyAggregate(id: string) {
  await prisma.monthlyAggregate.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath("/records");
}
