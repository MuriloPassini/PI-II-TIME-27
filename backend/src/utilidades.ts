// utilidades.ts — PI2 / Time 27
// Autor: Murilo Passini

// Funcoes e constantes que mais de uma rota usa. A ideia e nao repetir
// a mesma validacao ou o mesmo SELECT em varios arquivos.

import { Demanda, Usuario } from './dados';

// Valores aceitos no sistema (iguais aos do Documento de Visao)
export const STATUS_VALIDOS = ['Aberta', 'Em andamento', 'Em revisão', 'Concluída', 'Cancelada'];
export const PRIORIDADES_VALIDAS = ['Crítica', 'Alta', 'Média', 'Baixa'];
export const TIPOS_VALIDOS = ['Tarefa', 'Defeito', 'Melhoria', 'Documentação'];

// Ordem usada nas ordenacoes e nos indicadores
export const ORDEM_DOS_STATUS = ['Aberta', 'Em andamento', 'Em revisão', 'Concluída', 'Cancelada'];
export const ORDEM_DAS_PRIORIDADES = ['Crítica', 'Alta', 'Média', 'Baixa'];

// Formato de data usado nas telas e na API
export const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;

// SELECT base das demandas. Ele ja junta o projeto e o responsavel
// para a API devolver os nomes (e nao apenas os ids das tabelas).
// Quem usar este SELECT so precisa acrescentar WHERE e ORDER BY.
export const SELECT_DEMANDA =
    'SELECT D.ID, D.TITULO, D.DESCRICAO, D.TIPO, D.PRIORIDADE, D.STATUS, ' +
    'P.NOME AS PROJETO, NVL(U.NOME, \'Não atribuído\') AS RESPONSAVEL, ' +
    'TO_CHAR(D.CRIADA_EM, \'YYYY-MM-DD\') AS CRIADA_EM, ' +
    'TO_CHAR(D.ATUALIZADA_EM, \'YYYY-MM-DD\') AS ATUALIZADA_EM, ' +
    'TO_CHAR(D.PRAZO, \'YYYY-MM-DD\') AS PRAZO, ' +
    'NVL(D.MOTIVO_CANCELAMENTO, \' \') AS MOTIVO_CANCELAMENTO, ' +
    'NVL(C.NOME, \' \') AS CANCELADA_POR, ' +
    'TO_CHAR(D.CANCELADA_EM, \'YYYY-MM-DD HH24:MI:SS\') AS CANCELADA_EM ' +
    'FROM DEMANDAS D ' +
    'JOIN PROJETOS P ON P.ID = D.PROJETO_ID ' +
    'LEFT JOIN USUARIOS U ON U.ID = D.RESPONSAVEL_ID ' +
    'LEFT JOIN USUARIOS C ON C.ID = D.CANCELADA_POR';

// Coloca um zero na frente dos numeros de um digito so
export function doisDigitos(numero: number): string {
    if (numero < 10) {
        return '0' + numero;
    }
    return '' + numero;
}

// Devolve a data de hoje no formato AAAA-MM-DD
export function dataDeHoje(): string {
    let hoje = new Date();
    return hoje.getFullYear() + '-' + doisDigitos(hoje.getMonth() + 1) + '-' + doisDigitos(hoje.getDate());
}

// Soma (ou subtrai) dias em uma data AAAA-MM-DD e devolve outra data AAAA-MM-DD
export function somarDias(data: string, dias: number): string {
    let partes = data.split('-');
    let resultado = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    resultado.setDate(resultado.getDate() + dias);

    return resultado.getFullYear() + '-' + doisDigitos(resultado.getMonth() + 1) + '-' + doisDigitos(resultado.getDate());
}

// Confere se a data existe de verdade (2026-02-31, por exemplo, nao existe)
export function dataExiste(data: string): boolean {
    let partes = data.split('-');
    let ano = Number(partes[0]);
    let mes = Number(partes[1]);
    let dia = Number(partes[2]);

    let dataTeste = new Date(ano, mes - 1, dia);

    if (dataTeste.getFullYear() !== ano || dataTeste.getMonth() !== mes - 1 || dataTeste.getDate() !== dia) {
        return false;
    }
    return true;
}

// Devolve o texto sem espacos nas pontas, ou vazio se nao for texto
export function textoLimpo(valor: unknown): string {
    if (typeof valor !== 'string') {
        return '';
    }
    return valor.trim();
}

// Transforma uma linha do Oracle em um objeto Demanda com os nomes
// de campos que as telas ja conhecem (camelCase).
export function montarDemanda(linha: any): Demanda {
    let demanda: Demanda = {
        id: String(linha.ID || ''),
        titulo: String(linha.TITULO || ''),
        descricao: String(linha.DESCRICAO || ''),
        tipo: String(linha.TIPO || ''),
        prioridade: String(linha.PRIORIDADE || ''),
        status: String(linha.STATUS || ''),
        projeto: String(linha.PROJETO || ''),
        responsavel: String(linha.RESPONSAVEL || ''),
        criadaEm: String(linha.CRIADA_EM || ''),
        atualizadaEm: String(linha.ATUALIZADA_EM || ''),
        prazo: String(linha.PRAZO || ''),
        motivoCancelamento: String(linha.MOTIVO_CANCELAMENTO || '').trim(),
        canceladaPor: String(linha.CANCELADA_POR || '').trim(),
        canceladaEm: String(linha.CANCELADA_EM || '').trim()
    };
    return demanda;
}

// Transforma uma linha da tabela USUARIOS em objeto (sem a senha)
export function montarUsuario(linha: any): Usuario {
    let usuario: Usuario = {
        id: String(linha.ID || ''),
        nome: String(linha.NOME || ''),
        email: String(linha.EMAIL || ''),
        perfil: String(linha.PERFIL || '')
    };
    return usuario;
}
