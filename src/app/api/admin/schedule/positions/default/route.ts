import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import DefaultPosition from "@/models/DefaultPosition";

// ✅ שליפת כל עמדות ברירת המחדל
export async function GET() {
  await connectToDB();
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  

  const positions = await DefaultPosition.find().sort({ order: 1 }).lean();
  return NextResponse.json({ success: true, data: positions });
}

// ✅ הוספת עמדה דיפולטיבית חדשה
export async function POST(req: NextRequest) {
  await connectToDB();
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { name } = await req.json();
  if (!name || !name.trim()) {
    return NextResponse.json(
      { success: false, error: "Missing position name" },
      { status: 400 }
    );
  }

  const existing = await DefaultPosition.findOne({ name: name.trim() });
  if (existing) {
    return NextResponse.json(
      { success: false, error: "Position already exists" },
      { status: 409 }
    );
  }

  const maxOrder = await DefaultPosition.findOne()
    .sort({ order: -1 })
    .select("order");
  const order = maxOrder ? maxOrder.order + 1 : 1;

  const position = await DefaultPosition.create({
    name: name.trim(),
    order,
  });

  return NextResponse.json({ success: true, data: position });
}

// ✅ עריכת שם עמדה דיפולטיבית
export async function PUT(req: NextRequest) {
  await connectToDB();
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { oldName, newName } = await req.json();
  if (!oldName || !newName) {
    return NextResponse.json(
      { success: false, error: "Missing oldName or newName" },
      { status: 400 }
    );
  }

  const updated = await DefaultPosition.findOneAndUpdate(
    { name: oldName.trim() },
    { $set: { name: newName.trim() } },
    { new: true }
  );

  if (!updated) {
    return NextResponse.json(
      { success: false, error: "Position not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: updated });
}

// ✅ מחיקת עמדה דיפולטיבית
export async function DELETE(req: NextRequest) {
  await connectToDB();
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json(
      { success: false, error: "Missing name" },
      { status: 400 }
    );
  }

  const deleted = await DefaultPosition.findOneAndDelete({
    name: name.trim(),
  });

  if (!deleted) {
    return NextResponse.json(
      { success: false, error: "Position not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: deleted });
}
