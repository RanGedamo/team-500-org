"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";

export default function AdminGuardsPage() {
  const { user, isLoading } = useUser();
  const [guards, setGuards] = useState([]);
  const [error, setError] = useState("");
  const [expandedGuardId, setExpandedGuardId] = useState<string | null>(null);
  const [editingGuardId, setEditingGuardId] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    role: "guard",
  });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    emergencyPhone: "",
    password: "",
    role: "guard",
  });

  const [searchTerm, setSearchTerm] = useState("");

  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/unauthorized");
    }
  }, [isLoading, user]);

  const fetchGuards = async () => {
    const res = await fetch("/api/admin/auth/list-users");
    const data = await res.json();
    if (data.success) {
      setGuards(data.users);
    } else {
      setError(data.error);
    }
  };

  useEffect(() => {
    const fetchGuards = async () => {
      try {
        const res = await fetch("/api/admin/auth/list-users");
        const data = await res.json();

        if (data.success) {
          setGuards(data.users);
        } else {
          setError(data.error);
        }
      } catch (err) {
        console.log(err);

        setError("שגיאה בטעינת המאבטחים");
      }
    };
    fetchGuards();
  }, []);

  const handleToggleExpand = (id: string) => {
    setExpandedGuardId((prev) => (prev === id ? null : id));
    setEditingGuardId(null);
  };

  const handleEditClick = (guard: any) => {
    setEditingGuardId(guard._id);
    setExpandedGuardId(guard._id);
    setForm({
      fullName: guard.profile?.fullName || "",
      phone: guard.profile?.phone || "",
      email: guard.profile?.email || "",
      role: guard.role || "guard",
    });
  };

  const handleSave = async () => {
    if (!editingGuardId) return;
    const res = await fetch(`/api/admin/auth/${editingGuardId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      alert("המשתמש עודכן בהצלחה");
      setEditingGuardId(null);
      await fetchGuards();
    } else {
      alert("שגיאה: " + data.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק את המשתמש?")) return;
    const res = await fetch(`/api/admin/auth/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.success) {
      alert("נמחק בהצלחה");
      await fetchGuards();
    } else {
      alert("שגיאה: " + data.error);
    }
  };

  const handleCreateUser = async () => {
    const res = await fetch("/api/admin/auth/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });
    const data = await res.json();
    if (data.success) {
      alert("המאבטח נוצר בהצלחה!");
      setCreateForm({
        fullName: "",
        phone: "",
        email: "",
        emergencyPhone: "",
        password: "",
        role: "guard",
      });
      setShowCreateForm(false);
      await fetchGuards();
    } else {
      alert("שגיאה: " + data.error);
    }
  };

  if (isLoading) return <p>טוען...</p>;
  if (error) return <p>שגיאה: {error}</p>;

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">רשימת מאבטחים</h1>

      <input
        type="text"
        placeholder="חפש לפי שם..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 w-full rounded border p-2"
      />

      <button
        onClick={() => setShowCreateForm((prev) => !prev)}
        className="mb-4 rounded bg-green-600 px-4 py-2 text-white"
      >
        {showCreateForm ? "סגור טופס" : "הוסף מאבטח חדש"}
      </button>

      {showCreateForm && (
        <div className="mb-6 rounded border bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-xl font-semibold">טופס יצירת מאבטח</h2>
          <div className="grid gap-3">
            <input
              type="text"
              placeholder="שם מלא"
              className="w-full rounded border p-2"
              value={createForm.fullName}
              onChange={(e) =>
                setCreateForm({ ...createForm, fullName: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="טלפון"
              className="w-full rounded border p-2"
              value={createForm.phone}
              onChange={(e) =>
                setCreateForm({ ...createForm, phone: e.target.value })
              }
            />
            <input
              type="email"
              placeholder="אימייל"
              className="w-full rounded border p-2"
              value={createForm.email}
              onChange={(e) =>
                setCreateForm({ ...createForm, email: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="טלפון חירום"
              className="w-full rounded border p-2"
              value={createForm.emergencyPhone}
              onChange={(e) =>
                setCreateForm({ ...createForm, emergencyPhone: e.target.value })
              }
            />
            <input
              type="password"
              placeholder="סיסמה"
              className="w-full rounded border p-2"
              value={createForm.password}
              onChange={(e) =>
                setCreateForm({ ...createForm, password: e.target.value })
              }
            />
            <select
              className="w-full rounded border p-2"
              value={createForm.role}
              onChange={(e) =>
                setCreateForm({ ...createForm, role: e.target.value })
              }
            >
              <option value="guard">מאבטח</option>
              <option value="admin">אדמין</option>
            </select>
            <button
              onClick={handleCreateUser}
              className="rounded bg-blue-600 px-4 py-2 text-white"
            >
              צור משתמש
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {guards
          .filter((guard: any) =>
            guard?.profile?.fullName
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()),
          )
          .map((guard: any) => {
            const isExpanded = expandedGuardId === guard._id;
            const isEditing = editingGuardId === guard._id;

            return (
              <div
                key={guard._id}
                className="rounded border bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-full cursor-pointer text-lg font-bold"
                    onClick={() => handleToggleExpand(guard._id)}
                  >
                    {guard.profile?.fullName || "ללא שם"}
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => handleEditClick(guard)}
                      className="text-blue-600 hover:underline"
                    >
                      ערוך
                    </button>
                    <button
                      onClick={() => handleDelete(guard._id)}
                      className="text-red-600 hover:underline"
                    >
                      מחק
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-2">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="שם מלא"
                          className="w-full rounded border p-2"
                          value={form.fullName}
                          onChange={(e) =>
                            setForm({ ...form, fullName: e.target.value })
                          }
                        />
                        <input
                          type="text"
                          placeholder="טלפון"
                          className="w-full rounded border p-2"
                          value={form.phone}
                          onChange={(e) =>
                            setForm({ ...form, phone: e.target.value })
                          }
                        />
                        <input
                          type="email"
                          placeholder="אימייל"
                          className="w-full rounded border p-2"
                          value={form.email}
                          onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                          }
                        />
                        <select
                          className="w-full rounded border p-2"
                          value={form.role}
                          onChange={(e) =>
                            setForm({ ...form, role: e.target.value })
                          }
                        >
                          <option value="guard">מאבטח</option>
                          <option value="admin">אדמין</option>
                        </select>
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={handleSave}
                            className="rounded bg-blue-600 px-4 py-2 text-white"
                          >
                            שמור
                          </button>
                          <button
                            onClick={() => setEditingGuardId(null)}
                            className="text-gray-600 underline"
                          >
                            ביטול
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-right text-sm">
                        <p>
                          <strong>טלפון:</strong> {guard.profile?.phone || "-"}
                        </p>
                        <p>
                          <strong>אימייל:</strong> {guard.profile?.email || "-"}
                        </p>
                        <p>
                          <strong>תפקיד:</strong> {guard.role}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
