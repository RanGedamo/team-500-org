
// // =============================================================
// // validations/validateRestBetweenShifts.ts
// // (local per-table validator used by useShiftValidations)
// // =============================================================
// import { Assignments } from "@/types/schedule/types";

// // Default times per shift
// const defaultShiftTimesLocal: Record<string, { start: string; end: string }> = {
//   morning: { start: "06:00", end: "14:00" },
//   afternoon: { start: "14:00", end: "22:00" },
//   night: { start: "22:00", end: "06:00" }, // ends next day
// };

// // Convert date + hh:mm to concrete Date
// const parseDateTimeLocal = (date: string, time: string): Date => {
//   const [h, m] = time.split(":").map(Number);
//   const d = new Date(date);
//   d.setHours(h, m, 0, 0);
//   return d;
// };

// const formatDateLocal = (date: string) =>
//   new Date(date).toLocaleDateString("he-IL", {
//     weekday: "long",
//     day: "2-digit",
//     month: "2-digit",
//   });

// export const validateGuardRestBetweenShifts = (
//   assignments: Assignments,
//   dates: string[]
// ): {
//   conflictedSlots: { [date: string]: { [shiftKey: string]: Set<number> } };
//   warnings: string[];
// } => {
//   const guardShiftsMap: Record<
//     string,
//     {
//       shiftKey: string;
//       date: string;
//       start: Date;
//       end: Date;
//       slotIdx: number;
//     }[]
//   > = {};

//   for (const shiftKey in assignments) {
//     const dayMap = assignments[shiftKey];
//     const shiftTimes = defaultShiftTimesLocal[shiftKey] ?? {
//       start: "08:00",
//       end: "16:00",
//     };

//     dates.forEach((date) => {
//       const slots = dayMap[date];
//       if (!slots) return;

//       slots.forEach((slot, slotIdx) => {
//         if (!slot.guard) return;

//         const startStr =
//           slot.start && /^\d{2}:\d{2}$/.test(slot.start)
//             ? slot.start
//             : shiftTimes.start;

//         const endStr =
//           slot.end && /^\d{2}:\d{2}$/.test(slot.end) ? slot.end : shiftTimes.end;

//         const start = parseDateTimeLocal(date, startStr);
//         let end = parseDateTimeLocal(date, endStr);

//         // Night crossing safeguard (or any end <= start)
//         if (end.getTime() <= start.getTime()) {
//           end = new Date(end.getTime());
//           end.setDate(end.getDate() + 1);
//         }

//         (guardShiftsMap[slot.guard] ||= []).push({
//           shiftKey,
//           date,
//           start,
//           end,
//           slotIdx,
//         });
//       });
//     });
//   }

//   const warnings: string[] = [];
//   const conflictedSlots: {
//     [date: string]: { [shiftKey: string]: Set<number> };
//   } = {};

//   Object.entries(guardShiftsMap).forEach(([guard, arr]) => {
//     const shifts = arr.slice().sort((a, b) => a.start.getTime() - b.start.getTime());

//     for (let i = 0; i < shifts.length - 1; i++) {
//       const curr = shifts[i];
//       const next = shifts[i + 1];

//       const sameDay = curr.date === next.date;
//       const overlap = curr.end.getTime() > next.start.getTime();
//       const restHours = (next.start.getTime() - curr.end.getTime()) / 3.6e6;

//       const mark = (d: string, k: string, idx: number) => {
//         (conflictedSlots[d] ||= {});
//         (conflictedSlots[d][k] ||= new Set()).add(idx);
//       };

//       if (sameDay) {
//         warnings.push(
//           `❗ המאבטח ${guard} שובץ לשתי משמרות באותו היום: ${curr.shiftKey} ו־${next.shiftKey} ב־${formatDateLocal(
//             curr.date
//           )}.`
//         );
//         mark(curr.date, curr.shiftKey, curr.slotIdx);
//         mark(next.date, next.shiftKey, next.slotIdx);
//       } else if (overlap) {
//         warnings.push(
//           `❗ המאבטח ${guard} שובץ לשתי משמרות שחופפות בין ${curr.shiftKey} (${curr.start
//             .toTimeString()
//             .slice(0, 5)}-${curr.end.toTimeString().slice(0, 5)}) ל־${next.shiftKey} (${next.start
//             .toTimeString()
//             .slice(0, 5)}-${next.end.toTimeString().slice(0, 5)}).`
//         );
//         mark(curr.date, curr.shiftKey, curr.slotIdx);
//         mark(next.date, next.shiftKey, next.slotIdx);
//       } else if (restHours < 8) {
//         // strictly less than 8h is an error (>= 8h allowed) when dates differ
//         warnings.push(
//           `⚠️ המאבטח ${guard} שובץ ל־${curr.shiftKey} ב־${formatDateLocal(
//             curr.date
//           )} ואחריה ל־${next.shiftKey} ב־${formatDateLocal(
//             next.date
//           )} עם מנוחה של רק ${restHours.toFixed(1)} שעות.`
//         );
//         mark(curr.date, curr.shiftKey, curr.slotIdx);
//         mark(next.date, next.shiftKey, next.slotIdx);
//       }
//     }
//   });

//   return { conflictedSlots, warnings };
// };
