# Sistema de Acompanhamento de Demandas de Desenvolvimento

> **Projeto Integrador II — Time 27 (PI-II-TIME-27)**  
> **Curso:** Engenharia de Software  
> **Instituição:** Pontifícia Universidade Católica de Campinas (PUC-Campinas)  
> **Semestre / Ano:** 1º Semestre / 2026  
> **Professora Orientadora:** [Prof.ª Renata Arantes](https://github.com/RenataArantes)

O **FLUXO** é o sistema de acompanhamento de demandas de desenvolvimento do time. Ele é inspirado em ferramentas utilizadas por equipes de tecnologia para organizar tarefas, defeitos ("bugs") e melhorias de software, permitindo o cadastro de projetos e o acompanhamento completo do ciclo de vida de suas demandas.

Na **Reunião 5** o sistema passou a usar o **banco Oracle** de verdade: todas as rotas leem e gravam nas tabelas, e as telas consomem a API. O histórico de alterações é gravado automaticamente e nunca é apagado.

## Equipe (Time 27)

| Integrante | Responsabilidade no Projeto |
|---|---|
| Murilo Passini | Banco de dados, autenticação/login e servidor backend |
| Filipe Sampaio | Dashboard e Métricas |
| Pietro Granzotti | Listagem e Filtros de Demandas |
| Cauã Leite | Quadro Kanban, Edição, Status e Cancelamento |
| Matheus Schiavinato | Cadastro, Feriados e Comentários |
| Nicholas de Castro | Detalhes da Demanda e Histórico |

## Sobre o projeto

O sistema permite que diferentes projetos sejam cadastrados no banco de dados, cada um contendo diversas demandas associadas. Cada demanda representa uma tarefa, um defeito, uma melhoria ou uma atividade de documentação, e é acompanhada por título, descrição, tipo, prioridade, responsável, status e demais informações relevantes.

### Funcionalidades principais

- **Gestão de demandas**: cadastro, listagem, visualização de detalhes, edição, atualização de status e cancelamento (sem exclusão física dos registros).
- **Edição com data automática**: toda alteração atualiza a data de atualização da demanda e grava uma linha no histórico.
- **Perfis de acesso**: Administrador, Líder de Projeto e Membro da Equipe, cada um com permissões específicas sobre visualização e alteração de demandas.
- **Ciclo de vida controlado**: transições de status seguem um fluxo definido (Aberta → Em andamento → Em revisão → Concluída), com regras específicas por perfil de usuário. De "Em revisão" também é possível voltar para "Em andamento"; não é permitido voltar para "Aberta" nem concluir direto de "Em andamento".
- **Cancelamento preservado**: a demanda cancelada continua no banco, com motivo, autor e data do cancelamento, além do registro no histórico.
- **Comentários**: registro de observações e atualizações vinculadas a cada demanda, com autor, data e horário.
- **Histórico de alterações**: rastreamento automático e permanente de criação, mudanças de status, responsável, prioridade, prazo e cancelamento.
- **Filtros e busca**: filtragem por status, prioridade, tipo, responsável e/ou projeto, além de busca textual e ordenação dos resultados.
- **Dashboard**: painel com indicadores gerais (totais por status, por prioridade, por tipo, demandas críticas em aberto e demandas próximas do prazo).
- **Validação de feriados**: integração com a [BrasilAPI](https://brasilapi.com.br/) para impedir prazos de finalização em feriados nacionais, tanto no cadastro quanto na edição.

### Perfis de usuário

| Perfil | Principais permissões |
|---|---|
| **Administrador** | Acesso total a projetos, usuários e demandas; pode criar, editar, atribuir responsável, alterar prioridade/status e cancelar qualquer demanda. |
| **Líder de Projeto** | Vê e gerencia as demandas dos projetos que lidera; pode criar, editar, atribuir responsável, alterar prioridade/status e cancelar demandas desses projetos. |
| **Membro da Equipe** | Visualiza as demandas atribuídas a ele; registra comentários; altera o status apenas de Aberta → Em andamento e de Em andamento → Em revisão nas próprias demandas. |

## Tecnologias utilizadas

- **Frontend**: HTML5, CSS3 e JavaScript (telas na pasta `telas/`)
- **Backend**: Node.js (LTS), TypeScript e Express
- **Banco de Dados**: Oracle Database 23 Free, rodando em container Docker
- **Driver do banco**: `oracledb` (modo *thin*, sem Oracle Client instalado)
- **API externa**: BrasilAPI (feriados nacionais)
- **Controle de versão**: Git e GitHub
- **Gerenciamento de tarefas**: GitHub Projects

## Como executar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão LTS mais recente)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (para o Oracle)
- Git

### 1. Subir o Oracle no Docker

Na primeira vez, crie o container (a imagem é baixada automaticamente):

```bash
docker run -d --name fluxo-oracle \
  -p 1521:1521 \
  -e ORACLE_PASSWORD=Fluxo2026 \
  -e APP_USER=fluxo \
  -e APP_USER_PASSWORD=Fluxo2026 \
  -v fluxo-oracle-data:/opt/oracle/oradata \
  gvenzl/oracle-free:23-slim
```

O container cria o usuário `fluxo` e o serviço `FREEPDB1`. A primeira inicialização demora alguns minutos; acompanhe com:

```bash
docker logs -f fluxo-oracle
```

Quando aparecer a mensagem `DATABASE IS READY TO USE!`, o banco está pronto. Nas próximas vezes basta ligar o container com:

```bash
docker start fluxo-oracle
```

### 2. Configurar o backend

```bash
cd backend
npm install
cp .env.example .env
```

O arquivo `.env` já vem com os dados do container usado acima:

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE_NAME=FREEPDB1
DB_USER=fluxo
DB_PASSWORD=Fluxo2026
```

### 3. Criar as tabelas e carregar os dados de exemplo

```bash
npm run db:setup
```

Esse comando executa, em ordem, `sql/01-criar-tabelas.sql` (schema) e `sql/02-carga-inicial.sql` (usuários dos três perfis, projetos, demandas, comentários e histórico inicial). Ele pode ser executado novamente para resetar o banco ao estado original.

### 4. Rodar o sistema (API + telas)

```bash
npm run dev
```

Esse único comando sobe a API e também serve as telas: o Express entrega os arquivos da pasta `telas/`. Depois abra:

```
http://localhost:3000/01-login/
```

A raiz (`http://localhost:3000/`) redireciona para a tela de login. Não é preciso subir outro servidor para os arquivos HTML.

Para gerar e rodar a versão compilada:

```bash
npm run build
npm start
```

Confira se o banco respondeu em `GET /api/status`.

### Contas de teste

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | `ana.souza@fluxo.com` | `Admin@2026` |
| Líder de Projeto | `bruno.lima@fluxo.com` | `Lider@2026` |
| Membro da Equipe | `joao.silva@fluxo.com` | `Membro@2026` |

## Rotas da API (Reunião 5)

Todas as rotas privadas exigem o cabeçalho `Authorization: Bearer <token>`, com o token devolvido pelo `POST /login`. A sessão vale por 8 horas e é encerrada pelo `POST /logout`.

As listas vêm no formato `{ "total": ..., "<recurso>": [...] }`, os cadastros no formato `{ "mensagem": ..., "<recurso>": {...} }` e os erros no formato `{ "erro": ..., "mensagem": ... }`.

| Rota | Método | Descrição | Responsável |
|---|---|---|---|
| `/` | GET | Redireciona para a tela de login (`/01-login/`) | Murilo Passini |
| `/api` | GET | Resposta simples para conferir que o servidor está no ar | Murilo Passini |
| `/api/status` | GET | Status do servidor e da conexão com o banco | Murilo Passini |
| `/login` | POST | Autentica e-mail e senha e devolve o usuário (sem a senha) + token | Murilo Passini |
| `/logout` | POST | Encerra a sessão do token enviado | Murilo Passini |
| `/usuarios` | GET | Lista os usuários cadastrados | Murilo Passini |
| `/dashboard` | GET | Resumo do painel conforme o perfil do usuário | Filipe Sampaio |
| `/demandas` | GET | Lista demandas com filtros, busca textual e ordenação | Pietro Granzotti |
| `/demandas` | POST | Cadastra uma nova demanda (id, status inicial e datas gerados pelo servidor) | Matheus Schiavinato |
| `/projetos` | GET | Lista os projetos cadastrados | Matheus Schiavinato |
| `/demandas/:id` | PATCH | Edita os dados da demanda e atualiza a data de atualização | Cauã Leite |
| `/demandas/:id/status` | PATCH | Muda o status seguindo o fluxo permitido | Cauã Leite |
| `/demandas/:id/cancelar` | POST | Cancela a demanda com motivo, sem apagar o registro | Cauã Leite |
| `/demandas/:id` | GET | Detalha uma demanda pelo id | Nicholas de Castro |
| `/demandas/:id/historico` | GET | Lista o histórico de alterações (mais recente primeiro) | Nicholas de Castro |
| `/demandas/:id/comentarios` | GET | Lista os comentários da demanda | Nicholas de Castro |
| `/demandas/:id/comentarios` | POST | Adiciona um comentário (autor vem do token; data e hora do servidor) | Matheus Schiavinato |
| `/feriados?ano=2026` | GET | Lista os feriados nacionais do ano (BrasilAPI) | Matheus Schiavinato |
| `/feriados/verificar?data=2026-12-25` | GET | Confere se uma data é feriado nacional | Matheus Schiavinato |

Exemplos de requisições prontos para execução (válidas e com erro 400/401/403/404) estão no arquivo `backend/testes/rotas.http`. Faça o login primeiro e cole os tokens nas variáveis do arquivo.

## Banco de dados

O schema fica em `backend/sql/01-criar-tabelas.sql` e a carga inicial em `backend/sql/02-carga-inicial.sql`. As tabelas são:

| Tabela | Conteúdo |
|---|---|
| `USUARIOS` | Pessoas do sistema, com perfil (Administrador, Líder de Projeto ou Membro da Equipe) |
| `PROJETOS` | Projetos e o líder responsável por cada um |
| `DEMANDAS` | Demandas com tipo, prioridade, status, responsável, prazo e dados do cancelamento |
| `COMENTARIOS` | Comentários vinculados às demandas |
| `HISTORICO` | Registro permanente de criação, edições, status e cancelamentos |
| `SESSOES` | Tokens de login ativos e a data de expiração |

## Estrutura do repositório

```
PI-II-TIME-27/
├── backend/
│   ├── scripts/executar-sql.js     # executor do npm run db:setup
│   ├── sql/                        # criação das tabelas e carga inicial
│   ├── src/
│   │   ├── auth.ts                 # login por token e permissões
│   │   ├── banco.ts                # conexão com o Oracle
│   │   ├── feriados.ts             # integração com a BrasilAPI
│   │   ├── rotas/                  # rotas separadas por responsável
│   │   ├── server.ts               # servidor Express
│   │   └── utilidades.ts           # funções e constantes compartilhadas
│   └── testes/rotas.http           # exemplos de requisições
├── telas/
│   ├── 01-login/ ... 06-detalhes-demanda/
│   └── comum/api.js                # funções compartilhadas pelas telas
└── README.md
```

## Controle de versão

O desenvolvimento segue o fluxo de branches por funcionalidade, com integração posterior à branch `dev` e, ao final, à `main`. Cada arquivo do projeto contém, em seu cabeçalho, a identificação do autor responsável pela sua implementação.

A entrega final é marcada pela tag de release `1.0.0-final`.

## Licença e uso

Projeto desenvolvido exclusivamente para fins acadêmicos no âmbito do componente curricular Projeto Integrador 2 do curso de Engenharia de Software da PUC-Campinas (2026).
