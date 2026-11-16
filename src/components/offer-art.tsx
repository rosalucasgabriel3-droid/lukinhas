import {
  BookOpen,
  TreePine,
  Flower2,
  Users,
  Shapes,
  GraduationCap,
} from "lucide-react";
import type { Offer } from "@/lib/domain";
export function OfferArt({
  offer,
  small = false,
}: {
  offer: Offer;
  small?: boolean;
}) {
  const variant =
    offer.niche === "Natal infantil"
      ? "natal"
      : offer.niche === "Artesanato"
        ? "craft"
        : offer.niche === "Materiais profissionais"
          ? "group"
          : "edu";
  const Icon =
    variant === "natal"
      ? TreePine
      : variant === "craft"
        ? Flower2
        : variant === "group"
          ? Users
          : offer.id === "sprezz-4"
            ? Shapes
            : GraduationCap;
  const title =
    variant === "natal"
      ? "MEU NATAL\nCOLORIDO"
      : variant === "craft"
        ? "PONTOS\nDE NATAL"
        : variant === "group"
          ? "CONECTAR\n& TRANSFORMAR"
          : offer.name.includes("26")
            ? "26 APOSTILAS\nPARA ENSINAR"
            : offer.name.includes("Brincando")
              ? "APRENDER\nBRINCANDO"
              : offer.name.includes("Vogais")
                ? "VOGAIS\n& LETRAS"
                : "PEQUENAS LETRAS,\nGRANDES DESCOBERTAS";
  return (
    <div
      className={`offer-art art-${variant} ${small ? "art-small" : ""}`}
      aria-label="Representação ilustrativa do produto"
    >
      <div className="art-orbit" />
      <span className="art-star star-one">✳</span>
      <span className="art-star star-two">+</span>
      <div className="book-back" />
      <div className="product-book">
        <div className="book-top">
          <BookOpen size={12} />
          <span>COLEÇÃO DIGITAL</span>
        </div>
        <strong>
          {title.split("\n").map((s, i) => (
            <span key={i}>
              {s}
              <br />
            </span>
          ))}
        </strong>
        <div className="book-graphic">
          <Icon strokeWidth={1.3} />
          {variant === "edu" && <span>a b c</span>}
        </div>
        <div className="book-bottom">
          APRENDER. CRIAR. TRANSFORMAR.<span>PDF</span>
        </div>
      </div>
      <span className="illustration-label">Imagem ilustrativa</span>
    </div>
  );
}
