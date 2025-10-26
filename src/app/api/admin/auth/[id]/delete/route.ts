import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile";
// import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/jwt";

export async function DELETE(
  req: Request,
): Promise<NextResponse<{ success: boolean }>> {
  try {
    await connectToDB();

    const cookiesSession = await cookies();
    const sessionToken = cookiesSession.get("session_token")?.value;
    if (!sessionToken)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );

    const payload = verifyJWT(sessionToken);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    // שליפת ה-id מה-URL
    const url = new URL(req.url);
    const id = url.pathname.split("/").at(-2); // מתאים לנתיב שלך

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing user id" },
        { status: 400 },
      );
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    if (user.profile) {
      await UserProfile.findByIdAndDelete(user.profile);
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
