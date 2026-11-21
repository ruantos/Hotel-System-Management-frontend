"use client";

import { useRoomTypes } from "@/features/rooms/queries";
import { QueryState } from "@/components/ui/feedback";

export function RoomTypesPage() {
  const types = useRoomTypes();
  return <><div className="workspace-heading"><span className="eyebrow">ACOMODAÇÕES</span><h1>Tipos de quarto</h1><p>Categorias disponíveis para a organização dos quartos.</p></div>
    <QueryState pending={types.isPending} error={types.error} onRetry={() => { void types.refetch(); }}>
      <div className="table-scroll"><table><caption>Tipos cadastrados</caption><thead><tr><th scope="col">Nome</th><th scope="col">Descrição</th></tr></thead><tbody>
        {types.data?.map((type) => <tr key={type.id}><td>{type.name}</td><td>{type.description || "Não informada"}</td></tr>)}</tbody></table>
        {!types.data?.length && <p className="empty-note">Nenhum tipo cadastrado.</p>}</div>
    </QueryState>
  </>;
}
