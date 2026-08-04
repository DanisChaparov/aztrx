import type { Metadata, Viewport } from "next";
import { Cabin, Inter, Instrument_Serif, Manrope, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "./globals-v2.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", weight: ["400", "500", "600", "700"] });
const cabin = Cabin({ subsets: ["latin"], variable: "--font-cabin", weight: ["400", "500", "600"] });
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["400", "500", "700", "800"] });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: "Upstream",
  description: "Verified focus sessions for programmers, funding the open source you depend on.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0b0c10",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${cabin.variable} ${instrumentSerif.variable} ${inter.variable} ${jakarta.variable}`}
    >
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
