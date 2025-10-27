import { NextRequest, NextResponse } from "next/server";
// import { connectToDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import AvailabilityForm from "@/models/AvailabilityForm";

export async function GET(req: NextRequest) {
  try {

    const admin = await getCurrentUser();
    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const week = searchParams.get("week");
    // ✅ REMOVE position filter - we want ALL forms for the week
    // const position = searchParams.get("position");

    if (!week) {
      return NextResponse.json(
        { success: false, error: "Week parameter required" },
        { status: 400 }
      );
    }

    // ✅ Get ALL forms for this week (no position filter)
    const forms = await AvailabilityForm.find({ week }).lean();

    // ✅ Format the forms
    const formattedForms = forms.map((form) => ({
      userId: form.userId.toString(),
      fullName: form.fullName,
      availability: form.availability,
      preferredPositions: form.preferredPositions,
      generalNotes: form.generalNotes,
      otherNotes: form.otherNotes,
    }));

    return NextResponse.json({
      success: true,
      data: {
        week,
        forms: formattedForms,
      },
    });
  } catch (err) {
    console.error("[ERROR] Fetching submitted forms:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}