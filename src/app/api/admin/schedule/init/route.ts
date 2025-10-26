// src/app/api/admin/schedule/init/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import AvailabilityForm from "@/models/AvailabilityForm";
import User from "@/models/User";
import Schedule from "@/models/Assignment";
import Position from "@/models/Position";
import DefaultPosition from "@/models/DefaultPosition"; // ✅ חדש

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

    if (!week) {
      return NextResponse.json(
        { success: false, error: "Week required" },
        { status: 400 },
      );
    }

    // ✅ שלוף עמדות לפי שבוע
    let positions = await Position.find({ weekDate: week }).lean();

    // ✅ אם אין עמדות לשבוע הזה → צור עמדות דיפולטיביות לפי מה שהאדמין הגדיר
    if (positions.length === 0) {
      const defaultPositions = await DefaultPosition.find().lean();
      if (defaultPositions.length > 0) {
        const newPositions = defaultPositions.map((pos) => ({
          
          name: pos.name,
          order: pos.order,
          weekDate: week,
        }));

        await Position.insertMany(newPositions);
        positions = await Position.find({ weekDate: week }).lean();

        console.log(
          `✅ נוצרו ${positions.length} עמדות חדשות לשבוע ${week} לפי ברירת המחדל.`,
        );
      } else {
        console.warn("⚠️ אין עמדות דיפולטיביות מוגדרות במסד הנתונים.");
      }
    }

    // ✅ שלוף זמינות, משתמשים ושיבוצים
    const [availabilityForms, allGuards, assignments, availableWeeks] =
      await Promise.all([
        AvailabilityForm.find({ week }).lean(),
        User.find({ role: { $in: ["guard", "admin"] } })
          .select("_id profile")
          .populate("profile", "fullName")
          .lean(),
        position ? Schedule.find({ week, position }).lean() : Promise.resolve([]),
        position
          ? Schedule.distinct("week", { position })
          : Promise.resolve([]),
      ]);

    // ✅ סינון מאבטחים שלא הגישו
    const submittedUserIds = new Set(
      availabilityForms.map((f) => f.userId.toString()),
    );
    const missingGuards = (allGuards as Array<{
      _id: any;
      profile?: { fullName?: string };
    }>)
      .filter((g) => !submittedUserIds.has(g._id.toString()))
      .map((g) => ({
        userId: g._id.toString(),
        fullName: g.profile?.fullName,
      }));

    return NextResponse.json({
      success: true,
      data: {
        positions,
        availabilityForms: availabilityForms.map((form) => ({
          userId: form.userId.toString(),
          fullName: form.fullName,
          availability: form.availability,
          preferredPositions: form.preferredPositions,
          generalNotes: form.generalNotes,
          otherNotes: form.otherNotes,
        })),
        missingGuards,
        assignments,
        availableWeeks,
      },
    });
  } catch (err) {
    console.error("[ERROR] Init schedule:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
