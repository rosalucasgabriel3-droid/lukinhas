import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  allOffers,
  saveOffer,
  importOffers,
  patchOffer,
  deleteOffer,
  getOffer,
  history,
  db,
} from "../src/lib/db";
import { blankOffer } from "../src/lib/domain";
const dir = mkdtempSync(join(tmpdir(), "sprezz-test-"));
process.env.DATABASE_PATH = join(dir, "test.sqlite");
after(() => {
  db().close();
  rmSync(dir, { recursive: true, force: true });
});
test("persistência, alterações, arquivos normalizados, importação atômica e histórico", () => {
  assert.equal(allOffers().length, 8);
  const base = {
    ...blankOffer(),
    name: "Oferta teste",
    url: "https://exemplo.com/teste",
    price: 19.9,
  };
  const saved = saveOffer(base);
  assert.equal(allOffers().length, 9);
  assert.ok(saved.createdAt);
  assert.throws(
    () =>
      saveOffer({
        ...base,
        url: "https://exemplo.com/teste/?utm_medium=teste#x",
      }),
    /Já existe/,
  );
  patchOffer(saved.id, { favorite: true, archived: true });
  assert.equal(getOffer(saved.id)?.favorite, true);
  assert.equal(getOffer(saved.id)?.archived, true);
  assert.throws(
    () =>
      importOffers([
        { ...base, url: "https://exemplo.com/nova" },
        { ...base, url: base.url },
      ]),
    /Já existe/,
  );
  assert.equal(allOffers().length, 9);
  assert.throws(
    () =>
      importOffers([
        { ...base, id: "same", url: "https://exemplo.com/a" },
        { ...base, id: "same", url: "https://exemplo.com/b" },
      ]),
    /repetido/,
  );
  assert.equal(
    importOffers([
      { ...base, url: "https://exemplo.com/importada", id: "importada" },
    ]),
    1,
  );
  assert.ok(getOffer("importada"));
  saveOffer({ ...getOffer(saved.id)!, name: "Oferta editada" }, saved.id);
  assert.equal(getOffer(saved.id)?.name, "Oferta editada");
  assert.equal(getOffer(saved.id)?.createdAt, saved.createdAt);
  deleteOffer(saved.id);
  assert.equal(getOffer(saved.id), undefined);
  assert.ok(
    history().some(
      (h) => h.offerId === saved.id && h.action === "Oferta excluída",
    ),
  );
  assert.ok(
    db()
      .prepare("SELECT snapshot FROM verification_history WHERE offer_id=?")
      .get(saved.id),
  );
  assert.throws(() => saveOffer(base, "missing"), /não encontrada/);
});
