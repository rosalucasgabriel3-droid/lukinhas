"use client";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  Plus,
  Trash2,
  Upload,
  ShieldCheck,
  LoaderCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  blankOffer,
  CRITERIA,
  NICHES,
  day,
  confirmedCriteria,
  type Offer,
  type Evidence,
} from "@/lib/domain";
export async function imageData(file: File): Promise<string> {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 2 * 1024 * 1024
  )
    throw Error("Use PNG, JPEG ou WebP com até 2 MB.");
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(Error("Falha ao ler a imagem."));
    r.readAsDataURL(file);
  });
}
export function OfferForm({
  offer,
  onClose,
  onSave,
  busy,
}: {
  offer: Offer | null;
  onClose: () => void;
  onSave: (o: Offer) => Promise<boolean>;
  busy: boolean;
}) {
  const [o, setO] = useState<Offer>(() =>
      structuredClone(offer || blankOffer()),
    ),
    [tab, setTab] = useState(0),
    [error, setError] = useState(""),
    [uploading, setUploading] = useState(false);
  const set = (key: keyof Offer, value: unknown) =>
    setO((old) => ({ ...old, [key]: value }));
  const text = (
    key: keyof Offer,
    label: string,
    options: {
      type?: string;
      required?: boolean;
      area?: boolean;
      hint?: string;
    } = {},
  ) => (
    <label className={`field ${options.area ? "field-wide" : ""}`} key={key}>
      <span>
        {label}
        {options.required ? " *" : ""}
      </span>
      {options.area ? (
        <textarea
          value={String(o[key] ?? "")}
          onChange={(e) => set(key, e.target.value)}
          rows={3}
        />
      ) : (
        <input
          type={options.type || "text"}
          value={String(o[key] ?? "")}
          onChange={(e) => set(key, e.target.value)}
          required={options.required}
          maxLength={15000}
        />
      )}
      {options.hint && <small>{options.hint}</small>}
    </label>
  );
  const num = (
    key: keyof Offer,
    label: string,
    min = 0,
    max = 999999,
    step = "1",
  ) => (
    <label className="field" key={key}>
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={o[key] === null ? "" : String(o[key])}
        placeholder="Não verificado"
        onChange={(e) =>
          set(key, e.target.value === "" ? null : Number(e.target.value))
        }
      />
    </label>
  );
  const updateEvidence = (index: number, p: Partial<Evidence>) =>
    set(
      "evidence",
      o.evidence.map((e, i) => (i === index ? { ...e, ...p } : e)),
    );
  async function upload(files: FileList | null) {
    if (!files) return;
    setUploading(true);
    try {
      const images = await Promise.all(
        [...files].map(async (f) => ({
          name: f.name,
          data: await imageData(f),
          kind: "Produto",
        })),
      );
      if (o.images.length + images.length > 8)
        throw Error("Limite de 8 imagens.");
      set("images", [...o.images, ...images]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }
  return (
    <Dialog.Root
      open
      onOpenChange={(v) => {
        if (!v && !busy && !uploading) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className="modal form-modal"
          onInteractOutside={(e) => {
            if (busy || uploading) e.preventDefault();
          }}
        >
          <div className="modal-heading">
            <div>
              <span className="eyebrow">SUA BASE DE INTELIGÊNCIA</span>
              <Dialog.Title>
                {offer ? "Editar oferta" : "Adicionar oferta"}
              </Dialog.Title>
              <Dialog.Description>
                Registre dados observados e mantenha as sugestões separadas das
                evidências.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Fechar"
                disabled={busy || uploading}
              >
                <X size={20} />
              </Button>
            </Dialog.Close>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              if (await onSave(o)) onClose();
            }}
          >
            <div className="form-tabs">
              {[
                "Informações comerciais",
                "Anúncios e funil",
                "Modelagem",
                "Evidências e imagens",
              ].map((t, i) => (
                <button
                  type="button"
                  key={t}
                  className={tab === i ? "active" : ""}
                  onClick={() => setTab(i)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="form-body">
              {error && <div className="alert error">{error}</div>}
              {tab === 0 && (
                <div className="form-grid">
                  {text("name", "Nome do produto", { required: true })}
                  <label className="field">
                    <span>Nicho *</span>
                    <input
                      required
                      aria-label="Nicho"
                      list="niche-list"
                      value={o.niche}
                      onChange={(e) => set("niche", e.target.value)}
                    />
                    <datalist id="niche-list">
                      {NICHES.map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </datalist>
                  </label>
                  {text("discoveredAt", "Data da descoberta", { type: "date" })}
                  {text("subniche", "Subnicho")}
                  {text("audience", "Público")}
                  {num("price", "Preço anunciado (R$) *", 9.9, 97, "0.01")}
                  {num(
                    "maxPrice",
                    "Preço máximo anunciado (opcional)",
                    9.9,
                    97,
                    "0.01",
                  )}
                  {text("url", "Página de vendas / catálogo", {
                    type: "url",
                    required: true,
                  })}
                  {text("platform", "Plataforma de pagamento")}
                  {text("promise", "Promessa principal informada", {
                    area: true,
                  })}
                  {text("deliverables", "Entregáveis informados", {
                    area: true,
                  })}
                  {text("notes", "Observações", { area: true })}
                  <p className="field-wide muted small">
                    Valores iniciais são informações fornecidas no briefing. O
                    cadastro de um dado não confirma sua veracidade; documente
                    sua verificação na aba de evidências.
                  </p>
                </div>
              )}
              {tab === 1 && (
                <div className="form-grid">
                  {text("checkout", "URL do checkout", { type: "url" })}
                  {num(
                    "checkoutPrice",
                    "Preço observado no checkout (R$)",
                    9.9,
                    97,
                    "0.01",
                  )}
                  {text(
                    "library",
                    "Link verificado da Biblioteca de Anúncios",
                    {
                      type: "url",
                      hint: "Cole somente uma URL que você tenha conferido.",
                    },
                  )}
                  {num("activeAds", "Número de anúncios ativos")}
                  {text("oldestAd", "Anúncio ativo mais antigo", {
                    type: "date",
                  })}
                  {num("advertisers", "Anunciantes encontrados")}
                  <label className="check-field">
                    <input
                      type="checkbox"
                      checked={o.duplicates}
                      onChange={(e) => set("duplicates", e.target.checked)}
                    />
                    Criativos duplicados observados
                  </label>
                  {text("angle", "Ângulo do criativo")}
                  {text("bumps", "Order bumps observados", { area: true })}
                  {text("upsells", "Upsells observados", { area: true })}
                  {text("verifiedAt", "Data da última verificação", {
                    type: "date",
                  })}
                  <div className="alert field-wide">
                    Preencher contagens ou URLs não comprova escala. Registre as
                    fontes e datas na aba Evidências.
                  </div>
                </div>
              )}
              {tab === 2 && (
                <div className="form-grid">
                  <div className="alert field-wide">
                    Hipóteses de modelagem. Estas informações são sugestões, não
                    dados comerciais confirmados.
                  </div>
                  {text("modeling", "Ideia de modelagem / diferenciação", {
                    area: true,
                  })}
                  {text("suggestedAudience", "Público sugerido")}
                  {text("newPromise", "Nova promessa sugerida")}
                  {text("mechanism", "Mecanismo sugerido")}
                  {text("format", "Formato sugerido")}
                  {num(
                    "suggestedPrice",
                    "Preço sugerido (R$)",
                    9.9,
                    97,
                    "0.01",
                  )}
                  {num(
                    "rating",
                    "Nota qualitativa de oportunidade",
                    0,
                    5,
                    "0.1",
                  )}
                  {text("reason", "Motivo da avaliação", { area: true })}
                </div>
              )}
              {tab === 3 && (
                <div className="evidence-editor">
                  <div className="alert">
                    <ShieldCheck size={18} />
                    <span>
                      {confirmedCriteria(o).length}/5 critérios documentados e
                      compatíveis com os dados. São necessários pelo menos 2.
                      Cada evidência precisa de URL ou print e data.
                    </span>
                  </div>
                  {o.evidence.map((e, i) => (
                    <div className="evidence-box" key={e.id}>
                      <div className="section-title">
                        <strong>Evidência {i + 1}</strong>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Remover evidência"
                          onClick={() =>
                            set(
                              "evidence",
                              o.evidence.filter((_, j) => i !== j),
                            )
                          }
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                      <div className="form-grid">
                        <label className="field field-wide">
                          <span>Critério documentado</span>
                          <select
                            value={e.criterion}
                            onChange={(v) =>
                              updateEvidence(i, {
                                criterion: Number(v.target.value),
                              })
                            }
                          >
                            {CRITERIA.map((c, k) => (
                              <option key={c} value={k}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="field">
                          <span>URL da fonte</span>
                          <input
                            type="url"
                            value={e.url}
                            onChange={(v) =>
                              updateEvidence(i, { url: v.target.value })
                            }
                          />
                        </label>
                        <label className="field">
                          <span>Data da verificação *</span>
                          <input
                            type="date"
                            value={e.date}
                            max={day()}
                            onChange={(v) =>
                              updateEvidence(i, { date: v.target.value })
                            }
                          />
                        </label>
                        <label className="field field-wide">
                          <span>O que foi confirmado?</span>
                          <textarea
                            value={e.notes}
                            onChange={(v) =>
                              updateEvidence(i, { notes: v.target.value })
                            }
                          />
                        </label>
                        <label className="upload-label">
                          <Upload size={16} />{" "}
                          {e.image
                            ? "Substituir print"
                            : "Anexar print (até 2 MB)"}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={async (v) => {
                              const f = v.target.files?.[0];
                              if (f) {
                                setUploading(true);
                                try {
                                  updateEvidence(i, {
                                    image: await imageData(f),
                                  });
                                } catch (err) {
                                  setError((err as Error).message);
                                } finally {
                                  setUploading(false);
                                }
                              }
                            }}
                          />
                        </label>
                        {e.image && (
                          <div className="attachment">
                            <img src={e.image} alt="Print da evidência" />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => updateEvidence(i, { image: "" })}
                            >
                              Remover print
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      set("evidence", [
                        ...o.evidence,
                        {
                          id: crypto.randomUUID(),
                          criterion: 0,
                          url: "",
                          image: "",
                          date: day(),
                          notes: "",
                        },
                      ])
                    }
                  >
                    <Plus size={16} />
                    Adicionar evidência
                  </Button>
                  <h3>Imagens e prints da oferta</h3>
                  <p className="muted small">
                    Envie apenas imagens autorizadas. Identifique o tipo de cada
                    print.
                  </p>
                  <label className="upload-zone">
                    <Upload size={24} />
                    <strong>Selecionar imagens</strong>
                    <span>
                      PNG, JPEG ou WebP · até 2 MB por imagem · máximo de 8
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => upload(e.target.files)}
                    />
                  </label>
                  <div className="attachments">
                    {o.images.map((im, i) => (
                      <div className="attachment" key={i}>
                        <img src={im.data} alt={im.name} />
                        <select
                          aria-label="Tipo de imagem"
                          value={im.kind}
                          onChange={(e) =>
                            set(
                              "images",
                              o.images.map((x, j) =>
                                j === i ? { ...x, kind: e.target.value } : x,
                              ),
                            )
                          }
                        >
                          {[
                            "Produto",
                            "Página de vendas",
                            "Checkout",
                            "Anúncio",
                          ].map((k) => (
                            <option key={k}>{k}</option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            set(
                              "images",
                              o.images.filter((_, j) => i !== j),
                            )
                          }
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <span className="muted small">
                * Campos obrigatórios · preços de R$ 9,90 a R$ 97
              </span>
              <Button
                type="button"
                variant="outline"
                disabled={busy || uploading}
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={busy || uploading}>
                {busy || uploading ? (
                  <LoaderCircle className="spin" size={16} />
                ) : (
                  <Plus size={16} />
                )}
                Salvar oferta
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
