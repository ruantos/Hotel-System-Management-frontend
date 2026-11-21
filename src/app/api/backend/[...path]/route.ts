import { proxyBackend } from "@/lib/api/server-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyBackend(request, (await params).path, {
    backendUrl: process.env.BACKEND_API_URL,
    frontendOrigin: process.env.FRONTEND_ORIGIN,
  });
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE,
  handler as PATCH, handler as HEAD, handler as OPTIONS };
