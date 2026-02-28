"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateSettings, resetCycleStartDate } from "@/app/actions/settings";
import type { Settings } from "@/generated/prisma/client";

type Props = {
  settings: Settings;
};

export function SettingsForm({ settings }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isResetting, startResetting] = useTransition();
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    hourlyRate: settings.hourlyRate,
    evaluationCycleHours: settings.evaluationCycleHours,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: Number(value) }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await updateSettings(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleResetCycle() {
    if (!confirm("評価サイクルの開始日を今日にリセットしますか？")) return;
    startResetting(async () => {
      await resetCycleStartDate();
    });
  }

  return (
    <div className="space-y-6">
      {/* 基本設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">基本設定</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">デフォルト時給（円）</label>
              <p className="text-xs text-muted-foreground">
                時給変更履歴に設定がない期間に使用されます
              </p>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">¥</span>
                <Input
                  type="number"
                  name="hourlyRate"
                  value={form.hourlyRate}
                  onChange={handleChange}
                  min={0}
                  max={100000}
                  required
                  className="max-w-[160px]"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">評価サイクル（時間）</label>
              <p className="text-xs text-muted-foreground">
                何時間ごとに評価が行われるか（通常 160 時間）
              </p>
              <Input
                type="number"
                name="evaluationCycleHours"
                value={form.evaluationCycleHours}
                onChange={handleChange}
                min={1}
                max={1000}
                required
                className="max-w-[160px]"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isPending}>
                {isPending ? "保存中…" : "保存"}
              </Button>
              {saved && (
                <span className="text-sm text-green-600">保存しました</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 評価サイクル管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">評価サイクル管理</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <span className="text-muted-foreground">現在のサイクル開始日: </span>
            <strong>
              {new Date(settings.cycleStartDate).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </strong>
          </div>
          <p className="text-xs text-muted-foreground">
            評価が完了したら、サイクルを今日からリセットしてください。
          </p>
          <Button
            variant="outline"
            onClick={handleResetCycle}
            disabled={isResetting}
          >
            {isResetting ? "リセット中…" : "今日からサイクルをリセット"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
