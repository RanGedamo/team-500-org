// import { NextRequest, NextResponse } from "next/server";
// import { connectToDB } from "@/lib/db";
// import GuardSchedule from "@/models/copy/GuardSchedule";

// export async function GET(req: NextRequest) {
//   try {
//     await connectToDB();

//     // שולף את כל הערכים הייחודיים של שדה 'week'
//     const weeks = await GuardSchedule.distinct("week");

//     // מיון לפי סדר יורד (שבועות אחרונים בראש)
//     const sortedWeeks = weeks.sort((a: string, b: string) =>
//       b.localeCompare(a),
//     );

//     return NextResponse.json({ success: true, weeks: sortedWeeks });
//   } catch (error) {
//     console.error("❌ Failed to fetch weeks:", error);
//     return NextResponse.json(
//       { success: false, error: "Server error" },
//       { status: 500 },
//     );
//   }
// }
