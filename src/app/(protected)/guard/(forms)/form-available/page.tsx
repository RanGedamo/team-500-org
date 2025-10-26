"use client";

import { useUser } from "@/context/UserContext";
import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { toast } from "react-toastify";

const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const defaultPositions = ["600", "700", "90"];

type Availability = Record<string, string[]>;

// ✅ Helper function to get next Sunday
function getNextSunday(): string {
  const today = dayjs();
  const dayOfWeek = today.day();
  const nextSunday = dayOfWeek === 0 ? today : today.add(7 - dayOfWeek, "day");
  return nextSunday.format("YYYY-MM-DD");
}

export default function FormAvailable() {
  const [availability, setAvailability] = useState<Availability>({});
  const [otherNotes, setOtherNotes] = useState<Record<string, string>>({});
  const [preferredPositions, setPreferredPositions] = useState<string[]>([]);
  const [generalNotes, setGeneralNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentWeek, setCurrentWeek] = useState("");

  const { user, isLoading } = useUser();

  // ✅ Calculate next Sunday on mount
  useEffect(() => {
    setCurrentWeek(getNextSunday());
  }, []);

  const toggleOption = (day: string, option: string) => {
    setAvailability((prev) => {
      const current = prev[day] || [];

      if (option === "יכול הכל") {
        const isChecked = current.includes("יכול הכל");
        return {
          ...prev,
          [day]: isChecked ? [] : ["יכול הכל", "בוקר", "צהריים", "לילה", "בוקר ארוך", "לילה ארוך"],
        };
      }

      if (option === "לא יכול") {
        const isChecked = current.includes("לא יכול");
        return {
          ...prev,
          [day]: isChecked ? [] : ["לא יכול"],
        };
      }

      const updated = current.includes(option)
        ? current.filter((item) => item !== option)
        : [
            ...current.filter((i) => i !== "יכול הכל" && i !== "לא יכול"),
            option,
          ];

      return {
        ...prev,
        [day]: updated,
      };
    });
  };

  const togglePreferredPosition = (position: string) => {
    setPreferredPositions((prev) => {
      if (position === "לא משנה לי") {
        return prev.includes("לא משנה לי") ? [] : ["לא משנה לי"];
      } else {
        const filtered = prev.filter((p) => p !== "לא משנה לי");
        return prev.includes(position)
          ? filtered.filter((p) => p !== position)
          : [...filtered, position];
      }
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const finalPreferred = preferredPositions.includes("לא משנה לי")
      ? defaultPositions
      : preferredPositions;

    const missingDays = days.filter(
      (day) => !availability[day] || availability[day].length === 0,
    );

    const missingPositions = finalPreferred.length === 0;

    if (missingDays.length > 0 || missingPositions) {
      let errorMessage = "לא ניתן לשלוח את הטופס:\n";

      if (missingDays.length > 0) {
        errorMessage += `• לא סומנה זמינות בימים: ${missingDays.join(", ")}\n`;
      }

      if (missingPositions) {
        errorMessage += `• יש לבחור לפחות עמדה מועדפת אחת או לסמן "לא משנה לי"`;
      }

      alert(errorMessage);
      return;
    }

    const cleanedAvailability: Availability = {};
    for (const day of Object.keys(availability)) {
      const shifts = availability[day].filter((shift) => shift !== "יכול הכל");
      cleanedAvailability[day] = shifts;
    }

    const payload = {
      userId: user._id,
      fullName: user.profile.fullName,
      availability: cleanedAvailability,
      otherNotes,
      preferredPositions: finalPreferred,
      generalNotes,
    };

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/guard/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // alert("✅ הטופס נשמר לשרת בהצלחה!");
            toast.success(" הטופס נשמר לשרת בהצלחה!");
          } else {
        toast.error(`⚠️ שגיאה: ${data.error || "Unknown error"}`);
        
        // alert(`⚠️ שגיאה: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
              toast.error("❌ שגיאה בשליחה לשרת");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };




  useEffect(() => {
    const fetchExistingForm = async () => {
      try {
        const res = await fetch("/api/guard/availability");
        if (!res.ok) return;

        const data = await res.json();
        if (data.success && data.data) {
          const form = data.data;
          setAvailability(form.availability || {});
          setOtherNotes(form.otherNotes || {});
          setPreferredPositions(form.preferredPositions || []);
          setGeneralNotes(form.generalNotes || "");
        }
      } catch (err) {
        console.error("שגיאה בטעינת טופס מהשרת:", err);
      }
    };

    if (!isLoading && user && currentWeek) {
      fetchExistingForm();
    }
  }, [isLoading, user, currentWeek]);

  if (isLoading) {
    return <div className="p-6 text-center text-lg">טוען פרטי משתמש...</div>;
  }

  if (!user) {
    return <div className="p-6 text-center text-lg">אין משתמש מחובר</div>;
  }

  // ✅ Calculate week date range
  const weekStart = dayjs(currentWeek);
  const weekEnd = weekStart.add(6, "day");


    const handleClick = () => {
    toast.success("הפעולה הצליחה!");
  };

  return (
    <div className="mx-auto w-full max-w-2xl xsm:max-w-md  space-y-8 px-4 py-6 sm:px-6" >
      <div>
        <h1 className="text-center text-2xl font-bold">טופס זמינות מאבטח</h1>
        <div className="mt-2 text-center text-sm text-gray-600">
          <p>
            שבוע: {weekStart.format("DD/MM/YYYY")} -{" "}
            {weekEnd.format("DD/MM/YYYY")}
          </p>
        </div>
      </div>

      <div className="w-full">
        <label className="mb-1 block font-medium">שם מלא:</label>
        <input
          type="text"
          value={user.profile.fullName}
          readOnly
          className="w-full rounded border bg-gray-100 p-2 text-gray-700"
        />
      </div>

      {/* זמינות לפי ימים */}
      <div className="space-y-5 ">
        {days.map((day) => (
          <div key={day} className="flex justify-center">
            <div className="container  p-4">
              <div className=" flex justify-center">
              <h3 className="mb-2 text-center font-semibold">{day}</h3>
              </div>
              <div className="grid  grid-cols-1 gap-4">
                {/*  יכול הכל / לא יכול בכלל */}
                <div className="flex w-full justify-between">
                  {["יכול הכל", "לא יכול"].map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-1 text-[15px] w-[100px] break-words"
                    >
                      <input
                        type="checkbox"
                        checked={availability[day]?.includes(option) || false}
                        onChange={() => toggleOption(day, option)}
                      />
                      {option}
                    </label>
                  ))}
                </div>

                <div className="flex w-full justify-between">
                  <label className="flex items-center w-[100px] gap-1 text-[15px]  break-words">
                    <input
                      type="checkbox"
                      checked={availability[day]?.includes("בוקר") || false}
                      onChange={() => toggleOption(day, "בוקר")}
                    />
                    בוקר
                  </label>
                  <label className="flex items-center w-[100px] gap-1 text-[15px] break-words">
                    <input
                      type="checkbox"
                      checked={availability[day]?.includes("בוקר ארוך") || false}
                      onChange={() => toggleOption(day, "בוקר ארוך")}
                    />
                    בוקר ארוך
                  </label>


                </div>
                <div className="flex max-w-xsm justify-between">
                  
                  <label className="flex items-center w-[100px] gap-1 text-[15px] break-words">
                    <input
                      type="checkbox"
                      checked={availability[day]?.includes("צהריים") || false}
                      onChange={() => toggleOption(day, "צהריים")}
                      className=""
                    />
                    צהריים
                  </label>
</div>
                <div className="flex w-full justify-between">
                  <label className="flex w-[100px] items-center gap-1 text-[15px] break-words">
                    <input
                      type="checkbox"
                      checked={availability[day]?.includes("לילה") || false}
                      onChange={() => toggleOption(day, "לילה")}
                      className=""
                    />
                    לילה
                  </label>
                  <label className="flex w-[100px] items-center gap-1 text-[15px] break-words">
                    <input
                      type="checkbox"
                      checked={availability[day]?.includes("לילה ארוך") || false}
                      onChange={() => toggleOption(day, "לילה ארוך")}
                      className=""
                    />
                    לילה ארוך
                  </label>
                </div>
                <div className="mt-2">
                  <label className="text-sm font-medium">
                    הערה ליום {day}:
                  </label>
                  <textarea
                    className="mt-1 w-full rounded border p-1 text-sm"
                    rows={2}
                    placeholder="אפשר להוסיף הערה ספציפית ליום..."
                    value={otherNotes[day] || ""}
                    onChange={(e) =>
                      setOtherNotes((prev) => ({
                        ...prev,
                        [day]: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* עמדות מועדפות */}
      <div className="mt-4 space-y-3">
        <label className="font-medium">עמדות מועדפות:</label>
        <div className="container flex w-full justify-center p-4">
          <div className="mb-6 flex w-full max-w-md flex-wrap justify-center gap-5">
            {defaultPositions.map((pos) => (
              <label
                key={pos}
                className="flex items-center gap-1 text-sm sm:w-auto"
              >
                <input
                  type="checkbox"
                  checked={preferredPositions.includes(pos)}
                  onChange={() => togglePreferredPosition(pos)}
                />
                {pos}
              </label>
            ))}
            <label className="flex items-center gap-1 text-sm sm:w-auto">
              <input
                type="checkbox"
                checked={preferredPositions.includes("לא משנה לי")}
                onChange={() => togglePreferredPosition("לא משנה לי")}
              />
              לא משנה לי
            </label>
          </div>
        </div>
      </div>

      {/* הערות כלליות */}
      <div className="mb-3 w-full">
        <label className="mb-1 block font-medium">הערות כלליות:</label>
        <textarea
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          placeholder="כתוב כאן כל דבר נוסף שברצונך לציין"
          className="h-28 w-full rounded border p-2"
        />
      </div>

      {/* כפתור שליחה */}
      

            <button onClick={handleClick} className="btn">
        הצג Toast
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="me-2 mb-2 w-full rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-400 dark:bg-blue-600 dark:hover:bg-blue-700"
      >
        {isSubmitting ? "שולח..." : "שלח זמינות"}
      </button>
    </div>
  );
}
