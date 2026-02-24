"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RecordsClient } from "./RecordsClient";
import type { WorkSession } from "@/generated/prisma/client";

type Props = {
  sessions: WorkSession[];
  hourlyRate: number;
  initialYear: number;
  initialMonth: number;
};

export function RecordsPageWrapper({
  sessions,
  hourlyRate,
  initialYear,
  initialMonth,
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
      hourlyRate={hourlyRate}
      year={year}
      month={month}
      onMonthChange={handleMonthChange}
    />
  );
}
