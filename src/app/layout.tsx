import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";

import "~/styles/globals.css";

export const metadata: Metadata = {
  title: "BanhMiBandit - Stop chasing opportunities. Let them find you.",
  description: "Connect your GitHub profile with companies you're targeting. Our AI analyzes your actual code contributions and automatically surfaces the roles where you'd make the biggest impact.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
