import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Autodiagnóstico Ley 1581 | CAVALTEC",
  description: "Plataforma de autodiagnóstico de cumplimiento normativo en fase de diseño.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} min-h-screen`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}