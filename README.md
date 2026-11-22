# Maré Hotel — Sistema de Gerenciamento Hoteleiro

Frontend de um sistema de hotelaria, desenvolvido como trabalho acadêmico. Permite consultar quartos, realizar reservas e gerenciar quartos, características e reservas na área da recepção.

- **Aluno e único integrante:** Robson Juan Oliveira (00000859894)
- **Universidade:** Universidade Católica de Pernambuco
- **Disciplina:** Programação Front-end
- **Professor:** Márcio Bueno

## Acesso à aplicação

- [Aplicação publicada na Vercel](https://hotel-system-management-frontend.vercel.app/)
- [Entrar](https://hotel-system-management-frontend.vercel.app/entrar)
- [Cadastrar conta de cliente](https://hotel-system-management-frontend.vercel.app/cadastro)
- [Catálogo de quartos](https://hotel-system-management-frontend.vercel.app/quartos)
- [Documentação da API — Swagger](https://hotel-system-management-backend.onrender.com/docs/index.html)
- [Repositório do frontend](https://github.com/ruantos/-Hotel-System-Management-frontend-)

Para usar como cliente, crie uma conta em **Cadastrar**, faça login e escolha um quarto para solicitar uma reserva. As reservas ficam disponíveis em **Minhas reservas**. O cadastro não realiza login automaticamente.

Para acessar a gestão, entre com uma conta de **recepcionista** previamente cadastrada no backend. Esse perfil permite administrar quartos, características e reservas. O cadastro público cria somente contas de cliente.

## Tecnologias

Next.js, React, TypeScript, CSS Modules, TanStack Query e Zustand. O frontend consome a API existente, hospedada no Render.

## Instalação e configuração local

Requisitos: **Git, Node.js 24 e npm 12**. A versão de Node do projeto está em `.nvmrc`.

```bash
git clone https://github.com/ruantos/-Hotel-System-Management-frontend-.git hotel-management-front
cd hotel-management-front
npm ci
cp .env.example .env.local
```

Configure o arquivo `.env.local`:

```dotenv
BACKEND_API_URL=https://hotel-system-management-backend.onrender.com/api
FRONTEND_ORIGIN=http://localhost:3000
```

O backend utilizado é o serviço remoto no Render; não é necessário iniciar um backend local. Essas variáveis são usadas no servidor e não precisam do prefixo `NEXT_PUBLIC_`. Não versione `.env.local` ou credenciais.

Inicie o frontend:

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Verificação e execução de produção

Para executar lint, verificar tipos, rodar os testes e gerar o build:

```bash
npm run check
```

Para executar localmente em modo de produção:

```bash
npm run build
npm run start
```

## Deploy na Vercel

1. Entre na Vercel e escolha **Add New → Project**.
2. Conecte o GitHub, autorize o acesso ao repositório e importe o projeto.
3. Selecione a branch de produção e configure:

   | Configuração | Valor |
   | --- | --- |
   | Framework Preset | Next.js |
   | Root Directory | `./` |
   | Node.js Version | `24.x` |
   | Install Command | `npm ci` |
   | Build Command | `npm run build` |
   | Output Directory | Padrão do Next.js |

4. Cadastre as variáveis abaixo no ambiente **Production**:

   ```dotenv
   BACKEND_API_URL=https://hotel-system-management-backend.onrender.com/api
   FRONTEND_ORIGIN=https://hotel-system-management-frontend.vercel.app
   ```

   Em outro projeto da Vercel, substitua `FRONTEND_ORIGIN` pelo domínio correspondente, sem barra final. Preencha o nome e o valor em seus respectivos campos.

5. Mantenha **Automatically expose System Environment Variables** habilitado.
6. Clique em **Deploy**, aguarde o status **Ready** e teste o acesso e o login no domínio publicado.

O projeto utiliza rotas de servidor em `/api/backend`; mantenha a configuração padrão do Next.js, sem exportação estática. Alterações nas variáveis exigem um novo deploy. Alterações de código devem ser enviadas à branch conectada à Vercel.

## Limitação atual

A recuperação de senha está conectada no frontend, mas o backend retorna **HTTP 503 — recuperação temporariamente indisponível**. O envio de e-mails depende da habilitação e configuração desse serviço no Render.
