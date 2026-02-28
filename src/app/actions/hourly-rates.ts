"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

/** 全時給設定を取得（effectiveFrom 昇順） */
export async function getAllHourlyRates() {
  return prisma.hourlyRate.findMany({
    orderBy: { effectiveFrom: "asc" },
  });
}

export type HourlyRateInput = {
  rate: number;
  effectiveFrom: string; // YYYY-MM-DD
  note?: string;
};

/** 時給設定を追加 */
export async function createHourlyRate(input: HourlyRateInput) {
  await prisma.hourlyRate.create({
    data: {
      rate: input.rate,
      effectiveFrom: new Date(input.effectiveFrom + "T00:00:00"),
      note: input.note ?? null,
    },
  });
  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/annual");
  revalidatePath("/records");
}

/** 時給設定を更新 */
export async function updateHourlyRate(id: string, input: HourlyRateInput) {
  await prisma.hourlyRate.update({
    where: { id },
    data: {
      rate: input.rate,
      effectiveFrom: new Date(input.effectiveFrom + "T00:00:00"),
      note: input.note ?? null,
    },
  });
  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/annual");
  revalidatePath("/records");
}

/** 時給設定を削除 */
export async function deleteHourlyRate(id: string) {
  await prisma.hourlyRate.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/annual");
  revalidatePath("/records");
}
