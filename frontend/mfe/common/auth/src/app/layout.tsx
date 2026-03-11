import type { Metadata } from "next";
import "../index.css";

export const metadata: Metadata = {
  title: "BizzAI Auth Shell",
  description: "Enterprise Monorepo Authentication and Launchpad",
};

import Providers from "./Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
