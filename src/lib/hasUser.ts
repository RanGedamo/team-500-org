// src/lib/isAdmin.ts
"use server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyJWT } from "./jwt";
import { JwtPayload } from "jsonwebtoken";

export async function requireUser() {
      const cookiesSession = await cookies();

    const sessionToken = cookiesSession.get("session_token")?.value;
    if (!sessionToken) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const payload = verifyJWT(sessionToken);
        if (!payload || !payload.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // if (!payload || payload.id !== "admin") {
    //   return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    // }

    console.log("Admin verified:", payload);
    return payload;
}

export async function requireUserNew(): Promise<JwtPayload> {
  const cookiesSession = await cookies();
  const sessionToken = cookiesSession.get("session_token")?.value;
  if (!sessionToken) throw new Error("Unauthorized");

  const payload = verifyJWT(sessionToken);
  if (!payload || !payload.id) throw new Error("Forbidden");

  console.log("Admin verified:", payload);
  return payload;
}