
import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Team 500 - לוח בקרה",
  description: "לוח בקרה מהיר וקל למאבטחים ומנהלים",
};

export default async function HomePageGuard() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold">ברוך הבא, {user?.profile?.fullName} 👋</h1>

      <section>
        <EcommerceMetrics />
      </section>
{/* 
      <section>
        <RecentOrders />
      </section> */}
    </div>
  );
}
