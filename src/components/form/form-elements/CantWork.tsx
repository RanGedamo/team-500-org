"use client";

import Label from "@/components/form/Label";
import Input from "../input/InputField";

export default function CantWork({
  day,
  value,
  onChange,
}: {
  day: string;
  value: { [shift: string]: { available: boolean; reason: string } };
  onChange: (
    updated: { [shift: string]: { available: boolean; reason: string } }
  ) => void;
}) {
  const shifts = ["בוקר", "צהריים", "לילה"];
  

  const handleCheckboxChange = (shift: string) => {
    const prev = value[shift] || { available: true, reason: "" };
    const updated = {
      ...value,
      [shift]: { ...prev, available: !prev.available },
    };
    onChange(updated);
  };

  const handleReasonChange = (shift: string, reason: string) => {
    const prev = value[shift] || { available: true, reason: "" };
    const updated = {
      ...value,
      [shift]: { ...prev, reason },
    };
    onChange(updated);
  };

  

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h2 className="text-lg font-semibold text-red-600/85 flex items-center gap-2 mb-3 pb-1">
        <span>🚫</span> לא זמין לעבודה
      </h2>

      <div className="grid grid-cols-3 gap-4 text-right">
        {shifts.map((shift) => {
          const data = value[shift] || { available: true, reason: "" };

          return (
            <div key={shift} className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="relative h-5 w-5">
                  <input
                    id={`cantwork-${day}-${shift}`}
                    type="checkbox"
                    className="h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 checked:border-transparent checked:bg-red-600 dark:border-gray-700"
                    checked={!data.available}
                    onChange={() => handleCheckboxChange(shift)}
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
                  htmlFor={`cantwork-${day}-${shift}`}
                  className={`mr-2 font-bold ${
                    !data.available ? "line-through text-red-400" : ""
                  }`}
                >
                  {shift}
                </Label>
              </div>

              <Input
                type="text"
                placeholder="סיבה"
                value={data.reason}
                onChange={(e) => handleReasonChange(shift, e.target.value)}
                className={!data.available ? "block w-full" : "hidden"}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}