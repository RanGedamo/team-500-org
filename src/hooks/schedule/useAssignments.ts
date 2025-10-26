// =============================
// hooks/useAssignments.ts — FINAL (clean)
// =============================
"use client";
import { useState, useEffect } from "react";
import { Assignments, Shift } from "@/types/schedule/types";
import { generateInitialAssignments } from "@/utils/scheduleUtils";
import { updateAssignment } from "@/features/schedule/scheduleHandlers";

export type EditableField = "start" | "end" | "guard";

export const useAssignments = (
  shifts: Shift[],
  dates: string[],
  slots: number,
  position: string,
  externalAssignments?: Assignments,
  onAssignmentsChange?: (a: Assignments) => void
) => {
  const [assignments, setAssignments] = useState<Assignments>(() =>
    externalAssignments
      ? externalAssignments
      : generateInitialAssignments(shifts, dates, slots, position)
  );

  // Re-create baseline when inputs change or external is provided
  useEffect(() => {
    if (externalAssignments) {
      setAssignments(externalAssignments);
    } else {
      setAssignments(
        generateInitialAssignments(shifts, dates, slots, position)
      );
    }
  }, [externalAssignments, shifts, dates, slots, position]);

  const handleFieldChange = (
    shiftKey: string,
    day: string,
    slotIdx: number,
    field: EditableField,
    value: string
  ) => {
    setAssignments((prev) => {
      const updated = updateAssignment(prev, shiftKey, day, slotIdx, field, value);
      onAssignmentsChange?.(updated);
      return updated;
    });
  };

  return {
    assignments,
    setAssignments,
    handleFieldChange,
  };
};

// NOTE:
// הוסר useShiftValidations המקומי והייבוא של validateGuardRestBetweenShifts.
// מרגע זה, מומלץ לבצע ולידציה גלובלית ברמת הדף באמצעות
// validateGlobalGuardRestAndDoubleBooking ולהזרים restConflicts לפי tableId
// לקומפוננטות התצוגה (כמו ScheduleTable).
