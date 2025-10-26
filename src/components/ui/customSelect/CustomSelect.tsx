"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface Option {
  value: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  userId?: string;
  className?: string;
}

interface OptionGroup {
  label: string;
  options: Option[];
  className?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string, userId?: string) => void;
  options?: Option[];
  optionGroups?: OptionGroup[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  dropdownWidth?: "auto" | "full" | "fit" | string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options = [],
  optionGroups = [],
  placeholder = "Select an option",
  className = "",
  disabled = false,
  dropdownWidth = "full",
  searchable = false,
  searchPlaceholder = "חפש...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ✅ Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  // ✅ FIX: Prevent scrolling when dropdown is open - check hover over dropdown
  useEffect(() => {
    if (!isOpen) return;

    const preventScroll = (e: WheelEvent | TouchEvent) => {
      if (!dropdownRef.current || !scrollRef.current) return;

      const dropdownRect = dropdownRef.current.getBoundingClientRect();
      const mouseX = (e as WheelEvent).clientX ?? 0;
      const mouseY = (e as WheelEvent).clientY ?? 0;

      const isOverDropdown =
        mouseX >= dropdownRect.left &&
        mouseX <= dropdownRect.right &&
        mouseY >= dropdownRect.top &&
        mouseY <= dropdownRect.bottom;

      if (isOverDropdown) {
        const el = scrollRef.current;
        const hasScroll = el.scrollHeight > el.clientHeight;
        if (!hasScroll) return; // לא למנוע גלילה אם אין גלילה פנימית

        // בדוק אם בגלילה פנימית הגיעו לקצה
        const isAtTop = el.scrollTop === 0;
        const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight;

        if (
          (isAtTop && (e as WheelEvent).deltaY < 0) ||
          (isAtBottom && (e as WheelEvent).deltaY > 0)
        ) {
          e.preventDefault();
          e.stopPropagation();
        }
        // אחרת, לא למנוע גלילה פנימית
        return;
      }

      // מחוץ ל-dropdown: תמיד למנוע גלילה
      e.preventDefault();
      e.stopPropagation();
    };

    // Prevent wheel scroll
    document.addEventListener("wheel", preventScroll, {
      passive: false,
      capture: true,
    });
    // Prevent touch scroll
    document.addEventListener("touchmove", preventScroll, {
      passive: false,
      capture: true,
    });

    return () => {
      document.removeEventListener("wheel", preventScroll, { capture: true });
      document.removeEventListener("touchmove", preventScroll, {
        capture: true,
      });
    };
  }, [isOpen]);

  // ✅ Include buttonRef in click outside detection
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen, searchable]);

  const handleSelect = (optionValue: string, userId?: string) => {
    onChange(optionValue, userId);
    setIsOpen(false);
    setSearchTerm("");
  };

  const getSelectedLabel = () => {
    if (!value) return placeholder;

    const flatOption = options.find((opt) => opt.value === value);
    if (flatOption) return flatOption.label;

    for (const group of optionGroups) {
      const groupOption = group.options.find((opt) => opt.value === value);
      if (groupOption) return groupOption.label;
    }

    return value;
  };

  const filterOptions = (opts: Option[]) => {
    if (!searchTerm) return opts;
    return opts.filter((opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  const filterOptionGroups = (groups: OptionGroup[]) => {
    if (!searchTerm) return groups;
    return groups
      .map((group) => ({
        ...group,
        options: group.options.filter((opt) =>
          opt.label.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      }))
      .filter((group) => group.options.length > 0);
  };

  const selectedLabel = getSelectedLabel();
  const hasValue = value && value !== "";

  const getDropdownWidthClass = () => {
    switch (dropdownWidth) {
      case "auto":
        return "w-auto min-w-full";
      case "fit":
        return "w-fit min-w-full whitespace-nowrap";
      case "full":
        return "";
      default:
        return dropdownWidth;
    }
  };

  const filteredOptions = filterOptions(options);
  const filteredGroups = filterOptionGroups(optionGroups);

  // ✅ Render dropdown menu in portal
  const dropdownMenu = isOpen && !disabled && (
    <div
      ref={dropdownRef}
      className={`fixed z-[9999] ${getDropdownWidthClass()} rounded-lg border border-gray-300 bg-white shadow-lg`}
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width:
          dropdownWidth === "full" ? `${dropdownPosition.width}px` : "auto",
        minWidth: `${dropdownPosition.width}px`,
      }}
    >
      {/* ✅ Search Input */}
      {searchable && (
        <div className="sticky top-0 z-[10000] border-b border-gray-200 bg-white p-2">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-md border border-gray-300 px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute top-1/2 left-2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ✅ Options List with Scroll */}
      <div ref={scrollRef} className="max-h-40 overflow-y-auto">
        {/* Render flat options */}
        {filteredOptions.length > 0 &&
          filteredOptions.map((option) => (
            <div
              key={option.value}
              onClick={() =>
                !option.disabled && handleSelect(option.value, option.userId)
              }
              className={`flex items-center gap-2 px-4 py-3 transition-colors ${
                option.disabled
                  ? "cursor-not-allowed bg-gray-50 text-gray-400"
                  : "cursor-pointer hover:bg-blue-50"
              } ${
                value === option.value
                  ? "bg-blue-100 font-semibold text-blue-700"
                  : "text-gray-900"
              } ${option.className || ""}`}
            >
              {option.icon && <span>{option.icon}</span>}
              <span>{option.label}</span>
            </div>
          ))}

        {/* Render grouped options */}
        {filteredGroups.length > 0 &&
          filteredGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {group.options.length > 0 && (
                <>
                  <div
                    className={`sticky top-0 bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-600 ${group.className || ""}`}
                  >
                    {group.label}
                  </div>
                  {group.options.map((option) => (
                    <div
                      key={option.value}
                      onClick={() =>
                        !option.disabled &&
                        handleSelect(option.value, option.userId)
                      }
                      className={`flex items-center gap-2 px-4 py-3 transition-colors ${
                        option.disabled
                          ? "cursor-not-allowed bg-gray-50 text-gray-400"
                          : "cursor-pointer hover:bg-blue-50"
                      } ${
                        value === option.value
                          ? "bg-blue-100 font-semibold text-blue-700"
                          : "text-gray-900"
                      } ${option.className || ""}`}
                    >
                      {option.icon && <span>{option.icon}</span>}
                      <span>{option.label}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          ))}

        {/* ✅ No Results Message */}
        {searchTerm &&
          filteredOptions.length === 0 &&
          filteredGroups.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              לא נמצאו תוצאות עבור &quot;{searchTerm}&quot;
            </div>
          )}
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      {/* Dropdown Button */}
      <div
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex w-full cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm transition-colors ${
          disabled
            ? "cursor-not-allowed bg-gray-100 text-gray-400"
            : "hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        }`}
      >
        <span className={hasValue ? "text-gray-900" : "text-gray-400"}>
          {selectedLabel}
        </span>
        <svg
          className={`h-5 w-5 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {/* ✅ Render dropdown using portal */}
      {typeof document !== "undefined" &&
        createPortal(dropdownMenu, document.body)}
    </div>
  );
};
