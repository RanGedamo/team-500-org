// src/app/%28protected%29/profile/%28guard%29/competence-report/page.tsx
"use client";

import React, { useRef, useState } from "react";

type Competence = {
  name: string;
  validUntil: string;
  status: "בתוקף" | "פג תוקף" | "חסר";
  pdfUrl?: string;
};

const initialCompetences: Competence[] = [
  { name: "רישיון נשק", validUntil: "2025-06-30", status: "בתוקף" },
  { name: "קורס מאבטחים", validUntil: "2024-12-15", status: "בתוקף" },
  { name: "אישור רפואי", validUntil: "2023-11-01", status: "פג תוקף" },
  { name: "הדרכת כיבוי אש", validUntil: "", status: "חסר" },
];

const CLOUDINARY_UPLOAD_PRESET = "ml_default";
const CLOUDINARY_CLOUD_NAME = "dcapisw77";

export default function CompetenceReportPage() {
  const [competences, setCompetences] = useState<Competence[]>(initialCompetences);
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);
  const [errorIdx, setErrorIdx] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePdfUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number,
  ) => {
    setErrorIdx(null);
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("pdf")) {
      setErrorIdx(idx);
      setErrorMsg("יש לבחור קובץ PDF בלבד");
      return;
    }

    setLoadingIdx(idx);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
        {
          method: "POST",
          body: formData,
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "שגיאה בהעלאה");

      const finalUrl = data.secure_url;

      setCompetences((prev) =>
        prev.map((c, i) => (i === idx ? { ...c, pdfUrl: finalUrl } : c)),
      );
    } catch (err: any) {
      setErrorIdx(idx);
      setErrorMsg(err.message || "שגיאה בהעלאת הקובץ");
    } finally {
      setLoadingIdx(null);
      if (fileInputRefs.current[idx]) fileInputRefs.current[idx]!.value = "";
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-2 sm:px-4">
      <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-2 sm:p-8 shadow-lg">
        <h1 className="mb-6 sm:mb-8 text-center text-xl sm:text-2xl font-bold text-blue-800">
          דוח כשירות מאבטח
        </h1>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-blue-50">
                <th className="border-b px-2 py-2 sm:py-3 text-right font-semibold text-gray-700 whitespace-nowrap">
                  סוג כשירות
                </th>
                <th className="border-b px-2 py-2 sm:py-3 text-right font-semibold text-gray-700 whitespace-nowrap">
                  תוקף
                </th>
                <th className="border-b px-2 py-2 sm:py-3 text-right font-semibold text-gray-700 whitespace-nowrap">
                  סטטוס
                </th>
                <th className="border-b px-2 py-2 sm:py-3 text-right font-semibold text-gray-700 whitespace-nowrap">
                  קובץ PDF
                </th>
              </tr>
            </thead>
            <tbody>
              {competences.map((c, idx) => (
                <tr key={c.name} className="even:bg-gray-50">
                  <td className="px-2 py-2 text-right whitespace-nowrap">{c.name}</td>
                  <td className="px-2 py-2 text-right whitespace-nowrap">
                    {c.validUntil ? (
                      <span>
                        {new Date(c.validUntil).toLocaleDateString("he-IL")}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right whitespace-nowrap">
                    {c.status === "בתוקף" && (
                      <span className="rounded bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
                        בתוקף
                      </span>
                    )}
                    {c.status === "פג תוקף" && (
                      <span className="rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
                        פג תוקף
                      </span>
                    )}
                    {c.status === "חסר" && (
                      <span className="rounded bg-yellow-100 px-2 py-1 text-xs font-bold text-yellow-700">
                        חסר
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right whitespace-nowrap">
                    <div className="flex flex-col items-end gap-2 min-w-[120px]">
                      {c.pdfUrl ? (
                        <a
                          href={c.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-700 underline"
                        >
                          צפייה
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">לא הועלה</span>
                      )}
                      <input
                        type="file"
                        accept="application/pdf"
                        ref={(el) => { fileInputRefs.current[idx] = el; }}
                        onChange={(e) => handlePdfUpload(e, idx)}
                        className="block w-full text-xs text-gray-700 transition file:mr-2 file:rounded file:border-0 file:bg-blue-50 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                        disabled={loadingIdx === idx}
                      />
                      {loadingIdx === idx && (
                        <span className="text-xs text-blue-600">מעלה...</span>
                      )}
                      {errorIdx === idx && errorMsg && (
                        <span className="text-xs text-red-600">{errorMsg}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-8 text-center text-xs sm:text-sm text-gray-500">
          לעדכון כשירויות יש לפנות למנהל המשמרת או למשרד.
        </div>
      </div>
    </div>
  );
}
