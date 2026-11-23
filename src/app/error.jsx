"use client";

import { CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function ErrorPage({ reset }) {
  return <div className="container"><EmptyState icon={<CloudOff size={32} />} title="Uma pequena pausa inesperada."
    action={<Button onClick={reset}>Tentar novamente</Button>}>
    <p>Não foi possível carregar esta página. Tente mais uma vez em alguns instantes.</p>
  </EmptyState></div>;
}
