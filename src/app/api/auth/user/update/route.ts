import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDB } from "@/lib/db";
import { verifyJWT } from "@/lib/jwt";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile";

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyJWT(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 403 });
    }

    await connectToDB();

    const userId = payload.id;

    const { fullName, phone, email } = await req.json();

    if (!fullName || !phone) {
      return NextResponse.json({ success: false, error: "חובה למלא שם וטלפון" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "משתמש לא נמצא" }, { status: 404 });
    }

    const profile = await UserProfile.findById(user.profile);
    if (!profile) {
      return NextResponse.json({ success: false, error: "פרופיל לא נמצא" }, { status: 404 });
    }

    // עדכון פרופיל
    profile.fullName = fullName;
    profile.phone = phone;
    profile.email = email || "";

    await profile.save();

    console.log("פרופיל עודכן:", profile);
    
    return NextResponse.json({ success: true, message: "עודכן בהצלחה" });
  } catch (err) {
    console.error("שגיאה בעדכון פרופיל:", err);
    return NextResponse.json({ success: false, error: "שגיאה בשרת" }, { status: 500 });
  }
}