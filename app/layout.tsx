import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });



export const metadata: Metadata = {
  title: "Social Watch",
  description: "Monitor live public conversations, sentiment signals, and engagement across your topic watchlist.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn("min-h-screen overflow-x-hidden", inter.className)}>{children}</body>
    </html>
  );
}
