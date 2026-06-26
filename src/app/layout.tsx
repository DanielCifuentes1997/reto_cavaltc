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
      <body className={`${inter.className} bg-cavaltec-light text-slate-800 min-h-screen flex flex-col`}>
        <Providers>
          <main className="flex-grow">
            {children}
          </main>
          <footer className="bg-cavaltec-dark text-slate-400 py-6 text-center text-sm">
            <div className="container mx-auto px-4 flex flex-col items-center justify-center space-y-2">
              <p>
                Realizado para <span className="text-cavaltec-gold font-semibold">CAVALTEC</span>, Talento Tech y MinTIC.
              </p>
              <p>
                Desarrollado por The Digital Core Lab
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}