import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { AppHydrator } from "@/components/app/AppHydrator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "LendLoop — A Digital Bayanihan Resource Sharing System",
  description:
    "Borrow tools, gear, and appliances from trusted neighbors. LendLoop revives the Filipino spirit of bayanihan.",
  authors: [{ name: "LendLoop" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} antialiased bg-background text-foreground`}
      >
        <AppHydrator>{children}</AppHydrator>
        <Toaster />
        <SonnerToaster richColors position="top-right" />
      </body>
    </html>
  );
}