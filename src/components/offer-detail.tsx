import {
  ArrowLeft,
  ExternalLink,
  Heart,
  Pencil,
  ShieldCheck,
  Archive,
  Trash2,
  Check,
  Minus,
  ImageIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { OfferArt } from "./offer-art";
import {
  brl,
  status,
  confirmedCriteria,
  CRITERIA,
  displayDate,
  type Offer,
} from "@/lib/domain";
export function OfferDetail({
  o,
  back,
  edit,
  patch,
  remove,
  busy,
}: {
  o: Offer;
  back: () => void;
  edit: () => void;
  patch: (p: Partial<Offer>) => void;
  remove: () => void;
  busy: boolean;
}) {
  const criteria = confirmedCriteria(o);
  const info = (label: string, value: React.ReactNode, kind = "unverified") => (
    <div className="detail-field" key={label}>
      <span>{label}</span>
      <strong>{value || "Não verificado"}</strong>
      <small className={kind === "suggestion" ? "suggested" : ""}>
        {value
          ? kind === "provided"
            ? "Informado · sem verificação independente"
            : kind === "suggestion"
              ? "Sugestão de modelagem"
              : "Registrado manualmente · consulte as evidências"
          : "Não verificado"}
      </small>
    </div>
  );
  const external = (url: string, label: string) =>
    url ? (
      <a
        className="text-link"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {label}
        <ExternalLink size={13} />
      </a>
    ) : null;
  return (
    <>
      <button className="back-link" onClick={back}>
        <ArrowLeft size={16} />
        Voltar às ofertas
      </button>
      <div className="page-title">
        <div>
          <div className="eyebrow">ANÁLISE DA OFERTA</div>
          <h1>{o.name}</h1>
          <p>
            {o.niche} <span className="dot">/</span> {o.subniche}
          </p>
        </div>
        <div className="action-row">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => patch({ favorite: !o.favorite })}
          >
            <Heart size={16} fill={o.favorite ? "currentColor" : "none"} />
            {o.favorite ? "Salva" : "Favoritar"}
          </Button>
          <Button onClick={edit}>
            <Pencil size={16} />
            Editar oferta
          </Button>
        </div>
      </div>
      <div className="detail-overview">
        <OfferArt offer={o} />
        <div className="panel detail-summary">
          <span className="status">
            <span />
            {status(o)}
          </span>
          <h2>
            {brl(o.price)}
            {o.maxPrice ? ` a ${brl(o.maxPrice)}` : ""}
          </h2>
          <p className="muted">
            Preço anunciado · checkout{" "}
            {o.checkoutPrice === null
              ? "não verificado"
              : `registrado: ${brl(o.checkoutPrice)}`}
          </p>
          <p>{o.deliverables}</p>
          <div className="summary-footer">
            <span>
              Nota preliminar{" "}
              <strong className="lime">
                {o.rating !== null
                  ? `${o.rating.toLocaleString("pt-BR")}/5`
                  : "Não atribuída"}
              </strong>
            </span>
            <Button asChild variant="outline">
              <a href={o.url} target="_blank" rel="noopener noreferrer">
                Página de vendas
                <ExternalLink size={15} />
              </a>
            </Button>
          </div>
          <small className="muted">
            Nota qualitativa de modelagem. Não representa vendas ou faturamento.
          </small>
        </div>
      </div>
      <div className="detail-grid">
        <section className="panel">
          <div className="section-title">
            <h2>Informações comerciais</h2>
            <span className="chip">Dados informados</span>
          </div>
          <div className="detail-fields">
            {info("Público", o.audience, "provided")}
            {info("Promessa principal", o.promise, "provided")}
            {info("Entregáveis", o.deliverables, "provided")}
            {info(
              "Preço anunciado",
              brl(o.price) + (o.maxPrice ? ` a ${brl(o.maxPrice)}` : ""),
              "provided",
            )}
            {info(
              "Preço no checkout",
              o.checkoutPrice === null ? "" : brl(o.checkoutPrice),
            )}
            {info("Plataforma de pagamento", o.platform)}
          </div>
        </section>
        <section className="panel">
          <div className="section-title">
            <h2>Inteligência de anúncios</h2>
            <ShieldCheck size={19} />
          </div>
          <div className="detail-fields">
            {info(
              "Anúncios ativos",
              o.activeAds === null ? "" : String(o.activeAds),
            )}
            {info(
              "Anúncio ativo mais antigo",
              o.oldestAd ? displayDate(o.oldestAd) : "",
            )}
            {info("Criativos duplicados", o.duplicates ? "Observados" : "")}
            {info(
              "Anunciantes encontrados",
              o.advertisers === null ? "" : String(o.advertisers),
            )}
            {info("Ângulo do criativo", o.angle)}
            {info(
              "Biblioteca de Anúncios",
              external(o.library, "Abrir link registrado"),
            )}
          </div>
        </section>
        <section className="panel">
          <div className="section-title">
            <h2>Funil da oferta</h2>
            <span className="chip">Verificação manual</span>
          </div>
          <div className="detail-fields">
            {info(
              "Página de vendas / catálogo",
              external(o.url, "Abrir página fornecida"),
              "provided",
            )}
            {info("Checkout", external(o.checkout, "Abrir checkout"))}
            {info("Order bumps", o.bumps)}
            {info("Upsells", o.upsells)}
          </div>
        </section>
        <section className="panel modeling-panel">
          <div className="section-title">
            <h2>Potencial de modelagem</h2>
            <span className="chip green">Hipóteses</span>
          </div>
          <p className="modeling-idea">
            {o.modeling || "Nenhuma ideia de modelagem cadastrada."}
          </p>
          <div className="detail-fields">
            {info("Público sugerido", o.suggestedAudience, "suggestion")}
            {info("Nova promessa", o.newPromise, "suggestion")}
            {info("Mecanismo", o.mechanism, "suggestion")}
            {info("Formato", o.format, "suggestion")}
            {info(
              "Preço sugerido",
              o.suggestedPrice === null ? "" : brl(o.suggestedPrice),
              "suggestion",
            )}
            {info("Motivo da nota", o.reason, "suggestion")}
          </div>
        </section>
      </div>
      <section className="panel evidence-detail">
        <div className="section-title">
          <div>
            <h2>Verificação e evidências</h2>
            <p className="muted small">
              Anúncios ativos não comprovam vendas. Pelo menos dois critérios
              documentados são necessários para sinalizar escala.
            </p>
          </div>
          <span className="chip green">{criteria.length}/5 critérios</span>
        </div>
        <div className="criteria-list">
          {CRITERIA.map((c, i) => (
            <div key={c} className={criteria.includes(i) ? "confirmed" : ""}>
              {criteria.includes(i) ? <Check size={17} /> : <Minus size={17} />}
              <span>{c}</span>
              <small>
                {criteria.includes(i) ? "Documentado" : "Não verificado"}
              </small>
            </div>
          ))}
        </div>
        {o.evidence.length ? (
          <div className="evidence-records">
            {o.evidence.map((e) => (
              <article key={e.id}>
                <span className="eyebrow">{displayDate(e.date)}</span>
                <h3>{CRITERIA[e.criterion]}</h3>
                <p>{e.notes || "Sem observações adicionais."}</p>
                {external(e.url, "Consultar fonte")}
                {e.image && (
                  <a href={e.image} target="_blank" rel="noopener noreferrer">
                    <img src={e.image} alt="Print da evidência registrada" />
                  </a>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-inline">
            <ShieldCheck size={24} />
            <span>
              Nenhuma evidência anexada. Edite a oferta para iniciar a
              verificação.
            </span>
          </div>
        )}
      </section>
      <section className="panel">
        <div className="section-title">
          <h2>Imagens e prints</h2>
          <ImageIcon size={18} />
        </div>
        {o.images.length ? (
          <div className="detail-images">
            {o.images.map((im, i) => (
              <figure key={i}>
                <a href={im.data} target="_blank" rel="noopener noreferrer">
                  <img src={im.data} alt={im.name} />
                </a>
                <figcaption>
                  {im.kind} · {im.name}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <div className="empty-inline">
            <ImageIcon size={24} />
            <span>
              Nenhum print real anexado. A capa da oferta é apenas ilustrativa.
            </span>
          </div>
        )}
      </section>
      {o.notes && (
        <section className="panel">
          <h2>Observações</h2>
          <p>{o.notes}</p>
        </section>
      )}
      <div className="detail-bottom">
        <p className="muted small">
          Descoberta:{" "}
          {o.discoveredAt ? displayDate(o.discoveredAt) : "não informada"} ·
          Cadastrada em {displayDate(o.createdAt)} · Última verificação:{" "}
          {o.verifiedAt ? displayDate(o.verifiedAt) : "não realizada"} · ID:{" "}
          {o.id}
        </p>
        <div className="action-row">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => patch({ archived: !o.archived })}
          >
            <Archive size={15} />
            {o.archived ? "Restaurar" : "Arquivar"}
          </Button>
          <Button
            variant="ghost"
            className="danger"
            disabled={busy}
            onClick={remove}
          >
            <Trash2 size={15} />
            Excluir oferta
          </Button>
        </div>
      </div>
    </>
  );
}
