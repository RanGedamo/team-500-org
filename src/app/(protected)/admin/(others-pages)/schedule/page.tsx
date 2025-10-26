"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  // useRef,
} from "react";
import dayjs from "dayjs";
import "dayjs/locale/he";
import { CustomSelect } from "@/components/ui/customSelect/CustomSelect";
import { sendScheduleToExcel } from "@/lib/sendToExcel";

dayjs.locale("he");

const shiftNames = [
  "בוקר",
  "בוקר ארוך",
  "צהריים",
  "לילה",
  "לילה ארוך",
] as const;
const days = [
  "ראשון",
  "שני",
  "שלישי",
  "רביעי",
  "חמישי",
  "שישי",
  "שבת",
] as const;

type Task = {
  id?: string; // מזהה זמני ב-Frontend (לרוב crypto.randomUUID)
  _id?: string; // מזהה אמיתי ממונגו
  name: string; // סוג המשימה (למשל "בדיקת מצלמות")
  weekDate: string; // תאריך תחילת השבוע (YYYY-MM-DD)
  date: string; // היום הספציפי (YYYY-MM-DD)
  userId: string; // מזהה המאבטח
  fullName: string; // שם המאבטח
  start: string; // שעה התחלה (HH:mm)
  end: string; // שעה סיום (HH:mm)
};
type ShiftName = (typeof shiftNames)[number];
type Guard = { userId: string; fullName: string }; // ✅ Changed name to fullName
type Assignment = {
  fullName: string;
  userId: string;
  start: string;
  end: string;
  slot: number;
  date: string;
  shift: string;
  position: string;
  day: string;
  id?: string;
};

type Assignments = Record<number, Record<ShiftName, Assignment[]>>;
type Position = {
  name: string;
  order: number;
  weekDate: string; // ✅ הוסף weekDate אופציונלי
};

// ✅ ADD these types
type AvailabilityForm = {
  userId: string;
  fullName: string; // ✅ Changed name to fullName
  availability: Record<string, string[]>;
  preferredPositions: string[];
  generalNotes: string;
  otherNotes: Record<string, string>;
};

type GuardAvailability = {
  fullName: string; // ✅ Changed name to fullName
  userId: string;
  isAvailable: boolean;
  shifts: string[];
  prefersPosition: boolean;
  notes?: string;
};

const DEFAULT_TIMES: Record<ShiftName, { start: string; end: string }> = {
  בוקר: { start: "06:00", end: "14:00" },
  "בוקר ארוך": { start: "06:00", end: "18:00" },
  צהריים: { start: "14:00", end: "22:00" },
  לילה: { start: "22:00", end: "06:00" },
  "לילה ארוך": { start: "18:00", end: "06:00" },
};

function getDefaultTime(shift: ShiftName) {
  return DEFAULT_TIMES[shift] || { start: "", end: "" };
}

export default function SchedulePage() {
  const [isExporting, setIsExporting] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [assignmentsByPosition, setAssignmentsByPosition] = useState<
    Record<string, Assignments>
  >({});
  const [originalAssignmentsByPosition, setOriginalAssignmentsByPosition] =
    useState<Record<string, Assignments>>({});
  const [originalTasksByDate, setOriginalTasksByDate] = useState<
    Record<string, Task[]>
  >({});

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);
  const [nextWeek, setNextWeek] = useState("");
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [newPositionName, setNewPositionName] = useState("");
  const [availabilityForms, setAvailabilityForms] = useState<
    AvailabilityForm[]
  >([]);

  const [showAvailabilityPanel, setShowAvailabilityPanel] = useState(false);

  // ✅ ADD state for guards from database
  const [guards, setGuards] = useState<Guard[]>([]);

  const [missingGuards, setMissingGuards] = useState<Guard[]>([]);
  // ✅ ADD these cache states
  const [loadedWeeks, setLoadedWeeks] = useState<Set<string>>(new Set());

  // ✅ O(1) Optimized Data Structures
  const [userAssignmentsByDate, setUserAssignmentsByDate] = useState<
    Map<string, Map<string, (Assignment | Task)[]>>
  >(new Map());
  const [guardAvailabilityCache, setGuardAvailabilityCache] = useState<
    Map<string, GuardAvailability[]>
  >(new Map());

  const [tasksByDate, setTasksByDate] = useState<Record<string, any[]>>({});
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [taskNames, setTaskNames] = useState<string[]>([]);

  // const skipUpdateRef = useRef(false);

  const handleDeleteTaskType = (taskName: string) => {
    if (!window.confirm(`למחוק את סוג המשימה "${taskName}"?`)) return;
    alert("(כרגע לא ממומש) 🧹 אפשר בעתיד למחוק סוג משימה מהמערך taskNames");
  };

  const updateTaskField = useCallback(
    (taskId: string, updates: Partial<Task>) => {
      setTasksByDate((prev) => {
        const updated = { ...prev };
        for (const [date, tasks] of Object.entries(updated)) {
          updated[date] = tasks.map((t) =>
            t.id === taskId ? { ...t, ...updates } : t,
          );
        }
        return updated;
      });
    },
    [],
  );

  // const handleAddTask = (date: string) => {
  //   setTasksByDate((prev) => {
  //     const updated = { ...prev };
  //     const existing = updated[date] || [];

  //     const newTask = {
  //       id: crypto.randomUUID(),
  //       name: "", // ❗ מתחיל ריק – יוזר ימלא
  //       fullName: "",
  //       userId: "",
  //       start: "",
  //       end: "",
  //       date,
  //       weekDate: startDate,
  //     };

  //     updated[date] = [...existing, newTask];
  //     return updated;
  //   });
  // };

  const handleRemoveTask = useCallback(
    (date: string, userId: string, name: string) => {
      setTasksByDate((prev) => {
        const updated = { ...prev };
        const currentTasks = updated[date] || [];

        // סנן את המשימה של המשתמש המסוים
        const newTasks = currentTasks.filter(
          (t) => !(t.userId === userId && t.name === name),
        );

        if (newTasks.length === 0) {
          // אם אין משימות באותו יום — מחק את המפתח כולו
          delete updated[date];
        } else {
          updated[date] = newTasks;
        }

        return updated;
      });
    },
    [],
  );

const checkConflict = useCallback(
  (
    userId: string,
    date: string,
    newAssignment: Assignment | Task,
  ): boolean => {
    const userAssignments = userAssignmentsByDate.get(userId);
    const userTasks =
      tasksByDate[date]?.filter((t) => t.userId === userId) || [];

      console.log({ checkingConflict: { userId, date, newAssignment, userAssignments, userTasks } });
      
    // ===== בדיקה 1: כפילות באותו יום =====
    const sameDayAssignments = userAssignments?.get(date) || [];
    const combinedSameDay = [...sameDayAssignments, ...userTasks];

    for (const existing of combinedSameDay) {
      // החרג את המשימה/שיבוץ הנוכחי לפי מזהה
      const isSameItem =
        (existing.id && newAssignment.id && existing.id === newAssignment.id) ||
        (existing._id && newAssignment.id && existing._id === newAssignment.id);

      if (
        existing.userId === newAssignment.userId &&
        !isSameItem
      ) {
        alert(
          `⚠️ קונפליקט! ${newAssignment.fullName} כבר משובץ ב-${date}\n` +
            `${existing.position ? `בעמדה ${existing.position}` : `במשימה "${existing.name}"`}\n` +
            `(${existing.start}-${existing.end})`,
        );
        return true;
      }
    }

    // ===== בדיקה 2: מנוחה של 8 שעות =====
    const timeToMinutes = (time: string) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

    const prevDate = dayjs(date).subtract(1, "day").format("YYYY-MM-DD");
    const nextDate = dayjs(date).add(1, "day").format("YYYY-MM-DD");

    const prevDayItems = [
      ...(userAssignments?.get(prevDate) || []),
      ...(tasksByDate[prevDate]?.filter((t) => t.userId === userId) || []),
    ];

    const nextDayItems = [
      ...(userAssignments?.get(nextDate) || []),
      ...(tasksByDate[nextDate]?.filter((t) => t.userId === userId) || []),
    ];

    // בדוק מול יום קודם
    if (prevDayItems.length > 0) {
      const lastPrev = prevDayItems[prevDayItems.length - 1];
      const prevEndMinutes = timeToMinutes(lastPrev.end);
      const newStartMinutes = timeToMinutes(newAssignment.start);

      let restMinutes = newStartMinutes - prevEndMinutes;
      if (restMinutes < 0) restMinutes += 24 * 60; // חצות

      // חריגה: אם סוף המשמרת שווה לתחילת הבאה, לא קונפליקט
      if (restMinutes < 8 * 60 && prevEndMinutes !== newStartMinutes) {
        alert(
          `⚠️ לא מספיק מנוחה!\n` +
            `${newAssignment.fullName} עבד עד ${lastPrev.end} ב-${prevDate}\n` +
            `וצריך לפחות 8 שעות מנוחה`,
        );
        return true;
      }
    }
    if (prevDayItems.length > 0) {
      const lastPrev = prevDayItems[prevDayItems.length - 1];
      const prevEndMinutes = timeToMinutes(lastPrev.end);
      const newStartMinutes = timeToMinutes(newAssignment.start);

      let restMinutes = newStartMinutes - prevEndMinutes;
      if (restMinutes < 0) restMinutes += 24 * 60; // חצות

      // חריגה: רק אם סוף המשמרת הקודמת 22:00 ותחילת הבאה 22:00
      if (
        restMinutes < 8 * 60 &&
        !(lastPrev.end === "22:00" && newAssignment.start === "22:00")
      ) {
        alert(
          `⚠️ לא מספיק מנוחה!\n` +
            `${newAssignment.fullName} עבד עד ${lastPrev.end} ב-${prevDate}\n` +
            `וצריך לפחות 8 שעות מנוחה`,
        );
        return true;
      }
    }

    // בדוק מול יום הבא
    if (nextDayItems.length > 0) {
      const firstNext = nextDayItems[0];
      const newEndMinutes = timeToMinutes(newAssignment.end);
      const nextStartMinutes = timeToMinutes(firstNext.start);

      let restMinutes = nextStartMinutes - newEndMinutes;
      if (restMinutes < 0) restMinutes += 24 * 60;

      // חריגה: רק אם סוף המשמרת הנוכחית 22:00 ותחילת הבאה 22:00
      if (
        restMinutes < 8 * 60 &&
        !(newAssignment.end === "22:00" && firstNext.start === "22:00")
      ) {
        alert(
          `⚠️ לא מספיק מנוחה לפני היום הבא!\n` +
            `${newAssignment.fullName} מתחיל מוקדם מדי ב-${nextDate}`,
        );
        return true;
      }
    }
    // בדוק מול יום הבא (לוגיקה כפולה, שמור אותה)
    if (nextDayItems.length > 0) {
      const firstNext = nextDayItems[0];
      const newEndMinutes = timeToMinutes(newAssignment.end);
      const nextStartMinutes = timeToMinutes(firstNext.start);

      let restMinutes = nextStartMinutes - newEndMinutes;
      if (restMinutes < 0) restMinutes += 24 * 60;

      // חריגה: אם סוף המשמרת שווה לתחילת הבאה, לא קונפליקט
      if (restMinutes < 8 * 60 && newEndMinutes !== nextStartMinutes) {
        alert(
          `⚠️ לא מספיק מנוחה לפני היום הבא!\n` +
            `${newAssignment.fullName} מתחיל מוקדם מדי ב-${nextDate}`,
        );
        return true;
      }
    }

    return false;
  },
  [userAssignmentsByDate, tasksByDate],
);


  useEffect(() => {
    if (
      !assignmentsByPosition ||
      Object.keys(assignmentsByPosition).length === 0
    )
      return;

    setUserAssignmentsByDate((prev) => {
      // בנה Map חדש רק עם שיבוצים
      const assignmentsMap = new Map<string, Map<string, Assignment[]>>();

      for (const positionData of Object.values(assignmentsByPosition)) {
        for (const dayData of Object.values(positionData)) {
          for (const shiftGuards of Object.values(dayData)) {
            for (const guard of shiftGuards) {
              if (!assignmentsMap.has(guard.userId)) {
                assignmentsMap.set(guard.userId, new Map());
              }
              const userDateMap = assignmentsMap.get(guard.userId)!;

              if (!userDateMap.has(guard.date)) {
                userDateMap.set(guard.date, []);
              }

              userDateMap.get(guard.date)!.push(guard);
            }
          }
        }
      }

      // מזג עם משימות מה-state הקודם
      const mergedMap = new Map<string, Map<string, (Assignment | Task)[]>>();

      // העתק שיבוצים חדשים
      for (const [userId, dates] of assignmentsMap) {
        mergedMap.set(userId, new Map());
        for (const [date, assignments] of dates) {
          mergedMap.get(userId)!.set(date, assignments);
        }
      }

      // הוסף משימות מה-state הקודם
      for (const [userId, dates] of prev) {
        for (const [date, items] of dates) {
          const tasks = items.filter((item) => "name" in item) as Task[];

          if (tasks.length > 0) {
            if (!mergedMap.has(userId)) {
              mergedMap.set(userId, new Map());
            }

            const userMap = mergedMap.get(userId)!;
            const existing = userMap.get(date) || [];
            userMap.set(date, [...existing, ...tasks]);
          }
        }
      }

      return mergedMap;
    });
  }, [assignmentsByPosition]);

  // ✅ 2. useEffect למשימות - זהה לשיבוצים
  useEffect(() => {
    if (!tasksByDate || Object.keys(tasksByDate).length === 0) return;

    setUserAssignmentsByDate((prev) => {
      // בנה Map חדש רק עם משימות
      const tasksMap = new Map<string, Map<string, Task[]>>();

      for (const [date, tasks] of Object.entries(tasksByDate)) {
        for (const task of tasks) {
          if (!tasksMap.has(task.userId)) {
            tasksMap.set(task.userId, new Map());
          }

          const userDateMap = tasksMap.get(task.userId)!;
          if (!userDateMap.has(date)) {
            userDateMap.set(date, []);
          }

          userDateMap.get(date)!.push(task);
        }
      }

      // מזג עם שיבוצים מה-state הקודם
      const mergedMap = new Map<string, Map<string, (Assignment | Task)[]>>();

      // העתק משימות חדשות
      for (const [userId, dates] of tasksMap) {
        mergedMap.set(userId, new Map());
        for (const [date, tasks] of dates) {
          mergedMap.get(userId)!.set(date, tasks);
        }
      }

      // הוסף שיבוצים מה-state הקודם
      for (const [userId, dates] of prev) {
        for (const [date, items] of dates) {
          const assignments = items.filter(
            (item) => "position" in item,
          ) as Assignment[];

          if (assignments.length > 0) {
            if (!mergedMap.has(userId)) {
              mergedMap.set(userId, new Map());
            }

            const userMap = mergedMap.get(userId)!;
            const existing = userMap.get(date) || [];
            userMap.set(date, [...existing, ...assignments]);
          }
        }
      }

      return mergedMap;
    });
  }, [tasksByDate]);

  // const addToUserAssignments = useCallback((item: Assignment | Task) => {
  //   skipUpdateRef.current = true;
  //   console.log({ "checking addToUserAssignments": item });
  //   setUserAssignmentsByDate((prev) => {
  //     const next = new Map(prev);
  //     const userMap = next.get(item.userId) || new Map();
  //     const existing = userMap.get(item.date) || [];
  //     userMap.set(item.date, [...existing, item]);
  //     next.set(item.userId, userMap);
  //     return next;
  //   });
  // }, []);

  // ✅ O(1) Cached guard availability
  const getCachedAvailableGuards = useCallback(
    (dayIndex: number, shift: ShiftName): GuardAvailability[] => {
      const cacheKey = `${dayIndex}-${shift}-${selectedPosition}`;

      if (guardAvailabilityCache.has(cacheKey)) {
        return guardAvailabilityCache.get(cacheKey)!;
      }

      const dayName = days[dayIndex];
      const result = availabilityForms.map((form) => {
        const dayAvailability = form.availability[dayName] || [];
        const isAvailable =
          dayAvailability.includes(shift) ||
          (shift === "בוקר" && dayAvailability.includes("בוקר ארוך")) ||
          (shift === "לילה" && dayAvailability.includes("לילה ארוך")) ||
          dayAvailability.includes("יכול הכל");
        const cantWork = dayAvailability.includes("לא יכול");
        const prefersPosition =
          form.preferredPositions.includes(selectedPosition) ||
          form.preferredPositions.includes("לא משנה לי");

        return {
          fullName: form.fullName,
          userId: form.userId,
          isAvailable: isAvailable && !cantWork,
          shifts: dayAvailability.filter(
            (s) => s !== "יכול הכל" && s !== "לא יכול",
          ),
          prefersPosition,
          notes: form.otherNotes[dayName],
        };
      });

      setGuardAvailabilityCache((prev) => new Map(prev).set(cacheKey, result));
      return result;
    },
    [availabilityForms, guardAvailabilityCache, selectedPosition],
  );

  // המשך עם שאר הקוד...
  const assignments = useMemo(
    () => assignmentsByPosition[selectedPosition] || {},
    [assignmentsByPosition, selectedPosition],
  );

  // Clear cache when data changes
  useEffect(() => {
    setGuardAvailabilityCache(new Map());
  }, [selectedPosition]);

  const loadTasks = useCallback(async () => {
    if (!startDate) return;

    try {
      const res = await fetch(
        `/api/admin/schedule/tasks?weekDate=${startDate}`,
      );
      const data = await res.json();

      if (!data?.success || !Array.isArray(data.data)) {
        setTasksByDate({});
        setTaskNames([]); // רוקן כשאין
        setSelectedTask(""); // רוקן כשאין
        return;
      }

      const grouped: Record<string, any[]> = {};
      const namesSet = new Set<string>();

      for (const t of data.data) {
        if (!t?.date) continue;
        if (t?.name) namesSet.add(t.name);

        if (!grouped[t.date]) grouped[t.date] = [];
        grouped[t.date].push({
          id: t._id,
          name: t.name || "",
          fullName: t.fullName || "",
          userId: t.userId || "",
          start: t.start || "",
          end: t.end || "",
          date: t.date,
          weekDate: t.weekDate,
        });
      }

      const names = Array.from(namesSet);
      setTasksByDate(grouped);
      setTaskNames(names);
      // אם אין בחירה או שהבחירה הנוכחית לא קיימת בשבוע הזה – בחר את הראשונה
      setSelectedTask((prev) =>
        prev && names.includes(prev) ? prev : names[0] || "",
      );

      // שמור על מפת קונפליקטים עדכנית
    } catch (err) {
      console.error("Error loading tasks:", err);
    }
  }, [startDate]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // ✅ הפוך את loadInitialData לפונקציה שרק מגדירה את startDate
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const weeksRes = await fetch("/api/admin/schedule/weeks");
        const weeksData = await weeksRes.json();

        if (weeksData.success) {
          const { existingWeeks, nextWeek: next } = weeksData.data;
          setAvailableWeeks(existingWeeks);
          setNextWeek(next);

          // ✅ רק קבע את startDate - loadWeekData יטפל בשאר
          if (next) {
            setStartDate(next);
          } else if (existingWeeks.length > 0) {
            setStartDate(existingWeeks[0]);
          }
        }
      } catch (err) {
        console.error("❌ Error loading initial data:", err);
        alert("שגיאה בטעינת נתונים ראשוניים");
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // ✅ הסר תלויות מיותרות
  useEffect(() => {
    const loadWeekData = async () => {
      if (!startDate) return;

      const cacheKey = startDate;

      if (loadedWeeks.has(cacheKey)) {
        console.log("✅ Using cached data for week:", startDate);
        return;
      }

      setIsLoading(true);

      try {
        // ✅ תמיד טען את כל 3 ה-endpoints
        const [initRes, assignmentsRes, tasksRes] = await Promise.all([
          fetch(`/api/admin/schedule/init?week=${startDate}`),
          fetch(`/api/admin/schedule/assignments?week=${startDate}`),
          fetch(`/api/admin/schedule/tasks?weekDate=${startDate}`),
        ]);

        const [initData, assignmentsData, tasksData] = await Promise.all([
          initRes.json(),
          assignmentsRes.json(),
          tasksRes.json(),
        ]);

        if (!initData?.success) throw new Error("init load failed");
        if (!assignmentsData?.success)
          throw new Error("assignments load failed");
        if (!tasksData?.success) throw new Error("tasks load failed");

        // ✅ עדכן positions, availabilityForms, missingGuards בכל טעינה
        const {
          positions: newPositions,
          availabilityForms,
          missingGuards,
        } = initData.data;

        const submittedGuards = availabilityForms.map((f: any) => ({
          userId: f.userId,
          fullName: f.fullName,
        }));
        const allGuards = [...submittedGuards, ...missingGuards];
        const uniqueGuards = Array.from(
          new Map(allGuards.map((g) => [g.userId, g])).values(),
        );

        // ✅ עדכן הכל - גם אם כבר קיים
        setPositions(newPositions || []);
        setAvailabilityForms(availabilityForms || []);
        setMissingGuards(missingGuards || []);
        setGuards(uniqueGuards);

        // ✅ קבע selectedPosition רק אם עדיין אין
        if (!selectedPosition && newPositions.length > 0) {
          setSelectedPosition(newPositions[0].name);
        }

        // ✅ בנה assignmentsByPos עם positions החדשים
        const assignmentsByPos: Record<string, Assignments> = {};
        newPositions.forEach((pos: Position) => {
          assignmentsByPos[pos.name] = {};
        });

        assignmentsData.data.forEach((a: any) => {
          const dayIndex = dayjs(a.date).diff(dayjs(startDate), "day");
          const shift = a.shift as ShiftName;
          const position = a.position;

          if (!assignmentsByPos[position]) assignmentsByPos[position] = {};
          if (!assignmentsByPos[position][dayIndex])
            assignmentsByPos[position][dayIndex] = {} as Record<
              ShiftName,
              Assignment[]
            >;
          if (!assignmentsByPos[position][dayIndex][shift])
            assignmentsByPos[position][dayIndex][shift] = [];

          assignmentsByPos[position][dayIndex][shift].push({
            fullName: a.fullName,
            userId: a.userId,
            start: a.start,
            end: a.end,
            slot: a.slot,
            date: a.date,
            position: a.position,
            day: a.day,
            shift: a.shift,
            id: a._id,
          });
        });

        // ✅ טיפול במשימות
        const groupedTasks: Record<string, Task[]> = {};
        const namesSet = new Set<string>();

        tasksData.data.forEach((t: any) => {
          if (!t?.date) return;
          if (t.name) namesSet.add(t.name);

          if (!groupedTasks[t.date]) groupedTasks[t.date] = [];
          groupedTasks[t.date].push({
            id: t._id,
            name: t.name || "",
            fullName: t.fullName || "",
            userId: t.userId || "",
            start: t.start || "",
            end: t.end || "",
            date: t.date,
            weekDate: t.weekDate,
          });
        });

        const names = Array.from(namesSet);

        // ✅ עדכון state
        setAssignmentsByPosition(assignmentsByPos);
        setOriginalAssignmentsByPosition(structuredClone(assignmentsByPos));
        setTasksByDate(groupedTasks);
        setOriginalTasksByDate(structuredClone(groupedTasks));
        setTaskNames(names);
        setSelectedTask((prev) =>
          prev && names.includes(prev) ? prev : names[0] || "",
        );

        // ✅ סמן כנטען
        setLoadedWeeks((prev) => new Set([...prev, cacheKey]));
      } catch (err) {
        console.error("❌ Error loading week data:", err);
        alert("שגיאה בטעינת נתוני השבוע");
      } finally {
        setIsLoading(false);
      }
    };

    loadWeekData();
  }, [startDate]); // ✅ רק startDate בתלויות
  const refreshPositions = useCallback(async () => {
    if (!startDate) return;
    try {
      const initRes = await fetch(`/api/admin/schedule/init?week=${startDate}`);
      const initData = await initRes.json();

      if (initData.success) {
        const { positions, availabilityForms, missingGuards } = initData.data;

        // ✅ בנה guards מחדש (כמו ב-loadWeekData)
        const submittedGuards = availabilityForms.map((f: any) => ({
          userId: f.userId,
          fullName: f.fullName,
        }));
        const allGuards = [...submittedGuards, ...missingGuards];
        const uniqueGuards = Array.from(
          new Map(allGuards.map((g) => [g.userId, g])).values(),
        );

        // ✅ עדכן הכל במכה אחת
        setPositions(positions || []);
        setAvailabilityForms(availabilityForms || []);
        setMissingGuards(missingGuards || []);
        setGuards(uniqueGuards); // ✅ עדכן guards!
      }
    } catch (err) {
      console.error("❌ Error refreshing positions:", err);
    }
  }, [startDate]);
  // ✅ עדכן את handleAddPosition
  const handleAddPosition = useCallback(async () => {
    if (!newPositionName.trim()) {
      alert("נא למלא שם עמדה");
      return;
    }

    try {
      const res = await fetch("/api/admin/schedule/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPositionName.trim(),
          weekDate: startDate, // ✅ הוסף weekDate
        }),
      });

      const data = await res.json();

      if (data.success) {
        // ✅ רענן את הרשימה
        await refreshPositions();
        setSelectedPosition(data.data.name);
        setNewPositionName("");
        setShowAddPosition(false);
        alert("✅ עמדה נוספה בהצלחה");
      } else {
        alert(`שגיאה: ${data.error}`);
      }
    } catch (err) {
      console.error("שגיאה בהוספת עמדה:", err);
      alert("אירעה שגיאה בהוספת העמדה");
    }
  }, [newPositionName, startDate, refreshPositions]);

  console.log("taskByDate: ", tasksByDate);
  console.log("selectedTask: ", selectedTask);

  // ✅ עדכן את handleDeletePosition
  const handleDeletePosition = useCallback(
    async (name: string) => {
      const position = positions.find((p) => p.name === name);
      if (!position) return;

      const shouldDelete = window.confirm(
        `האם אתה בטוח שברצונך למחוק את העמדה "${position.name}"? פעולה זו אינה ניתנת לביטול.`,
      );

      if (!shouldDelete) return;

      try {
        const res = await fetch(
          `/api/admin/schedule/positions?name=${encodeURIComponent(name)}&weekDate=${startDate}`,
          { method: "DELETE" },
        );

        const data = await res.json();

        if (data.success) {
          // ✅ Clear all cached data when position is deleted
          setLoadedWeeks(new Set());
          setGuardAvailabilityCache(new Map());

          // ✅ רענן את הרשימה
          await refreshPositions();

          const remainingPositions = positions.filter((p) => p.name !== name);
          if (remainingPositions.length > 0) {
            setSelectedPosition(remainingPositions[0].name);
          } else {
            setSelectedPosition("");
          }

          alert("✅ עמדה נמחקה בהצלחה");
        } else {
          alert(`שגיאה: ${data.error}`);
        }
      } catch (err) {
        console.error("שגיאה במחיקת עמדה:", err);
        alert("אירעה שגיאה במחיקת העמדה");
      }
    },
    [positions, refreshPositions],
  );

  const handleWeekSelect = useCallback(
    async (week: string) => {
      console.log("handleWeekSelect - Selected week:", week);

      const isNextWeek = week === nextWeek;

      if (isNextWeek && availableWeeks.length > 0) {
        try {
          const checkRes = await fetch(
            `/api/admin/schedule/assignments?week=${week}&position=${selectedPosition}`,
          );
          const checkData = await checkRes.json();

          if (checkData.success && checkData.data.length > 0) {
            setStartDate(week);
            return; // ✅ Don't clear data if assignments exist
          }
        } catch (err) {
          console.error("שגיאה בבדיקת שיבוצים קיימים:", err);
        }

        const shouldCopy = window.confirm(
          `האם ברצונך להעתיק את השיבוצים של עמדה ${selectedPosition} מהשבוע הקודם?`,
        );

        if (shouldCopy) {
          setIsCopying(true);
          try {
            const previousWeek = availableWeeks[0];

            const res = await fetch("/api/admin/schedule/copy-week", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fromWeek: previousWeek,
                toWeek: week,
                position: selectedPosition,
              }),
            });

            const data = await res.json();

            if (data.success) {
              alert(`✅ הועתקו ${data.copied} שיבוצים מהשבוע הקודם`);
              // ✅ Force reload by removing from cache
              setLoadedWeeks((prev) => {
                const newSet = new Set(prev);
                newSet.delete(week);
                return newSet;
              });
            }
          } catch (err) {
            console.error("שגיאה בהעתקת שבוע:", err);
            alert("אירעה שגיאה בהעתקת השבוע");
          } finally {
            setIsCopying(false);
          }
        }
      }

      // ✅ Just change the week - let useEffect handle the loading
      setStartDate(week);
    },
    [nextWeek, availableWeeks, selectedPosition],
  );

  // ...rest of component remains the same...

  const handleCopyFromPreviousWeek = useCallback(async () => {
    if (availableWeeks.length === 0) {
      alert("אין שבוע קודם להעתקה");
      return;
    }

    const shouldCopy = window.confirm(
      `האם ברצונך להעתיק את השיבוצים של עמדה ${selectedPosition} מהשבוע הקודם? פעולה זו תחליף את כל השיבוצים הנוכחיים.`,
    );

    if (!shouldCopy) return;

    setIsCopying(true);
    try {
      const previousWeek = availableWeeks[0];

      const res = await fetch("/api/admin/schedule/copy-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromWeek: previousWeek,
          toWeek: startDate,
          position: selectedPosition,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`✅ הועתקו ${data.copied} שיבוצים מהשבוע הקודם`);

        const assignmentsRes = await fetch(
          `/api/admin/schedule/assignments?week=${startDate}&position=${selectedPosition}`,
        );
        const assignmentsData = await assignmentsRes.json();

        if (assignmentsData.success) {
          const formatted: Assignments = {};

          for (const a of assignmentsData.data) {
            const dayIndex = dayjs(a.date).diff(dayjs(startDate), "day");
            const shift = a.shift as ShiftName;
            if (!formatted[dayIndex])
              formatted[dayIndex] = {} as Record<ShiftName, Assignment[]>;
            if (!formatted[dayIndex][shift]) formatted[dayIndex][shift] = [];
            formatted[dayIndex][shift].push({
              fullName: a.fullName,
              userId: a.userId,
              start: a.start,
              end: a.end,
              slot: a.slot,
              date: a.date,
              position: a.position,
              day: a.day,
              shift: a.shift, // ✅ ודא שהשדה הזה קיים
            });
          }

          setAssignmentsByPosition((prev) => ({
            ...prev,
            [selectedPosition]: formatted,
          }));
          setOriginalAssignmentsByPosition((prev) => ({
            ...prev,
            [selectedPosition]: structuredClone(formatted),
          }));
        }
      }
    } catch (err) {
      console.error("שגיאה בהעתקת שבוע:", err);
      alert("אירעה שגיאה בהעתקת השבוע");
    } finally {
      setIsCopying(false);
    }
  }, [availableWeeks, startDate, selectedPosition]);

  const handleRemoveGuard = useCallback(
    (
      dayIndex: number,
      shift: ShiftName,
      slot: number,
      userId: string,
      // id?: string,
    ) => {
      // console.log("handleRemoveGuard - 🗑️ Removing guard:", {
      //   dayIndex,
      //   shift,
      //   slot,
      // });

      setAssignmentsByPosition((prev) => {
        const positionAssignments = prev[selectedPosition] || {};

        // העתק עמוק של dayIndex + shift בלבד
        const updatedDayAssignments = {
          ...(positionAssignments[dayIndex] || {}),
        };

        const currentShiftList = [...(updatedDayAssignments[shift] || [])];
        const newList = currentShiftList.filter((g) => !(g.userId === userId));

        if (newList.length === 0) {
          delete updatedDayAssignments[shift];
        } else {
          updatedDayAssignments[shift] = newList.map((g, i) => ({
            ...g,
            slot: i + 1,
          }));
        }

        const updatedPosition = {
          ...positionAssignments,
          [dayIndex]: updatedDayAssignments,
        };

        // ✅ נוצר אובייקט חדש לגמרי
        const newAssignments = {
          ...prev,
          [selectedPosition]: updatedPosition,
        };

        console.log(
          "handleRemoveGuard - ✅ Updated assignments:",
          newAssignments,
        );

        return newAssignments;
      });
    },
    [selectedPosition],
  );

  const handleTimeChange = useCallback(
    (
      dayIndex: number,
      shift: ShiftName,
      guardSlot: number, // ✅ שנה מ-slotIndex ל-guardSlot
      field: "start" | "end",
      value: string,
    ) => {
      setAssignmentsByPosition((prev) => {
        const posAssignments = prev[selectedPosition] || {};
        const updated = { ...posAssignments };
        console.log(
          "handleTimeChange - 🔄 Current assignments:",
          posAssignments,
        );
        console.log(
          "handleTimeChange - 📅 Day Index:",
          dayIndex,
          "Shift:",
          shift,
          "Guard Slot:",
          guardSlot,
          "Field:",
          field,
          "Value:",
          value,
        );

        if (!updated[dayIndex]) updated[dayIndex] = {} as any;
        if (!updated[dayIndex][shift]) updated[dayIndex][shift] = [];
        console.log("handleTimeChange - ⏰ Updating time:", {
          dayIndex,
          shift,
          guardSlot,
          field,
          value,
        });

        // ✅ מצא את המאבטח לפי slot במקום index
        const guardIndex = updated[dayIndex][shift].findIndex(
          (g) => g.slot === guardSlot,
        );
        console.log("handleTimeChange - 🔍 Found guard index:", guardIndex);

        if (guardIndex !== -1) {
          updated[dayIndex][shift][guardIndex] = {
            ...updated[dayIndex][shift][guardIndex],
            [field]: value,
          };
        }

        return { ...prev, [selectedPosition]: updated };
      });
    },
    [selectedPosition],
  );

  const isSameGuard = useCallback((a?: Assignment, b?: Assignment) => {
    return (
      a?.userId === b?.userId && // ✅ השוואה לפי userId
      a?.start === b?.start &&
      a?.end === b?.end
    );
  }, []);

  // הוסף את הפונקציה הזאת אחרי `handleSave`:
  // ...existing name...
  const handleExportToExcel = useCallback(async () => {
    if (!startDate) {
      alert("אין שבוע נבחר לייצוא");
      return;
    }

    // ✅ בדיקה מהירה יותר - עוצר בהזדמנות הראשונה
    let hasAnyAssignments = false;

    for (const positionData of Object.values(assignmentsByPosition)) {
      for (const [dayIndex, dayData] of Object.entries(positionData)) {
        if (dayIndex === "-1") continue; // דלג על יום לפני השבוע

        for (const shiftGuards of Object.values(dayData)) {
          if (shiftGuards.length > 0) {
            hasAnyAssignments = true;
            break; // ✅ עצור מיד כשמוצא שיבוץ
          }
        }
        if (hasAnyAssignments) break;
      }
      if (hasAnyAssignments) break;
    }

    if (!hasAnyAssignments) {
      alert("אין שיבוצים לייצוא עבור השבוע הנבחר");
      return;
    }

    const shouldExport = window.confirm(
      `האם אתה בטוח שברצונך לייצא את הסידור לאקסל עבור השבוע ${dayjs(startDate).format("DD/MM/YYYY")}?`,
    );

    if (!shouldExport) return;

    setIsExporting(true);
    try {
      // ✅ טען את העמדות רק אם צריך (כבר טעון ב-state)
      const positionsWithWeekDate = positions.map((pos) => ({
        ...pos,
        weekDate: startDate,
      }));

      // ✅ סינון יעיל יותר - רק פעולה אחת
      const filteredAssignmentsByPosition: Record<string, Assignments> = {};

      for (const [positionname, positionData] of Object.entries(
        assignmentsByPosition,
      )) {
        const filteredPositionData: Assignments = {};

        for (const [dayIndex, dayData] of Object.entries(positionData)) {
          if (dayIndex !== "-1") {
            filteredPositionData[Number(dayIndex)] = dayData;
          }
        }

        filteredAssignmentsByPosition[positionname] = filteredPositionData;
      }

      // הכן את הנתונים לשליחה
      const scheduleData = {
        week: startDate,
        positions: positionsWithWeekDate,
        assignments: filteredAssignmentsByPosition,
        guards: guards,
        weekDates: Array.from({ length: 7 }, (_, i) =>
          dayjs(startDate).add(i, "day").format("YYYY-MM-DD"),
        ),
      };

      const result = await sendScheduleToExcel({
        week: startDate,
        schedule: scheduleData,
      });

      alert(`✅ הסידור יוצא בהצלחה לאקסל! ${result.message || ""}`);
    } catch (err) {
      console.error("❌ Excel export error:", err);
      alert(
        `אירעה שגיאה בייצוא לאקסל: ${err instanceof Error ? err.message : "שגיאה לא ידועה"}`,
      );
    } finally {
      setIsExporting(false);
    }
  }, [startDate, assignmentsByPosition, positions, guards]);

  const handleSaveTasks = useCallback(async () => {
    if (!startDate) return;
    setIsSaving(true);

    try {
      const toInsert: any[] = [];
      const toUpdate: any[] = [];
      const toDelete: any[] = [];

      // flatten לשני הסטייטים
      const flatten = (data: Record<string, Task[]>) =>
        Object.entries(data).flatMap(([date, tasks]) =>
          tasks.map((t) => ({
            weekDate: startDate,
            date,
            name: t.name,
            userId: t.userId,
            fullName: t.fullName,
            start: t.start,
            end: t.end,
          })),
        );

      const current = flatten(originalTasksByDate);
      const updated = flatten(tasksByDate);

      // נבנה hash לשם השוואה מהירה
      const mapOriginal = new Map(
        current.map((t) => [`${t.userId}_${t.date}_${t.name}`, t]),
      );

      for (const t of updated) {
        const key = `${t.userId}_${t.date}_${t.name}`;
        const prev = mapOriginal.get(key);

        if (!prev) {
          toInsert.push(t);
        } else {
          const changed =
            prev.fullName !== t.fullName ||
            prev.start !== t.start ||
            prev.end !== t.end;
          if (changed) toUpdate.push(t);
          mapOriginal.delete(key); // מה שנשאר במפה בסוף = נמחק
        }
      }

      toDelete.push(...mapOriginal.values());

      console.log("🟢 הוספה:", toInsert);
      console.log("🟡 עדכון:", toUpdate);
      console.log("🔴 מחיקה:", toDelete);

      // ✅ שמור שינויים במקביל
      await Promise.all([
        ...toInsert.map((t) =>
          fetch("/api/admin/schedule/tasks/batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([t]),
          }),
        ),
        ...toUpdate.map((t) =>
          fetch("/api/admin/schedule/tasks", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: t.name,
              date: t.date,
              userId: t.userId,
              updates: {
                fullName: t.fullName,
                start: t.start,
                end: t.end,
              },
            }),
          }),
        ),
        ...toDelete.map((t) => {
          console.log("toDelete : ", t.name, t.date, t.userId);

          return fetch(
            `/api/admin/schedule/tasks?name=${encodeURIComponent(
              t.name,
            )}&date=${t.date}&userId=${t.userId}&weekDate=${t.weekDate}`,
            { method: "DELETE" },
          );
        }),
      ]);

      alert(
        `✅ עודכנו ${toUpdate.length}, נוספו ${toInsert.length}, ונמחקו ${toDelete.length} משימות`,
      );

      // ✅ עדכן את המקור אחרי שמירה מוצלחת
      setOriginalTasksByDate(structuredClone(tasksByDate));
    } catch (err) {
      console.error("❌ Error saving tasks:", err);
      alert("שגיאה בשמירת המשימות");
    } finally {
      setIsSaving(false);
    }
  }, [startDate, tasksByDate, originalTasksByDate]);

  const handleSave = useCallback(async () => {
    if (!startDate) return;

    setIsSaving(true);
    const weekStart = dayjs(startDate);

    const allPayloads: any[] = [];
    const allDeletePromises: Promise<Response>[] = [];

    for (const positionKey of Object.keys(assignmentsByPosition)) {
      const assignments = assignmentsByPosition[positionKey] || {};
      const originalAssignments =
        originalAssignmentsByPosition[positionKey] || {};

      console.log(`💾 Saving position: ${positionKey}`);

      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const currentDate = weekStart.add(dayIndex, "day").format("YYYY-MM-DD");

        for (const shift of shiftNames) {
          const oldList = originalAssignments?.[dayIndex]?.[shift] || [];
          const newList = assignments?.[dayIndex]?.[shift] || [];

          const oldMap = new Map(oldList.map((g) => [g.slot, g]));
          const newMap = new Map(newList.map((g) => [g.slot, g]));

          oldList.forEach((oldGuard) => {
            if (!newMap.has(oldGuard.slot)) {
              allDeletePromises.push(
                fetch("/api/admin/schedule/assignments", {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    date: currentDate,
                    userId: oldGuard.userId,
                    position: positionKey,
                  }),
                }),
              );
            }
          });

          newList.forEach((g) => {
            const oldG = oldMap.get(g.slot);
            if (!isSameGuard(g, oldG)) {
              const payload = {
                week: startDate,
                date: currentDate,
                day: days[dayIndex],
                shift: g.shift,
                position: positionKey,
                slot: g.slot,
                fullName: g.fullName,
                userId: g.userId,
                start: g.start,
                end: g.end,
              };
              allPayloads.push(payload);
            }
          });
        }
      }
    }

    try {
      await Promise.all(allDeletePromises);

      if (allPayloads.length > 0) {
        console.log(`📨 Sending ${allPayloads.length} assignments to save`);

        const res = await fetch("/api/admin/schedule/assignments/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(allPayloads),
        });

        if (!res.ok) {
          const error = await res.json();
          console.error("שגיאה:", error.error);
          alert("אירעה שגיאה בעת שליחת הסידור");
          return;
        }

        const result = await res.json();
        console.log("✅ Save result:", result);
      }

      alert("הסידור נשמר בהצלחה ✅");

      setOriginalAssignmentsByPosition(structuredClone(assignmentsByPosition));

      const weeksRes = await fetch("/api/admin/schedule/weeks");
      const weeksData = await weeksRes.json();
      if (weeksData.success) {
        setAvailableWeeks(weeksData.data.existingWeeks);
      }
    } catch (err) {
      console.error("שגיאה כללית:", err);
      alert("אירעה שגיאה בעת שמירת הסידור");
    } finally {
      setIsSaving(false);
    }
  }, [
    startDate,
    assignmentsByPosition,
    originalAssignmentsByPosition,
    isSameGuard,
  ]);

  const getAvailableGuards = useCallback(
    (dayIndex: number, shift: ShiftName): GuardAvailability[] => {
      return getCachedAvailableGuards(dayIndex, shift); // ✅ Use cached version
    },
    [getCachedAvailableGuards],
  );

  const getAvailableGuardsForTasks = useCallback(
    (dayIndex: number): GuardAvailability[] => {
      // נשתמש בלוגיקת הזמינות הרגילה לפי יום בלבד
      const dayName = days[dayIndex];

      return availabilityForms.map((form) => {
        const dayAvailability = form.availability[dayName] || [];
        const isAvailable =
          dayAvailability.length > 0 && !dayAvailability.includes("לא יכול");
        const prefersPosition =
          form.preferredPositions.includes(selectedPosition) ||
          form.preferredPositions.includes("לא משנה לי");

        return {
          fullName: form.fullName,
          userId: form.userId,
          isAvailable,
          shifts: dayAvailability.filter(
            (s) => s !== "יכול הכל" && s !== "לא יכול",
          ),
          prefersPosition,
          notes: form.otherNotes[dayName],
        };
      });
    },
    [availabilityForms, selectedPosition],
  );

  const renderGrid = useMemo(() => {
    if (!startDate) return null;

    return (
      <div className="w-full">
        <div className="w-full text-center">
          {selectedPosition && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3">
              <div className="text-xl font-bold text-gray-800">
                עמדה -{" "}
                {
                  positions.find((p) => {
                    console.log(p);
                    return p.name === selectedPosition;
                  })?.name
                }
              </div>
            </div>
          )}
        </div>

        <div className="w-full  overflow-x-auto overflow-y-visible">
          <table className="mb-5 max-w-full border border-gray-400 text-center">
            <thead>
              <tr>
                <th className="border border-gray-400 p-2">משמרת / יום</th>
                {days.map((day, i) => (
                  <th key={i} className="border border-gray-400 p-2">
                    {day} <br />
                    {dayjs(startDate).add(i, "day").format("DD/MM")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shiftNames
                .filter(
                  (shift) => shift !== "לילה ארוך" && shift !== "בוקר ארוך",
                )
                .map((shift, shiftIndex) => (
                  <tr key={shiftIndex}>
                    <td className="border border-gray-400 p-2 font-bold">
                      {shift}
                    </td>
                    {days.map((_, dayIndex) => (
                      <td
                        key={dayIndex}
                        className="relative w-full min-w-[180px] border border-gray-400 p-1 pt-3 pb-3 align-top" // ✅ ADD relative
                        style={{ minHeight: "300px" }} // ✅ ADD minHeight to prevent overflow clipping
                      >
                        <div className="flex flex-col gap-1">
                          {assignments?.[dayIndex]?.[shift]
                            ?.filter(Boolean)
                            ?.map((guard, index) => (
                              <div
                                key={`${guard.userId}-${guard.slot}-${index}`}
                                className="flex items-center justify-between rounded bg-gray-100 p-1"
                              >
                                <div className="flex w-full flex-col text-right">
                                  <div className="flex items-center justify-between">
<select
  value={guard.fullName}
  onChange={(e) => {
    const selectedFullName = e.target.value;
    const newGuard = getAvailableGuards(dayIndex, shift).find(
      (g) => g.fullName === selectedFullName,
    );
    const userId =
      newGuard?.userId ||
      guards.find((g) => g.fullName === selectedFullName)?.userId ||
      guard.userId;

    // בדוק אם כבר קיים guard עם אותו userId במשמרת הזו
    const alreadyExists =
      assignments?.[dayIndex]?.[shift]?.some(
        (g, idx) =>
          g.userId === userId && idx !== index // אל תבדוק את עצמו
      );

    if (alreadyExists) {
      alert(`⚠️ ${selectedFullName} כבר שובץ במשמרת זו`);
      return;
    }

    // בדוק קונפליקט כולל (לפי כל השבוע)
    const currentDate = dayjs(startDate)
      .add(dayIndex, "day")
      .format("YYYY-MM-DD");

    const newAssignment = {
      ...guard,
      fullName: selectedFullName,
      userId: userId,
      date: currentDate,
      shift,
      position: selectedPosition,
    };

    if (
      checkConflict(
        userId,
        currentDate,
        newAssignment,
      )
    ) {
      return; // אל תעדכן אם יש קונפליקט
    }

    setAssignmentsByPosition((prev) => {
      const posAssignments = prev[selectedPosition] || {};
      const updated = { ...posAssignments };
      if (!updated[dayIndex]) updated[dayIndex] = {} as any;
      if (!updated[dayIndex][shift]) updated[dayIndex][shift] = [];

      updated[dayIndex][shift][index] = {
        ...guard,
        fullName: selectedFullName,
        userId: userId,
      };
      return {
        ...prev,
        [selectedPosition]: updated,
      };
    });
  }}
  className="cursor-pointer rounded border-none bg-transparent px-1 font-bold hover:bg-gray-200"
>
  <option value={guard.fullName}>
    {guard.fullName}
  </option>
  {guards
    .filter((g) => g.fullName !== guard.fullName)
    .map((g) => (
      <option key={g.userId + g.fullName} value={g.fullName}>
        {g.fullName}
      </option>
    ))}
</select>
                                    <button
                                      className="ml-1 text-sm text-red-500"
                                      onClick={() => {
                                        handleRemoveGuard(
                                          dayIndex,
                                          shift,
                                          guard.slot,
                                          guard.userId,
                                          // guard._id,
                                        );
                                      }}
                                    >
                                      ❌
                                    </button>
                                  </div>
                                  <div className="mt-1 flex gap-2">
                                    <input
                                      type="time"
                                      value={guard.start}
                                      onChange={(e) =>
                                        handleTimeChange(
                                          dayIndex,
                                          shift,
                                          guard.slot,
                                          "start",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full border px-2 py-1"
                                    />
                                    <input
                                      type="time"
                                      value={guard.end}
                                      onChange={(e) =>
                                        handleTimeChange(
                                          dayIndex,
                                          shift,
                                          guard.slot,
                                          "end",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full border px-2 py-1"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}

                          <CustomSelect
                            value=""
                            placeholder="+ הוסף מאבטח"
                            onChange={(selectedFullName, userId) => {
                              // ✅ הוסף async

                              console.log("useridcheck: ",{ selectedFullName, userId });
                              
                              if (!selectedFullName) return;

                              const guard = getAvailableGuards(
                                dayIndex,
                                shift,
                              ).find((g) => g.fullName === selectedFullName);

                              const usersGuard = guards.find(
                                (g) => g.fullName === selectedFullName,
                              );

                              if (!usersGuard) return;

                              const guardUserId = usersGuard.userId;

                              // Check for long shifts
                              const isAvailableForLongNight =
                                guard?.shifts.includes("לילה ארוך");
                              const isAvailableForLongMorning =
                                guard?.shifts.includes("בוקר ארוך");

                              let { start, end } = getDefaultTime(shift);

                              if (shift === "לילה" && isAvailableForLongNight) {
                                start = "18:00";
                                end = "06:00";
                              }
                              if (
                                shift === "בוקר" &&
                                isAvailableForLongMorning
                              ) {
                                end = "18:00";
                                start = "06:00";
                              }


                              setAssignmentsByPosition((prev) => {
                                const posAssignments =
                                  prev[selectedPosition] || {};
                                const updated = { ...posAssignments };

                                if (!updated[dayIndex])
                                  updated[dayIndex] = {} as any;
                                if (!updated[dayIndex][shift])
                                  updated[dayIndex][shift] = [];

                                const alreadyExists = updated[dayIndex][
                                  shift
                                ].some((g) => g.userId === guardUserId || g.fullName === selectedFullName);

                                console.log(alreadyExists);
                                
                                if (!alreadyExists) {
                                  const currentDate = dayjs(startDate)
                                    .add(dayIndex, "day")
                                    .format("YYYY-MM-DD");
                                  const dayName = days[dayIndex];

                                  const newAssignment = {
                                    fullName: selectedFullName,
                                    userId: guardUserId,
                                    start,
                                    end,
                                    shift,
                                    slot: 0, // Will be updated below
                                    date: currentDate,
                                    position: selectedPosition,
                                    day: dayName,
                                  };
                                  console.log("New Assignment:", newAssignment);
                                  console.log(
                                    "Checking conflict for userId:",
                                    guardUserId,
                                    "on date:",
                                    currentDate,
                                  );

                                  // ✅ Check for conflicts
                                  if (
                                    checkConflict(
                                      guardUserId,
                                      currentDate,
                                      newAssignment,
                                    )
                                  ) {
                                    return { ...prev }; // Don't add if conflict
                                  }
                                  // addToUserAssignments(newAssignment);

                                  // ✅ Continue with original logic...
                                  const existingSlots = updated[dayIndex][shift]
                                    .map((g) => g.slot)
                                    .filter((s) => typeof s === "number");
                                  const maxSlot =
                                    existingSlots.length > 0
                                      ? Math.max(...existingSlots)
                                      : 0;
                                  const newSlot = maxSlot + 1;

                                  updated[dayIndex][shift].push({
                                    ...newAssignment,
                                    slot: newSlot,
                                  });

                                  // ✅ עדכן maxSlot בעמדה אסינכרונית
                                }

                                return {
                                  ...prev,
                                  [selectedPosition]: updated,
                                };
                              });
                            }}
                            optionGroups={[
                              {
                                label: "━━━ עדיפות ━━━",
                                options: getAvailableGuards(dayIndex, shift)
                                  .filter(
                                    (g) => g.isAvailable && g.prefersPosition,
                                  )
                                  .map((g) => {
                                    // ✅ Check if guard wants long shift
                                    const wantsLongNight =
                                      (shift === "לילה" &&
                                        g.shifts.includes("לילה ארוך")) ||
                                      (shift !== "לילה" &&
                                        g.shifts.includes("לילה ארוך"));
                                    const wantsLongMorning =
                                      (shift === "בוקר" &&
                                        g.shifts.includes("בוקר ארוך")) ||
                                      (shift !== "בוקר" &&
                                        g.shifts.includes("בוקר ארוך"));

                                    const wantsShortNight =
                                      shift === "לילה" &&
                                      g.shifts.includes("לילה") &&
                                      !g.shifts.includes("לילה ארוך");
                                    const wantsShortMorning =
                                      shift === "בוקר" &&
                                      g.shifts.includes("בוקר") &&
                                      !g.shifts.includes("בוקר ארוך");

                                    const isLongShift =
                                      wantsLongNight || wantsLongMorning;
                                    const isShortShift =
                                      wantsShortNight || wantsShortMorning;

                                    return {
                                      value: g.fullName,
                                      label: `${g.fullName}${shift !== "צהריים" && isLongShift ? " (ארוך)" : isShortShift ? " (קצר)" : ""}`,
                                      userId: g.userId,
                                      className:
                                        "bg-green-50 hover:bg-green-100",
                                    };
                                  }),
                              },
                              {
                                label: "━━ עדיפות לעמדה אחרת ━━",
                                options: getAvailableGuards(dayIndex, shift)
                                  .filter(
                                    (g) => g.isAvailable && !g.prefersPosition,
                                  )
                                  .map((g) => {
                                    // ✅ Check if guard wants long shift
                                    const wantsLongNight =
                                      (shift === "לילה" &&
                                        g.shifts.includes("לילה ארוך")) ||
                                      (shift !== "לילה" &&
                                        g.shifts.includes("לילה ארוך"));
                                    const wantsLongMorning =
                                      (shift === "בוקר" &&
                                        g.shifts.includes("בוקר ארוך")) ||
                                      (shift !== "בוקר" &&
                                        g.shifts.includes("בוקר ארוך"));
                                    const wantsShortNight =
                                      shift === "לילה" &&
                                      g.shifts.includes("לילה") &&
                                      !g.shifts.includes("לילה ארוך");
                                    const wantsShortMorning =
                                      shift === "בוקר" &&
                                      g.shifts.includes("בוקר") &&
                                      !g.shifts.includes("בוקר ארוך");

                                    console.log(
                                      "Guard:",
                                      g.fullName,
                                      "Wants Long Night:",
                                      wantsLongNight,
                                      "Wants Long Morning:",
                                      wantsLongMorning,
                                      " Wants Short Night:",
                                      wantsShortNight,
                                      "Wants Short Morning:",
                                      wantsShortMorning,
                                      "shift:",
                                      shift,
                                      " g.shifts : ",
                                      g.shifts,
                                      "g :",
                                      g,
                                      "getAvailableGuards(dayIndex, shift): ",
                                      getAvailableGuards(dayIndex, shift),
                                    );

                                    const isLongShift =
                                      wantsLongNight || wantsLongMorning;
                                    const isShortShift =
                                      wantsShortNight || wantsShortMorning;

                                    return {
                                      value: g.fullName,
                                      label: `${g.fullName}${shift !== "צהריים" && isLongShift ? " (ארוך)" : isShortShift ? " (קצר)" : ""}`,
                                      userId: g.userId,
                                      className: "bg-blue-50 hover:bg-blue-100",
                                    };
                                  }),
                              },
                              {
                                label: "━━━ לא הגישו ━━━",
                                options: missingGuards
                                  .filter(
                                    (g) =>
                                      g.fullName && g.fullName.trim() !== "",
                                  )
                                  .map((g) => ({
                                    value: g.fullName,
                                    label: g.fullName,
                                    userId: g.userId,
                                    className:
                                      "bg-yellow-50 hover:bg-yellow-100 text-orange-600",
                                  })),
                              },
                              {
                                label: "━━━ לא יכולים ━━━",
                                options: getAvailableGuards(dayIndex, shift)
                                  .filter((g) => !g.isAvailable)
                                  .map((g) => ({
                                    value: g.fullName,
                                    label: g.fullName,
                                    userId: g.userId,
                                    className: "bg-red-50 hover:bg-red-100",
                                  })),
                              },
                            ]}
                            className="w-full"
                            dropdownWidth="fit"
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* ==================== טבלת משימות ==================== */}
        <div className="mt-12 w-full max-w-full">
          <h2 className="mb-3 text-center text-lg font-bold text-gray-800">
            🧾 ניהול משימות שבועיות
          </h2>

          {/* טאבים כמו בעמדות */}
          <div className="mb-4 flex items-center gap-2 overflow-x-auto overflow-y-visible border-b border-gray-300">
            {taskNames.map((tName) => (
              <div key={tName} className="group relative flex items-center">
                <button
                  onClick={() => setSelectedTask(tName)}
                  className={`px-4 py-2 ${
                    selectedTask === tName
                      ? "border-b-2 border-blue-600 font-bold text-blue-600"
                      : "text-gray-600 hover:text-blue-600"
                  }`}
                >
                  {tName || "משימה חדשה"}
                </button>
                {selectedTask === tName && (
                  <button
                    onClick={() => handleDeleteTaskType(tName)}
                    className="ml-1 text-xs text-gray-400 hover:text-red-600"
                    title="מחק משימה"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}

            {/* ➕ כפתור הוספת סוג משימה */}
            <button
              onClick={() => {
                const newName = prompt("הכנס שם משימה חדשה:");
                if (!newName?.trim()) return;
                setTaskNames((prev) => [...prev, newName.trim()]);
                setSelectedTask(newName.trim());
              }}
              className="ml-4 text-sm text-blue-600 hover:text-blue-800"
            >
              ➕ הוסף משימה חדשה
            </button>
          </div>

          {/* טבלה רק של המשימה שנבחרה */}
          {selectedTask && (
            <div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3">
                <input
                  type="text"
                  value={selectedTask}
                  onChange={(e) => setSelectedTask(e.target.value)}
                  placeholder="שם המשימה..."
                  className="border-b border-gray-300 bg-transparent text-xl font-bold text-gray-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="overflow-x-auto overflow-y-visible">
                <table className="mb-5 max-w-full border border-gray-400 text-center">
                  <thead>
                    <tr>
                      {days.map((day, i) => (
                        <th key={i} className="border border-gray-400 p-2">
                          {day} <br />
                          {dayjs(startDate).add(i, "day").format("DD/MM")}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      {days.map((_, dayIndex) => {
                        const date = dayjs(startDate)
                          .add(dayIndex, "day")
                          .format("YYYY-MM-DD");

                        const dayTasks =
                          tasksByDate[date]?.filter(
                            (t) => t.name === selectedTask,
                          ) || [];

                        return (
                          <td
                            key={dayIndex}
                            className="relative w-full min-w-[180px] border border-gray-400 p-1 pt-3 pb-3 align-top"
                            style={{ minHeight: "180px" }}
                          >
                            <div className="flex flex-col gap-1">
                              {dayTasks.map((t, index) => (
                                <div
                                  key={`${t.userId}-${index}`}
                                  className="flex items-center justify-between rounded bg-gray-100 p-1"
                                >
                                  <div className="flex w-full flex-col text-right">
                                    <div className="flex items-center justify-between">
                                      <select
                                        value={t.fullName}
                                        onChange={(e) => {
                                          const selectedFullName =
                                            e.target.value;
                                          const newGuard = guards.find(
                                            (g) =>
                                              g.fullName === selectedFullName,
                                          );
                                          if (!newGuard) return;

                                          const guardUserId = newGuard.userId;

                                          // בנה משימה זמנית לבדוק קונפליקט
                                          const newTask: Task = {
                                            ...t,
                                            fullName: selectedFullName,
                                            userId: guardUserId,
                                          };

                                          // ✅ 1. בדוק קונפליקט (מנוחה / כפילות עם עמדות אחרות)
                                          if (
                                            checkConflict(
                                              guardUserId,
                                              date,
                                              newTask,
                                            )
                                          ) {
                                            return; // אל תמשיך אם יש קונפליקט
                                          }

                                          // ✅ 2. בדוק אם הוא כבר משובץ במשימה אחרת באותו יום
                                          const sameDayTasks =
                                            tasksByDate[date] || [];
                                          const exists = sameDayTasks.some(
                                            (task) =>
                                              task.userId === guardUserId &&
                                              task.name === t.name && // באותה משימה
                                              task.id !== t.id, // לא לבדוק את עצמו
                                          );

                                          if (exists) {
                                            alert(
                                              `⚠️ ${selectedFullName} כבר שובץ למשימה "${t.name}" ביום זה`,
                                            );
                                            return;
                                          }

                                          // ✅ 3. עדכן רק את ה־state המקומי (לא פונה לשרת עדיין)
                                          updateTaskField(t.id, {
                                            fullName: selectedFullName,
                                            userId: guardUserId,
                                          });
                                        }}
                                        className="cursor-pointer rounded border-none bg-transparent px-1 font-bold hover:bg-gray-200"
                                      >
                                        <option value={t.fullName}>
                                          {t.fullName || "בחר מאבטח"}
                                        </option>
                                        {guards
                                          .filter(
                                            (g) => g.fullName !== t.fullName,
                                          )
                                          .map((g) => (
                                            <option
                                              key={g.userId}
                                              value={g.fullName}
                                            >
                                              {g.fullName}
                                            </option>
                                          ))}
                                      </select>
                                      <button
                                        className="ml-1 text-sm text-red-500"
                                        onClick={() =>
                                          handleRemoveTask(
                                            date,
                                            t.userId,
                                            t.name,
                                          )
                                        }
                                      >
                                        ❌
                                      </button>
                                    </div>

                                    <div className="mt-1 flex gap-2">
                                      <input
                                        type="time"
                                        value={t.start || ""}
                                        onChange={(e) => {
                                          updateTaskField(t.id, {
                                            start: e.target.value,
                                          });
                                        }}
                                        className="w-full border px-2 py-1"
                                      />
                                      <input
                                        type="time"
                                        value={t.end || ""}
                                        onChange={(e) =>
                                          updateTaskField(t.id, {
                                            end: e.target.value,
                                          })
                                        }
                                        className="w-full border px-2 py-1"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}

                              {/* ➕ הוסף שורה ריקה */}
                              <CustomSelect
                                value=""
                                placeholder="+ הוסף מאבטח"
                                onChange={(selectedFullName, userId) => {
                                  if (!selectedFullName) return;

                                  const guard = guards.find(
                                    (g) => g.fullName === selectedFullName,
                                  );
                                  const guardUserId =
                                    userId || guard?.userId || "";

                                  const newTask: Task = {
                                    name: selectedTask,
                                    fullName: selectedFullName,
                                    userId: guardUserId,
                                    start: "06:00",
                                    end: "14:00",
                                    weekDate: startDate,
                                    date,
                                  };

                                  // ✅ בדוק קונפליקט לפני עדכון ה-state
                                  if (
                                    checkConflict(guardUserId, date, newTask)
                                  ) {
                                    return; // ✅ עצור כאן - אל תוסיף
                                  }

                                  // ✅ עדכן state רק אם אין קונפליקט
                                  setTasksByDate((prev) => {
                                    const updated = { ...prev };
                                    if (!updated[date]) updated[date] = [];

                                    // בדוק כפילות
                                    const exists = updated[date].some(
                                      (t) =>
                                        t.userId === guardUserId &&
                                        t.name === selectedTask,
                                    );

                                    if (exists) {
                                      alert(
                                        `⚠️ ${selectedFullName} כבר שובץ למשימה "${selectedTask}"`,
                                      );
                                      return prev;
                                    }

                                    updated[date] = [...updated[date], newTask];
                                    return updated;
                                  });
                                }}
                                optionGroups={[
                                  {
                                    label: "━━━ עדיפות ━━━",
                                    options: getAvailableGuardsForTasks(
                                      dayIndex,
                                    )
                                      .filter(
                                        (g) =>
                                          g.isAvailable && g.prefersPosition,
                                      )
                                      .map((g) => ({
                                        value: g.fullName,
                                        label: g.fullName,
                                        userId: g.userId,
                                        className:
                                          "bg-green-50 hover:bg-green-100",
                                      })),
                                  },
                                  {
                                    label: "━━ עדיפות לעמדה אחרת ━━",
                                    options: getAvailableGuardsForTasks(
                                      dayIndex,
                                    )
                                      .filter(
                                        (g) =>
                                          g.isAvailable && !g.prefersPosition,
                                      )
                                      .map((g) => ({
                                        value: g.fullName,
                                        label: g.fullName,
                                        userId: g.userId,
                                        className:
                                          "bg-blue-50 hover:bg-blue-100",
                                      })),
                                  },
                                  {
                                    label: "━━━ לא הגישו ━━━",
                                    options: missingGuards
                                      .filter((g) => g.fullName?.trim() !== "")
                                      .map((g) => ({
                                        value: g.fullName,
                                        label: g.fullName,
                                        userId: g.userId,
                                        className:
                                          "bg-yellow-50 hover:bg-yellow-100 text-orange-600",
                                      })),
                                  },
                                  {
                                    label: "━━━ לא יכולים ━━━",
                                    options: getAvailableGuardsForTasks(
                                      dayIndex,
                                    )
                                      .filter((g) => !g.isAvailable)
                                      .map((g) => ({
                                        value: g.fullName,
                                        label: g.fullName,
                                        userId: g.userId,
                                        className: "bg-red-50 hover:bg-red-100",
                                      })),
                                  },
                                ]}
                                className="w-full"
                                dropdownWidth="fit"
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 mb-16 flex gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving || isCopying}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSaving ? "שומר..." : "שמור סידור עבודה"}
          </button>

          <button
            onClick={handleSaveTasks}
            disabled={isSaving || isCopying}
            className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:bg-gray-400"
          >
            {isSaving ? "שומר משימות..." : "💾 שמור סידור משימות"}
          </button>

          <button
            onClick={handleExportToExcel}
            disabled={isSaving || isCopying || isExporting}
            className="flex items-center gap-2 rounded bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 disabled:bg-gray-400"
          >
            {isExporting ? (
              <>
                <span className="animate-spin">⏳</span>
                מייצא לאקסל...
              </>
            ) : (
              <>📊 ייצא לאקסל</>
            )}
          </button>

          {availableWeeks.length > 0 && (
            <button
              onClick={handleCopyFromPreviousWeek}
              disabled={isSaving || isCopying}
              className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:bg-gray-400"
            >
              {isCopying ? "מעתיק..." : "📋 העתק משבוע קודם"}
            </button>
          )}
        </div>
      </div>
    );
  }, [
    startDate,
    selectedPosition,
    positions,
    taskNames,
    selectedTask,
    handleSave,
    isSaving,
    isCopying,
    handleSaveTasks,
    handleExportToExcel,
    isExporting,
    availableWeeks.length,
    handleCopyFromPreviousWeek,
    assignments,
    getAvailableGuards,
    missingGuards,
    guards,
    handleRemoveGuard,
    handleTimeChange,
    checkConflict,
    tasksByDate,
    getAvailableGuardsForTasks,
    updateTaskField,
    handleRemoveTask,
  ]);

  const AvailabilityPanel = useMemo(() => {
    if (!showAvailabilityPanel || availabilityForms.length === 0) return null;

    return (
      <div className="mb-6 rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
        <h2 className="mb-4 text-xl font-bold text-purple-900">
          📋 זמינות מאבטחים - עמדה{" "}
          {positions.find((p) => p.name === selectedPosition)?.name}
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-purple-300">
            <thead className="bg-purple-100">
              <tr>
                <th className="border border-purple-300 p-2">שם מאבטח</th>
                {days.map((day, i) => (
                  <th key={i} className="border border-purple-300 p-2">
                    {day}
                  </th>
                ))}
                <th className="border border-purple-300 p-2">הערות כלליות</th>
              </tr>
            </thead>
            <tbody>
              {availabilityForms.map((form) => {
                // ✅ Check if this guard prefers the selected position
                const prefersThisPosition =
                  form.preferredPositions.includes(selectedPosition);
                const doesntCare =
                  form.preferredPositions.includes("לא משנה לי");

                return (
                  <tr
                    key={form.userId}
                    className={`hover:bg-purple-50 ${
                      !prefersThisPosition && !doesntCare ? "opacity-60" : ""
                    }`}
                  >
                    {/* Guard Name Column */}
                    <td className="border border-purple-300 p-2 font-semibold">
                      {form.fullName}
                      {prefersThisPosition && (
                        <span
                          className="mr-2 text-green-600"
                          title="מעדיף עמדה זו"
                        >
                          ⭐
                        </span>
                      )}
                      {doesntCare && (
                        <span className="mr-2 text-blue-600" title="לא משנה לו">
                          ✓
                        </span>
                      )}
                      {!prefersThisPosition && !doesntCare && (
                        <span
                          className="mr-2 text-gray-400"
                          title="לא העדיף עמדה זו"
                        >
                          ○
                        </span>
                      )}
                    </td>

                    {/* Day Columns - Show availability for each day */}
                    {days.map((day, dayIndex) => {
                      const dayAvailability = form.availability[day] || [];
                      const dayNotes = form.otherNotes[day] || "";
                      const cantWork = dayAvailability.includes("לא יכול");
                      const canAll = dayAvailability.includes("יכול הכל");

                      // Filter out special values
                      const shifts = dayAvailability.filter(
                        (s) => s !== "יכול הכל" && s !== "לא יכול",
                      );

                      return (
                        <td
                          key={dayIndex}
                          className={`border border-purple-300 p-2 text-center text-sm ${
                            cantWork
                              ? "bg-red-100 text-red-700"
                              : canAll
                                ? "bg-green-100 text-green-700"
                                : shifts.length > 0
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-gray-50 text-gray-400"
                          }`}
                        >
                          {cantWork ? (
                            <div className="font-bold">❌</div>
                          ) : canAll ? (
                            <div className="font-bold">✅ הכל</div>
                          ) : shifts.length > 0 ? (
                            <div className="space-y-1">
                              {(() => {
                                // Define the order of shifts
                                const shiftOrder = [
                                  "בוקר",
                                  "בוקר ארוך",
                                  "צהריים",
                                  "לילה",
                                  "לילה ארוך",
                                ];

                                // Filter out redundant shifts
                                const filteredShifts = shifts.filter(
                                  (shift) => {
                                    // If "בוקר ארוך" exists, remove "בוקר"
                                    if (
                                      shift === "בוקר" &&
                                      shifts.includes("בוקר ארוך")
                                    ) {
                                      return false;
                                    }
                                    // If "לילה ארוך" exists, remove "לילה"
                                    if (
                                      shift === "לילה" &&
                                      shifts.includes("לילה ארוך")
                                    ) {
                                      return false;
                                    }
                                    return true;
                                  },
                                );

                                // Sort shifts according to the defined order
                                const sortedShifts = filteredShifts.sort(
                                  (a, b) => {
                                    return (
                                      shiftOrder.indexOf(a) -
                                      shiftOrder.indexOf(b)
                                    );
                                  },
                                );

                                return sortedShifts.map((shift, i) => (
                                  <div key={i} className="font-medium">
                                    {(shift === "בוקר" ||
                                      shift === "בוקר ארוך") &&
                                      "🌅"}
                                    {shift === "צהריים" && "☀️"}
                                    {(shift === "לילה" ||
                                      shift === "לילה ארוך") &&
                                      "🌙"}
                                    {" " + shift}
                                  </div>
                                ));
                              })()}
                            </div>
                          ) : (
                            <div>-</div>
                          )}

                          {/* Show notes if exist */}
                          {dayNotes && (
                            <div className="group/tooltip relative mt-1 cursor-help text-xs text-gray-600 italic">
                              <span>💬</span>
                              <div
                                className="invisible absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded bg-gray-800 px-2 py-1 text-xs whitespace-normal text-white opacity-0 transition-opacity group-hover/tooltip:visible group-hover/tooltip:opacity-100"
                                style={{ minWidth: "200px", maxWidth: "300px" }}
                              >
                                {dayNotes}
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* General Notes Column */}
                    {/* General Notes Column */}
                    <td className="border border-purple-300 p-2 text-sm text-gray-700">
                      <div className="space-y-1">
                        {/* General Notes */}

                        {/* Preferred Positions */}
                        {form.preferredPositions &&
                          form.preferredPositions.length > 0 && (
                            <div className="space-y-1">
                              <div className="font-semibold text-gray-500">
                                עמדות מועדפות:
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {form.preferredPositions.map(
                                  (position, index) => {
                                    // ✅ Log here - outside JSX
                                    console.log(
                                      `Guard ${form.fullName} prefers position:`,
                                      position,
                                    );

                                    return (
                                      <span
                                        key={index}
                                        className="text-green-600"
                                      >
                                        {position}
                                        {index <
                                          form.preferredPositions.length - 1 &&
                                          ", "}
                                      </span>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                          )}

                        {form.generalNotes && (
                          <div className="mt-1 mb-2 text-gray-700">
                            <span className="block font-semibold">הערות: </span>
                            <span className="text-gray-400">
                              {form.generalNotes || "אין הערות"}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 flex flex-wrap justify-around gap-3 rounded bg-purple-100 p-3 text-sm">
          <div>
            <span className="font-semibold">סה&quot;כ מילאו:</span>{" "}
            <span className="text-purple-700">{availabilityForms.length}</span>
          </div>
          <div>
            <span className="font-semibold">⭐ העדיפו עמדה זו:</span>{" "}
            <span className="text-green-700">
              {
                availabilityForms.filter((f) =>
                  f.preferredPositions.includes(selectedPosition),
                ).length
              }
            </span>
          </div>
          <div>
            <span className="font-semibold">✓ לא משנה להם:</span>{" "}
            <span className="text-blue-700">
              {
                availabilityForms.filter((f) =>
                  f.preferredPositions.includes("לא משנה לי"),
                ).length
              }
            </span>
          </div>
          <div>
            <span className="font-semibold">○ לא העדיפו:</span>{" "}
            <span className="text-gray-600">
              {
                availabilityForms.filter(
                  (f) =>
                    !f.preferredPositions.includes(selectedPosition) &&
                    !f.preferredPositions.includes("לא משנה לי"),
                ).length
              }
            </span>
          </div>
        </div>

        {/* ✅ Add legend */}
        <div className="mt-3 flex flex-wrap justify-center gap-4 rounded bg-white p-2 text-xs">
          <div className="flex items-center gap-1">
            <span>⭐</span>
            <span>העדיף עמדה זו</span>
          </div>
          <div className="flex items-center gap-1">
            <span>✓</span>
            <span>לא משנה לו</span>
          </div>
          <div className="flex items-center gap-1">
            <span>○</span>
            <span>לא העדיף עמדה זו</span>
          </div>
        </div>
      </div>
    );
  }, [showAvailabilityPanel, availabilityForms, selectedPosition, positions]);

  return (
    <div className="w-full p-6">
      <h1 className="mb-4 text-center text-2xl font-bold">סידור עבודה שבועי</h1>

      {positions.length > 0 && selectedPosition && (
        <>
          <div className="mb-4 flex flex-wrap justify-center gap-4">
            <select
              value={startDate}
              onChange={(e) => handleWeekSelect(e.target.value)}
              className="rounded border border-gray-400 px-3 py-2"
              disabled={isCopying}
            >
              {nextWeek && (
                <option value={nextWeek}>
                  📅 שבוע הבא ({dayjs(nextWeek).format("DD/MM/YYYY")})
                </option>
              )}
              {availableWeeks
                .filter((a) => a !== nextWeek)
                .map((week) => (
                  <option key={week} value={week}>
                    {dayjs(week).format("DD/MM/YYYY")} -{" "}
                    {dayjs(week).add(6, "day").format("DD/MM/YYYY")}
                  </option>
                ))}
            </select>

            {/* ✅ ADD availability button */}
            <button
              onClick={() => setShowAvailabilityPanel(!showAvailabilityPanel)}
              className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
            >
              {showAvailabilityPanel
                ? "🔻 הסתר זמינות"
                : `📋 הצג זמינות (${availabilityForms.length})`}
            </button>
          </div>

          {/* ✅ ADD availability panel */}
          {AvailabilityPanel}
        </>
      )}

      {/* Position Tabs */}
      {positions.length > 0 && (
        <div className="mb-4 flex items-center gap-2 overflow-scroll border-b border-gray-300">
          {positions.map((pos) => (
            <div key={pos.name} className="group relative flex items-center">
              <button
                onClick={() => setSelectedPosition(pos.name)}
                className={`px-4 py-2 ${
                  selectedPosition === pos.name
                    ? "border-b-2 border-blue-600 font-bold text-blue-600"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                {pos.name}
              </button>
              {selectedPosition === pos.name && (
                <button
                  onClick={() => handleDeletePosition(pos.name)}
                  className="ml-1 text-xs text-gray-400 hover:text-red-600"
                  title="מחק עמדה"
                >
                  🗑️
                </button>
              )}
            </div>
          ))}

          <button
            onClick={() => setShowAddPosition(!showAddPosition)}
            className="ml-2 rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
          >
            ➕ הוסף עמדה
          </button>
        </div>
      )}

      {positions.length === 0 && (
        <div className="mb-4 border-gray-300 bg-gray-50 p-8 text-center">
          <p>טוען מידע...</p>
        </div>
      )}

      {showAddPosition && (
        <div className="mb-4 rounded border border-gray-300 bg-gray-50 p-4">
          <h3 className="mb-2 font-semibold">הוסף עמדה חדשה</h3>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="שם עמדה"
              value={newPositionName}
              onChange={(e) => setNewPositionName(e.target.value)}
              className="min-w-[150px] flex-1 rounded border border-gray-300 px-3 py-2"
            />
            <button
              onClick={handleAddPosition}
              className="rounded bg-blue-600 px-4 py-2 whitespace-nowrap text-white hover:bg-blue-700"
            >
              הוסף
            </button>
            <button
              onClick={() => {
                setShowAddPosition(false);
                setNewPositionName("");
              }}
              className="rounded bg-gray-300 px-4 py-2 whitespace-nowrap text-gray-700 hover:bg-gray-400"
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {isLoading || isCopying ? (
        <p>{isCopying ? "מעתיק שיבוצים..." : "טוען נתונים..."}</p>
      ) : (
        <div className="w-full">{renderGrid}</div>
      )}
    </div>
  );
}
