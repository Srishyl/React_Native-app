import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "GreenScape - Premium Online Plant Store",
  description: "Discover beautiful, healthy plants for your home and garden. Sustainably sourced, expertly packaged, and delivered with care.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${outfit.variable} font-outfit antialiased`}>
        {children}
      </body>
    </html>
  );
}
