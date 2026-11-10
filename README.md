# Sistema de Acompanhamento de Demandas de Desenvolvimento

> **Projeto Integrador II — Time 27 (PI-II-TIME-27)**  
> **Curso:** Engenharia de Software  
> **Instituição:** Pontifícia Universidade Católica de Campinas (PUC-Campinas)  
> **Semestre / Ano:** 1º Semestre / 2026  
> **Professora Orientadora:** [Prof.ª Renata Arantes](https://github.com/RenataArantes)

O **FLUXO** é o sistema de acompanhamento de demandas de desenvolvimento do time. Ele é inspirado em ferramentas utilizadas por equipes de tecnologia para organizar tarefas, defeitos ("bugs") e melhorias de software, permitindo o cadastro de projetos e o acompanhamento completo do ciclo de vida de suas demandas.

## Equipe (Time 27)

| Integrante | Responsabilidade no Projeto |
|---|---|
| Murilo Passini | Autenticação / Login e Servidor Backend |
| Filipe Sampaio | Dashboard e Métricas |
| Pietro Granzotti | Listagem e Filtros de Demandas |
| Cauã Leite | Quadro Kanban e Fluxo de Trabalho |
| Matheus Schiavinato | Cadastro e Edição de Demandas |
| Nicholas de Castro | Detalhes da Demanda e Ciclo de Vida |

## Sobre o projeto

O sistema permite que diferentes projetos sejam cadastrados no banco de dados, cada um contendo diversas demandas associadas. Cada demanda representa uma tarefa, um defeito, uma melhoria ou uma atividade de documentação, e é acompanhada por título, descrição, tipo, prioridade, responsável, status e demais informações relevantes.

### Funcionalidades principais

- **Gestão de demandas**: cadastro, listagem, visualização de detalhes, edição, atualização de status e cancelamento (sem exclusão física dos registros).
- **Perfis de acesso**: Administrador, Líder de Projeto e Membro da Equipe, cada um com permissões específicas sobre visualização e alteração de demandas.
- **Ciclo de vida controlado**: transições de status seguem um fluxo definido (Aberta → Em andamento → Em revisão → Concluída), com regras específicas por perfil de usuário.
- **Comentários**: registro de observações e atualizações vinculadas a cada demanda, com autor, data e horário.
- **Histórico de alterações**: rastreamento automático e permanente de mudanças de status, responsável, prioridade e prazo.
- **Filtros e busca**: filtragem por status, prioridade, tipo, responsável e/ou projeto, além de busca textual e ordenação dos resultados.
- **Dashboard**: painel com indicadores gerais (totais por status, por prioridade, por tipo, demandas críticas em aberto e demandas próximas do prazo).
- **Validação de feriados**: integração com API externa para impedir o cadastro de prazos de finalização em feriados nacionais.

### Perfis de usuário

| Perfil | Principais permissões |
|---|---|
| **Administrador** | Acesso total a projetos, usuários e demandas; pode criar, editar, atribuir responsável, alterar prioridade/status e cancelar qualquer demanda. |
| **Líder de Projeto** | Gerencia as demandas dos projetos aos quais está vinculado; pode criar, editar, atribuir responsável, alterar prioridade/status e cancelar demandas desses projetos. |
| **Membro da Equipe** | Visualiza projetos e demandas vinculados a ele; registra comentários; altera o status apenas de Aberta → Em andamento e de Em andamento → Em revisão nas demandas atribuídas a ele. |

## Tecnologias utilizadas

- **Frontend**: HTML5, CSS3 e JavaScript (protótipos das telas na pasta `telas/`)
- **Backend**: Node.js (LTS), TypeScript e Express
- **Banco de Dados**: Oracle (planejado para as próximas etapas)
- **Controle de versão**: Git e GitHub
- **Gerenciamento de tarefas**: GitHub Projects

## Como executar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão LTS mais recente)
- Git

### Passo a passo

1. Clone o repositório:
   ```bash
   git clone https://github.com/<usuario-ou-organizacao>/PI-II-TIME-X.git
   cd PI-II-TIME-X
   ```

2. Instale as dependências do backend:
   ```bash
   cd backend
   npm install
   ```

3. Configure a porta do servidor (crie um arquivo `.env` na pasta `backend` com base no `.env.example`):
   ```env
   PORT=3000
   ```

4. Inicie o servidor backend:
   ```bash
   npm run dev
   ```

5. Com o servidor no ar, teste as rotas pelo navegador ou pelo arquivo `backend/testes/rotas.http` (extensão REST Client do VS Code).

6. Para gerar e rodar a versão compilada em JavaScript:
   ```bash
   npm run build
   npm start
   ```

7. As telas do protótipo ficam na pasta `telas/` e são abertas direto no navegador (basta abrir o `index.html` de cada uma). Nesta etapa elas ainda não consomem a API.

## Rotas da API (Reunião 4)

Nesta etapa o backend mantém os dados de teste em memória (sem banco de dados ainda) e expõe as rotas abaixo. As listas vêm no formato `{ "total": ..., "<recurso>": [...] }`, os cadastros no formato `{ "mensagem": ..., "<recurso>": {...} }` e os erros no formato `{ "erro": ..., "mensagem": ... }`.

| Rota | Método | Descrição | Responsável |
|---|---|---|---|
| `/login` | POST | Autentica e-mail e senha e devolve os dados do usuário (sem a senha) | Murilo Passini |
| `/usuarios` | GET | Lista os usuários cadastrados | Murilo Passini |
| `/dashboard` | GET | Resumo do painel: totais por status e prioridade, críticas em aberto e próximas do prazo | Filipe Sampaio |
| `/demandas` | GET | Lista demandas com filtros (status, prioridade, tipo, responsável, projeto), busca textual e ordenação | Pietro Granzotti |
| `/demandas` | POST | Cadastra uma nova demanda (id, status inicial e datas gerados pelo servidor) | Cauã Leite |
| `/projetos` | GET | Lista os projetos cadastrados | Cauã Leite |
| `/demandas/:id` | GET | Detalha uma demanda pelo id | Nicholas de Castro |
| `/demandas/:id/comentarios` | GET | Lista os comentários da demanda | Nicholas de Castro |
| `/demandas/:id/comentarios` | POST | Adiciona um comentário na demanda (data e horário gerados pelo servidor) | Matheus Schiavinato |

As rotas de verificação da Reunião 3 continuam válidas: `GET /` e `GET /api/status`.

Exemplos de requisições prontos para execução (válidas e com erro) estão no arquivo `backend/testes/rotas.http`.

> A persistência no banco Oracle e a integração das telas com a API estão planejadas para as próximas etapas do projeto.

## Controle de versão

O desenvolvimento segue o fluxo de branches por funcionalidade (ex.: `feature/autenticacao`, `feature/dashboard`), com integração posterior às branches `main`/`master`. Cada arquivo do projeto contém, em seu cabeçalho, a identificação do autor responsável pela sua implementação.

A entrega final é marcada pela tag de release `1.0.0-final`.

## Licença e uso

Projeto desenvolvido exclusivamente para fins acadêmicos no âmbito do componente curricular Projeto Integrador 2 do curso de Engenharia de Software da PUC-Campinas (2026).

