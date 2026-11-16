import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { seedOffers } from "./seed";
import {
  normalizeUrl,
  validateOffer,
  day,
  type Offer,
  type History,
} from "./domain";
let singleton: DatabaseSync;
export function db() {
  if (singleton) return singleton;
  const file = resolve(
    /* turbopackIgnore: true */ process.env.DATABASE_PATH ||
      "data/sprezz.sqlite",
  );
  mkdirSync(dirname(file), { recursive: true });
  const d = new DatabaseSync(file);
  d.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY,value TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS niches (name TEXT PRIMARY KEY);
 CREATE TABLE IF NOT EXISTS offers (id TEXT PRIMARY KEY,url_key TEXT NOT NULL UNIQUE,data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS evidence (id TEXT PRIMARY KEY,offer_id TEXT NOT NULL REFERENCES offers(id) ON DELETE CASCADE,data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS links (offer_id TEXT NOT NULL REFERENCES offers(id) ON DELETE CASCADE,kind TEXT NOT NULL,url TEXT NOT NULL,PRIMARY KEY(offer_id,kind));
 CREATE TABLE IF NOT EXISTS images (offer_id TEXT NOT NULL REFERENCES offers(id) ON DELETE CASCADE,position INTEGER NOT NULL,data TEXT NOT NULL,PRIMARY KEY(offer_id,position));
 CREATE TABLE IF NOT EXISTS favorites (offer_id TEXT PRIMARY KEY REFERENCES offers(id) ON DELETE CASCADE);
 CREATE TABLE IF NOT EXISTS opportunity_notes (offer_id TEXT PRIMARY KEY REFERENCES offers(id) ON DELETE CASCADE,rating REAL,reason TEXT,modeling TEXT);
 CREATE TABLE IF NOT EXISTS verification_history (id INTEGER PRIMARY KEY AUTOINCREMENT,offer_id TEXT NOT NULL,name TEXT NOT NULL,action TEXT NOT NULL,date TEXT NOT NULL,snapshot TEXT NOT NULL);`);
  singleton = d;
  if (!d.prepare("SELECT value FROM metadata WHERE key='seeded'").get()) {
    d.exec("BEGIN IMMEDIATE");
    try {
      for (const o of seedOffers(new Date().toISOString()))
        persist(o, "Cadastro inicial · referência fornecida");
      d.prepare("INSERT INTO metadata VALUES (?,?)").run("seeded", "1");
      d.exec("COMMIT");
    } catch (e) {
      d.exec("ROLLBACK");
      throw e;
    }
  }
  return d;
}
export function allOffers(): Offer[] {
  return (
    db().prepare("SELECT data FROM offers").all() as { data: string }[]
  ).map((r) => JSON.parse(r.data));
}
export function getOffer(id: string): Offer | undefined {
  const row = db().prepare("SELECT data FROM offers WHERE id=?").get(id) as
    { data: string } | undefined;
  return row ? JSON.parse(row.data) : undefined;
}
export function history(): History[] {
  return db()
    .prepare(
      "SELECT id,offer_id AS offerId,name,action,date FROM verification_history ORDER BY id DESC LIMIT 1000",
    )
    .all() as unknown as History[];
}
function persist(o: Offer, action: string) {
  const d = db();
  const duplicate = d
    .prepare("SELECT id FROM offers WHERE url_key=? AND id<>?")
    .get(normalizeUrl(o.url), o.id);
  if (duplicate)
    throw Error(
      "Já existe uma oferta com essa página de vendas (incluindo links com parâmetros de rastreamento).",
    );
  const ids = new Set<string>();
  for (const e of o.evidence) {
    if (ids.has(e.id)) throw Error("Identificadores de evidência duplicados.");
    ids.add(e.id);
    e.id = `${o.id}:${e.id.split(":").pop() || randomUUID()}`;
  }
  d.prepare("INSERT OR IGNORE INTO niches(name) VALUES (?)").run(o.niche);
  d.prepare(
    "INSERT INTO offers VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET url_key=excluded.url_key,data=excluded.data",
  ).run(o.id, normalizeUrl(o.url), JSON.stringify(o));
  for (const table of [
    "evidence",
    "links",
    "images",
    "favorites",
    "opportunity_notes",
  ])
    d.prepare(`DELETE FROM ${table} WHERE offer_id=?`).run(o.id);
  for (const e of o.evidence)
    d.prepare("INSERT INTO evidence VALUES (?,?,?)").run(
      e.id,
      o.id,
      JSON.stringify(e),
    );
  for (const [kind, url] of [
    ["sales", o.url],
    ["checkout", o.checkout],
    ["library", o.library],
  ])
    if (url) d.prepare("INSERT INTO links VALUES (?,?,?)").run(o.id, kind, url);
  o.images.forEach((i, n) =>
    d
      .prepare("INSERT INTO images VALUES (?,?,?)")
      .run(o.id, n, JSON.stringify(i)),
  );
  if (o.favorite) d.prepare("INSERT INTO favorites VALUES (?)").run(o.id);
  d.prepare("INSERT INTO opportunity_notes VALUES (?,?,?,?)").run(
    o.id,
    o.rating,
    o.reason,
    o.modeling,
  );
  d.prepare(
    "INSERT INTO verification_history(offer_id,name,action,date,snapshot) VALUES (?,?,?,?,?)",
  ).run(o.id, o.name, action, new Date().toISOString(), JSON.stringify(o));
  return o;
}
export function saveOffer(input: unknown, id?: string) {
  const d = db();
  d.exec("BEGIN IMMEDIATE");
  try {
    const old = id ? getOffer(id) : undefined;
    if (id && !old) throw Error("Oferta não encontrada.");
    const o = validateOffer(input);
    o.id = old?.id || randomUUID();
    o.createdAt = old?.createdAt || new Date().toISOString();
    o.updatedAt = new Date().toISOString();
    o.discoveredAt = o.discoveredAt || day();
    persist(
      o,
      old
        ? "Oferta atualizada · dados e evidências registrados"
        : "Oferta cadastrada",
    );
    d.exec("COMMIT");
    return o;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}
export function patchOffer(
  id: string,
  patch: { favorite?: boolean; archived?: boolean },
) {
  const old = getOffer(id);
  if (!old) throw Error("Oferta não encontrada.");
  return saveOffer({ ...old, ...patch }, id);
}
export function deleteOffer(id: string) {
  const d = db(),
    o = getOffer(id);
  if (!o) throw Error("Oferta não encontrada.");
  d.exec("BEGIN IMMEDIATE");
  try {
    d.prepare("DELETE FROM offers WHERE id=?").run(id);
    d.prepare(
      "INSERT INTO verification_history(offer_id,name,action,date,snapshot) VALUES (?,?,?,?,?)",
    ).run(
      id,
      o.name,
      "Oferta excluída",
      new Date().toISOString(),
      JSON.stringify(o),
    );
    d.exec("COMMIT");
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}
export function importOffers(input: unknown) {
  if (!Array.isArray(input) || input.length === 0 || input.length > 100)
    throw Error("Importe de 1 a 100 ofertas por arquivo.");
  const parsed = input.map(validateOffer);
  const ids = new Set<string>();
  for (const p of parsed) {
    if (p.id) {
      if (!/^[A-Za-z0-9_-]{1,120}$/.test(p.id) || ids.has(p.id))
        throw Error("Identificador inválido ou repetido no arquivo.");
      ids.add(p.id);
    }
  }
  const d = db();
  d.exec("BEGIN IMMEDIATE");
  try {
    const now = new Date().toISOString();
    for (const p of parsed) {
      if (p.id && getOffer(p.id))
        throw Error("Identificador de oferta já cadastrado.");
      persist(
        {
          ...p,
          id: p.id || randomUUID(),
          discoveredAt: p.discoveredAt || day(),
          createdAt: now,
          updatedAt: now,
        },
        "Oferta importada",
      );
    }
    d.exec("COMMIT");
    return parsed.length;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}
