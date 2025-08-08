import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

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
        className="font-sans antialiased bg-background text-foreground"
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
