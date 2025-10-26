export interface ShiftSlotProps {
  guard: string;
  start: string;
  end: string;
  // position: string;

  slotIdx: number;
  day: string;
  shiftKey: string;
  guardsList: string[];
  isRestConflict?: boolean;
  onChange: (
    shiftKey: string,
    day: string,
    slotIdx: number,
    field: "start" | "end" | "guard",
    value: string
  ) => void;
}

export type ShiftAssignment = {
  day: string;
  date: string;
  shiftKey: "בוקר" | "צהריים" | "לילה";
  start: string;
  end: string;
  endDate?: string; // Optional for night shifts that cross over to the next day
};

const hebToEngShiftMap: Record<string, string> = {
  בוקר: "morning",
  צהריים: "afternoon", // אם זה מה שאתה משתמש בפועל במפתחות
  לילה: "night",
};

export const convertShiftHebToEng = (hebrew: string): string | null => {
  return hebToEngShiftMap[hebrew] || null;
};

const engToHebShiftMap: Record<string, string> = {
  morning: "בוקר",
  afternoon: "צהריים",
  night: "לילה",
};

export const convertShiftEngToHeb = (english: string): string | null => {
  return engToHebShiftMap[english] || null;
};