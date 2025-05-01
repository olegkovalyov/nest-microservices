import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from 'geist/font/mono';

import "./globals.css";
import { Layout } from "@/components/Layout"; 
import { cn } from "@/lib/utils"; 
import { Providers } from './providers'; 

export const metadata: Metadata = {
  title: "EdTech Platform", 
  description: "Modern EdTech Platform", 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning> 
      <body 
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          GeistSans.variable,
          GeistMono.variable
        )}
      >
        <Providers>
          <Layout>{children}</Layout> 
        </Providers>
      </body>
    </html>
  );
}
