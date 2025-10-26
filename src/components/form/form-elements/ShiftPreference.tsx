"use client";

export function ShiftPreference({
  day,
  disabledShifts = {},
  preferences = {},
  onPreferenceChange,
}: {
  day: string;
  disabledShifts?: { [shift: string]: { available: boolean; reason: string } };
  preferences: { [shift: string]: number | null };
  onPreferenceChange: (day: string, shift: string, value: number) => void;
}) {
  const shifts = {
    בוקר: [1, 2, 3],
    צהריים: [1, 2, 3],
    לילה: [1, 2, 3],
  };


  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 className="text-lg font-semibold text-green-600 flex items-center gap-2 mb-2">
        <span>✅</span>העדפה למשמרות
      </h2>

      <div className="grid grid-cols-3 gap-4 text-right">
        {Object.entries(shifts).map(([shiftName, values]) => {
          const isUnavailable = disabledShifts?.[shiftName]?.available === false;

          if (isUnavailable) return null;

          return (
            <div key={shiftName} className="space-y-2">
              <p className="text-center font-bold text-gray-800 dark:text-white">
                {shiftName}
              </p>
              <div className="flex justify-center gap-1">
                {values.map((value) => (
                  <label
                    key={value}
                    htmlFor={`${day}-${shiftName}-${value}`}
                    className="flex flex-col items-center gap-1 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <input
                      id={`${day}-${shiftName}-${value}`}
                      type="radio"
                      value={value}
                      name={`${day}-${shiftName}`}
                      checked={preferences?.[shiftName] === value}
                      onChange={() => onPreferenceChange(day, shiftName, value)}
                      className="h-4 w-4 accent-green-600"
                    />
                    {value}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}