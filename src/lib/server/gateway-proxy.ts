import { NextRequest } from "next/server";

const gatewayOrigin = process.env.API_PROXY_TARGET ?? "https://api.bbangsomoon.com";

export async function proxyGatewayRequest(request: NextRequest, path: string[]) {
  const headers = new Headers(request.headers);
  headers.delete("origin");
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
  const upstreamUrl = new URL(`${path.join("/")}${request.nextUrl.search}`, `${gatewayOrigin}/`);
  let upstream = await fetch(upstreamUrl, { method: request.method, headers, body, cache: "no-store", redirect: "manual" });

  // Keep a same-origin API redirect inside the server proxy. Letting it reach the
  // browser could move an authenticated local request to the API origin directly.
  const location = upstream.headers.get("location");
  if (location && [301, 302, 307, 308].includes(upstream.status)) {
    const redirectUrl = new URL(location, upstreamUrl);
    if (redirectUrl.origin === upstreamUrl.origin) {
      upstream = await fetch(redirectUrl, { method: request.method, headers, body, cache: "no-store", redirect: "manual" });
    }
  }
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding"); responseHeaders.delete("content-length"); responseHeaders.delete("transfer-encoding");
  const setCookies = (upstream.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.();
  if (setCookies?.length) { responseHeaders.delete("set-cookie"); setCookies.forEach((cookie) => responseHeaders.append("set-cookie", cookie)); }
  const responseBody = [204, 205, 304].includes(upstream.status) ? null : await upstream.arrayBuffer();
  return new Response(responseBody, { status: upstream.status, headers: responseHeaders });
}
