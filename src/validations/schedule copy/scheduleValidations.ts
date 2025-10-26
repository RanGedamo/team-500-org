// src/validations/schedule/scheduleValidations.ts
import { getShiftDurationInHours } from "@/utils/shiftUtils";

export const validateTimeRange = (start: string, end: string) => {
  if (!start || !end) {
    return { isValid: false, message: "שעת התחלה או סיום חסרה." };
  }

  const timeRegex = /^\d{2}:\d{2}$/;

  if (!timeRegex.test(start) || !timeRegex.test(end)) {
    return { isValid: false, message: "פורמט שעה לא תקין. יש להזין שעה בפורמט HH:MM" };
  }

  return { isValid: true };
};


export const validateShiftDurationInHours = (start: string, end: string) => {
  const duration = getShiftDurationInHours(start, end);

  if (duration <= 0) {
    return { isValid: false, message: "שעת הסיום לא יכולה להיות זהה או מוקדמת מהשעה ההתחלתית." };
  }

  if (duration > 12) {
    return { isValid: false, message: "משך המשמרת לא יכול לעלות על 12 שעות." };
  }

  return { isValid: true };
};

