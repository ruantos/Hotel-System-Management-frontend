# Relatório ao responsável pelo backend — recuperação de senha

Data: **21/11/2026**. Ambiente: **Render remoto**, confirmado pelo usuário.
Frontend local: **http://localhost:3000**. Nenhum backend Java ou SMTP local foi iniciado.

## Resultado

**As rotas estão publicadas e o frontend está conectado. A recuperação não está operacional: chamadas com formato válido retornam HTTP 503.**

Swagger: https://hotel-system-management-backend.onrender.com/docs/index.html

OpenAPI: https://hotel-system-management-backend.onrender.com/v3/api-docs

O OpenAPI atual contém **36 operações**, incluindo POST `/api/auth/forgot-password` e POST `/api/auth/reset-password`.
O próprio Swagger documenta 503 como “Recuperação de senha desabilitada no ambiente”.
A restrição anterior de destino Vercel foi corrigida após a confirmação do usuário: o destino vigente é Render.

## Evidências reais, passando pelo BFF

| Caso | Esperado com serviço habilitado | Observado |
| --- | --- | --- |
| Escrita sem CSRF | 403 | 403 na nova tentativa com serviço aquecido |
| E-mail malformado | 400 / errors.email | 400 / errors.email |
| Pedido válido para e-mail inexistente de teste | 202 / mensagem genérica | **503** |
| Token malformado | 400 / errors.token | 400 / errors.token |
| Token sintético inexistente, em formato válido | 400 | **503** |
| Nova senha curta | 400 / errors.newPassword | 400 / errors.newPassword |

Resposta das duas chamadas com 503:

```json
{
  "status": 503,
  "detail": "A recuperação de senha está temporariamente indisponível."
}
```

O código local de `PasswordResetService.requireEnabled()` lança exatamente essa mensagem quando `app.password-reset.enabled` está false. A configuração mapeia essa propriedade a `PASSWORD_RESET_ENABLED`, com padrão false. Isso sustenta o diagnóstico de funcionalidade desabilitada; não foram consultadas ou modificadas as variáveis do Render diretamente.

Na inicialização houve timeout na primeira leitura do OpenAPI e um 502 na preparação do primeiro teste CSRF pelo BFF. Após o serviço responder, o OpenAPI foi obtido e o caso sem CSRF foi repetido isoladamente, retornando 403. Não houve repetição automática de uma mutação de negócio.

Evidência estruturada sanitizada: [password-recovery-render-results.json](password-recovery-render-results.json).
Nenhum token real, senha, cookie ou endereço de conta foi registrado. Os pedidos usaram e-mail inexistente e tokens sintéticos; nenhuma senha foi alterada.

## Ações necessárias no Render

1. Conferir e habilitar `PASSWORD_RESET_ENABLED=true` no serviço remoto, com reinício/redeploy se necessário.
2. Configurar SMTP remoto: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` e opções de autenticação/TLS compatíveis. Verificar a conectividade de saída para o provedor no plano Render utilizado.
3. Definir `PASSWORD_RESET_FROM` para remetente aceito pelo provedor.
4. Para a validação local do frontend, definir `PASSWORD_RESET_FRONTEND_URL=http://localhost:3000/redefinir-senha`; usar a origem HTTPS final quando o frontend for publicado.
5. Manter a validade e o intervalo de reenvio documentados (`PASSWORD_RESET_TOKEN_TTL`, `PASSWORD_RESET_RESEND_COOLDOWN`).
6. Disponibilizar conta de teste com caixa controlada pela equipe ou capturador SMTP remoto acessível. Endereços `.invalid` não recebem e-mail externo; um capturador em localhost não é acessível pelo backend hospedado no Render.

Não colocar credenciais SMTP/banco no frontend nem expor tokens nos logs. O backend não foi modificado por este trabalho.

## Como reproduzir

Com o frontend iniciado e o upstream Render configurado:

```bash
npm run check:recovery
```

Esse comando executa seis verificações de contrato/erros pelo BFF, sem e-mail de pessoa real e sem trocar senhas. Ele retorna erro se um status divergir do esperado com o serviço habilitado. Não testa entrega de e-mail nem faz teste de carga/429 no serviço compartilhado.

Para o teste positivo, após habilitar o serviço: solicitar link de conta controlada, confirmar recebimento, redefinir senha temporária, verificar senha anterior recusada/nova aceita, revogação de sessão e rejeição de token reutilizado. Restaurar a senha original da conta de teste ao final. Esses cenários continuam **pendentes**, sem contornar a entrega real do token.

## Situação do frontend

- Formulários de solicitação e redefinição implementados, confirmação de senha e retorno ao login.
- BFF libera os dois POST, mantém cookies/CSRF e propaga Retry-After.
- 503 é exibido como erro; o frontend não simula solicitação aceita ou e-mail enviado.
- Token de 43 caracteres em memória, sem Zustand/localStorage; removido da URL após captura.
- Página de reset com no-referrer/noindex/no-store; sessão/cache privado limpos após sucesso 204.
- 20 testes locais aprovados. Inspeção visual/interativa em navegador permanece pendente.
- Demais funcionalidades têm implementação e validação HTTP anterior de 18 cenários: conta/senha, CRUDs, vínculos, reservas e perfis.
- Ainda faltam publicação do frontend, homologação em navegador, versionamento/CI remoto, autoria e materiais acadêmicos.
