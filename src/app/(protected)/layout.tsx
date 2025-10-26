// (protected)/layout.tsx

import "../globals.css";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { UserProvider } from "@/context/UserContext";
import ProtectedShell from "./ProtectedShell"; // client component
import React from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (




        <React.StrictMode>
          <ThemeProvider>
            <UserProvider>
              <SidebarProvider>
                {/* <GuardsProvider> */}
                  <ProtectedShell>{children}</ProtectedShell>
                {/* </GuardsProvider> */}
              </SidebarProvider>
            </UserProvider>
          </ThemeProvider>
        </React.StrictMode>

  );
}
