"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  upsertMonthlyAggregate,
  deleteMonthlyAggregate,
} from "@/app/actions/monthly-aggregates";
import type { MonthlyAggregate } from "@/generated/prisma/client";
import { History } from "lucide-react";

type Props = {
  year: number;
  month: number;
  aggregate: MonthlyAggregate | null;
};

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

export function MonthlyAggregateSection({ year, month, aggregate }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  const [inputHours, setInputHours] = useState(
    aggregate ? String(Math.floor(aggregate.totalMinutes / 60)) : ""
  );
  const [inputMinutes, setInputMinutes] = useState(
    aggregate ? String(aggregate.totalMinutes % 60) : "0"
  );
  const [note, setNote] = useState(aggregate?.note ?? "");

  function handleOpen() {
    setInputHours(
      aggregate ? String(Math.floor(aggregate.totalMinutes / 60)) : ""
    );
    setInputMinutes(aggregate ? String(aggregate.totalMinutes % 60) : "0");
    setNote(aggregate?.note ?? "");
    setOpen(true);
  }

  function handleSave() {
    const h = parseInt(inputHours, 10) || 0;
    const m = parseInt(inputMinutes, 10) || 0;
    const totalMinutes = h * 60 + m;
    startTransition(async () => {
      await upsertMonthlyAggregate({
        year,
        month,
        totalMinutes,
        note: note || undefined,
      });
      setOpen(false);
    });
  }

  function handleDelete() {
    if (!aggregate) return;
    if (!confirm("月次集計を削除しますか？")) return;
    startDeleting(async () => {
      await deleteMonthlyAggregate(aggregate.id);
    });
  }

  return (
    <>
      {aggregate ? (
        <div className="flex items-center justify-between border rounded-lg px-4 py-3 bg-muted/20">
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <History className="h-4 w-4 text-muted-foreground shrink-0" />
            <Badge variant="outline" className="text-xs">
              月次集計
            </Badge>
            <span className="font-semibold">
              {formatMinutes(aggregate.totalMinutes)}
            </span>
            {aggregate.note && (
              <span className="text-muted-foreground text-xs">
                {aggregate.note}
              </span>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={handleOpen}>
              編集
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              削除
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 border-dashed text-muted-foreground"
          onClick={handleOpen}
        >
          <History className="h-4 w-4" />
          過去データとして月次集計を追加
        </Button>
      )}

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {year}年{month}月の月次集計
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            個別の勤務記録がない月の合計勤務時間を入力してください。
            既存の個別記録がある場合は合算されます。
          </p>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">合計勤務時間</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={744}
                  value={inputHours}
                  onChange={(e) => setInputHours(e.target.value)}
                  className="w-24 text-right"
                  placeholder="0"
                />
                <span className="text-sm text-muted-foreground">時間</span>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={inputMinutes}
                  onChange={(e) => setInputMinutes(e.target.value)}
                  className="w-20 text-right"
                  placeholder="0"
                />
                <span className="text-sm text-muted-foreground">分</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">メモ（任意）</label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="期間や備考など"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending || !inputHours}
            >
              {isPending ? "保存中…" : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
