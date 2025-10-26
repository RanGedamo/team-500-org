import {  NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
// import { getCurrentUser } from "@/lib/auth";
import User from "@/models/User";

export async function GET() {
  try {
    await connectToDB();

    // const admin = await getCurrentUser();
    // if (!admin || admin.role !== "admin") {
    //   return NextResponse.json(
    //     { success: false, error: "Unauthorized" },
    //     { status: 401 },
    //   );
    // }

    // Fetch all users with role "guard" or "user"
const guards = await User.find({
  role: { $in: ["guard", "user","admin"] },
})
  .populate("profile", "fullName") // שלוף את fullName מהמסמך שאליו מפנה ObjectId
  .lean();

      console.log(guards);
      
    // Format the data
    const formattedGuards = guards.map((guard: any) => ({
      id: guard._id.toString(),
      userId: guard._id.toString(),
      fullName: guard.profile?.fullName || guard.email, // ✅ Changed to fullName
      email: guard.email,
      role: guard.role,
    }));

    return NextResponse.json({
      success: true,
      data: formattedGuards,
      count: formattedGuards.length,
    });
  } catch (err) {
    console.error("[ERROR] Fetching guards:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
