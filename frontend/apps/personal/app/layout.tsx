import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider, LanguageProvider } from "@repo/shared";
import { SettingsProvider } from "@/shared/contexts/SettingsContext";
import { NavigationProvider } from "@/shared/contexts/NavigationContext";
import ClientLayout from "./ClientLayout";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Expanger - Personal Finance",
  description: "Advanced expense manager for personal use",
};

import { AuthGuard } from "@repo/ui";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthGuard>
        <QueryProvider>
          <LanguageProvider>
            <SettingsProvider>
              <NavigationProvider>
                <ClientLayout>
                  {children}
                </ClientLayout>
              </NavigationProvider>
            </SettingsProvider>
          </LanguageProvider>
        </QueryProvider>

        </AuthGuard>
      </body>
    </html>
  );
}
