import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
export function proxy(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.ALLOW_UNAUTHENTICATED !== "true"
    )
      return new NextResponse(
        "Configure APP_PASSWORD no servidor para acessar o SPREZZ MINER.",
        { status: 503 },
      );
    return NextResponse.next();
  }
  const authorization = req.headers.get("authorization") || "";
  let supplied = "";
  try {
    if (authorization.startsWith("Basic ")) {
      const decoded = Buffer.from(authorization.slice(6), "base64").toString();
      supplied = decoded.slice(decoded.indexOf(":") + 1);
    }
  } catch {}
  const a = Buffer.from(supplied),
    b = Buffer.from(password);
  if (a.length === b.length && timingSafeEqual(a, b))
    return NextResponse.next();
  return new NextResponse("Acesso restrito ao SPREZZ MINER.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="SPREZZ MINER", charset="UTF-8"',
    },
  });
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
