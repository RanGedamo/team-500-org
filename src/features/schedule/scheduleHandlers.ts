import { Assignments } from "@/types/schedule/types";

export const updateAssignment = (
  assignments: Assignments,
  shiftKey: string,
  day: string,
  slotIdx: number,
  field: "start" | "end" | "guard",
  value: string,
): Assignments => {
  // יצירת עותק עמוק (שלא נהרוס את המצב הקיים בזיכרון)
  const updated: Assignments = { ...assignments };

  // ודא ש־shiftKey קיים
  if (!updated[shiftKey]) updated[shiftKey] = {};
  if (!updated[shiftKey][day]) updated[shiftKey][day] = [];
  // ודא ש־day קיים
  if (!updated[shiftKey][day]) updated[shiftKey][day] = [];

  // שמירה על המערך הנוכחי של הסלוטים (assignments) ליום הזה
  updated[shiftKey][day] = [...updated[shiftKey][day]];

  // שמירה על assignment הספציפי
  updated[shiftKey][day][slotIdx] = {
    ...updated[shiftKey][day][slotIdx],
    [field]: value,
  };

  return updated;
};
