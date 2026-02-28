type RateEntry = { rate: number; effectiveFrom: Date | string };

/**
 * 指定日に適用される時給を返す。
 * effectiveFrom が date 以前の中で最も新しいエントリを使用する。
 * 該当エントリがなければ fallbackRate を返す。
 */
export function getRateForDate(
  rates: RateEntry[],
  date: Date | string,
  fallbackRate: number
): number {
  const d = new Date(date);
  const applicable = rates
    .map((r) => ({ rate: r.rate, effectiveFrom: new Date(r.effectiveFrom) }))
    .filter((r) => r.effectiveFrom <= d)
    .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime());
  return applicable[0]?.rate ?? fallbackRate;
}
