

import { ToastProvider } from '@/components/ui/toast/ToastProvider';
import './globals.css';
import React from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body  >
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}