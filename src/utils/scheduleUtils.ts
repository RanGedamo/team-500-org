import { Assignments, Shift } from "@/types/schedule/types";


export function generateInitialAssignments(
  shifts: Shift[],
  dates: string[],
  slotsPerShift: number,
  position: string
): Assignments {
  const result: Assignments = {};
  for (const shift of shifts) {
    if (!result[shift.key]) result[shift.key] = {};
    for (const day of dates) {
      result[shift.key][day] = [];
      for (let i = 0; i < slotsPerShift; i++) {
        result[shift.key][day].push({
          guard: "",
          start: shift.defaultStart,
          end: shift.defaultEnd,
          position,
          shiftKey: shift.key,
          date: day,
        });
      }
    }
  }
  return result;
}



export const generateWeekDates = (
  startDateStr: string,
  endDateStr?: string
): string[] => {
  const startDate = new Date(startDateStr);

  let endDate: Date;

  if (endDateStr) {
    endDate = new Date(endDateStr);
    if (endDate < startDate) {
      throw new Error("תאריך סיום לא יכול להיות לפני תאריך התחלה");
    }
  } else {
    // אם לא נבחר תאריך סיום – נבחר 6 ימים קדימה (שבוע מלא)
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
  }

  const dates: string[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
};


export   const formatDateIL = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };


  export const formatShiftName = (shift: string): string => {
    switch (shift) {
      case "morning":
        return "בוקר";
      case "afternoon":
        return "אחר הצהריים";
      case "night":
        return "לילה";
      default:
        return shift ; // אם אין שם, מחזיר את המפתח
    }
  };