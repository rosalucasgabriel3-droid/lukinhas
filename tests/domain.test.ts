import { test } from "node:test";
import assert from "node:assert/strict";
import {
  blankOffer,
  validateOffer,
  normalizeUrl,
  confirmedCriteria,
  isScaled,
  day,
} from "../src/lib/domain";
import { seedOffers } from "../src/lib/seed";
const offer = () => ({
  ...blankOffer(),
  name: "Oferta de teste",
  url: "https://exemplo.com/produto",
  price: 19.9,
});
test("seed contém oito referências sem qualquer escala inventada e com distribuição correta", () => {
  const now = new Date().toISOString(),
    s = seedOffers(now);
  assert.equal(s.length, 8);
  assert.equal(s.filter(isScaled).length, 0);
  assert.equal(
    s.filter((o) => o.niche === "Educação e alfabetização").length,
    5,
  );
  assert.deepEqual(
    s
      .filter((o) => o.rating !== null)
      .sort((a, b) => b.rating! - a.rating!)
      .map((o) => o.rating),
    [4.5, 4.2, 4],
  );
  assert.ok(
    s.every(
      (o) =>
        o.activeAds === null && o.checkoutPrice === null && o.createdAt === now,
    ),
  );
  s.forEach(validateOffer);
});
test("URLs normalizadas removem rastreamento, âncoras e ordenam parâmetros", () => {
  assert.equal(
    normalizeUrl("https://exemplo.com/produto/?utm_source=x&fbclid=y#abc"),
    normalizeUrl("https://exemplo.com/produto"),
  );
  assert.equal(
    normalizeUrl("https://exemplo.com/?b=2&a=1"),
    normalizeUrl("https://exemplo.com/?a=1&b=2"),
  );
});
test("valida valores, contagens, URLs e datas", () => {
  for (const p of [
    { price: 9 },
    { price: 98 },
    { activeAds: -1 },
    { activeAds: 1.5 },
    { rating: 5.1 },
    { checkout: "javascript:alert(1)" },
    { oldestAd: "2099-01-01" },
    { verifiedAt: "2026-02-30" },
    { price: null },
    { favorite: "yes" },
    { maxPrice: 15 },
  ])
    assert.throws(() => validateOffer({ ...offer(), ...p }));
  assert.equal(validateOffer(offer()).price, 19.9);
});
test("anúncios ativos isolados nunca comprovam escala", () => {
  const o = { ...offer(), activeAds: 100 };
  assert.equal(isScaled(o), false);
  o.evidence = [
    {
      id: "a",
      criterion: 0,
      url: "https://facebook.com/ads/library/",
      image: "",
      date: day(),
      notes: "Verificação manual",
    },
  ];
  assert.deepEqual(confirmedCriteria(o), [0]);
  assert.equal(isScaled(o), false);
});
test("exige dois critérios distintos, evidências datadas e dados compatíveis", () => {
  const e = {
    id: "a",
    criterion: 0,
    url: "https://exemplo.com/evidencia",
    image: "",
    date: day(),
    notes: "",
  };
  const o = {
    ...offer(),
    activeAds: 10,
    duplicates: true,
    evidence: [e, { ...e, id: "b" }],
  };
  assert.equal(isScaled(o), false);
  o.evidence[1].criterion = 2;
  assert.equal(isScaled(o), true);
  o.duplicates = false;
  assert.equal(isScaled(o), false);
  o.duplicates = true;
  o.evidence[1].date = "";
  assert.equal(isScaled(o), false);
  assert.throws(() => validateOffer(o));
});
test("critério de anúncio antigo requer anúncio ativo, não apenas uma data", () => {
  const o = {
    ...offer(),
    oldestAd: "2020-01-01",
    evidence: [
      {
        id: "a",
        criterion: 1,
        url: "https://exemplo.com/evidencia",
        image: "",
        date: day(),
        notes: "",
      },
    ],
  };
  assert.deepEqual(confirmedCriteria(o), []);
  o.activeAds = 1;
  assert.deepEqual(confirmedCriteria(o), [1]);
});
test("arquivos SVG e evidências sem fontes são rejeitados", () => {
  assert.throws(() =>
    validateOffer({
      ...offer(),
      images: [
        { name: "x", kind: "Produto", data: "data:image/svg+xml;base64,YWJj" },
      ],
    }),
  );
  assert.throws(() =>
    validateOffer({
      ...offer(),
      evidence: [
        { id: "a", criterion: 0, date: day(), url: "", image: "", notes: "" },
      ],
    }),
  );
});
