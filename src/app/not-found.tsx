import { Compass } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return <div className="container"><EmptyState icon={<Compass size={32} />} title="Vamos encontrar um novo caminho?"
    action={<ButtonLink href="/">Voltar ao início</ButtonLink>}>
    <p>Não encontramos a página que você procurou. Você pode voltar ao início para continuar explorando.</p>
  </EmptyState></div>;
}
