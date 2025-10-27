"use client";

import React, { useEffect, useState } from "react";
import dayjs from "dayjs";

function getTargetWeek(): string {
  const today = dayjs();
  const dayOfWeek = today.day();
  const weeksToAdd = dayOfWeek <= 3 ? 1 : 2;
  const targetSunday = today.startOf("week").add(weeksToAdd, "week").day(0);
  return targetSunday.format("YYYY-MM-DD");
}

type GuardForm = {
  fullName: string;
  availability: Record<string, string[]>;
  otherNotes: Record<string, string>;
  preferredPositions: string[];
  generalNotes: string;
};

type MissingGuard = {
  userId: string;
  fullName: string;
  email: string;
};

export default function GuardsAvailabilityPage() {
  const [submitted, setSubmitted] = useState<GuardForm[]>([]);
  const [missing, setMissing] = useState<MissingGuard[]>([]);
  const [activeTab, setActiveTab] = useState<"submitted" | "notSubmitted">("submitted");

  // 🧭 Filters
  const [searchName, setSearchName] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [filterDay, setFilterDay] = useState("");
  const [filterShiftType, setFilterShiftType] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const targetWeek = getTargetWeek();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [submittedRes, missingRes] = await Promise.all([
          fetch(`/api/admin/availability/submitted?week=${targetWeek}`),
          fetch(`/api/admin/availability/missing?week=${targetWeek}`),
        ]);

        const submittedData = await submittedRes.json();
        const missingData = await missingRes.json();

        if (submittedData.success) setSubmitted(submittedData.data.forms || []);
        if (missingData.success) setMissing(missingData.data.users || []);
      } catch (err) {
        console.error("❌ שגיאה בטעינת טפסים:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [targetWeek]);

  // 🎯 סינון מתקדם

const filteredSubmitted = submitted.filter((form) => {
  const nameMatch = form.fullName.toLowerCase().includes(searchName.toLowerCase());
  const positionMatch = !filterPosition || form.preferredPositions.includes(filterPosition);

  // 👇 שינוי פה
  let shiftMatch = true;

  if (filterDay && filterShiftType) {
    // אם נבחר גם יום וגם משמרת → נבדוק ספציפית ביום הזה
    const shifts = form.availability[filterDay] || [];
    shiftMatch = shifts.includes(filterShiftType);
  } else if (filterShiftType) {
    // אם נבחר רק סוג משמרת
    shiftMatch = Object.values(form.availability).some((s) => s.includes(filterShiftType));
  } else if (filterDay) {
    // אם נבחר רק יום
    shiftMatch = !!form.availability[filterDay];
  }

  return nameMatch && positionMatch && shiftMatch;
});

  const filteredMissing = missing.filter((g) =>
    g.fullName.toLowerCase().includes(searchName.toLowerCase())
  );

  return (
    <div dir="rtl" className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8 border-b border-gray-200 pb-4">
        <p className="text-sm text-gray-400">ניהול / טפסי זמינות</p>
        <h1 className="text-2xl font-bold text-blue-900">סיכום טפסי זמינות</h1>
        <p className="text-gray-500 text-sm mt-1">
          שבוע שמתחיל ב־{dayjs(targetWeek).format("DD/MM/YYYY")}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab("submitted")}
          className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-150 
            ${
              activeTab === "submitted"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
          ✅ מאבטחים שהגישו
        </button>
        <button
          onClick={() => setActiveTab("notSubmitted")}
          className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-150 
            ${
              activeTab === "notSubmitted"
                ? "bg-red-500 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
          🕓 מאבטחים שלא הגישו
        </button>
      </div>

      {/* סרגל פילטור */}
      {activeTab === "submitted" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-8 shadow-sm">
          <h3 className="font-semibold text-blue-800 mb-3">🔍 סינון טפסים</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="חפש לפי שם..."
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-right text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-400 outline-none"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />

            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-400 outline-none"
            >
              <option value="">כל העמדות</option>
              <option value="600">עמדה 600</option>
              <option value="700">עמדה 700</option>
              <option value="90">עמדה 90</option>
            </select>

            <select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-400 outline-none"
            >
              <option value="">כל הימים</option>
              <option value="ראשון">ראשון</option>
              <option value="שני">שני</option>
              <option value="שלישי">שלישי</option>
              <option value="רביעי">רביעי</option>
              <option value="חמישי">חמישי</option>
              <option value="שישי">שישי</option>
              <option value="שבת">שבת</option>
            </select>

            <select
              value={filterShiftType}
              onChange={(e) => setFilterShiftType(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-400 outline-none"
            >
              <option value="">כל סוגי המשמרות</option>
              <option value="בוקר קצר">בוקר קצר</option>
              <option value="בוקר ארוך">בוקר ארוך</option>
              <option value="צהריים">צהריים</option>
              <option value="לילה קצר">לילה קצר</option>
              <option value="לילה ארוך">לילה ארוך</option>
            </select>
          </div>
        </div>
      )}

      {/* טעינה */}
      {isLoading ? (
        <div className="text-center text-gray-600 text-lg mt-8">⏳ טוען נתונים...</div>
      ) : (
        <>
          {/* מגישים */}
          {activeTab === "submitted" && (
            <div className="grid gap-5">
              {filteredSubmitted.length === 0 ? (
                <p className="text-gray-500 text-center">לא נמצאו תוצאות תואמות.</p>
              ) : (
                filteredSubmitted.map((form, i) => (
                  <div
                    key={i}
                    className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="font-semibold text-blue-800 text-lg">{form.fullName}</h2>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 text-gray-700 text-sm">
                      <div>
                        <h3 className="font-semibold text-blue-700 mb-1">🗓 זמינות לפי ימים</h3>
                        {Object.entries(form.availability).map(([day, shifts]) => (
                          <div key={day} className="border-b border-gray-100 py-1">
                            <span className="font-medium">{day}:</span>{" "}
                            {shifts.length ? shifts.join(", ") : "לא סומן"}
                            {form.otherNotes[day] && (
                              <div className="text-gray-500 text-xs">
                                הערה: {form.otherNotes[day]}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div>
                        <h3 className="font-semibold text-blue-700 mb-1">🏷️ עמדות מועדפות</h3>
                        <p>{form.preferredPositions.join(", ") || "לא סומן"}</p>

                        <h3 className="font-semibold text-blue-700 mt-4 mb-1">📝 הערות כלליות</h3>
                        <p>{form.generalNotes || "אין הערות"}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* לא מגישים */}
          {activeTab === "notSubmitted" && (
            <div className="bg-white border border-red-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-red-600 mb-4">
                מאבטחים שלא הגישו
              </h2>
              {filteredMissing.length === 0 ? (
                <p className="text-green-600 font-medium text-center">
                  כולם הגישו! 🔥
                </p>
              ) : (
                <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-sm text-gray-800">
                  {filteredMissing.map((g, i) => (
                    <li
                      key={i}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-2 text-center hover:bg-gray-100 transition"
                    >
                      {g.fullName}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}