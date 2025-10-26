// src/types/index.ts

export type Guard = {
  name: string;
  userId: string;
  start: string;
  end: string;
};

export type Shift = {
  shift: ShiftName;
guards: Guard[][];
};

export type ShiftName = "בוקר" | "צהריים" | "לילה";

// types.ts או בתוך utils/schedule/types.ts

export type Assignment = {
  week: string;
  date: string; // תאריך בפורמט ISO
  shift: ShiftName;
  position: string;
  slot: number; // מספר התור בתפקיד (מאבטח ראשון, שני וכו')
  userId: string | null;
  name: string;
  start: string;
  end: string;
};