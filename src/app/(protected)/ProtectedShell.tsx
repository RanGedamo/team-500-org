// (protected)/ProtectedShell.tsx

"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppSidebar from "@/layout/AppSidebar";
import AppHeader from "@/layout/AppHeader";
import Backdrop from "@/layout/Backdrop";
import React from "react";


export default function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";
return ( 
<div className="min-h-screen l:flex" >
   <AppSidebar />
   
    <Backdrop /> 

<div className={`flex-1 transition-all duration-300  ${mainContentMargin}`} dir="rtl" > 
  <div className="sticky top-0 z-99999 bg-white dark:bg-gray-900"> 
  <AppHeader /> 
  </div>
 
 <div >

 <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6  ">{children}</div> 
 </div>
  
 </div> 
 </div> 
 ); 

}