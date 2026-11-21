import { proxyBackend } from "@/lib/api/server-proxy";
import { resolveFrontendOrigins } from "@/lib/api/frontend-origins";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyBackend(request, (await params).path, {
    backendUrl: process.env.BACKEND_API_URL,
    frontendOrigins: resolveFrontendOrigins({
      FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN,
      VERCEL: process.env.VERCEL,
      VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
    }),
  });
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE,
  handler as PATCH, handler as HEAD, handler as OPTIONS };
