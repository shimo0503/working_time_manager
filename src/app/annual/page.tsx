import { getYearlySummaries } from "@/app/actions/annual";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, Clock } from "lucide-react";

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

export default async function AnnualPage() {
  const summaries = await getYearlySummaries();

  const totalMinutes = summaries.reduce((sum, s) => sum + s.totalMinutes, 0);
  const totalSalary = summaries.reduce((sum, s) => sum + s.totalSalary, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">年次サマリー</h1>

      {summaries.length === 0 ? (
        <p className="text-center text-muted-foreground py-12 text-sm">
          勤務記録がありません
        </p>
      ) : (
        <>
          {/* 累計 */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  累計給与
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  ¥{totalSalary.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-blue-500" />
                  累計勤務時間
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {formatMinutes(totalMinutes)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 年別テーブル */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">年別内訳</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>年度</TableHead>
                    <TableHead className="text-right">合計時間</TableHead>
                    <TableHead className="text-right">給与（概算）</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaries.map((s) => (
                    <TableRow key={s.year}>
                      <TableCell className="font-semibold">
                        {s.year}年
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMinutes(s.totalMinutes)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ¥{s.totalSalary.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
