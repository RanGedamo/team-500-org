import React from "react";

import Input from "../input/InputField";

export default function AvailabilityFormHeader({
  user,
  weekStart,
}: {
  user: string;
  weekStart: string;
}) {
  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formattedWeekStart = formatDate(weekStart);

  return (
    <div >
      <div
        className={`rounded-2xl border border-gray-200 bg-white text-center dark:border-gray-800 dark:bg-white/[0.03]`}
      >
        {/* Card Header */}
        
          <h3 className="text-base rounded-t-2xl bg-gray-200/20 p-2 font-medium text-gray-800 dark:text-white/90">
            {`טופס זמינויות לשבוע : ${formattedWeekStart}`}
          </h3>

          <div className="text-right pb-1">
            <label className="mt-3 pr-2 block text-sm font-medium text-gray-700 dark:text-gray-400">שם מלא</label>
            <div className="p-2">
              <Input
                defaultValue={user}
                type="text"
                disabled
                className="pl-[62px]"
              />
            
          </div>
        </div>
      </div>
    </div>
  );
}
