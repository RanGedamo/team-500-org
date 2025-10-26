"use client";

import { useEffect, useState } from "react";

// סוג נתון לכל שיבוץ
interface AdminShift {
  week: string;
  day: string;
  shift: string;
  start: string;
  end: string;
  position: string;
  guardName: string;
}

export default function AdminAllShifts() {
  const [allShifts, setAllShifts] = useState<AdminShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("");

  useEffect(() => {
    const fetchAllShifts = async () => {
      try {
        const res = await fetch("/api/schedule/guard-shifts/all");
        const json = await res.json();
        if (json.success) setAllShifts(json.shifts);
      } catch (err) {
        console.error("❌ שגיאה בטעינת כל השיבוצים:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllShifts();
  }, []);

  const filtered = allShifts.filter((shift) => {
    const matchName = shift.guardName.includes(search);
    const matchPosition = positionFilter ? shift.position === positionFilter : true;
    return matchName && matchPosition;
  });

  const uniquePositions = Array.from(new Set(allShifts.map((s) => s.position)));

  return (
    <div className="p-4 space-y-4" >
      <h1 className="text-xl font-bold">📋 כל שיבוצי המאבטחים</h1>

      <div className="flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="🔍 חפש לפי שם"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-48"
        />

        <select
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value)}
          className="border p-2 rounded w-48"
        >
          <option value="">כל העמדות</option>
          {uniquePositions.map((pos) => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>🔄 טוען...</p>
      ) : filtered.length === 0 ? (
        <p>אין תוצאות תואמות.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((shift, idx) => (
            <li key={idx} className="border p-3 rounded shadow-sm">
              <strong>תאריך:</strong> {shift.week} | <strong>יום:</strong> {shift.day}<br />
              <strong>מאבטח:</strong> {shift.guardName}<br />
              <strong>משמרת:</strong> {shift.shift} ({shift.start} - {shift.end})<br />
              <strong>עמדה:</strong> {shift.position}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}