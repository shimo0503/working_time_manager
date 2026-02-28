import { getSettings } from "@/app/actions/settings";
import { getAllHourlyRates } from "@/app/actions/hourly-rates";
import { SettingsForm } from "./SettingsForm";
import { HourlyRateSection } from "./HourlyRateSection";

export default async function SettingsPage() {
  const [settings, hourlyRates] = await Promise.all([
    getSettings(),
    getAllHourlyRates(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">設定</h1>
        <p className="text-muted-foreground text-sm mt-1">
          時給・評価サイクルの設定
        </p>
      </div>
      <SettingsForm settings={settings} />
      <HourlyRateSection rates={hourlyRates} />
    </div>
  );
}
