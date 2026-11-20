# Frontend — Sistema de Gerenciamento Hoteleiro

Este repositório será responsável pelo **frontend de um sistema hoteleiro cujo
backend já está implementado**. O site oferecerá catálogo público, área do
cliente e gestão pela recepção, consumindo a API Spring Boot existente e os dados
persistidos no PostgreSQL.

**Estado em 20/11/2026:** há somente documentação neste diretório. Ainda não há
aplicação Next.js, `package.json`, lockfile, BFF ou deploy verificado. Os recursos
descritos abaixo são contratos herdados e decisões de implementação, não
funcionalidades já entregues pelo frontend.

## Documentação consolidada

| Arquivo | Responsabilidade |
| --- | --- |
| [README.md](README.md) | Entrada do projeto, stack, configuração e referência dos contratos de integração |
| [AGENTS.md](AGENTS.md) | Instruções para implementar, organizar e verificar alterações neste repositório |
| [ESCOPO.md](ESCOPO.md) | Produto, requisitos, telas, regras de negócio, plano por etapas, aceite e entrega acadêmica |

O plano detalhado está na [seção 8 do escopo](ESCOPO.md#8-plano-de-implementação-e-desenvolvimento).
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

As versões do backend acima são as registradas no levantamento herdado. As
versões de Node.js, Next.js, React e demais dependências do frontend serão
validadas e fixadas na etapa de fundação. Usar npm como padrão inicial e
versionar `package-lock.json`; se já existir outro lockfile no início da
implementação, preservar o gerenciador correspondente.

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

Organização proposta, a criar durante a implementação:

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

Os comandos desta seção serão utilizáveis **depois da etapa 1**, quando a
aplicação, os scripts e o lockfile forem criados. No estado atual não há build
ou servidor frontend para executar.

1. Instalar a versão de Node.js definida na etapa 1 e registrada no projeto.
2. Executar `npm ci` após obter o repositório com o lockfile.
3. Copiar o futuro `.env.example` para `.env.local` e preencher:

   ```dotenv
   # Variáveis privadas do servidor Next.js.
   # A URL inclui /api e não termina com barra.
   BACKEND_API_URL=http://localhost:8080/api
   FRONTEND_ORIGIN=http://localhost:3000
   ```

4. Disponibilizar a API existente em outra aplicação/serviço.
5. Executar `npm run dev` e acessar `http://localhost:3000`.

Scripts a disponibilizar na fundação:

| Comando previsto | Finalidade |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run lint` | Análise estática |
| `npm run typecheck` | Verificação de tipos TypeScript |
| `npm run build` | Build de produção |
| `npm run start` | Execução local do build |

O cliente chamará a base relativa `/api/backend`, sem uma variável pública para
o host da API. Na Vercel, configurar `BACKEND_API_URL` com a API HTTPS real e
`FRONTEND_ORIGIN` com a origem exata do site. Previews precisam de configuração
de origem compatível com a validação do BFF. Não usar exportação puramente
estática: o proxy depende de servidor.

Não versionar `.env.local`, senhas ou credenciais de demonstração. Não colocar
`DB_URL`, senhas de bootstrap ou segredos de e-mail em `NEXT_PUBLIC_*`.

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
O código da API e sua instância em execução não estão presentes nesta análise.
Conferir o contrato em `/v3/api-docs` e `/swagger-ui.html` na etapa 0; registrar
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
estão na [seção 7 do escopo](ESCOPO.md#7-dependência-externa-recuperação-de-senha).
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
| Frontend, BFF e verificações | Planejados; implementação ainda não iniciada |
| Recuperação de senha | Dependência de nova implementação no backend |
| Repositório GitHub do frontend | A preencher |
| Repositório GitHub do backend | A preencher |
| API HTTPS / Swagger | A preencher e verificar |
| Site Vercel | A preencher após publicação |
| Ambiente e contas de demonstração | A preparar; credenciais fora dos documentos |
| Nome/identidade do hotel | A definir pela equipe |
| YouTube / PDF | A produzir; requisitos no escopo |
| Data sorteada / prazo do Teams | Confirmar; apresentações previstas para 30/11/2026 ou 03/12/2026 |

| Nome completo de todos os integrantes | Responsabilidade | Evidências de contribuição |
| --- | --- | --- |
| A preencher conforme equipe real | Vincular à matriz de telas do escopo | Commits/PRs reais a preencher |

## Origem da consolidação e limites da análise

Em 20/11/2026 foram consolidados os cinco documentos recebidos: `README.md`
anterior (orientado ao backend), `Skill/AGENTS.md`, `docs/PROJECT_CONTEXT.md`,
`docs/BACKEND_CONTEXT.md` e `docs/ESCOPO_FRONTEND.md`. O conteúdo aplicável foi
distribuído nos três documentos da raiz; as cópias antigas foram removidas para
evitar orientações conflitantes e links quebrados.

Foram corrigidas as referências a este repositório como projeto Java e à
integração frontend como trabalho adiado. Os relatos anteriores de compilação
e validação manual no PostgreSQL pertencem ao backend de origem: não comprovam
integração, deploy ou testes executados neste frontend. Nenhuma API, banco ou
aplicação foi executada durante esta consolidação documental.
