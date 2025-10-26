import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import { comparePasswords } from "@/lib/hash";
import { signJWT } from "@/lib/jwt";
import UserProfile from "@/models/UserProfile";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  await connectToDB();

  console.log(123);
  
  const testUser = await User.findOne({ username:"123321" });
  
  console.log("testUser : " ,testUser);

  console.log(testUser?.profile);
  
  const testUserProfile = await testUser?.populate("profile");

  const testUserProfile2 = await UserProfile.findById(testUser?.profile);

  console.log("test by populate:",testUserProfile," test by userprofile: ",testUserProfile2);
  
  
  const user = await User.findOne({ username }).populate("profile");
  console.log(user);
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
