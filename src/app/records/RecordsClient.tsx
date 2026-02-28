"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WorkSessionForm, DeleteConfirmDialog } from "./WorkSessionForm";
import { MonthlyAggregateSection } from "./MonthlyAggregateSection";
import { calcWorkMinutes } from "@/lib/time";
import { getRateForDate } from "@/lib/salary";
import type { MonthlyAggregate, WorkSession } from "@/generated/prisma/client";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

type HourlyRateEntry = { rate: number; effectiveFrom: Date | string };

type Props = {
  sessions: WorkSession[];
  defaultHourlyRate: number;
  hourlyRates: HourlyRateEntry[];
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  monthlyAggregate: MonthlyAggregate | null;
};

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}:00`;
  return `${h}:${String(m).padStart(2, "0")}`;
}

export function RecordsClient({
  sessions,
  defaultHourlyRate,
  hourlyRates,
  year,
  month,
  onMonthChange,
  monthlyAggregate,
}: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [editSession, setEditSession] = useState<WorkSession | null>(null);
  const [deleteSession, setDeleteSession] = useState<WorkSession | null>(null);

  const sessionsMinutes = sessions.reduce(
    (sum, s) => sum + calcWorkMinutes(s.startTime, s.endTime, s.breakMinutes),
    0
  );
  const sessionsSalary = sessions.reduce((sum, s) => {
    const mins = calcWorkMinutes(s.startTime, s.endTime, s.breakMinutes);
    const rate = getRateForDate(hourlyRates, new Date(s.date), defaultHourlyRate);
    return sum + Math.floor((mins / 60) * rate);
  }, 0);

  // 月次集計の時給は月初日を基準に決定
  const aggregateDate = new Date(Date.UTC(year, month - 1, 1));
  const aggregateRate = getRateForDate(hourlyRates, aggregateDate, defaultHourlyRate);
  const aggregateSalary = Math.floor(
    ((monthlyAggregate?.totalMinutes ?? 0) / 60) * aggregateRate
  );

  const totalMinutes = sessionsMinutes + (monthlyAggregate?.totalMinutes ?? 0);
  const totalSalary = sessionsSalary + aggregateSalary;

  function prevMonth() {
    if (month === 1) onMonthChange(year - 1, 12);
    else onMonthChange(year, month - 1);
  }

  function nextMonth() {
    if (month === 12) onMonthChange(year + 1, 1);
    else onMonthChange(year, month + 1);
  }

  return (
    <div className="space-y-4">
      {/* 月選択 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-sm min-w-[6rem] text-center">
            {year}年{month}月
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          追加
        </Button>
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="border rounded-lg px-4 py-3 bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground mb-0.5">合計時間</p>
          <p className="font-semibold">{formatMinutes(totalMinutes)}時間</p>
        </div>
        <div className="border rounded-lg px-4 py-3 bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground mb-0.5">給与概算</p>
          <p className="font-semibold">¥{totalSalary.toLocaleString()}</p>
        </div>
        <div className="border rounded-lg px-4 py-3 bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground mb-0.5">勤務日数</p>
          <p className="font-semibold">{sessions.length}日</p>
        </div>
      </div>

      {/* 月次集計（過去データ） */}
      <MonthlyAggregateSection
        year={year}
        month={month}
        aggregate={monthlyAggregate}
      />

      {/* テーブル */}
      {sessions.length === 0 && !monthlyAggregate ? (
        <p className="text-center text-muted-foreground py-12 text-sm">
          この月の記録はありません
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日付</TableHead>
              <TableHead>開始</TableHead>
              <TableHead>終了</TableHead>
              <TableHead>休憩</TableHead>
              <TableHead>実働</TableHead>
              <TableHead className="text-right">給与</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((s) => {
              const workMin = calcWorkMinutes(
                s.startTime,
                s.endTime,
                s.breakMinutes
              );
              const rate = getRateForDate(
                hourlyRates,
                new Date(s.date),
                defaultHourlyRate
              );
              const salary = Math.floor((workMin / 60) * rate);
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    {new Date(s.date).toLocaleDateString("ja-JP", {
                      month: "numeric",
                      day: "numeric",
                      weekday: "short",
                    })}
                  </TableCell>
                  <TableCell>{s.startTime}</TableCell>
                  <TableCell>{s.endTime}</TableCell>
                  <TableCell>
                    {s.breakMinutes > 0 ? `${s.breakMinutes}分` : "—"}
                  </TableCell>
                  <TableCell>{formatMinutes(workMin)}時間</TableCell>
                  <TableCell className="text-right">
                    ¥{salary.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditSession(s)}
                      >
                        編集
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteSession(s)}
                      >
                        削除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* モーダル */}
      <WorkSessionForm
        open={addOpen}
        defaultDate={(() => {
          const now = new Date();
          const isCurrentMonth =
            year === now.getFullYear() && month === now.getMonth() + 1;
          return isCurrentMonth
            ? now.toISOString().slice(0, 10)
            : `${year}-${String(month).padStart(2, "0")}-01`;
        })()}
        onClose={() => setAddOpen(false)}
      />
      {editSession && (
        <WorkSessionForm
          session={editSession}
          open={true}
          onClose={() => setEditSession(null)}
        />
      )}
      {deleteSession && (
        <DeleteConfirmDialog
          session={deleteSession}
          open={true}
          onClose={() => setDeleteSession(null)}
        />
      )}
    </div>
  );
}
