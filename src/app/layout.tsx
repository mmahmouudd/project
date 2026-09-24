import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Figtree } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Willow Lane · Classroom Hub",
  description:
    "A calm, fast classroom management hub for primary school teachers — behavior tallies, micro-rewards and class activity in one place.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${figtree.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
