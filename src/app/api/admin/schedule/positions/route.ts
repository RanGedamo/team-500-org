import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Position from "@/models/Position";
import Assignment from "@/models/Assignment";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await connectToDB();
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const weekDate = searchParams.get("weekDate");
    if (!weekDate) {
      return NextResponse.json({ success: false, error: "weekDate is required" }, { status: 400 });
    }

    const positions = await Position.find({ weekDate }).sort({ order: 1 }).lean();
    return NextResponse.json({ success: true, data: positions });
  } catch (error) {
    console.error("GET positions error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await connectToDB();
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, weekDate } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Missing position name" }, { status: 400 });
    }
    if (!weekDate) {
      return NextResponse.json({ success: false, error: "Missing weekDate" }, { status: 400 });
    }

    const existing = await Position.findOne({ name: name.trim(), weekDate });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Position already exists for this week" },
        { status: 409 }
      );
    }

    const maxOrder = await Position.findOne({ weekDate }).sort({ order: -1 }).select("order");
    const newOrder = maxOrder ? maxOrder.order + 1 : 1;

    const newPosition = await Position.create({
      name: name.trim(),
      order: newOrder,
      weekDate,
    });

    return NextResponse.json({ success: true, data: newPosition });
  } catch (error) {
    console.error("POST position error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  await connectToDB();
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { oldName, newName, weekDate } = await req.json();
    if (!oldName || !newName) {
      return NextResponse.json({ success: false, error: "Missing old or new name" }, { status: 400 });
    }
    if (!weekDate) {
      return NextResponse.json({ success: false, error: "Missing weekDate" }, { status: 400 });
    }

    const updated = await Position.findOneAndUpdate(
      { name: oldName, weekDate },
      { $set: { name: newName } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Position not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT position error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  await connectToDB();
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    const weekDate = searchParams.get("weekDate");

    if (!name) {
      return NextResponse.json({ success: false, error: "Missing position name" }, { status: 400 });
    }
    if (!weekDate) {
      return NextResponse.json({ success: false, error: "Missing weekDate" }, { status: 400 });
    }

    // בדוק אם יש שיבוצים לעמדה הזו בשבוע הזה
    const hasAssignments = await Assignment.findOne({ position: name, week: weekDate });
    if (hasAssignments) {
      return NextResponse.json(
        { success: false, error: "Cannot delete position with existing assignments" },
        { status: 409 }
      );
    }

    const deleted = await Position.findOneAndDelete({ name, weekDate });
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Position not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error("DELETE position error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
