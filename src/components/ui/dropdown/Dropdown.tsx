"use client";
import type React from "react";
import { useEffect, useRef, useCallback } from "react";

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  position?: "left" | "right" | "center"; // ✅ Add positioning option
}

export const Dropdown: React.FC<DropdownProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
  position = "right", // ✅ Default to right
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ Use useCallback to memoize the handler
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(".dropdown-toggle")
      ) {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return; // ✅ Only add listener when open

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  // ✅ Add keyboard support (Escape key)
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // ✅ Dynamic positioning classes
  const positionClasses = {
    left: "left-0",
    right: "right-0",
    center: "left-1/2 -translate-x-1/2",
  };

  return (
    <div
      ref={dropdownRef}
      className={`absolute z-40 ${positionClasses[position]} shadow-theme-lg dark:bg-gray-dark mt-2 rounded-xl border border-gray-200 bg-white dark:border-gray-800 ${className}`}
    >
      {children}
    </div>
  );
};
