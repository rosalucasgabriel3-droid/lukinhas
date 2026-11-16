import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import assert from "node:assert/strict";
const dir = mkdtempSync(join(tmpdir(), "sprezz-http-"));
const port = Number(process.env.SMOKE_PORT || 3197),
  origin = `http://127.0.0.1:${port}`;
const password = randomBytes(24).toString("hex");
async function run(config, checks) {
  const server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      env: {
        ...process.env,
        NODE_ENV: "production",
        DATABASE_PATH: join(dir, "smoke.sqlite"),
        APP_PASSWORD: "",
        ALLOW_UNAUTHENTICATED: "false",
        ...config,
      },
      stdio: "pipe",
    },
  );
  let log = "";
  server.stderr.on("data", (b) => {
    log += b;
  });
  server.stdout.on("data", (b) => {
    log += b;
  });
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      if (server.exitCode !== null) throw Error("Servidor encerrou: " + log);
      try {
        await fetch(origin);
        ready = true;
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    if (!ready) throw Error("Servidor não iniciou: " + log);
    await checks();
  } finally {
    server.kill("SIGTERM");
    await Promise.race([
      once(server, "exit"),
      new Promise((r) => setTimeout(r, 4000)),
    ]);
    if (server.exitCode === null) server.kill("SIGKILL");
  }
}
try {
  await run({ APP_PASSWORD: password }, async () => {
    const headers = {
      Authorization:
        "Basic " + Buffer.from("workspace:" + password).toString("base64"),
    };
    assert.equal((await fetch(origin + "/api/store")).status, 401);
    assert.equal(
      (
        await fetch(origin + "/api/store", {
          headers: {
            Authorization:
              "Basic " + Buffer.from("workspace:incorreta").toString("base64"),
          },
        })
      ).status,
      401,
    );
    assert.equal((await fetch(origin, { headers })).status, 200);
    const r = await fetch(origin + "/api/store", { headers });
    assert.equal(r.status, 200);
    const d = await r.json();
    assert.equal(d.offers.length, 8);
    assert.ok(d.offers.every((o) => o.activeAds === null));
    assert.equal(
      (await fetch(origin + "/ofertas/sprezz-1", { headers })).status,
      200,
    );
    const writeHeaders = { ...headers, "Content-Type": "application/json" };
    assert.equal(
      (
        await fetch(origin + "/api/store", {
          method: "POST",
          headers: { ...writeHeaders, Origin: "https://outra-origem.example" },
          body: JSON.stringify({ action: "delete", id: "sprezz-1" }),
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await fetch(origin + "/api/store", {
          method: "POST",
          headers: writeHeaders,
          body: JSON.stringify({
            action: "create",
            offer: {
              name: "Preço inválido",
              price: 100,
              url: "https://exemplo.com/erro",
            },
          }),
        })
      ).status,
      400,
    );
    assert.equal(
      (await (await fetch(origin + "/api/store", { headers })).json()).offers
        .length,
      8,
    );
  });
  await run({}, async () => {
    assert.equal((await fetch(origin)).status, 503);
    assert.equal((await fetch(origin + "/api/store")).status, 503);
  });
  console.log(
    "PASS: produção, autenticação, oito referências, rota individual, origem de escrita, validação e bloqueio sem senha.",
  );
} finally {
  rmSync(dir, { recursive: true, force: true });
}
