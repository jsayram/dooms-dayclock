import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "./providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Doomsday Clock",
  description: "A deadline-first focus timer for getting unstuck.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Doomsday Clock",
    description: "Turn a finish line into small, playable steps.",
    images: [{ url: "/og.png", width: 1729, height: 910, alt: "A glowing countdown orbit leading through six focus steps" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#10121c",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
