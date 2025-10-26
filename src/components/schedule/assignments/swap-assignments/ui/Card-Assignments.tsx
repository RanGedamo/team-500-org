

import React from "react";
import dayjs from "dayjs";

type Assignment = {
  _id?: string;
  id?: string;
  position: string;
  shift: string;
  date: string;
  start: string;
  end: string;
  userId: string;
  fullName?: string;
};

type CardAssignmentsProps = {
  assignments: Assignment[];
  loading: boolean;
  selectedAssignment?: Assignment | null;
  onSelectAssignment: (assignment: Assignment) => void;
};

const CardAssignments: React.FC<CardAssignmentsProps> = ({
  assignments,
  loading,
  // selectedAssignment,
  onSelectAssignment,
}) => {
  return (
    <section className="mb-8">
      <h2 className="mb-2 text-lg font-semibold">המשמרות שלי לשבוע הנוכחי</h2>

      {loading ? (
        <div className="rounded border bg-gray-50 p-3 text-gray-600">
          טוען משמרות...
        </div>
      ) : assignments.length === 0 ? (
        <div className="rounded border bg-gray-50 p-3 text-gray-600">
          אין משמרות עתידיות
        </div>
      ) : (
        <ul className="grid gap-3">
          {assignments.map((a) => {

            return (
              <li
                key={a._id || a.id}
                className={`cursor-pointer rounded-lg border p-3 transition `}
                onClick={() => onSelectAssignment(a)}
              >
                <div className="flex justify-between">
                  <div className="text-md font-bold text-gray-800">
                    {a.position} • {a?.shift}
                  </div>
                  <div className="text-gray-600">
                    {" "}
                    {dayjs(a.date).format("dddd • DD/MM")}
                  </div>
                </div>
                <div className="font-bold text-blue-600">
                  {a.start} - {a.end}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default CardAssignments;
