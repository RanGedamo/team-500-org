// src/app/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function Page() {
  const user = await getCurrentUser();

  if (!user) return redirect("/signin");

  if (user.role === "admin") return redirect("/admin/dashboard");
  if (user.role === "guard") return redirect("/guard/dashboard");

  return redirect("/signin");
}