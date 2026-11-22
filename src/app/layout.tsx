import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { template: "%s · FChat", default: "FChat by paidbyfacu" },
  description: "Automatizaciones de Instagram: comentan una palabra y reciben tu link por mensaje directo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="min-h-full">
        <TooltipProvider delay={300}>{children}</TooltipProvider>
        <Toaster position="bottom-right" theme="light" duration={4000} />
      </body>
    </html>
  );
}
