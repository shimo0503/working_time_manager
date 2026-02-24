import {
  getWorkSessionsByMonth,
  getWorkSessionsFromDate,
  getRecentWorkSessions,
} from "@/app/actions/work-sessions";
import { getSettings } from "@/app/actions/settings";
import { calcWorkMinutes } from "@/lib/time";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

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
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [settings, monthlySessions, recentSessions] = await Promise.all([
    getSettings(),
    getWorkSessionsByMonth(year, month),
    getRecentWorkSessions(5),
  ]);

  // 今月の合計実働時間（分）
  const monthlyMinutes = monthlySessions.reduce(
    (sum, s) => sum + calcWorkMinutes(s.startTime, s.endTime, s.breakMinutes),
    0
  );
  const monthlyHours = monthlyMinutes / 60;

  // 今月の給与
  const monthlySalary = Math.floor(monthlyHours * settings.hourlyRate);

  // 評価サイクル進捗
  const cycleSessions = await getWorkSessionsFromDate(settings.cycleStartDate);
  const cycleMinutes = cycleSessions.reduce(
    (sum, s) => sum + calcWorkMinutes(s.startTime, s.endTime, s.breakMinutes),
    0
  );
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              今月の給与（概算）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ¥{monthlySalary.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              時給 ¥{settings.hourlyRate.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
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
        <CardHeader>
          <CardTitle className="text-base">
            評価サイクル進捗
            <Badge variant="secondary" className="ml-2 text-xs font-normal">
              目標 {cycleTarget}時間
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium">
              {cycleHours.toFixed(1)} / {cycleTarget} 時間
            </span>
            <span className="text-muted-foreground">
              {cycleProgress.toFixed(1)}%
            </span>
          </div>
          <Progress value={cycleProgress} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {cycleProgress < 100 ? (
              <>
                残り <strong>{remainingHours.toFixed(1)}時間</strong> で評価対象
              </>
            ) : (
              <span className="text-green-600 font-medium">
                評価サイクル達成！
              </span>
            )}
            　サイクル開始:{" "}
            {new Date(settings.cycleStartDate).toLocaleDateString("ja-JP")}
          </p>
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
                        ¥
                        {Math.floor(
                          (workMin / 60) * settings.hourlyRate
                        ).toLocaleString()}
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
