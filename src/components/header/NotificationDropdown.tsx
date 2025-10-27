"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useUser } from "@/context/UserContext";

export default function NotificationDropdown() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [position, setPosition] = useState<"left" | "right" | "center">("right"); // ✅ חדש

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleDropdown = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsOpen((prev) => !prev);
    setNotifying(false);
  };

  const closeDropdown = () => setIsOpen(false);

  // ✅ החלטה חכמה לאיזה כיוון לפתוח
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;

    if (rect.left < 150) setPosition("left");
    else if (windowWidth - rect.right < 150) setPosition("right");
    else setPosition("center");
  }, [isOpen]);

  // ✅ סגירה מחוץ לתפריט
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // ✅ שליפת התראות
  useEffect(() => {
    if (!user?.profile?.userId) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`/api/guard/swap-requests?toUserId=${user.profile.userId}`);
        const data = await res.json();

        if (data.success && data.data.length > 0) {
          setNotifications(data.data);
          setNotifying(true);
        } else {
          setNotifications([]);
          setNotifying(false);
        }
      } catch (err) {
        console.error("❌ Error fetching notifications:", err);
      }
    };

    fetchNotifications();
  }, [user?.profile?.userId]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        ref={buttonRef}
        className="dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
      >
        {notifying && (
          <span className="absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400">
            <span className="w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        position={position} // ✅ נפתח לפי המסך
        className="mt-[17px] h-72 w-80 flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px]"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">התראות</h5>
        </div>

        {notifications.length === 0 ? (
          <div className="text-gray-500 text-center py-4">אין התראות חדשות</div>
        ) : (
          <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
            {notifications.map((n, i) => (
              <li key={i} className="p-2 border-b border-gray-100 hover:bg-gray-50">
                <span className="font-medium text-gray-800">
                  בקשת חילוף מ־{n.fromUserId}
                </span>
                <div className="text-sm text-gray-500">
                  {n.assignmentId?.position} • {n.assignmentId?.shift} • {n.assignmentId?.date}
                </div>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/guard/swap-assignment/swap-requests"
          className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          כל הבקשות
        </Link>
      </Dropdown>
    </div>
  );
}