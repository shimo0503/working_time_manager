"use server";

import { prisma } from "@/lib/prisma";
import { calcWorkMinutes } from "@/lib/time";
import { getRateForDate } from "@/lib/salary";

export type YearlySummary = {
  year: number;
  totalMinutes: number;
  totalSalary: number;
};

/** 全期間の年別勤務時間・給与集計（勤務記録 + 月次集計を合算） */
export async function getYearlySummaries(): Promise<YearlySummary[]> {
  const [allSessions, allAggregates, allRates, settings] = await Promise.all([
    prisma.workSession.findMany({
      select: { date: true, startTime: true, endTime: true, breakMinutes: true },
    }),
    prisma.monthlyAggregate.findMany({
      select: { year: true, month: true, totalMinutes: true },
    }),
    prisma.hourlyRate.findMany({
      select: { rate: true, effectiveFrom: true },
    }),
    prisma.settings.findUnique({
      where: { id: "default" },
      select: { hourlyRate: true },
    }),
  ]);

  const fallbackRate = settings?.hourlyRate ?? 1000;
  const minutesByYear = new Map<number, number>();
  const salaryByYear = new Map<number, number>();

  for (const s of allSessions) {
    const date = new Date(s.date);
    const year = date.getFullYear();
    const mins = calcWorkMinutes(s.startTime, s.endTime, s.breakMinutes);
    const rate = getRateForDate(allRates, date, fallbackRate);
    minutesByYear.set(year, (minutesByYear.get(year) ?? 0) + mins);
    salaryByYear.set(
      year,
      (salaryByYear.get(year) ?? 0) + Math.floor((mins / 60) * rate)
    );
  }

  for (const a of allAggregates) {
    // 月の初日を基準に時給を決定
    const date = new Date(Date.UTC(a.year, a.month - 1, 1));
    const rate = getRateForDate(allRates, date, fallbackRate);
    minutesByYear.set(
      a.year,
      (minutesByYear.get(a.year) ?? 0) + a.totalMinutes
    );
    salaryByYear.set(
      a.year,
      (salaryByYear.get(a.year) ?? 0) +
        Math.floor((a.totalMinutes / 60) * rate)
    );
  }

  return Array.from(minutesByYear.keys())
    .map((year) => ({
      year,
      totalMinutes: minutesByYear.get(year)!,
      totalSalary: salaryByYear.get(year) ?? 0,
    }))
    .sort((a, b) => b.year - a.year);
}
