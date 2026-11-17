-- 02-carga-inicial.sql — PI2 / Time 27
-- Autor: Murilo Passini
--
-- Carga inicial do FLUXO: usuarios dos tres perfis, projetos,
-- demandas (para demonstrar filtros, busca, ordenacao e dashboard),
-- comentarios e o historico inicial.
-- Rode este script depois do 01-criar-tabelas.sql.
--
-- Como executar (na pasta backend):
--   npm run db:setup

-- Limpa os dados antes de carregar de novo (filhos antes dos pais)
DELETE FROM HISTORICO;
DELETE FROM COMENTARIOS;
DELETE FROM SESSOES;
DELETE FROM DEMANDAS;
DELETE FROM PROJETOS;
DELETE FROM USUARIOS;
COMMIT;

-- ---------------------------------------------------------------------
-- USUARIOS (senhas fixas para a demonstracao academica)
-- ---------------------------------------------------------------------
INSERT INTO USUARIOS (ID, NOME, EMAIL, SENHA, PERFIL) VALUES ('USU-001', 'Ana Souza', 'ana.souza@fluxo.com', 'Admin@2026', 'Administrador');
INSERT INTO USUARIOS (ID, NOME, EMAIL, SENHA, PERFIL) VALUES ('USU-002', 'Bruno Lima', 'bruno.lima@fluxo.com', 'Lider@2026', 'Líder de Projeto');
INSERT INTO USUARIOS (ID, NOME, EMAIL, SENHA, PERFIL) VALUES ('USU-003', 'Carla Dias', 'carla.dias@fluxo.com', 'Lider@2026', 'Líder de Projeto');
INSERT INTO USUARIOS (ID, NOME, EMAIL, SENHA, PERFIL) VALUES ('USU-004', 'João Silva', 'joao.silva@fluxo.com', 'Membro@2026', 'Membro da Equipe');
INSERT INTO USUARIOS (ID, NOME, EMAIL, SENHA, PERFIL) VALUES ('USU-005', 'Maria Costa', 'maria.costa@fluxo.com', 'Membro@2026', 'Membro da Equipe');
INSERT INTO USUARIOS (ID, NOME, EMAIL, SENHA, PERFIL) VALUES ('USU-006', 'Pedro Gomes', 'pedro.gomes@fluxo.com', 'Membro@2026', 'Membro da Equipe');
COMMIT;

-- ---------------------------------------------------------------------
-- PROJETOS (cada um tem um lider responsavel)
-- ---------------------------------------------------------------------
INSERT INTO PROJETOS (ID, NOME, DESCRICAO, LIDER_ID) VALUES ('PRJ-001', 'Sistema Web', 'Sistema web de acompanhamento de demandas de desenvolvimento', 'USU-002');
INSERT INTO PROJETOS (ID, NOME, DESCRICAO, LIDER_ID) VALUES ('PRJ-002', 'Aplicativo Mobile', 'Aplicativo para acompanhamento das demandas em campo', 'USU-003');
INSERT INTO PROJETOS (ID, NOME, DESCRICAO, LIDER_ID) VALUES ('PRJ-003', 'API de Integração', 'Serviço REST para integração entre os sistemas da empresa', 'USU-002');
INSERT INTO PROJETOS (ID, NOME, DESCRICAO, LIDER_ID) VALUES ('PRJ-004', 'Site Institucional', 'Site público da empresa', 'USU-003');
COMMIT;

-- ---------------------------------------------------------------------
-- DEMANDAS
-- As demandas 005, 006 e 007 usam TRUNC(SYSDATE) para o dashboard
-- sempre ter prazos próximos na data da apresentação.
-- ---------------------------------------------------------------------
INSERT INTO DEMANDAS (ID, TITULO, DESCRICAO, TIPO, PRIORIDADE, STATUS, PROJETO_ID, RESPONSAVEL_ID, CRIADA_EM, ATUALIZADA_EM, PRAZO)
VALUES ('DEM-001', 'Falha na autenticação de usuários', 'Alguns usuários não conseguem entrar no sistema quando a senha tem caracteres especiais.', 'Defeito', 'Crítica', 'Aberta', 'PRJ-001', NULL, TO_DATE('2026-10-26', 'YYYY-MM-DD'), TO_DATE('2026-10-26', 'YYYY-MM-DD'), TO_DATE('2026-11-14', 'YYYY-MM-DD'));

INSERT INTO DEMANDAS (ID, TITULO, DESCRICAO, TIPO, PRIORIDADE, STATUS, PROJETO_ID, RESPONSAVEL_ID, CRIADA_EM, ATUALIZADA_EM, PRAZO)
VALUES ('DEM-002', 'Implementar tela de perfil do usuário', 'Criar a tela de perfil para o usuário visualizar e atualizar seus dados pessoais.', 'Tarefa', 'Alta', 'Em andamento', 'PRJ-001', 'USU-004', TO_DATE('2026-10-27', 'YYYY-MM-DD'), TO_DATE('2026-11-04', 'YYYY-MM-DD'), TO_DATE('2026-11-20', 'YYYY-MM-DD'));

INSERT INTO DEMANDAS (ID, TITULO, DESCRICAO, TIPO, PRIORIDADE, STATUS, PROJETO_ID, RESPONSAVEL_ID, CRIADA_EM, ATUALIZADA_EM, PRAZO)
VALUES ('DEM-003', 'Revisar fluxo de aprovação de demandas', 'Ajustar o fluxo para o líder revisar a demanda antes dela ir para o quadro kanban.', 'Melhoria', 'Média', 'Em revisão', 'PRJ-001', 'USU-002', TO_DATE('2026-10-28', 'YYYY-MM-DD'), TO_DATE('2026-11-05', 'YYYY-MM-DD'), TO_DATE('2026-11-25', 'YYYY-MM-DD'));

INSERT INTO DEMANDAS (ID, TITULO, DESCRICAO, TIPO, PRIORIDADE, STATUS, PROJETO_ID, RESPONSAVEL_ID, CRIADA_EM, ATUALIZADA_EM, PRAZO)
VALUES ('DEM-004', 'Corrigir rodapé em telas de celular', 'O rodapé do site aparece desmontado em telas de celular.', 'Defeito', 'Baixa', 'Concluída', 'PRJ-004', 'USU-006', TO_DATE('2026-10-29', 'YYYY-MM-DD'), TO_DATE('2026-11-06', 'YYYY-MM-DD'), TO_DATE('2026-11-08', 'YYYY-MM-DD'));

INSERT INTO DEMANDAS (ID, TITULO, DESCRICAO, TIPO, PRIORIDADE, STATUS, PROJETO_ID, RESPONSAVEL_ID, CRIADA_EM, ATUALIZADA_EM, PRAZO)
VALUES ('DEM-005', 'Criar relatório mensal de demandas', 'Gerar um relatório mensal com a quantidade de demandas abertas e concluídas.', 'Tarefa', 'Alta', 'Em andamento', 'PRJ-001', 'USU-005', TO_DATE('2026-10-30', 'YYYY-MM-DD'), TO_DATE('2026-11-02', 'YYYY-MM-DD'), TRUNC(SYSDATE) + 2);

INSERT INTO DEMANDAS (ID, TITULO, DESCRICAO, TIPO, PRIORIDADE, STATUS, PROJETO_ID, RESPONSAVEL_ID, CRIADA_EM, ATUALIZADA_EM, PRAZO)
VALUES ('DEM-006', 'Erro ao exportar dados para planilha', 'A exportação para planilha falha quando o resultado tem mais de mil linhas.', 'Defeito', 'Crítica', 'Em andamento', 'PRJ-003', 'USU-004', TO_DATE('2026-10-31', 'YYYY-MM-DD'), TO_DATE('2026-11-03', 'YYYY-MM-DD'), TRUNC(SYSDATE) + 4);

INSERT INTO DEMANDAS (ID, TITULO, DESCRICAO, TIPO, PRIORIDADE, STATUS, PROJETO_ID, RESPONSAVEL_ID, CRIADA_EM, ATUALIZADA_EM, PRAZO)
VALUES ('DEM-007', 'Adicionar filtro por prioridade', 'Incluir filtro por prioridade na listagem de demandas do aplicativo.', 'Melhoria', 'Alta', 'Em andamento', 'PRJ-002', 'USU-006', TO_DATE('2026-11-02', 'YYYY-MM-DD'), TO_DATE('2026-11-05', 'YYYY-MM-DD'), TRUNC(SYSDATE) + 6);

INSERT INTO DEMANDAS (ID, TITULO, DESCRICAO, TIPO, PRIORIDADE, STATUS, PROJETO_ID, RESPONSAVEL_ID, CRIADA_EM, ATUALIZADA_EM, PRAZO)
VALUES ('DEM-008', 'Ajustar cores para acessibilidade', 'Ajustar as cores do site para melhorar o contraste e a leitura.', 'Melhoria', 'Média', 'Aberta', 'PRJ-004', NULL, TO_DATE('2026-11-02', 'YYYY-MM-DD'), TO_DATE('2026-11-02', 'YYYY-MM-DD'), TO_DATE('2026-11-28', 'YYYY-MM-DD'));

INSERT INTO DEMANDAS (ID, TITULO, DESCRICAO, TIPO, PRIORIDADE, STATUS, PROJETO_ID, RESPONSAVEL_ID, CRIADA_EM, ATUALIZADA_EM, PRAZO)
VALUES ('DEM-009', 'Documentar endpoints da API', 'Escrever a documentação dos endpoints disponíveis na API de integração.', 'Documentação', 'Baixa', 'Em revisão', 'PRJ-003', 'USU-003', TO_DATE('2026-11-03', 'YYYY-MM-DD'), TO_DATE('2026-11-07', 'YYYY-MM-DD'), TO_DATE('2026-12-05', 'YYYY-MM-DD'));

INSERT INTO DEMANDAS (ID, TITULO, DESCRICAO, TIPO, PRIORIDADE, STATUS, PROJETO_ID, RESPONSAVEL_ID, CRIADA_EM, ATUALIZADA_EM, PRAZO)
VALUES ('DEM-010', 'Queda de desempenho na listagem', 'A listagem de demandas trava quando tem muitos itens na tela.', 'Defeito', 'Crítica', 'Aberta', 'PRJ-002', NULL, TO_DATE('2026-11-03', 'YYYY-MM-DD'), TO_DATE('2026-11-03', 'YYYY-MM-DD'), NULL);

INSERT INTO DEMANDAS (ID, TITULO, DESCRICAO, TIPO, PRIORIDADE, STATUS, PROJETO_ID, RESPONSAVEL_ID, CRIADA_EM, ATUALIZADA_EM, PRAZO, MOTIVO_CANCELAMENTO, CANCELADA_POR, CANCELADA_EM)
VALUES ('DEM-011', 'Adicionar tema escuro', 'Adicionar tema escuro ao aplicativo para uso em ambientes com pouca luz.', 'Melhoria', 'Média', 'Cancelada', 'PRJ-002', 'USU-005', TO_DATE('2026-11-04', 'YYYY-MM-DD'), TO_DATE('2026-11-06', 'YYYY-MM-DD'), TO_DATE('2026-11-18', 'YYYY-MM-DD'), 'Prioridade alterada pelo cliente.', 'USU-003', TO_TIMESTAMP('2026-11-06 10:00:00', 'YYYY-MM-DD HH24:MI:SS'));

INSERT INTO DEMANDAS (ID, TITULO, DESCRICAO, TIPO, PRIORIDADE, STATUS, PROJETO_ID, RESPONSAVEL_ID, CRIADA_EM, ATUALIZADA_EM, PRAZO)
VALUES ('DEM-012', 'Criar tela de cadastro de projetos', 'Criar uma tela para o administrador cadastrar novos projetos no sistema.', 'Tarefa', 'Alta', 'Concluída', 'PRJ-001', 'USU-003', TO_DATE('2026-11-05', 'YYYY-MM-DD'), TO_DATE('2026-11-07', 'YYYY-MM-DD'), TO_DATE('2026-11-06', 'YYYY-MM-DD'));

INSERT INTO DEMANDAS (ID, TITULO, DESCRICAO, TIPO, PRIORIDADE, STATUS, PROJETO_ID, RESPONSAVEL_ID, CRIADA_EM, ATUALIZADA_EM, PRAZO)
VALUES ('DEM-013', 'Corrigir link quebrado na home', 'O link do blog na página inicial do site está quebrado.', 'Defeito', 'Baixa', 'Aberta', 'PRJ-004', NULL, TO_DATE('2026-11-06', 'YYYY-MM-DD'), TO_DATE('2026-11-06', 'YYYY-MM-DD'), TO_DATE('2026-12-10', 'YYYY-MM-DD'));

INSERT INTO DEMANDAS (ID, TITULO, DESCRICAO, TIPO, PRIORIDADE, STATUS, PROJETO_ID, RESPONSAVEL_ID, CRIADA_EM, ATUALIZADA_EM, PRAZO, MOTIVO_CANCELAMENTO, CANCELADA_POR, CANCELADA_EM)
VALUES ('DEM-014', 'Revisar textos da página de contato', 'Revisar os textos da página de contato do site institucional.', 'Tarefa', 'Baixa', 'Cancelada', 'PRJ-004', 'USU-006', TO_DATE('2026-11-07', 'YYYY-MM-DD'), TO_DATE('2026-11-08', 'YYYY-MM-DD'), TO_DATE('2026-12-20', 'YYYY-MM-DD'), 'Demanda duplicada.', 'USU-003', TO_TIMESTAMP('2026-11-08 15:30:00', 'YYYY-MM-DD HH24:MI:SS'));

INSERT INTO DEMANDAS (ID, TITULO, DESCRICAO, TIPO, PRIORIDADE, STATUS, PROJETO_ID, RESPONSAVEL_ID, CRIADA_EM, ATUALIZADA_EM, PRAZO)
VALUES ('DEM-015', 'Preparar apresentação da entrega', 'Preparar os slides da apresentação da entrega desta etapa do projeto.', 'Tarefa', 'Média', 'Aberta', 'PRJ-001', 'USU-002', TO_DATE('2026-11-08', 'YYYY-MM-DD'), TO_DATE('2026-11-08', 'YYYY-MM-DD'), TO_DATE('2026-12-15', 'YYYY-MM-DD'));
COMMIT;

-- ---------------------------------------------------------------------
-- COMENTARIOS
-- ---------------------------------------------------------------------
INSERT INTO COMENTARIOS (ID, DEMANDA_ID, AUTOR_ID, TEXTO, DATA) VALUES ('COM-001', 'DEM-001', 'USU-002', 'Conseguimos reproduzir o erro com três usuários diferentes. Vamos priorizar a correção.', TO_TIMESTAMP('2026-10-27 09:15:32', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO COMENTARIOS (ID, DEMANDA_ID, AUTOR_ID, TEXTO, DATA) VALUES ('COM-002', 'DEM-001', 'USU-001', 'Lembrem que a correção precisa entrar antes da entrega da próxima etapa.', TO_TIMESTAMP('2026-10-27 14:40:05', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO COMENTARIOS (ID, DEMANDA_ID, AUTOR_ID, TEXTO, DATA) VALUES ('COM-003', 'DEM-002', 'USU-004', 'O layout da tela já está pronto, falta ligar com os dados do usuário.', TO_TIMESTAMP('2026-11-03 10:22:47', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO COMENTARIOS (ID, DEMANDA_ID, AUTOR_ID, TEXTO, DATA) VALUES ('COM-004', 'DEM-002', 'USU-003', 'Ficou ótimo. Só ajustem o espaçamento dos botões no topo.', TO_TIMESTAMP('2026-11-04 16:05:19', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO COMENTARIOS (ID, DEMANDA_ID, AUTOR_ID, TEXTO, DATA) VALUES ('COM-005', 'DEM-006', 'USU-004', 'O erro acontece quando a planilha tem mais de mil linhas.', TO_TIMESTAMP('2026-11-03 08:47:58', 'YYYY-MM-DD HH24:MI:SS'));
COMMIT;

-- ---------------------------------------------------------------------
-- HISTORICO INICIAL
-- Uma entrada de criacao para cada demanda e algumas alteracoes
-- para a tela de historico ja ter conteudo na demonstracao.
-- ---------------------------------------------------------------------
INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-001', 'USU-002', 'Criação', 'Status', NULL, 'Aberta', NULL, TO_TIMESTAMP('2026-10-26 09:00:00', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-002', 'USU-002', 'Criação', 'Status', NULL, 'Aberta', NULL, TO_TIMESTAMP('2026-10-27 09:00:00', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-003', 'USU-002', 'Criação', 'Status', NULL, 'Aberta', NULL, TO_TIMESTAMP('2026-10-28 09:00:00', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-004', 'USU-003', 'Criação', 'Status', NULL, 'Aberta', NULL, TO_TIMESTAMP('2026-10-29 09:00:00', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-005', 'USU-002', 'Criação', 'Status', NULL, 'Aberta', NULL, TO_TIMESTAMP('2026-10-30 09:00:00', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-006', 'USU-002', 'Criação', 'Status', NULL, 'Aberta', NULL, TO_TIMESTAMP('2026-10-31 09:00:00', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-007', 'USU-003', 'Criação', 'Status', NULL, 'Aberta', NULL, TO_TIMESTAMP('2026-11-02 09:00:00', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-008', 'USU-003', 'Criação', 'Status', NULL, 'Aberta', NULL, TO_TIMESTAMP('2026-11-02 09:10:00', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-009', 'USU-002', 'Criação', 'Status', NULL, 'Aberta', NULL, TO_TIMESTAMP('2026-11-03 09:00:00', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-010', 'USU-003', 'Criação', 'Status', NULL, 'Aberta', NULL, TO_TIMESTAMP('2026-11-03 09:10:00', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-011', 'USU-003', 'Criação', 'Status', NULL, 'Aberta', NULL, TO_TIMESTAMP('2026-11-04 09:00:00', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-012', 'USU-002', 'Criação', 'Status', NULL, 'Aberta', NULL, TO_TIMESTAMP('2026-11-05 09:00:00', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-013', 'USU-003', 'Criação', 'Status', NULL, 'Aberta', NULL, TO_TIMESTAMP('2026-11-06 09:00:00', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-014', 'USU-003', 'Criação', 'Status', NULL, 'Aberta', NULL, TO_TIMESTAMP('2026-11-07 09:00:00', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-015', 'USU-002', 'Criação', 'Status', NULL, 'Aberta', NULL, TO_TIMESTAMP('2026-11-08 09:00:00', 'YYYY-MM-DD HH24:MI:SS'));

INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-002', 'USU-002', 'Responsável alterado', 'Responsável', 'Não atribuído', 'João Silva', NULL, TO_TIMESTAMP('2026-10-30 10:05:00', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-002', 'USU-002', 'Prioridade alterada', 'Prioridade', 'Média', 'Alta', NULL, TO_TIMESTAMP('2026-10-31 09:00:00', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-002', 'USU-002', 'Status alterado', 'Status', 'Aberta', 'Em andamento', NULL, TO_TIMESTAMP('2026-11-04 10:00:00', 'YYYY-MM-DD HH24:MI:SS'));

INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-003', 'USU-002', 'Status alterado', 'Status', 'Aberta', 'Em andamento', NULL, TO_TIMESTAMP('2026-10-30 10:00:00', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-003', 'USU-002', 'Status alterado', 'Status', 'Em andamento', 'Em revisão', NULL, TO_TIMESTAMP('2026-11-05 14:00:00', 'YYYY-MM-DD HH24:MI:SS'));

INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-004', 'USU-003', 'Status alterado', 'Status', 'Aberta', 'Em andamento', NULL, TO_TIMESTAMP('2026-11-01 10:00:00', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-004', 'USU-003', 'Status alterado', 'Status', 'Em andamento', 'Em revisão', NULL, TO_TIMESTAMP('2026-11-04 11:00:00', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-004', 'USU-003', 'Status alterado', 'Status', 'Em revisão', 'Concluída', NULL, TO_TIMESTAMP('2026-11-06 16:00:00', 'YYYY-MM-DD HH24:MI:SS'));

INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-009', 'USU-002', 'Status alterado', 'Status', 'Aberta', 'Em andamento', NULL, TO_TIMESTAMP('2026-11-05 09:00:00', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-009', 'USU-002', 'Status alterado', 'Status', 'Em andamento', 'Em revisão', NULL, TO_TIMESTAMP('2026-11-07 10:00:00', 'YYYY-MM-DD HH24:MI:SS'));

INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-011', 'USU-003', 'Status alterado', 'Status', 'Aberta', 'Em andamento', NULL, TO_TIMESTAMP('2026-11-05 10:00:00', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-011', 'USU-003', 'Cancelamento', 'Status', 'Em andamento', 'Cancelada', 'Prioridade alterada pelo cliente.', TO_TIMESTAMP('2026-11-06 10:00:00', 'YYYY-MM-DD HH24:MI:SS'));

INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-012', 'USU-002', 'Status alterado', 'Status', 'Aberta', 'Em andamento', NULL, TO_TIMESTAMP('2026-11-06 09:00:00', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-012', 'USU-002', 'Status alterado', 'Status', 'Em andamento', 'Em revisão', NULL, TO_TIMESTAMP('2026-11-06 15:00:00', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-012', 'USU-002', 'Status alterado', 'Status', 'Em revisão', 'Concluída', NULL, TO_TIMESTAMP('2026-11-07 10:00:00', 'YYYY-MM-DD HH24:MI:SS'));

INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO, DATA) VALUES ('DEM-014', 'USU-003', 'Cancelamento', 'Status', 'Aberta', 'Cancelada', 'Demanda duplicada.', TO_TIMESTAMP('2026-11-08 15:30:00', 'YYYY-MM-DD HH24:MI:SS'));

COMMIT;
