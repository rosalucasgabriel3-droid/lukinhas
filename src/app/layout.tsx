import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "SPREZZ MINER — Inteligência de ofertas",
  description:
    "Organize, analise e acompanhe ofertas low ticket do mercado brasileiro. Evidências primeiro, decisões melhores.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
