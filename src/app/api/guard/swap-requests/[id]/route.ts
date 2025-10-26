// src/app/api/guard/swap-requests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import SwapRequest from "@/models/SwapRequest";
import Assignment from "@/models/Assignment";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const { id } = await context.params;
    const { status } = await req.json();

    // === ולידציה על הסטטוס ===
    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    // === עדכון בקשת החילוף + הבאת פרטי המשמרת והמאבטח החדש ===
const updated = await SwapRequest.findByIdAndUpdate(
  id,
  { status },
  { new: true }
)
  .populate("assignmentId", "date position shift start end fullName day")
  .populate({
    path: "toUserId", // קודם נטען את המשתמש (User)
    populate: {
      path: "profile", // ואז נטען את הפרופיל שבתוכו
      select: "fullName email phone status userId", // אילו שדות להביא
    },
  });


      console.log("📦 Swap request updated:", updated);
      
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Swap request not found" },
        { status: 404 }
      );
    }

    console.log(
      "📦 Swap request updated:",
      updated._id,
      "| Status:",
      status,
      "| ToUser:",
      updated.toUserId,
      "| Assignment:",
      updated.assignmentId
    );

    // === רק אם החילוף אושר — נעדכן את המשמרת בפועל ===
    if (status === "approved") {
      const updatedAssignment = await Assignment.findByIdAndUpdate(
        updated.assignmentId._id,
        {
          userId: updated.toUserId._id,
          fullName: updated.toUserId.profile.fullName,
        },
        { new: true }
      );

      if (!updatedAssignment) {
        return NextResponse.json(
          { success: false, error: "Assignment not found for update" },
          { status: 404 }
        );
      }

      console.log("✅ Assignment successfully updated:", updatedAssignment);
      return NextResponse.json({
        success: true,
        message: "Swap approved and assignment updated successfully",
        data: updatedAssignment,
      });
    }

    // === אם הבקשה נדחתה — רק נחזיר עדכון סטטוס ===
    console.log(`🚫 Swap request ${id} marked as rejected`);
    return NextResponse.json({
      success: true,
      message: "Swap request rejected successfully",
      data: updated,
    });
  } catch (err: any) {
    console.error("❌ Error updating swap request:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Server error" },
      { status: 500 }
    );
  }
}