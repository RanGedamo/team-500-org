// src/lib/sendToExcel.ts
"use server";
export async function sendScheduleToExcel({
  week,
  schedule,
}: {
  week: string;
  schedule: any;
}) {
  console.log("Sending schedule to Excel for week:", week);
  console.log("Schedule data:", schedule);
  
  
  const res = await fetch("http://localhost:3330/generate-schedule", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": process.env.INTERNAL_API_KEY ?? "",
    },
    body: JSON.stringify({
      week,
      data: schedule,
    }),
  });

  

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Excel error");
  return data;
}