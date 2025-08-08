import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Barcas - Plataforma de Compras Coletivas",
  description: "Sistema profissional para coordenação de compras coletivas com chat em tempo real e criptografia ponta a ponta",
  keywords: ["compras coletivas", "atacado", "barcas", "grupo", "compras"],
  authors: [{ name: "Barcas Team" }],
  openGraph: {
    title: "Barcas - Plataforma de Compras Coletivas",
    description: "Sistema profissional para coordenação de compras coletivas",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
