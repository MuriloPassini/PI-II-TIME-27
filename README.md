# Sistema de Acompanhamento de Demandas de Desenvolvimento

Projeto desenvolvido para o componente curricular **Projeto Integrador 2** do curso de **Engenharia de Software** da **Pontifícia Universidade Católica de Campinas (PUC-Campinas)** — 2026.

O sistema é inspirado em ferramentas utilizadas por equipes de tecnologia para organizar tarefas, defeitos ("bugs") e melhorias de software, permitindo o cadastro de projetos e o acompanhamento completo do ciclo de vida de suas demandas.

## Equipe

| Integrante |
|---|
| Murilo Passini |
| Filipe Sampaio |
| Pietro Granzotti |
| Cauã Leite |
| Matheus Schiavinato |
| Nicholas de Castro |

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

- **Frontend**: HTML5, CSS3, JavaScript (e Bootstrap para a interface responsiva)
- **Backend**: Node.js (LTS), TypeScript e Express
- **Banco de Dados**: Oracle
- **Controle de versão**: Git e GitHub
- **Gerenciamento de tarefas**: GitHub Projects

## Como executar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão LTS mais recente)
- [MySQL](https://www.mysql.com/) instalado e em execução
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

3. Configure as variáveis de ambiente (crie um arquivo `.env` na pasta `backend` com base no `.env.example`):
   ```env
   DB_HOST=localhost
   DB_USER=seu_usuario
   DB_PASSWORD=sua_senha
   DB_NAME=nome_do_banco
   PORT=3000
   ```

4. Crie o banco de dados e execute o script de criação das tabelas (disponível em `backend/database`).

5. Inicie o servidor backend:
   ```bash
   npm run dev
   ```

6. Instale as dependências do frontend (caso utilize um bundler) ou abra diretamente os arquivos estáticos:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

## Controle de versão

O desenvolvimento segue o fluxo de branches por funcionalidade (ex.: `feature/autenticacao`, `feature/dashboard`), com integração posterior às branches `main`/`master`. Cada arquivo do projeto contém, em seu cabeçalho, a identificação do autor responsável pela sua implementação.

A entrega final é marcada pela tag de release `1.0.0-final`.

## Licença e uso

Projeto desenvolvido exclusivamente para fins acadêmicos no âmbito do componente curricular Projeto Integrador 2 do curso de Engenharia de Software da PUC-Campinas (2026).

