import { NextRequest, NextResponse } from "next/server";
import {
  allOffers,
  history,
  saveOffer,
  patchOffer,
  deleteOffer,
  importOffers,
} from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(
      { offers: allOffers(), history: history() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error("Database read failed", e);
    return NextResponse.json(
      { error: "Não foi possível abrir o banco de dados." },
      { status: 500 },
    );
  }
}
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (
    origin &&
    origin !== req.nextUrl.origin &&
    new URL(origin).host !== req.headers.get("host")
  )
    return NextResponse.json(
      { error: "Origem não autorizada." },
      { status: 403 },
    );
  if (Number(req.headers.get("content-length") || 0) > 30_000_000)
    return NextResponse.json(
      { error: "Arquivo muito grande. Limite de 30 MB." },
      { status: 413 },
    );
  try {
    const body = await req.json();
    if (JSON.stringify(body).length > 30_000_000)
      throw Error("Arquivo muito grande. Limite de 30 MB.");
    let result;
    if (body.action === "create") result = saveOffer(body.offer);
    else if (body.action === "update" && typeof body.id === "string")
      result = saveOffer(body.offer, body.id);
    else if (body.action === "patch" && typeof body.id === "string") {
      const patch: { favorite?: boolean; archived?: boolean } = {};
      for (const k of ["favorite", "archived"] as const)
        if (body.patch?.[k] !== undefined) {
          if (typeof body.patch[k] !== "boolean")
            throw Error("Valor inválido.");
          patch[k] = body.patch[k];
        }
      result = patchOffer(body.id, patch);
    } else if (body.action === "delete" && typeof body.id === "string") {
      deleteOffer(body.id);
      result = true;
    } else if (body.action === "import") result = importOffers(body.offers);
    else throw Error("Operação inválida.");
    return NextResponse.json({
      result,
      offers: allOffers(),
      history: history(),
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Não foi possível salvar. Tente novamente.",
      },
      { status: 400 },
    );
  }
}
