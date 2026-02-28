import { getWorkSessionsByMonth } from "@/app/actions/work-sessions";
import { getSettings } from "@/app/actions/settings";
import { getMonthlyAggregateByMonth } from "@/app/actions/monthly-aggregates";
import { getAllHourlyRates } from "@/app/actions/hourly-rates";
import { RecordsPageWrapper } from "./RecordsPageWrapper";

type SearchParams = Promise<{ year?: string; month?: string }>;

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? Number(params.year) : now.getFullYear();
  const month = params.month ? Number(params.month) : now.getMonth() + 1;

  const [sessions, settings, monthlyAggregate, hourlyRates] = await Promise.all(
    [
      getWorkSessionsByMonth(year, month),
      getSettings(),
      getMonthlyAggregateByMonth(year, month),
      getAllHourlyRates(),
    ]
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">勤務記録</h1>
      <RecordsPageWrapper
        sessions={sessions}
        defaultHourlyRate={settings.hourlyRate}
        hourlyRates={hourlyRates}
        initialYear={year}
        initialMonth={month}
        monthlyAggregate={monthlyAggregate}
      />
    </div>
  );
}
