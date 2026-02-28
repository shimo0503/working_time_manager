"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createWorkSession,
  updateWorkSession,
  deleteWorkSession,
  type WorkSessionInput,
} from "@/app/actions/work-sessions";
import type { WorkSession } from "@/generated/prisma/client";

type Props = {
  session?: WorkSession;
  defaultDate?: string;
  open: boolean;
  onClose: () => void;
};

export function WorkSessionForm({ session, defaultDate, open, onClose }: Props) {
  const [isPending, startTransition] = useTransition();

  const today = defaultDate ?? new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState<WorkSessionInput>({
    date: session
      ? new Date(session.date).toISOString().slice(0, 10)
      : today,
    startTime: session?.startTime ?? "09:00",
    endTime: session?.endTime ?? "18:00",
    breakMinutes: session?.breakMinutes ?? 60,
    note: session?.note ?? "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "breakMinutes" ? Number(value) : value,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      if (session) {
        await updateWorkSession(session.id, form);
      } else {
        await createWorkSession(form);
      }
      onClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {session ? "勤務記録を編集" : "勤務記録を追加"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">日付</label>
            <Input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">開始時刻</label>
              <Input
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">終了時刻</label>
              <Input
                type="time"
                name="endTime"
                value={form.endTime}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">休憩時間（分）</label>
            <Input
              type="number"
              name="breakMinutes"
              value={form.breakMinutes}
              onChange={handleChange}
              min={0}
              max={480}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">メモ（任意）</label>
            <Textarea
              name="note"
              value={form.note ?? ""}
              onChange={handleChange}
              rows={2}
              placeholder="作業内容など"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "保存中…" : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type DeleteProps = {
  session: WorkSession;
  open: boolean;
  onClose: () => void;
};

export function DeleteConfirmDialog({ session, open, onClose }: DeleteProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteWorkSession(session.id);
      onClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>勤務記録を削除</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {new Date(session.date).toLocaleDateString("ja-JP")} の記録を削除しますか？
          この操作は取り消せません。
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "削除中…" : "削除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
