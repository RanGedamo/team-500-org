import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import AvailabilityForm from "@/models/AvailabilityForm";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

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

// export async function GET(req: NextRequest) {
//   try {
//     await connectToDB();

//     const admin = await getCurrentUser();
//     if (!admin || admin.role !== "admin") {
//       return NextResponse.json(
//         { success: false, error: "Unauthorized" },
//         { status: 401 },
//       );
//     }

//     const { searchParams } = new URL(req.url);
//     const week = searchParams.get("week");
//     const position = searchParams.get("position");

//     if (!week) {
//       return NextResponse.json(
//         { success: false, error: "Week parameter required" },
//         { status: 400 },
//       );
//     }

//     const query: any = { week };

//     // Get all forms for this week
//     const forms = await AvailabilityForm.find(query)
//       .sort({ submittedAt: -1 })
//       .lean();

//     console.log("📋 Forms found:", forms.length);

//     // Filter by position preference if specified
//     let filteredForms = forms;
//     if (position) {
//       filteredForms = forms.filter(
//         (form: any) =>
//           form.preferredPositions?.includes(position) ||
//           form.preferredPositions?.includes("לא משנה לי"),
//       );
//     }

//     // ✅ Just map the data - fullName is already there!
//     const processedForms = filteredForms.map((form: any) => ({
//       userId: form.userId?.toString() || "",
//       fullName: form.fullName || "Unknown", // ✅ Use the stored fullName
//       availability: form.availability || {},
//       otherNotes: form.otherNotes || {},
//       preferredPositions: form.preferredPositions || [],
//       generalNotes: form.generalNotes || "",
//       submittedAt: form.submittedAt,
//     }));

//     return NextResponse.json({
//       success: true,
//       data: {
//         week,
//         position,
//         forms: processedForms,
//         totalSubmissions: forms.length,
//         filteredCount: processedForms.length,
//       },
//     });
//   } catch (err) {
//     console.error("[ERROR] Admin fetching availability forms:", err);
//     return NextResponse.json(
//       { success: false, error: "Server error" },
//       { status: 500 },
//     );
//   }
// }
