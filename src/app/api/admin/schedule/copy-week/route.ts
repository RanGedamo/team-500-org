import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Assignment from "@/models/Assignment";
import { getCurrentUser } from "@/lib/auth";
import dayjs from "dayjs";

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
    // Add position parameter support
    const { fromWeek, toWeek, position } = await req.json();

    if (!fromWeek || !toWeek) {
      return NextResponse.json(
        { success: false, error: "Missing fromWeek or toWeek" },
        { status: 400 },
      );
    }

    // Get assignments filtered by position if provided
    const filter: any = { week: fromWeek };
    if (position) {
      filter.position = position;
    }

    const previousAssignments = await Assignment.find(filter).lean();

    if (previousAssignments.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No assignments to copy",
        copied: 0,
      });
    }

    // Calculate the date difference
    const fromDate = dayjs(fromWeek);
    const toDate = dayjs(toWeek);
    const daysDiff = toDate.diff(fromDate, "day");

    // Create new assignments for the new week
    const newAssignments = previousAssignments.map((assignment) => {
      const newDate = dayjs(assignment.date).add(daysDiff, "day");

      return {
        week: toWeek,
        date: newDate.toDate(),
        day: assignment.day,
        shift: assignment.shift,
        position: assignment.position,
        slot: assignment.slot,
        name: assignment.name,
        start: assignment.start,
        end: assignment.end,
      };
    });

    // Bulk insert the new assignments
    const bulkOps = newAssignments.map((a) => ({
      updateOne: {
        filter: {
          date: a.date,
          shift: a.shift,
          position: a.position,
          slot: a.slot,
        },
        update: { $set: a },
        upsert: true,
      },
    }));

    const result = await Assignment.bulkWrite(bulkOps);

    return NextResponse.json({
      success: true,
      copied: newAssignments.length,
      upserted: result.upsertedCount,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error("Copy week error:", error);
    return NextResponse.json(
      { success: false, error: "Server error during copy" },
      { status: 500 },
    );
  }
}
