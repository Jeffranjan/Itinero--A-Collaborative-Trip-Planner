import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Collaborative Trip Planner",
  description: "Plan your trips collaboratively with ease.",
};

import { PageTransition } from "@/components/motion/PageTransition";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} relative bg-background-dark antialiased selection:bg-accent-orange selection:text-white`}
      >
        {/* Subtle Radial Gradient Background */}
        <div className="pointer-events-none fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-card-dark/40 via-background-dark to-background-dark"></div>

        <PageTransition>{children}</PageTransition>
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}
