import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import type { ReactNode } from "react";
import { siteConfig } from "@/config/site";
import { auth } from "@/config/auth";
import { AuthProvider } from "@/components/providers/session-provider";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  metadataBase: new URL(`https://${siteConfig.domain}`),
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <AuthProvider initialSession={session}>{children}</AuthProvider>
      </body>
    </html>
  );
}
