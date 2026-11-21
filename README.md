> Atualização de 21/11/2026: destino confirmado no Render e restaurado no frontend.
> Swagger remoto conferido: 36 operações, incluindo recuperação/redefinição.
> As rotas com entrada válida retornam 503, compatível com recuperação desabilitada.
> Frontend conectado; teste positivo de e-mail/token aguarda habilitação e SMTP remoto.
> Servidor local: http://localhost:3000. Nenhum backend Java local iniciado.
> [Relatório para o backend](reports/PASSWORD_RECOVERY_BACKEND_REPORT.md).

# Frontend — Sistema de Gerenciamento Hoteleiro

Este repositório implementa o **frontend de um sistema hoteleiro cujo
backend já está implementado**. O site oferecerá catálogo público, área do
cliente e gestão pela recepção, consumindo a API Spring Boot existente e os dados
persistidos no PostgreSQL.

**Estado em 20/11/2026:** etapas 1 a 7 implementadas no frontend, com BFF,
autenticação, própria conta, dois CRUDs, catálogo, reservas e telas da recepção.
O código usa a API real, sem banco paralelo ou dados fictícios como resultado.
A validação HTTP autenticada dos dois perfis, dos CRUDs e do ciclo de reservas
foi concluída pelo BFF. Inspeção visual, publicação e recuperação de senha
ainda permanecem pendentes; não equivale à entrega integral do escopo.

**Backend informado:** https://hotel-system-management-backend.onrender.com.
O OpenAPI publicado confirmou as 34 operações do contrato. Consultas públicas
retornaram 500 em uma execução anterior, mas **voltaram a responder com 200**
na nova validação. Login, rotação de sessão, permissões, conta, senha, cookies,
CSRF, logout, CRUDs e reservas foram exercitados no serviço real pelo BFF.

O nome **Maré Hotel** e as fotografias são editoriais/ilustrativos. Recuperação
de senha segue indisponível na API; as páginas correspondentes explicam essa
limitação e não simulam envio de e-mail. Foram preparados registros fictícios
novos para a demonstração; os dados preexistentes e a conta de recepção foram
preservados. Não houve alteração de código/configuração do backend ou acesso
direto ao PostgreSQL pelo frontend.

## Documentação consolidada

| Arquivo | Responsabilidade |
| --- | --- |
| [README.md](README.md) | Entrada do projeto, stack, configuração e referência dos contratos de integração |
| [AGENTS.md](AGENTS.md) | Orientações essenciais versionadas e referência às instruções detalhadas em Skill/ |
| [ESCOPO.md](docs/ESCOPO.md) | Produto, requisitos, telas, regras de negócio, plano por etapas, aceite e entrega acadêmica |

O plano detalhado está na [seção 8 do escopo](docs/ESCOPO.md#8-plano-de-implementação-e-desenvolvimento).
Ao alterar um contrato ou requisito, atualizar o documento responsável e suas
referências, evitando criar novas cópias do mesmo contexto.

## Stack e arquitetura

| Área | Tecnologia ou decisão |
| --- | --- |
| Interface | Next.js com App Router, React e TypeScript |
| Navegação | `next/link` e `next/navigation` |
| Estilos | CSS Modules, variáveis CSS e estilos globais |
| Dados remotos | TanStack Query para consultas, mutações e invalidação de cache |
| Estado da interface | Zustand para filtros compartilhados e preferências |
| Integração | Cliente HTTP centralizado e BFF em Route Handlers do Next.js |
| Publicação do frontend | Vercel, com execução de servidor para o BFF |
| Backend existente | Java 21, Spring Boot 4.1.1, Spring Data JPA/Hibernate e Spring Security |
| Banco e documentação da API | PostgreSQL, springdoc 3.2.0, Swagger/OpenAPI |
| Hospedagem prevista da API | Docker no Render e PostgreSQL remoto, descrito originalmente com Neon |

Versões iniciais instaladas: Node.js 24.20.0, npm 12.2.2, Next.js 16.4.6,
React/React DOM 19.3.1, TypeScript 5.9.3, TanStack Query 5.108.2, Zustand 5.1.0
e ESLint 10.15.0.
O `package-lock.json` fixa a árvore de dependências. Usar npm e a versão de Node
registrada em `.nvmrc`. As versões do backend também foram conferidas no pom local.

A configuração segue a [instalação oficial do Next.js](https://nextjs.org/docs/app/getting-started/installation),
a [instalação do TanStack Query](https://tanstack.com/query/latest/docs/framework/react/installation)
e o [store por provider recomendado pelo Zustand para Next.js](https://zustand.docs.pmnd.rs/learn/guides/nextjs).

```text
Navegador
  → Frontend Next.js /api/backend/*, na mesma origem do site
    → API Spring Boot /api/*
      → PostgreSQL
```

O BFF preserva o modelo de sessão existente quando frontend e API estão em
domínios diferentes. O navegador nunca acessa o banco. A autenticação usa sessão
HTTP. Não substituir a API e sua persistência por Back4App, Supabase ou
armazenamento local.

Organização por funcionalidades; as áreas ainda não implementadas serão adicionadas nas próximas etapas:

```text
src/
  app/                         rotas, layouts e estados de carregamento/erro
    api/backend/[...path]/     Route Handler do BFF
  features/
    auth/                      autenticação e própria conta
    rooms/                     catálogo e gestão de quartos
    amenities/                 características
    room-types/                tipos de quarto
    reservations/              reservas por perfil
    users/                     usuários e perfis de clientes
  components/ui/               componentes compartilhados
  lib/api/                     HTTP, CSRF e Problem Details
  providers/                   TanStack Query e providers necessários
  stores/                      Zustand
  types/                       contratos compartilhados
public/                        imagens e conteúdo editorial local
```

## Configuração e execução do frontend

Na raiz do repositório:

```bash
nvm install
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

Acessar `http://localhost:3000`. O Next.js cria os arquivos gerados em `.next/`.
A instalação inicial foi feita com o helper da skill Sites, respeitando npm e o
lockfile; em novos checkouts, `npm ci` é suficiente.

```dotenv
# Somente no servidor. Preparado para o BFF da etapa 2.
BACKEND_API_URL=https://hotel-system-management-backend.onrender.com/api
FRONTEND_ORIGIN=http://localhost:3000
```

O BFF lê essas variáveis no servidor. Para backend local, usar
`http://localhost:8080/api`. O `.env.local` deste trabalho foi criado com a URL
informada, sem credenciais; um arquivo existente é sempre preservado.
A interface mostra erro recuperável quando a API está indisponível.

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run lint` | ESLint com zero avisos permitidos |
| `npm run typecheck` | Geração de tipos de rota + TypeScript sem emissão |
| `npm run build` | Build de produção |
| `npm run start` | Execução local após o build |
| `npm test` | Testes focados de proxy, HTTP, sessão, contrato e regras de interface |
| `npm run smoke:backend` | Conferência HTTP real pelo BFF, com frontend iniciado |
| `npm run check` | Lint, tipos, testes e build em sequência |

O cliente chamará a base relativa `/api/backend`, sem uma variável pública para
o host da API. Na Vercel, configurar `BACKEND_API_URL` com a API HTTPS real e
`FRONTEND_ORIGIN` com a origem exata do site. Previews precisam de configuração
de origem compatível com a validação do BFF. Não usar exportação puramente
estática: o proxy depende de servidor.

Não versionar `.env.local`, senhas ou credenciais de demonstração. Não colocar
`DB_URL`, senhas de bootstrap ou segredos de e-mail em `NEXT_PUBLIC_*`.

## Plano de desenvolvimento e situação das etapas

| Etapa | Situação | Resultado e aceite restante |
| --- | --- | --- |
| 0 — Contrato e ambiente | Parcial | Contrato, contas e dados mínimos conferidos; equipe/autoria e prazos finais pendentes |
| 1 — Fundação | Implementada | Next.js, estilos, componentes, navegação, providers, DTOs e CI; inspeção visual pendente |
| 2 — Integração | Validada por HTTP local | BFF, cookies, CSRF, login válido e logout dos dois perfis; navegador/Vercel pendentes |
| 3 — Identidade | Validada por HTTP | Cadastro, perfis, login/logout, conta, senha e revogação exercitados; interação visual pendente |
| 4 — CRUDs | Validados por HTTP | Room/Amenity: criar, consultar, editar e excluir descartáveis, preservar N:N e recusar vínculos/duplicidade |
| 5 — Catálogo | Integrado à API | Dados reais de demonstração e disponibilidade; filtros testados localmente, inspeção visual pendente |
| 6 — Reservas | Validadas por HTTP | Concorrência, isolamento, aprovação, remarcação, cancelamento e conflitos exercitados |
| 7 — Entidades adicionais | Consultas validadas; autoria pendente | Tipos, usuários e perfis reais consultados; definir matriz nominal e inspecionar telas |
| 8 — Recuperação | Dependência externa | API de recuperação e envio real de e-mail ainda ausentes |
| 9 — Qualidade e Vercel | Parcial | 16 testes locais e 18 cenários HTTP reais aprovados; dados mínimos preparados; navegador e deploy pendentes |
| 10 — Entrega acadêmica | Pendente | Nomes, autoria, vídeo, PDF e Teams |

Desenvolvimento realizado em incrementos: infraestrutura HTTP → identidade e
conta → CRUDs → catálogo → reservas → telas adicionais → revisão e testes.
Consulta, mutação e atualização de cache estão ligadas à API, mas nenhum fluxo
não executado deve ser apresentado como validado.

O plano com dependências e critérios completos está em
[docs/ESCOPO.md](docs/ESCOPO.md#8-plano-de-implementação-e-desenvolvimento).
`docs/` e `Skill/` continuam ignorados pelo Git conforme a configuração existente;
o resumo acima e as instruções essenciais em AGENTS estão nos arquivos versionáveis.

### Verificação HTTP autenticada

Com o frontend iniciado, executar `npm run smoke:backend`. O script confere
consultas públicas, CSRF, cookies, sessão anônima e logout sem alterar registros
de negócio. Falhas de consultas não impedem a conferência do protocolo de sessão;
o comando termina com erro se alguma verificação falhar.

Para incluir login válido, permissões e consultas privadas, configurar somente
no `.env.local`, sem versionar ou enviar senhas na conversa:

```dotenv
HOTEL_SMOKE_CLIENT_EMAIL=EMAIL_DA_CONTA_DE_TESTE
HOTEL_SMOKE_CLIENT_PASSWORD=SENHA_DA_CONTA_DE_TESTE
HOTEL_SMOKE_RECEPTIONIST_EMAIL=EMAIL_DA_RECEPCAO_DE_TESTE
HOTEL_SMOKE_RECEPTIONIST_PASSWORD=SENHA_DA_RECEPCAO_DE_TESTE
```

As contas devem existir. O script não as cria, não imprime dados pessoais e
não cria reservas ou itens de CRUD. Demonstrações de escrita devem usar um
ambiente apropriado e registros descartáveis, preservando os mínimos acadêmicos.

### Validação real com dados de demonstração

O script `npm run validate:demo` é manual e não roda no CI. Ele exige conta de
recepção no ambiente e `HOTEL_DEMO_WRITE_ENABLED=true`, pois cria um novo conjunto
de registros fictícios a cada execução. Para somente conferir acesso e consultas,
usar `npm run smoke:backend`.

```bash
HOTEL_DEMO_WRITE_ENABLED=true npm run validate:demo
```

A execução realizada aprovou 18 cenários. Criou dois clientes, dois quartos,
duas características vinculadas e uma terceira característica sem vínculos
para vídeo, além de duas reservas futuras (uma aprovada e outra cancelada).
Os registros adicionais usados para exclusão foram removidos pelo contrato da API.
Os registros preexistentes foram preservados.

As credenciais dos clientes gerados estão apenas em `.env.local`, com permissão
600 e ignorado pelo Git, nas variáveis `HOTEL_SMOKE_CLIENT_EMAIL/PASSWORD` e
`HOTEL_DEMO_CLIENT2_EMAIL/PASSWORD`. A senha de recepção fornecida foi usada
somente na memória dos processos, por stdin oculto, sem ser gravada no projeto.
A string JDBC não foi inserida no frontend nem usada para acesso direto ao banco.
O relatório sem senhas fica em `.local/demo-validation.json`, também ignorado.

## Integração HTTP, sessão e CSRF

### Responsabilidades do BFF

- Upstream fixo em `BACKEND_API_URL`; permitir somente rotas e métodos
  documentados. Exemplo: `/api/backend/rooms` → `${BACKEND_API_URL}/rooms`.
- Encaminhar query string, corpo, `Content-Type`, cabeçalho CSRF e cookies da
  sessão do usuário. Um `fetch` no servidor não mantém um cookie jar sozinho.
- Devolver separadamente **todos** os `Set-Cookie`, incluindo rotação no login
  e remoção no logout. Preservar HttpOnly, SameSite, Secure e expiração; conferir
  Domain/Path válidos para a origem do frontend. A API documentada não fixa Domain.
- Preservar status, Problem Details e corpos vazios em `204`. Se expuser
  `Location`, reescrever somente a origem e o prefixo conhecidos para o BFF.
- Usar `no-store`, sem cache compartilhado de dados privados, cookies globais
  ou logs de credenciais/respostas pessoais.
- Validar `Origin` nas escritas contra `FRONTEND_ORIGIN`. Após validar, pode
  omitir esse cabeçalho no trecho servidor–servidor; se o repassar, autorizar a
  origem no CORS do Spring. Preservar a proteção CSRF em ambos os casos.
- Fazer inicialmente as consultas privadas no cliente via TanStack Query. SSR
  privado, se introduzido, exigirá cookies e cache isolados por requisição.

### Fluxo de autenticação

1. Consultar `GET /api/backend/auth/csrf`, preservando cookies. A resposta é
   `{ "headerName": "X-CSRF-TOKEN", "token": "VALOR_OPACO" }`.
2. Antes de **cada POST, PUT ou DELETE**, obter token atual e enviá-lo no
   cabeçalho indicado. Isso inclui cadastro, login e logout.
3. Login: `POST /api/backend/auth/login` com `URLSearchParams({ email, password })`
   e `Content-Type: application/x-www-form-urlencoded`. Não enviar JSON.
4. O sucesso retorna **204 sem JSON** e estabelece/renova `JSESSIONID` HttpOnly.
   Descartar o CSRF anterior e consultar `GET /api/backend/auth/me`.
5. O cadastro retorna o cliente, mas não autentica automaticamente. Encaminhar
   ao login ou executar explicitamente o mesmo fluxo de autenticação.
6. Logout: POST com CSRF atual; após `204`, remover caches privados e descartar
   o token. Se a chamada falhar, não informar que a sessão foi encerrada.
7. Atualizar a própria conta ou senha também encerra sessões. Após sucesso,
   limpar estado privado e solicitar novo login.

Usar `credentials: 'include'` no cliente. A sessão expira após 30 minutos de
inatividade e fica em memória no Spring. Reinício ou suspensão do serviço pode
exigir novo login; os registros do PostgreSQL permanecem.

No início da aplicação, `/auth/me` confirma a identidade. `401` pode representar
visitante ou sessão expirada, conforme o contexto. Falha de rede/`5xx` não deve
virar visitante silenciosamente. `403` pode indicar perfil sem permissão ou
CSRF inválido; não repetir mutações automaticamente.

Acesso direto à API pode auxiliar o desenvolvimento local com CORS e cookies,
usando o mesmo hostname (`localhost`, sem alternar com `127.0.0.1`). O fluxo
padrão continua pelo BFF. CORS e `credentials` não superam SameSite=Lax entre
sites diferentes; validar login, reload e logout na URL real da Vercel faz parte
do aceite. No acesso direto documentado, CORS aceita GET/POST/PUT/DELETE/OPTIONS,
`Content-Type` e `X-CSRF-TOKEN`, credenciais e expõe `Location`.

## Contrato da API existente

Referência documental do backend no commit `b688b32`, levantada em 20/11/2026.
O código local foi consultado, mas a API não estava em execução.
Conferir o contrato publicado em `/v3/api-docs` e `/swagger-ui.html` na etapa 0; registrar
divergências antes de integrar.

### Operações documentadas

As rotas abaixo são as do **Spring**, com prefixo `/api`. Para acessá-las pelo
BFF, substituir esse prefixo por `/api/backend`. São **34 operações**.
`Público` não dispensa CSRF nas escritas. `Dono` significa cliente proprietário.
Os corpos são JSON, exceto login. `—` significa sem corpo de requisição.

| Método | Endpoint | Acesso | Corpo → sucesso |
| --- | --- | --- | --- |
| GET | `/api/auth/csrf` | Público | — → `200 CsrfResponse` |
| POST | `/api/auth/register` | Público | `RegisterCustomerRequest` → `201 UserResponse` |
| POST | `/api/auth/login` | Público | formulário email/password → `204` |
| POST | `/api/auth/logout` | Sessão, ou encerramento anônimo com CSRF válido | — → `204` |
| GET | `/api/auth/me` | Autenticado | — → `200 UserResponse` |
| GET | `/api/users/me` | Autenticado | — → `200 UserResponse` |
| PUT | `/api/users/me` | Autenticado | `UpdateAccountRequest` → `200 UserResponse`; encerra sessão |
| PUT | `/api/users/me/password` | Autenticado | `ChangePasswordRequest` → `204`; encerra sessão |
| GET | `/api/users` | Recepcionista | — → `200 UserResponse[]` |
| GET | `/api/users/{id}` | Recepcionista | — → `200 UserResponse` |
| POST | `/api/users/receptionists` | Recepcionista | `RegisterReceptionistRequest` → `201 UserResponse` |
| DELETE | `/api/users/{id}` | Recepcionista | — → `204` |
| GET | `/api/room-types` | Público | — → `200 RoomTypeResponse[]` |
| GET | `/api/room-types/{id}` | Público | — → `200 RoomTypeResponse` |
| POST | `/api/room-types` | Recepcionista | `RoomTypeRequest` → `201 RoomTypeResponse` |
| PUT | `/api/room-types/{id}` | Recepcionista | `RoomTypeRequest` → `200 RoomTypeResponse` |
| DELETE | `/api/room-types/{id}` | Recepcionista | — → `204` |
| GET | `/api/amenities` | Público | — → `200 AmenityResponse[]` |
| GET | `/api/amenities/{id}` | Público | — → `200 AmenityResponse` |
| POST | `/api/amenities` | Recepcionista | `AmenityRequest` → `201 AmenityResponse` |
| PUT | `/api/amenities/{id}` | Recepcionista | `AmenityRequest` → `200 AmenityResponse` |
| DELETE | `/api/amenities/{id}` | Recepcionista | — → `204` |
| GET | `/api/rooms` | Público | — → `200 RoomResponse[]` |
| GET | `/api/rooms/{id}` | Público | — → `200 RoomResponse` |
| POST | `/api/rooms` | Recepcionista | `RoomRequest` → `201 RoomResponse` |
| PUT | `/api/rooms/{id}` | Recepcionista | `RoomRequest` → `200 RoomResponse` |
| DELETE | `/api/rooms/{id}` | Recepcionista | — → `204` |
| GET | `/api/rooms/{id}/availability` | Público | query de datas → `200 RoomAvailabilityResponse` |
| POST | `/api/reservations` | Cliente | `CreateReservationRequest` → `201 ReservationResponse` |
| GET | `/api/reservations` | Cliente: próprias; recepcionista: todas | — → `200 ReservationResponse[]` |
| GET | `/api/reservations/{id}` | Dono ou recepcionista | — → `200 ReservationResponse` |
| PUT | `/api/reservations/{id}/dates` | Dono ou recepcionista | `RescheduleReservationRequest` → `200 ReservationResponse` |
| PUT | `/api/reservations/{id}/approve` | Recepcionista | — → `200 ReservationResponse` |
| PUT | `/api/reservations/{id}/cancel` | Dono | — → `200 ReservationResponse` |

POSTs de quartos, tipos, características, reservas e recepcionistas retornam
`Location`; o cadastro público de cliente não define esse cabeçalho.
Não existem paginação, busca, ordenação configurável ou filtros por query nas
listas. Implementar filtros/paginação de apresentação no cliente, sem inventar
parâmetros. Quartos vêm ordenados por número; demais listas, por ID.
A listagem pública de quartos também retorna **inativos**; filtrar `active`
para o catálogo reservável, preservando a visualização administrativa.

### DTOs de referência

Tipos TypeScript de referência, transcritos dos DTOs Java. São referência para este
frontend, não código já implementado. IDs são números positivos
no uso desta aplicação. Campos opcionais de texto podem retornar `null`.

```ts
type UserRole = 'CLIENT' | 'RECEPTIONIST';
type ReservationStatus = 'PENDING' | 'APPROVED' | 'CANCELLED';
type LocalDate = string;     // YYYY-MM-DD
type LocalDateTime = string; // ISO sem offset/fuso

type CustomerProfileResponse = {
  id: number;
  phone: string | null;
  document: string | null;
};
type UserResponse = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  customerProfile: CustomerProfileResponse | null;
};
type CsrfResponse = { headerName: string; token: string };
type RegisterCustomerRequest = {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  document?: string | null;
};
type RegisterReceptionistRequest = {
  name: string; email: string; password: string;
};
type UpdateAccountRequest = {
  name: string; email: string;
  phone?: string | null; document?: string | null;
};
type ChangePasswordRequest = {
  currentPassword: string; newPassword: string;
};

type RoomTypeResponse = { id: number; name: string; description: string | null };
type AmenityResponse = { id: number; name: string; description: string | null };
type RoomTypeRequest = { name: string; description?: string | null };
type AmenityRequest = { name: string; description?: string | null };
type RoomRequest = {
  name?: string | null;
  number: number;
  typeId: number;
  description?: string | null;
  capacity: number;
  pricePerNight: number;
  active: boolean;
  amenityIds?: number[] | null;
};
type RoomResponse = {
  id: number;
  name: string | null;
  number: number;
  type: RoomTypeResponse;
  description: string | null;
  capacity: number;
  pricePerNight: number;
  active: boolean;
  createdAt: LocalDateTime;
  amenities: AmenityResponse[];
};
type CreateReservationRequest = {
  roomId: number;
  checkInDate: LocalDate;
  checkOutDate: LocalDate;
  guestCount: number;
};
type RescheduleReservationRequest = {
  checkInDate: LocalDate; checkOutDate: LocalDate;
};
type ReservationResponse = {
  id: number;
  customerProfileId: number;
  roomId: number;
  checkInDate: LocalDate;
  checkOutDate: LocalDate;
  guestCount: number;
  status: ReservationStatus;
  createdAt: LocalDateTime;
};
type RoomAvailabilityResponse = {
  roomId: number;
  checkInDate: LocalDate;
  checkOutDate: LocalDate;
  available: boolean;
};
type ApiProblem = {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errors?: Record<string, string>;
};
```

### Validações e mapeamento de formulários

- Nome e e-mail de conta: obrigatórios, máximo 255; e-mail válido e único,
  normalizado no servidor para minúsculas e sem espaços nas extremidades.
- Senhas novas: 8–128 caracteres, não vazias/nem só espaços. Senha atual:
  obrigatória, até 128. Não alterar a senha digitada com trim no cliente.
- Telefone/documento: opcionais, máximo 255; não há contrato de máscara,
  validação de CPF ou unicidade desses campos.
- Recepcionista tem `customerProfile: null`. Na atualização da sua conta, omitir
  `phone` e `document` ou enviar `null`; strings, inclusive vazias, são recusadas.
- `PUT /users/me` exige nome/e-mail novamente; omitir telefone/documento de um
  cliente apaga seus valores anteriores. ID, role e active não são editáveis.
- Nome de tipo/característica: obrigatório, máximo 255; descrição opcional,
  máximo 255. Não há unicidade de nome declarada nesses CRUDs.
- Quarto: número inteiro positivo e único; `typeId` existente; capacidade inteira
  positiva; diária de **0 a 99999999.99**, até duas casas; active obrigatório.
  Nome e descrição opcionais, máximo 255. Converter valores de inputs para
  número/booleano e enviar diária JSON como `180.50`, sem `R$` ou vírgula.
- Resposta de quarto contém **`type` aninhado**, não `typeId`; contém
  **`amenities` aninhadas**, não `amenityIds`. No formulário de edição,
  mapear `type.id` e `amenities.map(a => a.id)`.
- `amenityIds` omitido, `null` ou `[]` remove todas as associações, inclusive
  no PUT. Reenviar a seleção completa que se deseja preservar. IDs devem existir.
- PUTs substituem os campos do DTO; não tratá-los como PATCH.
- Reserva retorna apenas IDs de quarto e perfil, sem quarto/cliente aninhado e
  sem valor total. Recepção pode associar `customerProfileId` a
  `UserResponse.customerProfile.id` a partir de `/users`; não confundir com User.id.
  Cliente não deve chamar `/users` para montar sua tela.
- A API não fornece imagens, upload, endereço do hotel, total de hospedagem ou
  endpoint de dashboard. Usar assets locais e conteúdo editorial identificado;
  indicadores são derivados das listas permitidas. Não inventar campos persistidos.

### Exemplos de payload

Quarto, tanto no POST quanto no PUT, com IDs reais obtidos pelas consultas:

```json
{
  "name": "Jardim 101",
  "number": 101,
  "typeId": 1,
  "description": "Acomodação com vista para o jardim",
  "capacity": 2,
  "pricePerNight": 180.50,
  "active": true,
  "amenityIds": [1, 2]
}
```

Reserva; trocar os exemplos por datas válidas no dia da execução:

```json
{
  "roomId": 1,
  "checkInDate": "2027-01-10",
  "checkOutDate": "2027-01-12",
  "guestCount": 2
}
```

Disponibilidade usa query obrigatória:
`GET /api/rooms/1/availability?checkInDate=2027-01-10&checkOutDate=2027-01-12`.
Alteração de datas recebe somente `checkInDate` e `checkOutDate`.
Tipos e características recebem `{ "name": "Wi-Fi", "description": "Internet" }`
(usar um nome coerente com a entidade).

### Erros e comportamento da interface

Erros de API usam `application/problem+json`. Exemplo de validação:

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Verifique os campos informados.",
  "errors": { "name": "O nome é obrigatório." }
}
```

| Status | Significado e tratamento |
| --- | --- |
| `400` | Campos/datas/parâmetros inválidos ou senha atual incorreta; exibir `errors` junto aos campos e `detail` no formulário |
| `401` | Credenciais inválidas ou sessão ausente/expirada/revogada; tratamento conforme o contexto de login ou área privada |
| `403` | Perfil sem permissão ou CSRF inválido/ausente; orientar e diagnosticar sem repetir escrita cegamente |
| `404` | Recurso inexistente; também oculta reserva de outro cliente; mostrar página/estado de não encontrado |
| `409` | Duplicidade, vínculo, indisponibilidade ou regra de transição; preservar inputs e explicar pelo `detail` |
| Rede/`5xx` | Estado recuperável com tentativa manual; não afirmar que uma gravação falhou antes de verificar seu resultado |

O parser HTTP deve aceitar corpo vazio em `204`, reconhecer Problem Details e
ter mensagem segura para respostas inesperadas de infraestrutura. Não confundir
erro de rede/CORS com ausência de dados. Não renderizar erros via HTML injetado.

### Recuperação de senha

**Ausente na API atual.** A troca autenticada de senha não atende à recuperação
de acesso. O contrato novo proposto e a dependência do responsável pelo backend
estão na [seção 7 do escopo](docs/ESCOPO.md#7-dependência-externa-recuperação-de-senha).
Essas rotas não integram as 34 operações acima. As regras de negócio de reservas
e exclusões estão na seção 5 do escopo.

## Referência operacional do backend externo

Esta seção preserva informações necessárias para a integração. Maven, Java e
Docker são executados **no repositório do backend**, não neste frontend.

O backend requer Java 21 e PostgreSQL acessível. No projeto Java, copiar seu
`.env.example` para `.env`, configurar `DB_URL` sem aspas e executar
`./mvnw clean compile` e `./mvnw spring-boot:run` (`mvnw.cmd` no Windows).
Caracteres especiais das credenciais JDBC precisam de codificação de URL.
O `.env` é lido a partir do diretório de execução.

| Configuração do backend | Finalidade |
| --- | --- |
| `DB_URL` | `jdbc:postgresql://HOST/BANCO?user=USUARIO&password=SENHA&sslmode=require` |
| `PORT` / `SERVER_PORT` | Porta; padrão 8080 |
| `HOTEL_TIME_ZONE` | Calendário das reservas; padrão `America/Recife` |
| `CORS_ALLOWED_ORIGINS` | Origens exatas; padrões locais `http://localhost:5173,http://localhost:3000` |
| `SESSION_COOKIE_SECURE` | `false` no HTTP local; `true` no HTTPS de produção |
| `SERVER_FORWARD_HEADERS_STRATEGY` | `framework` na configuração documentada de produção |
| `BOOTSTRAP_RECEPTIONIST_ENABLED` | `false` por padrão; habilitar somente para a recepção inicial |
| `BOOTSTRAP_RECEPTIONIST_NAME`, `BOOTSTRAP_RECEPTIONIST_EMAIL`, `BOOTSTRAP_RECEPTIONIST_PASSWORD` | Credenciais privadas do bootstrap; senha de 8–128 caracteres |

O bootstrap cria recepcionista somente se nenhum existir; não promove clientes,
sobrescreve senhas ou duplica contas. Depois, desativar e remover a senha da
configuração. Novos recepcionistas usam a rota autenticada própria.

O banco usa `ddl-auto=update`: o usuário precisa das permissões de esquema e a
inicialização pode alterar tabelas. Não executá-la inadvertidamente contra banco
compartilhado. Normal/Suíte são criados quando ausentes. Isso não garante os
demais dados de demonstração nem substitui migrações de dados/renomeações.

O deploy descrito na origem usa Docker no Render: Dockerfile do backend, porta
fornecida pelo serviço, `DB_URL` no ambiente e `/api/room-types` como consulta
pública para verificação de disponibilidade. O Dockerfile original compila com
Maven/Java e executa o JAR com usuário sem privilégios. Não há Dockerfile neste
frontend. Suspensão do serviço pode atrasar o primeiro acesso e encerrar sessões.

Na origem, controllers/DTOs definem contratos; services definem regras;
`SecurityConfig`, `SessionValidationFilter` e os tratadores de erro definem
permissões, revogação e erros. OpenAPI e o script local do Swagger documentam
também login/logout e a renovação de CSRF. Esses caminhos pertencem ao projeto
Java; não são arquivos esperados aqui. As seis entidades e suas cardinalidades
estão descritas no escopo. Hash de senha e campos internos não são expostos.

## Situação e informações a preencher

| Item | Situação |
| --- | --- |
| Frontend | Etapas 1–7 implementadas e validadas por HTTP; inspeção visual e publicação pendentes |
| Recuperação de senha | Dependência de nova implementação no backend |
| Repositório GitHub do frontend | A preencher |
| Repositório GitHub do backend | A preencher |
| API HTTPS / Swagger | [Swagger informado](https://hotel-system-management-backend.onrender.com/docs/index.html); 34 operações conferidas e nova validação real aprovada |
| Site Vercel | A preencher após publicação |
| Ambiente e contas de demonstração | Dados preparados e dois perfis validados; clientes fictícios em .env.local, sem credenciais neste documento |
| Nome/identidade do hotel | Maré Hotel, proposta provisória a confirmar pela equipe |
| YouTube / PDF | A produzir; requisitos no escopo |
| Data sorteada / prazo do Teams | Confirmar; apresentações previstas para 30/11/2026 ou 03/12/2026 |

| Nome completo de todos os integrantes | Responsabilidade | Evidências de contribuição |
| --- | --- | --- |
| A preencher conforme equipe real | Vincular à matriz de telas do escopo | Commits/PRs reais a preencher |

## Origem da consolidação e limites da análise

Em 20/11/2026 foram consolidados os cinco documentos recebidos: `README.md`
anterior (orientado ao backend), `Skill/AGENTS.md`, `docs/PROJECT_CONTEXT.md`,
`docs/BACKEND_CONTEXT.md` e `docs/ESCOPO_FRONTEND.md`. O conteúdo aplicável foi
distribuído entre README, instruções e escopo; as cópias antigas foram removidas.
Na organização atual, as instruções detalhadas ficam em Skill/ e o escopo em docs/.

Foram corrigidas as referências a este repositório como projeto Java e à
integração frontend como trabalho adiado. Os relatos anteriores de compilação
e validação manual no PostgreSQL pertencem ao backend de origem: não comprovam
integração, deploy ou testes executados neste frontend. Na consolidação documental inicial não foi executada aplicação. A validação
da primeira etapa do frontend é registrada abaixo; o backend/banco não foram iniciados.

## Fotografias e identidade editorial

Marca provisória, sem vínculo com hotel real. Imagens locais ilustrativas do Unsplash:

- `public/images/hotel-pool.jpg`: [catálogo de fotografias de hotel](https://unsplash.com/s/photos/green-hotel), identificação `photo-1678913308053-316cee77afe9`.
- `public/images/hotel-room.jpg`: [fotografia do quarto](https://unsplash.com/photos/a-bed-in-a-hotel-room-GOzvLXx4E-E), identificação `photo-1652161854125-1f5289c13eac`.

As fotografias não são imagens persistidas de quartos retornados pelo backend.
A interface usa fontes do sistema, sem download de fontes durante o build.

## Verificações da primeira etapa — 20/11/2026

| Verificação executada | Resultado |
| --- | --- |
| Instalação e reinstalação por `npm ci` | Aprovadas; lockfile reproduzido |
| `npm run lint` | Aprovado com ESLint 10 e zero avisos de lint |
| `npm run typecheck` | Aprovado; tipos de rota gerados e TypeScript sem erros |
| `npm run build` | Aprovado; páginas estáticas geradas pelo Next.js |
| HTTP de `/`, `/quartos`, `/entrar` | 200, conteúdo esperado e idioma pt-BR |
| Página inexistente | 404 com conteúdo próprio |
| Fotografias, ícone e otimizador de imagens | 200 e tipo de imagem correto |
| Arquivos JavaScript/CSS referenciados | 14 recursos retornaram 200 |
| Estado de busca | Instâncias isoladas e datas de estadia preservadas no ensaio direto do store |
| Documentação e contratos | Links locais/âncoras e correspondência dos DTOs conferidos |
| Navegador, celular/desktop e interação visual | Pendente: host de acesso ao navegador indisponível |
| Integração real, sessão, CSRF e deploy | Pendentes das próximas etapas |

O sandbox não devolveu a saída do subprocesso TypeScript no primeiro build.
O mesmo build passou fora dessa restrição, mantendo a verificação de tipos
habilitada. Não foi necessário desativar validações ou alterar o backend.

A instalação com ESLint 10 emitiu avisos de peer dependency de plugins transitivos
cuja faixa declarada ainda termina no ESLint 9. `npm ci`, lint, tipos e build
passaram com a árvore instalada; acompanhar a atualização desses metadados nas
próximas revisões. O npm informou zero vulnerabilidades na instalação auditada.

O [workflow de CI](.github/workflows/ci.yml) prepara instalação, lint, tipos e
build no GitHub Actions, com as ações dos exemplos oficiais de
[checkout](https://github.com/actions/checkout) e
[setup-node](https://github.com/actions/setup-node). O workflow ainda não foi
executado remotamente. O servidor de validação local foi encerrado após os checks;
executar `npm run dev` para voltar a abrir a interface.

## Histórico inicial das etapas 2–7 — 20/11/2026

| Verificação | Resultado observado |
| --- | --- |
| OpenAPI publicado | 34 operações; fixture de contrato confrontada com a lista permitida do BFF |
| Lint / TypeScript / build | Aprovados no último ciclo completo |
| Testes focados | 16 aprovados, incluindo cookies múltiplos, Origin, 204, CSRF, cache tardio, redirecionamento e regras de prazo |
| HTTP de páginas | Build final: 18 rotas de navegação com 200/pt-BR; 404 personalizado e recusas 404/405/403 do BFF conferidos; sem inspeção visual/interativa |
| Rota inexistente | 404 personalizado; em rotas dinâmicas o Next pode transmitir not-found após iniciar resposta 200 |
| Consultas públicas reais | Inicialmente 200: rooms 0, room-types 2 e amenities 0; depois 500 em todas as três, também no acesso direto |
| Protocolo real pelo BFF | CSRF 200 com cookie, auth/me anônimo 401, logout 204 e auth/me após logout 401 |
| Cadastro/login válido/conta/senha/CRUDs/reservas | Código implementado; execução real pendente de credenciais e ambiente funcional |
| Recuperação de senha | Não implementada: nova API necessária |
| Navegador e Vercel | Não verificados; host de acesso ao navegador indisponível e site ainda não publicado |

O comando `npm run smoke:backend` terminou com erro nas três consultas de dados
por causa dos HTTP 500 do backend; a verificação independente de sessão anônima,
CSRF, cookie e logout passou. Credenciais dos dois perfis ainda não foram configuradas.

As verificações reais não criaram nem alteraram dados de negócio. Os testes
locais usam respostas controladas somente para exercitar fronteiras do código;
não substituem a validação da API e do PostgreSQL. Nenhum teste automatizado ou
banco foi adicionado ao backend Java. O servidor temporário usado para conferir
o build foi encerrado ao final.

## Validação autenticada e demonstração — 20/11/2026

A nova execução substitui os impedimentos de credenciais e HTTP 500 registrados
na verificação anterior. Não foi identificada a causa do erro anterior; o serviço
respondeu corretamente durante todos os cenários descritos abaixo.

| Área | Evidência HTTP real pelo cliente compartilhado e BFF |
| --- | --- |
| Recepção e cliente | Login 204, rotação de sessão, auth/me, users/me, permissões e logout verificados nos dois perfis |
| Cadastro | Dois CLIENT com CustomerProfile; cadastro não autentica automaticamente; CLIENT recebe 403 em users |
| Conta e senha | Edição de conta/senha encerra sessão; novo login exigido; senha anterior recusada após troca |
| Amenity | Criação, consulta, edição, exclusão descartável e recusa de exclusão vinculada |
| Room | Criação, consulta, edição completa e exclusão descartável; preservação de amenityIds e recusa de número duplicado |
| Concorrência | Duas solicitações simultâneas do mesmo período produziram uma reserva aceita e um 409 |
| Reservas | PENDING → APPROVED; remarcação volta a PENDING; datas idênticas preservam APPROVED |
| Isolamento e perfis | Cliente alheio recebe 404 na reserva; CLIENT não aprova; RECEPTIONIST não cancela |
| Disponibilidade | Pendente bloqueia; datas adjacentes são livres; remarcação libera período antigo; cancelamento libera novo período |
| Restrições | Período ocupado recusado sem alterar reserva; capacidade incompatível, quarto inativo e exclusões com vínculo recusados |
| Persistência | Novas consultas da API confirmaram objetos e estados gravados |

Contagens totais conferidas: **User 5, CustomerProfile 3, RoomType 2, Amenity 3,
Room 2 e Reservation 2**. Todos os seis mínimos acadêmicos estão atendidos nesta
verificação. Foram preservados os objetos anteriores e a conta administrativa.

A validação acima é HTTP, não inspeção de interações em navegador. Permanecem
pendentes a inspeção visual, a sessão na Vercel, a matriz de autoria e os materiais
acadêmicos. O código local do backend contém controller/DTOs de recuperação,
mas o OpenAPI publicado ainda não expõe essas rotas; a integração desse recurso
aguarda sua publicação e a configuração de envio real de e-mail.
