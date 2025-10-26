// // utils/schedule/index.ts

// import { Shift,ShiftName ,Assignment} from "./types";


// export const getNextSunday = (): string => {
//   const today = new Date();
//   const dayOfWeek = today.getDay();
//   const daysUntilSunday = (7 - dayOfWeek + 0) % 7 || 7;

//   const nextSunday = new Date();
//   nextSunday.setDate(today.getDate() + daysUntilSunday);

//   const year = nextSunday.getFullYear();
//   const month = String(nextSunday.getMonth() + 1).padStart(2, "0");
//   const day = String(nextSunday.getDate()).padStart(2, "0");

//   return `${year}-${month}-${day}`;
// };

// export function buildSchedule(assignments) {
//   const schedule = {};

//   for (const a of assignments) {
//     const { position, shift, ...rest } = a;

//     // אם אין עדיין עמדה, נתחיל אותה עם כל שלוש המשמרות
//     if (!schedule[position]) {
//       schedule[position] = [
//         { shift: "בוקר", guards: [] },
//         { shift: "צהריים", guards: [] },
//         { shift: "לילה", guards: [] },
//       ];
//     }

//     // נמצא את האובייקט המתאים למשמרת בתוך העמדה
//     const shiftObj = schedule[position].find(s => s.shift === shift);
//     if (shiftObj) {
//       shiftObj.guards.push(rest);
//     }
//   }

//   return schedule;
// }

// export function loadScheduleFromServerData(
//   serverData: Assignment[],
//   shifts: ShiftName[],
//   days: string[],
//   setSchedule: React.Dispatch<React.SetStateAction<Record<string, Shift[]>>>,
//   setPositions: React.Dispatch<React.SetStateAction<string[]>>,
//   setPositionGuardsCount: React.Dispatch<React.SetStateAction<Record<string, number>>>
// ) {
//   const rebuiltSchedule: Record<string, Shift[]> = {};
//   const rebuiltGuardsCount: Record<string, number> = {};

//   for (const position of Object.keys(serverData)) {
//     const shiftArray: Shift[] = [];

//     for (const shift of shifts) {
//       const guardsPerDay = days.map(
//         (day) => serverData[position]?.[day]?.[shift] || []
//       );

//       if (
//         !rebuiltGuardsCount[position] ||
//         guardsPerDay[0].length > rebuiltGuardsCount[position]
//       ) {
//         rebuiltGuardsCount[position] = guardsPerDay[0].length;
//       }

//       shiftArray.push({
//         shift,
//         guards: guardsPerDay,
//       });
//     }

//     rebuiltSchedule[position] = shiftArray;
//   }

//   setSchedule(rebuiltSchedule);
//   setPositions(Object.keys(serverData));
//   setPositionGuardsCount(rebuiltGuardsCount);
// };

// export const getAssignmentCount = (
//   schedule: Record<string, Shift[]>,
//   positions: string[],
//   name: string
// ): number => {
//   let count = 0;
//   positions.forEach((pos) => {
//     schedule[pos]?.forEach((shift) => {
//       shift.guards.forEach((guardsForDay) => {
//         guardsForDay.forEach((guard) => {
//           if (guard.name === name) count += 1;
//         });
//       });
//     });
//   });
//   return count;
// };
