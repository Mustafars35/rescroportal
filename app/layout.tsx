import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased">{children}</body>
    </html>
  );
}
