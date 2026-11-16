// rotasComentarios.ts — PI2 / Time 27
// Autor: Matheus Schiavinato

// Rota do formulario de comentarios da tela de detalhes (06).
// O autor do comentario e o usuario do token (nao vem do corpo),
// e a data e a hora saem do servidor.

import express, { Request, Response, NextFunction } from 'express';
import oracledb from 'oracledb';

import { consultar, emTransacao, executarNaConexao, proximoIdNaConexao } from '../banco';
import { exigirLogin, condicaoDeVisibilidade } from '../auth';
import { Comentario, Usuario } from '../dados';

const rotas = express.Router();

// POST /demandas/:id/comentarios - adiciona um comentario na demanda
async function adicionarComentario(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        let usuario = req.usuario as Usuario;
        let idPedido = String(req.params.id || '');
        let corpo = req.body || {};
        let texto = corpo.texto;

        // Confere se a demanda existe e se o usuario pode ve-la
        let condicao = condicaoDeVisibilidade(usuario);
        let bindsDaDemanda: Record<string, string> = { demandaId: idPedido };

        for (let chave in condicao.binds) {
            bindsDaDemanda[chave] = condicao.binds[chave];
        }

        let linhasDaDemanda = await consultar(
            'SELECT D.ID FROM DEMANDAS D JOIN PROJETOS P ON P.ID = D.PROJETO_ID ' +
            'WHERE D.ID = :demandaId' + condicao.texto,
            bindsDaDemanda
        );

        if (linhasDaDemanda.length === 0) {
            res.status(404).json({
                erro: 'Demanda não encontrada',
                mensagem: 'Não existe demanda com o id ' + idPedido + ' para o seu perfil.'
            });
            return;
        }

        if (typeof texto !== 'string') {
            res.status(400).json({
                erro: 'Dados incompletos',
                mensagem: 'Informe o texto do comentário.'
            });
            return;
        }

        let textoLimpo = texto.trim();

        if (textoLimpo.length < 3 || textoLimpo.length > 500) {
            res.status(400).json({
                erro: 'Texto inválido',
                mensagem: 'O comentário deve ter entre 3 e 500 caracteres.'
            });
            return;
        }

        let idNovo = '';

        await emTransacao(async function (conexao: oracledb.Connection): Promise<void> {
            idNovo = await proximoIdNaConexao(conexao, 'COMENTARIOS', 'COM-');

            await executarNaConexao(
                conexao,
                'INSERT INTO COMENTARIOS (ID, DEMANDA_ID, AUTOR_ID, TEXTO) ' +
                'VALUES (:id, :demandaId, :autorId, :texto)',
                {
                    id: idNovo,
                    demandaId: idPedido,
                    autorId: usuario.id,
                    texto: textoLimpo
                }
            );
        });

        let linhas = await consultar(
            'SELECT C.ID, C.DEMANDA_ID, U.NOME AS AUTOR, C.TEXTO, ' +
            'TO_CHAR(C.DATA, \'YYYY-MM-DD HH24:MI:SS\') AS DATA ' +
            'FROM COMENTARIOS C JOIN USUARIOS U ON U.ID = C.AUTOR_ID ' +
            'WHERE C.ID = :id',
            { id: idNovo }
        );

        let novoComentario: Comentario = {
            id: String(linhas[0].ID || ''),
            demandaId: String(linhas[0].DEMANDA_ID || ''),
            autor: String(linhas[0].AUTOR || ''),
            texto: String(linhas[0].TEXTO || ''),
            data: String(linhas[0].DATA || '')
        };

        res.status(201).json({
            mensagem: 'Comentário adicionado com sucesso.',
            comentario: novoComentario
        });
    } catch (erro) {
        next(erro as Error);
    }
}

rotas.post('/demandas/:id/comentarios', exigirLogin, adicionarComentario);

export default rotas;
