# Login na Vercel — validação de origem

Data: 21/11/2026. Frontend: https://hotel-system-management-frontend.vercel.app.
Backend: Render remoto, sem alterações no código ou na configuração desse serviço.

## Evidência no deploy atual

O POST `/api/backend/auth/login` com
`Origin: https://hotel-system-management-frontend.vercel.app` retornou **403**:

```json
{"detail":"Origem da solicitação não permitida."}
```

O mesmo teste com origem externa também retornou 403. `x-vercel-cache: MISS`
nas duas chamadas. Os pedidos usaram uma conta sintética inexistente; não houve
alteração de senha nem gravação de dados de negócio. O BFF recusa a origem antes
de consultar o backend, portanto esses pedidos não validam as credenciais.

Em verificações HTTP anteriores no mesmo domínio, `/`, `/quartos`, `/entrar`,
`/cadastro`, `/esqueci-minha-senha`, `/redefinir-senha`,
`/api/backend/rooms` e `/api/backend/auth/csrf` responderam 200.
`/api/backend/auth/me` respondeu 401 sem autenticação, como esperado.
Não foi possível inspecionar visualmente o site: host do navegador indisponível.

## Diagnóstico e mudança

A implementação anterior dependia exclusivamente da igualdade literal entre
`Origin` e `FRONTEND_ORIGIN`. Configuração ausente, domínio divergente, espaços
externos ou barra final produziam a mesma mensagem. O usuário confirmou um novo
deploy após alterar a variável, e a recusa continuou. Não há acesso ao painel
para confirmar o valor efetivo recebido pelo processo de produção; não foi
comprovado qual dessas configurações está presente no serviço.

A correção normaliza espaços externos e barra final somente na configuração,
recusa URLs com caminhos/credenciais/query/fragmento e adiciona à lista de
origens os domínios exatos do projeto fornecidos pela Vercel quando `VERCEL=1`:

- `VERCEL_PROJECT_PRODUCTION_URL`;
- `VERCEL_URL`;
- `VERCEL_BRANCH_URL`.

Nenhum domínio é obtido de `Host`, `Forwarded` ou `X-Forwarded-Host`.
Não há liberação genérica de `*.vercel.app`. Origem ausente, `null`, outro
projeto, subdomínio malicioso e protocolo divergente continuam bloqueados.
Cookies, CSRF e destino fixo do backend permanecem preservados.

Referência: [variáveis de sistema da Vercel](https://vercel.com/docs/environment-variables/system-environment-variables).

## Validação da correção antes da publicação

`npm run check` aprovado: lint, TypeScript, **23 testes** e build de produção.
Os testes novos cobrem normalização, configuração ausente/desatualizada com
domínios da Vercel, origens externas/ausentes e cabeçalhos de host forjados.
A primeira execução restrita não concluiu o subprocesso TypeScript do build;
a execução completa fora dessa restrição passou em todas as etapas.

O build corrigido foi iniciado temporariamente em `127.0.0.1:3001`, enviando
as chamadas ao **Render real**. Para reproduzir a dependência da configuração,
o processo recebeu `FRONTEND_ORIGIN=http://localhost:3000` e o domínio público
correto em `VERCEL_PROJECT_PRODUCTION_URL`, com `VERCEL=1`.
As requisições usaram a origem pública; não houve liberação baseada no host local.

| Caso | Resultado |
| --- | --- |
| Origem externa ou ausente | 403 no BFF |
| Origem publicada, sem token CSRF | 403 no backend, mantendo CSRF obrigatório |
| Origem publicada, CSRF válido e credenciais sintéticas | 401 no backend |
| Login CLIENT e RECEPTIONIST | 204 nos dois perfis |
| Consulta da sessão após login | 200 e perfil correto nos dois casos |
| Consulta de reservas | 200 nos dois perfis |
| Consulta administrativa de usuários | CLIENT 403; RECEPTIONIST 200 |
| Logout | 204 nos dois perfis; consulta posterior da sessão 401 |

Credenciais centrais foram lidas somente no processo, sem registro de valores,
cookies ou tokens. Não houve criação/edição/exclusão de dados de negócio.
O servidor temporário foi encerrado; o servidor local principal foi preservado.
Isso valida o build corrigido com o Render, mas **não comprova que a correção já
está publicada na Vercel**.

## Publicação e aceite

1. Publicar o commit que contém a correção do BFF e `frontend-origins.ts`.
2. Manter **Automatically expose System Environment Variables** habilitado.
3. Manter `BACKEND_API_URL` apontando para o Render e, preferencialmente,
   `FRONTEND_ORIGIN=https://hotel-system-management-frontend.vercel.app`.
4. Confirmar que o novo deploy está Ready, em Production, associado ao domínio.
5. Obter CSRF/cookie e repetir login com uma conta de demonstração. Esperado:
   login 204, `/auth/me` 200, acesso compatível com o perfil e logout 204.
6. Repetir com origem externa: esperado 403 antes de acessar o backend.

Uma repetição do deploy do commit antigo não inclui a correção de código.
O aceite remoto permanece pendente até a publicação desta alteração.
