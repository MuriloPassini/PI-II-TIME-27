// feriados.ts — PI2 / Time 27
// Autor: Matheus Schiavinato

// Consulta os feriados nacionais na BrasilAPI (API publica externa).
// O cadastro e a edicao de demanda usam esta consulta para impedir
// que o prazo de finalizacao caia em um feriado nacional.
// A resposta fica guardada na memoria do servidor para nao chamar
// a API externa toda hora.

import { Feriado } from './dados';

const URL_BASE = 'https://brasilapi.com.br/api/feriados/v1/';

// Guarda os feriados de cada ano ja consultado
let cache: Record<string, Feriado[]> = {};

// Busca os feriados de um ano (ou devolve do cache)
export async function buscarFeriados(ano: number): Promise<Feriado[]> {
    let chave = '' + ano;

    if (cache[chave] !== undefined) {
        return cache[chave];
    }

    let resposta = await fetch(URL_BASE + ano, { signal: AbortSignal.timeout(8000) });

    if (resposta.ok === false) {
        throw new Error('A API de feriados respondeu com o status ' + resposta.status + '.');
    }

    let dados: any = await resposta.json();
    let lista: Feriado[] = [];

    for (let i = 0; i < dados.length; i++) {
        lista.push({
            data: String(dados[i].date || ''),
            nome: String(dados[i].name || ''),
            tipo: String(dados[i].type || '')
        });
    }

    cache[chave] = lista;
    return lista;
}

// Procura um feriado em uma data (AAAA-MM-DD). Devolve null se nao for feriado.
export async function verificarFeriado(data: string): Promise<Feriado | null> {
    let ano = Number(data.substring(0, 4));
    let lista = await buscarFeriados(ano);

    for (let i = 0; i < lista.length; i++) {
        if (lista[i].data === data) {
            return lista[i];
        }
    }

    return null;
}
