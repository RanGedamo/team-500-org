"use client";

import { useState } from "react";

export default function AddGuardPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("guard");
  const [status, setStatus] = useState<null | string>(null);

  const handleSubmit = async () => {
    setStatus(null);

    if (!fullName || !phone || !password) {
      setStatus("❌ שם, טלפון וסיסמה הם שדות חובה");
      return;
    }

    if (password.length < 6) {
      setStatus("❌ הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }

    try {
      const res = await fetch("/api/admin/auth/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          emergencyPhone,
          email,
          role,
          password,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        setStatus("✅ המאבטח נוצר בהצלחה!");
        setFullName("");
        setPhone("");
        setEmergencyPhone("");
        setEmail("");
        setPassword("");
        setRole("guard");
      } else {
        setStatus("❌ שגיאה: " + json.error);
      }
    } catch (err) {
      console.error("Error creating user:", err);
      setStatus("❌ שגיאה בשרת");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-4 space-y-4 border rounded shadow" >
      <h1 className="text-xl font-bold">➕ הוספת מאבטח חדש</h1>

      <input
        type="text"
        placeholder="שם מלא *"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <input
        type="text"
        placeholder="טלפון נייד *"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <input
        type="text"
        placeholder="טלפון חירום (לא חובה)"
        value={emergencyPhone}
        onChange={(e) => setEmergencyPhone(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <input
        type="email"
        placeholder="אימייל (לא חובה)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <input
        type="password"
        placeholder="סיסמה * (לפחות 6 תווים)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="w-full border p-2 rounded"
      >
        <option value="guard">מאבטח</option>
        <option value="admin">אדמין</option>
        <option value="scheduler">משבץ</option>
        <option value="logistics">לוגיסטיקה</option>
      </select>

      <button
        onClick={handleSubmit}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        הוסף מאבטח
      </button>

      {status && <div className="text-sm text-center mt-2">{status}</div>}
    </div>
  );
}