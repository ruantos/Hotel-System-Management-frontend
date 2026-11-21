import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/features/auth/auth-form";

export const metadata: Metadata = { title: "Criar conta" };
export default function RegisterPage() { return <div className="container"><Suspense fallback={<p className="empty-note">Preparando cadastro…</p>}><AuthForm mode="register" /></Suspense></div>; }
