import { Suspense } from "react";
import type { Metadata } from "next";
import { RecoveryForm } from "@/features/auth/recovery-form";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Redefinir senha", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function Page() { return <div className="container"><Suspense fallback={<p className="empty-note">Preparando redefinição…</p>}><RecoveryForm reset /></Suspense></div>; }
