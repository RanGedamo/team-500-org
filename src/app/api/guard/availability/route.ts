// src/app/api/availability/route.ts
import { NextRequest,NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { verifyJWT } from "@/lib/jwt";
import AvailabilityForm from "@/models/AvailabilityForm";
import { cookies } from "next/headers";
import dayjs from "dayjs";

function getTargetWeek(): string {
  const today = dayjs();
  const dayOfWeek = today.day(); // 0=ראשון, 6=שבת
  const weeksToAdd = dayOfWeek <= 3 ? 1 : 2; // ראשון–רביעי → שבוע העוקב, חמישי–שבת → שבוע העוקב שאחריו
  const targetSunday = today.startOf("week").add(weeksToAdd, "week").day(0);
  return targetSunday.format("YYYY-MM-DD");
}

interface AvailabilityFormData {
  _id: string;
  userId: string;
  fullName: string;
  week: string;
  availability: Record<string, string[]>;
  otherNotes: Record<string, string>;
  preferredPositions: string[];
  generalNotes: string;
  submittedAt: Date;
}

export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const payload = verifyJWT(token);
    if (!payload || typeof payload !== "object" || !payload.id) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { fullName, availability, otherNotes, preferredPositions, generalNotes } =
      body;

    

    // ✅ Validate required fields
    if (!fullName || !availability || !preferredPositions) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // ✅ Get next week (Sunday)
    const nextWeek = getTargetWeek();


    // ✅ Update or create form for this specific week
    const newEntry = await AvailabilityForm.findOneAndUpdate(
      { userId: payload.id, week: nextWeek }, // ✅ Find by user AND week
      {
        $set: {
          week: nextWeek, // ✅ ADD THIS LINE - include week in the $set
          fullName,
          availability,
          otherNotes: otherNotes || {},
          preferredPositions,
          generalNotes: generalNotes || "",
          submittedAt: new Date(),
        },
      },
      { upsert: true, new: true, runValidators: true },
    );

    return NextResponse.json({ success: true, data: newEntry });
  } catch (err) {
    console.error("[ERROR] Saving availability form:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    await connectToDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const payload = verifyJWT(token);
    if (!payload || typeof payload !== "object" || !payload.id) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 403 },
      );
    }

    // ✅ Get next week (Sunday)
    const nextWeek = getTargetWeek();

    console.log(
      `📖 Fetching availability for user ${payload.id}, week: ${nextWeek}`,
    );

    // ✅ Only get form for NEXT WEEK
    const form = await AvailabilityForm.findOne({
      userId: payload.id,
      week: nextWeek, // ✅ Only fetch next week's form
    }).lean<AvailabilityFormData>();

    if (!form) {
      console.log(`📭 No form found for user ${payload.id}, week: ${nextWeek}`);
      return NextResponse.json({ success: true, data: null });
    }

    console.log(`✅ Form found for user ${payload.id}, week: ${nextWeek}`);

    return NextResponse.json({
      success: true,
      data: {
        ...form,
        availability: form.availability || {},
        otherNotes: form.otherNotes || {},
        preferredPositions: form.preferredPositions || [],
        generalNotes: form.generalNotes || "",
      },
    });
  } catch (err) {
    console.error("[ERROR] Fetching availability form:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
