import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const gatewayOrigin = process.env.API_PROXY_TARGET ?? "https://api.bbangsomoon.com";

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.delete("origin");
  headers.delete("host");
  const target = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, gatewayOrigin);
  return NextResponse.rewrite(target, { request: { headers } });
}

export const config = { matcher: ["/auth/:path*", "/api/:path*"] };
