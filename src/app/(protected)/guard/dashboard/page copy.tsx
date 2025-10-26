// import type { Metadata } from "next";
// import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
// import React from "react";
// import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
// import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
// import StatisticsChart from "@/components/ecommerce/StatisticsChart";
// import RecentOrders from "@/components/ecommerce/RecentOrders";
// import DemographicCard from "@/components/ecommerce/DemographicCard";
// import { getCurrentUser } from "@/lib/auth";
// import { redirect } from "next/navigation";

// export const metadata: Metadata = {
//   title:
//     "Next.js E-commerce Dashboard | TailAdmin - Next.js Dashboard Template",
//   description: "This is Next.js Home for TailAdmin Dashboard Template",
// };

// export default async function HomePageGuard() {
//     const user = await getCurrentUser();
//     if (!user) {
//       redirect('/signin');
//     }


//   return (
//     <div className="grid grid-cols-12 gap-4 md:gap-6">
//       <div className="col-span-12 space-y-6 xl:col-span-7">
//         <EcommerceMetrics />

//         <MonthlySalesChart />
//       </div>

//       <div className="col-span-12 xl:col-span-5">
//         <MonthlyTarget />
//       </div>

//       <div className="col-span-12">
//         <StatisticsChart />
//       </div>

//       <div className="col-span-12 xl:col-span-5">
//         <DemographicCard />
//       </div>

//       <div className="col-span-12 xl:col-span-7">
//         <RecentOrders />
//       </div>
//     </div>
//   );
// }

"use client";
import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
// import RecentOrders from "@/components/ecommerce/RecentOrders";
// import { getCurrentUser } from "@/lib/auth";
// import { redirect } from "next/navigation";
import { useUser } from "@/context/UserContext";

export const metadata: Metadata = {
  title: "Team 500 - לוח בקרה",
  description: "לוח בקרה מהיר וקל למאבטחים ומנהלים",
};


export default function HomePageGuard() {
  // const user = getCurrentUser();
  // // const {user,isLoading} = useUser();
  // if (!user) {
  //   redirect("/signin");
  // }
  const {isLoading} = useUser();

if(isLoading){
  return <div>Loading...</div>;
}


  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold">ברוך הבא, 👋</h1>

      <section>
        <EcommerceMetrics />
      </section>

      {/* <section>
        <RecentOrders />
      </section> */}
    </div>
  );
}
