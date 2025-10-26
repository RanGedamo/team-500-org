
// =============================
// hooks/useGlobalShiftValidations.ts
// =============================
import { useMemo } from "react";
import { Assignments } from "@/types/schedule/types";

type SlotType = {
  position: string;
  date: string;
  start: string;
  end: string;
  shiftKey: string;
};

/**
 * Build global warnings for the same guard scheduled on more than one position on the same day.
 * Input shape: allAssignments: Record<positionName, Assignments>
 */
export function useGlobalShiftValidations(
  allAssignments: Record<string, Assignments>
) {
  return useMemo(() => {
    // guard -> list of its slots across all positions
    const guardMap = new Map<string, Array<{
      position: string;
      date: string;
      start: string;
      end: string;
      shiftKey: string;
    }>>();

    Object.entries(allAssignments).forEach(([position, assignments]) => {
      Object.values(assignments).forEach((shiftObj) => {
        Object.entries(shiftObj).forEach(([date, slots]) => {
          slots.forEach((slot) => {
            if (!slot.guard) return;
            if (!guardMap.has(slot.guard)) guardMap.set(slot.guard, []);
            guardMap.get(slot.guard)!.push({
              position,
              date,
              start: slot.start,
              end: slot.end,
              shiftKey: slot.shiftKey,
            });
          });
        });
      });
    });

    const warnings: string[] = [];

    guardMap.forEach((slots, guard) => {
      // Group by date
      const byDate: Record<string, SlotType[]> = slots.reduce(
        (acc: Record<string, SlotType[]>, slot: SlotType) => {
          (acc[slot.date] ||= []).push(slot);
          return acc;
        },
        {}
      );

      Object.entries(byDate).forEach(([date, slotArr]) => {
        if (slotArr.length > 1) {
          warnings.push(
            `המאבטח ${guard} שובץ ביותר מעמדה אחת בתאריך ${date} (${slotArr
              .map((s) => s.position)
              .join(", ")})`
          );
        }
      });
    });

    return { warnings };
  }, [allAssignments]);
}
