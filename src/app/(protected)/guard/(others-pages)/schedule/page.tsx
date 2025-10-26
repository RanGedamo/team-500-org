"use client";
import { useEffect, useState } from "react";

type MyShift = {
  week: string;
  day: string;
  shift: string;
  position: string;
  start: string;
  end: string;
};

const getDateFromWeekAndDay = (weekStart: string, hebrewDay: string): string => {
  const daysMap: Record<string, number> = {
    ראשון: 0,
    שני: 1,
    שלישי: 2,
    רביעי: 3,
    חמישי: 4,
    שישי: 5,
    שבת: 6,
  };

  const startDate = new Date(weekStart);
  const dayOffset = daysMap[hebrewDay];
  startDate.setDate(startDate.getDate() + dayOffset);

  return startDate.toISOString().split("T")[0]; // מחזיר yyyy-mm-dd
};

export default function MyScheduleScreen() {
  const [myShifts, setMyShifts] = useState<MyShift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyShifts = async () => {
      try {
        const res = await fetch("/api/schedule/guard-shifts/my");
        const json = await res.json();
        if (json.success) setMyShifts(json.shifts);
      } catch (err) {
        console.error("❌ שגיאה בטעינת השיבוצים האישיים:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyShifts();
  }, []);

  if (loading) return <div className="p-4">🔄 טוען...</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">👮 המשמרות שלי</h1>
      {myShifts.length === 0 ? (
        <p>לא שובצת למשמרות השבוע.</p>
      ) : (
        <ul className="space-y-2">
{myShifts.map((shift, idx) => {
  const actualDate = getDateFromWeekAndDay(shift.week, shift.day);
  return (
    <li key={idx} className="border p-3 rounded shadow-sm">
      <strong>תאריך:</strong> {actualDate} | <strong>יום:</strong> {shift.day}<br />
      <strong>משמרת:</strong> {shift.shift} ({shift.start} - {shift.end})<br />
      <strong>עמדה:</strong> {shift.position}
    </li>
  );
})}
        </ul>
      )}
    </div>
  );
}