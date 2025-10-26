// src/app/api/admin/auth/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  // שליפת ה-id מה-URL
  const url = new URL(req.url);
  const userId = url.pathname.split("/").at(-1);

  await connectToDB();
  const admin = await getCurrentUser();

  if (!admin || admin.role !== "admin") {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  if (!userId) {
    return NextResponse.json(
      { success: false, error: "User ID is required" },
      { status: 400 },
    );
  }

  const { fullName, phone, emergencyPhone, email, role } = await req.json();

  try {
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    if (role) user.role = role;
    await user.save();

    const profile = await UserProfile.findOne({ userId: user._id });
    if (profile) {
      if (fullName) profile.fullName = fullName;
      if (phone) profile.phone = phone;
      if (email !== undefined) profile.email = email;
      if (emergencyPhone !== undefined) profile.emergencyPhone = emergencyPhone;
      await profile.save();
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
    });
  } catch (err) {
    console.error("Error updating user:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.pathname.split("/").at(-1);

  try {
    await connectToDB();

    const admin = await getCurrentUser();
    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const userProfile = await UserProfile.findOne({ userId });
    if (userProfile) {
      await UserProfile.findByIdAndDelete(userProfile._id);
    }

    await User.findByIdAndDelete(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
