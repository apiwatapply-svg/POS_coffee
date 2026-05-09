import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coffee POS",
  description: "Coffee shop point of sale system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
