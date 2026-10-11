import type { Metadata, Viewport } from "next";
import { VT323, Pixelify_Sans, Silkscreen, Sora } from "next/font/google";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { CityBackground } from "@/components/CityBackground";
import "./globals.css";

const vt323 = VT323({
  weight: "400",
  variable: "--font-vt323",
  subsets: ["latin"],
});

const pixelifySans = Pixelify_Sans({
  weight: ["500", "700"],
  variable: "--font-pixelify-sans",
  subsets: ["latin"],
});

const silkscreen = Silkscreen({
  weight: ["400", "700"],
  variable: "--font-silkscreen",
  subsets: ["latin"],
});

const sora = Sora({
  weight: ["400", "600"],
  variable: "--font-sora",
  subsets: ["latin"],
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
  themeColor: "#140F33",
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
        className={`${vt323.variable} ${pixelifySans.variable} ${silkscreen.variable} ${sora.variable} antialiased min-h-screen bg-background text-foreground flex flex-col font-mono`}
      >
        <CityBackground />
        <Providers>
          <Navbar />
          <main className="flex-1 w-full">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
