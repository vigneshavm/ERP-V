import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI ERP | Shell Orchestrator",
  description: "Unified Enterprise Resource Planning Shell",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
