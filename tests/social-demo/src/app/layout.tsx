import "./globals.css";

import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Social Demo",
  description: "Social Login with Aa Wallet",
};

// eslint-disable-next-line no-undef
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
      <html lang="en">
      <body className={inter.className}>{children}</body>
      </html>
  );
}
