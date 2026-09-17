import { Analytics } from "@/components/Analytics";
import { ConsentBanner } from "@/components/ConsentBanner";
import { Header } from "@/components/Header";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://floatyduck.app"),
  title: "Floaty Duck — someone to sit with you",
  description:
    "A little duck who lives on your Mac and remembers the water, the blinking, and the timer you set. Free, and nothing leaves your Mac.",
  openGraph: {
    title: "Floaty Duck — someone to sit with you",
    description:
      "A little duck who lives on your Mac and remembers the water, the blinking, and the timer you set.",
    url: "https://floatyduck.app",
    siteName: "Floaty Duck",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        {/* Nothing is counted until the banner is answered. The claim on the page
            about nothing leaving your Mac is about the app, not this. */}
        <Analytics />
        <ConsentBanner />
      </body>
    </html>
  );
}
