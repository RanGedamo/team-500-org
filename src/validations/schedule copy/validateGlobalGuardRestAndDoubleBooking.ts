// =============================================================
// validations/validateGlobalGuardRestAndDoubleBooking.ts (FIXED)
// Enforces: (1) Same-day double booking => always error
//           (2) Cross-day rest must be >= 8h (strictly < 8h => error)
//           (3) Overlap check as highest severity
// =============================================================
import { Assignment, Assignments } from "@/types/schedule/types";
import { formatShiftName } from "@/utils/scheduleUtils";

// Toggle this if you do/don't want the "multiple positions same day" warnings
const SHOW_POSITION_DUPLICATE_WARNINGS = true;

const defaultShiftTimes: Record<string, { start: string; end: string }> = {
  morning: { start: "06:00", end: "14:00" },
  afternoon: { start: "14:00", end: "22:00" },
  night: { start: "22:00", end: "06:00" }, // crosses midnight
};

const parseDateTime = (date: string, time: string): Date => {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("he-IL", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });

const formatHour = (date: Date) => date.toTimeString().slice(0, 5);

// For red-highlighting: tableId -> date -> shiftKey -> Set(slotIdx)
export type RestConflictsMap = Record<
  string,
  Record<string, Record<string, Set<number>>>
>;

type SlotData = {
  tableId: string; // table (position) id
  position: string; // human-readable name
  shiftKey: string; // morning/afternoon/night
  date: string; // original date string (yyyy-mm-dd)
  start: Date; // concrete start time
  end: Date; // concrete end time
  slotIdx: number; // slot index
};

export function validateGlobalGuardRestAndDoubleBooking(
  allAssignments: Record<string, Assignments>
): { warnings: string[]; conflicts: RestConflictsMap } {
  const guardShiftsMap: Record<string, SlotData[]> = {};
  const guardDatePositions: Record<string, Record<string, Set<string>>> = {};
  const conflicts: RestConflictsMap = {};

  // 1) Collect all shifts per guard
  Object.entries(allAssignments).forEach(([tableId, assignments]) => {
    Object.entries(
      assignments as Record<string, Record<string, Assignment[]>>
    ).forEach(([shiftKey, daysObj]) => {
      Object.entries(daysObj).forEach(([date, slots]) => {
        slots.forEach((slot, slotIdx) => {
          if (!slot.guard) return;

          const { start: defStart, end: defEnd } =
            defaultShiftTimes[shiftKey] ?? { start: "08:00", end: "16:00" };

          const startStr =
            slot.start && /^\d{2}:\d{2}$/.test(slot.start) ? slot.start : defStart;

          const endStr =
            slot.end && /^\d{2}:\d{2}$/.test(slot.end) ? slot.end : defEnd;

          const start = parseDateTime(date, startStr);
          const end = parseDateTime(date, endStr);
          const endFixed = end.getTime() <= start.getTime()
            ? new Date(end.getTime() + 24 * 60 * 60 * 1000)
            : end; // cross midnight

          (guardShiftsMap[slot.guard] ||= []).push({
            tableId,
            position: slot.position ?? tableId,
            shiftKey,
            date,
            start,
            end: endFixed,
            slotIdx,
          });

          if (SHOW_POSITION_DUPLICATE_WARNINGS) {
            (guardDatePositions[slot.guard] ||= {});
            (guardDatePositions[slot.guard][date] ||= new Set()).add(
              slot.position ?? tableId
            );
          }
        });
      });
    });
  });

  const warnings: string[] = [];

  // 2) Optional: same guard on multiple positions same day
  if (SHOW_POSITION_DUPLICATE_WARNINGS) {
    Object.entries(guardDatePositions).forEach(([guard, datePositions]) => {
      Object.entries(datePositions).forEach(([date, positions]) => {
        if (positions.size > 1) {
          const msg = `❗ המאבטח ${guard} שובץ ביותר מעמדה אחת (${Array.from(
            positions
          ).join(", ")}) בתאריך ${formatDate(date)}`;
          warnings.push(msg);
        }
      });
    });
  }

  // 3) Per-guard: check overlap, same-day double booking, cross-day rest
  Object.entries(guardShiftsMap).forEach(([guard, shiftsArr]) => {
    const sorted = shiftsArr
      .slice()
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    // 3a) Shift longer than 12h
    sorted.forEach((s) => {
      const durationHours = (s.end.getTime() - s.start.getTime()) / 3.6e6;
      if (durationHours > 12) {
        const msg = `⏱️ המאבטח ${guard} שובץ למשמרת ארוכה מ־12 שעות (${durationHours.toFixed(
          1
        )}ש'): ${formatShiftName(s.shiftKey)}/${s.position} בתאריך ${formatDate(
          s.date
        )} (${formatHour(s.start)}-${formatHour(s.end)})`;
        warnings.push(msg);
        (conflicts[s.tableId] ||= {});
        (conflicts[s.tableId][s.date] ||= {});
        (conflicts[s.tableId][s.date][s.shiftKey] ||= new Set()).add(s.slotIdx);
      }
    });

    // 3b) Pairwise checks for consecutive shifts
    for (let i = 0; i < sorted.length - 1; i++) {
      const curr = sorted[i];
      const next = sorted[i + 1];

      const overlap = curr.end.getTime() > next.start.getTime();
      const sameDay = curr.date === next.date; // <-- NEW: same-day rule
      const restHours = (next.start.getTime() - curr.end.getTime()) / 3.6e6;

      const mark = (s: SlotData) => {
        (conflicts[s.tableId] ||= {});
        (conflicts[s.tableId][s.date] ||= {});
        (conflicts[s.tableId][s.date][s.shiftKey] ||= new Set()).add(s.slotIdx);
      };

      if (overlap) {
        const msg = `❗ המאבטח ${guard} שובץ לשתי משמרות שחופפות: ${formatShiftName(
          curr.shiftKey
        )}/${curr.position} ב־${formatDate(curr.date)} (${formatHour(curr.start)}-${formatHour(
          curr.end
        )}) וחופף ל־${formatShiftName(next.shiftKey)}/${next.position} (${formatHour(
          next.start
        )}-${formatHour(next.end)})`;
        warnings.push(msg);
        mark(curr);
        mark(next);
        continue;
      }

      // Same-day double booking => ALWAYS error, regardless of rest
      if (sameDay) {
        const msg = `❗ המאבטח ${guard} שובץ לשתי משמרות באותו היום: ${formatShiftName(
          curr.shiftKey
        )} ו־${formatShiftName(next.shiftKey)} ב־${formatDate(curr.date)}.`;
        warnings.push(msg);
        mark(curr);
        mark(next);
        continue;
      }

      // Cross-day rest must be >= 8h (strictly < 8 => error)
      if (restHours < 8) {
        const msg = `❗ המאבטח ${guard} שובץ ל־${formatShiftName(curr.shiftKey)} בעמדה ${
          curr.position
        } ב־${formatDate(curr.date)} ואחריה ל־${formatShiftName(next.shiftKey)} בעמדה ${
          next.position
        } ב־${formatDate(next.date)} עם מנוחה של רק ${restHours.toFixed(1)} שעות.`;
        warnings.push(msg);
        mark(curr);
        mark(next);
      }
    }
  });

  const unique = Array.from(new Set(warnings));
  return { warnings: unique, conflicts };
}
