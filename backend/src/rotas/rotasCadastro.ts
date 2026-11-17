// rotasCadastro.ts — PI2 / Time 27
// Autor: Matheus Schiavinato

// Rotas da tela de cadastro de demanda (05) e da lista de projetos.
// O POST grava a demanda no Oracle sempre com status "Aberta", porque
// o status e a data de criacao sao controlados pelo servidor.
// Antes de gravar, o prazo e conferido na API de feriados nacionais.

import express, { Request, Response, NextFunction } from 'express';
import oracledb from 'oracledb';

import { consultar, emTransacao, executarNaConexao, proximoIdNaConexao } from '../banco';
import { exigirLogin, podeCriarDemanda, lideraProjeto, PERFIL_LIDER } from '../auth';
import { verificarFeriado } from '../feriados';
import { Demanda, Usuario } from '../dados';
import {
    SELECT_DEMANDA,
    TIPOS_VALIDOS,
    PRIORIDADES_VALIDAS,
    FORMATO_DATA,
    dataDeHoje,
    dataExiste,
    textoLimpo,
    montarDemanda
} from '../utilidades';

const rotas = express.Router();

// Procura um projeto pelo nome e devolve a linha do Oracle (ou null)
async function acharProjeto(nome: string): Promise<any | null> {
    let linhas = await consultar('SELECT ID, NOME FROM PROJETOS WHERE NOME = :nome', { nome: nome });
    if (linhas.length === 0) {
        return null;
    }
    return linhas[0];
}

// Procura um usuario pelo nome e devolve a linha do Oracle (ou null)
async function acharUsuario(nome: string): Promise<any | null> {
    let linhas = await consultar('SELECT ID, NOME FROM USUARIOS WHERE NOME = :nome', { nome: nome });
    if (linhas.length === 0) {
        return null;
    }
    return linhas[0];
}

// Confere o prazo e devolve o texto do erro, ou '' quando esta tudo certo.
// Se a API de feriados estiver fora do ar, o cadastro continua funcionando
// (so avisa no console), para a demonstracao nao ficar travada.
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

// POST /demandas - cria uma demanda nova
async function criarDemanda(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        let usuario = req.usuario as Usuario;

        if (podeCriarDemanda(usuario) === false) {
            res.status(403).json({
                erro: 'Sem permissão',
                mensagem: 'Apenas administradores e líderes de projeto podem cadastrar demandas.'
            });
            return;
        }

        let corpo = req.body || {};
        let titulo = corpo.titulo;
        let descricao = corpo.descricao;
        let tipo = corpo.tipo;
        let prioridade = corpo.prioridade;
        let projeto = corpo.projeto;
        let responsavel = corpo.responsavel;
        let prazo = corpo.prazo;

        // Campos obrigatorios
        if (typeof titulo !== 'string' || typeof descricao !== 'string' || typeof tipo !== 'string' || typeof prioridade !== 'string' || typeof projeto !== 'string') {
            res.status(400).json({
                erro: 'Dados incompletos',
                mensagem: 'Informe o título, a descrição, o tipo, a prioridade e o projeto da demanda.'
            });
            return;
        }

        let tituloLimpo = titulo.trim();
        let descricaoLimpa = descricao.trim();

        if (tituloLimpo.length < 5 || tituloLimpo.length > 100) {
            res.status(400).json({
                erro: 'Título inválido',
                mensagem: 'O título deve ter entre 5 e 100 caracteres.'
            });
            return;
        }

        if (descricaoLimpa.length < 10 || descricaoLimpa.length > 1000) {
            res.status(400).json({
                erro: 'Descrição inválida',
                mensagem: 'A descrição deve ter entre 10 e 1000 caracteres.'
            });
            return;
        }

        if (TIPOS_VALIDOS.indexOf(tipo) === -1) {
            res.status(400).json({
                erro: 'Tipo inválido',
                mensagem: 'O tipo deve ser: ' + TIPOS_VALIDOS.join(', ') + '.'
            });
            return;
        }

        if (PRIORIDADES_VALIDAS.indexOf(prioridade) === -1) {
            res.status(400).json({
                erro: 'Prioridade inválida',
                mensagem: 'A prioridade deve ser: ' + PRIORIDADES_VALIDAS.join(', ') + '.'
            });
            return;
        }

        // O projeto tem que ser um dos projetos cadastrados no banco
        let projetoEncontrado = await acharProjeto(projeto);
        if (projetoEncontrado === null) {
            res.status(400).json({
                erro: 'Projeto inválido',
                mensagem: 'O projeto informado não existe. Consulte GET /projetos.'
            });
            return;
        }

        // Lider de projeto so cadastra nos projetos que ele lidera
        if (usuario.perfil === PERFIL_LIDER) {
            let lidera = await lideraProjeto(usuario, String(projetoEncontrado.ID));
            if (lidera === false) {
                res.status(403).json({
                    erro: 'Sem permissão',
                    mensagem: 'Você só pode cadastrar demandas nos projetos que você lidera.'
                });
                return;
            }
        }

        // O responsavel e opcional. Sem responsavel a demanda fica sem dono.
        let responsavelId: string | null = null;
        if (responsavel !== undefined && responsavel !== null) {
            if (typeof responsavel !== 'string') {
                res.status(400).json({
                    erro: 'Responsável inválido',
                    mensagem: 'O responsável deve ser o nome de um usuário (texto).'
                });
                return;
            }

            let responsavelLimpo = responsavel.trim();
            if (responsavelLimpo !== '' && responsavelLimpo !== 'Não atribuído') {
                let usuarioEncontrado = await acharUsuario(responsavelLimpo);
                if (usuarioEncontrado === null) {
                    res.status(400).json({
                        erro: 'Responsável inválido',
                        mensagem: 'O responsável informado não está cadastrado. Consulte GET /usuarios.'
                    });
                    return;
                }
                responsavelId = String(usuarioEncontrado.ID);
            }
        }

        // O prazo e opcional, mas se vier tem que ser uma data valida
        // e nao pode cair em feriado nacional.
        let prazoFinal = '';
        if (prazo !== undefined && prazo !== null) {
            if (typeof prazo !== 'string') {
                res.status(400).json({
                    erro: 'Prazo inválido',
                    mensagem: 'O prazo deve ser uma data no formato AAAA-MM-DD (ex.: 2026-12-20).'
                });
                return;
            }

            prazoFinal = prazo.trim();
            if (prazoFinal !== '') {
                let erroDoPrazo = await validarPrazo(prazoFinal);
                if (erroDoPrazo !== '') {
                    res.status(400).json({
                        erro: 'Prazo inválido',
                        mensagem: erroDoPrazo
                    });
                    return;
                }
            }
        }

        // Id, status e datas saem do servidor. O que vier no corpo nesses
        // campos e simplesmente ignorado.
        let hoje = dataDeHoje();
        let idNovo = '';

        await emTransacao(async function (conexao: oracledb.Connection): Promise<void> {
            idNovo = await proximoIdNaConexao(conexao, 'DEMANDAS', 'DEM-');

            await executarNaConexao(
                conexao,
                'INSERT INTO DEMANDAS (ID, TITULO, DESCRICAO, TIPO, PRIORIDADE, STATUS, ' +
                'PROJETO_ID, RESPONSAVEL_ID, CRIADA_EM, ATUALIZADA_EM, PRAZO) ' +
                'VALUES (:id, :titulo, :descricao, :tipo, :prioridade, :status, ' +
                ':projetoId, :responsavelId, TO_DATE(:criadaEm, \'YYYY-MM-DD\'), ' +
                'TO_DATE(:atualizadaEm, \'YYYY-MM-DD\'), ' +
                'TO_DATE(:prazo, \'YYYY-MM-DD\'))',
                {
                    id: idNovo,
                    titulo: tituloLimpo,
                    descricao: descricaoLimpa,
                    tipo: tipo,
                    prioridade: prioridade,
                    status: 'Aberta',
                    projetoId: String(projetoEncontrado.ID),
                    responsavelId: responsavelId,
                    criadaEm: hoje,
                    atualizadaEm: hoje,
                    prazo: prazoFinal === '' ? null : prazoFinal
                }
            );

            // O historico registra a criacao da demanda
            await executarNaConexao(
                conexao,
                'INSERT INTO HISTORICO (DEMANDA_ID, USUARIO_ID, ACAO, CAMPO, VALOR_ANTERIOR, VALOR_NOVO) ' +
                'VALUES (:demandaId, :usuarioId, :acao, :campo, NULL, :valorNovo)',
                {
                    demandaId: idNovo,
                    usuarioId: usuario.id,
                    acao: 'Criação',
                    campo: 'Status',
                    valorNovo: 'Aberta'
                }
            );
        });

        // Busca a demanda recem-criada para devolver igual as outras rotas
        let linhas = await consultar(SELECT_DEMANDA + ' WHERE D.ID = :id', { id: idNovo });
        let novaDemanda: Demanda = montarDemanda(linhas[0]);

        res.status(201).json({
            mensagem: 'Demanda criada com sucesso.',
            demanda: novaDemanda
        });
    } catch (erro) {
        next(erro as Error);
    }
}

// GET /projetos - lista os projetos cadastrados
async function listarProjetos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        let linhas = await consultar(
            'SELECT P.ID, P.NOME, NVL(P.DESCRICAO, \' \') AS DESCRICAO, ' +
            'NVL(U.NOME, \'Sem líder\') AS LIDER ' +
            'FROM PROJETOS P LEFT JOIN USUARIOS U ON U.ID = P.LIDER_ID ' +
            'ORDER BY P.ID'
        );

        let projetos = [];
        for (let i = 0; i < linhas.length; i++) {
            projetos.push({
                id: String(linhas[i].ID || ''),
                nome: String(linhas[i].NOME || ''),
                descricao: String(linhas[i].DESCRICAO || '').trim(),
                lider: String(linhas[i].LIDER || '')
            });
        }

        res.status(200).json({
            total: projetos.length,
            projetos: projetos
        });
    } catch (erro) {
        next(erro as Error);
    }
}

rotas.post('/demandas', exigirLogin, criarDemanda);
rotas.get('/projetos', exigirLogin, listarProjetos);

export default rotas;
