// src/app/api/admin/schedule/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Task from "@/models/Task";

export async function GET(req: NextRequest) {
  await connectToDB();
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const weekDate = searchParams.get("weekDate");
  if (!weekDate)
    return NextResponse.json({ success: false, error: "Missing weekDate" }, { status: 400 });

  const tasks = await Task.find({ weekDate }).sort({ date: 1 }).lean();
  return NextResponse.json({ success: true, data: tasks });
}

export async function POST(req: NextRequest) {
  await connectToDB();
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { weekDate, date, name, userId, fullName, start, end } = await req.json();

  if (!weekDate || !date || !name || !start || !end)
    return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });

  // אם טרם שויך מאבטח – נשתמש בערכים ריקים
  const newTask = await Task.create({
    weekDate,
    date,
    name,
    userId: userId || "",
    fullName: fullName || "",
    start,
    end,
  });

  return NextResponse.json({ success: true, data: newTask });
}

export async function DELETE(req: NextRequest) {
  await connectToDB();
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);

  // אופציה 2: מחיקה לפי שדות מרובים (כשאין ID)
  const name = searchParams.get("name");
  const weekDate = searchParams.get("weekDate");
  const date = searchParams.get("date");
  const userId = searchParams.get("userId");
  
  if (!weekDate || !name || !date)
    return NextResponse.json({ success: false, error: "Missing taskId or (weekDate, name, date)" }, { status: 400 });

  // שימוש ב-deleteOne במקום findByIdAndDelete כי מחפשים לפי שדות
  const deleted = await Task.findOneAndDelete({ 
    name, 
    weekDate, 
    date,
    userId
  }).lean();

  if (!deleted)
    return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: deleted });
}
export async function PUT(req: NextRequest) {
  await connectToDB();

  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { name, date, userId, updates } = await req.json();

  if (!name || !date || !userId || !updates) {
    return NextResponse.json(
      { success: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  const updated = await Task.findOneAndUpdate(
    { name, date, userId },
    { $set: updates },
    { new: true } // מחזיר את המסמך המעודכן
  );

  if (!updated) {
    return NextResponse.json(
      { success: false, error: "Task not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: updated });
}
