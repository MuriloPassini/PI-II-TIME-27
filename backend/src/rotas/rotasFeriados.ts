// rotasFeriados.ts — PI2 / Time 27
// Autor: Matheus Schiavinato

// Rotas que expoem os feriados nacionais para as telas.
// Os dados vem da BrasilAPI (API publica externa), entao as telas
// conseguem avisar o usuario antes de salvar um prazo em feriado.

import express, { Request, Response, NextFunction } from 'express';

import { exigirLogin } from '../auth';
import { buscarFeriados, verificarFeriado } from '../feriados';
import { FORMATO_DATA, dataExiste } from '../utilidades';

const rotas = express.Router();

// GET /feriados?ano=2026 - lista os feriados nacionais do ano
async function listarFeriados(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        let anoPedido = String(req.query.ano || '');
        let ano = new Date().getFullYear();

        if (anoPedido !== '') {
            ano = Number(anoPedido);

            if (isNaN(ano) || ano < 1900 || ano > 2100) {
                res.status(400).json({
                    erro: 'Ano inválido',
                    mensagem: 'O ano deve ser um número entre 1900 e 2100.'
                });
                return;
            }
        }

        let lista = await buscarFeriados(ano);

        res.status(200).json({
            ano: ano,
            total: lista.length,
            feriados: lista
        });
    } catch (erro) {
        next(erro as Error);
    }
}

// GET /feriados/verificar?data=2026-12-25 - confere uma data
async function verificarData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        let data = String(req.query.data || '');

        if (FORMATO_DATA.test(data) === false || dataExiste(data) === false) {
            res.status(400).json({
                erro: 'Data inválida',
                mensagem: 'Informe a data no formato AAAA-MM-DD (ex.: 2026-12-25).'
            });
            return;
        }

        let feriado = await verificarFeriado(data);

        if (feriado === null) {
            res.status(200).json({
                data: data,
                feriado: false,
                nome: '',
                tipo: ''
            });
            return;
        }

        res.status(200).json({
            data: data,
            feriado: true,
            nome: feriado.nome,
            tipo: feriado.tipo
        });
    } catch (erro) {
        next(erro as Error);
    }
}

rotas.get('/feriados/verificar', exigirLogin, verificarData);
rotas.get('/feriados', exigirLogin, listarFeriados);

export default rotas;
