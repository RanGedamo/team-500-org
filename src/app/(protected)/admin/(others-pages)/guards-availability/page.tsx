"use client";

import React, { useEffect, useState } from "react";

type GuardForm = {
  fullName: string; // ✅ Changed from name to fullName
  availability: Record<string, string[]>;
  otherNotes: Record<string, string>;
  preferredPositions: string[];
  generalNotes: string;
};

export default function GuardsAvailabilityPage() {
  const [submissions, setSubmissions] = useState<GuardForm[]>([]);
  const [activeTab, setActiveTab] = useState<"submitted" | "notSubmitted">(
    "submitted",
  );
  const [searchSubmitted, setSearchSubmitted] = useState("");
  const [searchNotSubmitted, setSearchNotSubmitted] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [allGuardNames, setAllGuardNames] = useState<string[]>([]);

  useEffect(() => {
    const fetchAllSubmissions = async () => {
      try {
        const res = await fetch("/api/admin/availability-guards");
        const data = await res.json();
        if (data.success) {
          setSubmissions(data.data);
        }

        // שליפת כל המאבטחים מהשרת
        const guardsRes = await fetch("/api/admin/auth/list-guard-names");
        const guardsData = await guardsRes.json();
        if (guardsData.success) {
          setAllGuardNames(guardsData.names);
        }
      } catch (err) {
        console.error("שגיאה בטעינת טפסים:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllSubmissions();
  }, []);

  const submittedNames = submissions.map((form) => form.fullName.trim()); // ✅ Changed to fullName
  const notSubmitted = allGuardNames.filter(
    (name) => !submittedNames.includes(name),
  );

  const filteredSubmissions = submissions.filter(
    (form) =>
      form.fullName.toLowerCase().includes(searchSubmitted.toLowerCase()), // ✅ Changed to fullName
  );

  const filteredNotSubmitted = notSubmitted.filter((name) =>
    name.toLowerCase().includes(searchNotSubmitted.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6" >
      <h1 className="mb-4 text-center text-2xl font-bold">
        📋 סיכום טפסי זמינות
      </h1>

      {isLoading ? (
        <div className="mt-8 text-center text-lg text-gray-600">
          ⏳ טוען טפסים...
        </div>
      ) : (
        <>
          {/* טאבים למעבר בין תצוגות */}
          <div className="mb-6 flex justify-center gap-4">
            <button
              onClick={() => setActiveTab("submitted")}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                activeTab === "submitted"
                  ? "bg-blue-700 text-white"
                  : "text-black-700 bg-gray-200"
              }`}
            >
              ✅ מאבטחים שהגישו
            </button>

            <button
              onClick={() => setActiveTab("notSubmitted")}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                activeTab === "notSubmitted"
                  ? "bg-red-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              🕓 מאבטחים שעדיין לא הגישו
            </button>
          </div>

          {/* שדה חיפוש לפי טאב */}
          {activeTab === "submitted" && (
            <div className="mb-4 flex justify-center">
              <input
                type="text"
                placeholder="🔎 חפש שם של מאבטח שהגיש..."
                className="w-full max-w-sm rounded border px-4 py-2 text-right shadow"
                value={searchSubmitted}
                onChange={(e) => setSearchSubmitted(e.target.value)}
              />
            </div>
          )}

          {activeTab === "notSubmitted" && (
            <div className="mb-4 flex justify-center">
              <input
                type="text"
                placeholder="🔍 חפש שם של מאבטח שעדיין לא הגיש"
                className="w-full max-w-sm rounded border px-4 py-2 text-right shadow"
                value={searchNotSubmitted}
                onChange={(e) => setSearchNotSubmitted(e.target.value)}
              />
            </div>
          )}

          {/* תוכן טאב: מאבטחים שהגישו */}
          {activeTab === "submitted" && (
            <div className="space-y-6">
              {filteredSubmissions.length === 0 ? (
                <p className="text-gray-600">לא נמצאו תוצאות תואמות.</p>
              ) : (
                filteredSubmissions.map((form, idx) => (
                  <details
                    key={idx}
                    className="rounded border bg-white p-4 shadow"
                  >
                    <summary className="cursor-pointer font-semibold text-blue-700">
                      {form.fullName} {/* ✅ Changed to fullName */}
                    </summary>

                    <div className="mt-4 space-y-4">
                      <div>
                        <h3 className="font-semibold">🗓 זמינות לפי ימים:</h3>
                        {Object.entries(form.availability).map(
                          ([day, shifts]) => (
                            <div key={day} className="mt-1 mb-1 ml-4">
                              <span className="font-medium">{day}:</span>{" "}
                              {shifts.length ? shifts.join(", ") : "לא סומן"}
                              {form.otherNotes[day] && (
                                <div className="text-sm text-gray-600">
                                  הערה: {form.otherNotes[day]}
                                </div>
                              )}
                            </div>
                          ),
                        )}
                      </div>

                      <div>
                        <h3 className="font-semibold">🏷️ עמדות מועדפות:</h3>
                        <p>{form.preferredPositions.join(", ") || "לא סומן"}</p>
                      </div>

                      <div>
                        <h3 className="font-semibold">📝 הערות כלליות:</h3>
                        <p>{form.generalNotes || "אין הערות"}</p>
                      </div>
                    </div>
                  </details>
                ))
              )}
            </div>
          )}

          {/* תוכן טאב: מאבטחים שלא הגישו */}
          {activeTab === "notSubmitted" && (
            <div className="rounded border border-red-200 bg-red-50 p-4 shadow">
              <h2 className="mb-2 text-lg font-semibold text-red-600">
                🕓 מאבטחים שעדיין לא הגישו:
              </h2>
              {filteredNotSubmitted.length === 0 ? (
                <p className="font-medium text-green-600">כולם הגישו! 🔥</p>
              ) : (
                <ul className="grid grid-cols-2 gap-2 text-sm text-gray-800 sm:grid-cols-3 md:grid-cols-4">
                  {filteredNotSubmitted.map((name, idx) => (
                    <li key={idx}>• {name}</li>
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
