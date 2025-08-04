import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import ClientToaster from "@/components/ClientToaster";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "TalentaPro - Plataforma Profesional de Entrevistas",
  description: "Optimiza tu proceso de selección de talento con tecnología avanzada y experiencia profesional",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${poppins.variable} font-poppins antialiased`}>
        {children}
        <ClientToaster />
      </body>
    </html>
  );
}
