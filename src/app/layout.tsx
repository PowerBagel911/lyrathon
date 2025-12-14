import { GeistSans } from "geist/font/sans";
import localFont from "next/font/local";
import type { Metadata } from "next";

import "~/styles/globals.css";
import { TRPCReactProvider } from "~/trpc/react";

const myFont = localFont({
  src: [
    {
      path: "../../public/font/DKStickyToffee.otf",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-my-font",
});

export const metadata: Metadata = {
  title: "BanhMiBandit - Stop chasing opportunities. Let them find you.",
  description:
    "Connect your GitHub profile with companies you're targeting. Our AI analyzes your actual code contributions and automatically surfaces the roles where you'd make the biggest impact.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${myFont.variable}`}>
      <body className="font-sans antialiased">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
