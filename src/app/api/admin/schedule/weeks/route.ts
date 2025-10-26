import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Assignment from "@/models/Assignment";
// import { getCurrentUser } from "@/lib/auth";
import dayjs from "dayjs";

export async function GET() {
  await connectToDB();

  // const admin = await getCurrentUser();
  // if (!admin || admin.role !== "admin") {
  //   return NextResponse.json(
  //     { success: false, error: "Unauthorized" },
  //     { status: 401 },
  //   );
  // }

  try {
    // Get all unique weeks from DB (weeks with existing assignments)
    const existingWeeks = await Assignment.distinct("week");

    // ✅ Calculate current and next Sunday
    const today = dayjs();
    const dayOfWeek = today.day(); // 0 = Sunday, 1 = Monday, etc.

    // Current week Sunday
    const currentSunday =
      dayOfWeek === 0 ? today : today.subtract(dayOfWeek, "day");

    // Next week Sunday (always in future)
    const nextSunday =
      dayOfWeek === 0 ? today.add(7, "day") : today.add(7 - dayOfWeek, "day");

    // ✅ Create comprehensive weeks list - רק שבועות נוכחי/עתיד + קיימים
    const allRelevantWeeks = new Set([
      ...existingWeeks, // ✅ שבועות עם שיבוצים (כולל עבר)
      currentSunday.format("YYYY-MM-DD"), // ✅ שבוע נוכחי (גם אם ריק)
      nextSunday.format("YYYY-MM-DD"), // ✅ שבוע הבא (גם אם ריק)
      // ❌ הסרנו: previousSunday - לא מוסיפים שבוע קודם ריק
    ]);

    // Sort all weeks in descending order (newest first)
    const sortedWeeks = Array.from(allRelevantWeeks)
      .map((w) => dayjs(w))
      .sort((a, b) => b.valueOf() - a.valueOf())
      .map((d) => d.format("YYYY-MM-DD"));

    const nextWeek = nextSunday.format("YYYY-MM-DD");

    return NextResponse.json({
      success: true,
      data: {
        existingWeeks: sortedWeeks,
        nextWeek,
      },
    });
  } catch (error) {
    console.error("GET weeks error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
