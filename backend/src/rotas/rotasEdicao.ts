// rotasEdicao.ts — PI2 / Time 27
// Autor: Cauã Leite

// Rotas de edicao da demanda: alterar os dados (PATCH /demandas/:id),
// mudar o status (PATCH /demandas/:id/status) e cancelar
// (POST /demandas/:id/cancelar).
// Toda alteracao grava uma linha no HISTORICO e atualiza a data
// de atualizacao automaticamente.

import express, { Request, Response, NextFunction } from 'express';
import oracledb from 'oracledb';

import { consultar, emTransacao, executarNaConexao } from '../banco';
import {
    exigirLogin,
    podeGerenciarDemanda,
    lideraProjeto,
    PERFIL_LIDER,
    PERFIL_MEMBRO
} from '../auth';
import { verificarFeriado } from '../feriados';
import { Demanda, Usuario } from '../dados';
import {
    SELECT_DEMANDA,
    STATUS_VALIDOS,
    TIPOS_VALIDOS,
    PRIORIDADES_VALIDAS,
    FORMATO_DATA,
    dataExiste,
    textoLimpo,
    montarDemanda
} from '../utilidades';

const rotas = express.Router();

// Transicoes permitidas para administrador e lider.
// Aberta -> Em andamento -> Em revisão -> Concluída.
// De "Em revisão" tambem da para voltar para "Em andamento".
// Nao existe voltar para "Aberta" nem concluir direto de "Em andamento".
const TRANSICOES_PERMITIDAS: Record<string, string[]> = {
    'Aberta': ['Em andamento'],
    'Em andamento': ['Em revisão'],
    'Em revisão': ['Concluída', 'Em andamento'],
    'Concluída': [],
    'Cancelada': []
};

// O membro da equipe so avanca o status da propria demanda
const TRANSICOES_DO_MEMBRO: Record<string, string[]> = {
    'Aberta': ['Em andamento'],
    'Em andamento': ['Em revisão']
};

// Busca uma demanda pelo id (devolve null se nao achar)
async function buscarDemanda(id: string): Promise<Demanda | null> {
    let linhas = await consultar(SELECT_DEMANDA + ' WHERE D.ID = :id', { id: id });
    if (linhas.length === 0) {
        return null;
    }
    return montarDemanda(linhas[0]);
}

// Grava uma linha no historico da demanda
async function registrarHistorico(
    conexao: oracledb.Connection,
    demandaId: string,
    usuarioId: string,
    acao: string,
    campo: string,
    valorAnterior: string,
    valorNovo: string,
    observacao: string
): Promise<void> {
    await executarNaConexao(
        conexao,
        'INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO, OBSERVACAO) ' +
        'VALUES (:demandaId, :usuarioId, :acao, :campo, :valorAnterior, :valorNovo, :observacao)',
        {
            demandaId: demandaId,
            usuarioId: usuarioId,
            acao: acao,
            campo: campo,
            valorAnterior: valorAnterior === '' ? null : valorAnterior,
            valorNovo: valorNovo === '' ? null : valorNovo,
            observacao: observacao === '' ? null : observacao
        }
    );
}

// Confere o prazo (formato, data real e feriado nacional).
// Devolve o texto do erro ou '' quando esta tudo certo.
async function validarPrazo(prazo: string): Promise<string> {
    if (FORMATO_DATA.test(prazo) === false || dataExiste(prazo) === false) {
        return 'O prazo deve ser uma data válida no formato AAAA-MM-DD (ex.: 2026-12-20).';
    }

    try {
        let feriado = await verificarFeriado(prazo);
        if (feriado !== null) {
            return 'O dia ' + prazo + ' é feriado nacional (' + feriado.nome + '). Escolha outra data para o prazo.';
        }
    } catch (erro) {
        console.log('[Aviso] Não foi possível consultar os feriados: ' + (erro as Error).message);
    }

    return '';
}

// PATCH /demandas/:id - altera os dados da demanda
async function editarDemanda(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        let usuario = req.usuario as Usuario;
        let idPedido = String(req.params.id || '');
        let atual = await buscarDemanda(idPedido);

        if (atual === null) {
            res.status(404).json({
                erro: 'Demanda não encontrada',
                mensagem: 'Não existe demanda com o id ' + idPedido + '.'
            });
            return;
        }

        if (atual.status === 'Cancelada') {
            res.status(400).json({
                erro: 'Demanda cancelada',
                mensagem: 'Uma demanda cancelada não pode ser editada.'
            });
            return;
        }

        let pode = await podeGerenciarDemanda(usuario, idPedido);
        if (pode === false) {
            res.status(403).json({
                erro: 'Sem permissão',
                mensagem: 'Apenas o administrador e o líder do projeto podem editar esta demanda.'
            });
            return;
        }

        let corpo = req.body || {};
        let campos: string[] = [];
        let binds: any = { id: idPedido };
        let alteracoes: { campo: string; anterior: string; novo: string }[] = [];

        // Titulo
        if (corpo.titulo !== undefined) {
            if (typeof corpo.titulo !== 'string') {
                res.status(400).json({
                    erro: 'Título inválido',
                    mensagem: 'O título deve ser um texto.'
                });
                return;
            }

            let titulo = corpo.titulo.trim();
            if (titulo.length < 5 || titulo.length > 100) {
                res.status(400).json({
                    erro: 'Título inválido',
                    mensagem: 'O título deve ter entre 5 e 100 caracteres.'
                });
                return;
            }

            if (titulo !== atual.titulo) {
                campos.push('TITULO = :titulo');
                binds.titulo = titulo;
                alteracoes.push({ campo: 'Título', anterior: atual.titulo, novo: titulo });
            }
        }

        // Descricao
        if (corpo.descricao !== undefined) {
            if (typeof corpo.descricao !== 'string') {
                res.status(400).json({
                    erro: 'Descrição inválida',
                    mensagem: 'A descrição deve ser um texto.'
                });
                return;
            }

            let descricao = corpo.descricao.trim();
            if (descricao.length < 10 || descricao.length > 1000) {
                res.status(400).json({
                    erro: 'Descrição inválida',
                    mensagem: 'A descrição deve ter entre 10 e 1000 caracteres.'
                });
                return;
            }

            if (descricao !== atual.descricao) {
                campos.push('DESCRICAO = :descricao');
                binds.descricao = descricao;
                alteracoes.push({ campo: 'Descrição', anterior: atual.descricao, novo: descricao });
            }
        }

        // Tipo
        if (corpo.tipo !== undefined) {
            if (typeof corpo.tipo !== 'string' || TIPOS_VALIDOS.indexOf(corpo.tipo) === -1) {
                res.status(400).json({
                    erro: 'Tipo inválido',
                    mensagem: 'O tipo deve ser: ' + TIPOS_VALIDOS.join(', ') + '.'
                });
                return;
            }

            if (corpo.tipo !== atual.tipo) {
                campos.push('TIPO = :tipo');
                binds.tipo = corpo.tipo;
                alteracoes.push({ campo: 'Tipo', anterior: atual.tipo, novo: corpo.tipo });
            }
        }

        // Prioridade
        if (corpo.prioridade !== undefined) {
            if (typeof corpo.prioridade !== 'string' || PRIORIDADES_VALIDAS.indexOf(corpo.prioridade) === -1) {
                res.status(400).json({
                    erro: 'Prioridade inválida',
                    mensagem: 'A prioridade deve ser: ' + PRIORIDADES_VALIDAS.join(', ') + '.'
                });
                return;
            }

            if (corpo.prioridade !== atual.prioridade) {
                campos.push('PRIORIDADE = :prioridade');
                binds.prioridade = corpo.prioridade;
                alteracoes.push({ campo: 'Prioridade', anterior: atual.prioridade, novo: corpo.prioridade });
            }
        }

        // Projeto (o cliente manda o nome, o banco guarda o id)
        if (corpo.projeto !== undefined) {
            if (typeof corpo.projeto !== 'string') {
                res.status(400).json({
                    erro: 'Projeto inválido',
                    mensagem: 'O projeto deve ser o nome de um projeto cadastrado.'
                });
                return;
            }

            let nomeProjeto = corpo.projeto.trim();
            let linhasDoProjeto = await consultar(
                'SELECT ID, NOME FROM PROJETOS WHERE NOME = :nome',
                { nome: nomeProjeto }
            );

            if (linhasDoProjeto.length === 0) {
                res.status(400).json({
                    erro: 'Projeto inválido',
                    mensagem: 'O projeto informado não existe. Consulte GET /projetos.'
                });
                return;
            }

            let projetoId = String(linhasDoProjeto[0].ID);

            // Lider nao move demanda para um projeto que nao lidera
            if (usuario.perfil === PERFIL_LIDER) {
                let lidera = await lideraProjeto(usuario, projetoId);
                if (lidera === false) {
                    res.status(403).json({
                        erro: 'Sem permissão',
                        mensagem: 'Você só pode mover demandas para os projetos que você lidera.'
                    });
                    return;
                }
            }

            if (nomeProjeto !== atual.projeto) {
                campos.push('PROJETO_ID = :projetoId');
                binds.projetoId = projetoId;
                alteracoes.push({ campo: 'Projeto', anterior: atual.projeto, novo: nomeProjeto });
            }
        }

        // Responsavel (texto vazio ou "Não atribuído" deixa sem dono)
        if (corpo.responsavel !== undefined) {
            if (corpo.responsavel !== null && typeof corpo.responsavel !== 'string') {
                res.status(400).json({
                    erro: 'Responsável inválido',
                    mensagem: 'O responsável deve ser o nome de um usuário (texto).'
                });
                return;
            }

            let nomeResponsavel = textoLimpo(corpo.responsavel);
            let responsavelId: string | null = null;
            let nomeNovo = 'Não atribuído';

            if (nomeResponsavel !== '' && nomeResponsavel !== 'Não atribuído') {
                let linhasDoUsuario = await consultar(
                    'SELECT ID, NOME FROM USUARIOS WHERE NOME = :nome',
                    { nome: nomeResponsavel }
                );

                if (linhasDoUsuario.length === 0) {
                    res.status(400).json({
                        erro: 'Responsável inválido',
                        mensagem: 'O responsável informado não está cadastrado. Consulte GET /usuarios.'
                    });
                    return;
                }

                responsavelId = String(linhasDoUsuario[0].ID);
                nomeNovo = String(linhasDoUsuario[0].NOME);
            }

            if (nomeNovo !== atual.responsavel) {
                campos.push('RESPONSAVEL_ID = :responsavelId');
                binds.responsavelId = responsavelId;
                alteracoes.push({ campo: 'Responsável', anterior: atual.responsavel, novo: nomeNovo });
            }
        }

        // Prazo (vazio remove o prazo)
        if (corpo.prazo !== undefined) {
            if (corpo.prazo !== null && typeof corpo.prazo !== 'string') {
                res.status(400).json({
                    erro: 'Prazo inválido',
                    mensagem: 'O prazo deve ser uma data no formato AAAA-MM-DD (ex.: 2026-12-20).'
                });
                return;
            }

            let prazo = textoLimpo(corpo.prazo);

            if (prazo !== '') {
                let erroDoPrazo = await validarPrazo(prazo);
                if (erroDoPrazo !== '') {
                    res.status(400).json({
                        erro: 'Prazo inválido',
                        mensagem: erroDoPrazo
                    });
                    return;
                }
            }

            if (prazo !== atual.prazo) {
                campos.push('PRAZO = TO_DATE(:prazo, \'YYYY-MM-DD\')');
                binds.prazo = prazo === '' ? null : prazo;
                alteracoes.push({ campo: 'Prazo', anterior: atual.prazo, novo: prazo });
            }
        }

        // Se nada mudou, nem precisa ir no banco
        if (campos.length === 0) {
            res.status(200).json({
                mensagem: 'Nenhum campo foi alterado.',
                demanda: atual
            });
            return;
        }

        campos.push('ATUALIZADA_EM = SYSDATE');

        await emTransacao(async function (conexao: oracledb.Connection): Promise<void> {
            await executarNaConexao(
                conexao,
                'UPDATE DEMANDAS SET ' + campos.join(', ') + ' WHERE ID = :id',
                binds
            );

            for (let i = 0; i < alteracoes.length; i++) {
                await registrarHistorico(
                    conexao,
                    idPedido,
                    usuario.id,
                    'Edição',
                    alteracoes[i].campo,
                    alteracoes[i].anterior,
                    alteracoes[i].novo,
                    ''
                );
            }
        });

        let atualizada = await buscarDemanda(idPedido);

        res.status(200).json({
            mensagem: 'Demanda atualizada com sucesso.',
            demanda: atualizada
        });
    } catch (erro) {
        next(erro as Error);
    }
}

// PATCH /demandas/:id/status - muda o status seguindo as regras do fluxo
async function alterarStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        let usuario = req.usuario as Usuario;
        let idPedido = String(req.params.id || '');
        let corpo = req.body || {};
        let novoStatus = corpo.status;

        let atual = await buscarDemanda(idPedido);
        if (atual === null) {
            res.status(404).json({
                erro: 'Demanda não encontrada',
                mensagem: 'Não existe demanda com o id ' + idPedido + '.'
            });
            return;
        }

        if (typeof novoStatus !== 'string' || STATUS_VALIDOS.indexOf(novoStatus) === -1) {
            res.status(400).json({
                erro: 'Status inválido',
                mensagem: 'O status deve ser: ' + STATUS_VALIDOS.join(', ') + '.'
            });
            return;
        }

        if (novoStatus === 'Cancelada') {
            res.status(400).json({
                erro: 'Status inválido',
                mensagem: 'Para cancelar a demanda use POST /demandas/:id/cancelar com o motivo.'
            });
            return;
        }

        // Permissao: membro so mexe na propria demanda; os outros perfis
        // precisam gerenciar o projeto da demanda.
        if (usuario.perfil === PERFIL_MEMBRO) {
            if (atual.responsavel !== usuario.nome) {
                res.status(403).json({
                    erro: 'Sem permissão',
                    mensagem: 'Você só pode alterar o status das demandas atribuídas a você.'
                });
                return;
            }
        } else {
            let pode = await podeGerenciarDemanda(usuario, idPedido);
            if (pode === false) {
                res.status(403).json({
                    erro: 'Sem permissão',
                    mensagem: 'Apenas o administrador e o líder do projeto podem alterar o status desta demanda.'
                });
                return;
            }
        }

        // Confere se a transicao existe no fluxo
        let permitidas: string[] = [];
        if (usuario.perfil === PERFIL_MEMBRO) {
            permitidas = TRANSICOES_DO_MEMBRO[atual.status] || [];
        } else {
            permitidas = TRANSICOES_PERMITIDAS[atual.status] || [];
        }

        if (permitidas.indexOf(novoStatus) === -1) {
            res.status(400).json({
                erro: 'Transição não permitida',
                mensagem: 'Não é permitido mudar de "' + atual.status + '" para "' + novoStatus + '". ' +
                    'O fluxo é Aberta → Em andamento → Em revisão → Concluída, e de Em revisão pode voltar para Em andamento.'
            });
            return;
        }

        await emTransacao(async function (conexao: oracledb.Connection): Promise<void> {
            await executarNaConexao(
                conexao,
                'UPDATE DEMANDAS SET STATUS = :status, ATUALIZADA_EM = SYSDATE WHERE ID = :id',
                { status: novoStatus, id: idPedido }
            );

            await registrarHistorico(
                conexao,
                idPedido,
                usuario.id,
                'Status alterado',
                'Status',
                atual.status,
                novoStatus,
                ''
            );
        });

        let atualizada = await buscarDemanda(idPedido);

        res.status(200).json({
            mensagem: 'Status alterado para "' + novoStatus + '".',
            demanda: atualizada
        });
    } catch (erro) {
        next(erro as Error);
    }
}

// POST /demandas/:id/cancelar - cancela sem apagar a demanda do banco
async function cancelarDemanda(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        let usuario = req.usuario as Usuario;
        let idPedido = String(req.params.id || '');
        let corpo = req.body || {};

        let atual = await buscarDemanda(idPedido);
        if (atual === null) {
            res.status(404).json({
                erro: 'Demanda não encontrada',
                mensagem: 'Não existe demanda com o id ' + idPedido + '.'
            });
            return;
        }

        if (atual.status === 'Cancelada') {
            res.status(400).json({
                erro: 'Demanda já cancelada',
                mensagem: 'Esta demanda já está cancelada.'
            });
            return;
        }

        let pode = await podeGerenciarDemanda(usuario, idPedido);
        if (pode === false) {
            res.status(403).json({
                erro: 'Sem permissão',
                mensagem: 'Apenas o administrador e o líder do projeto podem cancelar esta demanda.'
            });
            return;
        }

        let motivo = textoLimpo(corpo.motivo);
        if (motivo === '') {
            motivo = 'Motivo não informado.';
        }

        if (motivo.length > 500) {
            res.status(400).json({
                erro: 'Motivo inválido',
                mensagem: 'O motivo do cancelamento deve ter no máximo 500 caracteres.'
            });
            return;
        }

        await emTransacao(async function (conexao: oracledb.Connection): Promise<void> {
            await executarNaConexao(
                conexao,
                'UPDATE DEMANDAS SET STATUS = :status, MOTIVO_CANCELAMENTO = :motivo, ' +
                'CANCELADA_POR = :usuarioId, CANCELADA_EM = SYSTIMESTAMP, ATUALIZADA_EM = SYSDATE ' +
                'WHERE ID = :id',
                {
                    status: 'Cancelada',
                    motivo: motivo,
                    usuarioId: usuario.id,
                    id: idPedido
                }
            );

            await registrarHistorico(
                conexao,
                idPedido,
                usuario.id,
                'Cancelamento',
                'Status',
                atual.status,
                'Cancelada',
                motivo
            );
        });

        let atualizada = await buscarDemanda(idPedido);

        res.status(200).json({
            mensagem: 'Demanda cancelada. O registro continua no histórico.',
            demanda: atualizada
        });
    } catch (erro) {
        next(erro as Error);
    }
}

rotas.patch('/demandas/:id', exigirLogin, editarDemanda);
rotas.patch('/demandas/:id/status', exigirLogin, alterarStatus);
rotas.post('/demandas/:id/cancelar', exigirLogin, cancelarDemanda);

export default rotas;
