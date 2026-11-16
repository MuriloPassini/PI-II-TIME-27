// auth.ts — PI2 / Time 27
// Autor: Murilo Passini

// Cuida do login com token. Quando o usuario entra, o servidor cria um
// token aleatorio e guarda na tabela SESSOES. As telas mandam esse token
// no cabecalho Authorization: Bearer <token> em todas as rotas privadas.
// Tambem ficam aqui as regras de permissao dos tres perfis.

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

import { consultar, executar } from './banco';
import { Usuario } from './dados';
import { montarUsuario } from './utilidades';

// Nomes dos perfis iguais aos que estao gravados no banco
export const PERFIL_ADMINISTRADOR = 'Administrador';
export const PERFIL_LIDER = 'Líder de Projeto';
export const PERFIL_MEMBRO = 'Membro da Equipe';

// O token vale por 8 horas
const HORAS_DE_SESSAO = 8;

// Deixa o usuario logado disponivel dentro das rotas (req.usuario)
declare global {
    namespace Express {
        interface Request {
            usuario?: Usuario;
            token?: string;
        }
    }
}

export interface SessaoCriada {
    token: string;
    expiraEm: string;
}

// Cria uma sessao nova para o usuario que acabou de logar
export async function criarSessao(usuarioId: string): Promise<SessaoCriada> {
    let token = crypto.randomBytes(24).toString('hex');
    let expiraEm = new Date(Date.now() + HORAS_DE_SESSAO * 60 * 60 * 1000);

    // Limpa sessoes vencidas antes de gravar a nova
    await executar('DELETE FROM SESSOES WHERE EXPIRA_EM <= SYSTIMESTAMP');

    await executar(
        'INSERT INTO SESSOES (TOKEN, USUARIO_ID, CRIADA_EM, EXPIRA_EM) ' +
        'VALUES (:token, :usuarioId, SYSTIMESTAMP, SYSTIMESTAMP + INTERVAL \'' + HORAS_DE_SESSAO + '\' HOUR)',
        { token: token, usuarioId: usuarioId }
    );

    return { token: token, expiraEm: expiraEm.toISOString() };
}

// Middleware: deixa passar so quem mandou um token valido
export async function exigirLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        let cabecalho = req.headers.authorization || '';

        if (cabecalho.indexOf('Bearer ') !== 0) {
            res.status(401).json({
                erro: 'Não autenticado',
                mensagem: 'Faça login para acessar este recurso.'
            });
            return;
        }

        let token = cabecalho.substring(7).trim();

        if (token === '') {
            res.status(401).json({
                erro: 'Não autenticado',
                mensagem: 'Faça login para acessar este recurso.'
            });
            return;
        }

        let linhas = await consultar(
            'SELECT U.ID, U.NOME, U.EMAIL, U.PERFIL ' +
            'FROM SESSOES S JOIN USUARIOS U ON U.ID = S.USUARIO_ID ' +
            'WHERE S.TOKEN = :token AND S.EXPIRA_EM > SYSTIMESTAMP',
            { token: token }
        );

        if (linhas.length === 0) {
            res.status(401).json({
                erro: 'Sessão inválida',
                mensagem: 'Sua sessão expirou ou o token é inválido. Faça login novamente.'
            });
            return;
        }

        req.usuario = montarUsuario(linhas[0]);
        req.token = token;
        next();
    } catch (erro) {
        next(erro as Error);
    }
}

// Devolve o pedaco de SQL que limita o que cada perfil pode ver.
// Administrador ve tudo; lider ve os projetos que lidera e as demandas
// atribuidas a ele; membro ve apenas as demandas atribuidas a ele.
export function condicaoDeVisibilidade(usuario: Usuario): { texto: string; binds: Record<string, string> } {
    if (usuario.perfil === PERFIL_ADMINISTRADOR) {
        return { texto: '', binds: {} };
    }

    if (usuario.perfil === PERFIL_LIDER) {
        return {
            texto: ' AND (D.RESPONSAVEL_ID = :usuarioLogado OR P.LIDER_ID = :usuarioLogado)',
            binds: { usuarioLogado: usuario.id }
        };
    }

    return {
        texto: ' AND D.RESPONSAVEL_ID = :usuarioLogado',
        binds: { usuarioLogado: usuario.id }
    };
}

// Confere se o usuario pode ver uma demanda especifica
export async function podeVerDemanda(usuario: Usuario, demandaId: string): Promise<boolean> {
    if (usuario.perfil === PERFIL_ADMINISTRADOR) {
        let linhas = await consultar('SELECT ID FROM DEMANDAS WHERE ID = :id', { id: demandaId });
        return linhas.length > 0;
    }

    let condicao = condicaoDeVisibilidade(usuario);
    let linhas = await consultar(
        'SELECT D.ID FROM DEMANDAS D JOIN PROJETOS P ON P.ID = D.PROJETO_ID ' +
        'WHERE D.ID = :demandaId' + condicao.texto,
        { demandaId: demandaId, usuarioLogado: usuario.id }
    );

    return linhas.length > 0;
}

// Confere se o usuario pode editar, mudar status ou cancelar a demanda.
// Membro da equipe nao gerencia demanda (so avanca o status da propria).
export async function podeGerenciarDemanda(usuario: Usuario, demandaId: string): Promise<boolean> {
    if (usuario.perfil === PERFIL_ADMINISTRADOR) {
        return true;
    }

    if (usuario.perfil !== PERFIL_LIDER) {
        return false;
    }

    let linhas = await consultar(
        'SELECT D.ID FROM DEMANDAS D JOIN PROJETOS P ON P.ID = D.PROJETO_ID ' +
        'WHERE D.ID = :demandaId AND P.LIDER_ID = :usuarioId',
        { demandaId: demandaId, usuarioId: usuario.id }
    );

    return linhas.length > 0;
}

// Confere se o usuario lidera um projeto especifico
export async function lideraProjeto(usuario: Usuario, projetoId: string): Promise<boolean> {
    let linhas = await consultar(
        'SELECT ID FROM PROJETOS WHERE ID = :projetoId AND LIDER_ID = :usuarioId',
        { projetoId: projetoId, usuarioId: usuario.id }
    );
    return linhas.length > 0;
}

// Administrador e lider podem criar demanda
export function podeCriarDemanda(usuario: Usuario): boolean {
    if (usuario.perfil === PERFIL_ADMINISTRADOR) {
        return true;
    }
    if (usuario.perfil === PERFIL_LIDER) {
        return true;
    }
    return false;
}
