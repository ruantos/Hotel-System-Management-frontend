import type { Metadata } from "next";
import { AppProviders } from "@/providers/app-providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Maré Hotel | Mais tempo para você", template: "%s | Maré Hotel" },
  description: "Conheça a proposta do Maré Hotel e planeje sua próxima pausa. Projeto acadêmico de gerenciamento hoteleiro.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <AppProviders>
          <div className="site-root">
            <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
            <SiteHeader />
            <main id="conteudo">{children}</main>
            <SiteFooter />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
