// src/app/api/admin/schedule/assignments/[userId]/assignments/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Assignment from "@/models/Assignment";
import dayjs from "dayjs";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const week = searchParams.get("week");
    const position = searchParams.get("position");

    // שליפת userId מהנתיב
const { userId } = await context.params;
    const query: any = { userId };

    if (week) {
      const weekStart = dayjs(week);
      const dayBefore = weekStart.subtract(1, "day").format("YYYY-MM-DD");
      const weekEnd = weekStart.add(6, "day").format("YYYY-MM-DD");

      query.date = { $gte: dayBefore, $lte: weekEnd };
      query.week = {
        $in: [week, dayjs(dayBefore).startOf("week").format("YYYY-MM-DD")],
      };
    }

    if (position) query.position = position;

    const assignments = await Assignment.find(query).lean();
    console.log("Assignment query:", query);

    return NextResponse.json({
      success: true,
      userId,
      week,
      count: assignments.length,
      data: assignments.map((a: any) => ({
        ...a,
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
