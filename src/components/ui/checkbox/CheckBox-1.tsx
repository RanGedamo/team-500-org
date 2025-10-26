'use client';
import React, { useState } from "react";

interface CheckBoxProps {
    id?: string;
    name?: string;
}

export default function CheckBox({ id, name }: CheckBoxProps) {
    const [checked, setChecked] = useState(false);
    const [disabled] = useState(false);
    const onChange = (value: boolean) => {
        setChecked(value);
    };

    return(
        <div className="relative h-5 w-5">
              <input
                id={id? id : "" }
                name={name? name : ""}
                type="checkbox"
                className={`h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 checked:border-transparent checked:bg-indigo-600 disabled:opacity-60 dark:border-gray-700`}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
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
    )
}