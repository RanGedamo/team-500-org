import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile";
import bcrypt from "bcryptjs";
import { verifyJWT } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    // אימות עוגייהֿ
      const cookiesSession = await cookies();

    const sessionToken = cookiesSession.get("session_token")?.value;
    if (!sessionToken) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const payload = verifyJWT(sessionToken);
    console.log("Create User Payload:", payload);
    
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // שליפת שדות מה־body
    const { fullName, phone, emergencyPhone, email, password, role = "guard" } = await req.json();

    if (!fullName || !phone || !password) {
      return NextResponse.json({ success: false, error: "יש למלא שם, טלפון וסיסמה" }, { status: 400 });
    }

    await connectToDB();

    // בדיקה אם username (הטלפון) כבר קיים
    const existing = await User.findOne({ username: phone });
    if (existing) return NextResponse.json({ success: false, error: "המשתמש כבר קיים" }, { status: 409 });

    // הצפנת סיסמה
    const hashedPassword = await bcrypt.hash(password, 10);

    // יצירת המשתמש
    const user = await User.create({
      username: phone,
      password: hashedPassword,
      role,
      createdBy: payload.id,
    });

    // יצירת הפרופיל
    const profile = await UserProfile.create({
      fullName,
      phone,
      email: email || "",
      address: emergencyPhone || "", // שמירת טלפון חירום כ־address אם אין שדה יעודי
      userId: user._id,
    });

    // קישור פרופיל למשתמש
    user.profile = profile._id;
    await user.save();

    return NextResponse.json({ success: true, userId: user._id });
  } catch (err) {
    console.error("❌ שגיאה בהוספת מאבטח:", err);
    return NextResponse.json({ success: false, error: "שגיאה בשרת" }, { status: 500 });
  }
}