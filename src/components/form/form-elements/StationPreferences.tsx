"use client";
import React, { useEffect, useState } from "react";
import TextArea from "../input/TextArea";
import Label from "../Label";

export type StationPreferencesOutput = {
  positions: { [key: string]: boolean };
  notes: string;
};

interface Props {
  value: StationPreferencesOutput;
  onChange: (value: StationPreferencesOutput) => void;
}

export default function StationPreferences({ onChange, value }: Props) {
  const [message, setMessage] = useState("");
  const [positions, setPositions] = useState<{ [key: string]: boolean }>({
    "700": false,
    "600": false,
    "90": false,
  });

  // 🔁 עדכון הערכים אם value השתנה (כשהנתונים נטענים מהשרת)
  useEffect(() => {
    setMessage(value.notes || "");
    setPositions({
      "700": value.positions?.["700"] ?? false,
      "600": value.positions?.["600"] ?? false,
      "90": value.positions?.["90"] ?? false,
    });
  }, [value]);

  const handleNoteChange = (val: string) => {
    setMessage(val);
    onChange({ positions, notes: val });
  };

  const togglePosition = (key: string) => {
    const updated = { ...positions, [key]: !positions[key] };
    setPositions(updated);
    onChange({ positions: updated, notes: message });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div  className="space-y-6">
        <h3 className="text-base font-medium text-gray-800 dark:text-white/90"></h3>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-blue-600">
          <span>🧍‍♂️</span>העדפה לעמדות
        </h2>

        <div className="grid grid-cols-3 gap-4">
          {Object.keys(positions).map((position) => (
            <div
              key={position}
              className="flex items-center justify-center gap-2"
            >
              <div className="relative h-5 w-5">
                <input
                  id={`position-${position}`}
                  type="checkbox"
                  className="h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 checked:border-transparent checked:bg-blue-500 dark:border-gray-700"
                  checked={positions[position]}
                  onChange={() => togglePosition(position)}
                />
                <svg
                  className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform"
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <path
                    d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                    stroke="white"
                    strokeWidth="1.94437"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <Label
                htmlFor={`position-${position}`}
                className="mr-2 font-bold"
              >
                {position}
              </Label>
            </div>
          ))}
        </div>

        <div>
          <Label className="text-right">הערות כלליות</Label>
          <TextArea
            value={message}
            placeholder="הזן את ההערות שלך כאן..."
            onChange={handleNoteChange}
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}
