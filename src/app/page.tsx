import {
  getWorkSessionsByMonth,
  getWorkSessionsFromDate,
  getRecentWorkSessions,
} from "@/app/actions/work-sessions";
import { getSettings, checkAndAutoResetCycle } from "@/app/actions/settings";
import {
  getMonthlyAggregateByMonth,
  getMonthlyAggregatesFromDate,
} from "@/app/actions/monthly-aggregates";
import { getAllHourlyRates } from "@/app/actions/hourly-rates";
import { calcWorkMinutes } from "@/lib/time";
import { getRateForDate } from "@/lib/salary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Banknote, Clock, BarChart2, Target, CalendarDays } from "lucide-react";

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
}

export default async function DashboardPage() {
  // 評価サイクルが完了していれば自動リセット（データ取得前に実行）
  await checkAndAutoResetCycle();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [settings, monthlySessions, recentSessions, monthlyAggregate, hourlyRates] =
    await Promise.all([
      getSettings(),
      getWorkSessionsByMonth(year, month),
      getRecentWorkSessions(5),
      getMonthlyAggregateByMonth(year, month),
      getAllHourlyRates(),
    ]);

  const fallbackRate = settings.hourlyRate;

  // 今月の合計実働時間（分）= 個別記録 + 月次集計
  const monthlySessionMinutes = monthlySessions.reduce(
    (sum, s) => sum + calcWorkMinutes(s.startTime, s.endTime, s.breakMinutes),
    0
  );
  const monthlyMinutes =
    monthlySessionMinutes + (monthlyAggregate?.totalMinutes ?? 0);

  // 今月の給与（各セッションに適切な時給を適用）
  const sessionsSalary = monthlySessions.reduce((sum: number, s: { date: Date; startTime: string; endTime: string; breakMinutes: number }) => {
    const mins = calcWorkMinutes(s.startTime, s.endTime, s.breakMinutes);
    const rate = getRateForDate(hourlyRates, new Date(s.date), fallbackRate);
    return sum + Math.floor((mins / 60) * rate);
  }, 0);
  const aggregateDate = new Date(Date.UTC(year, month - 1, 1));
  const aggregateRate = getRateForDate(hourlyRates, aggregateDate, fallbackRate);
  const aggregateSalary = Math.floor(
    ((monthlyAggregate?.totalMinutes ?? 0) / 60) * aggregateRate
  );
  const monthlySalary = sessionsSalary + aggregateSalary;

  // 現在の時給（最新の HourlyRate エントリ、なければデフォルト）
  const currentRate =
    hourlyRates.length > 0
      ? getRateForDate(hourlyRates, new Date(), fallbackRate)
      : fallbackRate;

  // 評価サイクル進捗（個別記録 + 月次集計を合算）
  const [cycleSessions, cycleAggregates] = await Promise.all([
    getWorkSessionsFromDate(settings.cycleStartDate),
    getMonthlyAggregatesFromDate(settings.cycleStartDate),
  ]);
  const cycleSessionMinutes = cycleSessions.reduce(
    (sum, s) => sum + calcWorkMinutes(s.startTime, s.endTime, s.breakMinutes),
    0
  );
  const cycleAggregateMinutes = cycleAggregates.reduce(
    (sum: number, a: { totalMinutes: number }) => sum + a.totalMinutes,
    0
  );
  const cycleMinutes = cycleSessionMinutes + cycleAggregateMinutes;
  const cycleHours = cycleMinutes / 60;
  const cycleTarget = settings.evaluationCycleHours;
  const cycleProgress = Math.min(100, (cycleHours / cycleTarget) * 100);
  const remainingHours = Math.max(0, cycleTarget - cycleHours);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {year}年{month}月
        </p>
      </div>

      {/* 月次サマリー */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Banknote className="h-4 w-4 text-emerald-500" />
              今月の給与（概算）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ¥{monthlySalary.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              現在の時給 ¥{currentRate.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-blue-500" />
              今月の勤務時間
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatMinutes(monthlyMinutes)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {monthlySessions.length}日勤務
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4 text-amber-500" />
              平均勤務時間 / 日
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {monthlySessions.length > 0
                ? formatMinutes(
                    Math.floor(monthlyMinutes / monthlySessions.length)
                  )
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">今月の平均</p>
          </CardContent>
        </Card>
      </div>

      {/* 評価サイクル進捗 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            評価サイクル進捗
            <Badge variant="secondary" className="ml-1 text-xs font-normal">
              目標 {cycleTarget}時間
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-3xl font-bold">{cycleHours.toFixed(1)}</span>
              <span className="text-muted-foreground text-sm ml-1">/ {cycleTarget}時間</span>
            </div>
            <span className="text-2xl font-semibold text-muted-foreground">
              {cycleProgress.toFixed(1)}%
            </span>
          </div>
          <Progress value={cycleProgress} className="h-2.5" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {cycleProgress < 100 ? (
                <>
                  残り <strong className="text-foreground">{remainingHours.toFixed(1)}時間</strong> で評価対象
                </>
              ) : (
                <span className="text-green-600 font-semibold">
                  評価サイクル達成！
                </span>
              )}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              開始: {new Date(settings.cycleStartDate).toLocaleDateString("ja-JP")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 直近の勤務記録 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">直近の勤務記録</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              勤務記録がありません
            </p>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((s) => {
                const workMin = calcWorkMinutes(
                  s.startTime,
                  s.endTime,
                  s.breakMinutes
                );
                const rate = getRateForDate(
                  hourlyRates,
                  new Date(s.date),
                  fallbackRate
                );
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
                  >
                    <div>
                      <span className="font-medium">{formatDate(s.date)}</span>
                      <span className="text-muted-foreground ml-2">
                        {s.startTime}〜{s.endTime}
                        {s.breakMinutes > 0 && ` (休憩${s.breakMinutes}分)`}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">
                        {formatMinutes(workMin)}
                      </span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        ¥{Math.floor((workMin / 60) * rate).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
