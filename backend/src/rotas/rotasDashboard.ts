// rotasDashboard.ts — PI2 / Time 27
// Autor: Filipe Sampaio

// Rota da tela do painel (02). Ela busca as demandas no Oracle
// (respeitando o perfil de quem esta logado) e monta os numeros
// que os cartoes e as listas do dashboard mostram.

import express, { Request, Response, NextFunction } from 'express';

import { consultar } from '../banco';
import { exigirLogin, condicaoDeVisibilidade } from '../auth';
import { Demanda, Usuario } from '../dados';
import {
    SELECT_DEMANDA,
    STATUS_VALIDOS,
    PRIORIDADES_VALIDAS,
    TIPOS_VALIDOS,
    dataDeHoje,
    somarDias,
    montarDemanda
} from '../utilidades';

const rotas = express.Router();

// GET /dashboard - resumo das demandas para o painel inicial
async function mostrarPainel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        let usuario = req.usuario as Usuario;
        let condicao = condicaoDeVisibilidade(usuario);

        let sql = SELECT_DEMANDA + ' WHERE 1 = 1' + condicao.texto + ' ORDER BY D.ID';
        let linhas = await consultar(sql, condicao.binds);

        let demandas: Demanda[] = [];
        for (let i = 0; i < linhas.length; i++) {
            demandas.push(montarDemanda(linhas[i]));
        }

        // Comeca todos os contadores em zero para o painel nunca
        // mostrar um status sem numero
        let porStatus: Record<string, number> = {};
        for (let i = 0; i < STATUS_VALIDOS.length; i++) {
            porStatus[STATUS_VALIDOS[i]] = 0;
        }

        let porPrioridade: Record<string, number> = {};
        for (let i = 0; i < PRIORIDADES_VALIDAS.length; i++) {
            porPrioridade[PRIORIDADES_VALIDAS[i]] = 0;
        }

        let porTipo: Record<string, number> = {};
        for (let i = 0; i < TIPOS_VALIDOS.length; i++) {
            porTipo[TIPOS_VALIDOS[i]] = 0;
        }

        let criticasEmAberto = 0;
        let criticas: Demanda[] = [];
        let proximasDoPrazo = 0;
        let proximas: Demanda[] = [];

        // A janela de prazo vai de hoje ate 7 dias pra frente (inclusive)
        let hoje = dataDeHoje();
        let limite = somarDias(hoje, 7);

        for (let i = 0; i < demandas.length; i++) {
            let demanda = demandas[i];

            porStatus[demanda.status] = porStatus[demanda.status] + 1;
            porPrioridade[demanda.prioridade] = porPrioridade[demanda.prioridade] + 1;
            porTipo[demanda.tipo] = porTipo[demanda.tipo] + 1;

            // Consideramos "em aberto" tudo que ainda nao foi concluido nem cancelado
            let emAberto = false;
            if (demanda.status === 'Aberta' || demanda.status === 'Em andamento' || demanda.status === 'Em revisão') {
                emAberto = true;
            }

            if (emAberto === true && demanda.prioridade === 'Crítica') {
                criticasEmAberto = criticasEmAberto + 1;
                criticas.push(demanda);
            }

            // Demandas em aberto com prazo chegando
            if (emAberto === true && demanda.prazo !== '') {
                if (demanda.prazo >= hoje && demanda.prazo <= limite) {
                    proximasDoPrazo = proximasDoPrazo + 1;
                    proximas.push(demanda);
                }
            }
        }

        // Coloca as listas em ordem de prazo (sem prazo vai para o final)
        proximas.sort(function (a: Demanda, b: Demanda): number {
            if (a.prazo === '' && b.prazo === '') {
                return 0;
            }
            if (a.prazo === '') {
                return 1;
            }
            if (b.prazo === '') {
                return -1;
            }
            if (a.prazo > b.prazo) {
                return 1;
            }
            if (a.prazo < b.prazo) {
                return -1;
            }
            return 0;
        });

        criticas.sort(function (a: Demanda, b: Demanda): number {
            if (a.prazo === '' && b.prazo === '') {
                return 0;
            }
            if (a.prazo === '') {
                return 1;
            }
            if (b.prazo === '') {
                return -1;
            }
            if (a.prazo > b.prazo) {
                return 1;
            }
            if (a.prazo < b.prazo) {
                return -1;
            }
            return 0;
        });

        res.status(200).json({
            total: demandas.length,
            porStatus: porStatus,
            porPrioridade: porPrioridade,
            porTipo: porTipo,
            criticasEmAberto: criticasEmAberto,
            criticas: criticas,
            proximasDoPrazo: proximasDoPrazo,
            proximas: proximas
        });
    } catch (erro) {
        next(erro as Error);
    }
}

rotas.get('/dashboard', exigirLogin, mostrarPainel);

export default rotas;
