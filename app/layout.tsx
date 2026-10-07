import type { Metadata } from "next";
import "./globals.css";
import "./operations.css";
import "./rescro-theme.css";
import "./release.css";
import "./pool-table.css";
import "./pool-extra.css";
import "./pool-flow-fix.css";
import { ProductionProvider } from "@/components/production-provider";
import "./daily-production.css";
import "./factory-requests.css";
import { AuthProvider } from "@/components/auth-provider";

export const metadata: Metadata = {
  title: "RESCRO Production Portal",
  description: "Production order management and manufacturing overview.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><AuthProvider><ProductionProvider>{children}</ProductionProvider></AuthProvider></body>
    </html>
  );
}
