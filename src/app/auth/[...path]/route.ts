import { NextRequest } from "next/server";
import { proxyGatewayRequest } from "@/lib/server/gateway-proxy";

type Context = { params: Promise<{ path: string[] }> };
const handle = async (request: NextRequest, { params }: Context) => proxyGatewayRequest(request, ["auth", ...(await params).path]);
export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
