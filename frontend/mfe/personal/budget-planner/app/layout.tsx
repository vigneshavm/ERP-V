import type { Metadata } from "next";
import "./globals.css";
import "./styles.css";
import { AuthProvider } from "../src/contexts/AuthContext";
import { SettingsProvider } from "../src/contexts/SettingsContext";
import { NavigationProvider } from "../src/contexts/NavigationContext";
import { ExpenseProvider, LanguageProvider } from "@repo/shared";
import ClientLayout from "./ClientLayout";
import { AuthGuard } from "@repo/ui";

export const metadata: Metadata = {
  title: "Expanger - Personal Finance",
  description: "Advanced expense manager for personal use",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
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
