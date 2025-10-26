export type Assignment = {
  guard: string;
  start: string;
  end: string;
  position: string;
  shiftKey: string;
  date: string;
};

export type Assignments = Record<
  string, // shiftKey
  Record<
    string, // date
    Assignment[]
  >
>;


export type Shift = {
  key: string;         // "morning"
  label: string;       // "בוקר"
  defaultStart: string;// "06:00"
  defaultEnd: string;  // "14:00"
  time: string;        // "06:00-14:00"
}


export type ValidationResult = {
  isValid: boolean;
  message?: string;
};

