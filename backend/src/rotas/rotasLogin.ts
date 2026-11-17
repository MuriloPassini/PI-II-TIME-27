// rotasLogin.ts — PI2 / Time 27
// Autor: Murilo Passini

// Rotas da tela de login (01) e da lista de usuarios.
// O login confere e-mail e senha na tabela USUARIOS e devolve um token.
// As telas guardam esse token e mandam ele em todas as rotas privadas.

import express, { Request, Response, NextFunction } from 'express';

import { consultar, executar } from '../banco';
import { criarSessao, exigirLogin } from '../auth';
import { montarUsuario } from '../utilidades';

const rotas = express.Router();

// POST /login - recebe e-mail e senha e devolve o usuario + token
async function fazerLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        let email = req.body.email;
        let senha = req.body.senha;

        if (typeof email !== 'string' || typeof senha !== 'string' || email.trim() === '' || senha === '') {
            res.status(400).json({
                erro: 'Dados incompletos',
                mensagem: 'Informe o e-mail e a senha para entrar.'
            });
            return;
        }

        let emailLimpo = email.trim();
        let formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (formatoEmail.test(emailLimpo) === false) {
            res.status(400).json({
                erro: 'E-mail inválido',
                mensagem: 'Informe um e-mail no formato correto (ex.: nome@fluxo.com).'
            });
            return;
        }

        let linhas = await consultar(
            'SELECT ID, NOME, EMAIL, PERFIL FROM USUARIOS ' +
            'WHERE LOWER(EMAIL) = LOWER(:email) AND SENHA = :senha',
            { email: emailLimpo, senha: senha }
        );

        if (linhas.length === 0) {
            res.status(401).json({
                erro: 'Credenciais inválidas',
                mensagem: 'E-mail ou senha incorretos.'
            });
            return;
        }

        let usuario = montarUsuario(linhas[0]);
        let sessao = await criarSessao(usuario.id);

        res.status(200).json({
            mensagem: 'Login realizado com sucesso.',
            token: sessao.token,
            expiraEm: sessao.expiraEm,
            usuario: usuario
        });
    } catch (erro) {
        next(erro as Error);
    }
}

// GET /sessao - confere se o token ainda vale e devolve o usuario logado
function mostrarSessao(req: Request, res: Response): void {
    res.status(200).json({
        mensagem: 'Sessão válida.',
        usuario: req.usuario
    });
}

// POST /logout - apaga o token da tabela SESSOES
async function fazerLogout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        await executar('DELETE FROM SESSOES WHERE TOKEN = :token', { token: req.token });
        res.status(200).json({ mensagem: 'Sessão encerrada com sucesso.' });
    } catch (erro) {
        next(erro as Error);
    }
}

// GET /usuarios - lista os usuarios cadastrados (sem a senha)
async function listarUsuarios(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        let linhas = await consultar('SELECT ID, NOME, EMAIL, PERFIL FROM USUARIOS ORDER BY NOME');
        let lista = [];

        for (let i = 0; i < linhas.length; i++) {
            lista.push(montarUsuario(linhas[i]));
        }

        res.status(200).json({
            total: lista.length,
            usuarios: lista
        });
    } catch (erro) {
        next(erro as Error);
    }
}

rotas.post('/login', fazerLogin);
rotas.post('/logout', exigirLogin, fazerLogout);
rotas.get('/sessao', exigirLogin, mostrarSessao);
rotas.get('/usuarios', exigirLogin, listarUsuarios);

export default rotas;
