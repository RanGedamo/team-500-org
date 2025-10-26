import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

type ValidationResult = { valid: boolean; reason?: string };
type Assignment = {
  fullName: string;
  userId: string;
  start: string;
  end: string;
  date: string;
  position?: string;
  shift?: string;
  _id?: string;
};

export const checkAssignment = (
  userId: string,
  date: string,
  newAssignment: Assignment,
  userAssignmentsByDate: Map<string, Map<string, Assignment[]>>,
  // tasksByDate: Record<string, any[]>
): ValidationResult => {
  const userAssignments = userAssignmentsByDate.get(userId);
  const sameDayAssignments = userAssignments?.get(date) || [];

  // ===== בדיקת כפילות =====
  for (const existing of sameDayAssignments) {
    const isSame = existing._id === newAssignment._id;
    if (existing.userId === userId && !isSame) {
      return {
        valid: false,
        reason: `⛔ ${existing.fullName} כבר משובץ בתאריך ${date} (${existing.position || existing.shift} ${existing.start}-${existing.end})`,
      };
    }
  }

  // ===== בדיקת מנוחה =====
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const prevDate = dayjs(date).subtract(1, "day").format("YYYY-MM-DD");
  const nextDate = dayjs(date).add(1, "day").format("YYYY-MM-DD");
  const prevAssignments = userAssignments?.get(prevDate) || [];
  const nextAssignments = userAssignments?.get(nextDate) || [];

  const newStart = toMinutes(newAssignment.start);
  const newEnd = toMinutes(newAssignment.end);

  const restOk = (endPrev: number, startNext: number) => {
    console.log(`Checking rest between ${endPrev} and ${startNext}`);
    
    let rest = startNext - endPrev;
    if (rest < 0) rest += 24 * 60;
    return rest >= 8 * 60 || endPrev !== startNext;
  };

  console.log("⏱️ Validating rest periods:", {
    prevAssignments,
    nextAssignments,
    newAssignment,
  });
  
  if (prevAssignments.length) {
    const lastPrev = prevAssignments[prevAssignments.length - 1];
    if (!restOk(toMinutes(lastPrev.end), newStart))
      return {
        valid: false,
        reason: `⚠️ (${lastPrev.fullName}) \n משובץ בתאריך: ${lastPrev.date}, בעמדה: ${lastPrev.position} \nמ-${lastPrev.start} עד-${lastPrev.end} (נדרש 8 שעות מנוחה)`,
      };
  }

  if (nextAssignments.length) {
    const firstNext = nextAssignments[0];
    if (!restOk(newEnd, toMinutes(firstNext.start)))
      return {
        valid: false,
        reason: `⚠️ ${newAssignment.fullName} מתחיל מוקדם מדי ביום ${nextDate}`,
      };
  }

  return { valid: true };
};