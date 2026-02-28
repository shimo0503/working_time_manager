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
import { calcWorkMinutes } from "@/lib/time";
import type { WorkSession } from "@/generated/prisma/client";

type Props = {
  sessions: WorkSession[];
  hourlyRate: number;
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
};

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}:00`;
  return `${h}:${String(m).padStart(2, "0")}`;
}

export function RecordsClient({
  sessions,
  hourlyRate,
  year,
  month,
  onMonthChange,
}: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [editSession, setEditSession] = useState<WorkSession | null>(null);
  const [deleteSession, setDeleteSession] = useState<WorkSession | null>(null);

  const totalMinutes = sessions.reduce(
    (sum, s) => sum + calcWorkMinutes(s.startTime, s.endTime, s.breakMinutes),
    0
  );
  const totalSalary = Math.floor((totalMinutes / 60) * hourlyRate);

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
          <Button variant="outline" size="sm" onClick={prevMonth}>
            ←
          </Button>
          <span className="font-medium text-sm min-w-[6rem] text-center">
            {year}年{month}月
          </span>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            →
          </Button>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          + 追加
        </Button>
      </div>

      {/* サマリー */}
      <div className="flex gap-6 text-sm text-muted-foreground border rounded-lg px-4 py-2 bg-muted/30">
        <span>
          合計:{" "}
          <strong className="text-foreground">
            {formatMinutes(totalMinutes)}時間
          </strong>
        </span>
        <span>
          給与概算:{" "}
          <strong className="text-foreground">
            ¥{totalSalary.toLocaleString()}
          </strong>
        </span>
        <span>{sessions.length}日</span>
      </div>

      {/* テーブル */}
      {sessions.length === 0 ? (
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
              const salary = Math.floor((workMin / 60) * hourlyRate);
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
