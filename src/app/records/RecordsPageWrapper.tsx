"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RecordsClient } from "./RecordsClient";
import type {
  HourlyRate,
  MonthlyAggregate,
  WorkSession,
} from "@/generated/prisma/client";

type Props = {
  sessions: WorkSession[];
  defaultHourlyRate: number;
  hourlyRates: HourlyRate[];
  initialYear: number;
  initialMonth: number;
  monthlyAggregate: MonthlyAggregate | null;
};

export function RecordsPageWrapper({
  sessions,
  defaultHourlyRate,
  hourlyRates,
  initialYear,
  initialMonth,
  monthlyAggregate,
}: Props) {
  const router = useRouter();
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  const handleMonthChange = useCallback(
    (newYear: number, newMonth: number) => {
      setYear(newYear);
      setMonth(newMonth);
      router.push(`/records?year=${newYear}&month=${newMonth}`);
    },
    [router]
  );

  return (
    <RecordsClient
      sessions={sessions}
      defaultHourlyRate={defaultHourlyRate}
      hourlyRates={hourlyRates}
      year={year}
      month={month}
      onMonthChange={handleMonthChange}
      monthlyAggregate={monthlyAggregate}
    />
  );
}
