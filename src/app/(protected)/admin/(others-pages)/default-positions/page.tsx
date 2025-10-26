"use client";

import React, { useEffect, useState, useCallback } from "react";

type DefaultPosition = {
  _id?: string;
  name: string;
  order: number;
};

export default function DefaultPositionsPage() {
  const [positions, setPositions] = useState<DefaultPosition[]>([]);
  const [newName, setNewName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadPositions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/schedule/positions/default");
      const data = await res.json();
      if (data.success) setPositions(data.data);
    } catch (err) {
      console.error("Error loading default positions:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  const handleAdd = async () => {
    if (!newName.trim()) {
      alert("נא למלא שם לעמדה");
      return;
    }

    const res = await fetch("/api/admin/schedule/positions/default", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });

    const data = await res.json();
    if (data.success) {
      alert("✅ נוספה עמדה חדשה לברירת המחדל");
      setNewName("");
      loadPositions();
    } else {
      alert(`❌ שגיאה: ${data.error}`);
    }
  };

  const handleDelete = async (name: string) => {
    const confirmDelete = window.confirm("האם אתה בטוח שברצונך למחוק עמדה זו?");
    if (!confirmDelete) return;

    const res = await fetch(`/api/admin/schedule/positions/default?name=${encodeURIComponent(name)}`, {
      method: "DELETE",
    });

    const data = await res.json();
    if (data.success) {
      alert("✅ עמדה נמחקה בהצלחה");
      loadPositions();
    } else {
      alert(`❌ שגיאה: ${data.error}`);
    }
  };

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold text-center">
        ⚙️ ניהול עמדות ברירת מחדל
      </h1>

      <div className="mb-4 flex flex-wrap gap-2 items-center justify-center">
        <input
          type="text"
          placeholder="שם עמדה (למשל: שער ראשי)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <button
          onClick={handleAdd}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          ➕ הוסף עמדה
        </button>
      </div>

      {isLoading ? (
        <p>טוען עמדות...</p>
      ) : (
        <table className="w-full border text-center">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">#</th>
              <th className="border p-2">שם עמדה</th>
              <th className="border p-2">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos, i) => (
              <tr key={pos._id || pos.name}>
                <td className="border p-2">{i + 1}</td>
                <td className="border p-2">{pos.name}</td>
                <td className="border p-2">
                  <button
                    onClick={() => handleDelete(pos.name)}
                    className="text-red-500 hover:text-red-700"
                  >
                    🗑️ מחק
                  </button>
                </td>
              </tr>
            ))}
            {positions.length === 0 && (
              <tr>
                <td colSpan={3} className="border p-4 text-gray-500">
                  אין עמדות ברירת מחדל עדיין
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
