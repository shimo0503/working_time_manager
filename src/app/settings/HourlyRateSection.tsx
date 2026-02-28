"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createHourlyRate,
  updateHourlyRate,
  deleteHourlyRate,
} from "@/app/actions/hourly-rates";
import type { HourlyRate } from "@/generated/prisma/client";
import { Plus } from "lucide-react";

type Props = {
  rates: HourlyRate[];
};

type FormState = {
  effectiveFrom: string;
  rate: string;
  note: string;
};

function emptyForm(): FormState {
  return { effectiveFrom: "", rate: "", note: "" };
}

export function HourlyRateSection({ rates }: Props) {
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<HourlyRate | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    setEditTarget(null);
    setForm(emptyForm());
    setOpen(true);
  }

  function handleEdit(r: HourlyRate) {
    setEditTarget(r);
    setForm({
      effectiveFrom: new Date(r.effectiveFrom).toISOString().slice(0, 10),
      rate: String(r.rate),
      note: r.note ?? "",
    });
    setOpen(true);
  }

  function handleDelete(id: string) {
    if (!confirm("この時給設定を削除しますか？")) return;
    startTransition(async () => {
      await deleteHourlyRate(id);
    });
  }

  function handleSave() {
    const rateNum = parseInt(form.rate, 10);
    if (!form.effectiveFrom || isNaN(rateNum)) return;
    startTransition(async () => {
      if (editTarget) {
        await updateHourlyRate(editTarget.id, {
          effectiveFrom: form.effectiveFrom,
          rate: rateNum,
          note: form.note || undefined,
        });
      } else {
        await createHourlyRate({
          effectiveFrom: form.effectiveFrom,
          rate: rateNum,
          note: form.note || undefined,
        });
      }
      setOpen(false);
    });
  }

  // 表示は新しい順
  const sortedRates = [...rates].sort(
    (a, b) =>
      new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base">時給変更履歴</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            昇給時はここに追加してください。適用開始日以降の計算に反映されます。
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleAdd}
          className="gap-1.5 shrink-0"
        >
          <Plus className="h-4 w-4" />
          追加
        </Button>
      </CardHeader>

      {sortedRates.length === 0 ? (
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            時給変更の記録はありません
          </p>
        </CardContent>
      ) : (
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>適用開始日</TableHead>
                <TableHead className="text-right">時給</TableHead>
                <TableHead className="hidden sm:table-cell">メモ</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRates.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {new Date(r.effectiveFrom).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ¥{r.rate.toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                    {r.note ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(r)}
                      >
                        編集
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(r.id)}
                      >
                        削除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      )}

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "時給変更を編集" : "時給変更を追加"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">適用開始日</label>
              <Input
                type="date"
                value={form.effectiveFrom}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    effectiveFrom: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">時給（円）</label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">¥</span>
                <Input
                  type="number"
                  min={0}
                  max={100000}
                  value={form.rate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, rate: e.target.value }))
                  }
                  className="max-w-[160px]"
                  placeholder="1000"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">メモ（任意）</label>
              <Textarea
                value={form.note}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, note: e.target.value }))
                }
                rows={2}
                placeholder="評価後の昇給など"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending || !form.effectiveFrom || !form.rate}
            >
              {isPending ? "保存中…" : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
