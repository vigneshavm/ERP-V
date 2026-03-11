import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { SettingsProvider } from "../contexts/SettingsContext";
import { NavigationProvider } from "../contexts/NavigationContext";
import { ExpenseProvider, LanguageProvider } from "@repo/shared";
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
          <LanguageProvider>
            <AuthProvider>
              <SettingsProvider>
                <ExpenseProvider>
                  <NavigationProvider>
                    <ClientLayout>
                      {children}
                    </ClientLayout>
                  </NavigationProvider>
                </ExpenseProvider>
              </SettingsProvider>
            </AuthProvider>
          </LanguageProvider>
        </AuthGuard>
      </body>
    </html>
  );
}
