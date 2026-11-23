import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/components/i18n";
import { LOCALES } from "@/lib/i18n/locale";
import { getT } from "@/server/i18n";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// One static version of every page per language: the proxy picks which one to serve.
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: { template: "%s · FChat", default: "FChat by paidbyfacu" },
    description: t.common.appDescription,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const { locale, t } = await getT();
  return (
    <html lang={locale} className={`${inter.variable} h-full`}>
      <body className="min-h-full">
        <I18nProvider locale={locale} messages={t}>
          <TooltipProvider delay={300}>{children}</TooltipProvider>
        </I18nProvider>
        <Toaster position="bottom-right" theme="light" duration={4000} />
      </body>
    </html>
  );
}
