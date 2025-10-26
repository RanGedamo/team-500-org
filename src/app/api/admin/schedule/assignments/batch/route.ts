// src/app/api/admin/schedule/assignments/batch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Assignment from "@/models/Assignment";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await connectToDB();

  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const assignments = await req.json();

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid payload" },
        { status: 400 },
      );
    }

    // ✅ Bulk upsert - single DB operation
    const bulkOps = assignments.map((a) => ({
      updateOne: {
        filter: {
          week: a.week,
          date: a.date,
          shift: a.shift,
          position: a.position,
          slot: a.slot,
        },
        update: {
          $set: {
            day: a.day,
            fullName: a.fullName, // ✅ Changed from name to fullName
            userId: a.userId,
            start: a.start,
            shift: a.shift,
            end: a.end,
          },
        },
        upsert: true,
      },
    }));

    const result = await Assignment.bulkWrite(bulkOps);

    return NextResponse.json({
      success: true,
      upserted: result.upsertedCount,
      modified: result.modifiedCount,
      total: assignments.length,
    });
  } catch (error) {
    console.error("Batch upsert error:", error);
    return NextResponse.json(
      { success: false, error: "Server error during batch update" },
      { status: 500 },
    );
  }
}
