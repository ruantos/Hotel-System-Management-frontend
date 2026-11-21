import { Suspense } from "react";
import { RecoveryForm } from "@/features/auth/recovery-form";

export default function RecoveryPage() {
  return <div className="container"><Suspense fallback={<p className="empty-note">Preparando recuperação…</p>}><RecoveryForm /></Suspense></div>;
}
