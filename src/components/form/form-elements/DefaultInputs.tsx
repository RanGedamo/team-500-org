"use client";
import React from "react";
import CantWork from "./CantWork";
import { ShiftPreference } from "./ShiftPreference";
import { getHebrewDayName } from "@/utils/shiftUtils";

export default function DefaultInputs({
  cantWorkByDay,
  setCantWorkByDay,
  preferencesByDay,
  setPreferencesByDay,
}: {
  cantWorkByDay: {
    [date: string]: {
      [shift: string]: { available: boolean; reason: string };
    };
  };
  setCantWorkByDay: React.Dispatch<
    React.SetStateAction<{
      [date: string]: {
        [shift: string]: { available: boolean; reason: string };
      };
    }>
  >;
  preferencesByDay: { [date: string]: { [shift: string]: number | null } };
  setPreferencesByDay: React.Dispatch<
    React.SetStateAction<{
      [date: string]: { [shift: string]: number | null };
    }>
  >;
}) {
  const handleCantWorkChange = (
    date: string,
    updatedCantWork: {
      [shift: string]: { available: boolean; reason: string };
    }
  ) => {
    setCantWorkByDay((prev) => ({
      ...prev,
      [date]: updatedCantWork,
    }));

    setPreferencesByDay((prev) => {
      const currentPrefs = prev[date] || {};
      const updatedPrefs = Object.fromEntries(
        Object.entries(currentPrefs).filter(
          ([shift]) => updatedCantWork[shift]?.available !== false
        )
      );
      return {
        ...prev,
        [date]: updatedPrefs,
      };
    });
  };

  const handlePreferenceChange = (
    date: string,
    shift: string,
    value: number
  ) => {
    setPreferencesByDay((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        [shift]: value,
      },
    }));
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="w-full p-2">
        <div className="space-y-10 text-right">
          {Object.keys(cantWorkByDay).map((date) => {
            const day = getHebrewDayName(date);

            return (
              <div
                key={date}
                className="space-y-3 rounded-2xl border border-gray-300 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <h1 className="border-b border-gray-200 pb-2 text-center text-xl font-bold dark:text-blue-300">
                  {day}
                </h1>

                <div className="grid grid-cols-1 gap-3">
                  <CantWork
                    day={day}
                    value={cantWorkByDay[date] || {}}
                    onChange={(updated) => handleCantWorkChange(date, updated)}
                  />

                  <ShiftPreference
                    day={day}
                    disabledShifts={cantWorkByDay[date]}
                    preferences={preferencesByDay[date] || {}}
                    onPreferenceChange={(d, s, v) =>
                      handlePreferenceChange(date, s, v)
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
