import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import { comparePasswords } from "@/lib/hash";
import { signJWT } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  await connectToDB();

  const user = await User.findOne({ username }).populate("profile");
  if (!user) {
    return new NextResponse("שם משתמש או סיסמא לא נכונים", { status: 404 });
  }

  const isMatch = await comparePasswords(password, user.password);
  if (!isMatch) {
    return new NextResponse("שם משתמש או סיסמא לא נכונים", { status: 401 });
  }

  const token = signJWT({
    id: user._id, // שים לב לשם!
    username: user.username,
    fullName: user.profile?.fullName || "",
    role: user.role,
  });

  const response = NextResponse.json({
    user: { id: user._id, role: user.role, fullName: user.profile.fullName },
  });

  response.cookies.set("session_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
