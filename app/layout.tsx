import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RifPDF - Solusi PDF Tanpa Limit",
  description: "Merge PDF gratis dan aman",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}