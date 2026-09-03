import { NextRequest } from "next/server";

const gatewayOrigin = process.env.API_PROXY_TARGET ?? "https://api.bbangsomoon.com";

export async function proxyGatewayRequest(request: NextRequest, path: string[]) {
  const headers = new Headers(request.headers);
  headers.delete("origin");
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
  const upstream = await fetch(`${gatewayOrigin}/${path.join("/")}${request.nextUrl.search}`, { method: request.method, headers, body, cache: "no-store", redirect: "manual" });
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding"); responseHeaders.delete("content-length"); responseHeaders.delete("transfer-encoding");
  const setCookies = (upstream.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.();
  if (setCookies?.length) { responseHeaders.delete("set-cookie"); setCookies.forEach((cookie) => responseHeaders.append("set-cookie", cookie)); }
  return new Response(await upstream.arrayBuffer(), { status: upstream.status, headers: responseHeaders });
}
