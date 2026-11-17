// rotasDetalhes.ts — PI2 / Time 27
// Autor: Nicholas de Castro

// Rotas da tela de detalhes da demanda (06).
// Uma rota devolve a demanda pelo id, outra os comentarios e outra
// o historico de alteracoes. So enxerga a demanda quem tem permissao.

import express, { Request, Response, NextFunction } from 'express';

import { consultar } from '../banco';
import { exigirLogin, condicaoDeVisibilidade } from '../auth';
import { Comentario, Demanda, Historico, Usuario } from '../dados';
import { SELECT_DEMANDA, montarDemanda } from '../utilidades';

const rotas = express.Router();

// Busca a demanda respeitando a visibilidade do perfil.
// Devolve null quando ela nao existe ou nao pode ser vista.
async function buscarDemandaVisivel(usuario: Usuario, id: string): Promise<Demanda | null> {
    let condicao = condicaoDeVisibilidade(usuario);
    let binds: Record<string, string> = { id: id };

    for (let chave in condicao.binds) {
        binds[chave] = condicao.binds[chave];
    }

    let sql = SELECT_DEMANDA + ' WHERE D.ID = :id' + condicao.texto;
    let linhas = await consultar(sql, binds);

    if (linhas.length === 0) {
        return null;
    }

    return montarDemanda(linhas[0]);
}

// GET /demandas/:id - devolve uma demanda pelo id
async function mostrarDemanda(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        let usuario = req.usuario as Usuario;
        let idPedido = String(req.params.id || '');
        let demanda = await buscarDemandaVisivel(usuario, idPedido);

        if (demanda === null) {
            res.status(404).json({
                erro: 'Demanda não encontrada',
                mensagem: 'Não existe demanda com o id ' + idPedido + ' para o seu perfil.'
            });
            return;
        }

        res.status(200).json({
            mensagem: 'Demanda encontrada.',
            demanda: demanda
        });
    } catch (erro) {
        next(erro as Error);
    }
}

// GET /demandas/:id/comentarios - devolve os comentarios da demanda
async function listarComentarios(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        let usuario = req.usuario as Usuario;
        let idPedido = String(req.params.id || '');
        let demanda = await buscarDemandaVisivel(usuario, idPedido);

        if (demanda === null) {
            res.status(404).json({
                erro: 'Demanda não encontrada',
                mensagem: 'Não existe demanda com o id ' + idPedido + ' para o seu perfil.'
            });
            return;
        }

        let linhas = await consultar(
            'SELECT C.ID, C.DEMANDA_ID, U.NOME AS AUTOR, C.TEXTO, ' +
            'TO_CHAR(C.DATA, \'YYYY-MM-DD HH24:MI:SS\') AS DATA ' +
            'FROM COMENTARIOS C JOIN USUARIOS U ON U.ID = C.AUTOR_ID ' +
            'WHERE C.DEMANDA_ID = :demandaId ORDER BY C.DATA, C.ID',
            { demandaId: idPedido }
        );

        let lista: Comentario[] = [];
        for (let i = 0; i < linhas.length; i++) {
            lista.push({
                id: String(linhas[i].ID || ''),
                demandaId: String(linhas[i].DEMANDA_ID || ''),
                autor: String(linhas[i].AUTOR || ''),
                texto: String(linhas[i].TEXTO || ''),
                data: String(linhas[i].DATA || '')
            });
        }

        res.status(200).json({
            total: lista.length,
            comentarios: lista
        });
    } catch (erro) {
        next(erro as Error);
    }
}

// GET /demandas/:id/historico - devolve o historico da demanda
// (do mais recente para o mais antigo)
async function listarHistorico(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        let usuario = req.usuario as Usuario;
        let idPedido = String(req.params.id || '');
        let demanda = await buscarDemandaVisivel(usuario, idPedido);

        if (demanda === null) {
            res.status(404).json({
                erro: 'Demanda não encontrada',
                mensagem: 'Não existe demanda com o id ' + idPedido + ' para o seu perfil.'
            });
            return;
        }

        let linhas = await consultar(
            'SELECT H.ID, H.DEMANDA_ID, U.NOME AS USUARIO, H.ACAO, ' +
            'NVL(H.CAMPO, \' \') AS CAMPO, NVL(H.VALOR_ANTERIOR, \' \') AS VALOR_ANTERIOR, ' +
            'NVL(H.VALOR_NOVO, \' \') AS VALOR_NOVO, NVL(H.OBSERVACAO, \' \') AS OBSERVACAO, ' +
            'TO_CHAR(H.DATA, \'YYYY-MM-DD HH24:MI:SS\') AS DATA ' +
            'FROM HISTORICO H JOIN USUARIOS U ON U.ID = H.USUARIO_ID ' +
            'WHERE H.DEMANDA_ID = :demandaId ORDER BY H.DATA DESC, H.ID DESC',
            { demandaId: idPedido }
        );

        let lista: Historico[] = [];
        for (let i = 0; i < linhas.length; i++) {
            lista.push({
                id: Number(linhas[i].ID),
                demandaId: String(linhas[i].DEMANDA_ID || ''),
                usuario: String(linhas[i].USUARIO || ''),
                acao: String(linhas[i].ACAO || ''),
                campo: String(linhas[i].CAMPO || '').trim(),
                valorAnterior: String(linhas[i].VALOR_ANTERIOR || '').trim(),
                valorNovo: String(linhas[i].VALOR_NOVO || '').trim(),
                observacao: String(linhas[i].OBSERVACAO || '').trim(),
                data: String(linhas[i].DATA || '')
            });
        }

        res.status(200).json({
            total: lista.length,
            historico: lista
        });
    } catch (erro) {
        next(erro as Error);
    }
}

rotas.get('/demandas/:id', exigirLogin, mostrarDemanda);
rotas.get('/demandas/:id/comentarios', exigirLogin, listarComentarios);
rotas.get('/demandas/:id/historico', exigirLogin, listarHistorico);

export default rotas;
