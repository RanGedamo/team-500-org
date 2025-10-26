// /api/admin/auth/list-guard-names/route.ts
import { connectToDB } from "@/lib/db";
import User from "@/models/User";
// import UserProfile from "@/models/UserProfile";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/jwt";

export async function GET() {
  try {
    await connectToDB();
      const cookieStore = await cookies();
 
    const token = cookieStore.get("session_token")?.value;
    if (!token) return NextResponse.json({ success: false }, { status: 401 });

    const payload = verifyJWT(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ success: false }, { status: 403 });
    }

    const guards = await User.find({ role: { $in: ["guard", "admin"] } }).populate("profile");

    const names = guards
      .map((g) => g.profile?.fullName?.trim())
      .filter(Boolean); // הסר null/undefined

    return NextResponse.json({ success: true, names });
  } catch (err) {
    console.error("שגיאה בשליפת שמות מאבטחים:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}