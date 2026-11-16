export const NICHES = [
  "Educação e alfabetização",
  "Natal infantil",
  "Artesanato",
  "Materiais profissionais",
] as const;
export const CRITERIA = [
  "10 ou mais anúncios ativos",
  "Anúncios ativos há pelo menos 14 dias",
  "Criativos duplicados",
  "Vários anunciantes de ofertas semelhantes",
  "Página e checkout funcionando, com preço confirmado",
];
export type Evidence = {
  id: string;
  criterion: number;
  url: string;
  image: string;
  date: string;
  notes: string;
};
export type Offer = {
  id: string;
  name: string;
  niche: string;
  subniche: string;
  audience: string;
  promise: string;
  deliverables: string;
  price: number;
  maxPrice: number | null;
  checkoutPrice: number | null;
  platform: string;
  url: string;
  checkout: string;
  library: string;
  activeAds: number | null;
  oldestAd: string;
  duplicates: boolean;
  advertisers: number | null;
  angle: string;
  bumps: string;
  upsells: string;
  modeling: string;
  suggestedAudience: string;
  newPromise: string;
  mechanism: string;
  format: string;
  suggestedPrice: number | null;
  rating: number | null;
  reason: string;
  notes: string;
  verifiedAt: string;
  evidence: Evidence[];
  images: { name: string; data: string; kind: string }[];
  favorite: boolean;
  archived: boolean;
  discoveredAt: string;
  createdAt: string;
  updatedAt: string;
};
export type History = {
  id: number;
  offerId: string;
  name: string;
  action: string;
  date: string;
};
export const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    n,
  );
export const day = (d = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
export const displayDate = (s: string) =>
  s
    ? new Date(s.length === 10 ? `${s}T12:00:00Z` : s).toLocaleDateString(
        "pt-BR",
        { timeZone: "America/Sao_Paulo" },
      )
    : "Não verificado";
export function normalizeUrl(value: string) {
  const u = new URL(value);
  u.hash = "";
  ["fbclid", "gclid"].forEach((k) => u.searchParams.delete(k));
  for (const k of [...u.searchParams.keys()])
    if (k.startsWith("utm_")) u.searchParams.delete(k);
  u.searchParams.sort();
  return u.toString().replace(/\/$/, "");
}
export const safeUrl = (s: unknown) => {
  try {
    return (
      typeof s === "string" && ["http:", "https:"].includes(new URL(s).protocol)
    );
  } catch {
    return false;
  }
};
export function confirmedCriteria(o: Offer) {
  return [
    ...new Set(
      o.evidence
        .filter(
          (e) =>
            Number.isInteger(e.criterion) &&
            e.criterion >= 0 &&
            e.criterion < 5 &&
            !!e.date &&
            e.date <= day() &&
            (safeUrl(e.url) ||
              /^data:image\/(png|jpeg|webp);base64,/.test(e.image)),
        )
        .map((e) => e.criterion),
    ),
  ].filter((c) => {
    if (c === 0) return o.activeAds !== null && o.activeAds >= 10;
    if (c === 1)
      return (
        !!o.oldestAd &&
        new Date(o.oldestAd + "T12:00:00Z").getTime() <=
          Date.now() - 14 * 86400000 &&
        (o.activeAds ?? 0) > 0
      );
    if (c === 2) return o.duplicates;
    if (c === 3) return (o.advertisers ?? 0) >= 2;
    return safeUrl(o.url) && safeUrl(o.checkout) && o.checkoutPrice !== null;
  });
}
export const isScaled = (o: Offer) => confirmedCriteria(o).length >= 2;
export const status = (o: Offer) =>
  isScaled(o)
    ? "Sinais de escala verificados"
    : o.evidence.length
      ? "Em verificação"
      : "Não verificada";
export function blankOffer(): Offer {
  return {
    id: "",
    name: "",
    niche: NICHES[0],
    subniche: "",
    audience: "",
    promise: "",
    deliverables: "",
    price: 19.9,
    maxPrice: null,
    checkoutPrice: null,
    platform: "",
    url: "",
    checkout: "",
    library: "",
    activeAds: null,
    oldestAd: "",
    duplicates: false,
    advertisers: null,
    angle: "",
    bumps: "",
    upsells: "",
    modeling: "",
    suggestedAudience: "",
    newPromise: "",
    mechanism: "",
    format: "",
    suggestedPrice: null,
    rating: null,
    reason: "",
    notes: "",
    verifiedAt: "",
    evidence: [],
    images: [],
    favorite: false,
    archived: false,
    discoveredAt: "",
    createdAt: "",
    updatedAt: "",
  };
}
export function validateOffer(input: unknown): Offer {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw Error("Oferta inválida.");
  const raw = input as Record<string, unknown>,
    o = blankOffer();
  for (const k of Object.keys(o) as (keyof Offer)[]) {
    if (k === "evidence" || k === "images") continue;
    const v = raw[k];
    if (v === undefined) continue;
    if (
      [
        "price",
        "maxPrice",
        "checkoutPrice",
        "activeAds",
        "advertisers",
        "rating",
        "suggestedPrice",
      ].includes(k)
    ) {
      if (v !== null && (typeof v !== "number" || !Number.isFinite(v)))
        throw Error(`Valor numérico inválido: ${k}.`);
    } else if (["duplicates", "favorite", "archived"].includes(k)) {
      if (typeof v !== "boolean") throw Error(`Campo inválido: ${k}.`);
    } else if (typeof v !== "string" || v.length > 15000)
      throw Error(`Texto inválido: ${k}.`);
    Object.assign(o, { [k]: v });
  }
  o.name = o.name.trim();
  o.niche = o.niche.trim();
  if (!o.name || !o.niche || !o.url)
    throw Error("Informe nome, nicho e página de vendas.");
  if (o.price === null || o.price < 9.9 || o.price > 97)
    throw Error("O preço deve estar entre R$ 9,90 e R$ 97.");
  for (const n of [o.maxPrice, o.checkoutPrice, o.suggestedPrice])
    if (n !== null && (n < 9.9 || n > 97))
      throw Error("Preços devem estar entre R$ 9,90 e R$ 97.");
  if (o.maxPrice !== null && o.maxPrice < o.price)
    throw Error("O preço máximo deve ser maior ou igual ao mínimo.");
  if (o.rating !== null && (o.rating < 0 || o.rating > 5))
    throw Error("A nota deve estar entre 0 e 5.");
  for (const n of [o.activeAds, o.advertisers])
    if (n !== null && (!Number.isInteger(n) || n < 0))
      throw Error("Contagens devem ser inteiras e não negativas.");
  for (const k of ["url", "checkout", "library"] as const)
    if (o[k] && !safeUrl(o[k]))
      throw Error("Use URLs completas com http:// ou https://.");
  const validDate = (s: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !isNaN(Date.parse(s)) &&
    new Date(s).toISOString().slice(0, 10) === s &&
    s <= day();
  for (const s of [o.oldestAd, o.verifiedAt, o.discoveredAt])
    if (s && !validDate(s)) throw Error("Data inválida ou futura.");
  if (!Array.isArray(raw.evidence ?? []) || !Array.isArray(raw.images ?? []))
    throw Error("Evidências ou imagens inválidas.");
  const validImage = (s: unknown) =>
    typeof s === "string" &&
    s.length <= 2800000 &&
    /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s);
  o.evidence = (raw.evidence ?? []) as Evidence[];
  if (o.evidence.length > 30)
    throw Error("Limite de 30 evidências por oferta.");
  for (const e of o.evidence) {
    if (
      !e ||
      typeof e.id !== "string" ||
      typeof e.notes !== "string" ||
      e.notes.length > 15000 ||
      !Number.isInteger(e.criterion) ||
      e.criterion < 0 ||
      e.criterion > 4 ||
      !validDate(e.date) ||
      typeof e.url !== "string" ||
      typeof e.image !== "string" ||
      (e.url && !safeUrl(e.url)) ||
      (e.image && !validImage(e.image)) ||
      (!e.url && !e.image)
    )
      throw Error(
        "Cada evidência exige critério, URL ou print válido e data de verificação.",
      );
  }
  o.images = (raw.images ?? []) as Offer["images"];
  if (
    o.images.length > 8 ||
    o.images.some(
      (i) =>
        !i ||
        typeof i.name !== "string" ||
        i.name.length > 500 ||
        !["Produto", "Página de vendas", "Checkout", "Anúncio"].includes(
          i.kind,
        ) ||
        !validImage(i.data),
    )
  )
    throw Error("Anexe até 8 imagens PNG, JPEG ou WebP de até 2 MB.");
  return o;
}
