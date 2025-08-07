import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "🚤 Barca Coletiva - Compras Coletivas de Produtos Canábicos",
  description: "Sistema completo para gerenciamento de compras coletivas de produtos canábicos. Participe de barcas, faça pedidos, acompanhe entregas e muito mais!",
  keywords: ["barca coletiva", "cannabis", "compras coletivas", "gelo", "flor", "dry", "entregas"],
  authors: [{ name: "Barca Coletiva Team" }],
  openGraph: {
    title: "🚤 Barca Coletiva - Compras Coletivas de Produtos Canábicos",
    description: "Sistema completo para gerenciamento de compras coletivas de produtos canábicos",
    url: "https://chat.z.ai",
    siteName: "Barca Coletiva",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "🚤 Barca Coletiva - Compras Coletivas de Produtos Canábicos",
    description: "Sistema completo para gerenciamento de compras coletivas de produtos canábicos",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Barca Coletiva",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#10b981" />
        <meta name="msapplication-TileColor" content="#10b981" />
        <meta name="theme-color" content="#10b981" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
