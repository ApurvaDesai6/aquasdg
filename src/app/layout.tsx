import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AquaSDG - Water Security Intelligence Platform",
  description: "AI-powered water security platform combining flood forecasting, drought monitoring, and water access intelligence for communities worldwide.",
  keywords: ["Water Security", "Flood Forecasting", "Drought Monitoring", "SDG 6", "AI", "Water Access", "Climate Resilience"],
  authors: [{ name: "AquaSDG Team" }],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2306b6d4' stroke-width='2'><path d='M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z'/></svg>",
  },
  openGraph: {
    title: "AquaSDG - Water Security Intelligence",
    description: "AI-powered water security for sustainable development",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
