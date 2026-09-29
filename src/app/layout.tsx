import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";
import { Toaster } from "@kph/ui/sonner";
import "./globals.css";
import { tenant } from "@/lib/tenant";

const raleway = localFont({
  src: [
    { path: "./fonts/pipou/Raleway-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/pipou/Raleway-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/pipou/Raleway-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/pipou/Raleway-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: tenant.appName,
  description: `Gestão de pessoas · ${tenant.name}`,
  icons: { icon: "/pessoas/brand/pipou/symbol-badge.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-brand="pipou"
      className={`dark ${raleway.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground flex flex-col">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
