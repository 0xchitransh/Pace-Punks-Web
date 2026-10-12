import type { Metadata, Viewport } from "next";
import { Pixelify_Sans, DM_Sans, Space_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { PixelBlockBackground } from "@/components/PixelBlockBackground";
import "./globals.css";

const pixelifySans = Pixelify_Sans({
  weight: ["400", "500", "600", "700"],
  variable: "--font-pixelify-sans",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-space-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pace Punks Early Access",
  description: "Walk it. Level it. Evolve it. A walking game with 6,000 pixel Punks. Join early access.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "Pace Punks",
  },
};

export const viewport: Viewport = {
  themeColor: "#17132c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${pixelifySans.variable} ${dmSans.variable} ${spaceMono.variable} antialiased min-h-screen bg-background text-foreground flex flex-col font-sans relative`}
      >
        <PixelBlockBackground />
        <Providers>
          <Navbar />
          <main className="flex-1 w-full relative z-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
