// src/app/api/guard/swap-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import SwapRequest from "@/models/SwapRequest";
import Assignment from "@/models/Assignment"; // חשוב
import { checkAssignment } from "@/validations/schedule/scheduleValidation"; // הפונקציה שלך
import dayjs from "dayjs";


export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const body = await req.json();
    const { assignment, fromUserId, toUserId, message } = body;

    if (!assignment || !fromUserId || !toUserId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // === שלב 1: שליפת המשמרות של המאבטח שאליו נמסרת המשמרת ===
    const startDate = dayjs(assignment.date).subtract(1, "day").format("YYYY-MM-DD");
    const endDate = dayjs(assignment.date).add(1, "day").format("YYYY-MM-DD");

    const toUserAssignments = await Assignment.find({
      userId: toUserId,
      date: { $gte: startDate, $lte: endDate },
    }).lean();

    console.log("📅 Fetched assignments for validation:", toUserAssignments);

    // === שלב 2: בנייה נכונה של Map ===
    const userAssignmentsByDate = new Map<string, Map<string, any[]>>();
    const userMap = new Map<string, any[]>();

    for (const a of toUserAssignments) {
      const normalizedDate = dayjs(a.date).format("YYYY-MM-DD");
      if (!userMap.has(normalizedDate)) userMap.set(normalizedDate, []);
      userMap.get(normalizedDate)!.push(a);
    }

    userAssignmentsByDate.set(toUserId, userMap);

    // const tasksByDate: Record<string, any[]> = {};

    // === שלב 3: ולידציה אמיתית ===
    const validation = checkAssignment(
      toUserId,
      assignment.date,
      assignment,
      userAssignmentsByDate,
      
    );

    if (!validation.valid) {
      console.warn("❌ Swap request invalid:", validation.reason);
      return NextResponse.json(
        { success: false, error: validation.reason },
        { status: 400 }
      );
    }

    // === שלב 4: יצירת הבקשה ===
    const newSwap = await SwapRequest.create({
      assignmentId: assignment._id || assignment.id,
      fromUserId,
      toUserId,
      message: message || "",
      status: "pending",
    });

    console.log("✅ Created new valid swap request:", newSwap);

    return NextResponse.json({ success: true, data: newSwap }, { status: 201 });
  } catch (err: any) {
    console.error("❌ Error creating swap request:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const toUserId = searchParams.get("toUserId");
    const fromUserId = searchParams.get("fromUserId");

    console.log("📡 Fetching swap requests:", { toUserId, fromUserId });

    const filter: Record<string, any> = {};
    if (toUserId) filter.toUserId = toUserId;
    if (fromUserId) filter.fromUserId = fromUserId;
    if (toUserId && !fromUserId) filter.status = "pending";

    const swaps = await SwapRequest.find(filter)
      .populate("assignmentId", "date position shift start end fullName day")
      .sort({ createdAt: -1 })
      .lean();

    if (!swaps.length) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "לא נמצאו בקשות חילוף תואמות",
      });
    }

    return NextResponse.json({
      success: true,
      count: swaps.length,
      data: swaps,
    });
  } catch (err: any) {
    console.error("❌ Error fetching swap requests:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}