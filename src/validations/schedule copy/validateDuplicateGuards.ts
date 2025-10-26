import { Assignments } from "@/types/schedule/types";
import { getHebrewDayName } from "@/utils/shiftUtils";

export const validateDuplicateGuardsByDay = (
  assignments: Assignments,
  dates: string[]
): Record<
  string,
  {
    duplicates: Set<string>;
    isValid: boolean;
    message?: string;
  }
> => {
  const result: Record<
    string,
    {
      duplicates: Set<string>;
      isValid: boolean;
      message?: string;
    }
  > = {};

  dates.forEach((date) => {
    const countMap: Record<string, number> = {};

    for (const shiftKey in assignments) {
      const slots = assignments[shiftKey][date];
      if (!Array.isArray(slots)) continue;

      for (const slot of slots) {
        if (!slot.guard) continue;
        countMap[slot.guard] = (countMap[slot.guard] || 0) + 1;
      }
    }

    const duplicates = new Set(
      Object.keys(countMap).filter((guard) => countMap[guard] > 1)
    );

    result[date] = {
      duplicates,
      isValid: duplicates.size === 0,
      message:
        duplicates.size > 0
          ? `המאבטח שובץ פעמיים ביום ${getHebrewDayName(date)}`
          : undefined,
    };
  });

  return result;
};
