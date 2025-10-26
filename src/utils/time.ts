// src/utils/time.ts

/**
 * ממיר שעת טקסט בפורמט "HH:mm" למספר דקות מהחצות
 */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
