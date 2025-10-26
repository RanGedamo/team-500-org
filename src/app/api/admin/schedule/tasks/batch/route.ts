// src/app/api/admin/schedule/tasks/batch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectToDB } from "@/lib/db";
import Task from "@/models/Task";

export async function POST(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    await connectToDB();

    // ✅ גרסה מקוצרת ומהירה פי כמה
    const bulkOps = body.map((t) => ({
      updateOne: {
        filter: { date: t.date, name: t.name, weekDate: t.weekDate, userId: t.userId },
        update: { $set: t },
        upsert: true,
      },
    }));

    const result = await Task.bulkWrite(bulkOps);

    return NextResponse.json({
      success: true,
      count: body.length,
      matched: result.matchedCount,
      modified: result.modifiedCount,
      upserted: result.upsertedCount,
    });
  } catch (err: any) {
    console.error("Error saving tasks batch:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
