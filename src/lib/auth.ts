// src/lib/auth.ts

"use server";

import { cookies } from "next/headers";
import { verifyJWT } from "./jwt";
import User from "@/models/User";
import { connectToDB } from "./db";

export async function getCurrentUser() {
  await connectToDB();

  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (!token) return null;

  try {
    const decoded = verifyJWT(token) as { id: string };
    const user = await User.findById(decoded.id).populate("profile");
    return user;
  } catch (err) {
    console.error("Error in getCurrentUser:", err);
    return null;
  }
}
