import type { Metadata } from "next";
import "../styles/index.css";

export const metadata: Metadata = {
  title: "Go-Getters",
  description: "A high-performance execution system for ambitious people.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
