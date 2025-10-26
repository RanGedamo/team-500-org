import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await connectToDB();

  const users = await User.find().populate("profile").lean();
  return NextResponse.json({ success: true, users });
}