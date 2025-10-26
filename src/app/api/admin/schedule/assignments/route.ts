// /api/admin/schedule/assignments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Assignment from "@/models/Assignment";
import { getCurrentUser } from "@/lib/auth";
import dayjs from "dayjs";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const admin = await getCurrentUser();
    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const week = searchParams.get("week");
    const position = searchParams.get("position");

    const query: any = {};
    
    // ✅ If week is provided, get assignments for that week AND the day before
    if (week) {
      const weekStart = dayjs(week);
      const dayBefore = weekStart.subtract(1, 'day').format('YYYY-MM-DD');
      const weekEnd = weekStart.add(6, 'day').format('YYYY-MM-DD');
      
      // Query for date range: day before until end of week
      query.date = {
        $gte: dayBefore,
        $lte: weekEnd
      };
      
      // Also keep week in query for potential other filters
      query.week = {
        $in: [
          week,
          dayjs(dayBefore).startOf('week').format('YYYY-MM-DD') // Week of previous day
        ]
      };
    }
    
    if (position) query.position = position;
// console.log("Assignment query:", query.date.$gte);

    const assignments = await Assignment.find(query).lean();

    return NextResponse.json({
      success: true,
      dayBefore: query.date?.$gte,
      data: assignments.map((a: any) => ({
        ...a,
        userId: a.userId,
        fullName: a.fullName,
        _id: a._id.toString(),
      })),
    });
  } catch (err) {
    console.error("GET Error:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  await connectToDB();

  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = await req.json();
    const { date, position, userId } = body; // ✅ userId הוא המזהה העיקרי

    // ✅ וולידציה חזקה - userId חובה!
    if (!userId || !date || !position) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: userId, date, position",
        },
        { status: 400 },
      );
    }

    console.log("Attempting to delete assignment:", {
      date,
      userId, // ✅ מוחקים לפי userId
      position,
    });

    // ✅ מחיקה לפי userId - המזהה החזק והייחודי
    const deleted = await Assignment.findOneAndDelete({
      date,
      userId, // ✅ המזהה העיקרי
      position,
    });

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Assignment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json(
      { success: false, error: "Server error during deletion" },
      { status: 500 },
    );
  }
}
