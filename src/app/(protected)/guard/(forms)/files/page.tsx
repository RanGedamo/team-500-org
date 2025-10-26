"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";

const CLOUDINARY_UPLOAD_PRESET = "ml_default";
const CLOUDINARY_CLOUD_NAME = "dcapisw77";

export default function UploadFilePage() {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setFileUrl(null);
    setFileType(file.type);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);



    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "שגיאה בהעלאה");


  console.log("Cloudinary response:", data);
      // מוסיפים fl_inline כדי ש־PDF יוצג ישירות ב־iframe
 let finalUrl = data.secure_url;
if (fileType?.includes("pdf") && finalUrl.includes("/upload/")) {
  finalUrl = finalUrl.replace("/upload/", "/upload/fl_inline/");
}

      setFileUrl(finalUrl);
    } catch (err: any) {
      setError(err.message || "שגיאה בהעלאת הקובץ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-lg">
        <h1 className="mb-8 text-center text-2xl font-bold text-blue-800">
          העלאת תמונה או PDF
        </h1>

        <label className="mb-6 block">
          <span className="mb-2 block font-medium text-gray-700">
            בחר קובץ:
          </span>
          <input
            type="file"
            accept="image/*,application/pdf"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-700 transition file:mr-4 file:rounded file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
            disabled={loading}
          />
        </label>

        {loading && <div className="mb-4 text-center text-blue-600">מעלה...</div>}
        {error && <div className="mb-4 text-center text-red-600">{error}</div>}

        {fileUrl && (
          <div className="mt-6 flex flex-col items-center">
            <div className="mb-2 font-semibold text-green-700">
              הקובץ הועלה בהצלחה!
            </div>

            {/* === תצוגה שונה לפי סוג === */}
            {fileType?.includes("image") ? (
              <Image
                src={fileUrl}
                alt="Uploaded"
                width={400}
                height={300}
                className="max-w-sm rounded-lg border border-gray-200 shadow"
              />
            ) : (
              <object
                data={fileUrl}
                type="application/pdf"
                className="h-64 w-full rounded-lg border border-gray-300 shadow"
              >
                <p className="text-center text-gray-600">
                  לא ניתן להציג את הקובץ,{" "}
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    לחץ כאן לפתיחה
                  </a>
                </p>
              </object>
            )}

            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 text-xs break-all text-blue-700 underline"
            >
              {fileUrl}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}