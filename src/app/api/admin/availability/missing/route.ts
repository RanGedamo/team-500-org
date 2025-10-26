// src/app/api/admin/availability/missing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import AvailabilityForm from "@/models/AvailabilityForm";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const admin = await getCurrentUser();
    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const week = searchParams.get("week");

    console.log(week);
    
    if (!week) {
      return NextResponse.json(
        { success: false, error: "Week parameter is required" },
        { status: 400 }
      );
    }

    // שלב 1: הבא את כל המשתמשים שרלוונטיים
    const allGuards = await User.find(
  { role: { $in: ["guard", "user","admin"] } }
).populate("profile", "fullName").lean();

    // שלב 2: הבא את כל מי שכן הגיש טופס זמינות לשבוע הזה
    const submittedForms = await AvailabilityForm.find({ week }, { userId: 1 }).lean();
    const submittedIds = submittedForms.map((form) => form.userId?.toString());

    // שלב 3: החזר את כל מי **שלא** נמצא ברשימת המגישים
    const missing = allGuards.filter(
      (user) => !submittedIds.includes(user._id)
    );

    // שלב 4: מיפוי נתונים
    const formatted = missing.map((user) => ({
      userId: user._id,
      fullName: user.profile?.fullName || user.email,
      email: user.email,
    }));

    return NextResponse.json({
      success: true,
      data: {
        week,
        totalMissing: formatted.length,
        users: formatted,
      },
    });
  } catch (err) {
    console.error("[ERROR] Admin fetching missing availability:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}