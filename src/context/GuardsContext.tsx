"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// טיפוסים (אתה יכול לעדכן לפי מבנה אמיתי)
type Guard = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

type GuardsContextType = {
  guards: Guard[];
  names: string[];
  isLoading: boolean;
};

// 1️⃣ יצירת קונטקסט עם ערך ברירת מחדל
const GuardsContext = createContext<GuardsContextType>({
  guards: [],
  names: [],
  isLoading: true,
});

// 2️⃣ Provider שמביא את כל המידע פעם אחת
export const GuardsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [guards, setGuards] = useState<Guard[]>([]);
  const [names, setNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGuards = async () => {
      try {
        const [listRes, namesRes] = await Promise.all([
          fetch("/api/admin/auth/list-users"),
          fetch("/api/admin/auth/list-guard-names"),
        ]);

        const listData = await listRes.json();
        const namesData = await namesRes.json();

        console.log("listData", listData);
        
        if (listData.success) setGuards(listData.users);
        if (namesData.success) setNames(namesData.names);
      } catch (err) {
        console.error("❌ שגיאה בהבאת מאבטחים:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuards();
  }, []);

  return (
    <GuardsContext.Provider value={{ guards, names, isLoading }}>
      {children}
    </GuardsContext.Provider>
  );
};

// 3️⃣ הוק לשימוש נוח בקומפוננטות
export const useGuards = () => useContext(GuardsContext);