// src/services/authService.ts

import User from "@/models/User";
import UserProfile from "@/models/UserProfile";
import bcrypt from "bcryptjs";

export async function registerUser(data: {
  username: string;
  password: string;
  fullName: string;
  email?: string;
  phone?: string;
}) {
  const { username, password, fullName, email, phone } = data;

  const existing = await User.findOne({ username });
  if (existing) throw new Error("Username taken");

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, password: hash });

  const profile = await UserProfile.create({
    fullName,
    email,
    phone,
    userId: user._id,
  });

  user.profile = profile._id;
  await user.save();

  return { user, profile };
}

export async function login(username: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
    credentials: "include",
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Login failed");
  }

  const data = await res.json();
  return data.user; // תחזיר את ה-user עם role
}

export async function logout() {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Logout failed");
  }

  return true;
}
