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
  const retryable = request.method === "GET" || request.method === "HEAD" || headers.has("idempotency-key");
  const fetchUpstream = async (url: URL) => {
    try {
      return await fetch(url, { method: request.method, headers, body, cache: "no-store", redirect: "manual" });
    } catch (error) {
      // A dropped connection between the local proxy and the gateway should not
      // make an idempotent content-generation request look like a user error.
      if (!retryable) throw error;
      return fetch(url, { method: request.method, headers, body, cache: "no-store", redirect: "manual" });
    }
  };
  let upstream = await fetchUpstream(upstreamUrl);

  // Keep a same-origin API redirect inside the server proxy. Letting it reach the
  // browser could move an authenticated local request to the API origin directly.
  const location = upstream.headers.get("location");
  if (location && [301, 302, 307, 308].includes(upstream.status)) {
    const redirectUrl = new URL(location, upstreamUrl);
    if (redirectUrl.origin === upstreamUrl.origin) {
      upstream = await fetchUpstream(redirectUrl);
    }
  }
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding"); responseHeaders.delete("content-length"); responseHeaders.delete("transfer-encoding");
  const setCookies = (upstream.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.();
  if (setCookies?.length) { responseHeaders.delete("set-cookie"); setCookies.forEach((cookie) => responseHeaders.append("set-cookie", cookie)); }
  const responseBody = [204, 205, 304].includes(upstream.status) ? null : await upstream.arrayBuffer();
  return new Response(responseBody, { status: upstream.status, headers: responseHeaders });
}
