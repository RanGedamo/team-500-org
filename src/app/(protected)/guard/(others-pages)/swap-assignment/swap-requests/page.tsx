"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import dayjs from "dayjs";
import { motion, AnimatePresence } from "framer-motion";
import "dayjs/locale/he";

dayjs.locale("he");

type SwapRequest = {
  _id: string;
  fromUserId: string;
  toUserId: string;
  message?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  assignmentId: {
    _id: string;
    position: string;
    shift: string;
    date: string;
    start: string;
    end: string;
    fullName?: string;
    day?: string;
  };
};

const statusLabels: Record<SwapRequest["status"], string> = {
  pending: "ממתין לאישור",
  approved: "אושר",
  rejected: "נדחה",
};

const statusColors: Record<SwapRequest["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function SwapRequestsPage() {
  const { user, isLoading } = useUser();
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<SwapRequest | null>(null);

  // === שליפת בקשות חילוף ===
  useEffect(() => {
    if (isLoading || !user?.profile?.userId) return;

    const loadRequests = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/guard/swap-requests?toUserId=${user.profile.userId}&includeAssignment=true`);
        if (!res.ok) throw new Error("Network error");
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "שגיאה בטעינת בקשות חילוף");
        setRequests(data.data || []);
      } catch (err: any) {
        setError(err.message || "שגיאה בטעינת בקשות חילוף");
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [user, isLoading]);

  // === עדכון סטטוס בקשה ===
  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    console.log(`Updating swap request ${id} to status: ${status}`);
    
    try {
      const res = await fetch(`/api/guard/swap-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "עדכון הסטטוס נכשל");

      // הסרה מרשימת הבקשות הממתינות
      setRequests((prev) => prev.filter((r) => r._id !== id));
      setSelectedRequest(null);

      alert(status === "approved" ? "✅ הבקשה אושרה!" : "❌ הבקשה נדחתה");
    } catch (err: any) {
      alert(err.message || "שגיאה בעדכון הסטטוס");
    }
  };

  // === תצוגה ===
  if (loading) return <p className="p-4 text-center">טוען בקשות...</p>;
  if (error) return <p className="p-4 text-center text-red-600">{error}</p>;
  if (requests.length === 0)
    return <p className="p-4 text-center text-gray-600">אין בקשות חילוף חדשות</p>;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center mb-6">בקשות חילוף</h1>

      {requests.map((req) => {
        // const { assignmentId, status, message, createdAt, fromUserId, toUserId, _id } = req;
        const { assignmentId, status, fromUserId, _id } = req;

        return (
          <div
            key={_id}
            className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition cursor-pointer"
            onClick={() => setSelectedRequest(req)}
          >
            <div className="flex items-center justify-between">
              <span className="text-blue-700 font-semibold">
                מאת: {assignmentId?.fullName || fromUserId}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[status]}`}>
                {statusLabels[status]}
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {dayjs(assignmentId?.date).format("dddd • DD/MM")} • {assignmentId?.shift} • {assignmentId?.position}
            </div>
          </div>
        );
      })}

      {/* === חלון קופץ (Modal) להצגת פרטי בקשה === */}
      <AnimatePresence>
        {selectedRequest && (
          <>
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-40 z-40"
              onClick={() => setSelectedRequest(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
            >
              <div className="bg-white w-[90%] max-w-md rounded-2xl shadow-lg p-6 relative">
                <button
                  className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-xl"
                  onClick={() => setSelectedRequest(null)}
                >
                  ✕
                </button>

                <h2 className="text-xl font-bold mb-4 text-center text-blue-700">פרטי בקשת חילוף</h2>

                <div className="space-y-2 text-gray-800">
                  <p><b>מאת:</b> {selectedRequest.assignmentId?.fullName || selectedRequest.fromUserId}</p>
                  <p><b>תאריך:</b> {dayjs(selectedRequest.assignmentId?.date).format("dddd • DD/MM")}</p>
                  <p><b>עמדה:</b> {selectedRequest.assignmentId?.position}</p>
                  <p><b>משמרת:</b> {selectedRequest.assignmentId?.shift}</p>
                  <p><b>שעות:</b> {selectedRequest.assignmentId?.start} - {selectedRequest.assignmentId?.end}</p>
                  <p><b>סטטוס:</b> <span className={statusColors[selectedRequest.status] + " px-2 py-0.5 rounded"}>{statusLabels[selectedRequest.status]}</span></p>

                  {selectedRequest.message && (
                    <div className="mt-3 bg-gray-50 p-3 rounded-lg text-gray-700 italic border-l-4 border-blue-400">
                      &quot;{selectedRequest.message}&quot;
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    className="flex-1 bg-green-600 text-white rounded py-2 font-bold hover:bg-green-700 transition"
                    onClick={() => updateStatus(selectedRequest._id, "approved")}
                  >
                    ✅ אשר
                  </button>
                  <button
                    className="flex-1 bg-red-600 text-white rounded py-2 font-bold hover:bg-red-700 transition"
                    onClick={() => updateStatus(selectedRequest._id, "rejected")}
                  >
                    ❌ דחה
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}