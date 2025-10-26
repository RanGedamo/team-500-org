import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile";
import bcrypt from "bcryptjs";
import { verifyJWT } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  const cookiesSession = await cookies();
  const cookie = cookiesSession.get("session_token")?.value;

  if (!cookie) return new Response("Unauthorized", { status: 401 });

  const payload = verifyJWT(cookie);
  if (!payload || payload.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const { username, password, fullName, email } = await req.json();

  await connectToDB();

  const existing = await User.findOne({ username });
  if (existing) return new Response("Username exists", { status: 409 });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, password: hash, role: "guard" });

  const profile = await UserProfile.create({
    fullName,
    email,
    userId: user._id,
  });

  user.profile = profile._id;
  await user.save();

  return Response.json({ message: "User created", userId: user._id });
}
