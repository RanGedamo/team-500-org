// src/utils/shiftUtils.ts


export const getShiftDurationInMinutes = (start: string, end: string): number => {
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);

  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;

  const diff = endMin - startMin;
  return diff >= 0 ? diff : 24 * 60 + diff;
};

export const getShiftDurationInHours = (start: string, end: string): number => {
  const minutes = getShiftDurationInMinutes(start, end);
  return minutes / 60;
};

export const isShiftExactly12Hours = (start: string, end: string): boolean => {
  const duration = getShiftDurationInHours(start, end);
  return duration === 12;
};


export const getHebrewDayName = (dateStr: string): string => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("he-IL", { weekday: "long" }).format(date);
};

export const getWeekDays = (startDateStr: string) => {
  const startDate = new Date(startDateStr);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    const dayName = new Intl.DateTimeFormat("he-IL", { weekday: "long" }).format(date);

    return {
      date: date.toISOString().split("T")[0], // "2025-07-28"
      day: dayName, 
    };
  });
};

