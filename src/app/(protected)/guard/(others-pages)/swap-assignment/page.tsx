"use client";

import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/he";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { useUser } from "@/context/UserContext";
import CardAssignments from "@/components/schedule/assignments/swap-assignments/ui/Card-Assignments";
import {CardSwapRequest} from "@/components/schedule/assignments/swap-assignments/ui/Card-Swap-Request";

dayjs.extend(isSameOrAfter);
dayjs.locale("he");

// ==== Types ====
type Assignment = {
  _id?: string;
  id?: string;
  userId: string;
  fullName?: string;
  position: string;
  shift: string;
  date: string;
  start: string;
  end: string;
};

type Guard = {
  userId: string;
  fullName: string;
};

type SwapPayload = {
  fromUserId: string;
  toUserId: string;
  message?: string;
  assignment: Assignment;
};

export default function SwapAssignmentPage() {
  const { user, isLoading } = useUser();

  const [myAssignments, setMyAssignments] = useState<Assignment[]>([]);
  const [guards, setGuards] = useState<Guard[]>([]);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [swapRequest, setSwapRequest] = useState({
    targetUser: "",
    message: "",
  });
  const [loading, setLoading] = useState<{
    assignments: boolean;
    guards: boolean;
    submit: boolean;
    error: string;
  }>({
    assignments: false,
    guards: false,
    submit: false,
    error: "",
  });
  const [error, setError] = useState({
        isError: false,
         message: "",
  });
  
const [submitStatus, setSubmitStatus] = useState<{
  success: boolean | null;
  message: string;
}>({
  success: null,
  message: "",
});

  const currentWeekStart = useMemo(
    () => dayjs().startOf("week").format("YYYY-MM-DD"),
    [],
  );

  // === שליפת המשמרות שלי ===
  useEffect(() => {
    if (isLoading || !user?.profile?.userId) return;

    const loadAssignments = async () => {
      setLoading((p) => ({ ...p, assignments: true }));
      try {
        const res = await fetch(
          `/api/admin/schedule/assignments/${user.profile.userId}/assignments?week=${currentWeekStart}`,
        );
        if (!res.ok) throw new Error("Network error loading assignments");
        const data = await res.json();
        if (!data?.success)
          throw new Error(data?.error || "שגיאה בטעינת המשמרות");

        const future = (data.data as Assignment[])
          .filter((a) => dayjs(a.date).isSameOrAfter(dayjs(), "day"))
          .sort(
            (a, b) =>
              a.date.localeCompare(b.date) || a.start.localeCompare(b.start),
          );
          setMyAssignments(future);
          setError({isError: false, message: ""});
      } catch (err: any) {
        setError({isError: true, message: err.message || "שגיאה בטעינת המשמרות"});
        
      } finally {
        setLoading((p) => ({ ...p, assignments: false }));
      }
    };

    loadAssignments();
  }, [user?.profile?.userId, isLoading, currentWeekStart]);

  // === שליפת רשימת מאבטחים ===
  useEffect(() => {
    if (isLoading || !user?.profile?.userId) return;

    const loadGuards = async () => {
      setLoading((p) => ({ ...p, guards: true }));
      try {
        const res = await fetch(`/api/admin/guards`);
        if (!res.ok) throw new Error("שגיאה בטעינת מאבטחים");
        const data = await res.json();

        const uniqueGuards = new Map<string, Guard>();
        (data.data || []).forEach((a: Assignment) => {
          if (a.userId !== user.profile.userId && !uniqueGuards.has(a.userId)) {
            uniqueGuards.set(a.userId, {
              userId: a.userId,
              fullName: a.fullName || "",
            });
          }
        });

        
        setGuards(
          [...uniqueGuards.values()].sort((a, b) =>
            a.fullName.localeCompare(b.fullName, "he"),
          ),
        );
                  setError({isError: false, message: ""});

      } catch (err: any) {
        setError({isError: true, message: err.message || "שגיאה בטעינת מאבטחים"});
      } finally {
        setLoading((p) => ({ ...p, guards: false }));
      }
    };

    loadGuards();
  }, [user, isLoading]);

  // === שליחת בקשה ===
const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedAssignment) return alert("נא לבחור משמרת שתרצה להחליף");
  if (!swapRequest.targetUser) return alert("נא לבחור מאבטח להחלפה");

  setLoading((p) => ({ ...p, submit: true }));
  setSubmitStatus({ success: null, message: "" });

  try {
    const payload: SwapPayload = {
      fromUserId: user!.profile!.userId,
      toUserId: swapRequest.targetUser,
      message: swapRequest.message.trim(),
      assignment: { ...selectedAssignment, fullName: user.profile.fullName },
    };

    const res = await fetch("/api/guard/swap-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setSubmitStatus({
        success: false,
        message: data.error || "שליחת בקשה נכשלה",
      });
      return;
    }

    // ✅ הצלחה
    setSubmitStatus({
      success: true,
      message: "בקשת החילוף נשלחה בהצלחה!",
    });

    // אפס את הנתונים אחרי 2 שניות
    setTimeout(() => {
      setSwapRequest({ targetUser: "", message: "" });
      setSelectedAssignment(null);
      setIsOpen(false);
      setSubmitStatus({ success: null, message: "" });
    }, 2000);
  } catch (err: any) {
    setSubmitStatus({
      success: false,
      message: err.message || "שגיאה בשליחת הבקשה",
    });
  } finally {
    setLoading((p) => ({ ...p, submit: false }));
  }
};



  // === תצוגה ===
  return (
    <div className="mx-auto w-full min-h-screen  min-w-full max-w-custom py-8 px-4">
      <h1 className="mb-6 text-center text-2xl font-bold text-blue-800">
        📅 חילופי משמרות
      </h1>

      {error.isError && (
        <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error.message}</div>
      )}




      <CardAssignments
        assignments={myAssignments}
        loading={loading.assignments}
        selectedAssignment={selectedAssignment}
        onSelectAssignment={(assignment: Assignment) => {
          setSelectedAssignment(assignment);
          setIsOpen(true);
        }}
      />


      {/* === חלון פתיחה / סגירה של בקשה === */}
      <CardSwapRequest
        onSubmit={onSubmit}
        selectedAssignment={selectedAssignment}
        guards={guards}
        swapRequest={swapRequest}
        setSwapRequest={setSwapRequest}
        loading={loading}
        setIsOpen={setIsOpen}
        isOpen={isOpen}
        submitStatus={submitStatus}
      />
    </div>
  );
}
