// rotasDemandas.ts — PI2 / Time 27
// Autor: Pietro Granzotti

// Rota da tela de listagem de demandas (03).
// Da para filtrar por status, prioridade, tipo, responsavel e projeto,
// buscar por texto no titulo/descricao e escolher a ordenacao.
// Tudo e filtrado direto no Oracle e respeitando o perfil do usuario.

import express, { Request, Response, NextFunction } from 'express';

import { consultar } from '../banco';
import { exigirLogin, condicaoDeVisibilidade } from '../auth';
import { Demanda, Usuario } from '../dados';
import {
    SELECT_DEMANDA,
    STATUS_VALIDOS,
    PRIORIDADES_VALIDAS,
    TIPOS_VALIDOS,
    montarDemanda
} from '../utilidades';

const rotas = express.Router();

const ORDENACOES_VALIDAS = ['prioridade', 'criacao', 'prazo', 'status', 'titulo'];

// Devolve o trecho de ORDER BY da ordenacao escolhida.
// Quando nao vem ordenacao, a lista sai na ordem do id.
function montarOrdenacao(ordenarPedido: string): string {
    if (ordenarPedido === 'prioridade') {
        return ' ORDER BY CASE D.PRIORIDADE ' +
            "WHEN 'Crítica' THEN 1 WHEN 'Alta' THEN 2 WHEN 'Média' THEN 3 ELSE 4 END, D.ID";
    }

    if (ordenarPedido === 'criacao') {
        return ' ORDER BY D.CRIADA_EM DESC, D.ID DESC';
    }

    if (ordenarPedido === 'prazo') {
        return ' ORDER BY D.PRAZO NULLS LAST, D.ID';
    }

    if (ordenarPedido === 'status') {
        return ' ORDER BY CASE D.STATUS ' +
            "WHEN 'Aberta' THEN 1 WHEN 'Em andamento' THEN 2 WHEN 'Em revisão' THEN 3 " +
            "WHEN 'Concluída' THEN 4 ELSE 5 END, D.ID";
    }

    if (ordenarPedido === 'titulo') {
        return ' ORDER BY LOWER(D.TITULO), D.ID';
    }

    return ' ORDER BY D.ID';
}

// GET /demandas - lista as demandas com filtros, busca e ordenacao
async function listarDemandas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        let usuario = req.usuario as Usuario;

        let statusPedido = String(req.query.status || '');
        let prioridadePedido = String(req.query.prioridade || '');
        let tipoPedido = String(req.query.tipo || '');
        let responsavelPedido = String(req.query.responsavel || '');
        let projetoPedido = String(req.query.projeto || '');
        let buscaPedido = String(req.query.busca || '');
        let ordenarPedido = String(req.query.ordenar || '');

        // Primeiro conferimos se os valores dos filtros existem
        if (statusPedido !== '' && STATUS_VALIDOS.indexOf(statusPedido) === -1) {
            res.status(400).json({
                erro: 'Filtro inválido',
                mensagem: 'O status informado não existe. Valores possíveis: ' + STATUS_VALIDOS.join(', ') + '.'
            });
            return;
        }

        if (prioridadePedido !== '' && PRIORIDADES_VALIDAS.indexOf(prioridadePedido) === -1) {
            res.status(400).json({
                erro: 'Filtro inválido',
                mensagem: 'A prioridade informada não existe. Valores possíveis: ' + PRIORIDADES_VALIDAS.join(', ') + '.'
            });
            return;
        }

        if (tipoPedido !== '' && TIPOS_VALIDOS.indexOf(tipoPedido) === -1) {
            res.status(400).json({
                erro: 'Filtro inválido',
                mensagem: 'O tipo informado não existe. Valores possíveis: ' + TIPOS_VALIDOS.join(', ') + '.'
            });
            return;
        }

        if (responsavelPedido !== '' && responsavelPedido !== 'Não atribuído') {
            let linhasDoResponsavel = await consultar(
                'SELECT ID FROM USUARIOS WHERE NOME = :nome',
                { nome: responsavelPedido }
            );

            if (linhasDoResponsavel.length === 0) {
                res.status(400).json({
                    erro: 'Filtro inválido',
                    mensagem: 'O responsável informado não está cadastrado. Consulte GET /usuarios.'
                });
                return;
            }
        }

        if (projetoPedido !== '') {
            let linhasDoProjeto = await consultar(
                'SELECT ID FROM PROJETOS WHERE NOME = :nome',
                { nome: projetoPedido }
            );

            if (linhasDoProjeto.length === 0) {
                res.status(400).json({
                    erro: 'Filtro inválido',
                    mensagem: 'O projeto informado não existe. Consulte GET /projetos.'
                });
                return;
            }
        }

        if (ordenarPedido !== '' && ORDENACOES_VALIDAS.indexOf(ordenarPedido) === -1) {
            res.status(400).json({
                erro: 'Ordenação inválida',
                mensagem: 'A ordenação informada não existe. Valores possíveis: ' + ORDENACOES_VALIDAS.join(', ') + '.'
            });
            return;
        }

        // Monta o WHERE com os filtros recebidos (e com a visibilidade do perfil)
        let condicao = condicaoDeVisibilidade(usuario);
        let where = ' WHERE 1 = 1' + condicao.texto;
        let binds: Record<string, string> = {};

        for (let chave in condicao.binds) {
            binds[chave] = condicao.binds[chave];
        }

        if (statusPedido !== '') {
            where = where + ' AND D.STATUS = :status';
            binds.status = statusPedido;
        }

        if (prioridadePedido !== '') {
            where = where + ' AND D.PRIORIDADE = :prioridade';
            binds.prioridade = prioridadePedido;
        }

        if (tipoPedido !== '') {
            where = where + ' AND D.TIPO = :tipo';
            binds.tipo = tipoPedido;
        }

        if (responsavelPedido === 'Não atribuído') {
            where = where + ' AND D.RESPONSAVEL_ID IS NULL';
        } else if (responsavelPedido !== '') {
            where = where + ' AND U.NOME = :responsavel';
            binds.responsavel = responsavelPedido;
        }

        if (projetoPedido !== '') {
            where = where + ' AND P.NOME = :projeto';
            binds.projeto = projetoPedido;
        }

        // A busca olha o titulo e a descricao da demanda
        if (buscaPedido !== '') {
            where = where + ' AND (LOWER(D.TITULO) LIKE :busca OR LOWER(D.DESCRICAO) LIKE :busca)';
            binds.busca = '%' + buscaPedido.toLowerCase() + '%';
        }

        let sql = SELECT_DEMANDA + where + montarOrdenacao(ordenarPedido);
        let linhas = await consultar(sql, binds);

        let lista: Demanda[] = [];
        for (let i = 0; i < linhas.length; i++) {
            lista.push(montarDemanda(linhas[i]));
        }

        res.status(200).json({
            total: lista.length,
            demandas: lista
        });
    } catch (erro) {
        next(erro as Error);
    }
}

rotas.get('/demandas', exigirLogin, listarDemandas);

export default rotas;
