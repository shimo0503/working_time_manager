/** 実働時間（分）を計算 */
export function calcWorkMinutes(
  startTime: string,
  endTime: string,
  breakMinutes: number
): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const totalMinutes = eh * 60 + em - (sh * 60 + sm);
  return Math.max(0, totalMinutes - breakMinutes);
}
