import { Assignments } from "./types";

export interface ScheduleTableProps {
  restConflicts?: { [date: string]: { [shiftKey: string]: Set<number> } };
  title: string;
  slots: number;
  guardsList: string[];
  shifts: {
  label: string;
  key: string;
  defaultStart: string;
  defaultEnd: string;
  time: string; // ← שדה חובה!
  }[];
  position: string; // ← שדה חובה!
  weekDate: string;
  endDate?: string;
  assignments?: Assignments; // אופציונלי!
  dates?: string[]; // נוסיף – אם יש לך כבר מערך תאריכים

  onAssignmentsChange?: (a: Assignments) => void;
}
