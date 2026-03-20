import type { Metadata } from "next";
import { LanguageProvider } from "@/components/providers/language-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "TuCuervo Social Suite",
  description: "Bilingual content operations dashboard for TuCuervo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}