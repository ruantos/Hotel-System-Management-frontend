import { Suspense } from "react";
import { AuthForm } from "@/features/auth/auth-form";

export const metadata = { title: "Entrar" };
export default function SignInPage() { return <div className="container"><Suspense fallback={<p className="empty-note">Preparando acesso…</p>}><AuthForm mode="login" /></Suspense></div>; }
